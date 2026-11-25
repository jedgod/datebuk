import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { createHmac } from "crypto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { PushService } from "./push.service";
import { PgBossService } from "../common/pgboss/pgboss.service";
import { UsersService } from "../users/users.service";

@Controller("push")
export class PushController {
  constructor(
    private push: PushService,
    private pgBoss: PgBossService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("subscribe")
  subscribe(@Req() req: any, @Body() body: { subscription: any }) {
    return this.push.saveSubscription(req.user.userId, body.subscription);
  }

  // enqueue a push to current user (useful for testing)
  @UseGuards(JwtAuthGuard)
  @Post("send")
  async send(@Req() req: any, @Body() body: { payload: any }) {
    await this.pgBoss.add("push", { userId: req.user.userId, payload: body.payload }, { attempts: 5 });
    return { ok: true };
  }
}

@Controller()
export class NativeCallInfrastructureController {
  constructor(private push: PushService, private users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post("devices/call-token")
  registerCallToken(
    @Req() req: any,
    @Body() body: { token: string; platform: string; provider: string },
  ) {
    return this.push.saveMobileCallToken(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("turn-credentials")
  async turnCredentials(@Req() req: any) {
    await this.users.requireVerifiedEmail(req.user.userId);
    const url = process.env.TURN_URL;
    const secret = process.env.TURN_SHARED_SECRET;
    const ttl = 600;
    const expiresAt = Math.floor(Date.now() / 1000) + ttl;
    const stun = { urls: ["stun:stun.l.google.com:19302"] };
    if (!url || !secret) {
      return { configured: false, ttl, expiresAt, iceServers: [stun] };
    }

    const username = `${expiresAt}:${req.user.userId}`;
    const credential = createHmac("sha1", secret).update(username).digest("base64");
    return {
      configured: true,
      ttl,
      expiresAt,
      iceServers: [
        stun,
        { urls: url.split(",").map((item) => item.trim()).filter(Boolean), username, credential },
      ],
    };
  }
}
