import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UploadsService } from "../uploads/uploads.service";

export type PushSegment = {
  emailVerified?: boolean;
  gender?: string;
  interest?: string;
  minAge?: number;
  maxAge?: number;
  flaggedUsersOnly?: boolean;
  recentViolationsDays?: number;
};

export type AuditFilters = {
  q?: string;
  action?: string;
  actorUserId?: string;
  targetUserId?: string;
  from?: string; // ISO date
  to?: string;   // ISO date
  limit?: number;
  cursor?: string;
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private uploads: UploadsService) {}

  async dashboardSummary() {
    const [
      totalUsers,
      activeStaff,
      pendingStaff,
      suspendedStaff,
      totalStaff,
      openTickets,
      totalTickets,
      rolesCount,
      pendingVerifications,
      recentActivityRaw,
      recentStaffRaw,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: "USER" } }),
      this.prisma.user.count({ where: { role: { in: ["SUPPORT", "SUPERADMIN"] }, accountStatus: "ACTIVE" } }),
      this.prisma.user.count({ where: { role: { in: ["SUPPORT", "SUPERADMIN"] }, accountStatus: "PENDING" } }),
      this.prisma.user.count({ where: { role: { in: ["SUPPORT", "SUPERADMIN"] }, accountStatus: "SUSPENDED" } }),
      this.prisma.user.count({ where: { role: { in: ["SUPPORT", "SUPERADMIN"] } } }),
      this.prisma.supportTicket.count({ where: { status: "open" } }),
      this.prisma.supportTicket.count(),
      this.prisma.role.count(),
      this.prisma.verificationRequest.count({ where: { status: "PENDING" } }),
      this.prisma.staffActivityLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { actor: { include: { staffProfile: true } } },
      }),
      this.prisma.user.findMany({
        where: { role: { in: ["SUPPORT", "SUPERADMIN"] } },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { staffProfile: true, staffRoles: { include: { role: true } } },
      }),
    ]);

    let dbHealthy = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbHealthy = false;
    }

    return {
      totalUsers,
      staff: { active: activeStaff, pending: pendingStaff, suspended: suspendedStaff, total: totalStaff },
      tickets: { open: openTickets, total: totalTickets },
      rolesCount,
      pendingVerifications,
      dbHealthy,
      recentActivity: recentActivityRaw.map((entry) => ({
        id: entry.id,
        actorName: entry.actor.staffProfile?.displayName || entry.actor.email,
        action: entry.action,
        target: entry.target,
        createdAt: entry.createdAt,
      })),
      recentStaff: recentStaffRaw.map((staff) => ({
        id: staff.id,
        name: staff.staffProfile?.displayName || staff.email,
        role: staff.staffRoles[0]?.role?.name || staff.role,
        accountStatus: staff.accountStatus,
      })),
    };
  }

  private static readonly REPORT_CATEGORY_LABELS: Record<string, string> = {
    NUDITY: "Nudity",
    EXPLICIT_AUDIO: "Explicit Audio",
    HARASSMENT: "Harassment",
    SPAM: "Spam",
    SCAM: "Scam",
    FAKE_PROFILE: "Fake Profile",
    OTHER: "Other",
  };

  private static readonly REPORT_SEVERITY_BY_REASON: Record<string, "low" | "medium" | "high" | "critical"> = {
    HARASSMENT: "high",
    NUDITY: "high",
    EXPLICIT_AUDIO: "high",
    SCAM: "medium",
    FAKE_PROFILE: "medium",
    SPAM: "medium",
    OTHER: "low",
  };

  private mapReportStatus(handledAt: Date | null, outcome: string | null): "new" | "investigating" | "verified" | "resolved" | "dismissed" {
    if (!handledAt) return outcome === "FURTHER_REVIEW" ? "investigating" : "new";
    if (outcome === "REJECTED") return "dismissed";
    if (outcome === "APPROVED") return "resolved";
    return "verified";
  }

  async listVideoMonitorReports() {
    const reports = await this.prisma.report.findMany({
      orderBy: { reportedAt: "desc" },
      take: 100,
      include: {
        reporter: { include: { profile: true } },
        reported: { include: { profile: true } },
      },
    });

    return reports.map((r) => ({
      id: r.id,
      reporterId: r.reporterId,
      reporterName: r.reporter.profile?.displayName || r.reporter.email,
      reportedUserId: r.reportedId,
      reportedUserName: r.reported.profile?.displayName || r.reported.email,
      category: AdminService.REPORT_CATEGORY_LABELS[r.reason] || r.reason,
      severity: AdminService.REPORT_SEVERITY_BY_REASON[r.reason] || "low",
      description: r.details || "",
      timestamp: r.reportedAt,
      status: this.mapReportStatus(r.handledAt, r.outcome),
      actionTaken: r.outcome || undefined,
    }));
  }

  async updateVideoMonitorReportStatus(reportId: string, status: string) {
    const outcomeByStatus: Record<string, { outcome: string | null; handledAt: Date | null }> = {
      new: { outcome: null, handledAt: null },
      investigating: { outcome: "FURTHER_REVIEW", handledAt: null },
      verified: { outcome: "APPROVED", handledAt: new Date() },
      resolved: { outcome: "APPROVED", handledAt: new Date() },
      dismissed: { outcome: "REJECTED", handledAt: new Date() },
    };
    const update = outcomeByStatus[status];
    if (!update) throw new BadRequestException("Invalid status");

    return this.prisma.report.update({ where: { id: reportId }, data: update });
  }

  async applyVideoMonitorReportAction(reportId: string, action: string, notes: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new BadRequestException("Report not found");

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        outcome: "APPROVED",
        handledAt: new Date(),
        details: notes ? `${report.details || ""}\n[Action: ${action}] ${notes}`.trim() : report.details,
      },
    });
  }

  async resolveSegment(segment: PushSegment) {
    const whereUser: any = {};
    if (typeof segment.emailVerified === "boolean") whereUser.emailVerified = segment.emailVerified;

    const whereProfile: any = {};
    if (segment.gender) whereProfile.gender = segment.gender;
    if (typeof segment.minAge === "number") whereProfile.age = { ...(whereProfile.age ?? {}), gte: segment.minAge };
    if (typeof segment.maxAge === "number") whereProfile.age = { ...(whereProfile.age ?? {}), lte: segment.maxAge };
    if (segment.interest) whereProfile.interests = { has: segment.interest };

    const recentDays = Number(segment.recentViolationsDays ?? 0);
    const includeRecent = Number.isFinite(recentDays) && recentDays > 0;
    const includeFlagged = segment.flaggedUsersOnly === true;

    if (includeRecent || includeFlagged) {
      const fraudEventWhere: any = {};
      if (includeRecent) {
        const since = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
        fraudEventWhere.createdAt = { gte: since };
      }
      if (includeFlagged) {
        fraudEventWhere.OR = [
          { resolved: false },
          { moderationQueue: { is: { status: { in: ["pending", "escalated"] } } } },
        ];
      }
      whereUser.fraudEvents = { some: fraudEventWhere };
    }

    const users = await this.prisma.user.findMany({
      where: {
        ...whereUser,
        profile: Object.keys(whereProfile).length ? { is: whereProfile } : undefined,
      },
      select: { id: true },
      take: 50_000, // higher cap for admin broadcast; still bounded
    });

    return users.map((u) => u.id);
  }

  async listUsers(q?: string, limit = 50) {
    const where: any = q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { profile: { is: { displayName: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {};
    return this.prisma.user.findMany({
      where,
      take: Math.min(Math.max(limit, 1), 200),
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, emailVerified: true, isAdmin: true, createdAt: true, profile: { select: { displayName: true } } },
    });
  }

  async sessionsByUser(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        refreshTokenId: true,
        createdAt: true,
        updatedAt: true,
        revokedAt: true,
        rotatedAt: true,
        ip: true,
        userAgent: true,
        reuseDetectedAt: true,
      },
    });
  }

  async revokeSession(sessionId: string) {
    const s = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!s) throw new BadRequestException("Session not found");
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
    return { ok: true, userId: s.userId };
  }

  async auditQuery(filters: AuditFilters) {
    const limit = Math.min(Math.max(Number(filters.limit ?? 50), 1), 200);
    const where: any = {};
    if (filters.action) where.action = filters.action;
    if (filters.actorUserId) where.actorUserId = filters.actorUserId;
    if (filters.targetUserId) where.targetUserId = filters.targetUserId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    if (filters.q) {
      where.OR = [
        { action: { contains: filters.q, mode: "insensitive" } },
        { ip: { contains: filters.q, mode: "insensitive" } },
      ];
    }

    const cursor = filters.cursor ? { id: filters.cursor } : undefined;

    const rows = await this.prisma.auditLog.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor } : {}),
      orderBy: { createdAt: "desc" },
    });

    const nextCursor = rows.length > limit ? rows[limit].id : null;
    const items = rows.slice(0, limit);
    return { items, nextCursor };
  }

  async auditExport(filters: AuditFilters) {
    // export up to 10k
    const where: any = {};
    if (filters.action) where.action = filters.action;
    if (filters.actorUserId) where.actorUserId = filters.actorUserId;
    if (filters.targetUserId) where.targetUserId = filters.targetUserId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const rows = await this.prisma.auditLog.findMany({
      where,
      take: 10_000,
      orderBy: { createdAt: "desc" },
    });

    const lines: string[] = [];
    lines.push(["createdAt","action","actorUserId","targetUserId","ip","userAgent","metadata"].join(","));
    for (const r of rows) {
      const vals = [
        r.createdAt.toISOString(),
        r.action,
        r.actorUserId ?? "",
        r.targetUserId ?? "",
        r.ip ?? "",
        (r.userAgent ?? "").replace(/\s+/g, " ").slice(0, 180),
        JSON.stringify(r.metadata ?? {}).replace(/\s+/g, " ").slice(0, 2000),
      ].map(v => `"${String(v).replace(/"/g,'""')}"`);
      lines.push(vals.join(","));
    }
    return { csv: lines.join("\n"), rowCount: rows.length };
  }

async quarantineMeta(key: string) {
  return this.uploads.headObject(key);
}

async quarantinePreview(key: string) {
  return this.uploads.presignedGet(key, 60);
}

async quarantineList(prefix = "quarantine/") {
    return this.uploads.listObjects(prefix);
  }

  async quarantineDelete(key: string) {
    return this.uploads.deleteObject(key);
  }

  async quarantineRelease(key: string) {
    // release moves from quarantine/ -> uploads/ (then can be processed again)
    const targetKey = key.replace(/^quarantine\//, "uploads/released/");
    await this.uploads.copyObject(key, targetKey);
    await this.uploads.deleteObject(key);
    return { ok: true, releasedKey: targetKey };
  }

  async listVideoModerationQueue(params: {
    status?: string;
    severity?: string | string[];
    minRiskScore?: number;
    isLive?: boolean;
    limit?: number;
    page?: number;
  }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.severity) {
      const severities = Array.isArray(params.severity)
        ? params.severity
        : String(params.severity).split(",").map((s) => s.trim()).filter(Boolean);
      if (severities.length === 1) where.severity = severities[0];
      if (severities.length > 1) where.severity = { in: severities };
    }
    if (typeof params.minRiskScore === "number") where.riskScore = { gte: params.minRiskScore };
    if (typeof params.isLive === "boolean") where.isLive = params.isLive;

    // Pagination support
    const page = params.page ?? 1;
    const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.videoModerationItem.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { displayName: true } },
            },
          },
        },
        orderBy: [{ riskScore: "desc" }, { flaggedAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.videoModerationItem.count({ where }),
    ]);

    return { items, total };
  }

  async videoModerationMetrics() {
    const [pending, inReview, approved, flagged, escalated, liveCount] = await Promise.all([
      this.prisma.videoModerationItem.count({ where: { status: "pending" } }),
      this.prisma.videoModerationItem.count({ where: { status: "in_review" } }),
      this.prisma.videoModerationItem.count({ where: { status: "approved" } }),
      this.prisma.videoModerationItem.count({ where: { status: "flagged" } }),
      this.prisma.videoModerationItem.count({ where: { status: "escalated" } }),
      this.prisma.videoModerationItem.count({ where: { isLive: true } }),
    ]);

    const recentReviewed = await this.prisma.videoModerationItem.findMany({
      where: { reviewedAt: { not: null } },
      orderBy: { reviewedAt: "desc" },
      take: 100,
      select: { flaggedAt: true, reviewedAt: true },
    });

    const avgHandleSeconds = recentReviewed.length
      ? Math.round(
          recentReviewed.reduce((acc, r) => {
            const delta = r.reviewedAt ? r.reviewedAt.getTime() - r.flaggedAt.getTime() : 0;
            return acc + Math.max(delta, 0);
          }, 0) /
            recentReviewed.length /
            1000,
        )
      : 0;

    return {
      pending,
      inReview,
      approved,
      flagged,
      escalated,
      liveCount,
      avgHandleSeconds,
      total: pending + inReview + approved + flagged + escalated,
    };
  }

  async reviewVideoModerationItem(params: {
    id: string;
    decision: "approved" | "flagged" | "escalated";
    reviewerId?: string | null;
  }) {
    return this.prisma.videoModerationItem.update({
      where: { id: params.id },
      data: {
        status: params.decision,
        reviewedAt: new Date(),
        reviewedBy: params.reviewerId ?? null,
      },
    });
  }

  async pushBroadcastAnalytics() {
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalSubscribers, broadcasts7d, broadcasts30d] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.pushSubscription.count(),
      this.prisma.auditLog.count({
        where: { action: "ADMIN_PUSH_BROADCAST_ENQUEUED", createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.auditLog.count({
        where: { action: "ADMIN_PUSH_BROADCAST_ENQUEUED", createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return {
      totalUsers,
      totalSubscribers,
      broadcastsLast7d: broadcasts7d,
      broadcastsLast30d: broadcasts30d,
    };
  }

  async pushBroadcastRecent(limit = 5) {
    const rows = await this.prisma.auditLog.findMany({
      where: { action: "ADMIN_PUSH_BROADCAST_ENQUEUED" },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 20),
    });

    return rows.map((row) => {
      const meta = (row.metadata ?? {}) as any;
      const payload = meta.payload ?? {};
      return {
        id: row.id,
        title: payload.title ?? "Untitled Broadcast",
        body: payload.body ?? "",
        url: payload.url ?? "",
        createdAt: row.createdAt,
        segment: meta.segment ?? {},
      };
    });
  }

  async listSubscriptionFeatures() {
    return this.prisma.subscriptionFeature.findMany({
      select: {
        id: true,
        tierName: true,
        featureName: true,
        featureValue: true,
        isEnabled: true,
        displayOrder: true,
      },
      orderBy: [{ displayOrder: "asc" }, { featureName: "asc" }],
    });
  }

  async upsertSubscriptionFeatures(
    features: Array<{
      tierName: string;
      featureName: string;
      isEnabled: boolean;
      displayOrder?: number;
      featureValue?: string | null;
    }>
  ) {
    const updates = features.map((feature) =>
      this.prisma.subscriptionFeature.upsert({
        where: {
          tierName_featureName: {
            tierName: feature.tierName,
            featureName: feature.featureName,
          },
        },
        create: {
          tierName: feature.tierName,
          featureName: feature.featureName,
          isEnabled: feature.isEnabled,
          displayOrder: feature.displayOrder ?? 0,
          featureValue: feature.featureValue ?? null,
        },
        update: {
          isEnabled: feature.isEnabled,
          displayOrder: feature.displayOrder ?? 0,
          featureValue: feature.featureValue ?? null,
        },
      })
    );

    await this.prisma.$transaction(updates);
    return { ok: true };
  }
}
