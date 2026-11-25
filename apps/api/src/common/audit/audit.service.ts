import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../../database/prisma.service";
import { getRequestId } from "../logging/request-context";
import { redactMetadata } from "./redact";
import { SecurityAlertService } from "../security-alerts/security-alert.service";

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService, private alerts: SecurityAlertService) {}

  async log(params: {
    action: string;
    actorUserId?: string | null;
    targetUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: any;
  }) {
    const actorUserId = params.actorUserId ?? null;
    const targetUserId = params.targetUserId ?? null;
    const ip = params.ip ?? null;
    const userAgent = params.userAgent ?? null;
    const metadata = params.metadata != null ? redactMetadata(params.metadata) : undefined;
    const requestId = getRequestId() ?? null;

    // Hash-chain for tamper evidence: each row commits to its own content plus the
    // previous row's hash, so deleting or editing a past row breaks the chain from that
    // point forward. Best-effort, not full tamper-proofing — see the manual's caveat on
    // concurrent writes racing to read the same "previous" row.
    const previous = await this.prisma.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });
    const previousHash = previous?.hash ?? null;
    const createdAt = new Date();
    const hash = createHash("sha256")
      .update(
        JSON.stringify({
          action: params.action,
          actorUserId,
          targetUserId,
          ip,
          userAgent,
          metadata: metadata ?? null,
          requestId,
          createdAt: createdAt.toISOString(),
          previousHash,
        }),
      )
      .digest("hex");

    const entry = await this.prisma.auditLog.create({
      data: {
        action: params.action,
        actorUserId,
        targetUserId,
        ip,
        userAgent,
        metadata,
        requestId,
        previousHash,
        hash,
        createdAt,
      },
    });

    // Fire-and-forget: alert evaluation must never slow down or fail the action that
    // produced this log entry.
    this.alerts.evaluateAuditEvent({ action: params.action, actorUserId, ip }).catch(() => {});

    return entry;
  }
}
