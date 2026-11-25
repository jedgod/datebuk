import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionExpiryJob } from './subscription-expiry.job';
import { PrismaModule } from '../database/prisma.module';
import { FeatureAccessService } from './feature-access.service';
import { FeatureGuard } from './require-feature';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionExpiryJob, FeatureAccessService, FeatureGuard],
  exports: [SubscriptionsService, FeatureAccessService, FeatureGuard],
})
export class SubscriptionsModule {}
