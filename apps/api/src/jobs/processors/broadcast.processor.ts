import { Injectable, OnModuleInit } from "@nestjs/common";
import { PgBossService } from "../../common/pgboss/pgboss.service";
import { AdminService, PushSegment } from "../../admin/admin.service";
import { AuditService } from "../../common/audit/audit.service";

type BroadcastJob = {
  segment: PushSegment;
  payload: any;
  actorUserId?: string;
};

@Injectable()
export class BroadcastProcessor implements OnModuleInit {
  constructor(
    private admin: AdminService,
    private audit: AuditService,
    private pgBoss: PgBossService,
  ) {}

  async onModuleInit() {
    await this.pgBoss.work("broadcast", async (job: { data: BroadcastJob }) => {
      const ids = await this.admin.resolveSegment(job.data.segment ?? {});
      const chunkSize = Math.min(Math.max(Number(process.env.BROADCAST_CHUNK_SIZE || 250), 50), 1000);
      const delayMs = Math.min(Math.max(Number(process.env.BROADCAST_CHUNK_DELAY_MS || 250), 0), 5000);

      let enqueued = 0;
      let chunkIndex = 0;

      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const delay = chunkIndex * delayMs;

        await this.pgBoss.addBulk(
          "push",
          chunk.map((userId) => ({
            data: { userId, payload: job.data.payload },
            opts: { delay, attempts: 5 },
          }))
        );

        enqueued += chunk.length;
        chunkIndex += 1;
      }

      await this.audit.log({
        action: "ADMIN_PUSH_BROADCAST_DISPATCHED",
        actorUserId: job.data.actorUserId ?? null,
        metadata: { segment: job.data.segment, total: ids.length, enqueued, chunkSize, delayMs },
      });

      return { ok: true, total: ids.length, enqueued, chunkSize, delayMs };
    });
  }
}
