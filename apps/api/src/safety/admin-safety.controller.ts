import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { AuditService } from "../common/audit/audit.service";
import { SafetyService } from "./safety.service";

@Controller("admin/safety-reports")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminSafetyController {
  constructor(private safety: SafetyService, private audit: AuditService) {}

  @RequirePermissions("ADMIN_VIEW_SAFETY_REPORTS")
  @Get()
  queue(
    @Query("status") status?: string,
    @Query("severity") severity?: string,
    @Query("category") category?: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string,
  ) {
    return this.safety.listReportsQueue({
      status,
      severity,
      category,
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
    });
  }

  @RequirePermissions("ADMIN_VIEW_SAFETY_REPORTS")
  @Get("user/:userId")
  userHistory(@Param("userId") userId: string) {
    return this.safety.userSafetyHistory(userId);
  }

  @RequirePermissions("ADMIN_MANAGE_SAFETY_REPORTS")
  @Post(":id/resolve")
  async resolve(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { status: "INVESTIGATING" | "RESOLVED" | "DISMISSED"; note?: string },
  ) {
    const updated = await this.safety.resolveReport(id, req.user.userId, body.status, body.note);
    await this.audit.log({
      action: "safety_report_resolved",
      actorUserId: req.user.userId,
      targetUserId: updated.reportedId,
      metadata: { reportId: id, status: body.status },
    });
    return updated;
  }
}
