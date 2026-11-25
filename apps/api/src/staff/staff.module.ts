import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { AdminRbacController } from './admin-rbac.controller';
import { StaffService } from './staff.service';
import { OtpService } from './otp.service';
import { RbacService } from './rbac.service';
import { TaskService } from './task.service';
import { StaffPermissionGuard } from './guards/permission.guard';
import { PrismaService } from '../database/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StaffController, AdminRbacController],
  providers: [StaffService, OtpService, RbacService, TaskService, StaffPermissionGuard, PrismaService],
  exports: [StaffService, OtpService, RbacService, TaskService],
})
export class StaffModule {}
