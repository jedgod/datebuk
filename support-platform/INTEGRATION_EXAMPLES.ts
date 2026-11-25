/**
 * Integration Examples - How to use Real-time Features in Support Platform
 * File: src/modules/tickets/tickets.service.ts (example)
 */

import { Injectable } from '@nestjs/common';
import { RealtimeService } from '@/modules/realtime';

@Injectable()
export class TicketsService {
  constructor(private realtimeService: RealtimeService) {}

  // ============= LIVE REPORT NOTIFICATIONS EXAMPLE =============

  async createTicket(ticketData: any) {
    // Save to database
    const ticket = await db.tickets.create(ticketData);

    // 🔴 IMPORTANT: Notify all connected clients in real-time
    this.realtimeService.notifyReportCreated({
      id: ticket.id,
      customer: ticket.customerId,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      assignedTo: null,
    });

    return ticket;
  }

  async assignTicketToStaff(ticketId: string, staffId: string) {
    const ticket = await db.tickets.update(ticketId, { assignedTo: staffId });

    // 🟢 Notify all staff about assignment
    this.realtimeService.notifyReportAssigned(ticketId, staffId);

    return ticket;
  }

  async updateTicketPriority(ticketId: string, priority: 'high' | 'medium' | 'low') {
    const ticket = await db.tickets.update(ticketId, { priority });

    // 🟡 Notify about priority change
    this.realtimeService.notifyPriorityChanged(ticketId, priority);

    return ticket;
  }

  async updateTicket(ticketId: string, updates: any) {
    const ticket = await db.tickets.update(ticketId, updates);

    // 📝 Notify about general updates
    this.realtimeService.notifyReportUpdated(ticketId, updates);

    return ticket;
  }

  // ============= SETTINGS BROADCAST EXAMPLE =============

  // In src/modules/admin/admin-settings.service.ts
  async saveModerationSettings(settings: any, adminId: string) {
    // Save to database
    const saved = await db.settings.update('moderation', settings);

    // 📢 Broadcast to ALL connected clients
    this.realtimeService.broadcastSettings(saved, adminId);

    return saved;
  }

  async updateFeatureFlags(flags: any, adminId: string) {
    const saved = await db.settings.update('features', flags);

    // 📢 Broadcast specific category
    this.realtimeService.broadcastSettingCategory('features', flags, adminId);

    return saved;
  }

  // ============= CALL METRICS STREAMING EXAMPLE =============

  // In src/modules/calls/call-monitor.service.ts
  async startMonitoringCall(callId: string) {
    // Init WebRTC call monitoring
    const callSession = getCallSession(callId);

    // Stream metrics every 5 seconds
    const interval = setInterval(async () => {
      const metrics = await callSession.getQualityMetrics();

      // 📊 Stream metrics to all connected clients
      this.realtimeService.updateCallMetrics(callId, {
        jitter: metrics.jitter,
        latency: metrics.rtt,
        packetLoss: metrics.statsReport.packetLoss,
        bandwidth: metrics.bandwidth,
        quality: this.determineQuality(metrics),
      });

      // ⚠️ Alert if quality drops
      if (metrics.quality === 'poor' || metrics.rtt > 200) {
        this.realtimeService.alertCallQualityIssue(callId, 'poor');
      }
    }, 5000);

    return { callId, monitoringStarted: true };
  }

  private determineQuality(metrics: any): 'excellent' | 'good' | 'fair' | 'poor' {
    const rtt = metrics.rtt;
    const loss = metrics.statsReport.packetLoss;
    const jitter = metrics.jitter;

    if (rtt < 50 && loss < 1 && jitter < 20) return 'excellent';
    if (rtt < 100 && loss < 2 && jitter < 40) return 'good';
    if (rtt < 150 && loss < 5 && jitter < 60) return 'fair';
    return 'poor';
  }

  // ============= STAFF STATUS INDICATORS EXAMPLE =============

  // In src/modules/staff/staff-auth.service.ts
  async staffLogin(staffId: string) {
    // Update login status in DB
    await db.staff.updateStatus(staffId, 'online');

    // 👤 Broadcast online status to ALL clients
    this.realtimeService.markStaffOnline(staffId);

    return { staffId, status: 'online' };
  }

  async staffLogout(staffId: string) {
    // Update logout status in DB
    await db.staff.updateStatus(staffId, 'offline');

    // 👤 Broadcast offline status to ALL clients
    this.realtimeService.markStaffOffline(staffId);

    return { staffId, status: 'offline' };
  }

  async getAvailableStaff(): Promise<string[]> {
    // Get list of online staff members
    return this.realtimeService.getOnlineStaffList();
  }

  async canAssignToStaff(staffId: string): Promise<boolean> {
    // Check if staff member is currently available
    return this.realtimeService.isStaffOnline(staffId);
  }

  // ============= AUTO-ASSIGNMENT EXAMPLE (Uses All Features) =============

  async autoAssignTicket(ticketId: string) {
    // Get available staff members
    const availableStaff = this.realtimeService.getOnlineStaffList();

    if (availableStaff.length === 0) {
      console.log('No staff available, ticket will wait in queue');
      return null;
    }

    // Load balance: assign to staff with fewest tickets
    const staffWorkload = await Promise.all(
      availableStaff.map(async (staffId) => ({
        staffId,
        ticketCount: await db.tickets.countByStaff(staffId),
      }))
    );

    const leastBusy = staffWorkload.reduce((prev, current) =>
      prev.ticketCount < current.ticketCount ? prev : current
    );

    // Assign ticket
    const ticket = await this.assignTicketToStaff(ticketId, leastBusy.staffId);

    // 📢 All features in action:
    // 1. Assignment notification ✅
    // 2. Status update ✅
    // 3. Staff availability check ✅

    return ticket;
  }
}

/**
 * API ROUTE EXAMPLES
 * File: src/routes/tickets.routes.ts
 */

import { Router } from 'express';
import { TicketsService } from '@/modules/tickets/tickets.service';

const router = Router();
const ticketsService = new TicketsService();

// Create ticket (triggers live notification)
router.post('/tickets', async (req, res) => {
  try {
    const ticket = await ticketsService.createTicket(req.body);
    // ✅ All connected clients receive 'report:created' event in real-time
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Assign ticket (triggers assignment notification)
router.patch('/tickets/:id/assign', async (req, res) => {
  try {
    const ticket = await ticketsService.assignTicketToStaff(
      req.params.id,
      req.body.staffId
    );
    // ✅ Assigned staff receives 'report:assigned' event
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update ticket (triggers update notification)
router.patch('/tickets/:id', async (req, res) => {
  try {
    const ticket = await ticketsService.updateTicket(req.params.id, req.body);
    // ✅ All connected clients receive 'report:updated' event
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update settings (triggers settings broadcast)
router.post('/admin/settings/moderation', async (req, res) => {
  try {
    const settings = await ticketsService.saveModerationSettings(
      req.body,
      req.user.id
    );
    // ✅ All connected clients receive 'settings:updated' event
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Staff login (updates status indicator)
router.post('/staff/login', async (req, res) => {
  try {
    const result = await ticketsService.staffLogin(req.user.id);
    // ✅ All connected clients see this staff as 'online'
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Staff logout (updates status indicator)
router.post('/staff/logout', async (req, res) => {
  try {
    const result = await ticketsService.staffLogout(req.user.id);
    // ✅ All connected clients see this staff as 'offline'
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get available staff (uses online status)
router.get('/staff/available', async (req, res) => {
  try {
    const available = await ticketsService.getAvailableStaff();
    res.json({ available, count: available.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Auto-assign ticket (uses all features!)
router.patch('/tickets/:id/auto-assign', async (req, res) => {
  try {
    const ticket = await ticketsService.autoAssignTicket(req.params.id);
    // ✅ Triggers: assignment notification + status update + staff availability
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
