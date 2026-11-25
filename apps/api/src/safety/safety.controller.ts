import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { SafetyService } from "./safety.service";

@Controller("safety")
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private safety: SafetyService) {}

  @Post("block")
  block(@Req() req: any, @Body() body: { userId: string; reason?: string }) {
    return this.safety.block(req.user.userId, body.userId, body.reason);
  }

  @Post("unblock")
  unblock(@Req() req: any, @Body() body: { userId: string }) {
    return this.safety.unblock(req.user.userId, body.userId);
  }

  @Get("blocked")
  listBlocked(@Req() req: any) {
    return this.safety.listBlocked(req.user.userId);
  }

  // "Report and block as one action": block defaults to true, matching the safety
  // review's requirement that reporting and blocking be a single step rather than two.
  @Post("report")
  report(
    @Req() req: any,
    @Body() body: { userId: string; category: string; description?: string; matchId?: string; block?: boolean },
  ) {
    return this.safety.report({
      reporterId: req.user.userId,
      reportedId: body.userId,
      category: body.category,
      description: body.description,
      matchId: body.matchId,
      alsoBlock: body.block,
    });
  }
}
