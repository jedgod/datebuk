import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PgBoss } = require("pg-boss");

@Injectable()
export class PgBossService implements OnModuleInit, OnModuleDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private boss: any;
  private readonly logger = new Logger("PgBossService");
  private ready: Promise<void>;
  private resolveReady!: () => void;

  constructor() {
    this.ready = new Promise((res) => {
      this.resolveReady = res;
    });
  }

  async onModuleInit() {
    // Strip query params (e.g. ?schema=public) — pg-boss doesn't support them
    const url = (
      process.env.DATABASE_URL ||
      "postgresql://postgres@localhost:5432/datepage"
    ).split("?")[0];

    this.boss = new PgBoss({ connectionString: url, max: 5 });
    this.boss.on("error", (err: Error) =>
      this.logger.error("PgBoss error: " + err.message)
    );
    await this.boss.start();

    // pg-boss requires a queue to be created before send()/work() will accept it —
    // unlike older versions, it no longer auto-creates queues on first use.
    // createQueue is idempotent, so it's safe to call on every boot.
    for (const queue of ["email", "push", "uploads", "broadcast", "sms-dispatch", "sms-reconcile"]) {
      await this.boss.createQueue(queue);
    }

    this.resolveReady();
    this.logger.log("PgBoss started — job queues backed by PostgreSQL");
  }

  async onModuleDestroy() {
    if (this.boss) await this.boss.stop();
  }

  /** Enqueue a single job */
  async add(
    queue: string,
    data: any,
    opts: { attempts?: number; delay?: number } = {}
  ) {
    await this.ready;
    await this.boss.send(queue, data, {
      retryLimit: opts.attempts ?? 3,
      retryDelay: 2,
      startAfter: opts.delay ? Math.ceil(opts.delay / 1000) : undefined,
    });
  }

  /** Bulk-enqueue jobs (used by broadcast fanout) */
  async addBulk(
    queue: string,
    jobs: Array<{ data: any; opts?: { delay?: number; attempts?: number } }>
  ) {
    await this.ready;
    await this.boss.insert(
      jobs.map((j) => ({
        name: queue,
        data: j.data,
        retryLimit: j.opts?.attempts ?? 3,
        retryDelay: 2,
        startAfter: j.opts?.delay ? Math.ceil(j.opts.delay / 1000) : 0,
      }))
    );
  }

  /** Register a worker for a queue */
  async work(
    queue: string,
    handler: (job: { data: any }) => Promise<any>
  ) {
    await this.ready;
    await this.boss.work(queue, handler);
  }
}
