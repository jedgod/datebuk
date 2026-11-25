import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { SmsAccountsService } from "./sms-accounts.service";
import { dcg } from "./dcg-config";
import { countSegments } from "./sms-segments";
import { basicAuth, isAuthFailure, type TwilioRestCreds } from "./twilio-api";

export const E164 = /^\+[1-9]\d{7,14}$/;

export type SmsDelivery = "sent" | "logged";

type Sender = {
  source: "db" | "env";
  accountId: string | null;
  creds: TwilioRestCreds;
  from?: string;
  messagingServiceSid?: string;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  allowedPrefixes: string[];
};

const utcDay = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};
const utcMonth = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
};

/**
 * Sends SMS through Twilio (REST, no SDK).
 *
 * Authorization happens at dispatch time, every time, in this order: opted-out? destination
 * allowed? an ACTIVE provider account? spend caps? Only then is Twilio called.
 *
 *  - Exactly one provider account may be `active` (enforced by a unique index). If it is
 *    suspended, rotating, failing or absent, sending fails: there is NO automatic switch to
 *    another account. Environment credentials are used only when DCG_ENV_FALLBACK_ENABLED=true.
 *  - If Twilio rejects our credentials (401/403) the account is suspended automatically and the
 *    send fails; an ambiguous outcome (timeout) is recorded as `uncertain` and never retried,
 *    because the provider may already have accepted it.
 *  - DCG_LIVE_SMS_ENABLED gates real sends: off => development logs the text, production refuses.
 */
@Injectable()
export class SmsService {
  private readonly log = new Logger(SmsService.name);

  constructor(private prisma: PrismaService, private accounts: SmsAccountsService) {}

  private fromEnv(): Sender | null {
    if (!dcg.envFallback()) return null;
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim();
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim();
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
    const from = (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER)?.trim();
    if (!accountSid || !(messagingServiceSid || from)) return null;
    const creds: TwilioRestCreds | null =
      apiKeySid && apiKeySecret ? { accountSid, apiKeySid, secret: apiKeySecret } : authToken ? { accountSid, secret: authToken } : null;
    if (!creds) return null;
    return {
      source: "env",
      accountId: null,
      creds,
      from: from || undefined,
      messagingServiceSid: messagingServiceSid || undefined,
      dailyLimit: null,
      monthlyLimit: null,
      allowedPrefixes: ["+1"],
    };
  }

  private async fromDb(): Promise<Sender | null> {
    const account = await this.prisma.twilioAccount.findFirst({
      where: { status: "active" },
      include: { senders: { where: { enabled: true }, orderBy: { createdAt: "asc" }, take: 1 } },
    });
    const sender = account?.senders[0];
    if (!account || !sender) return null;
    const creds = this.accounts.restCredentials(account);
    if (!creds) return null;
    return {
      source: "db",
      accountId: account.id,
      creds,
      from: sender.senderNumber ?? undefined,
      messagingServiceSid: sender.messagingServiceSid ?? undefined,
      dailyLimit: account.dailySegmentLimit,
      monthlyLimit: account.monthlySegmentLimit,
      allowedPrefixes: account.allowedPrefixes,
    };
  }

  /** The one account/sender messages would go out through right now, or null. */
  async resolve(): Promise<Sender | null> {
    return (await this.fromDb()) ?? this.fromEnv();
  }

  async isConfigured(): Promise<boolean> {
    return (await this.resolve()) !== null;
  }

  /** Public base URL Twilio can reach for delivery-status callbacks (must be https). */
  private callbackBase(): string | null {
    const base = (process.env.SMS_WEBHOOK_BASE_URL || process.env.API_URL || "").trim().replace(/\/$/, "");
    return /^https:\/\/[^/]+$/.test(base) ? base : null;
  }

  private async assertWithinBudget(s: Sender, segments: number) {
    if (!s.accountId || (s.dailyLimit == null && s.monthlyLimit == null)) return;
    const used = async (since: Date) =>
      (await this.prisma.smsMessage.aggregate({
        _sum: { segments: true },
        where: { accountId: s.accountId!, createdAt: { gte: since }, state: { notIn: ["failed", "canceled"] } },
      }))._sum.segments ?? 0;
    if (s.dailyLimit != null && (await used(utcDay())) + segments > s.dailyLimit) {
      throw new ServiceUnavailableException("The daily SMS spending limit has been reached. Try again tomorrow.");
    }
    if (s.monthlyLimit != null && (await used(utcMonth())) + segments > s.monthlyLimit) {
      throw new ServiceUnavailableException("The monthly SMS spending limit has been reached.");
    }
  }

  async send(toE164: string, body: string, opts: { purpose?: string; userId?: string | null } = {}): Promise<SmsDelivery> {
    if (!E164.test(toE164)) throw new ServiceUnavailableException("Invalid phone number");

    // 1. consent: opted out (replied STOP) -> never message
    if (await this.prisma.smsSuppression.findUnique({ where: { phone: toE164 } })) {
      throw new ServiceUnavailableException("This number has opted out of text messages. Reply START to opt back in.");
    }

    const sender = await this.resolve();

    // 2. destination restriction (per account; env fallback is US/Canada only)
    const prefixes = sender?.allowedPrefixes ?? ["+1"];
    if (!prefixes.some((p) => toE164.startsWith(p))) {
      throw new ServiceUnavailableException("Text messages to that country aren't enabled.");
    }

    // 3. live switch
    if (!dcg.liveSms() || !sender) {
      if (process.env.NODE_ENV === "production") {
        throw new ServiceUnavailableException(!dcg.liveSms() ? "SMS is disabled" : "SMS is not configured");
      }
      this.log.warn(`[dev] SMS not sent (${!dcg.liveSms() ? "DCG_LIVE_SMS_ENABLED is off" : "no active provider account"}) to ***${toE164.slice(-4)}. Body: ${body}`);
      return "logged";
    }

    // 4. spend caps (segment-accurate)
    const { segments } = countSegments(body);
    await this.assertWithinBudget(sender, segments);

    const message = await this.prisma.smsMessage.create({
      data: {
        accountId: sender.accountId,
        segments,
        userId: opts.userId ?? null,
        purpose: opts.purpose ?? "transactional",
        recipientLast4: toE164.slice(-4),
      },
    });

    const params = new URLSearchParams({ To: toE164, Body: body });
    if (sender.messagingServiceSid) params.set("MessagingServiceSid", sender.messagingServiceSid);
    else params.set("From", sender.from!);
    const cb = this.callbackBase();
    if (cb) params.set("StatusCallback", `${cb}/api/sms/webhooks/status?mid=${message.id}`);

    let res: Response;
    try {
      res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sender.creds.accountSid)}/Messages.json`, {
        method: "POST",
        headers: { Authorization: basicAuth(sender.creds), "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      // Timeout / network failure: we can't know whether Twilio accepted it. Never auto-retried.
      await this.prisma.smsMessage.update({ where: { id: message.id }, data: { state: "uncertain" } });
      this.log.error(`Twilio request outcome unknown (${sender.source}): ${(err as Error).message}`);
      throw new ServiceUnavailableException("Couldn't send the text message. Please try again.");
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      await this.prisma.smsMessage.update({ where: { id: message.id }, data: { state: "failed" } });
      this.log.error(`Twilio send failed (${res.status}, ${sender.source}): ${detail.slice(0, 300)}`);
      if (isAuthFailure(res.status) && sender.accountId) {
        // Fail closed and stop using this account; an admin must rotate/activate deliberately.
        await this.accounts.suspendAutomatically(sender.accountId, `Twilio rejected credentials (HTTP ${res.status})`);
      }
      throw new ServiceUnavailableException("Couldn't send the text message. Please try again.");
    }

    const sent = (await res.json().catch(() => ({}))) as { sid?: string };
    await this.prisma.smsMessage.update({ where: { id: message.id }, data: { providerSid: sent.sid ?? null, state: "accepted" } });
    return "sent";
  }
}
