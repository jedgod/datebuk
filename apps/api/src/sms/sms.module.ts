import { Module } from "@nestjs/common";
import { AuditModule } from "../common/audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { SmsService } from "./sms.service";
import { SmsAccountsService } from "./sms-accounts.service";
import { SmsOutboxService } from "./sms-outbox.service";
import { SmsWorkerService } from "./sms-worker.service";
import { SmsAdminController } from "./sms-admin.controller";
import { SmsWebhookController } from "./sms-webhook.controller";
import { StepUpGuard } from "../auth/step-up.guard";
import { DcgEnabledGuard } from "./dcg-enabled.guard";
import { ConsentService } from "./consent.service";
import { FraudService } from "./fraud.service";
import { OtpService } from "./otp.service";
import { ComplianceService } from "./compliance.service";
import { SmsControlService } from "./sms-control.service";
import { SmsReconcileService } from "./sms-reconcile.service";
import { SmsMonitoringService } from "./sms-monitoring.service";
import { SmsRetentionService } from "./sms-retention.service";

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [SmsAdminController, SmsWebhookController],
  providers: [
    SmsService, SmsAccountsService, SmsOutboxService, SmsWorkerService, StepUpGuard, DcgEnabledGuard,
    ConsentService, FraudService, OtpService, ComplianceService, SmsControlService, SmsReconcileService,
    SmsMonitoringService, SmsRetentionService,
  ],
  exports: [SmsService, SmsAccountsService, SmsOutboxService, OtpService, ConsentService, ComplianceService, SmsControlService],
})
export class SmsModule {}
