import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";

@Controller("admin/security-alerts")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SecurityAlertController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @RequirePermissions("ADMIN_VIEW_SECURITY_ALERTS")
  @Get()
  async list(@Query("status") status?: string, @Query("severity") severity?: string, @Query("limit") limit?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const items = await this.prisma.securityAlert.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: Math.min(Number(limit) || 50, 200),
    });
    return { count: items.length, items };
  }

  @RequirePermissions("ADMIN_VIEW_SECURITY_ALERTS")
  @Get("stats")
  async stats() {
    const [open, acknowledged, resolved] = await Promise.all([
      this.prisma.securityAlert.count({ where: { status: "open" } }),
      this.prisma.securityAlert.count({ where: { status: "acknowledged" } }),
      this.prisma.securityAlert.count({ where: { status: "resolved" } }),
    ]);
    return { open, acknowledged, resolved, total: open + acknowledged + resolved };
  }

  @RequirePermissions("ADMIN_MANAGE_SECURITY_ALERTS")
  @Post(":id/acknowledge")
  async acknowledge(@Param("id") id: string, @Req() req: any) {
    const updated = await this.prisma.securityAlert.update({
      where: { id },
      data: { status: "acknowledged", acknowledgedBy: req.user.userId, acknowledgedAt: new Date() },
    });
    await this.audit.log({
      action: "SECURITY_ALERT_ACKNOWLEDGED",
      actorUserId: req.user.userId,
      targetUserId: updated.actorUserId,
      metadata: { alertId: id, ruleId: updated.ruleId },
    });
    return updated;
  }

  @RequirePermissions("ADMIN_MANAGE_SECURITY_ALERTS")
  @Post(":id/resolve")
  async resolve(@Param("id") id: string, @Req() req: any, @Body() body: { notes?: string }) {
    const updated = await this.prisma.securityAlert.update({
      where: { id },
      data: { status: "resolved", resolvedBy: req.user.userId, resolvedAt: new Date(), notes: body.notes },
    });
    await this.audit.log({
      action: "SECURITY_ALERT_RESOLVED",
      actorUserId: req.user.userId,
      targetUserId: updated.actorUserId,
      metadata: { alertId: id, ruleId: updated.ruleId, notes: body.notes },
    });
    return updated;
  }
}
