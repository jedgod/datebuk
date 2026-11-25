import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePermissionDto, CreateRoleDto, UpdateRoleDto } from './dto/rbac.dto';
import { logger } from '../common/logging/logger';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  // ============ PERMISSIONS ============
  async createPermission(createDto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: createDto,
    });
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { category: 'asc' },
    });
  }

  async getPermissionsByCategory(category: string) {
    return this.prisma.permission.findMany({
      where: { category },
    });
  }

  // ============ ROLES ============
  async createRole(createDto: CreateRoleDto) {
    const { name, description, permissionIds } = createDto;

    // Validate permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Invalid permission IDs');
    }

    return this.prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissionIds.map(permissionId => ({ permissionId })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
    });
  }

  async getRoleById(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async updateRole(roleId: string, updateDto: UpdateRoleDto) {
    const { name, description, permissionIds } = updateDto;

    if (permissionIds) {
      // Validate permissions
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      });

      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException('Invalid permission IDs');
      }

      // Update permissions
      await this.prisma.rolePermission.deleteMany({ where: { roleId } });

      return this.prisma.role.update({
        where: { id: roleId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          permissions: {
            create: permissionIds.map(permissionId => ({ permissionId })),
          },
        },
        include: { permissions: { include: { permission: true } } },
      });
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async deleteRole(roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (role?.isSystem) {
      throw new BadRequestException('Cannot delete system roles');
    }

    return this.prisma.role.delete({ where: { id: roleId } });
  }

  // ============ STAFF ROLE ASSIGNMENT ============

  /**
   * SECURITY: guards against privilege escalation via role assignment.
   * `manage_staff` alone must never be sufficient to grant a role — otherwise
   * any staffer holding it could look up the SYSTEM_ADMIN role id (or any
   * other privileged role) via GET /admin/roles and grant it to themselves.
   * A caller may only grant a role if:
   *   1. they are a super admin, OR
   *   2. the role is not a protected system role, AND their own permission
   *      set already covers every permission the role grants, AND they are
   *      not assigning it to themselves.
   */
  async assertCanGrantRole(actorId: string, roleId: string, targetStaffId: string): Promise<void> {
    this.assertStaffId(actorId);

    if (await this.isSuperAdmin(actorId)) return;

    if (actorId === targetStaffId) {
      throw new ForbiddenException('Cannot assign roles to yourself');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');

    if (role.isSystem) {
      throw new ForbiddenException('Only a system admin can assign a system role');
    }

    const requiredKeys = role.permissions.map(rp => rp.permission.key);
    if (requiredKeys.length > 0) {
      const actorHasAll = await this.userHasAllPermissions(actorId, requiredKeys);
      if (!actorHasAll) {
        throw new ForbiddenException(
          'Cannot grant a role with permissions you do not already hold',
        );
      }
    }
  }

  async assignRoleToStaff(staffId: string, roleId: string) {
    // Verify both exist
    const [staff, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: staffId } }),
      this.prisma.role.findUnique({ where: { id: roleId } }),
    ]);

    if (!staff || !role) {
      throw new NotFoundException('Staff or role not found');
    }

    return this.prisma.staffRole.upsert({
      where: {
        userId_roleId: { userId: staffId, roleId },
      },
      create: { userId: staffId, roleId },
      update: { assignedAt: new Date() },
    });
  }

  async removeRoleFromStaff(staffId: string, roleId: string, actorId?: string) {
    if (actorId) {
      const role = await this.prisma.role.findUnique({ where: { id: roleId } });
      if (role?.isSystem && !(await this.isSuperAdmin(actorId))) {
        throw new ForbiddenException('Only a system admin can remove a system role');
      }
    }

    return this.prisma.staffRole.delete({
      where: {
        userId_roleId: { userId: staffId, roleId },
      },
    });
  }

  async getStaffRoles(staffId: string) {
    return this.prisma.staffRole.findMany({
      where: { userId: staffId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
  }

  // ============ PERMISSION CHECKING ============
  /**
   * Guards every permission check below against an empty/undefined subject.
   * Prisma silently drops `undefined` filter values (turning `where: { userId: undefined }`
   * into `where: {}`, i.e. "match every row"), so a caller that forgets to resolve the
   * authenticated user id must fail closed here instead of silently matching everyone.
   */
  private assertStaffId(staffId: string): void {
    if (!staffId || typeof staffId !== 'string') {
      throw new ForbiddenException('Cannot evaluate permissions without an authenticated user id');
    }
  }

  async userHasPermission(staffId: string, permissionKey: string): Promise<boolean> {
    this.assertStaffId(staffId);

    const staffRoles = await this.prisma.staffRole.findMany({
      where: { userId: staffId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const granted = staffRoles.some(sr =>
      sr.role.permissions.some(rp => rp.permission.key === permissionKey)
    );
    if (!granted) {
      logger.warn({ msg: 'staff_permission_denied', actorUserId: staffId, requiredPermission: permissionKey });
    }
    return granted;
  }

  async userHasAnyPermission(staffId: string, permissionKeys: string[]): Promise<boolean> {
    this.assertStaffId(staffId);

    const staffRoles = await this.prisma.staffRole.findMany({
      where: { userId: staffId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const userPermissions = new Set<string>();
    staffRoles.forEach(sr =>
      sr.role.permissions.forEach(rp => userPermissions.add(rp.permission.key))
    );

    const granted = permissionKeys.some(key => userPermissions.has(key));
    if (!granted) {
      logger.warn({ msg: 'staff_permission_denied', actorUserId: staffId, requiredPermission: permissionKeys });
    }
    return granted;
  }

  async userHasAllPermissions(staffId: string, permissionKeys: string[]): Promise<boolean> {
    this.assertStaffId(staffId);

    const staffRoles = await this.prisma.staffRole.findMany({
      where: { userId: staffId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const userPermissions = new Set<string>();
    staffRoles.forEach(sr =>
      sr.role.permissions.forEach(rp => userPermissions.add(rp.permission.key))
    );

    const granted = permissionKeys.every(key => userPermissions.has(key));
    if (!granted) {
      logger.warn({ msg: 'staff_permission_denied', actorUserId: staffId, requiredPermission: permissionKeys });
    }
    return granted;
  }

  /**
   * DB-backed super-admin check. Deliberately re-reads from the database on every call
   * rather than trusting a `role` claim cached on the JWT/request object, so a demotion
   * takes effect immediately instead of waiting for the access token to expire.
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    this.assertStaffId(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true, isAdmin: true } });
    return user?.role === 'SUPERADMIN' || !!user?.isAdmin;
  }
}
