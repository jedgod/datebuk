import { Injectable, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SafetyService } from "../safety/safety.service";
// import { InjectQueue } from "@nestjs/bullmq";
// import { Queue } from "bullmq";

type MessageAttachment = {
  key: string;
  url?: string;
  contentType: string;
  name?: string;
  size?: number;
};

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
    private notifications: NotificationsService,
    private safety: SafetyService,
    // @InjectQueue("push") private pushQ: Queue,
  ) {}

  private async withPrivateAttachmentUrls<T extends { attachments: unknown }>(message: T): Promise<T> {
    const attachments = Array.isArray(message.attachments) ? message.attachments as MessageAttachment[] : [];
    if (attachments.length === 0) return message;
    return {
      ...message,
      attachments: await Promise.all(attachments.map(async (attachment) => ({
        ...attachment,
        url: await this.uploads.presignedGet(attachment.key, 900),
      }))),
    };
  }

  async list(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new BadRequestException("Match not found");
    if (match.user1Id !== userId && match.user2Id !== userId) throw new ForbiddenException();
    const messages = await this.prisma.message.findMany({ where: { matchId }, orderBy: { createdAt: "asc" } });
    return Promise.all(messages.map((message) => this.withPrivateAttachmentUrls(message)));
  }

  async create(matchId: string, senderId: string, content: string, attachments?: MessageAttachment[]) {
    const trimmed = content?.trim() ?? "";
    const normalizedAttachments = (attachments ?? [])
      .filter((item) => item?.key && item?.contentType)
      .map(({ key, contentType, name, size }) => ({ key, contentType, name, size }));
    if (!trimmed && normalizedAttachments.length === 0) {
      throw new BadRequestException("Message content or attachments required");
    }

    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new BadRequestException("Match not found");
    if (match.user1Id !== senderId && match.user2Id !== senderId) throw new ForbiddenException();

    const recipientId = match.user1Id === senderId ? match.user2Id : match.user1Id;
    // Checked in both directions: either party having blocked the other stops the
    // conversation, without revealing to the sender which direction the block runs.
    if (await this.safety.isBlockedEitherDirection(senderId, recipientId)) {
      throw new ForbiddenException("This conversation is no longer available");
    }

    for (const attachment of normalizedAttachments) {
      await this.uploads.assertUploadOwnedBy(senderId, attachment.key);
    }

    const msg = await this.prisma.$transaction(async (prisma) => {
      const created = await prisma.message.create({
        data: {
          matchId,
          senderId,
          content: trimmed,
          attachments: normalizedAttachments.length ? normalizedAttachments : undefined,
          deliveredAt: new Date(),
        },
      });

      await prisma.match.update({
        where: { id: matchId },
        data: { lastMessageAt: created.createdAt },
      });

      return created;
    });

    await this.notifications.create({
      userId: recipientId,
      type: "MESSAGE",
      title: "New Message",
      body: msg.content ? msg.content.slice(0, 120) : "Sent an attachment",
      relatedId: matchId,
    });

    // Push to other user (fanout job) - DISABLED: requires Redis
    // await this.pushQ.add("fanout", {
    //   userId: recipientId,
    //   payload: {
    //     title: "New message",
    //     body: msg.content.slice(0, 120),
    //     url: `/messages?matchId=${encodeURIComponent(matchId)}`,
    //   },
    // }, { attempts: 5, backoff: { type: "exponential", delay: 2000 } });

    return this.withPrivateAttachmentUrls(msg);
  }

  async markRead(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new BadRequestException("Match not found");
    if (match.user1Id !== userId && match.user2Id !== userId) throw new ForbiddenException();

    await this.prisma.message.updateMany({
      where: { matchId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
