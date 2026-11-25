import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { SessionsService } from "./sessions.service";
import { AuditService } from "../common/audit/audit.service";

@Controller("sessions")
export class SessionsController {
  constructor(private sessions: SessionsService, private audit: AuditService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: any) {
    return this.sessions.list(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("revoke")
  async revoke(@Req() req: any, @Body() body: { sessionId: string }) {
    const res = await this.sessions.revoke(req.user.userId, body.sessionId);
    await this.audit.log({ action: "SESSION_REVOKED", actorUserId: req.user.userId, metadata: { sessionId: body.sessionId } });
    return res;
  }
}
