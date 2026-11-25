import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { recipientHash } from "./sms-keys";

const DAY = 86_400_000;
const days = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

/** DCG_RETENTION_* (days). Defaults are proposed, not legal advice - confirm with counsel before launch. */
export const retentionPolicy = () => ({
  otpChallenges: days("DCG_RETENTION_OTP_DAYS", 1),
  webhookEvents: days("DCG_RETENTION_WEBHOOK_DAYS", 30),
  messages: days("DCG_RETENTION_MESSAGES_DAYS", 90),
  riskEvents: days("DCG_RETENTION_RISK_DAYS", 180),
  consentEvents: days("DCG_RETENTION_CONSENT_DAYS", 1825), // proof of consent is kept long
});

/**
 * Retention and erasure for communications data.
 *  - Short-lived artefacts (OTP challenges, callback dedup keys) go quickly.
 *  - Final-state message METADATA (no recipient, no text - those are already gone) goes after the window.
 *  - Consent history is kept the longest (it is the evidence). Its table is append-only; the purge runs
 *    as the one permitted deletion path by setting a transaction-local flag the trigger checks.
 *  - The STOP suppression list is never purged: forgetting an opt-out would let us text someone who asked us not to.
 */
@Injectable()
export class SmsRetentionService {
  private readonly log = new Logger(SmsRetentionService.name);

  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async purge(now = new Date()) {
    const P = retentionPolicy();
    const before = (d: number) => new Date(now.getTime() - d * DAY);

    const otp = await this.prisma.otpChallenge.deleteMany({ where: { createdAt: { lt: before(P.otpChallenges) } } });
    const events = await this.prisma.smsWebhookEvent.deleteMany({ where: { receivedAt: { lt: before(P.webhookEvents) } } });
    const msgs = await this.prisma.smsMessage.deleteMany({ where: { createdAt: { lt: before(P.messages) }, state: { in: ["delivered", "undelivered", "failed", "canceled", "sent", "accepted"] }, needsReview: false } });
    const risk = await this.prisma.smsRiskEvent.deleteMany({ where: { createdAt: { lt: before(P.riskEvents) }, status: { not: "open" } } });
    const consent = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('dcg.retention_job', 'on', true)`;
      return tx.smsConsentEvent.deleteMany({ where: { createdAt: { lt: before(P.consentEvents) } } });
    });

    const out = { otp: otp.count, webhookEvents: events.count, messages: msgs.count, riskEvents: risk.count, consentEvents: consent.count };
    if (Object.values(out).some((n) => n > 0)) await this.audit.log({ action: "SMS_RETENTION_PURGE", actorUserId: null, metadata: out });
    return out;
  }

  /**
   * Erase everything we hold about a number except the STOP list (see class comment). Used for
   * verified data-subject erasure requests. Returns counts only.
   */
  async erasePhone(phone: string, actor: { userId: string }) {
    const phoneHash = recipientHash(phone);
    const otp = await this.prisma.otpChallenge.deleteMany({ where: { recipientHash: phoneHash } });
    const consent = await this.prisma.smsConsent.deleteMany({ where: { phoneHash } });
    const events = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('dcg.retention_job', 'on', true)`;
      return tx.smsConsentEvent.deleteMany({ where: { phoneHash } });
    });
    await this.audit.log({ action: "SMS_PHONE_ERASED", actorUserId: actor.userId, metadata: { otp: otp.count, consent: consent.count, events: events.count } });
    return { otp: otp.count, consent: consent.count, consentEvents: events.count, suppressionKept: true };
  }
}
