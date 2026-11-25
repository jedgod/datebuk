import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { MatchesModule } from "./matches/matches.module";
import { MessagesModule } from "./messages/messages.module";
import { PrismaModule } from "./database/prisma.module";
import { EmailModule } from "./common/email/email.module";
import { SwipesModule } from "./swipes/swipes.module";
import { UploadsModule } from "./uploads/uploads.module";
import { PushModule } from "./push/push.module";
import { AuditModule } from "./common/audit/audit.module";
import { SecurityAlertModule } from "./common/security-alerts/security-alert.module";
import { CommonModule } from "./common/common.module";
import { JobsModule } from "./jobs/jobs.module";
import { PgBossModule } from "./common/pgboss/pgboss.module";
import { MetricsModule } from "./observability/metrics.module";
import { HealthModule } from "./observability/health.module";
import { PermissionsGuard } from "./auth/permissions.guard";
import { SessionsModule } from "./sessions/sessions.module";
import { AdminModule } from "./admin/admin.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { SupportModule } from "./support/support.module";
import { SecurityModule } from "./security/security.module";
import { StaffModule } from "./staff/staff.module";
import { validateEnvironment } from "./config/environment";
import { ConciergeModule } from "./concierge/concierge.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SettingsModule } from "./settings/settings.module";
import { VerificationModule } from "./verification/verification.module";
import { IdentityModule } from "./identity/identity.module";
import { SmsModule } from "./sms/sms.module";
import { SafetyModule } from "./safety/safety.module";
import { CallsModule } from "./calls/calls.module";
import { AdminIpAllowlistGuard } from "./common/guards/admin-ip-allowlist.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60_000,
      limit: 120,
    }]),
    PrismaModule,
    EmailModule,
    SecurityAlertModule,
    AuditModule,
    CommonModule,
    PgBossModule,
    JobsModule,
    MetricsModule,
    HealthModule,
    SessionsModule,
    SecurityModule,
    StaffModule,
    AdminModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    MatchesModule,
    MessagesModule,
    SwipesModule,
    UploadsModule,
    PushModule,
    SubscriptionsModule,
    SupportModule,
    ConciergeModule,
    NotificationsModule,
    SettingsModule,
    VerificationModule,
    IdentityModule,
    SmsModule,
    SafetyModule,
    CallsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AdminIpAllowlistGuard },
  ],
})
export class AppModule {}
