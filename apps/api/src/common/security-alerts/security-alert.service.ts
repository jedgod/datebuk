import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

type AlertSeverity = "low" | "medium" | "high" | "critical";

const MFA_FAILURE_THRESHOLD = 5;
const MFA_FAILURE_WINDOW_MIN = 10;
const RAPID_IP_THRESHOLD = 3;
const RAPID_IP_WINDOW_MIN = 15;
const PERMISSION_DENIAL_THRESHOLD = 5;
const PERMISSION_DENIAL_WINDOW_MS = 10 * 60 * 1000;
const MASS_EXPORT_ROW_THRESHOLD = 1000;
const ALERT_DEDUP_COOLDOWN_MS = 15 * 60 * 1000;

// Real-time detection over the several parallel places security-relevant events already
// get written in this codebase (AuditLog rows, StaffActivityLog rows, and — since
// permission denials bypass both of those, logged only via the plain pino logger in the
// two permission guards — an in-memory counter fed directly from those guards). This
// implements a deliberately-scoped subset of a much longer suggested-alert list; the rest
// (unusual verification-image access, push-broadcast-to-large-audience, high-volume
// profile scraping, TURN-credential abuse) are documented as designed-but-deferred rather
// than silently dropped — see the manual's security section.
@Injectable()
export class SecurityAlertService {
  // Permission-denial counting is in-memory (process-local, resets on restart) rather
  // than a new DB write path — acceptable for an alerting signal, not something this
  // codebase would rely on for actual access enforcement.
  private permissionDenials = new Map<string, { count: number; windowStart: number }>();

  constructor(private prisma: PrismaService) {}

  private async createAlert(params: {
    ruleId: string;
    severity: AlertSeverity;
    summary: string;
    actorUserId?: string | null;
    targetUserId?: string | null;
    evidence?: unknown;
  }) {
    // De-duplicate: don't spam a fresh alert every time the same rule keeps tripping for
    // the same actor within the cooldown window — one open alert already covers it.
    const existing = await this.prisma.securityAlert.findFirst({
      where: {
        ruleId: params.ruleId,
        actorUserId: params.actorUserId ?? null,
        status: "open",
        createdAt: { gte: new Date(Date.now() - ALERT_DEDUP_COOLDOWN_MS) },
      },
    });
    if (existing) return existing;

    return this.prisma.securityAlert.create({
      data: {
        ruleId: params.ruleId,
        severity: params.severity,
        summary: params.summary,
        actorUserId: params.actorUserId ?? null,
        targetUserId: params.targetUserId ?? null,
        evidence: (params.evidence as any) ?? undefined,
      },
    });
  }

  /** Operational alert from another module (e.g. communications health). De-duplicated like all alerts. */
  raise(ruleId: string, severity: AlertSeverity, summary: string, evidence?: unknown, actorUserId?: string | null) {
    return this.createAlert({ ruleId, severity, summary, evidence, actorUserId: actorUserId ?? null });
  }

  // Called after every AuditLog write (see AuditService.log) — best-effort, never allowed
  // to throw back into the caller's hot path.
  async evaluateAuditEvent(entry: { action: string; actorUserId: string | null; ip: string | null }) {
    try {
      if (entry.action === "AUTH_OTP_FAILED" || entry.action === "AUTH_BACKUP_CODE_FAILED" || entry.action === "AUTH_PASSWORD_VERIFY_FAILED") {
        await this.checkRepeatedMfaFailures(entry.actorUserId);
      }
      if (entry.action === "AUTH_REFRESH_REUSE_DETECTED") {
        await this.createAlert({
          ruleId: "REFRESH_TOKEN_REUSE",
          severity: "critical",
          summary: "Refresh-token reuse detected — a rotated or revoked token was replayed, likely a stolen session",
          actorUserId: entry.actorUserId,
          evidence: { action: entry.action },
        });
      }
      if (entry.actorUserId) await this.checkRapidIpChange(entry.actorUserId);
    } catch {
      // Alerting must never break the action that triggered it.
    }
  }

  private async checkRepeatedMfaFailures(actorUserId: string | null) {
    if (!actorUserId) return;
    const since = new Date(Date.now() - MFA_FAILURE_WINDOW_MIN * 60 * 1000);
    const count = await this.prisma.auditLog.count({
      where: { actorUserId, action: { in: ["AUTH_OTP_FAILED", "AUTH_BACKUP_CODE_FAILED", "AUTH_PASSWORD_VERIFY_FAILED"] }, createdAt: { gte: since } },
    });
    if (count >= MFA_FAILURE_THRESHOLD) {
      await this.createAlert({
        ruleId: "REPEATED_MFA_FAILURES",
        severity: "high",
        summary: `${count} failed MFA/password re-verification attempts on the same account in the last ${MFA_FAILURE_WINDOW_MIN} minutes`,
        actorUserId,
        evidence: { count, windowMinutes: MFA_FAILURE_WINDOW_MIN },
      });
    }
  }

  private async checkRapidIpChange(actorUserId: string) {
    const since = new Date(Date.now() - RAPID_IP_WINDOW_MIN * 60 * 1000);
    const rows = await this.prisma.auditLog.findMany({
      where: { actorUserId, createdAt: { gte: since }, ip: { not: null } },
      select: { ip: true },
      distinct: ["ip"],
    });
    if (rows.length >= RAPID_IP_THRESHOLD) {
      await this.createAlert({
        ruleId: "RAPID_IP_CHANGE",
        severity: "medium",
        summary: `${rows.length} distinct IP addresses used by the same account within ${RAPID_IP_WINDOW_MIN} minutes`,
        actorUserId,
        evidence: { distinctIps: rows.length, windowMinutes: RAPID_IP_WINDOW_MIN },
      });
    }
  }

  // Fed directly from PermissionsGuard and StaffPermissionGuard, the two places a denial
  // is decided — neither writes to AuditLog today (pino-only), so this is the one place
  // that can actually see repeated denials across both guards.
  async recordPermissionDenial(actorUserId: string | undefined, permission: string | string[], path?: string) {
    if (!actorUserId) return;
    const now = Date.now();
    const entry = this.permissionDenials.get(actorUserId);
    let count: number;
    if (!entry || now - entry.windowStart > PERMISSION_DENIAL_WINDOW_MS) {
      count = 1;
      this.permissionDenials.set(actorUserId, { count, windowStart: now });
    } else {
      entry.count += 1;
      count = entry.count;
    }
    if (count >= PERMISSION_DENIAL_THRESHOLD) {
      await this.createAlert({
        ruleId: "REPEATED_PERMISSION_DENIALS",
        severity: "high",
        summary: `${count} denied permission checks for the same account in the last 10 minutes — possible probing`,
        actorUserId,
        evidence: { count, permission, path },
      }).catch(() => {});
    }
  }

  // Fed from StaffService.updateStaffRoles — the one live endpoint that actually grants
  // elevated staff permissions to an account.
  async recordStaffRoleChange(adminId: string, targetStaffId: string, roleNames: string[]) {
    const grantsSuperAdmin = roleNames.some((name) => /super\s*admin/i.test(name));
    await this.createAlert({
      ruleId: grantsSuperAdmin ? "SUPER_ADMIN_ROLE_GRANTED" : "STAFF_PERMISSIONS_CHANGED",
      severity: grantsSuperAdmin ? "critical" : "low",
      summary: grantsSuperAdmin
        ? `Super Admin permissions granted to ${targetStaffId}`
        : `Staff role assignment changed for ${targetStaffId}`,
      actorUserId: adminId,
      targetUserId: targetStaffId,
      evidence: { roleNames },
    }).catch(() => {});
  }

  // Fed from the audit-export endpoint, which previously left no trace of its own use.
  async recordAuditExport(actorUserId: string, rowCount: number) {
    if (rowCount < MASS_EXPORT_ROW_THRESHOLD) return;
    await this.createAlert({
      ruleId: "MASS_AUDIT_EXPORT",
      severity: "high",
      summary: `${rowCount} audit rows exported in a single request`,
      actorUserId,
      evidence: { rowCount },
    }).catch(() => {});
  }
}
