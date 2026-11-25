import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { AuditService } from "../common/audit/audit.service";
import { VerificationService } from "./verification.service";

@Controller("admin/verification")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminVerificationController {
  constructor(private verification: VerificationService, private audit: AuditService) {}

  @RequirePermissions("ADMIN_VIEW_MODERATION")
  @Get("queue")
  async queue(@Req() req: any) {
    const items = await this.verification.listQueue();
    // Every presigned photo URL handed back here is a real access to a member's
    // verification selfie — logged individually so "who viewed this person's
    // verification photo, and when" is answerable later, not just "who approved it."
    await Promise.all(
      items.map((item) =>
        this.audit.log({
          action: "ADMIN_VERIFICATION_PHOTO_VIEWED",
          actorUserId: req.user.userId,
          targetUserId: item.userId,
          metadata: { requestId: item.id },
        }),
      ),
    );
    return items;
  }

  @RequirePermissions("ADMIN_MANAGE_MODERATION")
  @Post(":id/review")
  review(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { decision: "approved" | "rejected" | "escalated"; reason?: string },
  ) {
    return this.verification.review(id, body.decision, req.user.userId, body.reason);
  }
}
