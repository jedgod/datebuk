import { Module } from "@nestjs/common";
import { EmailProcessor } from "./processors/email.processor";
import { PushProcessor } from "./processors/push.processor";
import { UploadsProcessor } from "./processors/uploads.processor";
import { BroadcastProcessor } from "./processors/broadcast.processor";
import { EmailModule } from "../common/email/email.module";
import { AuditModule } from "../common/audit/audit.module";
import { PushModule } from "../push/push.module";
import { UploadsModule } from "../uploads/uploads.module";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [EmailModule, AuditModule, PushModule, UploadsModule, AdminModule],
  providers: [EmailProcessor, PushProcessor, UploadsProcessor, BroadcastProcessor],
})
export class JobsModule {}
