import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { StepUpGuard } from "../auth/step-up.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { SmsAccountsService } from "./sms-accounts.service";
import { SmsOutboxService } from "./sms-outbox.service";
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
  constructor(private accounts: SmsAccountsService, private outbox: SmsOutboxService) {}

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

  // ---- manage (superadmin + MFA step-up) ----

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
