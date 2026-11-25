import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CallsController } from "./calls.controller";
import { CallsService } from "./calls.service";
import { SafetyModule } from "../safety/safety.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>("JWT_SECRET") }),
    }),
    SafetyModule,
    SubscriptionsModule,
    UsersModule,
  ],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}
