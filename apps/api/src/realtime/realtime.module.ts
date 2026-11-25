import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChatGateway } from "./chat.gateway";
import { MessagesModule } from "../messages/messages.module";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
      }),
    }),
    forwardRef(() => MessagesModule),
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class RealtimeModule {}
