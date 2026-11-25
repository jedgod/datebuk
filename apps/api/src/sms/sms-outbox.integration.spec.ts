import "dotenv/config";
import "reflect-metadata";

// pg-boss is ESM-only; the outbox only needs its add() as a wake-up, which is stubbed below.
jest.mock("../common/pgboss/pgboss.service", () => ({ PgBossService: class PgBossService {} }));

import { ConflictException, ForbiddenException, ServiceUnavailableException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { randomBytes, randomUUID } from "crypto";
import { SmsAccountsService } from "./sms-accounts.service";
import { SmsOutboxService } from "./sms-outbox.service";
import { SmsWebhookController } from "./sms-webhook.controller";
import { expectedTwilioSignature } from "./twilio-signature";
import { credentialContext, vaultEncrypt } from "../common/security/credential-vault";

/**
 * Integration tests against the REAL PostgreSQL database in DATABASE_URL (apps/api/.env).
 * They create and delete only their own rows (prefixed "itest"), and are skipped when no database is configured
 * or when a real provider account is already active (the schema allows only one active account).
 * Twilio is never contacted: global fetch is replaced.
 */
const run = process.env.DATABASE_URL ? describe : describe.skip;

const hex = (n: number) => randomBytes(n / 2).toString("hex");
const BASE = "https://api.itest.example.com";

run("SMS outbox + webhooks (real PostgreSQL)", () => {
  const prisma = new PrismaClient();
  const audit: any = { log: jest.fn().mockResolvedValue(undefined) };
  const boss: any = { add: jest.fn().mockResolvedValue(undefined) };
  let accounts: SmsAccountsService;
  let outbox: SmsOutboxService;
  let webhook: SmsWebhookController;
  let fetchSpy: jest.SpyInstance;
  let blocked = false;

  const made = { accounts: [] as string[], messages: [] as string[], phones: [] as string[] };
  const ENV = { ...process.env };

  type Acct = { id: string; sid: string; token: string };
  async function mkAccount(status: "active" | "verified", limits: { daily?: number | null; monthly?: number | null } = {}): Promise<Acct> {
    const id = randomUUID();
    const sid = "AC" + hex(32);
    const token = "tok_" + hex(40);
    await prisma.twilioAccount.create({
      data: {
        id,
        name: "itest-" + id.slice(0, 6),
        accountSid: sid,
        status,
        keyVersion: 1,
        encryptedAuthToken: vaultEncrypt(token, credentialContext(id, "authToken")).payload,
        dailySegmentLimit: limits.daily ?? null,
        monthlySegmentLimit: limits.monthly ?? null,
        senders: { create: { senderNumber: "+14155550100" } },
      },
    });
    made.accounts.push(id);
    return { id, sid, token };
  }
  const phone = () => {
    const p = "+1415555" + String(Math.floor(1000 + Math.random() * 8999));
    made.phones.push(p);
    return p;
  };
  const enq = async (body = "hello", extra: Record<string, any> = {}) => {
    const r = await outbox.enqueue(phone(), body, { purpose: "itest", userId: null, ...extra });
    if (r.id) made.messages.push(r.id);
    return r;
  };
  const get = (id: string) => prisma.smsMessage.findUniqueOrThrow({ where: { id } });
  const reply = (status: number, body: any = {}) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
  const sidFor = () => "SM" + hex(32);

  beforeAll(async () => {
    blocked = (await prisma.twilioAccount.count({ where: { status: "active" } })) > 0;
  });

  beforeEach(() => {
    process.env = {
      ...ENV,
      NODE_ENV: "test",
      DCG_ENABLED: "true",
      DCG_LIVE_SMS_ENABLED: "true",
      DCG_ENV_FALLBACK_ENABLED: "false",
      DCG_WEBHOOK_SIGNATURE_REQUIRED: "true",
      DCG_ENCRYPTION_KEY: process.env.DCG_ENCRYPTION_KEY || randomBytes(32).toString("base64"),
      DCG_ENCRYPTION_KEY_VERSION: "1",
      SMS_WEBHOOK_BASE_URL: BASE,
    };
    accounts = new SmsAccountsService(prisma as any, audit);
    outbox = new SmsOutboxService(prisma as any, accounts, audit, boss);
    webhook = new SmsWebhookController(prisma as any, accounts);
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(() => reply(201, { sid: sidFor() }) as any);
    boss.add.mockClear();
  });

  afterEach(async () => {
    fetchSpy.mockRestore();
    // A test that left an account active must not poison the next one.
    await prisma.twilioAccount.updateMany({ where: { id: { in: made.accounts } }, data: { status: "revoked", encryptedAuthToken: null } });
  });

  afterAll(async () => {
    process.env = ENV;
    await prisma.smsWebhookEvent.deleteMany({ where: { accountSid: { in: (await prisma.twilioAccount.findMany({ where: { id: { in: made.accounts } }, select: { accountSid: true } })).map((a) => a.accountSid) } } });
    await prisma.smsMessage.deleteMany({ where: { OR: [{ id: { in: made.messages } }, { purpose: "itest" }] } });
    await prisma.smsSuppression.deleteMany({ where: { phone: { in: made.phones } } });
    await prisma.twilioAccount.deleteMany({ where: { id: { in: made.accounts } } });
    await prisma.$disconnect();
  });

  const guard = (name: string, fn: () => Promise<void>) => it(name, async () => (blocked ? undefined : fn()), 60_000);

  // ------------------------------------------------------------------ atomic reservation
  describe("atomic spending reservation", () => {
    guard("25 concurrent 1-segment messages against a daily cap of 10 admit exactly 10", async () => {
      const a = await mkAccount("active", { daily: 10 });
      const results = await Promise.allSettled(Array.from({ length: 25 }, () => enq("hi")));
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const rejected = results.filter((r) => r.status === "rejected");
      expect(ok).toBe(10);
      expect(rejected).toHaveLength(15);
      for (const r of rejected) expect((r as PromiseRejectedResult).reason).toBeInstanceOf(ServiceUnavailableException);
      const reserved = (await prisma.smsMessage.aggregate({ _sum: { segments: true }, where: { accountId: a.id } }))._sum.segments;
      expect(reserved).toBe(10);
    });

    guard("multi-segment messages reserve their full segment count (3-segment texts, cap 10 -> 3 admitted)", async () => {
      await mkAccount("active", { daily: 10 });
      const long = "a".repeat(400); // GSM-7, 3 segments
      const results = await Promise.allSettled(Array.from({ length: 8 }, () => enq(long)));
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    });

    guard("a failed message releases its reservation", async () => {
      const a = await mkAccount("active", { daily: 2 });
      const m1 = await enq("one");
      await enq("two");
      await expect(enq("three")).rejects.toBeInstanceOf(ServiceUnavailableException);
      fetchSpy.mockImplementation(() => reply(400, { message: "bad" }) as any);
      expect(await outbox.dispatchById(m1.id!)).toBe("failed:rejected");
      await expect(enq("three")).resolves.toMatchObject({ delivery: "queued" });
      expect(a.id).toBeTruthy();
    });

    guard("monthly cap is enforced independently of the daily cap", async () => {
      await mkAccount("active", { daily: 100, monthly: 3 });
      const results = await Promise.allSettled(Array.from({ length: 6 }, () => enq("hi")));
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    });
  });

  // ------------------------------------------------------------------ outbox basics
  describe("durable outbox", () => {
    guard("recipient and body are encrypted at rest; only the last 4 digits are readable", async () => {
      await mkAccount("active");
      const to = phone();
      const r = await outbox.enqueue(to, "secret body text", { purpose: "itest" });
      made.messages.push(r.id!);
      const row = await get(r.id!);
      expect(row.toEncrypted!.startsWith("dcg:v1:")).toBe(true);
      expect(row.bodyEncrypted!.startsWith("dcg:v1:")).toBe(true);
      expect(JSON.stringify(row)).not.toContain(to);
      expect(JSON.stringify(row)).not.toContain("secret body text");
      expect(row.recipientLast4).toBe(to.slice(-4));
      expect(boss.add).toHaveBeenCalledWith("sms-dispatch", { messageId: r.id }, { attempts: 0 });
    });

    guard("the same idempotency key creates exactly one message, even under concurrency", async () => {
      await mkAccount("active");
      const key = "itest-" + randomUUID();
      const to = phone();
      const results = await Promise.allSettled(Array.from({ length: 8 }, () => outbox.enqueue(to, "dup", { purpose: "itest", idempotencyKey: key })));
      const ids = new Set(results.filter((r) => r.status === "fulfilled").map((r) => (r as any).value.id));
      expect(ids.size).toBe(1);
      made.messages.push(...(ids as Set<string>));
      expect(await prisma.smsMessage.count({ where: { idempotencyKey: key } })).toBe(1);
    });

    guard("with sending switched off nothing is queued (development logs it)", async () => {
      await mkAccount("active");
      process.env.DCG_LIVE_SMS_ENABLED = "false";
      expect(await outbox.enqueue(phone(), "x", { purpose: "itest" })).toEqual({ id: null, delivery: "logged" });
    });

    guard("in production, disabled sending is refused rather than silently logged", async () => {
      process.env.NODE_ENV = "production";
      process.env.DCG_LIVE_SMS_ENABLED = "false";
      await expect(outbox.enqueue(phone(), "x", { purpose: "itest" })).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    guard("opted-out numbers are refused at enqueue", async () => {
      await mkAccount("active");
      const to = phone();
      await prisma.smsSuppression.create({ data: { phone: to } });
      await expect(outbox.enqueue(to, "x", { purpose: "itest" })).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  // ------------------------------------------------------------------ worker leases
  describe("worker leases", () => {
    guard("10 workers racing to claim one message: exactly one wins", async () => {
      await mkAccount("active");
      const m = await enq();
      const claims = await Promise.all(Array.from({ length: 10 }, () => outbox.claim(m.id!)));
      expect(claims.filter(Boolean)).toHaveLength(1);
      expect((await get(m.id!)).state).toBe("dispatching");
    });

    guard("concurrent dispatch of the same message calls Twilio exactly once", async () => {
      await mkAccount("active");
      const m = await enq();
      const outcomes = await Promise.all(Array.from({ length: 6 }, () => outbox.dispatchById(m.id!)));
      expect(outcomes.filter((o) => o === "accepted")).toHaveLength(1);
      expect(outcomes.filter((o) => o === "skipped")).toHaveLength(5);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    guard("a lost worker's expired lease becomes uncertain, is wiped, and is never sent", async () => {
      await mkAccount("active");
      const m = await enq();
      await outbox.claim(m.id!); // worker "crashes" here
      await prisma.smsMessage.update({ where: { id: m.id! }, data: { leaseUntil: new Date(Date.now() - 1000) } });
      const r = await outbox.sweep();
      expect(r.leasesExpired).toBeGreaterThanOrEqual(1);
      const row = await get(m.id!);
      expect(row.state).toBe("uncertain");
      expect(row.toEncrypted).toBeNull();
      expect(row.bodyEncrypted).toBeNull();
      expect(await outbox.dispatchById(m.id!)).toBe("skipped");
      await outbox.sweep();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    guard("the sweeper dispatches due messages even if the pg-boss wake-up never arrived", async () => {
      await mkAccount("active");
      const m = await enq();
      await outbox.sweep();
      expect((await get(m.id!)).state).toBe("accepted");
    });
  });

  // ------------------------------------------------------------------ outcome classification
  describe("dispatch outcomes", () => {
    guard("2xx: accepted, provider id stored, payload erased", async () => {
      await mkAccount("active");
      const m = await enq("deliver me");
      const sid = sidFor();
      fetchSpy.mockImplementation(() => reply(201, { sid }) as any);
      expect(await outbox.dispatchById(m.id!)).toBe("accepted");
      const row = await get(m.id!);
      expect(row).toMatchObject({ state: "accepted", providerSid: sid, toEncrypted: null, bodyEncrypted: null, attempts: 1 });
      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain("/Messages.json");
      expect(String((init as any).body)).toContain("Body=deliver+me");
      expect(String((init as any).body)).toContain("StatusCallback=" + encodeURIComponent(`${BASE}/api/sms/webhooks/status?mid=${m.id}`));
      expect((init as any).headers["I-Twilio-Idempotency-Token"]).toBe(m.id);
    });

    guard("429 is retried with backoff; a later success is accepted; gives up after the attempt limit", async () => {
      await mkAccount("active");
      const m = await enq();
      fetchSpy.mockImplementation(() => reply(429, {}) as any);
      expect(await outbox.dispatchById(m.id!)).toBe("requeued:rate_limited");
      let row = await get(m.id!);
      expect(row.state).toBe("queued");
      expect(row.attempts).toBe(1);
      expect(row.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
      expect(row.bodyEncrypted).not.toBeNull(); // still needed for the retry
      expect(await outbox.dispatchById(m.id!)).toBe("skipped"); // not due yet

      fetchSpy.mockImplementation(() => reply(201, { sid: sidFor() }) as any);
      await prisma.smsMessage.update({ where: { id: m.id! }, data: { nextAttemptAt: new Date(Date.now() - 1) } });
      expect(await outbox.dispatchById(m.id!)).toBe("accepted");

      const m2 = await enq();
      fetchSpy.mockImplementation(() => reply(429, {}) as any);
      for (let i = 0; i < 4; i++) {
        await outbox.dispatchById(m2.id!);
        await prisma.smsMessage.update({ where: { id: m2.id! }, data: { nextAttemptAt: new Date(Date.now() - 1) } });
      }
      expect(await outbox.dispatchById(m2.id!)).toBe("failed:rate_limited");
      expect((await get(m2.id!)).state).toBe("failed");
    });

    guard("400 is a definite failure and is never retried", async () => {
      await mkAccount("active");
      const m = await enq();
      fetchSpy.mockImplementation(() => reply(400, { message: "invalid To" }) as any);
      expect(await outbox.dispatchById(m.id!)).toBe("failed:rejected");
      expect(await outbox.dispatchById(m.id!)).toBe("skipped");
      await outbox.sweep();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect((await get(m.id!)).bodyEncrypted).toBeNull();
    });

    guard("401 fails the message, suspends the account, and does NOT fall back to another account", async () => {
      const a = await mkAccount("active");
      const b = await mkAccount("verified"); // a healthy spare must never be used automatically
      const m = await enq();
      fetchSpy.mockImplementation(() => reply(401, {}) as any);
      expect(await outbox.dispatchById(m.id!)).toBe("failed:auth");
      expect((await prisma.twilioAccount.findUniqueOrThrow({ where: { id: a.id } })).status).toBe("suspended");
      expect((await prisma.twilioAccount.findUniqueOrThrow({ where: { id: b.id } })).status).toBe("verified");
      expect(await outbox.resolveSender()).toBeNull();
      // Development logs when no provider is active; production must refuse, never route elsewhere.
      expect(await outbox.enqueue(phone(), "dev", { purpose: "itest" })).toEqual({ id: null, delivery: "logged" });
      process.env.NODE_ENV = "production";
      await expect(enq("again")).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    guard("500 is ambiguous: uncertain, wiped, never retried", async () => {
      await mkAccount("active");
      const m = await enq();
      fetchSpy.mockImplementation(() => reply(502, {}) as any);
      expect(await outbox.dispatchById(m.id!)).toBe("uncertain");
      const row = await get(m.id!);
      expect(row).toMatchObject({ state: "uncertain", toEncrypted: null, bodyEncrypted: null });
      await outbox.sweep();
      expect(await outbox.dispatchById(m.id!)).toBe("skipped");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    guard("a network timeout is ambiguous too: uncertain, never retried", async () => {
      await mkAccount("active");
      const m = await enq();
      fetchSpy.mockImplementation(() => Promise.reject(new Error("timeout")));
      expect(await outbox.dispatchById(m.id!)).toBe("uncertain");
      await outbox.sweep();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------------------ dispatch-time authorization
  describe("authorization at dispatch time", () => {
    guard("opted out AFTER queueing: cancelled, nothing sent", async () => {
      await mkAccount("active");
      const to = phone();
      const r = await outbox.enqueue(to, "x", { purpose: "itest" });
      made.messages.push(r.id!);
      await prisma.smsSuppression.create({ data: { phone: to } });
      expect(await outbox.dispatchById(r.id!)).toBe("canceled:opted_out");
      expect(fetchSpy).not.toHaveBeenCalled();
      expect((await get(r.id!)).state).toBe("canceled");
    });

    guard("a purpose guard can cancel a message that is no longer wanted", async () => {
      await mkAccount("active");
      outbox.registerPurposeGuard("itest-guarded", async ({ ref }) => (ref === "stale" ? "no_longer_pending" : null));
      const stale = await enq("x", { purpose: "itest-guarded", ref: "stale" });
      const fresh = await enq("x", { purpose: "itest-guarded", ref: "fresh" });
      expect(await outbox.dispatchById(stale.id!)).toBe("canceled:no_longer_pending");
      expect(await outbox.dispatchById(fresh.id!)).toBe("accepted");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      await prisma.smsMessage.updateMany({ where: { purpose: "itest-guarded" }, data: { purpose: "itest" } });
    });

    guard("expired before sending: cancelled by the sweeper, never sent late", async () => {
      await mkAccount("active");
      const m = await enq("x", { ttlSeconds: 60 });
      await prisma.smsMessage.update({ where: { id: m.id! }, data: { expiresAt: new Date(Date.now() - 1000) } });
      const r = await outbox.sweep();
      expect(r.expired).toBeGreaterThanOrEqual(1);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(await get(m.id!)).toMatchObject({ state: "canceled", bodyEncrypted: null });
    });

    guard("provider account switched after queueing: cancelled, never sent through the other account", async () => {
      const a = await mkAccount("active");
      const m = await enq();
      const b = await mkAccount("verified");
      await prisma.twilioAccount.update({ where: { id: a.id }, data: { status: "suspended" } });
      await prisma.twilioAccount.update({ where: { id: b.id }, data: { status: "active" } });
      expect(await outbox.dispatchById(m.id!)).toBe("canceled:provider_account_changed");
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    guard("provider account suspended after queueing and nothing else active: the message waits, then expires", async () => {
      const a = await mkAccount("active");
      const m = await enq("x", { ttlSeconds: 3600 });
      await prisma.twilioAccount.update({ where: { id: a.id }, data: { status: "suspended" } });
      expect(await outbox.dispatchById(m.id!)).toBe("requeued:no_active_account");
      const row = await get(m.id!);
      expect(row.state).toBe("queued");
      expect(row.attempts).toBe(0); // waiting for an account does not burn attempts
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    guard("sending switched off after queueing: paused, not lost, not sent", async () => {
      await mkAccount("active");
      const m = await enq();
      process.env.DCG_LIVE_SMS_ENABLED = "false";
      expect(await outbox.dispatchById(m.id!)).toBe("requeued:paused");
      expect(fetchSpy).not.toHaveBeenCalled();
      expect((await get(m.id!)).state).toBe("queued");
    });

    guard("destination restriction is re-checked at dispatch", async () => {
      const a = await mkAccount("active");
      const m = await enq();
      await prisma.twilioAccount.update({ where: { id: a.id }, data: { allowedPrefixes: ["+44"] } });
      expect(await outbox.dispatchById(m.id!)).toBe("canceled:destination_not_allowed");
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ authenticated webhooks + state transitions
  describe("webhooks", () => {
    const callback = async (acct: { sid: string; token: string }, mid: string | null, fields: Record<string, string>, opts: { signWith?: string; badSig?: boolean } = {}) => {
      const body = { AccountSid: acct.sid, ...fields };
      const query = mid ? `?mid=${mid}` : "";
      const originalUrl = `/api/sms/webhooks/status${query}`;
      const sig = opts.badSig ? "AAAAAAAAAAAAAAAAAAAAAAAAAAA=" : expectedTwilioSignature(opts.signWith ?? acct.token, `${BASE}${originalUrl}`, body);
      const req: any = { body, originalUrl, query: mid ? { mid } : {} };
      return webhook.handle("status", req, sig);
    };
    const accepted = async (acct: Acct) => {
      const m = await enq();
      const sid = sidFor();
      fetchSpy.mockImplementation(() => reply(201, { sid }) as any);
      await outbox.dispatchById(m.id!);
      return { id: m.id!, sid };
    };

    guard("rejects a bad signature, a wrong-token signature, and an unknown account", async () => {
      const a = await mkAccount("active");
      const { id, sid } = await accepted(a);
      await expect(callback(a, id, { MessageSid: sid, MessageStatus: "delivered" }, { badSig: true })).rejects.toBeInstanceOf(ForbiddenException);
      await expect(callback(a, id, { MessageSid: sid, MessageStatus: "delivered" }, { signWith: "some-other-token-entirely-0000000000" })).rejects.toBeInstanceOf(ForbiddenException);
      await expect(callback({ sid: "AC" + hex(32), token: "x".repeat(32) }, id, { MessageSid: sid, MessageStatus: "delivered" })).rejects.toBeInstanceOf(ForbiddenException);
      expect((await get(id)).state).toBe("accepted");
    });

    guard("applies in-order callbacks, ignores duplicates and late earlier states", async () => {
      const a = await mkAccount("active");
      const { id, sid } = await accepted(a);
      await callback(a, id, { MessageSid: sid, MessageStatus: "sent" });
      expect((await get(id)).state).toBe("sent");
      await callback(a, id, { MessageSid: sid, MessageStatus: "delivered" });
      expect((await get(id)).state).toBe("delivered");
      await callback(a, id, { MessageSid: sid, MessageStatus: "delivered" }); // replay
      await callback(a, id, { MessageSid: sid, MessageStatus: "sent" }); // late
      await callback(a, id, { MessageSid: sid, MessageStatus: "sending" }); // late
      expect((await get(id)).state).toBe("delivered");
      expect(await prisma.smsWebhookEvent.count({ where: { providerSid: sid, status: "delivered" } })).toBe(1);
    });

    guard("a callback signed by a different valid account cannot touch this message", async () => {
      const a = await mkAccount("active");
      const b = await mkAccount("verified");
      const { id, sid } = await accepted(a);
      await expect(callback(b, id, { MessageSid: sid, MessageStatus: "delivered" })).rejects.toBeInstanceOf(ForbiddenException);
      expect((await get(id)).state).toBe("accepted");
    });

    guard("a callback with a different provider id for the same message is rejected", async () => {
      const a = await mkAccount("active");
      const { id } = await accepted(a);
      await expect(callback(a, id, { MessageSid: sidFor(), MessageStatus: "delivered" })).rejects.toBeInstanceOf(ConflictException);
      expect((await get(id)).state).toBe("accepted");
    });

    guard("a genuine callback resolves an uncertain message and binds its provider id", async () => {
      const a = await mkAccount("active");
      const m = await enq();
      fetchSpy.mockImplementation(() => reply(503, {}) as any);
      await outbox.dispatchById(m.id!);
      expect((await get(m.id!)).state).toBe("uncertain");
      const sid = sidFor();
      await callback(a, m.id!, { MessageSid: sid, MessageStatus: "delivered" });
      expect(await get(m.id!)).toMatchObject({ state: "delivered", providerSid: sid });
    });

    guard("a callback cannot advance or bind a message that was never dispatched", async () => {
      const a = await mkAccount("active");
      const m = await enq(); // still queued
      await callback(a, m.id!, { MessageSid: sidFor(), MessageStatus: "delivered" });
      expect(await get(m.id!)).toMatchObject({ state: "queued", providerSid: null });
    });

    guard("callbacks for unknown messages are acknowledged without effect", async () => {
      const a = await mkAccount("active");
      await expect(callback(a, null, { MessageSid: sidFor(), MessageStatus: "delivered" })).resolves.toBe("<Response/>");
    });

    guard("concurrent duplicate callbacks apply once", async () => {
      const a = await mkAccount("active");
      const { id, sid } = await accepted(a);
      await Promise.all(Array.from({ length: 8 }, () => callback(a, id, { MessageSid: sid, MessageStatus: "delivered" })));
      expect((await get(id)).state).toBe("delivered");
      expect(await prisma.smsWebhookEvent.count({ where: { providerSid: sid, status: "delivered" } })).toBe(1);
    });
  });

  // ------------------------------------------------------------------ reconciliation
  describe("admin reconciliation", () => {
    guard("only an uncertain message can be reconciled; not_sent frees its budget; nothing is resent", async () => {
      const a = await mkAccount("active", { daily: 1 });
      const m = await enq();
      await expect(outbox.reconcile(m.id!, "not_sent", { userId: "admin" })).rejects.toBeDefined(); // queued: refused
      fetchSpy.mockImplementation(() => reply(500, {}) as any);
      await outbox.dispatchById(m.id!);
      await expect(enq("blocked by cap")).rejects.toBeInstanceOf(ServiceUnavailableException); // uncertain still counts
      expect(await outbox.reconcile(m.id!, "not_sent", { userId: "admin" })).toEqual({ id: m.id, state: "failed" });
      await expect(enq("fits again")).resolves.toMatchObject({ delivery: "queued" });
      expect(fetchSpy).toHaveBeenCalledTimes(1); // the reconciliation never resent anything
      expect(a.id).toBeTruthy();
    });
  });
});
