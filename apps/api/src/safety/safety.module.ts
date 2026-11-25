import { Module } from "@nestjs/common";
import { PrismaModule } from "../database/prisma.module";
import { CommonModule } from "../common/common.module";
import { AuditModule } from "../common/audit/audit.module";
import { SafetyService } from "./safety.service";
import { SafetyController } from "./safety.controller";
import { SafetyInternalController } from "./safety-internal.controller";
import { AdminSafetyController } from "./admin-safety.controller";

@Module({
  imports: [PrismaModule, CommonModule, AuditModule],
  controllers: [SafetyController, SafetyInternalController, AdminSafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
