import { Injectable, OnModuleInit } from "@nestjs/common";
import { PgBossService } from "../../common/pgboss/pgboss.service";
import { PushService } from "../../push/push.service";

@Injectable()
export class PushProcessor implements OnModuleInit {
  constructor(private push: PushService, private pgBoss: PgBossService) {}

  async onModuleInit() {
    await this.pgBoss.work("push", async (job: { data: { userId: string; payload: any } }) => {
      return this.push.sendToUser(job.data.userId, job.data.payload);
    });
  }
}
