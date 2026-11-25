import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { StepUpGuard } from "../auth/step-up.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { SmsAccountsService } from "./sms-accounts.service";
import { SmsOutboxService } from "./sms-outbox.service";
import { SmsMonitoringService } from "./sms-monitoring.service";
import { SmsReconcileService } from "./sms-reconcile.service";
import { SmsControlService } from "./sms-control.service";
import { SmsRetentionService } from "./sms-retention.service";
import { ComplianceService } from "./compliance.service";
import { ConsentService } from "./consent.service";
import { FraudService } from "./fraud.service";
import { PrismaService } from "../database/prisma.service";
import { DcgEnabledGuard } from "./dcg-enabled.guard";

const actor = (req: any) => ({ userId: req.user.userId as string, ip: req.ip as string, userAgent: req.headers["user-agent"] as string });

/**
 * Communications Center API.
 *
 * Reads (history, analytics, audit, webhook config, account list) need ADMIN_VIEW_MESSAGING:
 * support staff and superadmins. Anything that changes provider accounts, credentials, senders
 * or spending needs ADMIN_MANAGE_MESSAGING (superadmin only) AND a fresh MFA step-up
 * (`X-Step-Up-Token` from POST /api/auth/step-up). No endpoint ever returns a credential.
 */
@Controller("admin/sms")
@UseGuards(DcgEnabledGuard, JwtAuthGuard, PermissionsGuard)
export class SmsAdminController {
  constructor(
    private accounts: SmsAccountsService,
    private outbox: SmsOutboxService,
    private monitoring: SmsMonitoringService,
    private reconciler: SmsReconcileService,
    private control: SmsControlService,
    private retention: SmsRetentionService,
    private compliance: ComplianceService,
    private consent: ConsentService,
    private fraud: FraudService,
    private prisma: PrismaService,
  ) {}

  // ---- read (staff + superadmin) ----

  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Get("accounts")
  async list() {
    return { accounts: await this.accounts.list() };
  }

  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Get("messages")
  history(@Query("state") state?: string, @Query("limit") limit?: string, @Query("before") before?: string) {
    return this.accounts.history({ state, limit: limit ? Number(limit) : undefined, before });
  }

  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Get("analytics")
  analytics(@Query("days") days?: string) {
    return this.accounts.analytics(days ? Number(days) : 7);
  }

  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Get("audit")
  audit(@Query("limit") limit?: string) {
    return this.accounts.auditTrail(limit ? Number(limit) : 100);
  }

  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Get("webhook-config")
  webhookConfig() {
    return this.accounts.webhookConfig();
  }

  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Get("health")
  health() {
    return this.monitoring.snapshot();
  }

  /** Communications alerts (SecurityAlert pipeline). Acknowledge/resolve with the existing security-alert endpoints. */
  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Get("alerts")
  async alerts(@Query("status") status?: string) {
    const items = await this.prisma.securityAlert.findMany({
      where: { ruleId: { startsWith: "SMS_" }, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, ruleId: true, severity: true, summary: true, status: true, createdAt: true, acknowledgedAt: true, resolvedAt: true, notes: true },
    });
    return { items };
  }

  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Get("risk-events")
  async riskEvents(@Query("status") status?: string) {
    return { items: await this.fraud.list(status) };
  }

  /** Authorized staff may review fraud incidents; thresholds themselves are configuration (deploy-time). */
  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Post("risk-events/:id/review")
  reviewRisk(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: { decision?: string }) {
    if (body?.decision !== "confirmed" && body?.decision !== "dismissed") throw new NotFoundException("decision must be confirmed or dismissed");
    return this.fraud.review(id, body.decision, req.user.userId);
  }

  /** POST so the number never appears in a URL or access log. Returns masked history only. */
  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Post("consent/lookup")
  consentLookup(@Body() body: { phone?: string }) {
    if (!body?.phone || !/^\+[1-9]\d{7,14}$/.test(body.phone)) throw new NotFoundException("phone must be in international format");
    return this.consent.history(body.phone);
  }

  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Get("compliance")
  async complianceList(@Query("accountId") accountId?: string) {
    return { items: await this.compliance.list(accountId) };
  }

  @RequirePermissions("ADMIN_VIEW_MESSAGING")
  @Get("messages/needs-review")
  needsReview() {
    return this.accounts.history({ needsReview: true, limit: 100 });
  }

  // ---- manage (superadmin + MFA step-up) ----

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Post("compliance")
  complianceCreate(@Req() req: any, @Body() body: { accountId: string; type: string; brandId?: string; campaignId?: string; senderId?: string; expiresAt?: string }) {
    return this.compliance.create(body ?? ({} as any), actor(req));
  }

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Post("compliance/:id/status")
  complianceStatus(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: { status: string; evidenceNote?: string }) {
    return this.compliance.setStatus(id, body?.status, body?.evidenceNote, actor(req));
  }

  /** Emergency stop for ALL outbound SMS. Takes effect within seconds on every worker. */
  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Post("emergency-stop")
  emergencyStop(@Req() req: any, @Body() body: { on?: boolean; reason?: string }) {
    return this.control.set(body?.on === true, body?.reason, actor(req));
  }

  /** Run delivery reconciliation now (it otherwise runs every 5 minutes). Never resends anything. */
  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post("reconcile/run")
  runReconcile() {
    return this.reconciler.run();
  }

  /** Verified erasure request for one number (the STOP list is kept by design). */
  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Post("consent/erase")
  erase(@Req() req: any, @Body() body: { phone?: string }) {
    if (!body?.phone || !/^\+[1-9]\d{7,14}$/.test(body.phone)) throw new NotFoundException("phone must be in international format");
    return this.retention.erasePhone(body.phone, actor(req));
  }

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("accounts")
  register(@Req() req: any, @Body() body: { name: string; accountSid: string; authToken?: string; apiKeySid?: string; apiKeySecret?: string }) {
    return this.accounts.register(body ?? ({} as any), actor(req));
  }

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("accounts/:id/validate")
  validate(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.accounts.validate(id, actor(req));
  }

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Post("accounts/:id/activate")
  activate(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.accounts.activate(id, actor(req));
  }

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Post("accounts/:id/suspend")
  suspend(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: { reason?: string }) {
    return this.accounts.suspend(id, body?.reason, actor(req));
  }

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Post("accounts/:id/revoke")
  revoke(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.accounts.revoke(id, actor(req));
  }

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("accounts/:id/rotate")
  rotate(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: { authToken?: string; apiKeySid?: string; apiKeySecret?: string }) {
    return this.accounts.rotate(id, body ?? {}, actor(req));
  }

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Post("accounts/:id/spending")
  spending(
    @Req() req: any,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: { dailySegmentLimit?: number | null; monthlySegmentLimit?: number | null; allowedPrefixes?: string[] },
  ) {
    return this.accounts.setSpending(id, body ?? {}, actor(req));
  }

  /** Re-encrypt stored credentials under the current vault key. `?dryRun=true` reports without writing. */
  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post("credentials/migrate")
  migrate(@Req() req: any, @Query("dryRun") dryRun?: string) {
    return this.accounts.migrate(dryRun === "true", actor(req));
  }

  /**
   * Resolve a message whose outcome is unknown (`uncertain`) after checking with Twilio.
   * Nothing is ever resent automatically: "not_sent" only records the fact (and frees its budget).
   */
  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Post("messages/:id/reconcile")
  reconcile(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: { outcome?: string }) {
    if (body?.outcome !== "sent" && body?.outcome !== "not_sent") throw new NotFoundException("outcome must be sent or not_sent");
    return this.outbox.reconcile(id, body.outcome, actor(req));
  }

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("senders")
  registerSender(@Req() req: any, @Body() body: { accountId: string; number?: string; messagingServiceSid?: string }) {
    if (!body?.accountId) throw new NotFoundException("Account not found");
    return this.accounts.registerSender(body, actor(req));
  }

  @RequirePermissions("ADMIN_MANAGE_MESSAGING")
  @UseGuards(StepUpGuard)
  @Post("senders/:id/disable")
  disableSender(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.accounts.disableSender(id, actor(req));
  }
}
