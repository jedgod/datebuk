import { BadRequestException, HttpException, HttpStatus, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { randomInt, randomUUID } from "crypto";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { SmsService } from "./sms.service";
import { ConsentService } from "./consent.service";
import { FraudService } from "./fraud.service";
import { deviceHash, ipHash, otpCodeHmac, recipientHash, safeEqualHex } from "./sms-keys";

const E164 = /^\+[1-9]\d{7,14}$/;
const num = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

/** Configurable (DCG_OTP_*). Defaults are proposed policy, not verified DateBuk policy. */
export const otpPolicy = () => ({
  ttlSeconds: num("DCG_OTP_TTL_SECONDS", 300),
  maxAttempts: num("DCG_OTP_MAX_ATTEMPTS", 5),
  resendCooldownSeconds: num("DCG_OTP_RESEND_COOLDOWN_SECONDS", 60),
  perRecipientPerHour: num("DCG_OTP_PER_RECIPIENT_PER_HOUR", 5),
});

export type OtpPurpose = "phone_verify" | "recovery";

const GENERIC_FAIL = "Invalid or expired code";

/**
 * One-time passcodes for phone verification and account recovery.
 *
 *  - 6 digits from a CSPRNG; never stored. Only an HMAC (keyed, bound to the challenge id,
 *    purpose, recipient and user) is kept, so a database copy can't reveal or replay a code,
 *    and a code can't be used for a different purpose, number or account.
 *  - Expires (5 min), single use, at most N attempts - counted by an atomic UPDATE so parallel
 *    guesses can never exceed the limit.
 *  - A new request invalidates the previous challenge; resends are rate-limited (cooldown +
 *    per-recipient hourly cap) under a per-recipient lock so parallel requests can't bypass it;
 *    the fraud service adds recipient/IP/device/user velocity and SMS-pumping detection.
 *  - The code travels only inside the encrypted outbox message and is never logged.
 *  - Failure answers are generic: nothing says whether an account, number or code exists.
 */
@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
    private consent: ConsentService,
    private fraud: FraudService,
    private audit: AuditService,
  ) {}

  async request(p: { purpose: OtpPurpose; userId: string | null; phone: string; ip?: string; deviceId?: string }) {
    if (!E164.test(p.phone)) throw new BadRequestException("Enter your mobile number in international format, e.g. +14155550123");
    const policy = otpPolicy();
    const rh = recipientHash(p.phone);
    const ih = p.ip ? ipHash(p.ip) : null;
    const dh = p.deviceId ? deviceHash(p.deviceId.slice(0, 128)) : null;

    const verdict = await this.fraud.assess({ userId: p.userId, recipientHash: rh, ipHash: ih, deviceHash: dh });
    if (verdict.action !== "allow") {
      throw new HttpException({ message: "Too many requests. Please try again later.", retryAfterSeconds: verdict.retryAfterSeconds }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const id = randomUUID();
    const now = new Date();

    const challenge = await this.prisma.$transaction(async (tx) => {
      // Serialize requests per recipient+purpose so the cooldown and hourly cap can't be raced.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`otp:${p.purpose}:${rh}`}, 0))`;

      const last = await tx.otpChallenge.findFirst({ where: { recipientHash: rh, purpose: p.purpose }, orderBy: { lastSentAt: "desc" } });
      if (last) {
        const wait = policy.resendCooldownSeconds - Math.floor((now.getTime() - last.lastSentAt.getTime()) / 1000);
        if (wait > 0) throw new HttpException({ message: "Please wait before requesting another code.", retryAfterSeconds: wait }, HttpStatus.TOO_MANY_REQUESTS);
      }
      const hourly = await tx.otpChallenge.count({ where: { recipientHash: rh, createdAt: { gte: new Date(now.getTime() - 3_600_000) } } });
      if (hourly >= policy.perRecipientPerHour) {
        throw new HttpException({ message: "Too many codes requested. Try again later.", retryAfterSeconds: 3600 }, HttpStatus.TOO_MANY_REQUESTS);
      }

      // One live challenge at a time.
      await tx.otpChallenge.updateMany({ where: { recipientHash: rh, purpose: p.purpose, consumedAt: null }, data: { consumedAt: now } });

      return tx.otpChallenge.create({
        data: {
          id,
          purpose: p.purpose,
          userId: p.userId,
          recipientHash: rh,
          recipientLast4: p.phone.slice(-4),
          codeHmac: otpCodeHmac({ challengeId: id, purpose: p.purpose, recipientHash: rh, userId: p.userId, code }),
          expiresAt: new Date(now.getTime() + policy.ttlSeconds * 1000),
          maxAttempts: policy.maxAttempts,
          lastSentAt: now,
          ipHash: ih,
          deviceHash: dh,
        },
      });
    }, { timeout: 15_000, maxWait: 10_000 });

    try {
      await this.consent.record({ phone: p.phone, purpose: `otp:${p.purpose}`, action: "granted", source: "user_request" });
      await this.sms.send(
        p.phone,
        `Your DateBuk verification code is ${code}. It expires in ${Math.round(policy.ttlSeconds / 60)} minutes. Never share it with anyone.`,
        { purpose: `otp_${p.purpose}`, userId: p.userId, ref: id, idempotencyKey: `otp:${id}`, ttlSeconds: policy.ttlSeconds },
      );
    } catch (e) {
      // The code never left; void it so it can't be guessed against.
      await this.prisma.otpChallenge.update({ where: { id }, data: { consumedAt: new Date() } });
      if (e instanceof HttpException) throw e;
      throw new ServiceUnavailableException("Couldn't send the code. Please try again.");
    }

    await this.audit.log({ action: "OTP_REQUESTED", actorUserId: p.userId, metadata: { purpose: p.purpose, challengeId: id } }); // never the code or number
    return { challengeId: id, expiresAt: challenge.expiresAt, resendAfterSeconds: policy.resendCooldownSeconds };
  }

  /** Returns the user id the challenge was issued for (null for anonymous purposes), or throws a generic 400. */
  async verify(p: { purpose: OtpPurpose; userId: string | null; phone: string; code: string }): Promise<{ userId: string | null }> {
    if (!E164.test(p.phone) || !/^\d{6}$/.test(p.code ?? "")) throw new BadRequestException(GENERIC_FAIL);
    const rh = recipientHash(p.phone);

    const live = await this.prisma.otpChallenge.findFirst({
      where: { recipientHash: rh, purpose: p.purpose, consumedAt: null, expiresAt: { gt: new Date() }, ...(p.userId ? { userId: p.userId } : {}) },
      orderBy: { createdAt: "desc" },
    });
    if (!live) throw new BadRequestException(GENERIC_FAIL);

    // Atomic attempt counter: the UPDATE only succeeds while attempts < max, so any number of
    // parallel guesses is cut off at exactly maxAttempts comparisons.
    const rows = await this.prisma.$queryRaw<{ attempts: number; maxAttempts: number; codeHmac: string; userId: string | null }[]>`
      UPDATE "OtpChallenge" SET "attempts" = "attempts" + 1
       WHERE "id" = ${live.id} AND "consumedAt" IS NULL AND "attempts" < "maxAttempts"
         AND "expiresAt" > (now() AT TIME ZONE 'UTC')
   RETURNING "attempts","maxAttempts","codeHmac","userId"`;
    const row = rows[0];
    if (!row) throw new BadRequestException(GENERIC_FAIL);

    const expected = otpCodeHmac({ challengeId: live.id, purpose: p.purpose, recipientHash: rh, userId: row.userId, code: p.code });
    if (!safeEqualHex(expected, row.codeHmac)) {
      if (row.attempts >= row.maxAttempts) {
        await this.fraud.recordVerificationFailure({ userId: row.userId, recipientHash: rh, ipHash: live.ipHash, deviceHash: live.deviceHash });
        await this.audit.log({ action: "OTP_EXHAUSTED", actorUserId: row.userId, metadata: { purpose: p.purpose, challengeId: live.id } });
      }
      throw new BadRequestException(GENERIC_FAIL);
    }

    // Single use: exactly one caller can flip consumedAt.
    const consumed = await this.prisma.otpChallenge.updateMany({ where: { id: live.id, consumedAt: null }, data: { consumedAt: new Date() } });
    if (consumed.count !== 1) throw new BadRequestException(GENERIC_FAIL);
    await this.audit.log({ action: "OTP_VERIFIED", actorUserId: row.userId, metadata: { purpose: p.purpose, challengeId: live.id } });
    return { userId: row.userId };
  }
}
