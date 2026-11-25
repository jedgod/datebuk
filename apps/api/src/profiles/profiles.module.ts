import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { UploadsModule } from '../uploads/uploads.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UploadsModule, UsersModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
