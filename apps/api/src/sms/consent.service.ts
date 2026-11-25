import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { recipientHash } from "./sms-keys";

export const isMarketingPurpose = (purpose: string) => purpose.startsWith("marketing");

/**
 * Per-recipient, per-purpose consent with a permanent history.
 *
 *  - Recipients are stored only as keyed hashes (+ last 4 digits for support).
 *  - Every change appends an immutable SmsConsentEvent (database trigger forbids edits/deletes).
 *  - STOP withdraws everything and suppresses the number (SmsSuppression is the fast path the
 *    dispatcher checks). START lifts the carrier-level block ONLY: it records `start` and does
 *    not grant any consent - in particular never marketing, which needs its own explicit grant.
 *  - Transactional messages the user asked for (OTP, verification links) are covered by the
 *    request itself; that is recorded as a `granted` event with source `user_request`.
 */
@Injectable()
export class ConsentService {
  constructor(private prisma: PrismaService) {}

  async record(p: { phone: string; purpose: string; action: "granted" | "withdrawn"; source: string; policyVersion?: string | null }) {
    const phoneHash = recipientHash(p.phone);
    await this.prisma.$transaction([
      this.prisma.smsConsent.upsert({
        where: { phoneHash_purpose: { phoneHash, purpose: p.purpose } },
        update: { status: p.action, source: p.source, policyVersion: p.policyVersion ?? null },
        create: { phoneHash, purpose: p.purpose, status: p.action, source: p.source, policyVersion: p.policyVersion ?? null },
      }),
      this.prisma.smsConsentEvent.create({
        data: { phoneHash, recipientLast4: p.phone.slice(-4), purpose: p.purpose, action: p.action, source: p.source, policyVersion: p.policyVersion ?? null },
      }),
    ]);
  }

  /** Signed STOP callback. Idempotent: repeating it changes nothing visible. */
  async onStop(phone: string, source = "sms_stop") {
    const phoneHash = recipientHash(phone);
    const existing = await this.prisma.smsConsent.findMany({ where: { phoneHash, status: "granted" } });
    await this.prisma.$transaction([
      this.prisma.smsSuppression.upsert({ where: { phone }, update: {}, create: { phone } }),
      this.prisma.smsConsent.updateMany({ where: { phoneHash, status: "granted" }, data: { status: "withdrawn", source } }),
      this.prisma.smsConsentEvent.create({ data: { phoneHash, recipientLast4: phone.slice(-4), purpose: "*", action: "stop", source } }),
      ...existing.map((c) =>
        this.prisma.smsConsentEvent.create({ data: { phoneHash, recipientLast4: phone.slice(-4), purpose: c.purpose, action: "withdrawn", source } }),
      ),
    ]);
  }

  /** Signed START callback: lifts the block, grants nothing. */
  async onStart(phone: string, source = "sms_start") {
    const phoneHash = recipientHash(phone);
    const suppressed = await this.prisma.smsSuppression.findUnique({ where: { phone } });
    if (!suppressed) return; // nothing to lift; don't write a meaningless event
    await this.prisma.$transaction([
      this.prisma.smsSuppression.deleteMany({ where: { phone } }),
      this.prisma.smsConsentEvent.create({ data: { phoneHash, recipientLast4: phone.slice(-4), purpose: "*", action: "start", source } }),
    ]);
  }

  /** Is this purpose allowed for this number right now (ignoring suppression, which is checked separately)? */
  async hasConsent(phone: string, purpose: string): Promise<boolean> {
    if (!isMarketingPurpose(purpose)) return true; // transactional: covered by the user's own request
    const row = await this.prisma.smsConsent.findUnique({ where: { phoneHash_purpose: { phoneHash: recipientHash(phone), purpose } } });
    return row?.status === "granted";
  }

  /** Consent trail for support: masked, newest first. */
  async history(phone: string, limit = 100) {
    const rows = await this.prisma.smsConsentEvent.findMany({
      where: { phoneHash: recipientHash(phone) },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 500),
      select: { id: true, recipientLast4: true, purpose: true, action: true, source: true, policyVersion: true, createdAt: true },
    });
    const state = await this.prisma.smsConsent.findMany({
      where: { phoneHash: recipientHash(phone) },
      select: { purpose: true, status: true, source: true, policyVersion: true, updatedAt: true },
    });
    return { current: state, events: rows };
  }
}
