import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { UsersService } from "../users/users.service";
import { CallsService } from "./calls.service";

@Controller("calls")
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private calls: CallsService, private users: UsersService) {}

  @Post("token")
  async issueToken(@Req() req: any, @Body() body: { matchId: string; media: "voice" | "video" }) {
    await this.users.requireVerifiedEmail(req.user.userId);
    await this.users.assertNotUnderRiskReview(req.user.userId);
    return this.calls.issueToken(req.user.userId, body.matchId, body.media);
  }
}
