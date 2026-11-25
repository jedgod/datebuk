import { Module } from "@nestjs/common";
import { ConciergeController } from "./concierge.controller";
import { ConciergeService } from "./concierge.service";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { AuditModule } from "../common/audit/audit.module";
import { UsersModule } from "../users/users.module";

@Module({ imports: [SubscriptionsModule, AuditModule, UsersModule], controllers: [ConciergeController], providers: [ConciergeService], exports: [ConciergeService] })
export class ConciergeModule {}
