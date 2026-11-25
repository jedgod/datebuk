import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { SecurityAlertService } from "../common/security-alerts/security-alert.service";

const KEY = "emergency_stop";
const CACHE_MS = 3_000;

/**
 * Emergency shutdown for all outbound SMS, flipped at runtime from the admin dashboard (no deploy,
 * no restart). While on: nothing new is queued, and queued messages wait (they expire if it lasts).
 * Messages already handed to Twilio are unaffected; their callbacks are still processed.
 */
@Injectable()
export class SmsControlService {
  private cache: { at: number; stopped: boolean; reason: string | null } | null = null;

  constructor(private prisma: PrismaService, private audit: AuditService, private alerts: SecurityAlertService) {}

  async status(): Promise<{ stopped: boolean; reason: string | null; updatedAt?: Date | null; updatedBy?: string | null }> {
    const row = await this.prisma.smsControl.findUnique({ where: { key: KEY } });
    const stopped = row?.value === "on";
    this.cache = { at: Date.now(), stopped, reason: stopped ? row?.reason ?? null : null };
    return { stopped, reason: this.cache.reason, updatedAt: row?.updatedAt ?? null, updatedBy: row?.updatedBy ?? null };
  }

  /** Hot-path check with a few seconds of caching; every worker sees a change within CACHE_MS. */
  async isStopped(): Promise<boolean> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.stopped;
    return (await this.status()).stopped;
  }

  async set(on: boolean, reason: string | undefined, actor: { userId: string; ip?: string; userAgent?: string }) {
    await this.prisma.smsControl.upsert({
      where: { key: KEY },
      update: { value: on ? "on" : "off", reason: on ? (reason ?? "emergency stop").slice(0, 300) : null, updatedBy: actor.userId },
      create: { key: KEY, value: on ? "on" : "off", reason: on ? (reason ?? "emergency stop").slice(0, 300) : null, updatedBy: actor.userId },
    });
    this.cache = null;
    await this.audit.log({
      action: on ? "SMS_EMERGENCY_STOP_ON" : "SMS_EMERGENCY_STOP_OFF",
      actorUserId: actor.userId,
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
      metadata: { reason: on ? reason ?? null : null },
    });
    if (on) await this.alerts.raise("SMS_EMERGENCY_STOP", "critical", "Outbound SMS emergency stop engaged", { reason: reason ?? null }, actor.userId);
    return this.status();
  }
}
