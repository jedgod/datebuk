import { Injectable, BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStaffDto, ChangePasswordDto, UpdateStaffRolesDto, UpdateStaffProfileDto } from './dto/create-staff.dto';
import { hashSecret, verifySecret } from '../common/security/hash';
import { randomBytes } from 'crypto';
import { StaffAccountStatus } from '@prisma/client';
import { SecurityAlertService } from '../common/security-alerts/security-alert.service';
import { RbacService } from './rbac.service';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private alerts: SecurityAlertService,
    private rbacService: RbacService,
  ) {}

  // ============ CREATE STAFF ============
  async createStaff(createStaffDto: CreateStaffDto) {
    const { email, roleIds, requireTwoFactor = false, ...profileData } = createStaffDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new BadRequestException('Email already in use');

    // Validate roles exist
    const roles = await this.prisma.role.findMany({ where: { id: { in: roleIds } } });
    if (roles.length !== roleIds.length) throw new BadRequestException('Invalid roleIds provided');

    // Generate temporary password
    const tempPassword = randomBytes(12).toString('hex');
    const passwordHash = await hashSecret(tempPassword);

    // Create staff user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        emailVerified: true,
        role: 'SUPPORT', // Default to support/staff role
        mustChangePassword: true,
        accountStatus: StaffAccountStatus.PENDING,
        tempPasswordHash: passwordHash,

        staffProfile: profileData.displayName ? {
          create: {
            displayName: profileData.displayName,
            department: profileData.department,
            jobTitle: profileData.jobTitle,
            phoneNumber: profileData.phoneNumber,
          },
        } : undefined,

        twoFactorAuth: requireTwoFactor ? {
          create: {
            method: 'TOTP',
          },
        } : undefined,

        staffRoles: {
          create: roleIds.map(roleId => ({
            roleId,
            assignedAt: new Date(),
          })),
        },
      },
      include: {
        staffProfile: true,
        staffRoles: { include: { role: { include: { permissions: true } } } },
      },
    });

    // TODO: Send email with temp password
    return {
      userId: user.id,
      email: user.email,
      tempPassword, // Only return in create response
      requiresTwoFactor: requireTwoFactor,
      message: 'Staff account created. User must change password on first login.',
    };
  }

  // ============ STAFF FIRST LOGIN ============
  async changePasswordOnFirstLogin(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.mustChangePassword) throw new BadRequestException('Password change not required');

    const passwordHash = await hashSecret(newPassword);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        mustChangePassword: false,
        accountStatus: StaffAccountStatus.ACTIVE,
        tempPasswordHash: null,
        passwordChangedAt: new Date(),
      },
      include: {
        staffProfile: true,
        staffRoles: { include: { role: true } },
        twoFactorAuth: { select: { enabled: true } },
      },
    });
  }

  // ============ PASSWORD MANAGEMENT ============
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await verifySecret(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    if (!newPassword || newPassword === currentPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const passwordHash = await hashSecret(newPassword);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        passwordChangedAt: new Date(),
      },
    });

    // A staff/admin account changing its own password is exactly the moment any other
    // live session — including one an attacker holds on stolen credentials being rotated
    // out — should stop working immediately, matching how the forgot-password reset flow
    // already behaves. Previously this only updated the password hash and left every
    // other session valid until it happened to expire on its own.
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });

    return updated;
  }

  async resetStaffPassword(staffId: string, adminId: string) {
    const tempPassword = randomBytes(12).toString('hex');
    const passwordHash = await hashSecret(tempPassword);

    // Log activity
    await this.logActivity(adminId, 'RESET_PASSWORD', staffId);

    await this.prisma.user.update({
      where: { id: staffId },
      data: {
        password: passwordHash,
        tempPasswordHash: passwordHash,
        mustChangePassword: true,
      },
    });

    return {
      tempPassword,
      message: 'Password reset. Staff must change on next login.',
    };
  }

  // ============ STAFF STATUS MANAGEMENT ============
  async suspendStaff(staffId: string, reason: string, adminId: string) {
    await this.logActivity(adminId, 'SUSPEND_STAFF', staffId, { reason });

    // Revoke all active sessions
    await this.prisma.sessionToken.updateMany({
      where: { userId: staffId, isValid: true },
      data: { isValid: false, revokedAt: new Date() },
    });

    return this.prisma.user.update({
      where: { id: staffId },
      data: { accountStatus: StaffAccountStatus.SUSPENDED },
    });
  }

  async revokeStaff(staffId: string, reason: string, adminId: string) {
    await this.logActivity(adminId, 'REVOKE_STAFF', staffId, { reason });

    // Revoke all sessions
    await this.prisma.sessionToken.updateMany({
      where: { userId: staffId },
      data: { isValid: false, revokedAt: new Date() },
    });

    // Disable 2FA (if exists)
    try {
      await this.prisma.twoFactorAuth.update({
        where: { userId: staffId },
        data: { enabled: false },
      });
    } catch (e) {
      // Ignore if not found
    }

    return this.prisma.user.update({
      where: { id: staffId },
      data: { accountStatus: StaffAccountStatus.REVOKED },
    });
  }

  // ============ STAFF ROLES ============
  async updateStaffProfile(staffId: string, updateDto: UpdateStaffProfileDto, adminId: string) {
    const { displayName, jobTitle, department } = updateDto;

    await this.logActivity(adminId, 'UPDATE_STAFF_PROFILE', staffId, updateDto);

    await this.prisma.staffProfile.update({
      where: { userId: staffId },
      data: {
        ...(displayName !== undefined ? { displayName } : {}),
        ...(jobTitle !== undefined ? { jobTitle } : {}),
        ...(department !== undefined ? { department } : {}),
      },
    });

    return this.getStaffById(staffId);
  }

  async updateStaffRoles(staffId: string, updateDto: UpdateStaffRolesDto, adminId: string) {
    const { roleIds } = updateDto;

    // Validate roles exist
    const roles = await this.prisma.role.findMany({ where: { id: { in: roleIds } } });
    if (roles.length !== roleIds.length) throw new BadRequestException('Invalid roleIds');

    // SECURITY: every role in a bulk update must independently pass the same
    // escalation guard as a single-role assignment (superset-permission +
    // no-self-assignment + no-system-role-unless-super-admin). See
    // RbacService.assertCanGrantRole for the full rationale.
    for (const roleId of roleIds) {
      await this.rbacService.assertCanGrantRole(adminId, roleId, staffId);
    }

    await this.logActivity(adminId, 'UPDATE_ROLES', staffId, { roleIds });
    this.alerts.recordStaffRoleChange(adminId, staffId, roles.map((r) => r.name)).catch(() => {});

    // Remove existing roles
    await this.prisma.staffRole.deleteMany({ where: { userId: staffId } });

    // Add new roles
    return this.prisma.user.update({
      where: { id: staffId },
      data: {
        staffRoles: {
          create: roleIds.map(roleId => ({ roleId })),
        },
      },
      include: {
        staffRoles: { include: { role: { include: { permissions: true } } } },
      },
    });
  }

  // ============ STAFF LISTING & INFO ============
  // Uses `select` rather than `include` deliberately: `include` only adds relations, it
  // does not restrict scalar fields, so it would silently return every column on User —
  // including the bcrypt `password` hash and `tempPasswordHash` — to any caller with
  // manage_staff/view permission (staff viewing themselves or each other).
  private static readonly STAFF_SAFE_SELECT = {
    id: true,
    email: true,
    emailVerified: true,
    role: true,
    isAdmin: true,
    accountStatus: true,
    mustChangePassword: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
    staffProfile: true,
    staffRoles: { include: { role: { include: { permissions: true } } } },
    twoFactorAuth: { select: { enabled: true } },
  } as const;

  async getAllStaff(limit = 50, offset = 0) {
    const [staff, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: { in: ['SUPPORT', 'SUPERADMIN'] } },
        take: limit,
        skip: offset,
        select: StaffService.STAFF_SAFE_SELECT,
      }),
      this.prisma.user.count({ where: { role: { in: ['SUPPORT', 'SUPERADMIN'] } } }),
    ]);

    return { staff, total, limit, offset };
  }

  async getStaffById(staffId: string) {
    const staff = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: StaffService.STAFF_SAFE_SELECT,
    });

    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  // ============ ACTIVITY LOGGING ============
  async logActivity(staffId: string, action: string, target?: string, details?: any) {
    return this.prisma.staffActivityLog.create({
      data: {
        staffId,
        action,
        target,
        details,
      },
    });
  }

  async getStaffActivityLog(staffId: string, limit = 100, offset = 0) {
    return this.prisma.staffActivityLog.findMany({
      where: { staffId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============ PERMISSIONS / CAPABILITIES ============
  async getStaffPermissions(staffId: string) {
    const staffRoles = await this.prisma.staffRole.findMany({
      where: { userId: staffId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    staffRoles.forEach(sr =>
      sr.role.permissions.forEach(rp => permissions.add(rp.permission.key))
    );

    return Array.from(permissions);
  }

  async hasPermission(staffId: string, permissionKey: string): Promise<boolean> {
    const permissions = await this.getStaffPermissions(staffId);
    return permissions.includes(permissionKey);
  }

  // ============ PERFORMANCE METRICS ============
  async getStaffPerformance(staffId: string) {
    const [tasksCompleted, tasksPending, activityCount] = await Promise.all([
      this.prisma.task.count({
        where: { assignedToId: staffId, status: 'COMPLETED' },
      }),
      this.prisma.task.count({
        where: { assignedToId: staffId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
      this.prisma.staffActivityLog.count({
        where: { staffId },
      }),
    ]);

    return {
      staffId,
      tasksCompleted,
      tasksPending,
      totalActivities: activityCount,
    };
  }
}
