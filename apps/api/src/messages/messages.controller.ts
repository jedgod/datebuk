import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { MessagesService } from "./messages.service";
import { ChatGateway } from "../realtime/chat.gateway";
import { AuditService } from "../common/audit/audit.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { UsersService } from "../users/users.service";

@Controller("messages")
export class MessagesController {
  constructor(
    private messages: MessagesService,
    private gateway: ChatGateway,
    private audit: AuditService,
    private subscriptions: SubscriptionsService,
    private users: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any, @Query("matchId") matchId: string) {
    await this.subscriptions.requireCommunication(req.user.userId);
    return this.messages.list(matchId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: any,
    @Body() body: {
      matchId: string;
      content: string;
      attachments?: { key: string; url: string; contentType: string; name?: string; size?: number }[];
    }
  ) {
    await this.users.requireVerifiedEmail(req.user.userId);
    await this.users.assertNotUnderRiskReview(req.user.userId);
    await this.subscriptions.requireCommunication(req.user.userId);
    const msg = await this.messages.create(body.matchId, req.user.userId, body.content, body.attachments);
    this.gateway.emitMessage(body.matchId, msg);
    await this.audit.log({ action: "CHAT_MESSAGE_SENT", actorUserId: req.user.userId, metadata: { matchId: body.matchId, messageId: msg.id } });
    return msg;
  }

  @UseGuards(JwtAuthGuard)
  @Post("read")
  async read(@Req() req: any, @Body() body: { matchId: string }) {
    await this.subscriptions.requireCommunication(req.user.userId);
    const res = await this.messages.markRead(body.matchId, req.user.userId);
    this.gateway.emitRead(body.matchId, { matchId: body.matchId, readerId: req.user.userId });
    await this.audit.log({ action: "CHAT_MESSAGES_READ", actorUserId: req.user.userId, metadata: { matchId: body.matchId } });
    return res;
  }
}
