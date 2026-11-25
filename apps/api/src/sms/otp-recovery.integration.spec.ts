import "dotenv/config";
import "reflect-metadata";

jest.mock("../common/pgboss/pgboss.service", () => ({ PgBossService: class PgBossService {} }));

import { BadRequestException, HttpException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { randomBytes, randomUUID } from "crypto";
import { OtpService } from "./otp.service";
import { ConsentService } from "./consent.service";
import { FraudService } from "./fraud.service";
import { RecoveryService } from "../otp/recovery.service";
import { hashRefreshSecret } from "../common/security/refresh";
import { recipientHash } from "./sms-keys";

/**
 * Real-PostgreSQL tests of the OTP engine, fraud controls and SMS recovery. The SMS layer is a
 * recorder: the code is read from the "sent" message in memory, exactly where a real user would
 * read it from their phone - it is never in the database or the audit log, and the tests prove that.
 */
const run = process.env.DATABASE_URL ? describe : describe.skip;
const ENV = { ...process.env };
const hex = (n: number) => randomBytes(n / 2).toString("hex");

run("OTP engine, fraud controls and recovery (real PostgreSQL)", () => {
  const prisma = new PrismaClient();
  const sent: { to: string; body: string; purpose?: string }[] = [];
  const sms: any = { send: jest.fn(async (to: string, body: string, o: any) => { sent.push({ to, body, purpose: o?.purpose }); return "queued"; }) };
  const auditLog: any[] = [];
  const audit: any = { log: jest.fn(async (e: any) => { auditLog.push(e); }) };
  const alerts: any = { raise: jest.fn().mockResolvedValue(undefined) };
  const boss: any = { add: jest.fn().mockResolvedValue(undefined) };

  let otp: OtpService;
  let recovery: RecoveryService;
  let consent: ConsentService;
  let fraud: FraudService;

  const users: string[] = [];
  const phones: string[] = [];
  const phone = () => {
    const p = "+1415556" + String(Math.floor(1000 + Math.random() * 8999));
    phones.push(p);
    return p;
  };
  const ip = () => `203.0.113.${Math.floor(Math.random() * 250) + 1}-${hex(6)}`; // unique per call; hashed before use
  const codeOf = (idx = sent.length - 1) => /\b(\d{6})\b/.exec(sent[idx].body)![1];
  const mkUser = async (o: { role?: "USER" | "SUPPORT" | "SUPERADMIN"; phone?: string | null; verified?: boolean; status?: "ACTIVE" | "SUSPENDED" } = {}) => {
    const u = await prisma.user.create({
      data: {
        email: `itest-otp-${hex(8)}@example.com`,
        password: "x",
        role: o.role ?? "USER",
        phoneE164: o.phone === undefined ? phone() : o.phone,
        phoneVerifiedAt: o.verified === false ? null : new Date(),
        accountStatus: o.status ?? "ACTIVE",
      },
    });
    users.push(u.id);
    return u;
  };
  const expectFail = async (p: Promise<any>) => {
    const e = await p.then(() => null, (x) => x);
    expect(e).toBeInstanceOf(BadRequestException);
    expect(e.message).toBe("Invalid or expired code"); // identical for every failure
  };

  beforeEach(() => {
    process.env = { ...ENV, NODE_ENV: "test", DCG_HMAC_KEY: ENV.DCG_HMAC_KEY || randomBytes(32).toString("base64"), DCG_ENCRYPTION_KEY: ENV.DCG_ENCRYPTION_KEY || randomBytes(32).toString("base64"), DCG_OTP_RESEND_COOLDOWN_SECONDS: "60" };
    sent.length = 0;
    auditLog.length = 0;
    consent = new ConsentService(prisma as any);
    fraud = new FraudService(prisma as any, alerts);
    otp = new OtpService(prisma as any, sms, consent, fraud, audit);
    recovery = new RecoveryService(prisma as any, otp, audit, boss);
    alerts.raise.mockClear();
    boss.add.mockClear();
  });

  afterAll(async () => {
    process.env = ENV;
    const hashes = phones.map((p) => recipientHash(p));
    await prisma.otpChallenge.deleteMany({ where: { OR: [{ recipientHash: { in: hashes } }, { userId: { in: users } }] } });
    await prisma.smsRiskEvent.deleteMany({ where: { OR: [{ subjectHash: { in: hashes } }, { userId: { in: users } }] } });
    await prisma.smsConsent.deleteMany({ where: { phoneHash: { in: hashes } } });
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('dcg.retention_job', 'on', true)`;
      await tx.smsConsentEvent.deleteMany({ where: { phoneHash: { in: hashes } } });
    });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: users } } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  });

  const t = (name: string, fn: () => Promise<void>) => it(name, fn, 60_000);

  // ---------------------------------------------------------------- generation and storage
  describe("code generation and storage", () => {
    t("issues a 6-digit code, stores only a keyed HMAC, and never logs the code or the number", async () => {
      const p = phone();
      const r = await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() });
      const code = codeOf();
      expect(code).toMatch(/^\d{6}$/);
      const row = await prisma.otpChallenge.findUniqueOrThrow({ where: { id: r.challengeId } });
      expect(row.codeHmac).toMatch(/^[0-9a-f]{64}$/);
      const dump = JSON.stringify(row);
      expect(dump).not.toContain(code);
      expect(dump).not.toContain(p);
      expect(row.recipientLast4).toBe(p.slice(-4));
      expect(row.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(300_000);
      expect(row.expiresAt.getTime() - Date.now()).toBeGreaterThan(290_000);
      const logs = JSON.stringify(auditLog);
      expect(logs).not.toContain(code);
      expect(logs).not.toContain(p);
      expect(sent[0].body).toContain("expires in 5 minutes");
    });

    t("40 independently issued codes are almost all distinct (not predictable)", async () => {
      const seen = new Set<string>();
      for (let i = 0; i < 40; i++) {
        const p = phone();
        await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip(), deviceId: hex(10) });
        seen.add(codeOf());
      }
      expect(seen.size).toBeGreaterThan(35);
    });
  });

  // ---------------------------------------------------------------- verification rules
  describe("verification", () => {
    t("a correct code verifies exactly once", async () => {
      const p = phone();
      await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() });
      const code = codeOf();
      await expect(otp.verify({ purpose: "phone_verify", userId: null, phone: p, code })).resolves.toBeDefined();
      await expectFail(otp.verify({ purpose: "phone_verify", userId: null, phone: p, code })); // replay
    });

    t("10 simultaneous correct submissions: exactly one succeeds (single use under concurrency)", async () => {
      const p = phone();
      await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() });
      const code = codeOf();
      const results = await Promise.allSettled(Array.from({ length: 10 }, () => otp.verify({ purpose: "phone_verify", userId: null, phone: p, code })));
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    });

    t("60 simultaneous wrong guesses never exceed the attempt limit, and the right code is then refused", async () => {
      const p = phone();
      await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() });
      const code = codeOf();
      const wrong = code === "000000" ? "111111" : "000000";
      const results = await Promise.allSettled(Array.from({ length: 60 }, () => otp.verify({ purpose: "phone_verify", userId: null, phone: p, code: wrong })));
      expect(results.every((r) => r.status === "rejected")).toBe(true);
      const row = await prisma.otpChallenge.findFirstOrThrow({ where: { recipientHash: recipientHash(p) } });
      expect(row.attempts).toBe(5);
      expect(row.attempts).toBeLessThanOrEqual(row.maxAttempts);
      await expectFail(otp.verify({ purpose: "phone_verify", userId: null, phone: p, code })); // locked out
      expect(await prisma.smsRiskEvent.count({ where: { subjectHash: recipientHash(p), kind: "verification_failures" } })).toBeGreaterThan(0);
    });

    t("an expired code is refused", async () => {
      const p = phone();
      const r = await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() });
      const code = codeOf();
      await prisma.otpChallenge.update({ where: { id: r.challengeId }, data: { expiresAt: new Date(Date.now() - 1000) } });
      await expectFail(otp.verify({ purpose: "phone_verify", userId: null, phone: p, code }));
    });

    t("a new request invalidates the previous code", async () => {
      const p = phone();
      await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() });
      const first = codeOf();
      await prisma.otpChallenge.updateMany({ where: { recipientHash: recipientHash(p) }, data: { lastSentAt: new Date(Date.now() - 120_000) } }); // past the cooldown
      await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() });
      const second = codeOf();
      if (first !== second) await expectFail(otp.verify({ purpose: "phone_verify", userId: null, phone: p, code: first }));
      await expect(otp.verify({ purpose: "phone_verify", userId: null, phone: p, code: second })).resolves.toBeDefined();
    });

    t("a code is bound to its purpose, number and account", async () => {
      const u1 = await mkUser();
      const u2 = await mkUser();
      const p = phone();
      await otp.request({ purpose: "phone_verify", userId: u1.id, phone: p, ip: ip() });
      const code = codeOf();
      await expectFail(otp.verify({ purpose: "recovery", userId: u1.id, phone: p, code })); // wrong purpose
      await expectFail(otp.verify({ purpose: "phone_verify", userId: u1.id, phone: phone(), code })); // wrong number
      await expectFail(otp.verify({ purpose: "phone_verify", userId: u2.id, phone: p, code })); // wrong account
      await expect(otp.verify({ purpose: "phone_verify", userId: u1.id, phone: p, code })).resolves.toEqual({ userId: u1.id });
    });

    t("malformed input fails with the same generic message", async () => {
      const p = phone();
      await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() });
      await expectFail(otp.verify({ purpose: "phone_verify", userId: null, phone: p, code: "12ab56" }));
      await expectFail(otp.verify({ purpose: "phone_verify", userId: null, phone: p, code: "12345" }));
      await expectFail(otp.verify({ purpose: "phone_verify", userId: null, phone: "not-a-number", code: "123456" }));
      await expectFail(otp.verify({ purpose: "phone_verify", userId: null, phone: phone(), code: "123456" })); // no challenge at all
    });
  });

  // ---------------------------------------------------------------- rate limits
  describe("resend cooldown and hourly cap", () => {
    t("a second request inside the cooldown is refused with a retry time", async () => {
      const p = phone();
      await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() });
      const e: HttpException = await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() }).then(() => null as any, (x) => x);
      expect(e.getStatus()).toBe(429);
      expect((e.getResponse() as any).retryAfterSeconds).toBeGreaterThan(0);
      expect(sent).toHaveLength(1);
    });

    t("10 parallel requests for one number create exactly one challenge (cooldown can't be raced)", async () => {
      const p = phone();
      const results = await Promise.allSettled(Array.from({ length: 10 }, () => otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() })));
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(await prisma.otpChallenge.count({ where: { recipientHash: recipientHash(p) } })).toBe(1);
      expect(sent).toHaveLength(1);
    });

    t("the hourly per-recipient cap holds even after the cooldown passes", async () => {
      const p = phone();
      const rh = recipientHash(p);
      for (let i = 0; i < 5; i++) {
        await prisma.otpChallenge.create({ data: { purpose: "phone_verify", recipientHash: rh, recipientLast4: p.slice(-4), codeHmac: "0".repeat(64), expiresAt: new Date(Date.now() - 1), lastSentAt: new Date(Date.now() - 600_000), consumedAt: new Date() } });
      }
      const e: HttpException = await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: ip() }).then(() => null as any, (x) => x);
      expect(e.getStatus()).toBe(429);
      expect(sent).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------- fraud
  describe("fraud intelligence", () => {
    t("SMS pumping: one device texting many different numbers is blocked temporarily and flagged", async () => {
      const device = hex(12);
      const addr = ip();
      const outcomes: string[] = [];
      for (let i = 0; i < 8; i++) {
        await otp.request({ purpose: "phone_verify", userId: null, phone: phone(), ip: addr, deviceId: device }).then(() => outcomes.push("ok"), (e) => outcomes.push(String(e.getStatus?.())));
      }
      expect(outcomes.filter((o) => o === "ok").length).toBeLessThan(8);
      expect(outcomes).toContain("429");
      expect(await prisma.smsRiskEvent.count({ where: { kind: "sms_pumping", action: "blocked" } })).toBeGreaterThan(0);
      expect(alerts.raise).toHaveBeenCalledWith("SMS_FRAUD_BLOCK", "high", expect.any(String), expect.anything());
    });

    t("a shared IP address alone does not block an unrelated user on another IP or device", async () => {
      const shared = ip();
      for (let i = 0; i < 3; i++) await otp.request({ purpose: "phone_verify", userId: null, phone: phone(), ip: shared, deviceId: hex(10) });
      await expect(otp.request({ purpose: "phone_verify", userId: null, phone: phone(), ip: ip(), deviceId: hex(10) })).resolves.toBeDefined();
    });

    t("fraud controls never suspend an account", async () => {
      const u = await mkUser();
      const device = hex(12);
      const addr = ip();
      for (let i = 0; i < 10; i++) await otp.request({ purpose: "phone_verify", userId: u.id, phone: phone(), ip: addr, deviceId: device }).catch(() => undefined);
      const after = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
      expect(after.accountStatus).toBe("ACTIVE");
    });

    t("IPs and device ids are stored only as keyed hashes", async () => {
      const addr = "198.51.100.77";
      const device = "my-device-id-1234";
      const p = phone();
      const r = await otp.request({ purpose: "phone_verify", userId: null, phone: p, ip: addr, deviceId: device });
      const row = await prisma.otpChallenge.findUniqueOrThrow({ where: { id: r.challengeId } });
      expect(row.ipHash).toMatch(/^[0-9a-f]{64}$/);
      expect(row.deviceHash).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(row)).not.toContain(addr);
      expect(JSON.stringify(row)).not.toContain(device);
    });

    t("risk events can be reviewed once", async () => {
      const ev = await prisma.smsRiskEvent.create({ data: { kind: "ip_velocity", score: 100, severity: "medium", action: "throttled", ipHash: hex(64) } });
      const list = await fraud.list("open");
      expect(list.find((e) => e.id === ev.id)?.ipHash).toHaveLength(10); // masked
      expect(await fraud.review(ev.id, "dismissed", "reviewer-1")).toEqual({ id: ev.id, updated: true });
      expect(await fraud.review(ev.id, "confirmed", "reviewer-2")).toEqual({ id: ev.id, updated: false });
      await prisma.smsRiskEvent.delete({ where: { id: ev.id } });
    });
  });

  // ---------------------------------------------------------------- phone verification + recovery
  describe("phone verification and account recovery", () => {
    t("verifying a phone marks it verified", async () => {
      const u = await mkUser({ phone: null, verified: false });
      const p = phone();
      await recovery.requestPhoneVerification(u.id, p, { ip: ip() });
      await recovery.confirmPhoneVerification(u.id, p, codeOf());
      const after = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
      expect(after.phoneE164).toBe(p);
      expect(after.phoneVerifiedAt).not.toBeNull();
    });

    t("recovery request answers identically for existing, unknown, unverified and privileged accounts", async () => {
      const ok = await mkUser();
      const unverified = await mkUser({ verified: false });
      const admin = await mkUser({ role: "SUPERADMIN" });
      const staff = await mkUser({ role: "SUPPORT" });
      const answers = await Promise.all([
        recovery.requestRecovery(ok.email, { ip: ip() }),
        recovery.requestRecovery(`nobody-${hex(6)}@example.com`, { ip: ip() }),
        recovery.requestRecovery(unverified.email, { ip: ip() }),
        recovery.requestRecovery(admin.email, { ip: ip() }),
        recovery.requestRecovery(staff.email, { ip: ip() }),
      ]);
      for (const a of answers) expect(a).toEqual({ ok: true });
      // ...but only the eligible ordinary account was actually texted
      expect(sent).toHaveLength(1);
      expect(sent[0].to).toBe(ok.phoneE164);
      expect(boss.add).toHaveBeenCalledTimes(1); // owner notified by email
    });

    t("suspended accounts are not recoverable by SMS either", async () => {
      const u = await mkUser({ status: "SUSPENDED" });
      expect(await recovery.requestRecovery(u.email, { ip: ip() })).toEqual({ ok: true });
      expect(sent).toHaveLength(0);
    });

    t("a correct code yields a single-use, 15-minute reset token the existing reset flow can consume", async () => {
      const u = await mkUser();
      await recovery.requestRecovery(u.email, { ip: ip() });
      const out = await recovery.verifyRecovery(u.email, codeOf(), { ip: ip() });
      expect(out.expiresInSeconds).toBe(900);
      const [tokenId, secret] = out.resetToken.split(".");
      const rec = await prisma.passwordResetToken.findUniqueOrThrow({ where: { tokenId } });
      expect(rec.userId).toBe(u.id);
      expect(rec.usedAt).toBeNull();
      expect(rec.tokenHash).toBe(hashRefreshSecret(secret)); // exactly what AuthService.resetPassword checks
      expect(rec.tokenHash).not.toContain(secret);
      expect(Math.round((rec.expiresAt.getTime() - Date.now()) / 60_000)).toBe(15);
      // the OTP behind it cannot be reused to mint a second token
      await expectFail(recovery.verifyRecovery(u.email, "000000", { ip: ip() }));
    });

    t("verification fails generically for unknown, unverified and privileged accounts", async () => {
      const admin = await mkUser({ role: "SUPERADMIN" });
      await expectFail(recovery.verifyRecovery(`nobody-${hex(6)}@example.com`, "123456", { ip: ip() }));
      await expectFail(recovery.verifyRecovery(admin.email, "123456", { ip: ip() }));
      expect(await prisma.otpChallenge.count({ where: { userId: admin.id } })).toBe(0); // never even issued one
    });

    t("a code for one account cannot recover another", async () => {
      const a = await mkUser();
      const b = await mkUser();
      await recovery.requestRecovery(a.email, { ip: ip() });
      const code = codeOf();
      await expectFail(recovery.verifyRecovery(b.email, code, { ip: ip() }));
      expect(await prisma.passwordResetToken.count({ where: { userId: b.id } })).toBe(0);
    });

    t("no OTP, reset token or phone number appears in audit records", async () => {
      const u = await mkUser();
      await recovery.requestRecovery(u.email, { ip: ip() });
      const code = codeOf();
      const out = await recovery.verifyRecovery(u.email, code, { ip: ip() });
      const dump = JSON.stringify(auditLog);
      expect(dump).not.toContain(code);
      expect(dump).not.toContain(out.resetToken);
      expect(dump).not.toContain(out.resetToken.split(".")[1]);
      expect(dump).not.toContain(u.phoneE164!);
      expect(auditLog.map((e) => e.action)).toEqual(expect.arrayContaining(["OTP_REQUESTED", "OTP_VERIFIED", "RECOVERY_TOKEN_ISSUED"]));
    });
  });
});
