import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PgBossService } from "../common/pgboss/pgboss.service";
import { SMS_DISPATCH_QUEUE, SmsOutboxService } from "./sms-outbox.service";
import { dcg } from "./dcg-config";

const SWEEP_EVERY_MS = 30_000;

/**
 * Runs the outbox on this process: a pg-boss worker for low-latency dispatch plus a periodic
 * sweeper that recovers whatever a crashed process left behind. Any number of API instances can
 * run this at once - claiming a message is an exclusive database lease.
 * Does nothing unless DCG_ENABLED=true.
 */
@Injectable()
export class SmsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(SmsWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private sweeping = false;

  constructor(private outbox: SmsOutboxService, private boss: PgBossService) {}

  async onModuleInit() {
    if (!dcg.enabled()) return;

    // pg-boss hands the handler an array of jobs (older versions: a single job); accept both.
    this.boss
      .work(SMS_DISPATCH_QUEUE, async (arg: any) => {
        const jobs = Array.isArray(arg) ? arg : [arg];
        for (const job of jobs) {
          const id = job?.data?.messageId;
          if (typeof id === "string") await this.outbox.dispatchById(id);
        }
      })
      .catch((e) => this.log.error(`could not register the ${SMS_DISPATCH_QUEUE} worker: ${e?.message}`));

    this.timer = setInterval(() => void this.tick(), SWEEP_EVERY_MS);
    this.timer.unref();
    void this.tick();
    this.log.log(`SMS outbox worker ${this.outbox.workerId} started`);
  }

  async tick() {
    if (this.sweeping) return;
    this.sweeping = true;
    try {
      await this.outbox.sweep();
    } catch (e) {
      this.log.error(`sweep failed: ${(e as Error)?.message}`);
    } finally {
      this.sweeping = false;
    }
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
