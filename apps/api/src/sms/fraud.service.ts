import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { SecurityAlertService } from "../common/security-alerts/security-alert.service";

const env = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

/** Configurable thresholds (DCG_FRAUD_*). Defaults are conservative starting points, not verified policy. */
export const fraudLimits = () => ({
  recipientPerHour: env("DCG_FRAUD_RECIPIENT_PER_HOUR", 5),
  ipPerHour: env("DCG_FRAUD_IP_PER_HOUR", 20),
  devicePerHour: env("DCG_FRAUD_DEVICE_PER_HOUR", 10),
  userPerHour: env("DCG_FRAUD_USER_PER_HOUR", 10),
  // SMS pumping: one source texting many different numbers
  distinctRecipientsPerIpPerHour: env("DCG_FRAUD_DISTINCT_RECIPIENTS_PER_IP", 6),
  distinctRecipientsPerDevicePerHour: env("DCG_FRAUD_DISTINCT_RECIPIENTS_PER_DEVICE", 4),
  // a number whose codes keep being guessed wrongly
  exhaustedChallengesPerRecipientPerDay: env("DCG_FRAUD_EXHAUSTED_PER_RECIPIENT", 3),
  observeScore: env("DCG_FRAUD_OBSERVE_SCORE", 70),
});

export type FraudDecision = {
  action: "allow" | "throttle" | "block";
  score: number;
  kind?: string;
  /** Seconds until the same request could succeed. Generic by design; never reveals which signal fired. */
  retryAfterSeconds?: number;
};

type Subject = { userId?: string | null; recipientHash: string; ipHash?: string | null; deviceHash?: string | null };

const HOUR = 3_600_000;

/**
 * Velocity and abuse controls for SMS-triggering flows (OTP today; any flow can call assess()).
 *
 * Everything is a TEMPORARY, window-based control. Nothing here suspends an account, and a shared
 * IP address alone never blocks anyone: an IP is one signal among several and only throttles for
 * the remainder of its window. Privacy: IPs and device ids are stored only as keyed hashes.
 *
 *  - throttle  a per-recipient/IP/device/user velocity limit was hit
 *  - block     a pattern consistent with SMS pumping or credential-guessing (many distinct
 *              recipients from one source, or a number whose challenges keep being exhausted)
 * Both create a reviewable SmsRiskEvent; a block also raises a (de-duplicated) security alert.
 */
@Injectable()
export class FraudService {
  private readonly log = new Logger(FraudService.name);

  constructor(private prisma: PrismaService, private alerts: SecurityAlertService) {}

  async assess(s: Subject): Promise<FraudDecision> {
    const L = fraudLimits();
    const since = new Date(Date.now() - HOUR);
    const count = (where: object) => this.prisma.otpChallenge.count({ where: { createdAt: { gte: since }, ...where } });

    const [rec, ip, dev, usr] = await Promise.all([
      count({ recipientHash: s.recipientHash }),
      s.ipHash ? count({ ipHash: s.ipHash }) : 0,
      s.deviceHash ? count({ deviceHash: s.deviceHash }) : 0,
      s.userId ? count({ userId: s.userId }) : 0,
    ]);

    const distinct = async (field: "ipHash" | "deviceHash", value?: string | null) => {
      if (!value) return 0;
      const rows = await this.prisma.otpChallenge.findMany({ where: { createdAt: { gte: since }, [field]: value }, select: { recipientHash: true }, distinct: ["recipientHash"] });
      // +1 if this request targets a recipient not already seen from this source
      return rows.length + (rows.some((r) => r.recipientHash === s.recipientHash) ? 0 : 1);
    };
    const [distinctIp, distinctDev] = await Promise.all([distinct("ipHash", s.ipHash), distinct("deviceHash", s.deviceHash)]);

    const exhausted = await this.prisma.otpChallenge.count({
      where: { recipientHash: s.recipientHash, consumedAt: null, createdAt: { gte: new Date(Date.now() - 24 * HOUR) }, attempts: { gte: 5 } },
    });

    const ratio = (n: number, limit: number) => Math.min(100, Math.round((n / limit) * 100));
    const velocity = [
      { kind: "recipient_velocity", score: ratio(rec + 1, L.recipientPerHour) },
      { kind: "ip_velocity", score: ratio(ip + 1, L.ipPerHour) },
      { kind: "device_velocity", score: ratio(dev + 1, L.devicePerHour) },
      { kind: "user_velocity", score: ratio(usr + 1, L.userPerHour) },
    ];
    const patterns = [
      { kind: "sms_pumping", hit: distinctIp > L.distinctRecipientsPerIpPerHour || distinctDev > L.distinctRecipientsPerDevicePerHour, score: 95 },
      { kind: "verification_failures", hit: exhausted >= L.exhaustedChallengesPerRecipientPerDay, score: 90 },
    ];

    const pattern = patterns.find((p) => p.hit);
    // A request that would be the (limit+1)th is the one that gets stopped: ratio(n+1)>100 isn't possible, so use > limit.
    const overLimit = velocity.find((v) => v.kind === "recipient_velocity" ? rec >= L.recipientPerHour : v.kind === "ip_velocity" ? ip >= L.ipPerHour : v.kind === "device_velocity" ? dev >= L.devicePerHour : usr >= L.userPerHour);

    let decision: FraudDecision;
    if (pattern) decision = { action: "block", score: pattern.score, kind: pattern.kind, retryAfterSeconds: 3600 };
    else if (overLimit) decision = { action: "throttle", score: 100, kind: overLimit.kind, retryAfterSeconds: 900 };
    else {
      const top = [...velocity].sort((a, b) => b.score - a.score)[0];
      decision = { action: "allow", score: top.score, kind: top.score >= L.observeScore ? top.kind : undefined };
    }

    if (decision.kind && (decision.action !== "allow" || decision.score >= L.observeScore)) {
      await this.record(decision, s);
    }
    return decision;
  }

  /** An OTP challenge ran out of attempts without success. */
  async recordVerificationFailure(s: Subject) {
    await this.record({ action: "allow", score: 60, kind: "verification_failures" }, s, "challenge_exhausted");
  }

  private async record(d: FraudDecision, s: Subject, note?: string) {
    try {
      // One open event per kind+subject in a 10-minute window: enough to review, not enough to flood.
      const dup = await this.prisma.smsRiskEvent.findFirst({
        where: { kind: d.kind!, subjectHash: s.recipientHash, status: "open", createdAt: { gte: new Date(Date.now() - 10 * 60_000) } },
        select: { id: true },
      });
      if (dup) return;
      await this.prisma.smsRiskEvent.create({
        data: {
          kind: d.kind!,
          score: d.score,
          severity: d.action === "block" ? "high" : d.action === "throttle" ? "medium" : "low",
          action: d.action === "allow" ? "observed" : d.action === "block" ? "blocked" : "throttled",
          userId: s.userId ?? null,
          subjectHash: s.recipientHash,
          ipHash: s.ipHash ?? null,
          details: note ? { note } : undefined,
        },
      });
      if (d.action === "block") {
        await this.alerts.raise("SMS_FRAUD_BLOCK", "high", `SMS abuse pattern blocked temporarily (${d.kind})`, { kind: d.kind, score: d.score });
      }
    } catch (e) {
      // Fraud logging must never take the verification flow down with it.
      this.log.warn(`risk event not recorded: ${(e as Error).message}`);
    }
  }

  // ---- authorized review ----
  async list(status?: string, limit = 100) {
    return this.prisma.smsRiskEvent.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 300),
      // masked: hashes are shortened, never the raw recipient/IP
      select: { id: true, kind: true, score: true, severity: true, action: true, userId: true, status: true, createdAt: true, reviewedAt: true, reviewedBy: true, subjectHash: true, ipHash: true },
    }).then((rows) => rows.map((r) => ({ ...r, subjectHash: r.subjectHash?.slice(0, 10) ?? null, ipHash: r.ipHash?.slice(0, 10) ?? null })));
  }

  async review(id: string, decision: "confirmed" | "dismissed", reviewerId: string) {
    const r = await this.prisma.smsRiskEvent.updateMany({
      where: { id, status: "open" },
      data: { status: decision, reviewedBy: reviewerId, reviewedAt: new Date() },
    });
    return { id, updated: r.count === 1 };
  }
}
