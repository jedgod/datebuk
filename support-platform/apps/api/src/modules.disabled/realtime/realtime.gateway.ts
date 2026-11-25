import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

/**
 * Real-time WebSocket Gateway
 * Handles all real-time communication for support platform:
 * - Live report notifications
 * - Settings broadcast
 * - Call metrics streaming
 * - Staff status indicators
 */

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  path: "/support/ws",
  namespace: "/"
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private staffStatusMap = new Map<string, { staffId: string; status: "online" | "offline"; timestamp: Date }>();
  private callMetricsMap = new Map<string, any>();

  // ============= LIFE CYCLE =============

  handleConnection(socket: Socket) {
    console.log(`[WS] Client connected: ${socket.id}`);
    socket.emit("connected", { clientId: socket.id, timestamp: new Date() });
  }

  handleDisconnect(socket: Socket) {
    console.log(`[WS] Client disconnected: ${socket.id}`);
    // Clean up staff status if staff member disconnected
    socket.rooms.forEach(room => {
      if (room.startsWith('staff:')) {
        const staffId = room.replace('staff:', '');
        this.staffStatusMap.delete(staffId);
      }
    });
  }

  // ============= LIVE REPORT NOTIFICATIONS =============

  /**
   * Emit when a new report/ticket is created
   * @param report Report object
   */
  emitReportCreated(report: any) {
    this.server.emit("report:created", {
      event: "report_created",
      payload: report,
      timestamp: new Date(),
    });
  }

  /**
   * Emit when a report/ticket is updated
   * @param reportId Report ID
   * @param updates Updated fields
   */
  emitReportUpdated(reportId: string, updates: any) {
    this.server.emit("report:updated", {
      event: "report_updated",
      reportId,
      payload: updates,
      timestamp: new Date(),
    });
  }

  /**
   * Emit when a report is assigned to staff
   * @param reportId Report ID
   * @param staffId Assigned staff member
   */
  emitReportAssigned(reportId: string, staffId: string) {
    this.server.emit("report:assigned", {
      event: "report_assigned",
      reportId,
      staffId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit when a report priority changes
   * @param reportId Report ID
   * @param priority New priority level
   */
  emitPriorityChanged(reportId: string, priority: "high" | "medium" | "low") {
    this.server.emit("report:priority_changed", {
      event: "priority_changed",
      reportId,
      priority,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage("report:subscribe")
  subscribeToReports(@ConnectedSocket() socket: Socket) {
    socket.join("reports");
    socket.emit("report:subscribed", { status: "subscribed" });
  }

  @SubscribeMessage("report:unsubscribe")
  unsubscribeFromReports(@ConnectedSocket() socket: Socket) {
    socket.leave("reports");
    socket.emit("report:unsubscribed", { status: "unsubscribed" });
  }

  // ============= SETTINGS BROADCAST =============

  /**
   * Broadcast settings changes to all connected clients
   * @param settings Settings object
   * @param changedBy User who made the change
   */
  broadcastSettingsUpdate(settings: any, changedBy: string) {
    this.server.emit("settings:updated", {
      event: "settings_updated",
      payload: settings,
      changedBy,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast a specific setting category
   * @param category Settings category (e.g., "moderation", "features", "safety")
   * @param value Setting value
   */
  broadcastSettingCategory(category: string, value: any, changedBy: string) {
    this.server.emit("setting:category_updated", {
      event: "setting_category_updated",
      category,
      payload: value,
      changedBy,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage("settings:subscribe")
  subscribeToSettings(@ConnectedSocket() socket: Socket) {
    socket.join("settings");
    socket.emit("settings:subscribed", { status: "subscribed" });
  }

  @SubscribeMessage("settings:unsubscribe")
  unsubscribeFromSettings(@ConnectedSocket() socket: Socket) {
    socket.leave("settings");
    socket.emit("settings:unsubscribed", { status: "unsubscribed" });
  }

  // ============= REAL-TIME CALL METRICS =============

  /**
   * Stream call metrics
   * @param metrics Call quality metrics
   */
  streamCallMetrics(callId: string, metrics: {
    jitter?: number;
    latency?: number;
    packetLoss?: number;
    bandwidth?: number;
    quality?: "excellent" | "good" | "fair" | "poor";
  }) {
    this.callMetricsMap.set(callId, metrics);
    this.server.emit("call:metrics", {
      event: "call_metrics",
      callId,
      payload: { ...metrics, timestamp: new Date() },
    });
  }

  /**
   * Emit when call quality degrades
   * @param callId Call ID
   * @param quality Quality status
   */
  emitCallQualityAlert(callId: string, quality: "excellent" | "good" | "fair" | "poor") {
    this.server.emit("call:quality_alert", {
      event: "call_quality_alert",
      callId,
      quality,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage("call:subscribe")
  subscribeToCallMetrics(@ConnectedSocket() socket: Socket, @MessageBody() data: { callId: string }) {
    socket.join(`call:${data.callId}`);
    socket.emit("call:subscribed", { callId: data.callId, status: "subscribed" });
  }

  @SubscribeMessage("call:unsubscribe")
  unsubscribeFromCallMetrics(@ConnectedSocket() socket: Socket, @MessageBody() data: { callId: string }) {
    socket.leave(`call:${data.callId}`);
    socket.emit("call:unsubscribed", { callId: data.callId, status: "unsubscribed" });
  }

  @SubscribeMessage("call:metrics")
  updateCallMetrics(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callId: string; metrics: any }
  ) {
    this.streamCallMetrics(data.callId, data.metrics);
  }

  // ============= STAFF STATUS INDICATORS =============

  /**
   * Register staff as online
   * @param staffId Staff member ID
   */
  staffOnline(staffId: string) {
    this.staffStatusMap.set(staffId, {
      staffId,
      status: "online",
      timestamp: new Date(),
    });

    this.server.emit("staff:status_changed", {
      event: "staff_online",
      staffId,
      status: "online",
      timestamp: new Date(),
    });
  }

  /**
   * Register staff as offline
   * @param staffId Staff member ID
   */
  staffOffline(staffId: string) {
    this.staffStatusMap.delete(staffId);

    this.server.emit("staff:status_changed", {
      event: "staff_offline",
      staffId,
      status: "offline",
      timestamp: new Date(),
    });
  }

  /**
   * Get all online staff members
   */
  getOnlineStaff(): string[] {
    return Array.from(this.staffStatusMap.keys());
  }

  /**
   * Check if staff is online
   */
  isStaffOnline(staffId: string): boolean {
    return this.staffStatusMap.has(staffId);
  }

  @SubscribeMessage("staff:online")
  handleStaffOnline(@ConnectedSocket() socket: Socket, @MessageBody() data: { staffId: string }) {
    this.staffOnline(data.staffId);
    socket.join(`staff:${data.staffId}`);
    socket.emit("staff:status_updated", { 
      staffId: data.staffId, 
      status: "online",
      onlineStaffCount: this.getOnlineStaff().length 
    });
  }

  @SubscribeMessage("staff:offline")
  handleStaffOffline(@ConnectedSocket() socket: Socket, @MessageBody() data: { staffId: string }) {
    this.staffOffline(data.staffId);
    socket.leave(`staff:${data.staffId}`);
    socket.emit("staff:status_updated", { 
      staffId: data.staffId, 
      status: "offline",
      onlineStaffCount: this.getOnlineStaff().length 
    });
  }

  @SubscribeMessage("staff:list")
  listOnlineStaff(@ConnectedSocket() socket: Socket) {
    const onlineStaff = Array.from(this.staffStatusMap.values());
    socket.emit("staff:list", { onlineStaff, count: onlineStaff.length });
  }

  // ============= HELPERS =============

  /**
   * Broadcast to a specific room
   */
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }
}
