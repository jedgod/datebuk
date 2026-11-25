import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { SecurityAlertService } from "../common/security-alerts/security-alert.service";
import { SmsControlService } from "./sms-control.service";
import { smsMetrics } from "./sms-metrics";

const MIN = 60_000;
const HOUR = 3_600_000;

export const alertThresholds = () => ({
  backlog: Number(process.env.DCG_ALERT_BACKLOG ?? 50),
  oldestQueuedSeconds: Number(process.env.DCG_ALERT_OLDEST_QUEUED_SECONDS ?? 300),
  uncertainAgeMinutes: Number(process.env.DCG_ALERT_UNCERTAIN_MINUTES ?? 60),
  failureRatePct: Number(process.env.DCG_ALERT_FAILURE_RATE_PCT ?? 20),
  failureRateMinMessages: Number(process.env.DCG_ALERT_FAILURE_MIN_MESSAGES ?? 10),
  budgetPct: Number(process.env.DCG_ALERT_BUDGET_PCT ?? 80),
  signatureRejections5m: Number(process.env.DCG_ALERT_SIGNATURE_REJECTIONS_5M ?? 10),
  workerSilentSeconds: Number(process.env.DCG_ALERT_WORKER_SILENT_SECONDS ?? 180),
});

const startOfUtcDay = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};

/**
 * Operational health of outbound communications, and the alerts derived from it.
 * Alerts go through the existing SecurityAlert pipeline (de-duplicated, severity levels,
 * acknowledge/resolve with notes = the incident workflow), so there is one place on-call looks.
 * Inputs and outputs are counts, ages and ids only: never credentials, OTPs or message contents.
 */
@Injectable()
export class SmsMonitoringService {
  private readonly log = new Logger(SmsMonitoringService.name);

  constructor(private prisma: PrismaService, private alerts: SecurityAlertService, private control: SmsControlService) {}

  async snapshot() {
    const now = Date.now();
    const [queued, dueNow, oldest, dispatching, uncertain, needsReview, oldestUncertain] = await Promise.all([
      this.prisma.smsMessage.count({ where: { state: "queued" } }),
      this.prisma.smsMessage.count({ where: { state: "queued", nextAttemptAt: { lte: new Date() } } }),
      this.prisma.smsMessage.findFirst({ where: { state: "queued", nextAttemptAt: { lte: new Date() } }, orderBy: { nextAttemptAt: "asc" }, select: { nextAttemptAt: true } }),
      this.prisma.smsMessage.count({ where: { state: "dispatching" } }),
      this.prisma.smsMessage.count({ where: { state: "uncertain" } }),
      this.prisma.smsMessage.count({ where: { needsReview: true } }),
      this.prisma.smsMessage.findFirst({ where: { state: "uncertain" }, orderBy: { updatedAt: "asc" }, select: { updatedAt: true } }),
    ]);

    const last24 = await this.prisma.smsMessage.findMany({
      where: { createdAt: { gte: new Date(now - 24 * HOUR) } },
      select: { state: true, createdAt: true, updatedAt: true },
    });
    const by: Record<string, number> = {};
    const latencies: number[] = [];
    for (const m of last24) {
      by[m.state] = (by[m.state] ?? 0) + 1;
      if (m.state === "delivered") latencies.push((m.updatedAt.getTime() - m.createdAt.getTime()) / 1000);
    }
    latencies.sort((a, b) => a - b);
    const failed = (by.failed ?? 0) + (by.undelivered ?? 0);
    const terminal = failed + (by.delivered ?? 0);

    const accounts = await this.prisma.twilioAccount.findMany({ where: { status: { not: "revoked" } }, select: { id: true, name: true, dailySegmentLimit: true, monthlySegmentLimit: true } });
    const budget = await Promise.all(
      accounts.map(async (a) => {
        const used = (await this.prisma.smsMessage.aggregate({ _sum: { segments: true }, where: { accountId: a.id, createdAt: { gte: startOfUtcDay() }, state: { notIn: ["failed", "canceled"] } } }))._sum.segments ?? 0;
        return { accountId: a.id, name: a.name, segmentsToday: used, dailyLimit: a.dailySegmentLimit, pct: a.dailySegmentLimit ? Math.round((used / a.dailySegmentLimit) * 100) : null };
      }),
    );

    const [openRisk, highRiskHour, otpHour] = await Promise.all([
      this.prisma.smsRiskEvent.count({ where: { status: "open" } }),
      this.prisma.smsRiskEvent.count({ where: { severity: "high", createdAt: { gte: new Date(now - HOUR) } } }),
      this.prisma.otpChallenge.count({ where: { createdAt: { gte: new Date(now - HOUR) } } }),
    ]);

    return {
      at: new Date(now).toISOString(),
      queue: {
        queued,
        dueNow,
        dispatching,
        oldestDueAgeSeconds: oldest ? Math.max(0, Math.round((now - oldest.nextAttemptAt.getTime()) / 1000)) : 0,
      },
      reconciliation: {
        uncertain,
        needsReview,
        oldestUncertainAgeSeconds: oldestUncertain ? Math.round((now - oldestUncertain.updatedAt.getTime()) / 1000) : 0,
      },
      delivery: {
        last24h: { total: last24.length, byState: by, failureRatePct: terminal ? Math.round((failed / terminal) * 1000) / 10 : null, medianLatencySeconds: latencies.length ? Math.round(latencies[Math.floor(latencies.length / 2)]) : null },
      },
      budget,
      security: {
        webhookRejections5m: smsMetrics.count("webhook_rejected", 5 * MIN),
        openRiskEvents: openRisk,
        highRiskEventsLastHour: highRiskHour,
        otpRequestsLastHour: otpHour,
      },
      worker: { sweepsLast10m: smsMetrics.count("sweep", 10 * MIN) },
      control: await this.control.status(),
    };
  }

  /** Called on every sweep. Raises (de-duplicated) alerts for conditions that need a human. */
  async evaluate() {
    const T = alertThresholds();
    try {
      const s = await this.snapshot();
      const raise = (rule: string, sev: "low" | "medium" | "high" | "critical", summary: string, evidence: unknown) => this.alerts.raise(rule, sev, summary, evidence);

      if (s.queue.dueNow >= T.backlog || s.queue.oldestDueAgeSeconds >= T.oldestQueuedSeconds) {
        await raise("SMS_BACKLOG", "high", "Outbound SMS queue is backing up", { queued: s.queue.queued, dueNow: s.queue.dueNow, oldestDueAgeSeconds: s.queue.oldestDueAgeSeconds });
      }
      if (s.reconciliation.uncertain > 0 && s.reconciliation.oldestUncertainAgeSeconds >= T.uncertainAgeMinutes * 60) {
        await raise("SMS_UNCERTAIN_STALE", "medium", "Messages with an unknown delivery outcome are unresolved", { uncertain: s.reconciliation.uncertain, needsReview: s.reconciliation.needsReview });
      }
      const fr = s.delivery.last24h;
      if (fr.failureRatePct != null && fr.total >= T.failureRateMinMessages && fr.failureRatePct >= T.failureRatePct) {
        await raise("SMS_FAILURE_RATE", "high", "SMS failure rate is elevated", { failureRatePct: fr.failureRatePct, total: fr.total });
      }
      for (const b of s.budget) {
        if (b.pct != null && b.pct >= T.budgetPct) {
          await raise("SMS_BUDGET", b.pct >= 100 ? "high" : "medium", `SMS daily budget at ${b.pct}% (${b.name})`, { accountId: b.accountId, pct: b.pct });
        }
      }
      if (s.security.webhookRejections5m >= T.signatureRejections5m) {
        await raise("SMS_WEBHOOK_REJECTIONS", "high", "Many webhook requests are failing signature verification", { rejections5m: s.security.webhookRejections5m });
      }
      if (s.security.highRiskEventsLastHour > 0) {
        await raise("SMS_OTP_ABUSE", "high", "High-risk SMS/OTP abuse activity detected", { events: s.security.highRiskEventsLastHour });
      }
      return s;
    } catch (e) {
      this.log.warn(`monitoring evaluation failed: ${(e as Error).message}`);
      return null;
    }
  }
}
