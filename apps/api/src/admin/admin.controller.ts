import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AdminService, PushSegment, AuditFilters } from "./admin.service";
// import { InjectQueue } from "@nestjs/bullmq";
// import { Queue } from "bullmq";
import { AuditService } from "../common/audit/audit.service";
import { SecurityAlertService } from "../common/security-alerts/security-alert.service";

@Controller("admin")
export class AdminController {
  constructor(
    private admin: AdminService,
    private audit: AuditService,
    private alerts: SecurityAlertService,
    // @InjectQueue("push") private pushQ: Queue,
    // @InjectQueue("broadcast") private broadcastQ: Queue,
  ) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS")
  @Get("dashboard-summary")
  dashboardSummary() {
    return this.admin.dashboardSummary();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_MODERATION")
  @Get("video-monitor/reports")
  videoMonitorReports() {
    return this.admin.listVideoMonitorReports();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_MANAGE_MODERATION")
  @Patch("video-monitor/reports/:id")
  updateVideoMonitorReport(@Param("id") id: string, @Body("status") status: string) {
    return this.admin.updateVideoMonitorReportStatus(id, status);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_MANAGE_MODERATION")
  @Post("video-monitor/reports/:id/action")
  applyVideoMonitorReportAction(
    @Param("id") id: string,
    @Body() body: { action: string; notes: string },
  ) {
    return this.admin.applyVideoMonitorReportAction(id, body.action, body.notes);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS")
  @Get("users")
  users(@Query("q") q?: string, @Query("limit") limit?: string) {
    return this.admin.listUsers(q, limit ? Number(limit) : 50);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS", "ADMIN_VIEW_SESSIONS")
  @Get("sessions")
  sessions(@Query("userId") userId: string) {
    return this.admin.sessionsByUser(userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS", "ADMIN_REVOKE_SESSIONS")
  @Post("sessions/revoke")
  async revokeSession(@Req() req: any, @Body() body: { sessionId: string }) {
    const res = await this.admin.revokeSession(body.sessionId);
    await this.audit.log({ action: "ADMIN_SESSION_REVOKED", actorUserId: req.user.userId, targetUserId: res.userId, metadata: { sessionId: body.sessionId } });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS", "ADMIN_VIEW_AUDIT")
  @Get("audit")
  async auditList(@Req() req: any, @Query() query: any) {
    const filters: AuditFilters = {
      q: query.q,
      action: query.action,
      actorUserId: query.actorUserId,
      targetUserId: query.targetUserId,
      from: query.from,
      to: query.to,
      limit: query.limit ? Number(query.limit) : undefined,
      cursor: query.cursor,
    };
    const result = await this.admin.auditQuery(filters);
    // The audit log's own access is itself a security-relevant event — previously there
    // was no record of who had looked at it, which is exactly the kind of gap an insider
    // or a compromised admin account would rely on.
    await this.audit.log({
      action: "ADMIN_AUDIT_VIEWED",
      actorUserId: req.user.userId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { filters, resultCount: result.items.length },
    });
    return result;
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS", "ADMIN_EXPORT_AUDIT")
  @Get("audit/export")
  async auditExport(@Req() req: any, @Res() res: Response, @Query() query: any) {
    const filters: AuditFilters = {
      action: query.action,
      actorUserId: query.actorUserId,
      targetUserId: query.targetUserId,
      from: query.from,
      to: query.to,
    };
    const { csv, rowCount } = await this.admin.auditExport(filters);
    await this.audit.log({
      action: "ADMIN_AUDIT_EXPORTED",
      actorUserId: req.user.userId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { filters, rowCount },
    });
    this.alerts.recordAuditExport(req.user.userId, rowCount).catch(() => {});
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=audit_logs.csv");
    res.status(200).send(csv);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS", "ADMIN_VIEW_QUARANTINE")
  @Get("quarantine")
  quarantineList(@Query("prefix") prefix?: string) {
    return this.admin.quarantineList(prefix ?? "quarantine/");
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS", "ADMIN_RELEASE_QUARANTINE")
  @Post("quarantine/release")
  async quarantineRelease(@Req() req: any, @Body() body: { key: string }) {
    const out = await this.admin.quarantineRelease(body.key);
    await this.audit.log({ action: "ADMIN_QUARANTINE_RELEASE", actorUserId: req.user.userId, metadata: { key: body.key, releasedKey: out.releasedKey } });
    return out;
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS", "ADMIN_DELETE_QUARANTINE")
  @Post("quarantine/delete")
  async quarantineDelete(@Req() req: any, @Body() body: { key: string }) {
    const out = await this.admin.quarantineDelete(body.key);
    await this.audit.log({ action: "ADMIN_QUARANTINE_DELETE", actorUserId: req.user.userId, metadata: { key: body.key } });
    return out;
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS", "ADMIN_PREVIEW_QUARANTINE")
  @Get("quarantine/meta")
  async quarantineMeta(@Query("key") key: string) {
    // Returns metadata including quarantine reason
    return this.admin.quarantineMeta(key); // internal: UploadsService via AdminService constructor
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS", "ADMIN_PREVIEW_QUARANTINE")
  @Get("quarantine/preview")
  async quarantinePreview(@Query("key") key: string) {
  // Safe preview rules:
  // - must be under quarantine/
  // - content-type must be image/jpeg|png|webp
  // - content-length <= 2MB
  if (!key.startsWith("quarantine/")) return { ok: false, reason: "Invalid key" };

  const head = await this.admin.quarantineMeta(key);
  const ct = String(head.ContentType || "");
  const len = Number(head.ContentLength || 0);

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(ct)) return { ok: false, reason: "Preview not allowed for this content type" };
  if (len > 2 * 1024 * 1024) return { ok: false, reason: "Preview too large" };

  const url = await this.admin.quarantinePreview(key);
  return { ok: true, url: (url as any).url, contentType: ct, contentLength: len, reason: (head as any).metadata?.reason ?? null };
}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_BROADCAST_PUSH")
  @Post("push/broadcast")
  async broadcast(@Req() req: any, @Body() body: { segment?: PushSegment; payload: any }) {
    const segment = body.segment ?? {};

    // DISABLED: Enqueue a single broadcast job to throttle/batch internally. Requires Redis.
    // await this.broadcastQ.add(
    //   "broadcast",
    //   { segment, payload: body.payload, actorUserId: req.user.userId },
    //   { attempts: 3, backoff: { type: "exponential", delay: 2000 } }
    // );

    await this.audit.log({
      action: "ADMIN_PUSH_BROADCAST_ENQUEUED",
      actorUserId: req.user.userId,
      metadata: { segment, payload: body.payload },
    });

    return { ok: true, enqueued: true };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_BROADCAST_PUSH")
  @Get("push/analytics")
  pushAnalytics() {
    return this.admin.pushBroadcastAnalytics();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_BROADCAST_PUSH")
  @Get("push/recent")
  pushRecent(@Query("limit") limit?: string) {
    return this.admin.pushBroadcastRecent(limit ? Number(limit) : 5);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_BROADCAST_PUSH")
  @Post("push/preview")
  pushPreview(@Body() body: { payload: { title?: string; body?: string; url?: string } }) {
    const text = `${body?.payload?.title ?? ""} ${body?.payload?.body ?? ""}`.toLowerCase();
    const hasAggressive = /(harass|threat|hate|violence|explicit|nudity|abuse)/.test(text);
    const hasSpam = /(buy now|free|click|limited|urgent|offer)/.test(text);

    const harassmentRisk = hasAggressive ? "high" : "low";
    const spamSignal = hasSpam ? "moderate" : "low";
    const deliveryCompliance = hasAggressive ? "warn" : "pass";

    return { harassmentRisk, spamSignal, deliveryCompliance };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_MANAGE_SUBSCRIPTIONS")
  @Get("subscription-features")
  listSubscriptionFeatures() {
    return this.admin.listSubscriptionFeatures();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_MANAGE_SUBSCRIPTIONS")
  @Post("subscription-features")
  async updateSubscriptionFeatures(
    @Req() req: any,
    @Body()
    body: {
      features: Array<{
        tierName: string;
        featureName: string;
        isEnabled: boolean;
        displayOrder?: number;
        featureValue?: string | null;
      }>;
    },
  ) {
    const out = await this.admin.upsertSubscriptionFeatures(body.features ?? []);
    await this.audit.log({
      action: "ADMIN_SUBSCRIPTION_FEATURES_UPDATED",
      actorUserId: req.user.userId,
      metadata: { count: body.features?.length ?? 0 },
    });
    return out;
  }
}
