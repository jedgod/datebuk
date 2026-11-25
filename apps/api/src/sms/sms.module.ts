import { Module } from "@nestjs/common";
import { AuditModule } from "../common/audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { SmsService } from "./sms.service";
import { SmsAccountsService } from "./sms-accounts.service";
import { SmsAdminController } from "./sms-admin.controller";
import { SmsWebhookController } from "./sms-webhook.controller";
import { StepUpGuard } from "../auth/step-up.guard";
import { DcgEnabledGuard } from "./dcg-enabled.guard";

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [SmsAdminController, SmsWebhookController],
  providers: [SmsService, SmsAccountsService, StepUpGuard, DcgEnabledGuard],
  exports: [SmsService, SmsAccountsService],
})
export class SmsModule {}
