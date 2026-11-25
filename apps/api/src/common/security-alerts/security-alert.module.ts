import { Global, Module } from "@nestjs/common";
import { SecurityAlertService } from "./security-alert.service";

// Global like PrismaModule: SecurityAlertService is injected from several unrelated
// modules (AuditService, both permission guards, StaffService, AdminService) and none of
// them should need to import a chain of modules just to record a signal.
@Global()
@Module({
  providers: [SecurityAlertService],
  exports: [SecurityAlertService],
})
export class SecurityAlertModule {}
