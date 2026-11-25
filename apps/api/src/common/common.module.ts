/**
 * Common Module
 * Provides shared security services and utilities
 */
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis/redis.service';
import { MlService } from './ml/ml.service';
import { FraudEventTracker } from './fraud/fraud-event-tracker';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [RedisService, MlService, FraudEventTracker],
  exports: [RedisService, MlService, FraudEventTracker],
})
export class CommonModule {}
