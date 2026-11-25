import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Optional network-layer allowlist for /admin/* routes, backed by the
 * ADMIN_IPS env var — previously documented in .env.example ("Admin IPs for
 * security features") but never actually read anywhere in apps/api/src,
 * leaving admin routes protected only by the RBAC/permission checks with no
 * network restriction at all despite the env var implying one existed. See
 * ultra_datebuk-08-01-2026.txt, L-6.
 *
 * Deliberately fails OPEN when ADMIN_IPS is unset or empty, so environments
 * that have never configured it (local dev, existing staging/prod setups)
 * are not suddenly locked out of admin access by this guard shipping. Only
 * environments that explicitly set ADMIN_IPS get the restriction enforced.
 */
@Injectable()
export class AdminIpAllowlistGuard implements CanActivate {
  private readonly logger = new Logger(AdminIpAllowlistGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Global prefix is "api" (see main.ts), so admin routes are actually
    // served under /api/admin/*.
    if (!request.path?.includes('/admin')) return true;

    const allowlist = (process.env.ADMIN_IPS || '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);

    if (allowlist.length === 0) return true;

    const clientIp = request.ip;
    if (clientIp && allowlist.includes(clientIp)) return true;

    this.logger.warn(`Blocked admin route access from non-allowlisted IP: ${clientIp}`);
    throw new ForbiddenException('Access to admin routes is restricted from this network');
  }
}
