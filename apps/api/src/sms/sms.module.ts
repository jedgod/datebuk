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

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [SmsAdminController, SmsWebhookController],
  providers: [SmsService, SmsAccountsService, SmsOutboxService, SmsWorkerService, StepUpGuard, DcgEnabledGuard],
  exports: [SmsService, SmsAccountsService, SmsOutboxService],
})
export class SmsModule {}
