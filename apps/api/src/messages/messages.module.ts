import { Module, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";
import { RealtimeModule } from "../realtime/realtime.module";
import { AuditModule } from "../common/audit/audit.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { UploadsModule } from "../uploads/uploads.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SafetyModule } from "../safety/safety.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    // BullModule.registerQueue({ name: "push" }),
    AuditModule,
    SubscriptionsModule,
    UploadsModule,
    NotificationsModule,
    SafetyModule,
    UsersModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
