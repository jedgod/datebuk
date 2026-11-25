import { HttpException, HttpStatus, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { hostname } from "os";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { PgBossService } from "../common/pgboss/pgboss.service";
import { vaultConfigured, vaultDecrypt, vaultEncrypt } from "../common/security/credential-vault";
import { SmsAccountsService } from "./sms-accounts.service";
import { SmsControlService } from "./sms-control.service";
import { ComplianceService } from "./compliance.service";
import { ConsentService } from "./consent.service";
import { dcg } from "./dcg-config";
import { countSegments } from "./sms-segments";
import { basicAuth, type TwilioRestCreds } from "./twilio-api";
import { MAX_DISPATCH_ATTEMPTS, classifyHttp, retryDelaySeconds } from "./sms-state";

export const E164 = /^\+[1-9]\d{7,14}$/;
export const SMS_DISPATCH_QUEUE = "sms-dispatch";
const LEASE_SECONDS = 60;

export type SmsDelivery = "queued" | "logged";

export type Sender = {
  source: "db" | "env";
  accountId: string | null;
  senderId: string | null;
  creds: TwilioRestCreds;
  from?: string;
  messagingServiceSid?: string;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  allowedPrefixes: string[];
};

type Row = {
  id: string;
  accountId: string | null;
  userId: string | null;
  purpose: string;
  ref: string | null;
  segments: number;
  state: string;
  toEncrypted: string | null;
  bodyEncrypted: string | null;
  attempts: number;
  expiresAt: Date | null;
};

/** Returns a reason to cancel the message, or null to let it send. Runs immediately before dispatch. */
export type PurposeGuard = (m: { userId: string | null; ref: string | null }) => Promise<string | null>;

const utcDay = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};
const utcMonth = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
};
const ctx = (id: string, field: "to" | "body") => `sms:${id}:${field}`;

/**
 * Durable outbound SMS (outbox pattern), on the repository's existing PostgreSQL + pg-boss.
 *
 *  - enqueue() reserves the segments against the account's spending caps and inserts the message
 *    in ONE transaction serialized per account, so concurrent callers can never exceed a cap.
 *    The recipient and body are stored encrypted (credential vault, bound to the row) and
 *    erased the moment the message leaves queued/dispatching.
 *  - A worker claims a message with an exclusive lease. Only the claim winner may call Twilio.
 *  - Everything is re-authorized at dispatch time: opted out? expired? still wanted (purpose
 *    guard)? sending enabled? is the SAME provider account still active? destination allowed?
 *  - Outcomes are classified (see sms-state.ts). Only a provider rate-limit is retried. A
 *    timeout / 5xx / lost lease becomes `uncertain` and is NEVER retried - it is resolved by a
 *    signed provider callback or an admin.
 *  - pg-boss is just the low-latency wake-up; the database is the source of truth, and the
 *    sweeper recovers anything a crashed process left behind.
 */
@Injectable()
export class SmsOutboxService {
  private readonly log = new Logger(SmsOutboxService.name);
  readonly workerId = `${hostname()}-${process.pid}-${randomUUID().slice(0, 8)}`;
  private guards = new Map<string, PurposeGuard>();

  constructor(
    private prisma: PrismaService,
    private accounts: SmsAccountsService,
    private audit: AuditService,
    private boss: PgBossService,
    // Optional so the outbox can be constructed in isolation (tests); Nest always injects them.
    private control?: SmsControlService,
    private compliance?: ComplianceService,
    private consent?: ConsentService,
  ) {}

  registerPurposeGuard(purpose: string, guard: PurposeGuard) {
    this.guards.set(purpose, guard);
  }

  // ------------------------------------------------------------------ sender resolution

  private fromEnv(): Sender | null {
    if (!dcg.envFallback()) return null;
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim();
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim();
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
    const from = (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER)?.trim();
    if (!accountSid || !(messagingServiceSid || from)) return null;
    const creds: TwilioRestCreds | null =
      apiKeySid && apiKeySecret ? { accountSid, apiKeySid, secret: apiKeySecret } : authToken ? { accountSid, secret: authToken } : null;
    if (!creds) return null;
    return { source: "env", accountId: null, senderId: null, creds, from: from || undefined, messagingServiceSid: messagingServiceSid || undefined, dailyLimit: null, monthlyLimit: null, allowedPrefixes: ["+1"] };
  }

  private async fromDb(): Promise<Sender | null> {
    const account = await this.prisma.twilioAccount.findFirst({
      where: { status: "active" },
      include: { senders: { where: { enabled: true }, orderBy: { createdAt: "asc" }, take: 1 } },
    });
    const sender = account?.senders[0];
    if (!account || !sender) return null;
    const creds = this.accounts.restCredentials(account);
    if (!creds) return null;
    return {
      source: "db",
      accountId: account.id,
      senderId: sender.id,
      creds,
      from: sender.senderNumber ?? undefined,
      messagingServiceSid: sender.messagingServiceSid ?? undefined,
      dailyLimit: account.dailySegmentLimit,
      monthlyLimit: account.monthlySegmentLimit,
      allowedPrefixes: account.allowedPrefixes,
    };
  }

  /** The single account/sender messages would go out through right now, or null. Never picks an alternative. */
  async resolveSender(): Promise<Sender | null> {
    return (await this.fromDb()) ?? this.fromEnv();
  }

  // ------------------------------------------------------------------ enqueue (atomic reservation)

  async enqueue(
    toE164: string,
    body: string,
    opts: { purpose?: string; userId?: string | null; ref?: string | null; idempotencyKey?: string; ttlSeconds?: number } = {},
  ): Promise<{ id: string | null; delivery: SmsDelivery }> {
    if (!E164.test(toE164)) throw new ServiceUnavailableException("Invalid phone number");

    // Consent: opted out (replied STOP) -> never message.
    if (await this.prisma.smsSuppression.findUnique({ where: { phone: toE164 } })) {
      throw new ServiceUnavailableException("This number has opted out of text messages. Reply START to opt back in.");
    }

    if (await this.control?.isStopped()) throw new ServiceUnavailableException("SMS is temporarily unavailable.");
    if (this.consent && !(await this.consent.hasConsent(toE164, opts.purpose ?? "transactional"))) {
      throw new ServiceUnavailableException("This number hasn't agreed to receive these messages.");
    }

    const sender = await this.resolveSender();
    const prefixes = sender?.allowedPrefixes ?? ["+1"];
    if (!prefixes.some((p) => toE164.startsWith(p))) {
      throw new ServiceUnavailableException("Text messages to that country aren't enabled.");
    }

    if (!dcg.liveSms() || !sender) {
      if (process.env.NODE_ENV === "production") {
        throw new ServiceUnavailableException(!dcg.liveSms() ? "SMS is disabled" : "SMS is not configured");
      }
      // Message bodies carry OTPs and verification links: they are NEVER logged by default. A developer can opt in
      // locally with DCG_DEV_LOG_BODIES=true; that switch is ignored in production.
      const reason = !dcg.liveSms() ? "DCG_LIVE_SMS_ENABLED is off" : "no active provider account";
      const optIn = process.env.DCG_DEV_LOG_BODIES === "true" && process.env.NODE_ENV !== "production";
      this.log.warn(`[dev] SMS not queued (${reason}) to ***${toE164.slice(-4)}, purpose=${opts.purpose ?? "transactional"}, ${body.length} chars${optIn ? `. Body: ${body}` : ""}`);
      return { id: null, delivery: "logged" };
    }
    if (!vaultConfigured()) throw new ServiceUnavailableException("SMS credential vault is not configured");
    if (this.compliance && !(await this.compliance.isSenderApproved(sender.accountId, { id: sender.senderId, number: sender.from, messagingService: !!sender.messagingServiceSid }))) {
      throw new ServiceUnavailableException("SMS isn't available: the sender has no approved carrier registration.");
    }

    const { segments } = countSegments(body);
    const id = randomUUID();
    const expiresAt = opts.ttlSeconds ? new Date(Date.now() + opts.ttlSeconds * 1000) : null;

    const created = await this.prisma.$transaction(
      async (tx) => {
        // Serialize reservations per account: the check and the insert below are one atomic step.
        if (sender.accountId) {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${"sms-budget:" + sender.accountId}, 0))`;
        }

        if (opts.idempotencyKey) {
          const prior = await tx.smsMessage.findUnique({ where: { idempotencyKey: opts.idempotencyKey }, select: { id: true } });
          if (prior) return { id: prior.id, replay: true };
        }

        if (sender.accountId && (sender.dailyLimit != null || sender.monthlyLimit != null)) {
          const used = async (since: Date) =>
            (await tx.smsMessage.aggregate({
              _sum: { segments: true },
              where: { accountId: sender.accountId!, createdAt: { gte: since }, state: { notIn: ["failed", "canceled"] } },
            }))._sum.segments ?? 0;
          if (sender.dailyLimit != null && (await used(utcDay())) + segments > sender.dailyLimit) {
            throw new ServiceUnavailableException("The daily SMS spending limit has been reached. Try again tomorrow.");
          }
          if (sender.monthlyLimit != null && (await used(utcMonth())) + segments > sender.monthlyLimit) {
            throw new ServiceUnavailableException("The monthly SMS spending limit has been reached.");
          }
        }

        await tx.smsMessage.create({
          data: {
            id,
            accountId: sender.accountId,
            segments,
            userId: opts.userId ?? null,
            purpose: opts.purpose ?? "transactional",
            ref: opts.ref ?? null,
            recipientLast4: toE164.slice(-4),
            toEncrypted: vaultEncrypt(toE164, ctx(id, "to")).payload,
            bodyEncrypted: vaultEncrypt(body, ctx(id, "body")).payload,
            idempotencyKey: opts.idempotencyKey ?? null,
            expiresAt,
            state: "queued",
          },
        });
        return { id, replay: false };
      },
      // Callers for one account queue on its budget lock; let them wait for a connection/turn instead of failing at Prisma's 2s default.
      { timeout: 15_000, maxWait: 10_000 },
    );

    // Low-latency wake-up. If this fails the sweeper still dispatches the message.
    this.boss.add(SMS_DISPATCH_QUEUE, { messageId: created.id }, { attempts: 0 }).catch((e) => this.log.warn(`wake-up not queued: ${e?.message}`));
    return { id: created.id, delivery: "queued" };
  }

  // ------------------------------------------------------------------ claim + dispatch

  /** Exclusive lease: exactly one concurrent caller gets the row. */
  async claim(id: string): Promise<Row | null> {
    // Prisma stores timestamps as UTC in `timestamp` (no zone) columns, so raw SQL must compare against
    // UTC too: a bare now() is in the session time zone and would skew every comparison by the offset.
    const rows = await this.prisma.$queryRaw<Row[]>`
      UPDATE "SmsMessage"
         SET "state" = 'dispatching', "claimedBy" = ${this.workerId},
             "leaseUntil" = (now() AT TIME ZONE 'UTC') + ${LEASE_SECONDS}::int * interval '1 second',
             "updatedAt" = (now() AT TIME ZONE 'UTC')
       WHERE "id" = ${id} AND "state" = 'queued' AND "nextAttemptAt" <= (now() AT TIME ZONE 'UTC')
   RETURNING "id","accountId","userId","purpose","ref","segments","state","toEncrypted","bodyEncrypted","attempts","expiresAt"`;
    return rows[0] ?? null;
  }

  /**
   * Atomically claim up to `limit` due messages for THIS worker. `FOR UPDATE SKIP LOCKED` means concurrent
   * workers never contend for - or double-claim - the same rows: each simply takes the next unclaimed ones.
   */
  async claimDue(limit: number): Promise<Row[]> {
    return this.prisma.$queryRaw<Row[]>`
      UPDATE "SmsMessage"
         SET "state" = 'dispatching', "claimedBy" = ${this.workerId},
             "leaseUntil" = (now() AT TIME ZONE 'UTC') + ${LEASE_SECONDS}::int * interval '1 second',
             "updatedAt" = (now() AT TIME ZONE 'UTC')
       WHERE "id" IN (
         SELECT "id" FROM "SmsMessage"
          WHERE "state" = 'queued' AND "nextAttemptAt" <= (now() AT TIME ZONE 'UTC')
          ORDER BY "nextAttemptAt" ASC
          LIMIT ${limit}
            FOR UPDATE SKIP LOCKED)
   RETURNING "id","accountId","userId","purpose","ref","segments","state","toEncrypted","bodyEncrypted","attempts","expiresAt"`;
  }

  private wipe = { toEncrypted: null, bodyEncrypted: null, leaseUntil: null, claimedBy: null } as const;

  private async finish(m: Row, data: Prisma.SmsMessageUpdateManyMutationInput & { state: string }) {
    const r = await this.prisma.smsMessage.updateMany({
      where: { id: m.id, state: "dispatching", claimedBy: this.workerId },
      data: { ...this.wipe, ...data },
    });
    return r.count === 1;
  }

  private requeue(m: Row, delaySeconds: number, reason: string, costsAttempt: boolean) {
    return this.prisma.smsMessage.updateMany({
      where: { id: m.id, state: "dispatching", claimedBy: this.workerId },
      data: {
        state: "queued",
        nextAttemptAt: new Date(Date.now() + delaySeconds * 1000),
        leaseUntil: null,
        claimedBy: null,
        lastError: reason.slice(0, 200),
        ...(costsAttempt ? {} : { attempts: m.attempts }),
      },
    });
  }

  /** Claim and dispatch one message. Safe to call concurrently from any number of workers. */
  async dispatchById(id: string): Promise<string> {
    const m = await this.claim(id);
    if (!m) return "skipped";
    return this.processClaimed(m);
  }

  private async processClaimed(m: Row): Promise<string> {
    try {
      return await this.process(m);
    } catch (e) {
      // Nothing before the provider call can have sent anything; after it, process() has its own
      // handling. An unexpected throw leaves the lease to expire, which marks the message
      // `uncertain` (never retried) - the conservative outcome.
      this.log.error(`dispatch ${m.id} crashed: ${(e as Error)?.message}`);
      return "crashed";
    }
  }

  private async process(m: Row): Promise<string> {
    const cancel = async (reason: string) => {
      await this.finish(m, { state: "canceled", lastError: reason });
      return `canceled:${reason}`;
    };

    if (m.expiresAt && m.expiresAt.getTime() < Date.now()) return cancel("expired");

    // ---- dispatch-time authorization -------------------------------------------------
    let to: string;
    let body: string;
    try {
      to = vaultDecrypt(m.toEncrypted ?? "", ctx(m.id, "to"));
      body = vaultDecrypt(m.bodyEncrypted ?? "", ctx(m.id, "body"));
    } catch {
      await this.finish(m, { state: "failed", lastError: "payload unreadable" });
      return "failed:payload";
    }

    if (await this.prisma.smsSuppression.findUnique({ where: { phone: to } })) return cancel("opted_out");

    const guard = this.guards.get(m.purpose);
    if (guard) {
      const reason = await guard({ userId: m.userId, ref: m.ref });
      if (reason) return cancel(reason);
    }

    if (this.consent && !(await this.consent.hasConsent(to, m.purpose))) return cancel("no_consent");

    if (!dcg.liveSms()) {
      await this.requeue(m, 60, "sending paused (DCG_LIVE_SMS_ENABLED is off)", false);
      return "requeued:paused";
    }
    if (await this.control?.isStopped()) {
      await this.requeue(m, 60, "emergency stop engaged", false);
      return "requeued:emergency_stop";
    }

    const sender = await this.resolveSender();
    if (m.accountId) {
      const active = await this.prisma.twilioAccount.findFirst({ where: { status: "active" }, select: { id: true } });
      // The reservation belongs to one account. If a different one is active now, never silently
      // send through it; if none is, wait (the message expires if it stays that way).
      if (active && active.id !== m.accountId) return cancel("provider_account_changed");
      if (!active || !sender || sender.accountId !== m.accountId) {
        await this.requeue(m, 60, "provider account not active", false);
        return "requeued:no_active_account";
      }
    } else if (!sender) {
      await this.requeue(m, 60, "no provider configured", false);
      return "requeued:no_sender";
    }
    if (!sender.allowedPrefixes.some((p) => to.startsWith(p))) return cancel("destination_not_allowed");
    if (this.compliance && !(await this.compliance.isSenderApproved(sender.accountId, { id: sender.senderId, number: sender.from, messagingService: !!sender.messagingServiceSid }))) {
      return cancel("registration_not_approved");
    }

    // ---- the one place Twilio is called ----------------------------------------------
    const attempt = m.attempts + 1;
    await this.prisma.smsMessage.updateMany({ where: { id: m.id, claimedBy: this.workerId }, data: { attempts: attempt } });

    const params = new URLSearchParams({ To: to, Body: body });
    if (sender.messagingServiceSid) params.set("MessagingServiceSid", sender.messagingServiceSid);
    else params.set("From", sender.from!);
    const cbBase = (process.env.SMS_WEBHOOK_BASE_URL || process.env.API_URL || "").trim().replace(/\/$/, "");
    if (/^https:\/\/[^/]+$/.test(cbBase)) params.set("StatusCallback", `${cbBase}/api/sms/webhooks/status?mid=${m.id}`);

    let status: number | null = null;
    let sid: string | undefined;
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sender.creds.accountSid)}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: basicAuth(sender.creds),
          "Content-Type": "application/x-www-form-urlencoded",
          // Best-effort duplicate guard on Twilio's side; correctness does not depend on it.
          "I-Twilio-Idempotency-Token": m.id,
        },
        body: params,
        signal: AbortSignal.timeout(10_000),
      });
      status = res.status;
      if (res.ok) sid = ((await res.json().catch(() => ({}))) as { sid?: string }).sid;
    } catch (err) {
      this.log.error(`Twilio request outcome unknown for ${m.id}: ${(err as Error).message}`);
      status = null;
    }

    switch (classifyHttp(status)) {
      case "accepted": {
        const ok = await this.finish(m, { state: "accepted", providerSid: sid ?? null, lastError: null });
        if (!ok && sid) {
          // The lease was reclaimed while Twilio was answering (message marked uncertain). We now
          // KNOW it was accepted, so record that - it is the evidence that resolves it.
          await this.prisma.smsMessage.updateMany({ where: { id: m.id, state: "uncertain", providerSid: null }, data: { state: "accepted", providerSid: sid, lastError: null } });
        }
        return "accepted";
      }
      case "retry": {
        if (attempt >= MAX_DISPATCH_ATTEMPTS) {
          await this.finish(m, { state: "failed", lastError: "provider rate limit; attempts exhausted" });
          return "failed:rate_limited";
        }
        await this.requeue(m, retryDelaySeconds(attempt), "provider rate limit (HTTP 429)", true);
        return "requeued:rate_limited";
      }
      case "auth_failure": {
        await this.finish(m, { state: "failed", lastError: `provider rejected credentials (HTTP ${status})` });
        if (m.accountId) await this.accounts.suspendAutomatically(m.accountId, `Twilio rejected credentials (HTTP ${status})`);
        return "failed:auth";
      }
      case "failed": {
        await this.finish(m, { state: "failed", lastError: `provider rejected the request (HTTP ${status})` });
        return "failed:rejected";
      }
      default: {
        await this.finish(m, { state: "uncertain", lastError: status === null ? "no response from provider; outcome unknown" : `provider error (HTTP ${status}); outcome unknown` });
        return "uncertain";
      }
    }
  }

  // ------------------------------------------------------------------ recovery

  /**
   * Run periodically by every worker (it is idempotent and race-safe):
   *  1. a lease that expired mid-dispatch -> `uncertain` (the send may have happened; never retried)
   *  2. queued messages past their expiry -> `canceled`
   *  3. due queued messages -> dispatched directly, so delivery does not depend on pg-boss
   */
  async sweep(limit = 25): Promise<{ leasesExpired: number; expired: number; dispatched: number }> {
    const leases = await this.prisma.smsMessage.updateMany({
      where: { state: "dispatching", leaseUntil: { lt: new Date() } },
      data: { state: "uncertain", lastError: "worker lost while dispatching; outcome unknown", toEncrypted: null, bodyEncrypted: null, leaseUntil: null, claimedBy: null },
    });
    const expired = await this.prisma.smsMessage.updateMany({
      where: { state: "queued", expiresAt: { lt: new Date() } },
      data: { state: "canceled", lastError: "expired", toEncrypted: null, bodyEncrypted: null },
    });
    if (leases.count) {
      this.log.warn(`${leases.count} message(s) marked uncertain after a lost worker`);
      await this.audit.log({ action: "SMS_LEASE_EXPIRED", actorUserId: null, metadata: { count: leases.count } });
    }

    // Claim a batch atomically (no worker ever claims another's rows), then work through it in small parallel
    // chunks so no claimed row can wait long enough for its own lease to expire (10s provider timeout x chunks < 60s lease).
    const claimed = await this.claimDue(limit);
    let dispatched = 0;
    const CHUNK = 10;
    for (let i = 0; i < claimed.length; i += CHUNK) {
      const results = await Promise.all(claimed.slice(i, i + CHUNK).map((m) => this.processClaimed(m)));
      dispatched += results.length;
    }
    return { leasesExpired: leases.count, expired: expired.count, dispatched };
  }

  // ------------------------------------------------------------------ reconciliation (admin)

  /** Human resolution of an `uncertain` message, after checking with the provider. */
  async reconcile(id: string, outcome: "not_sent" | "sent", actor: { userId: string; ip?: string; userAgent?: string }) {
    const to = outcome === "sent" ? "sent" : "failed";
    const r = await this.prisma.smsMessage.updateMany({
      where: { id, state: "uncertain" },
      data: { state: to, lastError: outcome === "sent" ? "confirmed sent by admin" : "confirmed not sent by admin" },
    });
    if (r.count === 0) throw new HttpException("Only an uncertain message can be reconciled", HttpStatus.CONFLICT);
    await this.audit.log({ action: "SMS_MESSAGE_RECONCILED", actorUserId: actor.userId, ip: actor.ip ?? null, userAgent: actor.userAgent ?? null, metadata: { messageId: id, outcome } });
    return { id, state: to };
  }
}
