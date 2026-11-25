import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StaffService } from './staff.service';
import { OtpService } from './otp.service';
import { RbacService } from './rbac.service';
import { TaskService } from './task.service';
import { StaffPermissionGuard, RequireStaffPermission } from './guards/permission.guard';
import { CreateStaffDto, ChangePasswordDto, UpdateStaffRolesDto, UpdateStaffProfileDto } from './dto/create-staff.dto';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Controller('admin/staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(
    private staffService: StaffService,
    private otpService: OtpService,
    private rbacService: RbacService,
    private taskService: TaskService,
  ) {}

  // ============ STAFF MANAGEMENT ============

  /**
   * Get all staff members (Admin only)
   */
  @Get()
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('manage_staff')
  async getAllStaff(@Query('limit') limit = 50, @Query('offset') offset = 0, @Request() req) {
    return this.staffService.getAllStaff(limit, offset);
  }

  /**
   * Create new staff member (Admin only)
   */
  @Post()
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('manage_staff')
  async createStaff(@Body() createStaffDto: CreateStaffDto, @Request() req) {
    const result = await this.staffService.createStaff(createStaffDto);
    // Log activity
    await this.staffService.logActivity(req.user.userId, 'CREATE_STAFF', null, { email: createStaffDto.email });

    return result;
  }

  /**
   * Get staff details
   */
  @Get(':staffId')
  async getStaffById(@Param('staffId') staffId: string, @Request() req) {
    // User can view own profile or admin can view anyone
    if (req.user.userId !== staffId) {
      const hasPermission = await this.rbacService.userHasPermission(req.user.userId, 'manage_staff');
      if (!hasPermission) throw new ForbiddenException('Cannot view other staff profiles');
    }

    return this.staffService.getStaffById(staffId);
  }

  /**
   * Update staff profile fields (Admin only)
   */
  @Put(':staffId')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('manage_staff')
  async updateStaffProfile(
    @Param('staffId') staffId: string,
    @Body() updateDto: UpdateStaffProfileDto,
    @Request() req,
  ) {
    return this.staffService.updateStaffProfile(staffId, updateDto, req.user.userId);
  }

  /**
   * Update staff roles (Admin only)
   */
  @Put(':staffId/roles')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('manage_staff')
  async updateStaffRoles(
    @Param('staffId') staffId: string,
    @Body() updateDto: UpdateStaffRolesDto,
    @Request() req,
  ) {
    const result = await this.staffService.updateStaffRoles(staffId, updateDto, req.user.userId);
    await this.staffService.logActivity(req.user.userId, 'UPDATE_ROLES', staffId);

    return result;
  }

  /**
   * Password change on first login
   */
  @Post(':staffId/change-password-first-login')
  async changePasswordFirstLogin(
    @Param('staffId') staffId: string,
    @Body('newPassword') newPassword: string,
    @Request() req,
  ) {
    if (req.user.userId !== staffId) {
      throw new ForbiddenException('Can only change own password');
    }

    if (!newPassword) throw new BadRequestException('New password required');

    return this.staffService.changePasswordOnFirstLogin(staffId, newPassword);
  }

  /**
   * Change password
   */
  @Post(':staffId/change-password')
  async changePassword(
    @Param('staffId') staffId: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ) {
    if (req.user.userId !== staffId) {
      throw new ForbiddenException('Can only change own password');
    }

    const result = await this.staffService.changePassword(
      staffId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    await this.staffService.logActivity(req.user.userId, 'CHANGE_PASSWORD', staffId);
    return { message: 'Password changed successfully' };
  }

  /**
   * Reset staff password (Admin only)
   */
  @Post(':staffId/reset-password')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('manage_staff')
  async resetPassword(@Param('staffId') staffId: string, @Request() req) {
    return this.staffService.resetStaffPassword(staffId, req.user.userId);
  }

  /**
   * Suspend staff account (Admin only)
   */
  @Post(':staffId/suspend')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('revoke_staff')
  async suspendStaff(
    @Param('staffId') staffId: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.staffService.suspendStaff(staffId, reason, req.user.userId);
  }

  /**
   * Revoke staff account (Admin only)
   */
  @Post(':staffId/revoke')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('revoke_staff')
  async revokeStaff(
    @Param('staffId') staffId: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.staffService.revokeStaff(staffId, reason, req.user.userId);
  }

  // ============ TWO-FACTOR AUTH ============

  /**
   * Enable 2FA - Get setup data
   */
  @Post(':staffId/2fa/setup')
  async setup2fa(@Param('staffId') staffId: string, @Request() req) {
    if (req.user.userId !== staffId && !(await this.rbacService.isSuperAdmin(req.user.userId))) {
      throw new ForbiddenException('Can only setup own 2FA');
    }

    const user = await this.staffService.getStaffById(staffId);
    const { secret, qrCode, backupCodes } = await this.otpService.generateTotpSecret(
      staffId,
      user.email,
    );

    return { secret, qrCode, backupCodes };
  }

  /**
   * Verify and enable 2FA
   */
  @Post(':staffId/2fa/enable')
  async enable2fa(
    @Param('staffId') staffId: string,
    @Body('secret') secret: string,
    @Body('otpToken') otpToken: string,
    @Body('backupCodes') backupCodes: string[],
    @Request() req,
  ) {
    if (req.user.userId !== staffId) {
      throw new ForbiddenException('Can only enable own 2FA');
    }

    return this.otpService.enableTotp(staffId, secret, otpToken, backupCodes);
  }

  /**
   * Disable 2FA
   */
  @Post(':staffId/2fa/disable')
  async disable2fa(@Param('staffId') staffId: string, @Request() req) {
    if (req.user.userId !== staffId && !(await this.rbacService.isSuperAdmin(req.user.userId))) {
      throw new ForbiddenException('No permission');
    }

    return this.otpService.disableTotp(staffId);
  }

  /**
   * Get backup codes
   */
  @Post(':staffId/2fa/backup-codes')
  async generateBackupCodes(@Param('staffId') staffId: string, @Request() req) {
    if (req.user.userId !== staffId) {
      throw new ForbiddenException('Can only generate own backup codes');
    }

    return this.otpService.generateNewBackupCodes(staffId);
  }

  // ============ ACTIVITY LOGS ============

  /**
   * Get staff activity log
   */
  @Get(':staffId/activity')
  async getActivityLog(
    @Param('staffId') staffId: string,
    @Query('limit') limit = 100,
    @Query('offset') offset = 0,
    @Request() req,
  ) {
    if (req.user.userId !== staffId) {
      const hasPermission = await this.rbacService.userHasPermission(
        req.user.userId,
        'view_staff_activity',
      );
      if (!hasPermission) throw new ForbiddenException('No permission');
    }

    return this.staffService.getStaffActivityLog(staffId, limit, offset);
  }

  // ============ PERMISSIONS ============

  /**
   * Get user's permissions
   */
  @Get(':staffId/permissions')
  async getPermissions(@Param('staffId') staffId: string, @Request() req) {
    if (req.user.userId !== staffId) {
      throw new ForbiddenException('Can only view own permissions');
    }

    return this.staffService.getStaffPermissions(staffId);
  }

  // ============ PERFORMANCE ============

  /**
   * Get staff performance metrics
   */
  @Get(':staffId/performance')
  async getPerformance(@Param('staffId') staffId: string, @Request() req) {
    if (req.user.userId !== staffId) {
      const hasPermission = await this.rbacService.userHasPermission(
        req.user.userId,
        'view_staff_performance',
      );
      if (!hasPermission) throw new ForbiddenException('No permission');
    }

    return this.staffService.getStaffPerformance(staffId);
  }

  // ============ TASKS ============

  /**
   * Create task assignment
   */
  @Post('tasks')
  @UseGuards(StaffPermissionGuard)
  @RequireStaffPermission('assign_tasks')
  async createTask(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.taskService.createTask(createTaskDto, req.user.userId);
  }

  /**
   * Get my tasks
   */
  @Get(':staffId/tasks')
  async getMyTasks(
    @Param('staffId') staffId: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @Request() req,
  ) {
    if (req.user.userId !== staffId) {
      throw new ForbiddenException('Can only view own tasks');
    }

    return this.taskService.getTasksForStaff(staffId, limit, offset);
  }

  /**
   * Update task
   */
  @Put('tasks/:taskId')
  async updateTask(@Param('taskId') taskId: string, @Body() updateDto: UpdateTaskDto, @Request() req) {
    const task = await this.taskService.getTaskById(taskId);

    if (task.assignedToId !== req.user.userId && task.assignedById !== req.user.userId) {
      const hasPermission = await this.rbacService.userHasPermission(req.user.userId, 'assign_tasks');
      if (!hasPermission) throw new ForbiddenException('No permission to update task');
    }

    return this.taskService.updateTask(taskId, updateDto);
  }

  /**
   * Complete task
   */
  @Post('tasks/:taskId/complete')
  async completeTask(@Param('taskId') taskId: string, @Request() req) {
    const task = await this.taskService.getTaskById(taskId);

    if (task.assignedToId !== req.user.userId) {
      throw new ForbiddenException('Can only complete own tasks');
    }

    return this.taskService.completeTask(taskId);
  }

  /**
   * Get task analytics
   */
  @Get('analytics/tasks')
  async getTaskAnalytics(@Request() req, @Query('staffId') staffId?: string) {
    if (staffId && staffId !== req.user.userId) {
      const hasPermission = await this.rbacService.userHasPermission(
        req.user.userId,
        'view_staff_performance',
      );
      if (!hasPermission) throw new ForbiddenException('No permission');
    }

    return this.taskService.getTaskAnalytics(staffId);
  }
}
