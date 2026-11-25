import { Injectable } from "@nestjs/common";
import { RealtimeGateway } from "./realtime.gateway";

/**
 * Service for triggering realtime events
 * Use this service in other modules to emit events
 */
@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  // ============= LIVE REPORT NOTIFICATIONS =============

  notifyReportCreated(report: any) {
    this.gateway.emitReportCreated(report);
  }

  notifyReportUpdated(reportId: string, updates: any) {
    this.gateway.emitReportUpdated(reportId, updates);
  }

  notifyReportAssigned(reportId: string, staffId: string) {
    this.gateway.emitReportAssigned(reportId, staffId);
  }

  notifyPriorityChanged(reportId: string, priority: "high" | "medium" | "low") {
    this.gateway.emitPriorityChanged(reportId, priority);
  }

  // ============= SETTINGS BROADCAST =============

  broadcastSettings(settings: any, changedBy: string) {
    this.gateway.broadcastSettingsUpdate(settings, changedBy);
  }

  broadcastSettingCategory(
    category: string,
    value: any,
    changedBy: string
  ) {
    this.gateway.broadcastSettingCategory(category, value, changedBy);
  }

  // ============= REAL-TIME CALL METRICS =============

  updateCallMetrics(
    callId: string,
    metrics: {
      jitter?: number;
      latency?: number;
      packetLoss?: number;
      bandwidth?: number;
      quality?: "excellent" | "good" | "fair" | "poor";
    }
  ) {
    this.gateway.streamCallMetrics(callId, metrics);
  }

  alertCallQualityIssue(
    callId: string,
    quality: "excellent" | "good" | "fair" | "poor"
  ) {
    this.gateway.emitCallQualityAlert(callId, quality);
  }

  // ============= STAFF STATUS INDICATORS =============

  markStaffOnline(staffId: string) {
    this.gateway.staffOnline(staffId);
  }

  markStaffOffline(staffId: string) {
    this.gateway.staffOffline(staffId);
  }

  getOnlineStaffList(): string[] {
    return this.gateway.getOnlineStaff();
  }

  isStaffOnline(staffId: string): boolean {
    return this.gateway.isStaffOnline(staffId);
  }
}
