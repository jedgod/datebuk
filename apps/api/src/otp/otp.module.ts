import { Module } from "@nestjs/common";
import { AuditModule } from "../common/audit/audit.module";
import { SmsModule } from "../sms/sms.module";
import { OtpController } from "./otp.controller";
import { RecoveryService } from "./recovery.service";

@Module({
  imports: [AuditModule, SmsModule],
  controllers: [OtpController],
  providers: [RecoveryService],
})
export class OtpModule {}
