import { Module } from "@nestjs/common";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";
import { AuditModule } from "../common/audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
