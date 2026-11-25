import "dotenv/config";
import "reflect-metadata";

jest.mock("../common/pgboss/pgboss.service", () => ({ PgBossService: class PgBossService {} }));

import { PrismaClient } from "@prisma/client";
import { randomBytes, randomUUID } from "crypto";
import { SmsAccountsService } from "./sms-accounts.service";
import { SmsOutboxService } from "./sms-outbox.service";
import { SmsWebhookController } from "./sms-webhook.controller";
import { ConsentService } from "./consent.service";
import { expectedTwilioSignature } from "./twilio-signature";
import { credentialContext, vaultEncrypt } from "../common/security/credential-vault";
import { createAccountWithRetry } from "./it-db";

/**
 * Concurrency and failure certification (V14.2) on the REAL PostgreSQL, against a SIMULATED provider.
 * Results are evidence of the engine's invariants under load, not of Twilio's behaviour.
 *
 * Invariants asserted:
 *   - the spending cap is never exceeded, however many callers race;
 *   - a message is handed to the provider at most once - except a rate-limited (429) one, which is
 *     safe to retry and is bounded;
 *   - an ambiguous outcome (timeout / 5xx / lost worker) is never retried;
 *   - no message is stuck mid-dispatch once leases are recovered;
 *   - a flood of duplicate callbacks applies each transition once.
 */
const run = process.env.DATABASE_URL ? describe : describe.skip;
const ENV = { ...process.env };
const hex = (n: number) => randomBytes(n / 2).toString("hex");
const BASE = "https://api.load.example.com";
const reply = (status: number, body: any = {}) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

run("load, concurrency and failure injection (real PostgreSQL, simulated provider)", () => {
  const prisma = new PrismaClient();
  const audit: any = { log: jest.fn().mockResolvedValue(undefined) };
  const boss: any = { add: jest.fn().mockResolvedValue(undefined) };
  let blocked = false;
  const madeAccounts: string[] = [];
  const ids: string[] = [];
  let fetchSpy: jest.SpyInstance;

  beforeAll(async () => {
    blocked = (await prisma.twilioAccount.count({ where: { status: "active", NOT: { name: { startsWith: "itest-" } } } })) > 0;
  });
  beforeEach(() => {
    process.env = { ...ENV, NODE_ENV: "test", DCG_ENABLED: "true", DCG_LIVE_SMS_ENABLED: "true", DCG_REQUIRE_REGISTRATION: "false", DCG_HMAC_KEY: ENV.DCG_HMAC_KEY || randomBytes(32).toString("base64"), DCG_ENCRYPTION_KEY: ENV.DCG_ENCRYPTION_KEY || randomBytes(32).toString("base64"), DCG_ENCRYPTION_KEY_VERSION: "1", SMS_WEBHOOK_BASE_URL: BASE };
  });
  afterEach(async () => {
    fetchSpy?.mockRestore();
    // each test starts from an empty outbox, so a previous test's leftovers can't be swept into the next one
    await prisma.smsMessage.deleteMany({ where: { purpose: "itest-load" } });
    await prisma.twilioAccount.updateMany({ where: { id: { in: madeAccounts }, status: { not: "revoked" } }, data: { status: "revoked", encryptedAuthToken: null } });
  });
  afterAll(async () => {
    process.env = ENV;
    await prisma.smsWebhookEvent.deleteMany({ where: { accountSid: { in: (await prisma.twilioAccount.findMany({ where: { id: { in: madeAccounts } }, select: { accountSid: true } })).map((a) => a.accountSid) } } });
    await prisma.smsMessage.deleteMany({ where: { OR: [{ id: { in: ids } }, { purpose: "itest-load" }] } });
    await prisma.twilioAccount.deleteMany({ where: { id: { in: madeAccounts } } });
    await prisma.$disconnect();
  });

  async function mkAccount(daily?: number) {
    const id = randomUUID();
    const sid = "AC" + hex(32);
    const token = "tok_" + hex(40);
    await createAccountWithRetry(prisma, {
      data: { id, name: "itest-load-" + id.slice(0, 6), accountSid: sid, status: "active", keyVersion: 1, dailySegmentLimit: daily ?? null, encryptedAuthToken: vaultEncrypt(token, credentialContext(id, "authToken")).payload, senders: { create: { senderNumber: "+14155550100" } } },
    });
    madeAccounts.push(id);
    return { id, sid, token };
  }
  const t = (name: string, fn: () => Promise<void>) => it(name, async () => (blocked ? undefined : fn()), 240_000);
  const phone = () => "+1415558" + String(Math.floor(1000 + Math.random() * 8999));

  /** Provider that records every call per message id and misbehaves randomly. */
  const simulatedProvider = (weights: { ok: number; r429: number; e5xx: number; timeout: number; reject: number }) => {
    const calls = new Map<string, number>();
    const seq = new Map<string, string[]>();
    const note = (mid: string, o: string) => seq.set(mid, [...(seq.get(mid) ?? []), o]);
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(((_url: any, init: any) => {
      const mid = /mid=([0-9a-f-]{36})/i.exec(decodeURIComponent(String(init.body)))?.[1] ?? "?";
      calls.set(mid, (calls.get(mid) ?? 0) + 1);
      let r = Math.random() * total;
      const latency = Math.floor(Math.random() * 15);
      const done = (fn: () => any) => new Promise((res, rej) => setTimeout(() => { try { res(fn()); } catch (e) { rej(e); } }, latency));
      if ((r -= weights.ok) < 0) { note(mid, "ok"); return done(() => reply(201, { sid: "SM" + hex(32) })); }
      if ((r -= weights.r429) < 0) { note(mid, "429"); return done(() => reply(429, {})); }
      if ((r -= weights.e5xx) < 0) { note(mid, "5xx"); return done(() => reply(502, {})); }
      if ((r -= weights.timeout) < 0) { note(mid, "timeout"); return new Promise((_res, rej) => setTimeout(() => rej(new Error("timeout")), latency)); }
      note(mid, "400");
      return done(() => reply(400, {}));
    }) as any);
    return { calls, seq };
  };

  t("spending cap is never exceeded: an unrestricted burst of 600 simultaneous callers, then realistic waves", async () => {
    const a = await mkAccount(200);
    const outbox = new SmsOutboxService(prisma as any, new SmsAccountsService(prisma as any, audit), audit, boss);

    // (a) Unrestricted burst. 600 simultaneous transactions can exhaust the connection pool, so some callers time out waiting
    //     for a connection (a safe failure). The invariant is that the cap is NEVER exceeded and what is admitted is exactly what is reserved.
    let started = Date.now();
    const burst = await Promise.allSettled(Array.from({ length: 600 }, () => outbox.enqueue(phone(), "hi", { purpose: "itest-load" })));
    const admitted = burst.filter((r) => r.status === "fulfilled");
    const reservedA = (await prisma.smsMessage.aggregate({ _sum: { segments: true }, where: { accountId: a.id } }))._sum.segments ?? 0;
    const poolTimeouts = burst.filter((r) => r.status === "rejected" && /pool|P2024|connection/i.test(String((r as any).reason?.message))).length;
    console.log(`  [evidence] 600 simultaneous enqueues in ${Date.now() - started} ms -> ${admitted.length} admitted, ${reservedA} segments reserved (cap 200), ${poolTimeouts} connection-pool timeouts`);
    expect(admitted.length).toBeLessThanOrEqual(200);
    expect(reservedA).toBe(admitted.length);

    // (b) Realistic waves (the API's own throttling keeps concurrency bounded): the remaining budget is used exactly.
    started = Date.now();
    let got = admitted.length;
    for (let wave = 0; wave < 20 && got < 200; wave++) {
      const r = await Promise.allSettled(Array.from({ length: 40 }, () => outbox.enqueue(phone(), "hi", { purpose: "itest-load" })));
      got += r.filter((x) => x.status === "fulfilled").length;
    }
    const reservedB = (await prisma.smsMessage.aggregate({ _sum: { segments: true }, where: { accountId: a.id } }))._sum.segments ?? 0;
    console.log(`  [evidence] bounded waves of 40 racing callers filled the budget to ${reservedB}/200 in ${Date.now() - started} ms`);
    expect(reservedB).toBe(200);
    const over = await Promise.allSettled(Array.from({ length: 40 }, () => outbox.enqueue(phone(), "hi", { purpose: "itest-load" })));
    expect(over.every((r) => r.status === "rejected")).toBe(true); // budget exhausted: nobody else gets in
    expect((await prisma.smsMessage.aggregate({ _sum: { segments: true }, where: { accountId: a.id } }))._sum.segments).toBe(200);
  });

  t("1,000-message load across 8 parallel workers with random provider failures: no double sends, no stuck messages", async () => {
    const a = await mkAccount();
    const outbox = new SmsOutboxService(prisma as any, new SmsAccountsService(prisma as any, audit), audit, boss);
    const { calls, seq } = simulatedProvider({ ok: 70, r429: 10, e5xx: 10, timeout: 5, reject: 5 });

    const N = 1000;
    const created: string[] = [];
    for (let i = 0; i < N; i += 25) {
      // 25 simultaneous callers per wave: realistic concurrency for one provider account (they serialize on its budget lock)
      const batch = await Promise.all(Array.from({ length: 25 }, () => outbox.enqueue(phone(), "load", { purpose: "itest-load" })));
      for (const b of batch) created.push(b.id!);
    }
    ids.push(...created);
    expect(created).toHaveLength(N);

    // 8 workers (separate outbox instances, as separate processes would be) sweep until nothing is due
    const workers = Array.from({ length: 8 }, () => new SmsOutboxService(prisma as any, new SmsAccountsService(prisma as any, audit), audit, boss));
    const started = Date.now();
    for (let round = 0; round < 12; round++) {
      await Promise.all(workers.map((w) => w.sweep(60)));
      // make rate-limit backoffs due so the test finishes quickly
      await prisma.smsMessage.updateMany({ where: { id: { in: created }, state: "queued" }, data: { nextAttemptAt: new Date(Date.now() - 1) } });
      const open = await prisma.smsMessage.count({ where: { id: { in: created }, state: { in: ["queued", "dispatching"] } } });
      if (open === 0) break;
    }
    const secs = (Date.now() - started) / 1000;

    const rows = await prisma.smsMessage.findMany({ where: { id: { in: created } }, select: { id: true, state: true, attempts: true, toEncrypted: true, bodyEncrypted: true } });
    const byState: Record<string, number> = {};
    for (const r of rows) byState[r.state] = (byState[r.state] ?? 0) + 1;
    console.log(`  [evidence] ${N} messages, 8 workers, ${secs.toFixed(1)}s (~${Math.round(N / secs)} msg/s incl. injected failures): ${JSON.stringify(byState)}; provider calls=${[...calls.values()].reduce((x, y) => x + y, 0)}`);

    // nothing left mid-flight
    expect((byState.queued ?? 0) + (byState.dispatching ?? 0)).toBe(0);
    for (const r of rows) {
      const n = calls.get(r.id) ?? 0;
      // never sent twice unless a 429 (safe) caused a retry, and that is bounded by the attempt limit
      if (r.state === "uncertain" || r.state === "accepted" || r.state === "failed") expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
      // The one rule that matters: ONLY a 429 (provider refused for rate; nothing accepted) may be followed by another call.
      // Every other outcome - accepted, rejected, 5xx, timeout - is final for that message.
      const outcomes = seq.get(r.id) ?? [];
      expect(outcomes.slice(0, -1).every((o) => o === "429")).toBe(true);
      if (r.state === "uncertain") expect(["5xx", "timeout"]).toContain(outcomes[outcomes.length - 1]);
      if (r.state === "accepted") expect(r.attempts).toBe(n);
      // payload erased the moment the message left the outbox
      expect(r.toEncrypted).toBeNull();
      expect(r.bodyEncrypted).toBeNull();
    }
    // every call the provider saw belongs to a message we know about; none was sent for a cancelled/unknown id
    for (const mid of calls.keys()) expect(created).toContain(mid);
    expect(byState.accepted).toBeGreaterThan(N * 0.5); // sanity: the engine actually delivered the bulk
  });

  t("worker crashes: abandoned leases become uncertain and are never sent, while other workers carry on", async () => {
    await mkAccount();
    const outbox = new SmsOutboxService(prisma as any, new SmsAccountsService(prisma as any, audit), audit, boss);
    const { calls } = simulatedProvider({ ok: 100, r429: 0, e5xx: 0, timeout: 0, reject: 0 });
    const created: string[] = [];
    for (let i = 0; i < 40; i++) created.push((await outbox.enqueue(phone(), "crash", { purpose: "itest-load" })).id!);
    ids.push(...created);
    // 10 messages are claimed by workers that then "die" before calling the provider
    const doomed = created.slice(0, 10);
    for (const id of doomed) expect(await outbox.claim(id)).not.toBeNull();
    await prisma.smsMessage.updateMany({ where: { id: { in: doomed } }, data: { leaseUntil: new Date(Date.now() - 1000) } });
    const survivors = Array.from({ length: 4 }, () => new SmsOutboxService(prisma as any, new SmsAccountsService(prisma as any, audit), audit, boss));
    for (let round = 0; round < 4; round++) await Promise.all(survivors.map((w) => w.sweep(30)));
    const rows = await prisma.smsMessage.findMany({ where: { id: { in: created } }, select: { id: true, state: true } });
    const state = new Map(rows.map((r) => [r.id, r.state]));
    for (const id of doomed) {
      expect(state.get(id)).toBe("uncertain");
      expect(calls.get(id) ?? 0).toBe(0); // the lost message was never sent, and never re-sent
    }
    for (const id of created.slice(10)) expect(state.get(id)).toBe("accepted");
    console.log(`  [evidence] 10 abandoned leases -> uncertain (0 provider calls); 30 healthy messages -> accepted`);
  });

  t("callback flood: 400 concurrent duplicate callbacks across 20 messages apply each transition exactly once", async () => {
    const a = await mkAccount();
    const accounts = new SmsAccountsService(prisma as any, audit);
    const outbox = new SmsOutboxService(prisma as any, accounts, audit, boss);
    const webhook = new SmsWebhookController(prisma as any, accounts, new ConsentService(prisma as any));
    const sids = new Map<string, string>();
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(((_u: any, init: any) => {
      const mid = /mid=([0-9a-f-]{36})/i.exec(decodeURIComponent(String(init.body)))![1];
      const sid = "SM" + hex(32);
      sids.set(mid, sid);
      return reply(201, { sid });
    }) as any);
    const created: string[] = [];
    for (let i = 0; i < 20; i++) created.push((await outbox.enqueue(phone(), "cb", { purpose: "itest-load" })).id!);
    ids.push(...created);
    for (const id of created) await outbox.dispatchById(id);

    const send = (mid: string, status: string) => {
      const body = { AccountSid: a.sid, MessageSid: sids.get(mid)!, MessageStatus: status };
      const originalUrl = `/api/sms/webhooks/status?mid=${mid}`;
      return webhook.handle("status", { body, originalUrl, query: { mid } } as any, expectedTwilioSignature(a.token, `${BASE}${originalUrl}`, body)).catch(() => "err");
    };
    const jobs: Promise<any>[] = [];
    for (const mid of created) for (let k = 0; k < 20; k++) jobs.push(send(mid, k % 2 ? "delivered" : "sent")); // mixed order, 10x each
    const started = Date.now();
    await Promise.all(jobs);
    console.log(`  [evidence] ${jobs.length} concurrent signed callbacks in ${Date.now() - started} ms`);
    const rows = await prisma.smsMessage.findMany({ where: { id: { in: created } }, select: { state: true } });
    expect(rows.every((r) => r.state === "delivered")).toBe(true); // always converges to the furthest state, whatever the order
    expect(await prisma.smsWebhookEvent.count({ where: { providerSid: { in: [...sids.values()] } } })).toBe(created.length * 2); // 'sent' and 'delivered' once each
  });
});
