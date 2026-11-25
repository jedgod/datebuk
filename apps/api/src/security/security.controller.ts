import { Controller, Get, Post, Body, Query, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RiskEngineService } from './risk-engine.service';
import { IpIntelligenceService } from './ip-intelligence.service';
import { AuditService } from '../common/audit/audit.service';
import { logger } from '../common/logging/logger';
import { Request } from 'express';

/**
 * Security Controller
 * Handles security-related API endpoints
 */

@Controller('security')
export class SecurityController {
  constructor(
    private riskEngine: RiskEngineService,
    private ipIntelligence: IpIntelligenceService,
    private audit: AuditService,
  ) {}

  /**
   * Get IP intelligence for current request.
   *
   * Deliberately left unauthenticated (unlike ip-intel/for-ip below) because
   * it's called from the mobile app's pre-login risk-assessment pass — see
   * MobileSecurityProvider — which needs to run before a user has a session.
   * A JwtAuthGuard here would break that. Instead, rate-limited tightly per
   * IP to close the cost-amplification gap (this triggers a paid ipapi.is
   * lookup) without requiring auth. See ultra_datebuk-08-01-2026.txt, M-7.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('ip-intel')
  async getIpIntelligence(@Req() req: Request) {
    const clientIp = this.getClientIp(req);

    try {
      const intel = await this.ipIntelligence.getIpIntelligence(clientIp);
      return intel;
    } catch (error) {
      logger.error({ msg: 'ip_intelligence_error', err: (error as Error)?.message });
      throw new HttpException(
        'Failed to get IP intelligence',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * IP intelligence for an explicit IP (not the caller's own request IP).
   *
   * Used by trusted server-to-server callers — e.g. apps/web's Next.js route handlers,
   * which see the true end-user IP from the original browser request but must make a
   * separate outbound call to reach this service, at which point the "request IP" as far
   * as this server is concerned is the Next.js server itself. Gated behind JwtAuthGuard
   * (unlike /ip-intel above) since an arbitrary caller probing arbitrary third-party IPs
   * would burn paid API-key quota and leak VPN/proxy status about IPs unrelated to their
   * own session.
   */
  @Get('ip-intel/for-ip')
  @UseGuards(JwtAuthGuard)
  async getIpIntelligenceForIp(@Query('ip') ip: string) {
    if (!ip) throw new HttpException('ip query parameter is required', HttpStatus.BAD_REQUEST);

    try {
      return await this.ipIntelligence.getIpIntelligence(ip);
    } catch (error) {
      logger.error({ msg: 'ip_intelligence_for_ip_error', err: (error as Error)?.message });
      throw new HttpException(
        'Failed to get IP intelligence',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Assess risk for a user/request.
   *
   * Also deliberately unauthenticated for the same pre-login reason as
   * ip-intel above (the mobile app calls this during signup risk-scoring,
   * before any session exists). Tighter throttle since this is the more
   * expensive of the two (chains an ipapi.is lookup with a call to the ML
   * risk-scoring endpoint).
   */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('assess-risk')
  async assessRisk(
    @Req() req: Request,
    @Body()
    body: {
      deviceId: string;
      userAgent: string;
      timezone: string;
      screenResolution: string;
      suspiciousActivity?: boolean;
      previousFailedAttempts?: number;
    },
  ) {
    const clientIp = this.getClientIp(req);

    try {
      // Get IP intelligence
      const ipIntel = await this.ipIntelligence.getIpIntelligence(clientIp);

      // Check if blacklisted
      const isBlacklisted = await this.ipIntelligence.isBlacklisted(clientIp);
      if (isBlacklisted) {
        return {
          riskScore: 100,
          riskLevel: 'critical',
          requiresChallenge: false,
          requiresSMS: false,
          message: 'This IP has been blocked due to abuse.',
        };
      }

      // Evaluate risk
      const assessment = await this.riskEngine.evaluateFullRisk({
        ipIntel,
        deviceId: body.deviceId,
        previousAttempts: body.previousFailedAttempts,
      });

      return {
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        requiresChallenge: assessment.requiresChallenge,
        requiresSMS: assessment.requiresSMS,
        reasons: assessment.reasons,
      };
    } catch (error) {
      logger.error({ msg: 'risk_assessment_error', err: (error as Error)?.message });
      throw new HttpException(
        'Failed to assess risk',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if current IP is blacklisted
   */
  @Get('check-blacklist')
  async checkBlacklist(@Req() req: Request) {
    const clientIp = this.getClientIp(req);

    try {
      const isBlacklisted = await this.ipIntelligence.isBlacklisted(clientIp);
      return { isBlacklisted };
    } catch (error) {
      logger.error({ msg: 'blacklist_check_error', err: (error as Error)?.message });
      return { isBlacklisted: false };
    }
  }

  /**
   * Log IP access (for audit trail)
   */
  @Post('log-ip')
  @UseGuards(JwtAuthGuard)
  async logIpAccess(
    @Req() req: any,
    @Body() body: { eventType: string },
  ) {
    const clientIp = this.getClientIp(req);

    // actorUserId comes from the verified JWT, never the client-supplied body, so a
    // caller can't attribute log-ip entries to an arbitrary other userId.
    await this.audit.log({
      action: 'SECURITY_IP_ACCESS',
      actorUserId: req.user.userId,
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      metadata: { eventType: body.eventType },
    });

    return { success: true };
  }

  /**
   * Helper: Extract client IP from request.
   *
   * Deliberately uses Express's `req.ip` rather than parsing `X-Forwarded-For` by hand:
   * with `app.set("trust proxy", N)` configured in main.ts, Express derives `req.ip` by
   * walking back exactly N trusted hops from the reverse proxy, ignoring any further
   * client-supplied entries. A hand-rolled `xff.split(',')[0]` instead trusts whatever the
   * client put first in the header — i.e. fully attacker-spoofable — which would let an
   * attacker forge a trusted/low-risk IP to slip past fraud/IP-reputation checks below.
   */
  private getClientIp(req: Request): string {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
