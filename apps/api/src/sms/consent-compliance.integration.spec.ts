import "dotenv/config";
import "reflect-metadata";

jest.mock("../common/pgboss/pgboss.service", () => ({ PgBossService: class PgBossService {} }));

import { BadRequestException, ConflictException, Logger, ServiceUnavailableException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { randomBytes, randomUUID } from "crypto";
import { ConsentService } from "./consent.service";
import { ComplianceService, canMoveCompliance, registrationRequired, requiredTypesFor } from "./compliance.service";
import { SmsRetentionService } from "./sms-retention.service";
import { SmsOutboxService } from "./sms-outbox.service";
import { SmsAccountsService } from "./sms-accounts.service";
import { SmsWebhookController } from "./sms-webhook.controller";
import { expectedTwilioSignature } from "./twilio-signature";
import { credentialContext, vaultEncrypt } from "../common/security/credential-vault";
import { recipientHash } from "./sms-keys";
import { dcg } from "./dcg-config";
import { createAccountWithRetry } from "./it-db";

const run = process.env.DATABASE_URL ? describe : describe.skip;
const ENV = { ...process.env };
const hex = (n: number) => randomBytes(n / 2).toString("hex");
const actor = { userId: "admin-test" };

describe("compliance state model and requirements (pure)", () => {
  it("allows only the documented transitions", () => {
    expect(canMoveCompliance("pending", "approved")).toBe(true);
    expect(canMoveCompliance("pending", "rejected")).toBe(true);
    expect(canMoveCompliance("pending", "suspended")).toBe(false);
    expect(canMoveCompliance("approved", "suspended")).toBe(true);
    expect(canMoveCompliance("approved", "pending")).toBe(false);
    expect(canMoveCompliance("rejected", "approved")).toBe(false); // must be resubmitted first
    expect(canMoveCompliance("rejected", "pending")).toBe(true);
    expect(canMoveCompliance("expired", "pending")).toBe(true);
    expect(canMoveCompliance("suspended", "approved")).toBe(true);
  });
  it("US long codes need brand + campaign; toll-free needs verification; messaging services need A2P", () => {
    expect(requiredTypesFor({ number: "+14155550100" })).toEqual(["A2P_10DLC_BRAND", "A2P_10DLC_CAMPAIGN"]);
    expect(requiredTypesFor({ number: "+18885550100" })).toEqual(["TOLLFREE_VERIFICATION"]);
    expect(requiredTypesFor({ number: "+442071838750" })).toEqual([]);
    expect(requiredTypesFor({ messagingService: true })).toEqual(["A2P_10DLC_BRAND", "A2P_10DLC_CAMPAIGN"]);
  });
  it("registration is required in production by default, optional elsewhere, and overridable", () => {
    const e = { ...process.env };
    process.env.NODE_ENV = "production";
    delete process.env.DCG_REQUIRE_REGISTRATION;
    expect(registrationRequired()).toBe(true);
    process.env.NODE_ENV = "development";
    expect(registrationRequired()).toBe(false);
    process.env.DCG_REQUIRE_REGISTRATION = "true";
    expect(registrationRequired()).toBe(true);
    process.env = e;
  });
  it("webhook signature verification cannot be disabled in production", () => {
    const e = { ...process.env };
    process.env.NODE_ENV = "production";
    process.env.DCG_WEBHOOK_SIGNATURE_REQUIRED = "false";
    expect(dcg.signatureRequired()).toBe(true);
    process.env.NODE_ENV = "development";
    expect(dcg.signatureRequired()).toBe(false); // only a non-production escape hatch
    delete process.env.DCG_WEBHOOK_SIGNATURE_REQUIRED;
    expect(dcg.signatureRequired()).toBe(true); // default is on
    process.env = e;
  });
});

run("consent, compliance and message privacy (real PostgreSQL)", () => {
  const prisma = new PrismaClient();
  const audit: any = { log: jest.fn().mockResolvedValue(undefined) };
  const boss: any = { add: jest.fn().mockResolvedValue(undefined) };
  let consent: ConsentService;
  let compliance: ComplianceService;
  let blocked = false;

  const phones: string[] = [];
  const accountsMade: string[] = [];
  const phone = () => {
    const p = "+1415557" + String(Math.floor(1000 + Math.random() * 8999));
    phones.push(p);
    return p;
  };
  async function mkAccount(status: "active" | "verified" = "verified", numberFor = "+14155550100") {
    const id = randomUUID();
    const sid = "AC" + hex(32);
    const token = "tok_" + hex(40);
    await createAccountWithRetry(prisma, {
      data: {
        id, name: "itest-" + id.slice(0, 6), accountSid: sid, status, keyVersion: 1,
        encryptedAuthToken: vaultEncrypt(token, credentialContext(id, "authToken")).payload,
        senders: { create: { senderNumber: numberFor } },
      },
    });
    accountsMade.push(id);
    return { id, sid, token, sender: (await prisma.twilioSender.findFirstOrThrow({ where: { accountId: id } })).id };
  }

  beforeAll(async () => {
    // Only a REAL active provider blocks these tests; other specs' temporary "itest-" accounts just take turns.
    blocked = (await prisma.twilioAccount.count({ where: { status: "active", NOT: { name: { startsWith: "itest-" } } } })) > 0;
  });
  beforeEach(() => {
    process.env = { ...ENV, NODE_ENV: "test", DCG_ENABLED: "true", DCG_HMAC_KEY: ENV.DCG_HMAC_KEY || randomBytes(32).toString("base64"), DCG_ENCRYPTION_KEY: ENV.DCG_ENCRYPTION_KEY || randomBytes(32).toString("base64"), DCG_ENCRYPTION_KEY_VERSION: "1", DCG_REQUIRE_REGISTRATION: "true" };
    consent = new ConsentService(prisma as any);
    compliance = new ComplianceService(prisma as any, audit);
  });
  afterAll(async () => {
    process.env = ENV;
    const hashes = phones.map(recipientHash);
    await prisma.smsConsent.deleteMany({ where: { phoneHash: { in: hashes } } });
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('dcg.retention_job', 'on', true)`;
      await tx.smsConsentEvent.deleteMany({ where: { phoneHash: { in: hashes } } });
    });
    await prisma.smsSuppression.deleteMany({ where: { phone: { in: phones } } });
    await prisma.smsMessage.deleteMany({ where: { purpose: { startsWith: "itest" } } });
    await prisma.twilioAccount.deleteMany({ where: { id: { in: accountsMade } } });
    await prisma.$disconnect();
  });
  const t = (name: string, fn: () => Promise<void>) => it(name, fn, 60_000);
  const tAcct = (name: string, fn: () => Promise<void>) => it(name, async () => (blocked ? undefined : fn()), 60_000);

  // ---------------------------------------------------------------- consent
  describe("consent history", () => {
    t("grant and withdrawal are recorded per recipient and purpose, with source and policy version", async () => {
      const p = phone();
      await consent.record({ phone: p, purpose: "marketing_promos", action: "granted", source: "web_form", policyVersion: "2026-11" });
      expect(await consent.hasConsent(p, "marketing_promos")).toBe(true);
      expect(await consent.hasConsent(p, "marketing_other")).toBe(false); // purposes are independent
      await consent.record({ phone: p, purpose: "marketing_promos", action: "withdrawn", source: "settings_page" });
      expect(await consent.hasConsent(p, "marketing_promos")).toBe(false);
      const h = await consent.history(p);
      expect(h.events.map((e) => e.action)).toEqual(["withdrawn", "granted"]); // newest first
      expect(h.events[1]).toMatchObject({ source: "web_form", policyVersion: "2026-11", purpose: "marketing_promos" });
      expect(JSON.stringify(h)).not.toContain(p); // masked: last four only
      expect(h.events[0].recipientLast4).toBe(p.slice(-4));
    });

    t("transactional purposes don't need a stored grant; marketing always does", async () => {
      const p = phone();
      expect(await consent.hasConsent(p, "otp_phone_verify")).toBe(true);
      expect(await consent.hasConsent(p, "marketing_anything")).toBe(false);
    });

    t("STOP withdraws every consent, suppresses the number, and is idempotent", async () => {
      const p = phone();
      await consent.record({ phone: p, purpose: "marketing_promos", action: "granted", source: "web_form" });
      await consent.record({ phone: p, purpose: "otp:phone_verify", action: "granted", source: "user_request" });
      await consent.onStop(p);
      await consent.onStop(p); // duplicate callback
      expect(await prisma.smsSuppression.count({ where: { phone: p } })).toBe(1);
      expect(await consent.hasConsent(p, "marketing_promos")).toBe(false);
      const h = await consent.history(p);
      expect(h.current.every((c) => c.status === "withdrawn")).toBe(true);
      expect(h.events.filter((e) => e.action === "stop" && e.purpose === "*").length).toBe(2);
      expect(h.events.some((e) => e.action === "withdrawn" && e.purpose === "marketing_promos")).toBe(true);
    });

    t("START lifts the block but does NOT grant marketing (or any) consent", async () => {
      const p = phone();
      await consent.record({ phone: p, purpose: "marketing_promos", action: "granted", source: "web_form" });
      await consent.onStop(p);
      await consent.onStart(p);
      expect(await prisma.smsSuppression.count({ where: { phone: p } })).toBe(0);
      expect(await consent.hasConsent(p, "marketing_promos")).toBe(false); // still withdrawn
      const h = await consent.history(p);
      expect(h.events[0]).toMatchObject({ action: "start", purpose: "*" });
      expect(h.current.find((c) => c.purpose === "marketing_promos")?.status).toBe("withdrawn");
      await consent.onStart(p); // nothing to lift: no phantom event
      expect((await consent.history(p)).events.filter((e) => e.action === "start")).toHaveLength(1);
    });

    t("consent history is append-only at the database level", async () => {
      const p = phone();
      await consent.record({ phone: p, purpose: "marketing_promos", action: "granted", source: "web_form" });
      const ev = await prisma.smsConsentEvent.findFirstOrThrow({ where: { phoneHash: recipientHash(p) } });
      await expect(prisma.smsConsentEvent.update({ where: { id: ev.id }, data: { action: "withdrawn" } })).rejects.toThrow(/append-only/);
      await expect(prisma.smsConsentEvent.delete({ where: { id: ev.id } })).rejects.toThrow(/append-only/);
      await expect(prisma.smsConsentEvent.deleteMany({ where: { phoneHash: recipientHash(p) } })).rejects.toThrow(/append-only/);
    });

    t("signed STOP and START callbacks go through the webhook and the consent trail", async () => {
      const a = await mkAccount("verified");
      const webhook = new SmsWebhookController(prisma as any, new SmsAccountsService(prisma as any, audit), consent);
      const p = phone();
      const send = async (Body: string) => {
        const body = { AccountSid: a.sid, From: p, Body, MessageSid: "SM" + hex(32) };
        const originalUrl = "/api/sms/webhooks/inbound";
        process.env.SMS_WEBHOOK_BASE_URL = "https://api.itest.example.com";
        const sig = expectedTwilioSignature(a.token, `https://api.itest.example.com${originalUrl}`, body);
        return webhook.handle("inbound", { body, originalUrl, query: {} } as any, sig);
      };
      await send("STOP");
      expect(await prisma.smsSuppression.count({ where: { phone: p } })).toBe(1);
      await send("START");
      expect(await prisma.smsSuppression.count({ where: { phone: p } })).toBe(0);
      expect((await consent.history(p)).events.map((e) => e.action)).toEqual(["start", "stop"]);
    });
  });

  // ---------------------------------------------------------------- retention
  describe("retention and erasure", () => {
    t("the retention job purges old consent events (the only permitted deletion) but not recent ones", async () => {
      const p = phone();
      const ph = recipientHash(p);
      await prisma.smsConsentEvent.create({ data: { phoneHash: ph, recipientLast4: p.slice(-4), purpose: "marketing_promos", action: "granted", source: "old", createdAt: new Date(Date.now() - 2000 * 86_400_000) } });
      await consent.record({ phone: p, purpose: "marketing_promos", action: "granted", source: "recent" });
      const r = await new SmsRetentionService(prisma as any, audit).purge();
      expect(r.consentEvents).toBeGreaterThanOrEqual(1);
      const left = await prisma.smsConsentEvent.findMany({ where: { phoneHash: ph } });
      expect(left.map((e) => e.source)).toEqual(["recent"]);
    });

    t("erasing a number removes its consent and OTP data but keeps the STOP suppression", async () => {
      const p = phone();
      await consent.record({ phone: p, purpose: "marketing_promos", action: "granted", source: "web_form" });
      await consent.onStop(p);
      const out = await new SmsRetentionService(prisma as any, audit).erasePhone(p, actor);
      expect(out.suppressionKept).toBe(true);
      expect(await prisma.smsConsent.count({ where: { phoneHash: recipientHash(p) } })).toBe(0);
      expect(await prisma.smsConsentEvent.count({ where: { phoneHash: recipientHash(p) } })).toBe(0);
      expect(await prisma.smsSuppression.count({ where: { phone: p } })).toBe(1); // an opt-out is never forgotten
    });
  });

  // ---------------------------------------------------------------- compliance records + enforcement
  describe("provider compliance", () => {
    t("an approval needs an evidence reference; nothing is auto-approved", async () => {
      const a = await mkAccount("verified");
      const reg = await compliance.create({ accountId: a.id, type: "A2P_10DLC_BRAND", brandId: "BN123" }, actor);
      expect(reg.status).toBe("pending");
      await expect(compliance.setStatus(reg.id, "approved", undefined, actor)).rejects.toBeInstanceOf(BadRequestException);
      await expect(compliance.setStatus(reg.id, "approved", "ok", actor)).rejects.toBeInstanceOf(BadRequestException);
      await expect(compliance.setStatus(reg.id, "suspended", undefined, actor)).rejects.toBeInstanceOf(ConflictException);
      const ok = await compliance.setStatus(reg.id, "approved", "Twilio console: brand BN123 approved 2026-11-20", actor);
      expect(ok).toMatchObject({ status: "approved", decidedBy: "admin-test" });
    });

    t("a sender without every required approval cannot send; approving all unlocks it", async () => {
      const a = await mkAccount("verified", "+14155550100");
      const s = { id: a.sender, number: "+14155550100" };
      expect(await compliance.isSenderApproved(a.id, s)).toBe(false);
      const brand = await compliance.create({ accountId: a.id, type: "A2P_10DLC_BRAND" }, actor);
      await compliance.setStatus(brand.id, "approved", "brand approval ref 1", actor);
      expect(await compliance.isSenderApproved(a.id, s)).toBe(false); // campaign still missing
      const camp = await compliance.create({ accountId: a.id, type: "A2P_10DLC_CAMPAIGN", campaignId: "CM1" }, actor);
      await compliance.setStatus(camp.id, "approved", "campaign approval ref 1", actor);
      expect(await compliance.isSenderApproved(a.id, s)).toBe(true);
      await compliance.setStatus(camp.id, "suspended", "carrier suspended", actor);
      expect(await compliance.isSenderApproved(a.id, s)).toBe(false);
      await compliance.setStatus(camp.id, "approved", "reinstated ref 2", actor);
      expect(await compliance.isSenderApproved(a.id, s)).toBe(true);
    });

    t("an approval past its expiry no longer counts, and the sweeper marks it expired", async () => {
      const a = await mkAccount("verified", "+18885550100");
      const tf = await compliance.create({ accountId: a.id, type: "TOLLFREE_VERIFICATION", expiresAt: new Date(Date.now() + 3600_000).toISOString() }, actor);
      await compliance.setStatus(tf.id, "approved", "toll-free verified ref", actor);
      const s = { id: a.sender, number: "+18885550100" };
      expect(await compliance.isSenderApproved(a.id, s)).toBe(true);
      await prisma.complianceRegistration.update({ where: { id: tf.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
      expect(await compliance.isSenderApproved(a.id, s)).toBe(false);
      expect(await compliance.expireDue()).toBeGreaterThanOrEqual(1);
      expect((await prisma.complianceRegistration.findUniqueOrThrow({ where: { id: tf.id } })).status).toBe("expired");
    });

    t("a sender-specific approval doesn't cover other senders on the account", async () => {
      const a = await mkAccount("verified", "+18885550100");
      const other = await prisma.twilioSender.create({ data: { accountId: a.id, senderNumber: "+18775550100" } });
      const tf = await compliance.create({ accountId: a.id, type: "TOLLFREE_VERIFICATION", senderId: a.sender }, actor);
      await compliance.setStatus(tf.id, "approved", "verified for first number only", actor);
      expect(await compliance.isSenderApproved(a.id, { id: a.sender, number: "+18885550100" })).toBe(true);
      expect(await compliance.isSenderApproved(a.id, { id: other.id, number: "+18775550100" })).toBe(false);
    });

    t("environment-credential traffic has no registrations, so it is refused when registration is required", async () => {
      expect(await compliance.isSenderApproved(null, { number: "+14155550100" })).toBe(false);
    });

    t("when registration isn't required nothing is blocked", async () => {
      process.env.DCG_REQUIRE_REGISTRATION = "false";
      const a = await mkAccount("verified");
      expect(await compliance.isSenderApproved(a.id, { id: a.sender, number: "+14155550100" })).toBe(true);
    });

    tAcct("the outbox refuses to queue regulated traffic from an unregistered sender", async () => {
      process.env.DCG_LIVE_SMS_ENABLED = "true";
      const a = await mkAccount("active", "+14155550100");
      const outbox = new SmsOutboxService(prisma as any, new SmsAccountsService(prisma as any, audit), audit, boss, undefined, compliance, consent);
      await expect(outbox.enqueue(phone(), "hi", { purpose: "itest" })).rejects.toBeInstanceOf(ServiceUnavailableException);
      const brand = await compliance.create({ accountId: a.id, type: "A2P_10DLC_BRAND" }, actor);
      const camp = await compliance.create({ accountId: a.id, type: "A2P_10DLC_CAMPAIGN" }, actor);
      await compliance.setStatus(brand.id, "approved", "ref b", actor);
      await compliance.setStatus(camp.id, "approved", "ref c", actor);
      const ok = await outbox.enqueue(phone(), "hi", { purpose: "itest" });
      expect(ok.delivery).toBe("queued");
      await prisma.twilioAccount.update({ where: { id: a.id }, data: { status: "revoked", encryptedAuthToken: null } });
    });

    tAcct("marketing messages need an explicit grant, both at queue time and at dispatch", async () => {
      process.env.DCG_LIVE_SMS_ENABLED = "true";
      process.env.DCG_REQUIRE_REGISTRATION = "false";
      const a = await mkAccount("active");
      const outbox = new SmsOutboxService(prisma as any, new SmsAccountsService(prisma as any, audit), audit, boss, undefined, compliance, consent);
      const p = phone();
      await expect(outbox.enqueue(p, "sale!", { purpose: "marketing_promos" })).rejects.toBeInstanceOf(ServiceUnavailableException);
      await consent.record({ phone: p, purpose: "marketing_promos", action: "granted", source: "web_form" });
      const q = await outbox.enqueue(p, "sale!", { purpose: "marketing_promos" });
      expect(q.delivery).toBe("queued");
      await consent.record({ phone: p, purpose: "marketing_promos", action: "withdrawn", source: "settings" }); // withdrawn AFTER queueing
      const fetchSpy = jest.spyOn(globalThis, "fetch");
      expect(await outbox.dispatchById(q.id!)).toBe("canceled:no_consent");
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
      await prisma.twilioAccount.update({ where: { id: a.id }, data: { status: "revoked", encryptedAuthToken: null } });
    });
  });

  // ---------------------------------------------------------------- log privacy
  describe("message privacy in logs", () => {
    const capture = () => {
      const lines: string[] = [];
      const spies = (["log", "warn", "error", "debug", "verbose"] as const).map((m) => jest.spyOn(Logger.prototype, m).mockImplementation((...a: any[]) => { lines.push(a.map(String).join(" ")); }));
      return { lines, restore: () => spies.forEach((s) => s.mockRestore()) };
    };

    t("with sending off, the dev fallback logs metadata only: never the body, OTP or link", async () => {
      process.env.DCG_LIVE_SMS_ENABLED = "false";
      delete process.env.DCG_DEV_LOG_BODIES;
      const outbox = new SmsOutboxService(prisma as any, new SmsAccountsService(prisma as any, audit), audit, boss, undefined, compliance, consent);
      const c = capture();
      const secret = "Your code is 482913 https://app.example.com/verify-id/SECRETTOKEN123";
      const r = await outbox.enqueue(phone(), secret, { purpose: "itest" });
      c.restore();
      expect(r.delivery).toBe("logged");
      const all = c.lines.join("\n");
      expect(all).toContain("not queued");
      expect(all).not.toContain("482913");
      expect(all).not.toContain("SECRETTOKEN123");
      expect(all).not.toContain("verify-id");
    });

    t("the developer opt-in logs the body outside production, and is ignored in production", async () => {
      process.env.DCG_LIVE_SMS_ENABLED = "false";
      const outbox = new SmsOutboxService(prisma as any, new SmsAccountsService(prisma as any, audit), audit, boss, undefined, compliance, consent);
      process.env.DCG_DEV_LOG_BODIES = "true";
      let c = capture();
      await outbox.enqueue(phone(), "dev body 111222", { purpose: "itest" });
      c.restore();
      expect(c.lines.join("\n")).toContain("dev body 111222");

      process.env.NODE_ENV = "production";
      c = capture();
      await outbox.enqueue(phone(), "prod body 333444", { purpose: "itest" }).catch(() => undefined);
      c.restore();
      expect(c.lines.join("\n")).not.toContain("prod body 333444");
    });
  });
});
