import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, HttpException, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { hashSecret, verifySecret } from "../common/security/hash";
import { newOpaqueToken } from "../common/security/tokens";
import { hashRefreshSecret, timingSafeEqualHex } from "../common/security/refresh";
import { PgBossService } from "../common/pgboss/pgboss.service";
import { IpIntelligenceService } from "../security/ip-intelligence.service";
import { RiskEngineService } from "../security/risk-engine.service";
import { OtpService } from "../staff/otp.service";
import { nanoid } from "nanoid";
import * as speakeasy from "speakeasy";

const minutes = (m: number) => m * 60 * 1000;
const hours = (h: number) => h * 60 * 60 * 1000;
const days = (d: number) => d * 24 * 60 * 60 * 1000;

// Absolute cap on a refresh-token session's lifetime, independent of rotation. A stolen
// refresh token can be replayed at most until this deadline, even if never explicitly revoked.
const SESSION_ABSOLUTE_LIFETIME_MS = days(30);
export const STEP_UP_TTL_SECONDS = 300;
// Staff/admin accounts get a materially shorter leash on both dimensions — a compromised
// staff session is worth far more to an attacker than a compromised dater session, and
// staff are expected to be re-authenticating regularly during a work session anyway.
const STAFF_SESSION_ABSOLUTE_LIFETIME_MS = hours(12);
// Idle timeout: previously nothing checked how long it had been since a session was last
// used to refresh — only the absolute cap above, so a session refreshed once a month
// would stay valid the full 30 days regardless of activity. A session's own createdAt is
// a correct idle proxy: rotation replaces it with a fresh row on every use, so an
// unrotated session's createdAt is exactly "when this refresh token was last exercised."
const SESSION_IDLE_TIMEOUT_MS = days(14);
const STAFF_SESSION_IDLE_TIMEOUT_MS = hours(4);

type IpIntel = { country?: string; city?: string; isVpn: boolean; isProxy: boolean; isDatacenter: boolean; isp?: string; lookupFailed: boolean };
type RiskTier = "low" | "medium" | "high";

@Injectable()
export class AuthService {
  // Finally gives the long-dead RISK_THRESHOLD_SMS/RISK_THRESHOLD_BLOCK/SHADOW_MODE env
  // vars (present in .env.example since early in this project, never read anywhere) real
  // meaning: SMS is reused here as the low/medium boundary, BLOCK as the medium/high
  // boundary. SHADOW_MODE, when true, still computes and records risk tiers but never
  // enforces them — useful for tuning thresholds against real traffic before trusting them.
  private readonly riskMediumThreshold = Number(process.env.RISK_THRESHOLD_SMS) || 40;
  private readonly riskHighThreshold = Number(process.env.RISK_THRESHOLD_BLOCK) || 80;
  private readonly shadowMode = String(process.env.SHADOW_MODE).toLowerCase() === "true";

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService,
    private pgBoss: PgBossService,
    private ipIntelligence: IpIntelligenceService,
    private riskEngine: RiskEngineService,
    private otp: OtpService,
  ) {}

  private classifyIpRisk(score: number): RiskTier {
    if (score >= this.riskHighThreshold) return "high";
    if (score >= this.riskMediumThreshold) return "medium";
    return "low";
  }

  // Records an elevated IP-risk signal (medium or high tier) without ever suspending the
  // account or revoking sessions on its own — VPN/proxy/datacenter heuristics have real
  // false positives (corporate VPNs, Apple Private Relay, campus networks, safety-
  // motivated VPN use), so a heuristic score alone only ever "restricts sensitive actions
  // and sends to review" (high) or "requires step-up" (medium), never suspends outright.
  // Only a confirmed signal (IP blacklist hit) still suspends — see suspendConfirmedAbuse.
  private async flagIpRisk(params: {
    userId: string;
    ip: string;
    eventType: string;
    intel: IpIntel;
    tier: Exclude<RiskTier, "low">;
    meta?: { userAgent?: string };
  }) {
    const score = this.riskEngine.calculateInitialRisk(params.intel);
    // In shadow mode this is recorded as "shadow" rather than "restrict"/"challenge" so
    // UsersService.assertNotUnderRiskReview (which only looks for decisionApplied ===
    // "restrict") never actually gates anything on it — shadow mode observes, it doesn't act.
    const decisionApplied = this.shadowMode ? "shadow" : params.tier === "high" ? "restrict" : "challenge";

    const fraudEvent = await this.prisma.fraudEvent.create({
      data: {
        userId: params.userId,
        ip: params.ip,
        eventType: params.eventType,
        riskScore: score,
        riskLevel: params.tier,
        decisionApplied,
        details: {
          ...params.intel,
          provider: "ipapi.is",
          assessedAt: new Date().toISOString(),
          shadowMode: this.shadowMode,
          thresholds: { medium: this.riskMediumThreshold, high: this.riskHighThreshold },
        },
      },
    });

    if (params.tier === "high" && !this.shadowMode) {
      await this.prisma.moderatorQueue.create({
        data: {
          fraudEventId: fraudEvent.id,
          userId: params.userId,
          reason: `Elevated risk signal (${params.eventType}): score ${score}, isp ${params.intel.isp ?? "unknown"}, country ${params.intel.country ?? "unknown"}`,
          priority: 2,
        },
      });
    }

    await this.audit.log({
      action: "AUTH_IP_RISK_FLAGGED",
      actorUserId: params.userId,
      ip: params.ip,
      userAgent: params.meta?.userAgent ?? null,
      metadata: { eventType: params.eventType, riskScore: score, riskTier: params.tier, shadowMode: this.shadowMode },
    });

    return fraudEvent;
  }

  private signAccess(userId: string, email: string) {
    return this.jwt.sign(
      { sub: userId, email },
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "15m",
        issuer: "datebuk-api",
        audience: "datebuk-calling",
      },
    );
  }

  /**
   * Verifies the temp-login JWT and returns the subject it actually attests to. Callers
   * must use this returned value as the authoritative user id for the rest of the OTP/
   * backup-code flow — never a client-supplied identity (e.g. a request header) — since
   * the whole point of the temp token is to be the one thing an attacker can't forge.
   */
  verifyTemporaryLoginToken(token: string, expectedPurpose?: string): string {
    try {
      const payload = this.jwt.verify<{ sub: string; temp?: boolean; purpose?: string }>(token);
      if (!payload.temp || !payload.sub) throw new Error("invalid temporary token");
      // The OTP-verification tempToken and the MFA-setup tempToken must not be
      // interchangeable — each only authorizes the flow it was issued for.
      if (expectedPurpose && payload.purpose !== expectedPurpose) throw new Error("wrong token purpose");
      return payload.sub;
    } catch {
      throw new UnauthorizedException("Invalid or expired temporary login token");
    }
  }

  /**
   * Step-up authentication for sensitive staff/admin operations (e.g. managing provider
   * credentials). Re-verifies a fresh TOTP code for the already-signed-in user and returns a
   * short-lived token that is valid ONLY as a step-up proof: it carries `temp: true`, so
   * JwtStrategy rejects it as a session credential, and it is bound to this user's id.
   * Failed codes count toward the same progressive lockout as login.
   */
  async issueStepUp(userId: string, code: string, meta?: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { twoFactorAuth: true } });
    if (!user) throw new UnauthorizedException();
    if (!this.isStaffOrAdmin(user)) throw new ForbiddenException("Step-up is only available to staff accounts");
    if (!user.twoFactorAuth?.enabled) throw new ForbiddenException("Set up two-factor authentication first");
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      await this.audit.log({ action: "AUTH_LOCKOUT_BLOCK", actorUserId: userId, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
      throw new HttpException("Account temporarily locked. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }
    const valid = typeof code === "string" && /^\d{6}$/.test(code) && (await this.otp.verifyOtp(userId, code));
    if (!valid) {
      await this.onFailedLogin(userId, meta);
      await this.audit.log({ action: "STEP_UP_FAILED", actorUserId: userId, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
      throw new UnauthorizedException("Invalid code");
    }
    await this.audit.log({ action: "STEP_UP_GRANTED", actorUserId: userId, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
    const ttl = STEP_UP_TTL_SECONDS;
    return {
      stepUpToken: this.jwt.sign({ sub: userId, temp: true, purpose: "step-up" }, { expiresIn: ttl }),
      expiresInSeconds: ttl,
    };
  }

  /** True only for an unexpired step-up token issued to exactly this user. */
  verifyStepUpToken(token: string | undefined, userId: string): boolean {
    if (!token) return false;
    try {
      const p = this.jwt.verify<{ sub?: string; temp?: boolean; purpose?: string }>(token);
      return p.temp === true && p.purpose === "step-up" && p.sub === userId;
    } catch {
      return false;
    }
  }

  private isStaffOrAdmin(user: { role: string; isAdmin: boolean }): boolean {
    return user.role !== "USER" || user.isAdmin;
  }

  /**
   * `inheritExpiresAt` carries the absolute expiry forward across refresh-token rotation.
   * Without it, every rotation would hand the session a fresh 30-day window, so a token
   * refreshed periodically would never actually hit the absolute cap. Only a brand-new
   * login (signup/login/verifyOtp/verifyBackupCode) starts a fresh clock — `isStaff`
   * picks which one, but only matters on that first issuance; rotation always inherits.
   */
  private async issueRefreshSession(
    userId: string,
    meta?: { userAgent?: string; ip?: string },
    inheritExpiresAt?: Date,
    isStaff = false,
  ) {
    const secret = newOpaqueToken();
    const refreshTokenId = nanoid(12); // short + indexed
    const secretHash = hashRefreshSecret(secret);
    const lifetime = isStaff ? STAFF_SESSION_ABSOLUTE_LIFETIME_MS : SESSION_ABSOLUTE_LIFETIME_MS;

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenId,
        refreshSecretHash: secretHash,
        userAgent: meta?.userAgent,
        ip: meta?.ip,
        expiresAt: inheritExpiresAt ?? new Date(Date.now() + lifetime),
      },
    });

    // Token format: "<refreshTokenId>.<secret>"
    return { refreshToken: `${session.refreshTokenId}.${secret}`, sessionId: session.id, refreshTokenId: session.refreshTokenId };
  }

  private async enqueueEmail(to: string, subject: string, text: string) {
    await this.pgBoss.add("email", { to, subject, text }, { attempts: 5 });
  }

  private lockoutWindowMs(_failCount: number, lockoutCount: number) {
    const base = [2, 5, 15, 30, 60][Math.min(lockoutCount, 4)];
    return minutes(base);
  }

  private async onFailedLogin(userId: string, meta?: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const failedLoginCount = user.failedLoginCount + 1;
    let lockoutUntil = user.lockoutUntil;
    let lockoutCount = user.lockoutCount;

    if (failedLoginCount >= 5) {
      lockoutCount = lockoutCount + 1;
      lockoutUntil = new Date(Date.now() + this.lockoutWindowMs(failedLoginCount, lockoutCount - 1));
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount, lockoutUntil, lockoutCount },
    });

    await this.audit.log({
      action: "AUTH_LOGIN_FAILED",
      actorUserId: userId,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
      metadata: { failedLoginCount, lockoutUntil },
    });
  }

  private async onSuccessfulLogin(userId: string, meta?: { ip?: string; userAgent?: string }) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockoutUntil: null },
    });
    await this.audit.log({
      action: "AUTH_LOGIN_SUCCESS",
      actorUserId: userId,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
    });
  }

  async signup(email: string, password: string, displayName: string, dateOfBirth: string, meta?: { userAgent?: string; ip?: string }) {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedName = (displayName || "").trim();
    const normalizedPassword = (password || "").trim();

    if (!normalizedEmail || !normalizedName || !normalizedPassword) {
      throw new BadRequestException("Email, password, and display name are required");
    }

    // SECURITY: age is derived server-side from the supplied date of birth,
    // never trusted as a raw client-sent integer. This is the platform's
    // only age gate for a dating product, so it must be enforced here
    // regardless of what any client (web/mobile) does or doesn't validate.
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime()) || dob > new Date() || dob.getFullYear() < 1900) {
      throw new BadRequestException("A valid date of birth is required");
    }
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) {
      throw new BadRequestException("You must be at least 18 years old to create an account");
    }

    const exists = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });
    if (exists) throw new BadRequestException("Email already in use");

    const ipCheck = meta?.ip ? await this.checkRegistrationIp(meta.ip, normalizedEmail, meta) : null;
    const intel = ipCheck?.intel ?? null;

    const passwordHash = await hashSecret(normalizedPassword);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: passwordHash,
        // accountStatus defaults to PENDING (a value only the staff-onboarding flow ever
        // advances past); left unset here, no regular user could ever pass the signaling
        // service's `accountStatus === "ACTIVE"` check and every call would be rejected.
        accountStatus: "ACTIVE",
        // Real geography detected from the registration IP, not a client-supplied claim —
        // used for fraud review and as a starting point for location-based matching.
        locationCountry: intel?.country && intel.country !== "Unknown" ? intel.country : undefined,
        locationCity: intel?.city,
        age,
        dateOfBirth: dob,
        profile: { create: { displayName: normalizedName, photos: [], age } },
      },
    });

    // Medium/high IP-risk signals are recorded against the account now that it exists —
    // never blocking signup itself on a heuristic alone (see checkRegistrationIp).
    if (ipCheck && ipCheck.tier !== "low" && meta?.ip) {
      await this.flagIpRisk({ userId: user.id, ip: meta.ip, eventType: "signup_risk_flagged", intel: ipCheck.intel, tier: ipCheck.tier, meta });
    }

    const { refreshToken, sessionId, refreshTokenId } = await this.issueRefreshSession(user.id, meta);
    await this.sendEmailVerification(user.id);
    await this.audit.log({ action: "AUTH_SIGNUP", actorUserId: user.id, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });

    return { userId: user.id, accessToken: this.signAccess(user.id, user.email), refreshToken, refreshTokenId, currentSessionId: sessionId };
  }

  /**
   * Blocks registration only for a confirmed-bad-actor IP blacklist hit — a non-heuristic
   * signal safe to act on immediately. VPN/proxy/datacenter heuristics no longer block
   * registration outright (they have real false positives: corporate VPNs, Apple Private
   * Relay, campus networks, safety-motivated VPN use) — instead they're scored into a
   * risk tier and recorded against the account once it exists (see signup()), following
   * the same low/medium/high model used at login. Fails OPEN only when the intelligence
   * lookup itself couldn't be completed (no API key / provider outage): we'd rather let a
   * legitimate signup through during a third-party hiccup than turn "the geo API is down"
   * into "nobody can register." A failed lookup is never treated as "verified clean" for
   * scoring, only as "we don't know" (tier "low", nothing recorded).
   */
  private async checkRegistrationIp(ip: string, email: string, meta?: { userAgent?: string }): Promise<{ intel: IpIntel; tier: RiskTier }> {
    const [blacklisted, intel] = await Promise.all([
      this.ipIntelligence.isBlacklisted(ip),
      this.ipIntelligence.getIpIntelligence(ip),
    ]);

    if (blacklisted) {
      await this.prisma.fraudEvent.create({
        data: {
          ip,
          eventType: "signup_blocked",
          riskScore: 100,
          riskLevel: "critical",
          decisionApplied: "block",
          details: { email, blacklisted, ...intel },
        },
      });
      await this.audit.log({
        action: "AUTH_SIGNUP_BLOCKED",
        ip,
        userAgent: meta?.userAgent ?? null,
        metadata: { email, blacklisted, country: intel.country },
      });
      throw new ForbiddenException(
        "Registration isn't available from this connection. Please contact support if you believe this is a mistake.",
      );
    }

    const tier = intel.lookupFailed ? "low" : this.classifyIpRisk(this.riskEngine.calculateInitialRisk(intel));
    return { intel, tier };
  }

  async login(email: string, password: string, meta?: { userAgent?: string; ip?: string }) {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedPassword = (password || "").trim();

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      include: { twoFactorAuth: true },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      await this.audit.log({ action: "AUTH_LOCKOUT_BLOCK", actorUserId: user.id, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
      throw new HttpException("Account temporarily locked. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    const ok = await verifySecret(normalizedPassword, user.password);
    if (!ok) {
      await this.onFailedLogin(user.id, meta);
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.onSuccessfulLogin(user.id, meta);

    // Only act on account-status-specific outcomes (suspended, VPN block) *after* the
    // password has been verified. Checking these first — or suspending before this point —
    // would let anyone who merely knows an email address get a real user's account
    // suspended by attempting a login over a VPN, without ever proving they own it.
    if (user.accountStatus === "SUSPENDED" || user.accountStatus === "REVOKED") {
      await this.audit.log({ action: "AUTH_LOGIN_BLOCKED_SUSPENDED", actorUserId: user.id, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
      throw new ForbiddenException("Your account has been suspended. Contact support if you believe this is a mistake.");
    }

    if (meta?.ip) {
      // Confirmed-bad-actor list only — still suspends immediately, since this isn't a
      // heuristic. VPN/proxy/datacenter signals below never suspend on their own anymore.
      const blacklisted = await this.ipIntelligence.isBlacklisted(meta.ip);
      if (blacklisted) {
        const intel = await this.ipIntelligence.getIpIntelligence(meta.ip);
        await this.suspendConfirmedAbuse(user.id, meta.ip, intel, meta, "IP address is on the confirmed-abuse blacklist");
        throw new ForbiddenException(
          "Your account has been suspended pending review. Contact support if you believe this is a mistake.",
        );
      }

      const intel = await this.ipIntelligence.getIpIntelligence(meta.ip);
      if (!intel.lookupFailed) {
        const tier = this.classifyIpRisk(this.riskEngine.calculateInitialRisk(intel));
        if (tier !== "low") {
          // Login is allowed to proceed either way — "high" flags the account so
          // UsersService.assertNotUnderRiskReview restricts sensitive actions (messaging,
          // calling, concierge, verification) until a human clears it; "medium" is only
          // recorded. Neither suspends the session or blocks sign-in, unlike before.
          await this.flagIpRisk({ userId: user.id, ip: meta.ip, eventType: "login_risk_flagged", intel, tier, meta });
        }
      }
    }

    // Staff and admin accounts must have MFA enabled — previously this was purely
    // opt-in (a staffer who never visited /2fa/setup logged in with just a password,
    // same as any dater). Doesn't apply to already-enabled accounts below; this only
    // catches the case where the role requires MFA but it was never set up. No token is
    // issued here — the temp token only authorizes the setup endpoints, mirroring how
    // the OTP-verification tempToken below only authorizes /auth/verify-otp.
    const mfaRequiredForRole = user.role !== "USER" || user.isAdmin;
    if (mfaRequiredForRole && !user.twoFactorAuth?.enabled) {
      const tempToken = this.jwt.sign(
        { sub: user.id, email: user.email, temp: true, purpose: "mfa-setup" },
        { expiresIn: "10m" },
      );
      await this.audit.log({ action: "AUTH_MFA_SETUP_REQUIRED", actorUserId: user.id, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        tempToken,
        mustSetupMfa: true,
        message: "Multi-factor authentication setup is required for this account before you can sign in",
      };
    }

    // Check if 2FA is enabled
    if (user.twoFactorAuth?.enabled) {
      // Return temporary token for OTP verification
      const tempToken = this.jwt.sign(
        { sub: user.id, email: user.email, temp: true },
        { expiresIn: "5m" }
      );

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        tempToken,
        requiresOtp: true,
        message: "Please verify with your authenticator app",
      };
    }

    // No 2FA - issue full tokens
    const { refreshToken, sessionId, refreshTokenId } = await this.issueRefreshSession(user.id, meta, undefined, this.isStaffOrAdmin(user));
    return {
      userId: user.id,
      accessToken: this.signAccess(user.id, user.email),
      refreshToken,
      refreshTokenId,
      currentSessionId: sessionId,
      emailVerified: user.emailVerified,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.isAdmin ? "ADMIN" : user.role,
        isAdmin: user.isAdmin,
      },
    };
  }

  async refresh(refreshToken: string, meta?: { userAgent?: string; ip?: string }) {
    const [refreshTokenId, secret] = (refreshToken || "").split(".", 2);
    if (!refreshTokenId || !secret) throw new UnauthorizedException("Invalid refresh token");

    const session = await this.prisma.session.findUnique({ where: { refreshTokenId } });
    if (!session) throw new UnauthorizedException("Invalid refresh token");

    if (session.revokedAt || session.rotatedAt) {
      await this.prisma.session.update({ where: { id: session.id }, data: { reuseDetectedAt: new Date() } });
      await this.logoutAll(session.userId);
      await this.audit.log({
        action: "AUTH_REFRESH_REUSE_DETECTED",
        actorUserId: session.userId,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
        metadata: { refreshTokenId },
      });
      throw new UnauthorizedException("Refresh token reuse detected. Please sign in again.");
    }

    const computed = hashRefreshSecret(secret);
    const ok = timingSafeEqualHex(computed, session.refreshSecretHash);
    if (!ok) throw new UnauthorizedException("Invalid refresh token");

    if (session.expiresAt && session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Session expired. Please sign in again.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException("Invalid refresh token");

    // Idle timeout: an active (never-rotated) session's own createdAt is exactly "when
    // this refresh token was last exercised" — rotation always replaces it with a fresh
    // row, so a session that's still sitting unrotated has, by definition, gone unused
    // since it was issued. Previously nothing checked this — only the absolute cap below,
    // so a token refreshed once a month stayed valid the full 30 days regardless of gaps.
    const isStaff = this.isStaffOrAdmin(user);
    const idleTimeoutMs = isStaff ? STAFF_SESSION_IDLE_TIMEOUT_MS : SESSION_IDLE_TIMEOUT_MS;
    if (Date.now() - session.createdAt.getTime() > idleTimeoutMs) {
      await this.audit.log({
        action: "AUTH_REFRESH_IDLE_TIMEOUT",
        actorUserId: user.id,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
        metadata: { sessionId: session.id, idleMs: Date.now() - session.createdAt.getTime() },
      });
      throw new UnauthorizedException("Session expired from inactivity. Please sign in again.");
    }

    const { refreshToken: newRefresh, sessionId: newSessionId, refreshTokenId: newRefreshTokenId } = await this.issueRefreshSession(
      user.id,
      meta,
      session.expiresAt ?? undefined,
    );
    await this.prisma.session.update({
      where: { id: session.id },
      data: { rotatedAt: new Date(), replacedBySessionId: newSessionId },
    });

    await this.audit.log({
      action: "AUTH_REFRESH_ROTATE",
      actorUserId: user.id,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
      metadata: { oldSessionId: session.id, newSessionId },
    });

    return { accessToken: this.signAccess(user.id, user.email), refreshToken: newRefresh, refreshTokenId: newRefreshTokenId, currentSessionId: newSessionId };
  }

  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log({ action: "AUTH_LOGOUT_ALL", actorUserId: userId });
    return { ok: true };
  }

  /**
   * Suspends an account on a CONFIRMED signal only (IP blacklist hit) — never on a bare
   * VPN/proxy/datacenter heuristic anymore, since those have real false positives
   * (corporate VPNs, Apple Private Relay, campus networks, or someone in a country where a
   * VPN is a personal-safety necessity). See flagIpRisk for the non-confirmed, tiered path.
   * Still not a hard delete: suspends, revokes every session, and routes into the same
   * FraudEvent/ModeratorQueue review flow — a human confirms before anything is permanent,
   * and FraudEventTracker.provideFeedback('legitimate') reactivates the account if this
   * was a mistake (e.g. a shared/reused IP later added to the blacklist in error).
   */
  private async suspendConfirmedAbuse(
    userId: string,
    ip: string,
    intel: { country?: string; city?: string; isVpn: boolean; isProxy: boolean; isDatacenter: boolean; isp?: string },
    meta: { userAgent?: string } | undefined,
    reason: string,
  ) {
    await this.prisma.user.update({ where: { id: userId }, data: { accountStatus: "SUSPENDED" } });
    await this.logoutAll(userId);

    const fraudEvent = await this.prisma.fraudEvent.create({
      data: {
        userId,
        ip,
        eventType: "login_blacklisted_ip",
        riskScore: 100,
        riskLevel: "critical",
        decisionApplied: "block",
        details: { ...intel, reason },
      },
    });

    await this.prisma.moderatorQueue.create({
      data: {
        fraudEventId: fraudEvent.id,
        userId,
        reason: `Account auto-suspended: ${reason}`,
        priority: 1,
      },
    });

    await this.audit.log({
      action: "AUTH_ACCOUNT_SUSPENDED_CONFIRMED_ABUSE",
      actorUserId: userId,
      ip,
      userAgent: meta?.userAgent ?? null,
      metadata: { reason, isVpn: intel.isVpn, isProxy: intel.isProxy, isDatacenter: intel.isDatacenter, country: intel.country },
    });
  }

  async sendEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");

    const tokenId = nanoid(12);
    const secret = newOpaqueToken();
    const tokenHash = hashRefreshSecret(secret);
    const expiresAt = new Date(Date.now() + days(2));

    await this.prisma.emailVerificationToken.create({ data: { userId, tokenId, tokenHash, expiresAt } });

    const raw = `${tokenId}.${secret}`;
    const url = `${process.env.WEB_URL || "http://localhost:3000"}/verify-email?token=${encodeURIComponent(raw)}`;
    await this.enqueueEmail(user.email, "Verify your DateBuk email", `Click to verify: ${url}`);

    await this.audit.log({ action: "AUTH_EMAIL_VERIFY_SENT", actorUserId: userId, metadata: { email: user.email } });
    return { ok: true };
  }

  async verifyEmail(token: string) {
    const [tokenId, secret] = (token || "").split(".", 2);

    if (tokenId && secret) {
      const record = await this.prisma.emailVerificationToken.findUnique({ where: { tokenId } });
      const valid = record && !record.usedAt && record.expiresAt > new Date()
        && timingSafeEqualHex(hashRefreshSecret(secret), record.tokenHash);
      if (!valid) throw new BadRequestException("Invalid or expired token");

      await this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      await this.prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
      await this.audit.log({ action: "AUTH_EMAIL_VERIFIED", actorUserId: record.userId });
      return { ok: true };
    }

    // Legacy fallback for bcrypt-hashed tokens issued before tokenId existed. Bounded
    // by their own short expiry, so this path and its O(n) scan disappear on their own.
    const records = await this.prisma.emailVerificationToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() }, tokenId: null },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    for (const r of records) {
      const ok = await verifySecret(token, r.tokenHash);
      if (!ok) continue;
      await this.prisma.emailVerificationToken.update({ where: { id: r.id }, data: { usedAt: new Date() } });
      await this.prisma.user.update({ where: { id: r.userId }, data: { emailVerified: true } });
      await this.audit.log({ action: "AUTH_EMAIL_VERIFIED", actorUserId: r.userId });
      return { ok: true };
    }
    throw new BadRequestException("Invalid or expired token");
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { ok: true };

    const tokenId = nanoid(12);
    const secret = newOpaqueToken();
    const tokenHash = hashRefreshSecret(secret);
    const expiresAt = new Date(Date.now() + minutes(30));

    await this.prisma.passwordResetToken.create({ data: { userId: user.id, tokenId, tokenHash, expiresAt } });

    const raw = `${tokenId}.${secret}`;
    const url = `${process.env.WEB_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(raw)}`;
    await this.enqueueEmail(user.email, "Reset your DateBuk password", `Reset link (30 min): ${url}`);

    await this.audit.log({ action: "AUTH_PASSWORD_RESET_REQUESTED", actorUserId: user.id });
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) throw new BadRequestException("Password too short");

    const [tokenId, secret] = (token || "").split(".", 2);

    if (tokenId && secret) {
      const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenId } });
      const valid = record && !record.usedAt && record.expiresAt > new Date()
        && timingSafeEqualHex(hashRefreshSecret(secret), record.tokenHash);
      if (!valid) throw new BadRequestException("Invalid or expired token");

      const passwordHash = await hashSecret(newPassword);
      await this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      await this.prisma.user.update({ where: { id: record.userId }, data: { password: passwordHash } });

      await this.logoutAll(record.userId);
      await this.audit.log({ action: "AUTH_PASSWORD_RESET_COMPLETED", actorUserId: record.userId });
      return { ok: true };
    }

    // Legacy fallback for bcrypt-hashed tokens issued before tokenId existed.
    const records = await this.prisma.passwordResetToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() }, tokenId: null },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    for (const r of records) {
      const ok = await verifySecret(token, r.tokenHash);
      if (!ok) continue;

      const passwordHash = await hashSecret(newPassword);
      await this.prisma.passwordResetToken.update({ where: { id: r.id }, data: { usedAt: new Date() } });
      await this.prisma.user.update({ where: { id: r.userId }, data: { password: passwordHash } });

      await this.logoutAll(r.userId);
      await this.audit.log({ action: "AUTH_PASSWORD_RESET_COMPLETED", actorUserId: r.userId });

      return { ok: true };
    }

    throw new BadRequestException("Invalid or expired token");
  }

  // Re-confirms the caller's own password while already signed in (e.g. the Explore
  // gallery's password gate). Deliberately does not issue any token or session — this is
  // a step-up confirmation of an already-authenticated user, not a login.
  async verifyCurrentPassword(userId: string, password: string, meta?: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      await this.audit.log({ action: "AUTH_LOCKOUT_BLOCK", actorUserId: userId, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
      throw new HttpException("Account temporarily locked. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    const valid = await verifySecret(password, user.password);
    if (!valid) {
      await this.onFailedLogin(userId, meta);
      await this.audit.log({ action: "AUTH_PASSWORD_VERIFY_FAILED", actorUserId: userId, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
      throw new UnauthorizedException("Invalid password");
    }

    return { ok: true };
  }

  /**
   * Verify OTP during login
   * Called after password verification when 2FA is enabled
   */
  async verifyOtp(userId: string, otpCode: string, meta?: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorAuth: true },
    });

    if (!user) throw new UnauthorizedException("User not found");
    if (!user.twoFactorAuth?.enabled) throw new BadRequestException("2FA not enabled for this user");

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      await this.audit.log({ action: "AUTH_LOCKOUT_BLOCK", actorUserId: userId, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
      throw new HttpException("Account temporarily locked. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    // The stored secret is AES-encrypted; OtpService decrypts it before verifying. Passing the
    // stored value straight to speakeasy (as this used to) meant no real authenticator code could
    // ever validate, locking every MFA-protected staff account out at login.
    const isValid = await this.otp.verifyOtp(userId, otpCode);

    if (!isValid) {
      await this.onFailedLogin(userId, meta);
      await this.audit.log({
        action: "AUTH_OTP_FAILED",
        actorUserId: userId,
      });
      throw new UnauthorizedException("Invalid OTP code");
    }

    await this.onSuccessfulLogin(userId, meta);

    // Update last used time
    await this.prisma.twoFactorAuth.update({
      where: { userId },
      data: { lastUsedAt: new Date() },
    });

    // Issue full tokens
    const { refreshToken, sessionId, refreshTokenId } = await this.issueRefreshSession(userId, meta, undefined, this.isStaffOrAdmin(user));
    return {
      userId,
      email: user.email,
      accessToken: this.signAccess(userId, user.email),
      refreshToken,
      refreshTokenId,
      currentSessionId: sessionId,
      mustChangePassword: user.mustChangePassword,
    };
  }

  /**
   * Verify backup code during login
   */
  async verifyBackupCode(userId: string, backupCode: string, meta?: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorAuth: true },
    });

    if (!user) throw new UnauthorizedException("User not found");
    if (!user.twoFactorAuth?.enabled) throw new BadRequestException("2FA not enabled");

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      await this.audit.log({ action: "AUTH_LOCKOUT_BLOCK", actorUserId: userId, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
      throw new HttpException("Account temporarily locked. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    let matchedCode: string | null = null;
    for (const hash of user.twoFactorAuth.backupCodes) {
      if (await verifySecret(backupCode, hash)) {
        matchedCode = hash;
        break;
      }
    }
    if (!matchedCode) {
      await this.onFailedLogin(userId, meta);
      await this.audit.log({ action: "AUTH_BACKUP_CODE_FAILED", actorUserId: userId, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });
      throw new UnauthorizedException("Invalid backup code");
    }

    await this.onSuccessfulLogin(userId, meta);

    // Remove used backup code
    const updatedCodes = user.twoFactorAuth.backupCodes.filter(c => c !== matchedCode);
    await this.prisma.twoFactorAuth.update({
      where: { userId },
      data: { backupCodes: updatedCodes },
    });

    // Issue full tokens
    const { refreshToken, sessionId, refreshTokenId } = await this.issueRefreshSession(userId, meta, undefined, this.isStaffOrAdmin(user));
    return {
      userId,
      email: user.email,
      accessToken: this.signAccess(userId, user.email),
      refreshToken,
      refreshTokenId,
      currentSessionId: sessionId,
      mustChangePassword: user.mustChangePassword,
    };
  }

  /**
   * First step of the forced MFA-setup flow a staff/admin account lands in when it has
   * no MFA configured yet (see the mustSetupMfa branch in login()). Scoped to the
   * "mfa-setup" tempToken only — cannot be reached with a real session token, so this
   * generates a QR/secret but does not enable anything yet.
   */
  async beginMfaSetup(tempToken: string) {
    const userId = this.verifyTemporaryLoginToken(tempToken, "mfa-setup");
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.otp.generateTotpSecret(userId, user.email);
  }

  /**
   * Second step: verifies the first OTP against the secret generated above and, only on
   * success, actually enables TwoFactorAuth and issues real tokens — mirroring the tail
   * of verifyOtp/verifyBackupCode above. A staff/admin account can't get a session token
   * any other way until this succeeds once.
   */
  async completeMfaSetup(
    tempToken: string,
    secret: string,
    otpToken: string,
    backupCodes: string[],
    meta?: { ip?: string; userAgent?: string },
  ) {
    const userId = this.verifyTemporaryLoginToken(tempToken, "mfa-setup");
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    await this.otp.enableTotp(userId, secret, otpToken, backupCodes);
    await this.audit.log({ action: "AUTH_MFA_SETUP_COMPLETED", actorUserId: userId, ip: meta?.ip ?? null, userAgent: meta?.userAgent ?? null });

    // Anything that logged in before MFA was configured — including, worst case, an
    // attacker who had the password and is exactly why this account's role requires MFA
    // — loses access the moment setup completes, rather than staying valid indefinitely.
    await this.logoutAll(userId);

    const { refreshToken, sessionId, refreshTokenId } = await this.issueRefreshSession(userId, meta, undefined, this.isStaffOrAdmin(user));
    return {
      userId,
      email: user.email,
      accessToken: this.signAccess(userId, user.email),
      refreshToken,
      refreshTokenId,
      currentSessionId: sessionId,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.isAdmin ? "ADMIN" : user.role,
        isAdmin: user.isAdmin,
      },
    };
  }
}
