import "dotenv/config";
import "reflect-metadata";

jest.mock("../common/pgboss/pgboss.service", () => ({ PgBossService: class PgBossService {} }));

import { ServiceUnavailableException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { randomBytes, randomUUID } from "crypto";
import { SmsAccountsService } from "./sms-accounts.service";
import { SmsOutboxService } from "./sms-outbox.service";
import { SmsReconcileService } from "./sms-reconcile.service";
import { SmsMonitoringService } from "./sms-monitoring.service";
import { SmsControlService } from "./sms-control.service";
import { smsMetrics } from "./sms-metrics";
import { credentialContext, vaultEncrypt } from "../common/security/credential-vault";
import { createAccountWithRetry } from "./it-db";

const run = process.env.DATABASE_URL ? describe : describe.skip;
const ENV = { ...process.env };
const hex = (n: number) => randomBytes(n / 2).toString("hex");
const ago = (min: number) => new Date(Date.now() - min * 60_000);
const reply = (status: number, body: any = {}) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

run("reconciliation, monitoring and emergency stop (real PostgreSQL)", () => {
  const prisma = new PrismaClient();
  const audit: any = { log: jest.fn().mockResolvedValue(undefined) };
  const alerts: any = { raise: jest.fn().mockResolvedValue(undefined) };
  const boss: any = { add: jest.fn().mockResolvedValue(undefined) };
  let accounts: SmsAccountsService;
  let reconcile: SmsReconcileService;
  let fetchSpy: jest.SpyInstance;
  let blocked = false;

  const madeAccounts: string[] = [];
  const madeMessages: string[] = [];

  async function mkAccount(status: "verified" | "active" | "revoked" = "verified", extra: Record<string, any> = {}) {
    const id = randomUUID();
    const sid = "AC" + hex(32);
    const token = "tok_" + hex(40);
    await createAccountWithRetry(prisma, {
      data: {
        id, name: "itest-" + id.slice(0, 6), accountSid: sid, status, keyVersion: 1,
        encryptedAuthToken: status === "revoked" ? null : vaultEncrypt(token, credentialContext(id, "authToken")).payload,
        senders: { create: { senderNumber: "+14155550100" } },
        ...extra,
      },
    });
    madeAccounts.push(id);
    return { id, sid, token };
  }
  async function mkMsg(accountId: string | null, state: string, o: { sid?: string | null; updated?: Date; reconciled?: Date | null; segments?: number; created?: Date; review?: boolean } = {}) {
    const id = randomUUID();
    await prisma.smsMessage.create({
      data: {
        id, accountId, state, purpose: "itest", recipientLast4: "0000", segments: o.segments ?? 1,
        providerSid: o.sid === undefined ? "SM" + hex(32) : o.sid,
        updatedAt: o.updated ?? ago(30), createdAt: o.created ?? o.updated ?? ago(30),
        lastReconciledAt: o.reconciled ?? null, needsReview: o.review ?? false,
      },
    });
    madeMessages.push(id);
    return id;
  }
  const get = (id: string) => prisma.smsMessage.findUniqueOrThrow({ where: { id } });
  const freeLease = () => prisma.smsControl.upsert({ where: { key: "reconcile_lease" }, update: { value: "free" }, create: { key: "reconcile_lease", value: "free" } });

  beforeAll(async () => {
    blocked = (await prisma.twilioAccount.count({ where: { status: "active", NOT: { name: { startsWith: "itest-" } } } })) > 0;
  });
  beforeEach(async () => {
    process.env = { ...ENV, NODE_ENV: "test", DCG_ENABLED: "true", DCG_HMAC_KEY: ENV.DCG_HMAC_KEY || randomBytes(32).toString("base64"), DCG_ENCRYPTION_KEY: ENV.DCG_ENCRYPTION_KEY || randomBytes(32).toString("base64"), DCG_ENCRYPTION_KEY_VERSION: "1" };
    accounts = new SmsAccountsService(prisma as any, audit);
    reconcile = new SmsReconcileService(prisma as any, accounts, audit, alerts);
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(() => reply(500) as any);
    alerts.raise.mockClear();
    smsMetrics.reset();
    await freeLease();
  });
  afterEach(async () => {
    fetchSpy.mockRestore();
    await prisma.twilioAccount.updateMany({ where: { id: { in: madeAccounts }, status: { not: "revoked" } }, data: { status: "revoked", encryptedAuthToken: null } });
  });
  afterAll(async () => {
    process.env = ENV;
    await prisma.smsMessage.deleteMany({ where: { OR: [{ id: { in: madeMessages } }, { purpose: "itest" }] } });
    await prisma.twilioAccount.deleteMany({ where: { id: { in: madeAccounts } } });
    await prisma.smsControl.deleteMany({ where: { key: { in: ["reconcile_lease", "emergency_stop"] } } });
    await prisma.$disconnect();
  });
  const t = (name: string, fn: () => Promise<void>) => it(name, fn, 90_000);
  const tAcct = (name: string, fn: () => Promise<void>) => it(name, async () => (blocked ? undefined : fn()), 90_000);

  // ------------------------------------------------------------------ reconciliation
  describe("scheduled reconciliation", () => {
    t("a stale accepted message is brought up to date from the provider's record (verified ids)", async () => {
      const a = await mkAccount();
      const sid = "SM" + hex(32);
      const id = await mkMsg(a.id, "sent", { sid });
      fetchSpy.mockImplementation(() => reply(200, { sid, account_sid: a.sid, status: "delivered" }) as any);
      const r = await reconcile.run();
      expect(r).toMatchObject({ checked: 1, updated: 1, escalated: 0 });
      expect(await get(id)).toMatchObject({ state: "delivered", needsReview: false });
      expect(String(fetchSpy.mock.calls[0][0])).toContain(`/Accounts/${a.sid}/Messages/${sid}.json`); // the sending account, the message's own id
    });

    t("provider data that is older than what we know can't move a message backwards", async () => {
      const a = await mkAccount();
      const sid = "SM" + hex(32);
      const id = await mkMsg(a.id, "sent", { sid });
      fetchSpy.mockImplementation(() => reply(200, { sid, account_sid: a.sid, status: "sending" }) as any);
      const r = await reconcile.run();
      expect(r.updated).toBe(0);
      const row = await get(id);
      expect(row.state).toBe("sent");
      expect(row.lastReconciledAt).not.toBeNull();
    });

    t("a message the provider has never heard of is escalated, not guessed at", async () => {
      const a = await mkAccount();
      const id = await mkMsg(a.id, "accepted");
      fetchSpy.mockImplementation(() => reply(404, { code: 20404 }) as any);
      expect((await reconcile.run()).escalated).toBe(1);
      expect(await get(id)).toMatchObject({ state: "accepted", needsReview: true });
    });

    t("a reply whose message id or account id doesn't match is not trusted", async () => {
      const a = await mkAccount();
      const sid1 = "SM" + hex(32);
      const m1 = await mkMsg(a.id, "sent", { sid: sid1 });
      fetchSpy.mockImplementationOnce(() => reply(200, { sid: "SM" + hex(32), account_sid: a.sid, status: "delivered" }) as any);
      const sid2 = "SM" + hex(32);
      const m2 = await mkMsg(a.id, "sent", { sid: sid2, updated: ago(31) });
      fetchSpy.mockImplementationOnce(() => reply(200, { sid: sid2, account_sid: "AC" + hex(32), status: "delivered" }) as any);
      const r = await reconcile.run();
      expect(r.escalated).toBe(2);
      expect((await get(m1)).state).toBe("sent");
      expect((await get(m2)).state).toBe("sent");
    });

    t("a provider rate limit stops the run; the remaining messages wait for the next one", async () => {
      const a = await mkAccount();
      const ids = [await mkMsg(a.id, "sent"), await mkMsg(a.id, "sent", { updated: ago(31) }), await mkMsg(a.id, "sent", { updated: ago(32) })];
      fetchSpy.mockImplementation(() => reply(429, {}) as any);
      const r = await reconcile.run();
      expect(r.rateLimited).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1); // stopped immediately, no hammering
      for (const id of ids) expect((await get(id)).lastReconciledAt).toBeNull(); // still due next run
    });

    t("each run is bounded", async () => {
      const a = await mkAccount();
      for (let i = 0; i < 5; i++) await mkMsg(a.id, "sent", { updated: ago(40 + i) });
      fetchSpy.mockImplementation(() => reply(404) as any);
      expect((await reconcile.run(2)).checked).toBe(2);
    });

    t("only one worker reconciles at a time (lease), and an abandoned lease is recovered", async () => {
      const a = await mkAccount();
      await mkMsg(a.id, "sent");
      await prisma.smsControl.update({ where: { key: "reconcile_lease" }, data: { value: "other-worker" } });
      expect(await reconcile.run()).toMatchObject({ skipped: "lease_held", checked: 0 });
      expect(fetchSpy).not.toHaveBeenCalled();
      await prisma.$executeRaw`UPDATE "SmsControl" SET "updatedAt" = (now() AT TIME ZONE 'UTC') - interval '10 minutes' WHERE "key" = 'reconcile_lease'`;
      fetchSpy.mockImplementation(() => reply(404) as any);
      expect((await reconcile.run()).skipped).toBeUndefined();
    });

    t("two reconcilers started together: exactly one does the work", async () => {
      const a = await mkAccount();
      for (let i = 0; i < 3; i++) await mkMsg(a.id, "sent", { updated: ago(40 + i) });
      // The provider call takes a moment, so the first run is still holding the lease when the second starts.
      fetchSpy.mockImplementation(() => new Promise((res) => setTimeout(() => res(reply(404)), 400)) as any);
      const other = new SmsReconcileService(prisma as any, accounts, audit, alerts);
      const [x, y] = await Promise.all([reconcile.run(), other.run()]);
      expect([x.skipped, y.skipped].filter(Boolean)).toEqual(["lease_held"]);
    });

    t("recent messages and recently-checked ones are left alone; revoked accounts are skipped without a request", async () => {
      const a = await mkAccount();
      await mkMsg(a.id, "sent", { updated: ago(2) }); // too fresh: callbacks get first go
      await mkMsg(a.id, "sent", { reconciled: ago(5) }); // checked a few minutes ago
      const dead = await mkAccount("revoked");
      const stale = await mkMsg(dead.id, "sent");
      const r = await reconcile.run();
      expect(r.checked).toBe(1); // only the revoked account's message was even considered
      expect(fetchSpy).not.toHaveBeenCalled();
      expect((await get(stale)).lastReconciledAt).not.toBeNull();
    });

    t("an uncertain message with no provider id can't be matched: flagged for review, never resent", async () => {
      const a = await mkAccount();
      const id = await mkMsg(a.id, "uncertain", { sid: null, updated: ago(45) });
      const r = await reconcile.run();
      expect(r.escalated).toBeGreaterThanOrEqual(1);
      expect(await get(id)).toMatchObject({ state: "uncertain", needsReview: true });
      expect(fetchSpy).not.toHaveBeenCalled(); // no lookup, no send
      expect(alerts.raise).toHaveBeenCalledWith("SMS_RECONCILE_ESCALATION", "medium", expect.any(String), expect.anything());
    });
  });

  // ------------------------------------------------------------------ monitoring
  describe("monitoring and alerts", () => {
    const monitoring = () => new SmsMonitoringService(prisma as any, alerts, new SmsControlService(prisma as any, audit, alerts));
    const raised = (rule: string) => alerts.raise.mock.calls.some((c: any[]) => c[0] === rule);

    t("the snapshot reports queue, reconciliation, delivery, budget and security signals - counts only", async () => {
      const a = await mkAccount("verified", { dailySegmentLimit: 100 });
      await mkMsg(a.id, "delivered", { updated: ago(1), created: ago(2) });
      await mkMsg(a.id, "uncertain", { sid: null, updated: ago(5) });
      const s = await monitoring().snapshot();
      expect(s.queue).toHaveProperty("queued");
      expect(s.reconciliation.uncertain).toBeGreaterThanOrEqual(1);
      expect(s.delivery.last24h.total).toBeGreaterThanOrEqual(2);
      expect(s.budget.find((b) => b.accountId === a.id)).toMatchObject({ segmentsToday: 2, dailyLimit: 100, pct: 2 });
      expect(s.security).toHaveProperty("webhookRejections5m");
      const dump = JSON.stringify(s);
      expect(dump).not.toMatch(/tok_|encrypted|authToken|apiKey|SM[0-9a-f]{32}/); // no credentials, no provider ids
    });

    t("backlog alert", async () => {
      process.env.DCG_ALERT_BACKLOG = "1";
      const a = await mkAccount();
      await mkMsg(a.id, "queued", { sid: null });
      await monitoring().evaluate();
      expect(raised("SMS_BACKLOG")).toBe(true);
    });

    t("stale-uncertain alert", async () => {
      process.env.DCG_ALERT_UNCERTAIN_MINUTES = "1";
      const a = await mkAccount();
      await mkMsg(a.id, "uncertain", { sid: null, updated: ago(120) });
      await monitoring().evaluate();
      expect(raised("SMS_UNCERTAIN_STALE")).toBe(true);
    });

    t("failure-rate alert", async () => {
      process.env.DCG_ALERT_FAILURE_RATE_PCT = "1";
      process.env.DCG_ALERT_FAILURE_MIN_MESSAGES = "5";
      const a = await mkAccount();
      for (let i = 0; i < 8; i++) await mkMsg(a.id, "failed", { updated: ago(1), created: ago(2) });
      await monitoring().evaluate();
      expect(raised("SMS_FAILURE_RATE")).toBe(true);
    });

    t("budget alert at 80% of the daily cap", async () => {
      const a = await mkAccount("verified", { dailySegmentLimit: 10 });
      await mkMsg(a.id, "accepted", { segments: 9, updated: ago(1), created: ago(1) });
      await monitoring().evaluate();
      expect(alerts.raise.mock.calls.some((c: any[]) => c[0] === "SMS_BUDGET" && c[3]?.accountId === a.id)).toBe(true);
    });

    t("signature-rejection alert (process-local counter)", async () => {
      process.env.DCG_ALERT_SIGNATURE_REJECTIONS_5M = "5";
      for (let i = 0; i < 6; i++) smsMetrics.inc("webhook_rejected");
      await monitoring().evaluate();
      expect(raised("SMS_WEBHOOK_REJECTIONS")).toBe(true);
    });

    t("OTP abuse alert on a recent high-risk event", async () => {
      const ev = await prisma.smsRiskEvent.create({ data: { kind: "sms_pumping", score: 95, severity: "high", action: "blocked" } });
      await monitoring().evaluate();
      expect(raised("SMS_OTP_ABUSE")).toBe(true);
      await prisma.smsRiskEvent.delete({ where: { id: ev.id } });
    });

    t("a quiet system raises no queue/uncertain alerts for these thresholds", async () => {
      process.env.DCG_ALERT_BACKLOG = "100000";
      process.env.DCG_ALERT_OLDEST_QUEUED_SECONDS = "100000000";
      process.env.DCG_ALERT_UNCERTAIN_MINUTES = "100000000";
      await monitoring().evaluate();
      expect(raised("SMS_BACKLOG")).toBe(false);
      expect(raised("SMS_UNCERTAIN_STALE")).toBe(false);
    });
  });

  // ------------------------------------------------------------------ emergency stop
  describe("emergency stop", () => {
    t("engaging it is audited and alerts; releasing it is audited", async () => {
      const control = new SmsControlService(prisma as any, audit, alerts);
      audit.log.mockClear();
      const on = await control.set(true, "suspected abuse", { userId: "admin-1" });
      expect(on).toMatchObject({ stopped: true, reason: "suspected abuse" });
      expect(await control.isStopped()).toBe(true);
      expect(alerts.raise).toHaveBeenCalledWith("SMS_EMERGENCY_STOP", "critical", expect.any(String), expect.anything(), "admin-1");
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: "SMS_EMERGENCY_STOP_ON", actorUserId: "admin-1" }));
      const off = await control.set(false, undefined, { userId: "admin-1" });
      expect(off.stopped).toBe(false);
      expect(await control.isStopped()).toBe(false);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: "SMS_EMERGENCY_STOP_OFF" }));
    });

    t("while stopped, nothing new can be queued", async () => {
      process.env.DCG_LIVE_SMS_ENABLED = "true";
      const control = new SmsControlService(prisma as any, audit, alerts);
      const outbox = new SmsOutboxService(prisma as any, accounts, audit, boss, control);
      await control.set(true, "test", { userId: "admin-1" });
      await expect(outbox.enqueue("+14155550199", "x", { purpose: "itest" })).rejects.toBeInstanceOf(ServiceUnavailableException);
      await control.set(false, undefined, { userId: "admin-1" });
    });

    tAcct("queued messages wait during a stop, are not sent, and go out when released", async () => {
      process.env.DCG_LIVE_SMS_ENABLED = "true";
      const control = new SmsControlService(prisma as any, audit, alerts);
      const a = await mkAccount("active");
      const outbox = new SmsOutboxService(prisma as any, accounts, audit, boss, control);
      const m = await outbox.enqueue("+14155550198", "hello", { purpose: "itest" });
      madeMessages.push(m.id!);
      await control.set(true, "test", { userId: "admin-1" });
      expect(await outbox.dispatchById(m.id!)).toBe("requeued:emergency_stop");
      expect((await get(m.id!)).state).toBe("queued");
      expect(fetchSpy).not.toHaveBeenCalled();
      await control.set(false, undefined, { userId: "admin-1" });
      fetchSpy.mockImplementation(() => reply(201, { sid: "SM" + hex(32) }) as any);
      await prisma.smsMessage.update({ where: { id: m.id! }, data: { nextAttemptAt: new Date(Date.now() - 1) } });
      expect(await outbox.dispatchById(m.id!)).toBe("accepted");
      expect(a.id).toBeTruthy();
    });
  });
});
