import { Module } from "@nestjs/common";
import { NativeCallInfrastructureController, PushController } from "./push.controller";
import { PushService } from "./push.service";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [UsersModule],
  controllers: [PushController, NativeCallInfrastructureController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
