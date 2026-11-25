import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../database/prisma.service";
import { PERMS_KEY } from "./require-permissions.decorator";
import { ROLE_PERMISSIONS, type Permission, type Role } from "./permissions";
import { logger } from "../common/logging/logger";
import { SecurityAlertService } from "../common/security-alerts/security-alert.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService, private alerts: SecurityAlertService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]) || [];

    // no permissions required
    if (required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException("Not authenticated");

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true, isAdmin: true } });
    const role = (user?.role as Role) || "USER";
    const allowed = new Set(ROLE_PERMISSIONS[role] || []);

    // Backward compatibility: isAdmin implies SUPERADMIN if role missing
    if (user?.isAdmin && role === "USER") {
      for (const p of ROLE_PERMISSIONS.SUPERADMIN) allowed.add(p);
    }

    for (const perm of required) {
      if (!allowed.has(perm)) {
        // Denial-only: no signal here for the normal case, but this is the one place
        // that can catch a compromised/probing account working through admin routes it
        // doesn't have — there was previously no record of this happening at all.
        logger.warn({
          msg: "permission_denied",
          actorUserId: userId,
          role,
          requiredPermission: perm,
          method: req.method,
          path: req.originalUrl || req.url,
        });
        this.alerts.recordPermissionDenial(userId, perm, req.originalUrl || req.url).catch(() => {});
        throw new ForbiddenException("Insufficient permissions");
      }
    }

    return true;
  }
}
