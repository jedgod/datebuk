import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { SecurityAlertService } from "../common/security-alerts/security-alert.service";
import { SmsAccountsService } from "./sms-accounts.service";
import { twilioGet } from "./twilio-api";
import { applyProviderStatus } from "./sms-state";
import { smsMetrics } from "./sms-metrics";

const LEASE_NAME = "reconcile_lease";
const LEASE_SECONDS = 240;
const MIN_AGE_MINUTES = 10; // give the normal callback a chance first
const RECHECK_HOURS = 1;
const ESCALATE_UNCERTAIN_AFTER_MINUTES = 30;

export type ReconcileReport = { skipped?: "lease_held"; checked: number; updated: number; escalated: number; rateLimited: boolean };

/**
 * Scheduled comparison of our message records with Twilio's.
 *
 *  - Only ONE worker reconciles at a time (a lease row), and each run is bounded in size.
 *  - Messages we already hold a provider id for (accepted / sending / sent) are looked up by that
 *    id on the SAME account that sent them. The reply's sid and account sid must both match, or
 *    the message is escalated instead of trusted.
 *  - Updates go through the state model (late/out-of-order data can't move a message backwards)
 *    and are optimistic (a callback that raced us wins).
 *  - A provider rate limit (429) stops the run; the next scheduled run continues.
 *  - An `uncertain` message with no provider id CANNOT be matched (its recipient and text were
 *    erased by design). It is flagged for a human, never guessed at and never resent.
 */
@Injectable()
export class SmsReconcileService {
  private readonly log = new Logger(SmsReconcileService.name);
  private readonly workerId = randomUUID().slice(0, 8);

  constructor(private prisma: PrismaService, private accounts: SmsAccountsService, private audit: AuditService, private alerts: SecurityAlertService) {}

  private async acquireLease(): Promise<boolean> {
    await this.prisma.smsControl.upsert({ where: { key: LEASE_NAME }, update: {}, create: { key: LEASE_NAME, value: "free" } });
    const rows = await this.prisma.$executeRaw`
      UPDATE "SmsControl" SET "value" = ${this.workerId}, "updatedAt" = (now() AT TIME ZONE 'UTC')
       WHERE "key" = ${LEASE_NAME}
         AND ("value" = 'free' OR "updatedAt" < (now() AT TIME ZONE 'UTC') - ${LEASE_SECONDS}::int * interval '1 second')`;
    return rows === 1;
  }

  private async releaseLease() {
    await this.prisma.smsControl.updateMany({ where: { key: LEASE_NAME, value: this.workerId }, data: { value: "free" } });
  }

  async run(limit = 25): Promise<ReconcileReport> {
    const report: ReconcileReport = { checked: 0, updated: 0, escalated: 0, rateLimited: false };
    if (!(await this.acquireLease())) return { ...report, skipped: "lease_held" };
    try {
      const now = Date.now();
      const stale = await this.prisma.smsMessage.findMany({
        where: {
          state: { in: ["accepted", "scheduled", "sending", "sent"] },
          providerSid: { not: null },
          accountId: { not: null },
          updatedAt: { lt: new Date(now - MIN_AGE_MINUTES * 60_000) },
          OR: [{ lastReconciledAt: null }, { lastReconciledAt: { lt: new Date(now - RECHECK_HOURS * 3_600_000) } }],
        },
        orderBy: { updatedAt: "asc" },
        take: limit,
      });

      const accountCache = new Map<string, Awaited<ReturnType<SmsReconcileService["loadAccount"]>>>();
      for (const m of stale) {
        if (report.rateLimited) break;
        report.checked++;
        let acct = accountCache.get(m.accountId!);
        if (acct === undefined) {
          acct = await this.loadAccount(m.accountId!);
          accountCache.set(m.accountId!, acct);
        }
        if (!acct) {
          // account revoked / credentials gone: nothing to ask. Mark so we don't re-select it every run.
          await this.prisma.smsMessage.update({ where: { id: m.id }, data: { lastReconciledAt: new Date() } });
          continue;
        }
        const r = await twilioGet(`https://api.twilio.com/2010-04-01/Accounts/${acct.accountSid}/Messages/${m.providerSid}.json`, acct.creds);
        if (r.status === 429) {
          report.rateLimited = true;
          break;
        }
        if (r.status === 200 && r.body?.sid === m.providerSid && r.body?.account_sid === acct.accountSid) {
          const next = applyProviderStatus(m.state, String(r.body.status ?? ""));
          const u = await this.prisma.smsMessage.updateMany({
            where: { id: m.id, state: m.state },
            data: { lastReconciledAt: new Date(), ...(next ? { state: next, lastError: null } : {}) },
          });
          if (next && u.count === 1) report.updated++;
        } else {
          // 404 (provider has no such message), a mismatched id, or any other answer: don't guess.
          await this.prisma.smsMessage.update({ where: { id: m.id }, data: { needsReview: true, lastReconciledAt: new Date(), lastError: `reconciliation could not verify with provider (HTTP ${r.status})` } });
          report.escalated++;
        }
      }

      // Uncertain with no provider id: unmatchable by design -> human review, once.
      const orphans = await this.prisma.smsMessage.updateMany({
        where: { state: "uncertain", providerSid: null, needsReview: false, updatedAt: { lt: new Date(now - ESCALATE_UNCERTAIN_AFTER_MINUTES * 60_000) } },
        data: { needsReview: true },
      });
      report.escalated += orphans.count;
      if (orphans.count > 0) {
        await this.alerts.raise("SMS_RECONCILE_ESCALATION", "medium", `${orphans.count} message(s) with an unknown delivery outcome need review`, { count: orphans.count });
      }

      await this.audit.log({ action: "SMS_RECONCILE_RUN", actorUserId: null, metadata: { ...report } });
      smsMetrics.inc("reconcile_run");
      return report;
    } finally {
      await this.releaseLease();
    }
  }

  private async loadAccount(id: string) {
    const a = await this.prisma.twilioAccount.findUnique({ where: { id } });
    if (!a) return null;
    try {
      const creds = this.accounts.restCredentials(a);
      return creds ? { accountSid: a.accountSid, creds } : null;
    } catch (e) {
      // An unreadable credential (wrong key, corrupted row) must not break the run for every other account.
      this.log.error(`reconciliation skipped account ${a.id}: credentials unreadable (${(e as Error).message})`);
      return null;
    }
  }
}
