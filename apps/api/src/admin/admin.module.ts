import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { HttpModule } from "@nestjs/axios";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FraudController } from "./fraud.controller";
import { ModeratorController } from "./moderator.controller";
import { ExperimentController } from "./experiment.controller";
import { VideoModerationController } from "./video-moderation.controller";
import { VideoMonitorController } from "./video-monitor.controller";
import { VideoMonitorService } from "./video-monitor.service";
import { SecurityAlertController } from "./security-alert.controller";
import { FeatureAdminController } from "./feature-admin.controller";
import { AuditModule } from "../common/audit/audit.module";
import { PrismaModule } from "../database/prisma.module";
import { UploadsModule } from "../uploads/uploads.module";
import { FraudEventTracker } from "../common/fraud/fraud-event-tracker";
import { RedisService } from "../common/redis/redis.service";

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    AuditModule,
    UploadsModule,
    // BullModule.registerQueue(
    //   { name: "push" },
    //   { name: "broadcast" },
    // ),
  ],
  controllers: [AdminController, FraudController, ModeratorController, ExperimentController, VideoModerationController, VideoMonitorController, SecurityAlertController, FeatureAdminController],
  providers: [AdminService, FraudEventTracker, RedisService, VideoMonitorService],
  exports: [AdminService, FraudEventTracker, RedisService],
})
export class AdminModule {}
