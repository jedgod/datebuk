import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConciergeResponseType, ConciergeServiceType, Prisma, ViolationTypeEnum } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { moderateConciergeText } from "./concierge.policy";

const CATALOG = [
  [ConciergeServiceType.CONCIERGE_OUTREACH_PACKAGE, "Match Concierge", "Two respectful, staff-reviewed introductions.", 2000, 2, 48],
  [ConciergeServiceType.PROFILE_REVIEW, "Profile Review", "Structured feedback on profile clarity, tone, and completeness.", 1000, null, 72],
  [ConciergeServiceType.PROFILE_OPTIMIZATION, "Profile Optimization", "Staff-assisted biography and prompt refinement.", 1500, null, 96],
  [ConciergeServiceType.PHOTO_REVIEW, "Photo Review", "Recommendations on photo order, quality, variety, and presentation.", 1000, null, 72],
  [ConciergeServiceType.BACKGROUND_CHECK_REQUEST, "Background Check Request", "Consent-based verification intake through an approved provider.", 2500, null, 120],
  [ConciergeServiceType.DATE_PLANNING, "Date Planning Assistance", "A practical plan based on location, interests, accessibility, and budget.", 2000, null, 72],
  [ConciergeServiceType.RELATIONSHIP_COACHING, "Relationship Coaching", "Private guidance on communication, expectations, and boundaries; not therapy.", 3000, null, 168],
  [ConciergeServiceType.PRIORITY_SUPPORT, "Priority Support", "Expedited help for eligible account and subscription issues.", 500, null, 12],
] as const;

@Injectable()
export class ConciergeService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
    private audit: AuditService,
  ) {}

  private async requirePaidTier(userId: string) {
    const tier = await this.subscriptions.getAccessTier(userId);
    if (tier === "FREE") throw new ForbiddenException("Concierge requires Premium or Elite");
    return tier;
  }

  private async requireStaff(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, role: true } });
    if (!user || (!user.isAdmin && !["SUPPORT", "SUPERADMIN"].includes(user.role))) {
      throw new ForbiddenException("Staff access required");
    }
    return user;
  }

  private async ensureCatalog() {
    await Promise.all(CATALOG.map(([type, name, description, priceCents, includedUnits, turnaroundHours], index) =>
      this.prisma.conciergeServiceCatalog.upsert({
        where: { type },
        update: {},
        create: {
          type,
          name,
          shortDescription: description,
          fullDescription: description,
          priceCents,
          includedUnits,
          turnaroundHours,
          sortOrder: index + 1,
          freeEligible: false,
          premiumEligible: true,
          eliteEligible: true,
        },
      }),
    ));
  }

  async catalog(userId: string) {
    const tier = await this.subscriptions.getAccessTier(userId);
    await this.ensureCatalog();
    const services = await this.prisma.conciergeServiceCatalog.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
    return { tier, eligible: tier !== "FREE", services };
  }

  async overview(userId: string) {
    const tier = await this.subscriptions.getAccessTier(userId);
    const wallet = await this.prisma.conciergeWallet.upsert({ where: { userId }, update: {}, create: { userId } });
    const requests = await this.prisma.conciergeRequest.findMany({
      where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
      include: {
        requester: { select: { id: true, displayName: true, fullName: true } },
        recipient: { select: { id: true, displayName: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { viewerId: userId, tier, wallet, requests };
  }

  async eligibility(requesterId: string, recipientId: string) {
    const tier = await this.requirePaidTier(requesterId);
    if (requesterId === recipientId) return { allowed: false, code: "SELF_REQUEST", tier };
    const [requester, recipient, wallet, blocked, report] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: requesterId }, select: { accountStatus: true, deletedAt: true } }),
      this.prisma.user.findUnique({ where: { id: recipientId }, select: { conciergeOptOut: true, accountStatus: true, deletedAt: true } }),
      this.prisma.conciergeWallet.findUnique({ where: { userId: requesterId } }),
      this.prisma.conciergeBlock.findFirst({ where: { OR: [{ blockerId: requesterId, blockedId: recipientId }, { blockerId: recipientId, blockedId: requesterId }] } }),
      this.prisma.report.findFirst({ where: { handledAt: null, OR: [{ reporterId: requesterId, reportedId: recipientId }, { reporterId: recipientId, reportedId: requesterId }] } }),
    ]);
    if (!requester || !recipient) return { allowed: false, code: "USER_NOT_FOUND", tier };
    if (requester.deletedAt || recipient.deletedAt || requester.accountStatus === "SUSPENDED" || recipient.accountStatus === "SUSPENDED") return { allowed: false, code: "SUSPENDED_ACCOUNT", tier };
    if (recipient.conciergeOptOut) return { allowed: false, code: "RECIPIENT_OPTED_OUT", tier };
    if (blocked) return { allowed: false, code: "BLOCKED_RELATIONSHIP", tier };
    if (report) return { allowed: false, code: "SAFETY_REVIEW_REQUIRED", tier };
    if (!wallet || wallet.availableCredits < 1) return { allowed: false, code: "NO_CREDITS", tier };

    const cooldownStart = new Date(Date.now() - Number(process.env.CONCIERGE_COOLDOWN_DAYS || 30) * 86_400_000);
    const recent = await this.prisma.conciergeRequest.findFirst({
      where: { requesterId, recipientId, createdAt: { gte: cooldownStart }, status: { notIn: ["REJECTED", "CANCELLED"] } },
    });
    if (recent) return { allowed: false, code: "PAIR_COOLDOWN_ACTIVE", tier };

    const monthStart = new Date();
    monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
    const monthlyUsed = await this.prisma.conciergeRequest.count({ where: { requesterId, createdAt: { gte: monthStart }, status: { not: "CANCELLED" } } });
    const monthlyLimit = tier === "ELITE" ? Number(process.env.CONCIERGE_MONTHLY_LIMIT_ELITE || 20) : Number(process.env.CONCIERGE_MONTHLY_LIMIT_PREMIUM || 10);
    if (monthlyUsed >= monthlyLimit) return { allowed: false, code: "MONTHLY_LIMIT_REACHED", tier, monthlyUsed, monthlyLimit };
    return { allowed: true, code: "ELIGIBLE", tier, walletCredits: wallet.availableCredits, monthlyUsed, monthlyLimit };
  }

  async createRequest(userId: string, input: { recipientId: string; reason: string; requesterMessage: string }) {
    const reason = String(input.reason || "").trim();
    const requesterMessage = String(input.requesterMessage || "").trim();
    if (!input.recipientId || reason.length < 10 || requesterMessage.length < 10) throw new BadRequestException("Recipient, reason, and respectful message are required");
    if (reason.length > 600 || requesterMessage.length > 1000) throw new BadRequestException("Concierge request is too long");
    const moderation = moderateConciergeText(`${reason}\n${requesterMessage}`);
    if (!moderation.allowed) throw new BadRequestException({ message: "Message contains prohibited contact or coercive content", matchedRules: moderation.matchedRules });
    const eligible = await this.eligibility(userId, input.recipientId);
    if (!eligible.allowed) throw new ForbiddenException(eligible.code);

    const expiresAt = new Date(Date.now() + Number(process.env.CONCIERGE_REQUEST_EXPIRY_DAYS || 7) * 86_400_000);
    const request = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.conciergeWallet.updateMany({ where: { userId, availableCredits: { gt: 0 } }, data: { availableCredits: { decrement: 1 }, lifetimeUsed: { increment: 1 } } });
      if (consumed.count !== 1) throw new ForbiddenException("NO_CREDITS");
      return tx.conciergeRequest.create({ data: { requesterId: userId, recipientId: input.recipientId, reason, requesterMessage, expiresAt } });
    });
    await this.audit.log({ action: "CONCIERGE_REQUEST_CREATED", actorUserId: userId, targetUserId: input.recipientId, metadata: { requestId: request.id, moderation: moderation.decision } });
    return request;
  }

  async respond(userId: string, requestId: string, input: { response: ConciergeResponseType; message?: string }) {
    const request = await this.prisma.conciergeRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Concierge request not found");
    if (request.recipientId !== userId) throw new ForbiddenException("Only the recipient can respond");
    if (request.status !== "OUTREACH_SENT") throw new BadRequestException("Request is not awaiting a response");
    const response = input.response;
    if (!Object.values(ConciergeResponseType).includes(response)) throw new BadRequestException("Unsupported response");
    const message = String(input.message || "").trim().slice(0, 1000) || null;
    const status = ["INTERESTED", "REPLY_NOW"].includes(response) ? "RECIPIENT_INTERESTED" : response === "MAYBE_LATER" ? "OUTREACH_SENT" : "RECIPIENT_DECLINED";
    await this.prisma.$transaction(async (tx) => {
      await tx.conciergeRequest.update({ where: { id: requestId }, data: { recipientResponse: response, recipientMessage: message, respondedAt: new Date(), status } });
      if (response === "BLOCK_REQUESTER") await tx.conciergeBlock.upsert({ where: { blockerId_blockedId: { blockerId: userId, blockedId: request.requesterId } }, update: {}, create: { blockerId: userId, blockedId: request.requesterId } });
      if (response === "OPT_OUT") await tx.user.update({ where: { id: userId }, data: { conciergeOptOut: true } });
      if (response === "REPORT") await tx.report.create({ data: { reporterId: userId, reportedId: request.requesterId, reason: ViolationTypeEnum.OTHER, details: message || "Reported from concierge request" } });
    });
    await this.audit.log({ action: "CONCIERGE_RECIPIENT_RESPONSE", actorUserId: userId, targetUserId: request.requesterId, metadata: { requestId, response } });
    return { ok: true, status };
  }

  async cancel(userId: string, requestId: string) {
    const request = await this.prisma.conciergeRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Concierge request not found");
    if (request.requesterId !== userId) throw new ForbiddenException("Only the requester can cancel");
    if (request.status !== "PENDING_REVIEW") throw new BadRequestException("Only pending requests can be cancelled");
    await this.prisma.$transaction([
      this.prisma.conciergeRequest.update({ where: { id: requestId }, data: { status: "CANCELLED", completedAt: new Date(), creditConsumed: false } }),
      this.prisma.conciergeWallet.update({ where: { userId }, data: { availableCredits: { increment: 1 }, lifetimeUsed: { decrement: 1 } } }),
    ]);
    await this.audit.log({ action: "CONCIERGE_REQUEST_CANCELLED", actorUserId: userId, metadata: { requestId, creditReturned: true } });
    return { ok: true };
  }

  async updateSettings(userId: string, conciergeOptOut: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { conciergeOptOut: Boolean(conciergeOptOut) }, select: { conciergeOptOut: true } });
  }

  async createOrder(userId: string, input: { serviceId: string; intake?: unknown; memberNotes?: string }) {
    const tier = await this.requirePaidTier(userId);
    const service = await this.prisma.conciergeServiceCatalog.findUnique({ where: { id: input.serviceId } });
    if (!service || !service.active) throw new NotFoundException("Service not found");
    if ((tier === "PREMIUM" && !service.premiumEligible) || (tier === "ELITE" && !service.eliteEligible)) throw new ForbiddenException("Service is unavailable for this plan");
    const dueAt = service.turnaroundHours ? new Date(Date.now() + service.turnaroundHours * 3_600_000) : null;
    return this.prisma.conciergeServiceOrder.create({ data: { memberId: userId, serviceCatalogId: service.id, intakeJson: (input.intake || {}) as Prisma.InputJsonValue, memberNotes: String(input.memberNotes || "").slice(0, 1000) || null, amountCents: service.priceCents, currency: service.currency, dueAt } });
  }

  async staffQueue(userId: string) {
    await this.requireStaff(userId);
    return this.prisma.conciergeRequest.findMany({ where: { status: { in: ["PENDING_REVIEW", "APPROVED", "OUTREACH_SENT"] } }, include: { requester: { select: { id: true, displayName: true } }, recipient: { select: { id: true, displayName: true, conciergeOptOut: true } } }, orderBy: { createdAt: "asc" }, take: 200 });
  }

  async staffAction(userId: string, requestId: string, input: { action: "APPROVE" | "REJECT" | "SEND_OUTREACH" | "CLOSE"; notes?: string }) {
    await this.requireStaff(userId);
    const request = await this.prisma.conciergeRequest.findUnique({ where: { id: requestId }, include: { recipient: { select: { conciergeOptOut: true } } } });
    if (!request) throw new NotFoundException("Concierge request not found");
    const notes = String(input.notes || "").trim().slice(0, 2000) || null;
    if (input.action === "APPROVE") {
      if (request.status !== "PENDING_REVIEW") throw new BadRequestException("Request is not pending review");
      await this.prisma.conciergeRequest.update({ where: { id: requestId }, data: { status: "APPROVED", staffId: userId, staffNotes: notes } });
    } else if (input.action === "REJECT") {
      if (!['PENDING_REVIEW', 'APPROVED'].includes(request.status)) throw new BadRequestException("Request cannot be rejected now");
      await this.prisma.$transaction(async (tx) => {
        await tx.conciergeRequest.update({ where: { id: requestId }, data: { status: "REJECTED", staffId: userId, staffNotes: notes, completedAt: new Date(), creditConsumed: false } });
        if (request.creditConsumed) await tx.conciergeWallet.update({ where: { userId: request.requesterId }, data: { availableCredits: { increment: 1 }, lifetimeUsed: { decrement: 1 } } });
      });
    } else if (input.action === "SEND_OUTREACH") {
      if (request.status !== "APPROVED") throw new BadRequestException("Approve the request before outreach");
      if (request.recipient.conciergeOptOut) throw new ForbiddenException("Recipient opted out");
      const staffMessage = "A DateBuk member requested a one-time concierge introduction. There is no obligation to respond; you may accept, decline, block, report, or opt out.";
      await this.prisma.conciergeRequest.update({ where: { id: requestId }, data: { status: "OUTREACH_SENT", staffId: userId, staffMessage, outreachSentAt: new Date() } });
    } else {
      await this.prisma.conciergeRequest.update({ where: { id: requestId }, data: { status: "CLOSED", staffId: userId, completedAt: new Date(), staffNotes: notes } });
    }
    await this.audit.log({ action: `CONCIERGE_STAFF_${input.action}`, actorUserId: userId, targetUserId: request.requesterId, metadata: { requestId } });
    return { ok: true };
  }
}
