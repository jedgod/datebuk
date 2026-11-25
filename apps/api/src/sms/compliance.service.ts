import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";

export const COMPLIANCE_TYPES = ["A2P_10DLC_BRAND", "A2P_10DLC_CAMPAIGN", "TOLLFREE_VERIFICATION"] as const;
export type ComplianceType = (typeof COMPLIANCE_TYPES)[number];
export type ComplianceStatus = "pending" | "approved" | "rejected" | "suspended" | "expired";

/** pending -> approved|rejected; approved -> suspended|expired; suspended -> approved|expired; rejected/expired -> pending (resubmit). */
export const COMPLIANCE_TRANSITIONS: Record<ComplianceStatus, ComplianceStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["suspended", "expired"],
  suspended: ["approved", "expired"],
  rejected: ["pending"],
  expired: ["pending"],
};
export const canMoveCompliance = (from: ComplianceStatus, to: ComplianceStatus) => COMPLIANCE_TRANSITIONS[from]?.includes(to) ?? false;

const TOLL_FREE = /^\+1(800|833|844|855|866|877|888)/;

/** Which approved registrations a US sender needs before regulated traffic may use it. */
export function requiredTypesFor(sender: { number?: string | null; messagingService?: boolean }): ComplianceType[] {
  if (sender.number) {
    if (!sender.number.startsWith("+1")) return []; // US/Canada registration regimes only
    return TOLL_FREE_OR_10DLC(sender.number);
  }
  // Messaging Services carry A2P campaigns
  return sender.messagingService ? ["A2P_10DLC_BRAND", "A2P_10DLC_CAMPAIGN"] : [];
}
const TOLL_FREE_OR_10DLC = (n: string): ComplianceType[] => (TOLL_FREE.test(n) ? ["TOLLFREE_VERIFICATION"] : ["A2P_10DLC_BRAND", "A2P_10DLC_CAMPAIGN"]);

export const registrationRequired = () => {
  const v = (process.env.DCG_REQUIRE_REGISTRATION ?? "").trim().toLowerCase();
  return v ? v === "true" : process.env.NODE_ENV === "production";
};

type Actor = { userId: string; ip?: string; userAgent?: string };

/**
 * Records, and enforces, the carrier registrations that US A2P traffic needs.
 *
 * This service never decides that something is approved: an admin records what the provider or
 * carrier actually reported (approval requires an evidence reference). When registration is
 * required (always in production; DCG_REQUIRE_REGISTRATION overrides), a sender without every
 * required approval - non-expired and not suspended - cannot send.
 */
@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private log(a: Actor, action: string, metadata: Record<string, unknown>) {
    return this.audit.log({ action, actorUserId: a.userId, ip: a.ip ?? null, userAgent: a.userAgent ?? null, metadata });
  }

  async list(accountId?: string) {
    return this.prisma.complianceRegistration.findMany({ where: accountId ? { accountId } : {}, orderBy: { createdAt: "desc" }, take: 200 });
  }

  async create(
    input: { accountId: string; type: string; brandId?: string; campaignId?: string; senderId?: string; expiresAt?: string },
    actor: Actor,
  ) {
    if (!COMPLIANCE_TYPES.includes(input.type as ComplianceType)) throw new BadRequestException("Unknown registration type");
    if (!(await this.prisma.twilioAccount.findUnique({ where: { id: input.accountId }, select: { id: true } }))) throw new NotFoundException("Account not found");
    if (input.senderId && !(await this.prisma.twilioSender.findFirst({ where: { id: input.senderId, accountId: input.accountId }, select: { id: true } }))) {
      throw new BadRequestException("That sender doesn't belong to this account");
    }
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new BadRequestException("expiresAt is not a valid date");
    const clip = (v?: string) => (v ? v.trim().slice(0, 120) || null : null);
    const row = await this.prisma.complianceRegistration.create({
      data: {
        accountId: input.accountId,
        type: input.type,
        brandId: clip(input.brandId),
        campaignId: clip(input.campaignId),
        senderId: input.senderId ?? null,
        expiresAt,
        submittedAt: new Date(),
        createdBy: actor.userId,
      },
    });
    await this.log(actor, "SMS_COMPLIANCE_CREATED", { id: row.id, accountId: row.accountId, type: row.type });
    return row;
  }

  async setStatus(id: string, to: string, evidenceNote: string | undefined, actor: Actor) {
    const row = await this.prisma.complianceRegistration.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Registration not found");
    if (!["pending", "approved", "rejected", "suspended", "expired"].includes(to)) throw new BadRequestException("Unknown status");
    if (!canMoveCompliance(row.status as ComplianceStatus, to as ComplianceStatus)) {
      throw new ConflictException(`A ${row.status} registration cannot become ${to}`);
    }
    const note = (evidenceNote ?? "").trim();
    // Never approvable without a pointer to the real approval (provider ticket, SID, date...).
    if (to === "approved" && note.length < 5) throw new BadRequestException("Approval needs an evidence reference from the provider or carrier");
    const r = await this.prisma.complianceRegistration.updateMany({
      where: { id, status: row.status },
      data: { status: to, evidenceNote: note ? note.slice(0, 500) : row.evidenceNote, decidedAt: new Date(), decidedBy: actor.userId, ...(to === "pending" ? { submittedAt: new Date() } : {}) },
    });
    if (r.count === 0) throw new ConflictException("The registration changed while you were editing it");
    await this.log(actor, "SMS_COMPLIANCE_STATUS", { id, from: row.status, to });
    return this.prisma.complianceRegistration.findUniqueOrThrow({ where: { id } });
  }

  /** Does this sender hold every approval its traffic needs right now? (Always true when registration isn't required.) */
  async isSenderApproved(accountId: string | null, sender: { id?: string | null; number?: string | null; messagingService?: boolean }): Promise<boolean> {
    if (!registrationRequired()) return true;
    if (!accountId) return false; // environment-credential traffic has no recorded registrations
    const needed = requiredTypesFor(sender);
    if (needed.length === 0) return true;
    const now = new Date();
    const approved = await this.prisma.complianceRegistration.findMany({
      where: {
        accountId,
        status: "approved",
        type: { in: needed },
        OR: [{ senderId: null }, ...(sender.id ? [{ senderId: sender.id }] : [])],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      select: { type: true },
    });
    const have = new Set(approved.map((a) => a.type));
    return needed.every((t) => have.has(t));
  }

  /** Marks approvals whose expiry date has passed (run by the sweeper). */
  async expireDue() {
    const r = await this.prisma.complianceRegistration.updateMany({
      where: { status: "approved", expiresAt: { lt: new Date() } },
      data: { status: "expired", decidedAt: new Date(), decidedBy: null },
    });
    return r.count;
  }
}
