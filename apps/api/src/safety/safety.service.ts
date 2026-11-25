import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ReportSeverity, ReportStatus, ViolationTypeEnum } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { RedisService } from "../common/redis/redis.service";
import { logger } from "../common/logging/logger";

// Accepts the lowercase category strings the frontend report UI sends, independent of
// the underlying Prisma enum names, so the client never has to know Prisma naming.
const CATEGORY_MAP: Record<string, ViolationTypeEnum> = {
  inappropriate: "INAPPROPRIATE",
  harassment: "HARASSMENT",
  fraud: "SCAM",
  safety: "SAFETY_CONCERN",
  underage: "UNDERAGE_CONCERN",
  emergency: "EMERGENCY",
  other: "OTHER",
};

const SEVERITY_BY_CATEGORY: Record<ViolationTypeEnum, ReportSeverity> = {
  EMERGENCY: "CRITICAL",
  UNDERAGE_CONCERN: "CRITICAL",
  HARASSMENT: "HIGH",
  SAFETY_CONCERN: "HIGH",
  NUDITY: "HIGH",
  EXPLICIT_AUDIO: "HIGH",
  SCAM: "MEDIUM",
  FAKE_PROFILE: "MEDIUM",
  SPAM: "MEDIUM",
  INAPPROPRIATE: "LOW",
  OTHER: "LOW",
};

// How long a report of each severity has before it's considered overdue for review.
const SLA_HOURS: Record<ReportSeverity, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

const MAX_REPORTS_PER_DAY = 5;
const SNAPSHOT_MESSAGE_COUNT = 50;

function normalizedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

@Injectable()
export class SafetyService {
  private readonly signalingUrl = (process.env.SIGNALING_URL || "http://localhost:4001").replace(/\/$/, "");
  private readonly internalKey = process.env.SIGNALING_INTERNAL_KEY || "";

  constructor(private prisma: PrismaService, private redis: RedisService) {}

  resolveCategory(input: string): ViolationTypeEnum {
    const mapped = CATEGORY_MAP[input?.toLowerCase?.() ?? ""];
    if (!mapped) throw new BadRequestException("Unknown report category");
    return mapped;
  }

  async isBlockedEitherDirection(userA: string, userB: string): Promise<boolean> {
    const count = await this.prisma.block.count({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });
    return count > 0;
  }

  async block(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) throw new BadRequestException("Cannot block yourself");
    const target = await this.prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!target) throw new NotFoundException("User not found");

    await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId, reason: reason?.slice(0, 500) },
    });

    const [pairA, pairB] = normalizedPair(blockerId, blockedId);
    await this.prisma.match.updateMany({
      where: { user1Id: pairA, user2Id: pairB },
      data: { active: false },
    });

    await this.forceEndCallBetween(blockerId, blockedId);

    return { ok: true };
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
    return { ok: true };
  }

  async listBlocked(userId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: "desc" },
      include: { blocked: { select: { id: true, profile: { select: { displayName: true } }, email: true } } },
    });
    return blocks.map((b) => ({
      userId: b.blockedId,
      displayName: b.blocked.profile?.displayName || b.blocked.email,
      blockedAt: b.createdAt,
    }));
  }

  async report(params: {
    reporterId: string;
    reportedId: string;
    category: string;
    description?: string;
    matchId?: string;
    alsoBlock?: boolean;
  }) {
    const { reporterId, reportedId } = params;
    if (reporterId === reportedId) throw new BadRequestException("Cannot report yourself");

    const target = await this.prisma.user.findUnique({ where: { id: reportedId }, select: { id: true } });
    if (!target) throw new NotFoundException("User not found");

    // Best-effort daily cap to blunt retaliatory report spam. RedisService fails open by
    // design (see its own comments) if Redis is unreachable — deliberately not treated as
    // fail-closed here, since silently dropping a genuine safety report during a Redis
    // outage is worse than a temporarily-unenforced rate limit.
    const dayKey = new Date().toISOString().slice(0, 10);
    const allowed = await this.redis.checkRateLimit(`report:daily:${reporterId}:${dayKey}`, MAX_REPORTS_PER_DAY, 86_400);
    if (!allowed) {
      throw new BadRequestException(
        "You've submitted several reports today. If this is an emergency or ongoing safety risk, please contact support directly.",
      );
    }

    const category = this.resolveCategory(params.category);
    const severity = SEVERITY_BY_CATEGORY[category];
    const alsoBlock = params.alsoBlock ?? true;

    let matchId: string | undefined;
    let conversationSnapshot: Prisma.InputJsonValue | undefined;
    if (params.matchId) {
      const match = await this.prisma.match.findUnique({ where: { id: params.matchId } });
      if (match && (match.user1Id === reporterId || match.user2Id === reporterId)) {
        matchId = match.id;
        const recentMessages = await this.prisma.message.findMany({
          where: { matchId: match.id },
          orderBy: { createdAt: "desc" },
          take: SNAPSHOT_MESSAGE_COUNT,
          select: { id: true, senderId: true, content: true, createdAt: true },
        });
        conversationSnapshot = { capturedAt: new Date().toISOString(), messages: recentMessages.reverse() };
      }
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedId,
        matchId,
        reason: category,
        details: params.description?.slice(0, 2000),
        severity,
        status: "OPEN",
        alsoBlocked: alsoBlock,
        conversationSnapshot,
      },
    });

    await this.prisma.user.update({
      where: { id: reportedId },
      data: { negativeReports: { increment: 1 } },
    });

    if (alsoBlock) {
      await this.block(reporterId, reportedId, `reported: ${category}`);
    }

    logger.warn({ msg: "safety_report_filed", reportId: report.id, category, severity, alsoBlocked: alsoBlock });

    // Confirmation intentionally carries nothing that would let the reported user infer
    // who reported them — this return value only ever reaches the reporter.
    return { ok: true, reportId: report.id, severity };
  }

  async listReportsQueue(params: { status?: string; severity?: string; category?: string; limit?: number; page?: number }) {
    const where: Prisma.ReportWhereInput = {};
    if (params.status) where.status = params.status as ReportStatus;
    if (params.severity) where.severity = params.severity as ReportSeverity;
    if (params.category) where.reason = params.category as ViolationTypeEnum;

    const page = Math.max(params.page ?? 1, 1);
    const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
        skip,
        take: limit,
        include: {
          reporter: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
          reported: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    const now = Date.now();
    const data = items.map((r) => {
      const slaDeadline = new Date(r.createdAt.getTime() + SLA_HOURS[r.severity] * 60 * 60 * 1000);
      return {
        id: r.id,
        category: r.reason,
        severity: r.severity,
        status: r.status,
        description: r.details,
        alsoBlocked: r.alsoBlocked,
        createdAt: r.createdAt,
        reporter: { id: r.reporter.id, displayName: r.reporter.profile?.displayName || r.reporter.email },
        reported: { id: r.reported.id, displayName: r.reported.profile?.displayName || r.reported.email },
        matchId: r.matchId,
        conversationSnapshot: r.conversationSnapshot,
        resolvedBy: r.resolvedBy,
        resolvedAt: r.resolvedAt,
        resolutionNote: r.resolutionNote,
        slaDeadline,
        slaBreached: r.status === "OPEN" || r.status === "INVESTIGATING" ? now > slaDeadline.getTime() : false,
      };
    });

    return { data, pagination: { total, page, per_page: limit, has_more: total > page * limit } };
  }

  async resolveReport(id: string, staffId: string, status: "INVESTIGATING" | "RESOLVED" | "DISMISSED", note?: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException("Report not found");

    return this.prisma.report.update({
      where: { id },
      data: {
        status,
        resolvedBy: status === "RESOLVED" || status === "DISMISSED" ? staffId : report.resolvedBy,
        resolvedAt: status === "RESOLVED" || status === "DISMISSED" ? new Date() : null,
        resolutionNote: note?.slice(0, 2000),
      },
    });
  }

  async userSafetyHistory(userId: string) {
    const [filedByUser, filedAgainstUser] = await Promise.all([
      this.prisma.report.count({ where: { reporterId: userId } }),
      this.prisma.report.count({ where: { reportedId: userId } }),
    ]);
    return { reportsFiled: filedByUser, reportsReceived: filedAgainstUser };
  }

  // Best-effort: asks apps/signaling to end any live call between these two users right
  // now, in addition to the ongoing join-room block-check that prevents new ones. A
  // failure here (signaling down, misconfigured key) must never block the block/report
  // action itself — the DB-level block still takes effect either way.
  private async forceEndCallBetween(userA: string, userB: string) {
    if (!this.internalKey) return;
    try {
      await fetch(`${this.signalingUrl}/internal/force-end-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-key": this.internalKey },
        body: JSON.stringify({ userA, userB, reason: "BLOCKED" }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      logger.warn({ msg: "force_end_call_failed", error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Exposed for apps/signaling's join-room block-check (called via the /internal
  // endpoint on this service's controller, protected by the same shared secret).
  async internalCheckBlocked(userA: string, userB: string): Promise<boolean> {
    return this.isBlockedEitherDirection(userA, userB);
  }
}
