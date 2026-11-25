import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import {
  credentialContext,
  currentKeyVersion,
  vaultDecrypt,
  vaultEncrypt,
  vaultVersionOf,
} from "../common/security/credential-vault";
import { ownsMessagingService, ownsSmsNumber, validateCredentials, type TwilioRestCreds } from "./twilio-api";
import { dcg } from "./dcg-config";

export const ACCOUNT_SID = /^AC[0-9a-f]{32}$/i;
export const API_KEY_SID = /^SK[0-9a-f]{32}$/i;
const SERVICE_SID = /^MG[0-9a-f]{32}$/i;
const SENDER_E164 = /^\+[1-9]\d{1,14}$/;
const PREFIX = /^\+[1-9]\d{0,3}$/;

export type AccountStatus = "pending" | "verified" | "active" | "suspended" | "rotating" | "revoked";

type Actor = { userId: string; ip?: string; userAgent?: string };
export type NewCredentials = { authToken?: string; apiKeySid?: string; apiKeySecret?: string };

/** Allowed lifecycle moves. activate/rotate/revoke have extra preconditions in their methods. */
export const TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
  pending: ["verified", "revoked"],
  verified: ["active", "suspended", "rotating", "revoked"],
  active: ["suspended", "rotating", "revoked"],
  suspended: ["active", "verified", "rotating", "revoked"],
  rotating: ["verified", "active", "suspended"],
  revoked: [],
};
export const canTransition = (from: AccountStatus, to: AccountStatus) => TRANSITIONS[from]?.includes(to) ?? false;

const startOfUtcDay = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};
const startOfUtcMonth = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
};

type AccountRow = NonNullable<Awaited<ReturnType<PrismaService["twilioAccount"]["findUnique"]>>>;

@Injectable()
export class SmsAccountsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ---------- credentials ----------

  /** Credentials for REST calls (API key preferred when present). Never logged or returned. */
  restCredentials(a: AccountRow): TwilioRestCreds | null {
    if (a.status === "revoked") return null;
    if (a.apiKeySid && a.encryptedApiKeySecret) {
      return {
        accountSid: a.accountSid,
        apiKeySid: a.apiKeySid,
        secret: vaultDecrypt(a.encryptedApiKeySecret, credentialContext(a.id, "apiKeySecret")),
      };
    }
    if (a.encryptedAuthToken) {
      return { accountSid: a.accountSid, secret: vaultDecrypt(a.encryptedAuthToken, credentialContext(a.id, "authToken")) };
    }
    return null;
  }

  /** The Auth Token, which is what Twilio signs webhooks with (API keys can't verify them). */
  webhookToken(a: AccountRow): string | null {
    if (a.status === "revoked" || !a.encryptedAuthToken) return null;
    return vaultDecrypt(a.encryptedAuthToken, credentialContext(a.id, "authToken"));
  }

  async webhookTokenFor(accountSid: string): Promise<string | null> {
    const a = await this.prisma.twilioAccount.findUnique({ where: { accountSid } });
    return a ? this.webhookToken(a) : null;
  }

  /** Which of OUR accounts a signed callback claims to be from, plus the token that account signs with. */
  async webhookAuthFor(accountSid: string): Promise<{ accountId: string; token: string } | null> {
    const a = await this.prisma.twilioAccount.findUnique({ where: { accountSid } });
    const token = a ? this.webhookToken(a) : null;
    return a && token ? { accountId: a.id, token } : null;
  }

  private encryptFields(id: string, c: NewCredentials) {
    const out: { encryptedAuthToken?: string; apiKeySid?: string; encryptedApiKeySecret?: string } = {};
    if (c.authToken) out.encryptedAuthToken = vaultEncrypt(c.authToken, credentialContext(id, "authToken")).payload;
    if (c.apiKeySid && c.apiKeySecret) {
      out.apiKeySid = c.apiKeySid;
      out.encryptedApiKeySecret = vaultEncrypt(c.apiKeySecret, credentialContext(id, "apiKeySecret")).payload;
    }
    return out;
  }

  private validateInput(accountSid: string, c: NewCredentials) {
    if (!ACCOUNT_SID.test(accountSid)) throw new BadRequestException("accountSid must look like AC followed by 32 hex characters");
    const hasToken = !!c.authToken;
    const hasKey = !!c.apiKeySid || !!c.apiKeySecret;
    if (!hasToken && !hasKey) throw new BadRequestException("Provide an authToken, or an apiKeySid and apiKeySecret");
    if (hasToken && (c.authToken!.length < 20 || c.authToken!.length > 128)) throw new BadRequestException("authToken is invalid");
    if (hasKey) {
      if (!c.apiKeySid || !API_KEY_SID.test(c.apiKeySid)) throw new BadRequestException("apiKeySid must look like SK followed by 32 hex characters");
      if (!c.apiKeySecret || c.apiKeySecret.length < 20 || c.apiKeySecret.length > 128) throw new BadRequestException("apiKeySecret is invalid");
    }
  }

  private restFrom(accountSid: string, c: NewCredentials): TwilioRestCreds {
    return c.apiKeySid && c.apiKeySecret
      ? { accountSid, apiKeySid: c.apiKeySid, secret: c.apiKeySecret }
      : { accountSid, secret: c.authToken! };
  }

  private log(actor: Actor, action: string, metadata: Record<string, unknown>) {
    return this.audit.log({ action, actorUserId: actor.userId, ip: actor.ip ?? null, userAgent: actor.userAgent ?? null, metadata });
  }

  private async get(id: string): Promise<AccountRow> {
    const a = await this.prisma.twilioAccount.findUnique({ where: { id } });
    if (!a) throw new NotFoundException("Account not found");
    return a;
  }

  private async setStatus(a: AccountRow, to: AccountStatus, actor: Actor, reason?: string | null, action?: string) {
    if (!canTransition(a.status as AccountStatus, to)) {
      throw new ConflictException(`An account that is ${a.status} cannot become ${to}`);
    }
    // Optimistic: only moves if nobody changed the status since we read it.
    const r = await this.prisma.twilioAccount.updateMany({
      where: { id: a.id, status: a.status },
      data: { status: to, statusReason: reason ?? null },
    });
    if (r.count === 0) throw new ConflictException("The account changed while you were editing it; reload and retry");
    await this.log(actor, action ?? `SMS_ACCOUNT_${to.toUpperCase()}`, { accountId: a.id, from: a.status, to, reason: reason ?? null });
  }

  // ---------- lifecycle ----------

  async register(
    input: { name: string; accountSid: string } & NewCredentials,
    actor: Actor,
  ) {
    const name = (input.name ?? "").trim();
    if (!name || name.length > 80) throw new BadRequestException("name is required (max 80 characters)");
    const accountSid = (input.accountSid ?? "").trim();
    const creds: NewCredentials = {
      authToken: input.authToken?.trim() || undefined,
      apiKeySid: input.apiKeySid?.trim() || undefined,
      apiKeySecret: input.apiKeySecret?.trim() || undefined,
    };
    this.validateInput(accountSid, creds);
    if (await this.prisma.twilioAccount.findUnique({ where: { accountSid } })) {
      throw new ConflictException("This Twilio account is already registered");
    }
    if (!(await validateCredentials(this.restFrom(accountSid, creds)))) {
      throw new UnprocessableEntityException("Twilio rejected these credentials, or the account isn't active");
    }
    const id = randomUUID();
    const created = await this.prisma.twilioAccount.create({
      data: {
        id,
        name,
        accountSid,
        status: "verified",
        keyVersion: currentKeyVersion(),
        lastValidatedAt: new Date(),
        createdBy: actor.userId,
        ...this.encryptFields(id, creds),
      },
    });
    await this.log(actor, "SMS_ACCOUNT_REGISTERED", { accountId: id, accountSid, mode: creds.apiKeySid ? "api_key" : "auth_token", keyVersion: created.keyVersion });
    return this.view(created);
  }

  async validate(id: string, actor: Actor) {
    const a = await this.get(id);
    if (a.status === "revoked") throw new ConflictException("Revoked accounts can't be validated");
    const creds = this.restCredentials(a);
    const valid = !!creds && (await validateCredentials(creds));
    if (valid) {
      await this.prisma.twilioAccount.update({ where: { id }, data: { lastValidatedAt: new Date() } });
      if (a.status === "pending") await this.setStatus(a, "verified", actor);
    }
    await this.log(actor, "SMS_ACCOUNT_VALIDATED", { accountId: id, valid });
    return { id, valid };
  }

  async activate(id: string, actor: Actor) {
    const a = await this.get(id);
    if (a.status === "active") return this.view(a);
    if (!["verified", "suspended"].includes(a.status)) throw new ConflictException(`A ${a.status} account can't be activated`);

    const enabledSenders = await this.prisma.twilioSender.count({ where: { accountId: id, enabled: true } });
    if (enabledSenders === 0) throw new ConflictException("Register at least one sender before activating");

    // Re-validate live: a suspended account may have been suspended precisely because its credentials failed.
    const creds = this.restCredentials(a);
    if (!creds || !(await validateCredentials(creds))) {
      throw new UnprocessableEntityException("Twilio rejected this account's credentials. Rotate them, then activate.");
    }

    // One active account only. Switching providers is an explicit decision, never an automatic one.
    const other = await this.prisma.twilioAccount.findFirst({ where: { status: "active", NOT: { id } } });
    if (other) throw new ConflictException(`"${other.name}" is already active. Suspend it first; accounts are never switched automatically.`);

    try {
      await this.setStatus(a, "active", actor, null);
    } catch (e: any) {
      if (e?.code === "P2002") throw new ConflictException("Another account became active first");
      throw e;
    }
    await this.prisma.twilioAccount.update({ where: { id }, data: { lastValidatedAt: new Date() } });
    return this.view(await this.get(id));
  }

  async suspend(id: string, reason: string | undefined, actor: Actor) {
    const a = await this.get(id);
    await this.setStatus(a, "suspended", actor, (reason ?? "suspended by admin").slice(0, 200));
    return this.view(await this.get(id));
  }

  /** Automatic suspension (e.g. Twilio rejected our credentials). Never promotes another account. */
  async suspendAutomatically(id: string, reason: string) {
    const r = await this.prisma.twilioAccount.updateMany({
      where: { id, status: { in: ["active", "verified"] } },
      data: { status: "suspended", statusReason: reason.slice(0, 200) },
    });
    if (r.count) {
      await this.audit.log({ action: "SMS_ACCOUNT_SUSPENDED_AUTO", actorUserId: null, metadata: { accountId: id, reason } });
    }
  }

  async revoke(id: string, actor: Actor) {
    const a = await this.get(id);
    if (!canTransition(a.status as AccountStatus, "revoked")) throw new ConflictException("Already revoked");
    await this.prisma.$transaction([
      this.prisma.twilioAccount.update({
        where: { id },
        data: {
          status: "revoked",
          statusReason: "revoked by admin",
          // Secrets are wiped: revocation is final, and a copy of the database later should not
          // contain a credential we've declared dead.
          encryptedAuthToken: null,
          apiKeySid: null,
          encryptedApiKeySecret: null,
        },
      }),
      this.prisma.twilioSender.updateMany({ where: { accountId: id }, data: { enabled: false } }),
    ]);
    await this.log(actor, "SMS_ACCOUNT_REVOKED", { accountId: id, from: a.status });
    return this.view(await this.get(id));
  }

  /**
   * Replace credentials. The replacement is validated against Twilio BEFORE anything is
   * overwritten; if it fails, the existing credentials and status are untouched.
   */
  async rotate(id: string, next: NewCredentials, actor: Actor) {
    const a = await this.get(id);
    const prev = a.status as AccountStatus;
    if (!canTransition(prev, "rotating")) throw new ConflictException(`A ${prev} account can't be rotated`);
    const creds: NewCredentials = {
      authToken: next.authToken?.trim() || undefined,
      apiKeySid: next.apiKeySid?.trim() || undefined,
      apiKeySecret: next.apiKeySecret?.trim() || undefined,
    };
    this.validateInput(a.accountSid, creds);

    // Sends are blocked while rotating (only 'active' accounts send).
    const claimed = await this.prisma.twilioAccount.updateMany({ where: { id, status: prev }, data: { status: "rotating" } });
    if (claimed.count === 0) throw new ConflictException("The account changed while you were editing it; reload and retry");

    const restore = (status: AccountStatus) =>
      this.prisma.twilioAccount.updateMany({ where: { id, status: "rotating" }, data: { status } });

    // Verify against the credential that will be used for REST. If only an Auth Token is being
    // replaced on an API-key account, the stored key is still what sends, so validate both.
    const restCreds = this.restFrom(a.accountSid, creds.apiKeySid ? creds : { authToken: creds.authToken });
    let ok = false;
    try {
      ok = await validateCredentials(restCreds);
    } catch {
      ok = false;
    }
    if (!ok) {
      await restore(prev);
      await this.log(actor, "SMS_ACCOUNT_ROTATION_REJECTED", { accountId: id });
      throw new UnprocessableEntityException("Twilio rejected the replacement credentials; nothing was changed");
    }

    try {
      await this.prisma.twilioAccount.update({
        where: { id },
        data: {
          ...this.encryptFields(id, creds),
          keyVersion: currentKeyVersion(),
          rotatedAt: new Date(),
          lastValidatedAt: new Date(),
          // A rotation never activates an account on its own: it returns to where it was.
          status: prev,
        },
      });
    } catch (e) {
      await restore(prev);
      throw e;
    }
    await this.log(actor, "SMS_ACCOUNT_ROTATED", {
      accountId: id,
      replaced: [creds.authToken && "authToken", creds.apiKeySid && "apiKey"].filter(Boolean),
      keyVersion: currentKeyVersion(),
    });
    return this.view(await this.get(id));
  }

  /**
   * Re-encrypt every stored credential under the CURRENT vault key. Each value is decrypted,
   * re-encrypted, and decrypted again to prove the round trip before the row is written; a row
   * that fails verification is left exactly as it was. Does not touch TOTP data. Retire an old
   * key only after `remainingKeyVersions` contains nothing but the current version.
   */
  async migrate(dryRun: boolean, actor: Actor) {
    const accounts = await this.prisma.twilioAccount.findMany({ where: { status: { not: "revoked" } } });
    const target = currentKeyVersion();
    const report = { dryRun, targetVersion: target, total: accounts.length, migrated: 0, alreadyCurrent: 0, failed: [] as { accountId: string; error: string }[] };

    for (const a of accounts) {
      try {
        const updates: Record<string, string> = {};
        const fields: Array<["encryptedAuthToken" | "encryptedApiKeySecret", "authToken" | "apiKeySecret"]> = [
          ["encryptedAuthToken", "authToken"],
          ["encryptedApiKeySecret", "apiKeySecret"],
        ];
        for (const [col, field] of fields) {
          const payload = a[col];
          if (!payload || vaultVersionOf(payload) === target) continue;
          const plain = vaultDecrypt(payload, credentialContext(a.id, field));
          const re = vaultEncrypt(plain, credentialContext(a.id, field));
          if (vaultDecrypt(re.payload, credentialContext(a.id, field)) !== plain) throw new Error("round-trip verification failed");
          updates[col] = re.payload;
        }
        if (Object.keys(updates).length === 0) {
          report.alreadyCurrent++;
          continue;
        }
        if (!dryRun) {
          await this.prisma.twilioAccount.update({ where: { id: a.id }, data: { ...updates, keyVersion: target } });
        }
        report.migrated++;
      } catch (e) {
        report.failed.push({ accountId: a.id, error: (e as Error).message });
      }
    }

    const remaining = await this.prisma.twilioAccount.groupBy({ by: ["keyVersion"], _count: { _all: true }, where: { status: { not: "revoked" } } });
    await this.log(actor, dryRun ? "SMS_CREDENTIAL_MIGRATION_DRYRUN" : "SMS_CREDENTIAL_MIGRATION", {
      migrated: report.migrated,
      failed: report.failed.length,
      targetVersion: target,
    });
    return { ...report, remainingKeyVersions: remaining.map((r) => ({ version: r.keyVersion, accounts: r._count._all })) };
  }

  async setSpending(
    id: string,
    input: { dailySegmentLimit?: number | null; monthlySegmentLimit?: number | null; allowedPrefixes?: string[] },
    actor: Actor,
  ) {
    await this.get(id);
    const lim = (v: unknown, name: string) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      if (!Number.isInteger(v) || (v as number) < 1 || (v as number) > 10_000_000) throw new BadRequestException(`${name} must be a whole number >= 1, or null for no cap`);
      return v as number;
    };
    const data: Record<string, unknown> = {};
    const d = lim(input.dailySegmentLimit, "dailySegmentLimit");
    const m = lim(input.monthlySegmentLimit, "monthlySegmentLimit");
    if (d !== undefined) data.dailySegmentLimit = d;
    if (m !== undefined) data.monthlySegmentLimit = m;
    if (input.allowedPrefixes !== undefined) {
      if (!Array.isArray(input.allowedPrefixes) || input.allowedPrefixes.length === 0 || !input.allowedPrefixes.every((p) => PREFIX.test(p))) {
        throw new BadRequestException("allowedPrefixes must be a non-empty list of country prefixes like +1");
      }
      data.allowedPrefixes = input.allowedPrefixes;
    }
    if (Object.keys(data).length === 0) throw new BadRequestException("Nothing to update");
    const updated = await this.prisma.twilioAccount.update({ where: { id }, data });
    await this.log(actor, "SMS_ACCOUNT_SPENDING_UPDATED", { accountId: id, ...data });
    return this.view(updated);
  }

  // ---------- senders ----------

  async registerSender(input: { accountId: string; number?: string; messagingServiceSid?: string }, actor: Actor) {
    const number = input.number?.trim() || undefined;
    const service = input.messagingServiceSid?.trim() || undefined;
    if (!!number === !!service) throw new BadRequestException("Provide exactly one of number or messagingServiceSid");
    if (number && !SENDER_E164.test(number)) throw new BadRequestException("number must be E.164, e.g. +14155550123");
    if (service && !SERVICE_SID.test(service)) throw new BadRequestException("messagingServiceSid must look like MG followed by 32 hex characters");
    const a = await this.get(input.accountId);
    const creds = this.restCredentials(a);
    if (!creds) throw new ConflictException("This account has no usable credentials");

    const owned = number ? await ownsSmsNumber(creds, number) : await ownsMessagingService(creds, service!);
    if (!owned) {
      throw new UnprocessableEntityException(number ? "That number isn't an SMS-capable number on this Twilio account" : "That Messaging Service doesn't belong to this Twilio account");
    }
    const sender = await this.prisma.twilioSender.create({
      data: { accountId: a.id, senderNumber: number ?? null, messagingServiceSid: service ?? null },
      select: { id: true, senderNumber: true, messagingServiceSid: true, enabled: true },
    });
    await this.log(actor, "SMS_SENDER_REGISTERED", { senderId: sender.id, accountId: a.id, kind: number ? "number" : "messaging_service" });
    return sender;
  }

  async disableSender(id: string, actor: Actor) {
    const r = await this.prisma.twilioSender.updateMany({ where: { id }, data: { enabled: false } });
    if (r.count === 0) throw new NotFoundException();
    await this.log(actor, "SMS_SENDER_DISABLED", { senderId: id });
    return { id, enabled: false };
  }

  // ---------- read models for the dashboards ----------

  /** Never includes any credential material. */
  view(a: AccountRow) {
    return {
      id: a.id,
      name: a.name,
      accountSid: a.accountSid,
      status: a.status,
      statusReason: a.statusReason,
      authMode: a.apiKeySid ? "api_key" : "auth_token",
      hasAuthToken: !!a.encryptedAuthToken,
      keyVersion: a.keyVersion,
      lastValidatedAt: a.lastValidatedAt,
      rotatedAt: a.rotatedAt,
      dailySegmentLimit: a.dailySegmentLimit,
      monthlySegmentLimit: a.monthlySegmentLimit,
      allowedPrefixes: a.allowedPrefixes,
      createdAt: a.createdAt,
    };
  }

  async list() {
    const accounts = await this.prisma.twilioAccount.findMany({
      orderBy: { createdAt: "asc" },
      include: { senders: { select: { id: true, senderNumber: true, messagingServiceSid: true, enabled: true } } },
    });
    const [day, month] = [startOfUtcDay(), startOfUtcMonth()];
    const sum = async (accountId: string, since: Date) =>
      (await this.prisma.smsMessage.aggregate({ _sum: { segments: true }, where: { accountId, createdAt: { gte: since }, state: { notIn: ["failed", "canceled"] } } }))._sum.segments ?? 0;
    return Promise.all(
      accounts.map(async (a) => ({
        ...this.view(a),
        senders: a.senders,
        usage: { segmentsToday: await sum(a.id, day), segmentsThisMonth: await sum(a.id, month) },
      })),
    );
  }

  async history(opts: { state?: string; limit?: number; before?: string; needsReview?: boolean }) {
    const take = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const rows = await this.prisma.smsMessage.findMany({
      where: {
        ...(opts.state ? { state: opts.state } : {}),
        ...(opts.needsReview ? { needsReview: true } : {}),
        ...(opts.before && !Number.isNaN(Date.parse(opts.before)) ? { createdAt: { lt: new Date(opts.before) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, createdAt: true, purpose: true, recipientLast4: true, state: true, segments: true, accountId: true, providerSid: true, needsReview: true, lastError: true },
    });
    return { items: rows, nextBefore: rows.length === take ? rows[rows.length - 1].createdAt.toISOString() : null };
  }

  async analytics(days = 7) {
    const since = new Date(Date.now() - Math.min(Math.max(days, 1), 90) * 86_400_000);
    const rows = await this.prisma.smsMessage.findMany({ where: { createdAt: { gte: since } }, select: { state: true, segments: true, createdAt: true, purpose: true } });
    const byState: Record<string, number> = {};
    const byPurpose: Record<string, number> = {};
    const perDay: Record<string, { messages: number; segments: number }> = {};
    for (const r of rows) {
      byState[r.state] = (byState[r.state] ?? 0) + 1;
      byPurpose[r.purpose] = (byPurpose[r.purpose] ?? 0) + 1;
      const k = r.createdAt.toISOString().slice(0, 10);
      perDay[k] ??= { messages: 0, segments: 0 };
      perDay[k].messages++;
      perDay[k].segments += r.segments;
    }
    const delivered = byState.delivered ?? 0;
    const terminal = delivered + (byState.undelivered ?? 0) + (byState.failed ?? 0);
    return {
      days,
      total: rows.length,
      segments: rows.reduce((s, r) => s + r.segments, 0),
      byState,
      byPurpose,
      perDay: Object.entries(perDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v })),
      deliveryRate: terminal ? Math.round((delivered / terminal) * 1000) / 10 : null,
      // Outcomes we can't resolve without a human: never auto-retried (the provider may have accepted them).
      needsReconciliation: byState.uncertain ?? 0,
    };
  }

  async auditTrail(limit = 100) {
    const rows = await this.prisma.auditLog.findMany({
      where: { OR: [{ action: { startsWith: "SMS_" } }, { action: { startsWith: "STEP_UP" } }] },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 300),
      select: { id: true, action: true, actorUserId: true, metadata: true, createdAt: true, ip: true },
    });
    return { items: rows };
  }

  webhookConfig() {
    const base = (process.env.SMS_WEBHOOK_BASE_URL || process.env.API_URL || "").trim().replace(/\/$/, "");
    const https = /^https:\/\/[^/]+$/.test(base);
    return {
      baseUrl: base || null,
      httpsOk: https,
      statusUrl: base ? `${base}/api/sms/webhooks/status` : null,
      inboundUrl: base ? `${base}/api/sms/webhooks/inbound` : null,
      signatureRequired: dcg.signatureRequired(),
      flags: { enabled: dcg.enabled(), liveSms: dcg.liveSms(), envFallback: dcg.envFallback() },
      note: https
        ? "Set the status callback and inbound URLs above on the Twilio Messaging Service / number."
        : "Twilio only delivers to a public https URL. Set SMS_WEBHOOK_BASE_URL to your public API origin.",
    };
  }
}
