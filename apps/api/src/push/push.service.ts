import { Injectable, BadRequestException } from "@nestjs/common";
import * as webpush from "web-push";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class PushService {
  constructor(private prisma: PrismaService) {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const mail = process.env.EMAIL_FROM || "no-reply@datepage.app";
    if (pub && priv) {
      webpush.setVapidDetails(`mailto:${mail}`, pub, priv);
    }
  }

  private ensureConfigured() {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) throw new BadRequestException("VAPID keys not configured");
  }

  async saveSubscription(userId: string, sub: any) {
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) throw new BadRequestException("Invalid subscription");
    await this.prisma.pushSubscription.upsert({
      where: { userId_endpoint: { userId, endpoint: sub.endpoint } },
      update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      create: { userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
    return { ok: true };
  }

  async saveMobileCallToken(
    userId: string,
    input: { token: string; platform: string; provider: string },
  ) {
    if (!input.token || !["android", "ios"].includes(input.platform)) {
      throw new BadRequestException("Invalid mobile call token");
    }
    return this.prisma.mobileCallToken.upsert({
      where: { token: input.token },
      update: { userId, platform: input.platform, provider: input.provider, active: true },
      create: { userId, token: input.token, platform: input.platform, provider: input.provider },
      select: { id: true, platform: true, provider: true, active: true },
    });
  }

  async sendToUser(userId: string, payload: any) {
    this.ensureConfigured();
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    const json = JSON.stringify(payload);

    const results = [];
    for (const s of subs) {
      const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      try {
        await webpush.sendNotification(subscription as any, json);
        results.push({ endpoint: s.endpoint, ok: true });
      } catch (e: any) {
        results.push({ endpoint: s.endpoint, ok: false, error: String(e?.message ?? e) });
      }
    }
    return { ok: true, results };
  }
}
