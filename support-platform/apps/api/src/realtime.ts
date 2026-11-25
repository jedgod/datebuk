/**
 * Real-time Events Emitter
 * Integrates with Express WebSocket server for live notifications
 * Used by: Tickets, Settings, Staff, Call Monitoring
 */

import { Server, Socket } from "ws";
import { Response } from "express";

type RealtimeEventType =
  | "report:created"
  | "report:updated"
  | "report:assigned"
  | "report:priority_changed"
  | "settings:updated"
  | "setting:category_updated"
  | "call:metrics"
  | "call:quality_alert"
  | "staff:online"
  | "staff:offline"
  | "staff:list"
  | "chat:message"
  | "chat:session_started"
  | "chat:session_closed"
  | "chat:typing";

interface RealtimeMessage {
  event: RealtimeEventType;
  payload: any;
  timestamp: Date;
}

class RealtimeEmitter {
  private wss: Server | null = null;
  private sseClients: Set<Response> = new Set();
  private staffStatus: Map<string, { status: "online" | "offline"; timestamp: Date }> = new Map();
  private callMetrics: Map<string, any> = new Map();

  /**
   * Initialize with WebSocket server and SSE clients
   */
  initialize(wss: Server, sseClients: Set<Response>) {
    this.wss = wss;
    this.sseClients = sseClients;
    console.log("[Realtime] Emitter initialized");
  }

  /**
   * Broadcast message to all connected clients (WS + SSE)
   */
  private broadcast(message: RealtimeMessage) {
    const data = JSON.stringify(message);

    // Broadcast via WebSocket
    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
          client.send(data);
        }
      });
    }

    // Broadcast via SSE
    this.sseClients.forEach((client) => {
      client.write(`event: ${message.event}\n`);
      client.write(`data: ${data}\n\n`);
    });
  }

  // ============= LIVE REPORT NOTIFICATIONS =============

  emitReportCreated(report: any) {
    this.broadcast({
      event: "report:created",
      payload: report,
      timestamp: new Date(),
    });
    console.log(`[Realtime] Report created:`, report.id);
  }

  emitReportUpdated(reportId: string, updates: any) {
    this.broadcast({
      event: "report:updated",
      payload: { reportId, updates },
      timestamp: new Date(),
    });
    console.log(`[Realtime] Report updated:`, reportId);
  }

  emitReportAssigned(reportId: string, staffId: string) {
    this.broadcast({
      event: "report:assigned",
      payload: { reportId, staffId },
      timestamp: new Date(),
    });
    console.log(`[Realtime] Report assigned:`, reportId, "→", staffId);
  }

  emitPriorityChanged(reportId: string, priority: "High" | "Medium" | "Low") {
    this.broadcast({
      event: "report:priority_changed",
      payload: { reportId, priority },
      timestamp: new Date(),
    });
    console.log(`[Realtime] Priority changed:`, reportId, "→", priority);
  }

  // ============= SETTINGS BROADCAST =============

  broadcastSettings(settings: any, changedBy: string) {
    this.broadcast({
      event: "settings:updated",
      payload: settings,
      timestamp: new Date(),
    });
    console.log(`[Realtime] Settings updated by:`, changedBy);
  }

  broadcastSettingCategory(category: string, value: any, changedBy: string) {
    this.broadcast({
      event: "setting:category_updated",
      payload: { category, value },
      timestamp: new Date(),
    });
    console.log(`[Realtime] Setting category updated:`, category);
  }

  // ============= REAL-TIME CALL METRICS =============

  updateCallMetrics(callId: string, metrics: any) {
    this.callMetrics.set(callId, metrics);
    this.broadcast({
      event: "call:metrics",
      payload: { callId, metrics },
      timestamp: new Date(),
    });
  }

  alertCallQualityIssue(callId: string, quality: "excellent" | "good" | "fair" | "poor") {
    this.broadcast({
      event: "call:quality_alert",
      payload: { callId, quality },
      timestamp: new Date(),
    });
    console.log(`[Realtime] Call quality alert:`, callId, "→", quality);
  }

  // ============= STAFF STATUS INDICATORS =============

  staffOnline(staffId: string) {
    this.staffStatus.set(staffId, { status: "online", timestamp: new Date() });
    this.broadcast({
      event: "staff:online",
      payload: { staffId, onlineCount: this.staffStatus.size },
      timestamp: new Date(),
    });
    console.log(`[Realtime] Staff online:`, staffId, `(${this.staffStatus.size} total)`);
  }

  staffOffline(staffId: string) {
    this.staffStatus.delete(staffId);
    this.broadcast({
      event: "staff:offline",
      payload: { staffId, onlineCount: this.staffStatus.size },
      timestamp: new Date(),
    });
    console.log(`[Realtime] Staff offline:`, staffId, `(${this.staffStatus.size} remain)`);
  }

  getOnlineStaff(): string[] {
    return Array.from(this.staffStatus.keys());
  }

  isStaffOnline(staffId: string): boolean {
    return this.staffStatus.has(staffId);
  }

  getStaffList() {
    return Array.from(this.staffStatus.entries()).map(([staffId, data]) => ({
      staffId,
      ...data,
    }));
  }

  // ============= LIVE CHAT SUPPORT =============

  emitChatMessage(sessionId: string, message: any) {
    this.broadcast({
      event: "chat:message",
      payload: { sessionId, message },
      timestamp: new Date(),
    });
    console.log(`[Realtime] Chat message:`, sessionId);
  }

  emitChatSessionStarted(sessionId: string, userEmail?: string, userName?: string) {
    this.broadcast({
      event: "chat:session_started",
      payload: { sessionId, userEmail, userName },
      timestamp: new Date(),
    });
    console.log(`[Realtime] Chat session started:`, sessionId);
  }

  emitChatSessionClosed(sessionId: string) {
    this.broadcast({
      event: "chat:session_closed",
      payload: { sessionId },
      timestamp: new Date(),
    });
    console.log(`[Realtime] Chat session closed:`, sessionId);
  }

  emitTypingIndicator(sessionId: string, sender: string) {
    this.broadcast({
      event: "chat:typing",
      payload: { sessionId, sender },
      timestamp: new Date(),
    });
  }
}

export const realtimeEmitter = new RealtimeEmitter();
export default realtimeEmitter;
