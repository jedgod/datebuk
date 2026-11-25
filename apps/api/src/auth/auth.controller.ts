import { BadRequestException, Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { LoginDto, SignupDto, RefreshDto, RequestResetDto, ResetDto, VerifyEmailDto } from "./dto";
import { JwtAuthGuard } from "./jwt.guard";

const REFRESH_COOKIE_NAME = "dp_refresh";
const REFRESH_COOKIE_PATH = "/api/auth";
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // mirrors SESSION_ABSOLUTE_LIFETIME_MS

function setRefreshCookie(res: Response, refreshToken: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProd,
    // Cross-subdomain deployments (api.example.com / app.example.com) are cross-site
    // for SameSite purposes, so production needs None+Secure; local dev (same "site":
    // localhost, different ports) works fine with Lax and doesn't require HTTPS.
    sameSite: isProd ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

// Everywhere else, the client sends its refresh token explicitly in the request body —
// the cookie is a fallback only. That fallback is the one cookie-authenticated *mutating*
// endpoint in the API (it rotates the session on every call), and CORS alone doesn't stop
// a plain cross-site HTML form POST from reaching it — CORS only blocks the attacker's
// page from reading the JSON response, not from sending the request and having the
// browser attach the cookie. Only enforced on the cookie-only path; a request that
// already supplied its own token in the body needs no Origin check.
function assertTrustedOrigin(req: Request) {
  const trusted = (process.env.WEB_URL || "http://localhost:3000").replace(/\/$/, "");
  const origin = (req.headers.origin || req.headers.referer || "").toString().replace(/\/$/, "");
  const originHost = origin.split("/").slice(0, 3).join("/"); // scheme://host[:port] only
  if (!origin || originHost !== trusted) {
    throw new BadRequestException("Refresh token is required");
  }
}

function clearRefreshCookie(res: Response) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
  });
}

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("signup")
  async signup(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: SignupDto) {
    const result = await this.auth.signup(dto.email, dto.password, dto.displayName, dto.dateOfBirth, { userAgent: req.headers["user-agent"], ip: req.ip });
    if (result.refreshToken) setRefreshCookie(res, result.refreshToken);
    return result;
  }

  // Brute-force protection: 10 attempts per minute per IP
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: LoginDto) {
    const result = await this.auth.login(dto.email, dto.password, { userAgent: req.headers["user-agent"], ip: req.ip });
    if ("refreshToken" in result && result.refreshToken) setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: RefreshDto) {
    if (!dto.refreshToken) assertTrustedOrigin(req);
    const token = dto.refreshToken || req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      clearRefreshCookie(res);
      throw new BadRequestException("Refresh token is required");
    }
    const result = await this.auth.refresh(token, { userAgent: req.headers["user-agent"], ip: req.ip });
    setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout-all")
  async logoutAll(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    clearRefreshCookie(res);
    return this.auth.logoutAll(req.user.userId);
  }

  // Unthrottled before this, a signed-in user (or anyone with a stolen access token)
  // could hammer this to spam another mailbox — the token itself was always properly
  // single-use/expiring, but nothing capped how often a new one could be requested.
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @UseGuards(JwtAuthGuard)
  @Post("send-verification")
  sendVerification(@Req() req: any) {
    return this.auth.sendEmailVerification(req.user.userId);
  }

  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  // Step-up re-confirmation of an already-authenticated user's own password (e.g. the
  // Explore gallery's password gate) — never issues a token or session, just a yes/no.
  // Same per-IP throttle and account lockout behavior as /login.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @Post("verify-password")
  async verifyPassword(@Req() req: any, @Body() dto: { password: string }) {
    if (!dto?.password) throw new BadRequestException("Password is required");
    return this.auth.verifyCurrentPassword(req.user.userId, dto.password, { userAgent: req.headers["user-agent"], ip: req.ip });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("request-password-reset")
  requestReset(@Body() dto: RequestResetDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("reset-password")
  reset(@Body() dto: ResetDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }

  // 2FA/OTP Verification Endpoints. Same per-IP throttle as /login (brute force
  // protection) plus the per-account progressive lockout enforced inside AuthService.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("verify-otp")
  async verifyOtp(@Req() req: any, @Res({ passthrough: true }) res: Response, @Body() dto: { code: string }) {
    const tempToken = req.headers['x-temp-token'];
    if (!tempToken) {
      throw new BadRequestException('Missing temporary login token');
    }

    // The user id is derived solely from the verified temp token's own subject claim,
    // never from a client-supplied header — see verifyTemporaryLoginToken's docstring.
    const userId = this.auth.verifyTemporaryLoginToken(tempToken);
    const meta = { userAgent: req.headers["user-agent"], ip: req.ip };
    const result = await this.auth.verifyOtp(userId, dto.code, meta);
    setRefreshCookie(res, result.refreshToken);
    return result;
  }

  /** Re-confirm MFA for sensitive staff/admin actions; returns a 5-minute step-up token. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @Post("step-up")
  async stepUp(@Req() req: any, @Body() dto: { code: string }) {
    return this.auth.issueStepUp(req.user.userId, dto?.code, { userAgent: req.headers["user-agent"], ip: req.ip });
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("verify-backup-code")
  async verifyBackupCode(@Req() req: any, @Res({ passthrough: true }) res: Response, @Body() dto: { code: string }) {
    const tempToken = req.headers['x-temp-token'];
    if (!tempToken) {
      throw new BadRequestException('Missing temporary login token');
    }

    const userId = this.auth.verifyTemporaryLoginToken(tempToken);
    const meta = { userAgent: req.headers["user-agent"], ip: req.ip };
    const result = await this.auth.verifyBackupCode(userId, dto.code, meta);
    setRefreshCookie(res, result.refreshToken);
    return result;
  }

  // Forced MFA setup for staff/admin accounts that don't have it configured yet — see
  // the mustSetupMfa branch in AuthService.login(). Both endpoints only accept the
  // "mfa-setup"-purpose tempToken from that response, never a real session token.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("mfa/setup")
  async beginMfaSetup(@Req() req: any) {
    const tempToken = req.headers['x-temp-token'];
    if (!tempToken) throw new BadRequestException('Missing temporary login token');
    return this.auth.beginMfaSetup(tempToken);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("mfa/setup/confirm")
  async confirmMfaSetup(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: { secret: string; otpToken: string; backupCodes: string[] },
  ) {
    const tempToken = req.headers['x-temp-token'];
    if (!tempToken) throw new BadRequestException('Missing temporary login token');
    const meta = { userAgent: req.headers["user-agent"], ip: req.ip };
    const result = await this.auth.completeMfaSetup(tempToken, dto.secret, dto.otpToken, dto.backupCodes, meta);
    setRefreshCookie(res, result.refreshToken);
    return result;
  }
}
