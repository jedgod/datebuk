import { Module } from "@nestjs/common";
import { VerificationController } from "./verification.controller";
import { AdminVerificationController } from "./admin-verification.controller";
import { VerificationService } from "./verification.service";
import { UploadsModule } from "../uploads/uploads.module";
import { UsersModule } from "../users/users.module";
import { AuditModule } from "../common/audit/audit.module";

@Module({
  imports: [UploadsModule, UsersModule, AuditModule],
  controllers: [VerificationController, AdminVerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
