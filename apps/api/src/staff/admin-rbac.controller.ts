import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RbacService } from './rbac.service';
import { StaffPermissionGuard, RequireStaffPermission } from './guards/permission.guard';
import { CreatePermissionDto, CreateRoleDto, UpdateRoleDto } from './dto/rbac.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminRbacController {
  constructor(private rbacService: RbacService) {}

  // ============ PERMISSIONS ============

  /**
   * Get all permissions (System Admin only)
   */
  @Get('permissions')
  async getAllPermissions(@Request() req) {
    const hasPermission = await this.rbacService.userHasPermission(req.user.userId, 'manage_permissions');
    if (!hasPermission && !(await this.rbacService.isSuperAdmin(req.user.userId))) {
      throw new ForbiddenException('No permission to view permissions');
    }

    return this.rbacService.getAllPermissions();
  }

  /**
   * Get permissions by category
   */
  @Get('permissions/category/:category')
  async getPermissionsByCategory(@Param('category') category: string, @Request() req) {
    const hasPermission = await this.rbacService.userHasPermission(req.user.userId, 'manage_permissions');
    if (!hasPermission && !(await this.rbacService.isSuperAdmin(req.user.userId))) {
      throw new ForbiddenException('No permission');
    }

    return this.rbacService.getPermissionsByCategory(category);
  }

  /**
   * Create new permission (System Admin only)
   */
  @Post('permissions')
  async createPermission(@Body() createDto: CreatePermissionDto, @Request() req) {
    if (!(await this.rbacService.isSuperAdmin(req.user.userId))) {
      throw new ForbiddenException('Only system admins can create permissions');
    }

    return this.rbacService.createPermission(createDto);
  }

  // ============ ROLES ============

  /**
   * Get all roles.
   * SECURITY: previously readable by any authenticated user, which let a
   * low-privileged staffer discover the SYSTEM_ADMIN role id as the first
   * step of a self-privilege-escalation attack (see assertCanGrantRole).
   * Now requires at least manage_staff (needed to legitimately pick a role
   * to assign) or manage_roles/super-admin.
   */
  @Get('roles')
  async getAllRoles(@Request() req) {
    const allowed =
      (await this.rbacService.isSuperAdmin(req.user.userId)) ||
      (await this.rbacService.userHasAnyPermission(req.user.userId, ['manage_staff', 'manage_roles']));
    if (!allowed) throw new ForbiddenException('No permission to view roles');

    return this.rbacService.getAllRoles();
  }

  /**
   * Get role by ID
   */
  @Get('roles/:roleId')
  async getRoleById(@Param('roleId') roleId: string, @Request() req) {
    const allowed =
      (await this.rbacService.isSuperAdmin(req.user.userId)) ||
      (await this.rbacService.userHasAnyPermission(req.user.userId, ['manage_staff', 'manage_roles']));
    if (!allowed) throw new ForbiddenException('No permission to view roles');

    return this.rbacService.getRoleById(roleId);
  }

  /**
   * Create new role
   */
  @Post('roles')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('manage_roles')
  async createRole(@Body() createDto: CreateRoleDto, @Request() req) {
    return this.rbacService.createRole(createDto);
  }

  /**
   * Update role
   */
  @Put('roles/:roleId')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('manage_roles')
  async updateRole(@Param('roleId') roleId: string, @Body() updateDto: UpdateRoleDto, @Request() req) {
    return this.rbacService.updateRole(roleId, updateDto);
  }

  /**
   * Delete role
   */
  @Delete('roles/:roleId')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('manage_roles')
  async deleteRole(@Param('roleId') roleId: string, @Request() req) {
    return this.rbacService.deleteRole(roleId);
  }

  // ============ STAFF ROLE ASSIGNMENT ============

  /**
   * Assign role to staff
   */
  @Post('staff/:staffId/roles/:roleId')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('manage_staff')
  async assignRoleToStaff(
    @Param('staffId') staffId: string,
    @Param('roleId') roleId: string,
    @Request() req,
  ) {
    // SECURITY: manage_staff alone is not sufficient — see
    // RbacService.assertCanGrantRole for the escalation this closes.
    await this.rbacService.assertCanGrantRole(req.user.userId, roleId, staffId);
    return this.rbacService.assignRoleToStaff(staffId, roleId);
  }

  /**
   * Remove role from staff
   */
  @Delete('staff/:staffId/roles/:roleId')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('manage_staff')
  async removeRoleFromStaff(
    @Param('staffId') staffId: string,
    @Param('roleId') roleId: string,
    @Request() req,
  ) {
    return this.rbacService.removeRoleFromStaff(staffId, roleId, req.user.userId);
  }

  /**
   * Get staff roles
   */
  @Get('staff/:staffId/roles')
  async getStaffRoles(@Param('staffId') staffId: string, @Request() req) {
    if (req.user.userId !== staffId) {
      const hasPermission = await this.rbacService.userHasPermission(
        req.user.userId,
        'manage_staff',
      );
      if (!hasPermission) throw new ForbiddenException('No permission');
    }

    return this.rbacService.getStaffRoles(staffId);
  }
}
