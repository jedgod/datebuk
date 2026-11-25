import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PgBossService } from "../common/pgboss/pgboss.service";
import { SMS_DISPATCH_QUEUE, SmsOutboxService } from "./sms-outbox.service";
import { SmsReconcileService } from "./sms-reconcile.service";
import { SmsMonitoringService } from "./sms-monitoring.service";
import { SmsRetentionService } from "./sms-retention.service";
import { ComplianceService } from "./compliance.service";
import { dcg } from "./dcg-config";
import { smsMetrics } from "./sms-metrics";

export const SMS_RECONCILE_QUEUE = "sms-reconcile";
const SWEEP_EVERY_MS = 30_000;
const RECONCILE_EVERY_MS = 5 * 60_000;
const PURGE_EVERY_MS = 24 * 3_600_000;

/**
 * Runs communications background work on this process, on the existing pg-boss + a sweeper:
 *   - sms-dispatch  pg-boss worker for low-latency sends (the sweeper also dispatches due messages)
 *   - sms-reconcile pg-boss job, enqueued every 5 minutes, runs the lease-guarded reconciliation
 *   - sweeper (30s) lease recovery, expiry, compliance-expiry, monitoring + alert evaluation
 *   - daily retention purge
 * Any number of API instances may run this; claiming, reconciling and purging are all race-safe.
 * Does nothing unless DCG_ENABLED=true.
 */
@Injectable()
export class SmsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(SmsWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private sweeping = false;
  private lastReconcileEnqueue = 0;
  private lastPurge = 0;

  constructor(
    private outbox: SmsOutboxService,
    private boss: PgBossService,
    private reconcile: SmsReconcileService,
    private monitoring: SmsMonitoringService,
    private retention: SmsRetentionService,
    private compliance: ComplianceService,
  ) {}

  async onModuleInit() {
    if (!dcg.enabled()) return;

    // pg-boss hands the handler an array of jobs (older versions: a single job); accept both.
    const each = (arg: any) => (Array.isArray(arg) ? arg : [arg]);
    this.boss
      .work(SMS_DISPATCH_QUEUE, async (arg: any) => {
        for (const job of each(arg)) {
          const id = job?.data?.messageId;
          if (typeof id === "string") await this.outbox.dispatchById(id);
        }
      })
      .catch((e) => this.log.error(`could not register the ${SMS_DISPATCH_QUEUE} worker: ${e?.message}`));
    this.boss
      .work(SMS_RECONCILE_QUEUE, async () => {
        await this.reconcile.run();
      })
      .catch((e) => this.log.error(`could not register the ${SMS_RECONCILE_QUEUE} worker: ${e?.message}`));

    this.timer = setInterval(() => void this.tick(), SWEEP_EVERY_MS);
    this.timer.unref();
    void this.tick();
    this.log.log(`SMS worker ${this.outbox.workerId} started`);
  }

  async tick() {
    if (this.sweeping) return;
    this.sweeping = true;
    try {
      const now = Date.now();
      await this.outbox.sweep();
      await this.compliance.expireDue();
      smsMetrics.inc("sweep");

      if (now - this.lastReconcileEnqueue >= RECONCILE_EVERY_MS) {
        this.lastReconcileEnqueue = now;
        // The job is the schedule; the reconcile lease makes concurrent/duplicate jobs harmless.
        await this.boss.add(SMS_RECONCILE_QUEUE, {}, { attempts: 0 }).catch((e) => this.log.warn(`reconcile job not queued: ${e?.message}`));
      }
      if (now - this.lastPurge >= PURGE_EVERY_MS) {
        this.lastPurge = now;
        await this.retention.purge();
      }
      await this.monitoring.evaluate();
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
