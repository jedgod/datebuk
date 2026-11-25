import { BadRequestException, Injectable } from "@nestjs/common";
import { nanoid } from "nanoid";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { PgBossService } from "../common/pgboss/pgboss.service";
import { newOpaqueToken } from "../common/security/tokens";
import { hashRefreshSecret } from "../common/security/refresh";
import { OtpService } from "../sms/otp.service";

const RECOVERY_TOKEN_MINUTES = 15;
const GENERIC_FAIL = "Invalid or expired code";
const norm = (email: string) => (email ?? "").trim().toLowerCase();

type Ctx = { ip?: string; deviceId?: string; userAgent?: string };

/**
 * Phone verification and SMS-assisted password recovery.
 *
 * Recovery by SMS is deliberately narrow:
 *  - only for ordinary accounts with a VERIFIED phone number. Staff, admin and superadmin accounts are
 *    never recoverable by SMS alone (SMS can be SIM-swapped; privileged recovery stays with the existing
 *    admin-mediated reset), and the answer is identical so the difference can't be probed;
 *  - the request always answers `{ ok: true }` - it never reveals whether an account or phone exists;
 *  - the code is the OTP engine's (expiring, single-use, attempt-limited, bound to account + number + purpose);
 *  - a correct code yields a single-use recovery token (15 minutes) that the EXISTING reset endpoint
 *    consumes - which also revokes every session for the account;
 *  - the account owner is emailed when recovery is requested.
 * No code, token or link is ever logged. No subscription is required for any of it.
 */
@Injectable()
export class RecoveryService {
  constructor(private prisma: PrismaService, private otp: OtpService, private audit: AuditService, private boss: PgBossService) {}

  // ---- phone verification (signed in) ----
  async requestPhoneVerification(userId: string, phone: string, ctx: Ctx) {
    return this.otp.request({ purpose: "phone_verify", userId, phone, ip: ctx.ip, deviceId: ctx.deviceId });
  }

  async confirmPhoneVerification(userId: string, phone: string, code: string) {
    await this.otp.verify({ purpose: "phone_verify", userId, phone, code });
    await this.prisma.user.update({ where: { id: userId }, data: { phoneE164: phone, phoneVerifiedAt: new Date() } });
    await this.audit.log({ action: "PHONE_VERIFIED", actorUserId: userId });
    return { verified: true };
  }

  // ---- recovery (anonymous) ----
  private async eligible(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: norm(email) } });
    if (!user) return null;
    const privileged = user.role !== "USER" || user.isAdmin;
    const blocked = user.accountStatus === "SUSPENDED" || user.accountStatus === "REVOKED";
    if (privileged || blocked || !user.phoneE164 || !user.phoneVerifiedAt) return null;
    return user as typeof user & { phoneE164: string };
  }

  /** Always `{ ok: true }`. */
  async requestRecovery(email: string, ctx: Ctx) {
    try {
      const user = await this.eligible(email);
      if (user) {
        await this.otp.request({ purpose: "recovery", userId: user.id, phone: user.phoneE164, ip: ctx.ip, deviceId: ctx.deviceId });
        await this.boss
          .add("email", {
            to: user.email,
            subject: "Password recovery requested on your DateBuk account",
            text: "Someone asked to recover your account using your verified phone number. If this was you, enter the code we texted you. If not, you can ignore this - your password has not changed.",
          })
          .catch(() => undefined);
        await this.audit.log({ action: "RECOVERY_REQUESTED", actorUserId: user.id, ip: ctx.ip ?? null, userAgent: ctx.userAgent ?? null });
      }
    } catch {
      // Throttled, SMS unavailable, anything: same answer. The attempt is still visible to fraud/audit tooling.
    }
    return { ok: true };
  }

  async verifyRecovery(email: string, code: string, ctx: Ctx) {
    const user = await this.eligible(email);
    if (!user) throw new BadRequestException(GENERIC_FAIL);
    await this.otp.verify({ purpose: "recovery", userId: user.id, phone: user.phoneE164, code }); // generic 400 on failure

    // Same token format and table the existing reset flow reads, so reset-password stays the single
    // place that sets the password, marks the token used, and revokes all sessions.
    const tokenId = nanoid(12);
    const secret = newOpaqueToken();
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenId, tokenHash: hashRefreshSecret(secret), expiresAt: new Date(Date.now() + RECOVERY_TOKEN_MINUTES * 60_000) },
    });
    await this.audit.log({ action: "RECOVERY_TOKEN_ISSUED", actorUserId: user.id, ip: ctx.ip ?? null, userAgent: ctx.userAgent ?? null });
    return { resetToken: `${tokenId}.${secret}`, expiresInSeconds: RECOVERY_TOKEN_MINUTES * 60 };
  }
}
