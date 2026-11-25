import { createHash } from "crypto";
import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { SubscriptionsService } from "./subscriptions.service";
import {
  LIMITS,
  PRICES_CENTS,
  SAFETY_FEATURES,
  decide,
  denialMessage,
  isKnownFeature,
  limitFor,
  toPlan,
  type DecideInput,
  type DenyReason,
  type Plan,
} from "./feature-policy";

export interface RelationshipContext {
  matched?: boolean;
  blocked?: boolean;
  consent?: boolean;
}

export type ConsumeResult<T> =
  | { allowed: true; plan: Plan; replayed: boolean; remaining: number | null; result?: T }
  | { allowed: false; plan: Plan; reason: DenyReason };

function canonical(x: unknown): string {
  if (Array.isArray(x)) return "[" + x.map(canonical).join(",") + "]";
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canonical(o[k])).join(",") + "}";
  }
  return JSON.stringify(x) ?? "null";
}

const utcDay = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};

/**
 * Per-feature access + daily quota enforcement (ported from the DSACS pack's consume()).
 *
 * Guarantees, all inside one database transaction serialized per user:
 *  - the plan comes from SubscriptionsService.getAccessTier (single authority),
 *  - suspended accounts and admin-disabled features are denied,
 *  - quota is consumed atomically (never exceeds the limit under concurrency),
 *  - a repeated requestId replays the stored result without consuming again, and reusing a
 *    requestId with a different payload is rejected,
 *  - if `work` throws, the quota consumption rolls back with it.
 *
 * Relationship context (matched / blocked / consent) must be derived by the server from
 * trusted data - never from the request body.
 */
@Injectable()
export class FeatureAccessService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
  ) {}

  private async accountFlags(db: Prisma.TransactionClient | PrismaService, userId: string, feature: string) {
    const [user, disabled] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { accountStatus: true } }),
      db.disabledFeature.findUnique({ where: { feature } }),
    ]);
    return {
      suspended: user?.accountStatus === "SUSPENDED" || user?.accountStatus === "REVOKED",
      disabled: !!disabled,
    };
  }

  /** Read-only evaluation (no quota consumed). */
  async check(userId: string, feature: string, ctx: RelationshipContext = {}) {
    const plan = toPlan(await this.subscriptions.getAccessTier(userId));
    const flags = await this.accountFlags(this.prisma, userId, feature);
    const reason = this.decideFor({ plan, feature, ...flags, ...ctx });
    const limit = limitFor(plan, feature);
    let used = 0;
    if (limit > 0) {
      const row = await this.prisma.featureUsage.findUnique({
        where: { userId_feature_day: { userId, feature, day: utcDay() } },
      });
      used = row?.count ?? 0;
    }
    if (reason === "ACCESS_GRANTED" && limit > 0 && used >= limit) {
      return { allowed: false as const, plan, reason: "QUOTA_EXHAUSTED" as DenyReason, limit, used };
    }
    return reason === "ACCESS_GRANTED"
      ? { allowed: true as const, plan, limit, used }
      : { allowed: false as const, plan, reason, limit, used };
  }

  private decideFor(i: DecideInput) {
    // Unknown feature names fail closed rather than being treated as free.
    if (!isKnownFeature(i.feature)) return "UPGRADE_REQUIRED" as const;
    return decide(i);
  }

  async consume<T = unknown>(
    userId: string,
    feature: string,
    opts: { requestId?: string; payload?: unknown; context?: RelationshipContext } = {},
    work?: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<ConsumeResult<T>> {
    const plan = toPlan(await this.subscriptions.getAccessTier(userId));
    const limit = limitFor(plan, feature);
    const digest = createHash("sha256").update(canonical({ feature, payload: opts.payload ?? null })).digest("hex");

    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;

        const flags = await this.accountFlags(tx, userId, feature);
        const reason = this.decideFor({ plan, feature, ...flags, ...opts.context });
        if (reason !== "ACCESS_GRANTED") return { allowed: false as const, plan, reason };

        if (opts.requestId) {
          const prior = await tx.featureOperation.findUnique({
            where: { userId_requestId: { userId, requestId: opts.requestId } },
          });
          if (prior) {
            if (prior.payloadHash !== digest) {
              throw new ConflictException("requestId was already used for a different request");
            }
            return { allowed: true as const, plan, replayed: true, remaining: null, result: prior.result as T };
          }
        }

        let remaining: number | null = null;
        if (limit > 0 && !SAFETY_FEATURES.includes(feature)) {
          const day = utcDay();
          // Pass the date as text and cast in SQL: binding a JS Date to a DATE column goes via
          // timestamptz and can land on the neighbouring day depending on the server timezone.
          const dayText = day.toISOString().slice(0, 10);
          const rows = await tx.$executeRaw`
            INSERT INTO "FeatureUsage" ("userId","feature","day","count")
            VALUES (${userId}, ${feature}, ${dayText}::date, 1)
            ON CONFLICT ("userId","feature","day")
            DO UPDATE SET "count" = "FeatureUsage"."count" + 1
            WHERE "FeatureUsage"."count" < ${limit}`;
          if (rows === 0) return { allowed: false as const, plan, reason: "QUOTA_EXHAUSTED" as DenyReason };
          const used = (
            await tx.featureUsage.findUniqueOrThrow({ where: { userId_feature_day: { userId, feature, day } } })
          ).count;
          remaining = Math.max(0, limit - used);
        }

        const result = work ? await work(tx) : undefined;

        if (opts.requestId) {
          await tx.featureOperation.create({
            data: {
              userId,
              requestId: opts.requestId,
              feature,
              payloadHash: digest,
              result: (result ?? {}) as Prisma.InputJsonValue,
            },
          });
        }
        return { allowed: true as const, plan, replayed: false, remaining, result };
      },
      { timeout: 15_000 },
    );
  }

  /** Throws 403 with a user-facing message when access isn't granted (consumes quota when granted). */
  async require(userId: string, feature: string, opts: Parameters<FeatureAccessService["consume"]>[2] = {}) {
    const r = await this.consume(userId, feature, opts);
    if ("reason" in r) {
      throw new ForbiddenException({ message: denialMessage(r.reason, feature), reason: r.reason, feature, plan: r.plan });
    }
    return r;
  }

  /** The signed-in user's plan, and what it allows today (for the Subscription page). */
  async usage(userId: string) {
    const plan = toPlan(await this.subscriptions.getAccessTier(userId));
    const day = utcDay();
    const [rows, disabled] = await Promise.all([
      this.prisma.featureUsage.findMany({ where: { userId, day } }),
      this.prisma.disabledFeature.findMany(),
    ]);
    const used = new Map(rows.map((r) => [r.feature, r.count]));
    const off = new Set(disabled.map((d) => d.feature));
    return {
      plan,
      priceCents: PRICES_CENTS[plan],
      resetsAt: new Date(day.getTime() + 24 * 3600 * 1000).toISOString(),
      features: Object.keys(LIMITS).map((feature) => {
        const limit = limitFor(plan, feature);
        const u = used.get(feature) ?? 0;
        return {
          feature,
          included: limit !== 0,
          unlimited: limit < 0,
          limit: limit > 0 ? limit : null,
          used: limit > 0 ? u : null,
          remaining: limit > 0 ? Math.max(0, limit - u) : null,
          disabled: off.has(feature),
        };
      }),
    };
  }
}
