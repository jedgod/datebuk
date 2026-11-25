/**
 * Zustand Store for Real-time Features
 * Manages notifications, staff status, call metrics, and settings
 */

import { create } from 'zustand';
import {
  RealtimeEvent,
  Notification,
  StaffStatus,
  CallMetrics,
  BroadcastedSettings,
} from '@/types/realtime';

interface RealtimeStore {
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Staff Status
  staffStatusMap: Map<string, StaffStatus>;
  onlineStaff: string[];
  offlineStaff: string[];
  updateStaffStatus: (status: StaffStatus) => void;
  updateMultipleStaffStatus: (statuses: StaffStatus[]) => void;
  getStaffStatus: (staffId: string) => StaffStatus | undefined;
  isStaffOnline: (staffId: string) => boolean;

  // Call Metrics
  callMetricsMap: Map<string, CallMetrics>;
  updateCallMetrics: (metrics: CallMetrics) => void;
  getCallMetrics: (callId: string) => CallMetrics | undefined;
  removeCallMetrics: (callId: string) => void;

  // Settings
  broadcastedSettings: BroadcastedSettings | null;
  updateSettings: (settings: BroadcastedSettings) => void;

  // Connection Status
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  connectionError: string | null;
  setConnectionError: (error: string | null) => void;

  // Event Processing
  lastEventTimestamp: number;
  processEvent: (event: RealtimeEvent) => void;
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  // Notifications
  notifications: [],
  addNotification: (notification) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
    // Auto-dismiss after 10 seconds if dismissible
    if (notification.dismissible) {
      setTimeout(() => {
        get().removeNotification(id);
      }, 10000);
    }
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  clearNotifications: () => {
    set({ notifications: [] });
  },

  // Staff Status
  staffStatusMap: new Map(),
  onlineStaff: [],
  offlineStaff: [],
  updateStaffStatus: (status) => {
    set((state) => {
      const newMap = new Map(state.staffStatusMap);
      newMap.set(status.staffId, status);

      // Update online/offline lists
      const onlineList = Array.from(newMap.values())
        .filter((s) => s.isOnline)
        .map((s) => s.staffId);
      const offlineList = Array.from(newMap.values())
        .filter((s) => !s.isOnline)
        .map((s) => s.staffId);

      return {
        staffStatusMap: newMap,
        onlineStaff: onlineList,
        offlineStaff: offlineList,
      };
    });
  },
  updateMultipleStaffStatus: (statuses) => {
    set((state) => {
      const newMap = new Map(state.staffStatusMap);
      statuses.forEach((status) => {
        newMap.set(status.staffId, status);
      });

      const onlineList = Array.from(newMap.values())
        .filter((s) => s.isOnline)
        .map((s) => s.staffId);
      const offlineList = Array.from(newMap.values())
        .filter((s) => !s.isOnline)
        .map((s) => s.staffId);

      return {
        staffStatusMap: newMap,
        onlineStaff: onlineList,
        offlineStaff: offlineList,
      };
    });
  },
  getStaffStatus: (staffId) => {
    return get().staffStatusMap.get(staffId);
  },
  isStaffOnline: (staffId) => {
    const status = get().staffStatusMap.get(staffId);
    return status?.isOnline ?? false;
  },

  // Call Metrics
  callMetricsMap: new Map(),
  updateCallMetrics: (metrics) => {
    set((state) => {
      const newMap = new Map(state.callMetricsMap);
      newMap.set(metrics.callId, metrics);
      return { callMetricsMap: newMap };
    });
  },
  getCallMetrics: (callId) => {
    return get().callMetricsMap.get(callId);
  },
  removeCallMetrics: (callId) => {
    set((state) => {
      const newMap = new Map(state.callMetricsMap);
      newMap.delete(callId);
      return { callMetricsMap: newMap };
    });
  },

  // Settings
  broadcastedSettings: null,
  updateSettings: (settings) => {
    set({ broadcastedSettings: settings });
  },

  // Connection Status
  isConnected: false,
  setConnected: (connected) => {
    set({ isConnected: connected });
  },
  connectionError: null,
  setConnectionError: (error) => {
    set({ connectionError: error });
  },

  // Event Processing
  lastEventTimestamp: 0,
  processEvent: (event) => {
    const store = get();

    switch (event.type) {
      case 'report:created':
        store.addNotification({
          type: 'report',
          title: 'New Report',
          message: `New report created: ${event.payload.summary}`,
          icon: 'info',
          dismissible: true,
          actionUrl: `/support/reports/${event.payload.reportId}`,
        });
        break;

      case 'report:updated':
        store.addNotification({
          type: 'report',
          title: 'Report Updated',
          message: `Report has been updated`,
          icon: 'info',
          dismissible: true,
          actionUrl: `/support/reports/${event.payload.reportId}`,
        });
        break;

      case 'report:assigned':
        store.addNotification({
          type: 'report',
          title: 'Report Assigned',
          message: `Report assigned to staff member`,
          icon: 'success',
          dismissible: true,
          actionUrl: `/support/reports/${event.payload.reportId}`,
        });
        break;

      case 'report:priority_changed':
        store.addNotification({
          type: 'report',
          title: 'Priority Changed',
          message: `Report priority changed to ${event.payload.newPriority}`,
          icon: 'warning',
          dismissible: true,
        });
        break;

      case 'settings:updated':
        store.updateSettings({
          settings: event.payload.settings,
          changedBy: event.payload.changedBy,
          timestamp: event.payload.timestamp,
        });
        store.addNotification({
          type: 'settings',
          title: 'Settings Updated',
          message: 'System settings have been updated',
          icon: 'info',
          dismissible: true,
        });
        break;

      case 'setting:category_updated':
        store.updateSettings({
          category: event.payload.category,
          settings: { [event.payload.category]: event.payload.value },
          changedBy: event.payload.changedBy,
          timestamp: event.payload.timestamp,
        });
        break;

      case 'staff:online':
        store.updateStaffStatus({
          staffId: event.payload.staffId,
          staffName: event.payload.staffName,
          role: event.payload.role,
          isOnline: true,
          lastSeen: event.payload.timestamp,
        });
        store.addNotification({
          type: 'staff',
          title: 'Staff Online',
          message: `${event.payload.staffName} is now online`,
          icon: 'success',
          dismissible: true,
        });
        break;

      case 'staff:offline':
        store.updateStaffStatus({
          staffId: event.payload.staffId,
          staffName: event.payload.staffName,
          role: '',
          isOnline: false,
          lastSeen: event.payload.timestamp,
        });
        store.addNotification({
          type: 'staff',
          title: 'Staff Offline',
          message: `${event.payload.staffName} is now offline`,
          icon: 'info',
          dismissible: true,
        });
        break;

      case 'call:metrics':
        store.updateCallMetrics({
          callId: event.payload.callId,
          jitter: event.payload.metrics.jitter,
          latency: event.payload.metrics.latency,
          packetLoss: event.payload.metrics.packetLoss,
          bandwidth: event.payload.metrics.bandwidth,
          quality: event.payload.metrics.quality,
          lastUpdate: event.payload.timestamp,
        });
        break;

      case 'call:quality_alert':
        store.addNotification({
          type: 'call',
          title: 'Call Quality Alert',
          message: `Call quality degraded: ${event.payload.reason}`,
          icon: 'warning',
          dismissible: true,
          actionUrl: `/calls/${event.payload.callId}`,
        });
        break;

      case 'connected':
        store.setConnected(true);
        store.setConnectionError(null);
        break;
    }

    set({ lastEventTimestamp: Date.now() });
  },
}));

// Selectors for common queries
export const useNotifications = () => useRealtimeStore((s) => s.notifications);
export const useOnlineStaff = () => useRealtimeStore((s) => s.onlineStaff);
export const useOfflineStaff = () => useRealtimeStore((s) => s.offlineStaff);
export const useCallMetricsMap = () => useRealtimeStore((s) => s.callMetricsMap);
export const useIsConnected = () => useRealtimeStore((s) => s.isConnected);
export const useBroadcastedSettings = () => useRealtimeStore((s) => s.broadcastedSettings);
