import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { UploadsModule } from '../uploads/uploads.module';
import { SafetyModule } from '../safety/safety.module';

@Module({ imports: [UploadsModule, SafetyModule], controllers:[MatchesController], providers:[MatchesService] })
export class MatchesModule {}
