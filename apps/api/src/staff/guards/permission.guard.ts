import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { RbacService } from '../rbac.service';
import { logger } from '../../common/logging/logger';
import { SecurityAlertService } from '../../common/security-alerts/security-alert.service';

export const STAFF_PERMISSION_KEY = 'staff_required_permission';

// Distinct name and metadata key from auth/permissions.guard.ts's RequirePermissions on
// purpose: that guard checks the flat User.role ADMIN_* permission set, this one checks
// the DB-backed, per-staff-member Role/Permission/StaffRole tables managed by RbacService.
// They previously had near-identical names (PermissionGuard vs PermissionsGuard,
// RequirePermissions vs RequirePermission) which made it easy to wire up the wrong one.
export const RequireStaffPermission = (permission: string) => SetMetadata(STAFF_PERMISSION_KEY, permission);

@Injectable()
export class StaffPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbacService: RbacService, private alerts: SecurityAlertService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(STAFF_PERMISSION_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;

    const req = ctx.switchToHttp().getRequest();
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('Not authenticated');

    const hasPermission = await this.rbacService.userHasPermission(userId, required);
    if (!hasPermission) {
      logger.warn({
        msg: 'staff_permission_denied',
        actorUserId: userId,
        requiredPermission: required,
        method: req.method,
        path: req.originalUrl || req.url,
      });
      this.alerts.recordPermissionDenial(userId, required, req.originalUrl || req.url).catch(() => {});
      throw new ForbiddenException(`Missing required permission: ${required}`);
    }

    return true;
  }
}
