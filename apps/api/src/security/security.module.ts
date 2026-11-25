import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SecurityController } from './security.controller';
import { RiskEngineService } from './risk-engine.service';
import { IpIntelligenceService } from './ip-intelligence.service';
import { AuditModule } from '../common/audit/audit.module';

/**
 * Security Module
 * Encapsulates all security-related services and controllers
 */

@Module({
  imports: [HttpModule, AuditModule],
  controllers: [SecurityController],
  providers: [RiskEngineService, IpIntelligenceService],
  exports: [RiskEngineService, IpIntelligenceService],
})
export class SecurityModule {}
