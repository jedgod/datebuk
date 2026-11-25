import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { VerificationService } from "./verification.service";
import { UsersService } from "../users/users.service";

@Controller("verification")
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private verification: VerificationService, private users: UsersService) {}

  @Get("status")
  status(@Req() req: any) {
    return this.verification.getStatus(req.user.userId);
  }

  @Post("submit")
  async submit(@Req() req: any, @Body() body: { photoKey: string; consent?: boolean }) {
    await this.users.requireVerifiedEmail(req.user.userId);
    await this.users.assertNotUnderRiskReview(req.user.userId);
    return this.verification.submit(req.user.userId, body.photoKey, !!body.consent);
  }
}
