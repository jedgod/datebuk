import { Module } from "@nestjs/common";
import { SwipesController } from "./swipes.controller";
import { SwipesService } from "./swipes.service";
import { AuditModule } from "../common/audit/audit.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UploadsModule } from "../uploads/uploads.module";
import { SafetyModule } from "../safety/safety.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [AuditModule, SubscriptionsModule, NotificationsModule, UploadsModule, SafetyModule, UsersModule],
  controllers: [SwipesController],
  providers: [SwipesService],
})
export class SwipesModule {}
