import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { SwipesService } from "./swipes.service";
import { AuditService } from "../common/audit/audit.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { UsersService } from "../users/users.service";

@Controller("swipes")
export class SwipesController {
  constructor(
    private swipes: SwipesService,
    private audit: AuditService,
    private subscriptions: SubscriptionsService,
    private users: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("recommendations")
  async recommendations(@Req() req: any, @Query("limit") limit?: string) {
    await this.users.requireVerifiedEmail(req.user.userId);
    return this.swipes.recommendations(req.user.userId, limit ? Number(limit) : 20);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async swipe(@Req() req: any, @Body() body: { toId: string; action: "like" | "pass" }) {
    await this.users.requireVerifiedEmail(req.user.userId);
    if (body.action === "like") {
      await this.users.assertNotUnderRiskReview(req.user.userId);
      await this.subscriptions.assertLikeAvailable(req.user.userId);
    }
    const res = await this.swipes.swipe(req.user.userId, body.toId, body.action);
    await this.audit.log({ action: "SWIPE_ACTION", actorUserId: req.user.userId, targetUserId: body.toId, metadata: { action: body.action, matched: res.matched } });
    return res;
  }
}
