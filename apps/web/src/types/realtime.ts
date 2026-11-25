/**
 * Real-time Event Types and Payloads
 * Synced with backend/src/realtime.ts
 */

// Report Events
export interface ReportCreatedEvent {
  type: 'report:created';
  payload: {
    reportId: string;
    userId: string;
    summary: string;
    timestamp: number;
    status: string;
  };
}

export interface ReportUpdatedEvent {
  type: 'report:updated';
  payload: {
    reportId: string;
    updates: Record<string, any>;
    timestamp: number;
    updatedBy: string;
  };
}

export interface ReportAssignedEvent {
  type: 'report:assigned';
  payload: {
    reportId: string;
    staffId: string;
    assignedAt: number;
    assignedBy: string;
  };
}

export interface ReportPriorityChangedEvent {
  type: 'report:priority_changed';
  payload: {
    reportId: string;
    oldPriority: string;
    newPriority: string;
    timestamp: number;
    changedBy: string;
  };
}

// Settings Events
export interface SettingsUpdatedEvent {
  type: 'settings:updated';
  payload: {
    settings: Record<string, any>;
    changedBy: string;
    timestamp: number;
  };
}

export interface SettingCategoryUpdatedEvent {
  type: 'setting:category_updated';
  payload: {
    category: string;
    value: any;
    changedBy: string;
    timestamp: number;
  };
}

// Call Events
export interface CallMetricsEvent {
  type: 'call:metrics';
  payload: {
    callId: string;
    metrics: {
      jitter: number;
      latency: number;
      packetLoss: number;
      bandwidth: number;
      quality: string;
    };
    timestamp: number;
  };
}

export interface CallQualityAlertEvent {
  type: 'call:quality_alert';
  payload: {
    callId: string;
    quality: string;
    reason: string;
    timestamp: number;
  };
}

// Staff Events
export interface StaffOnlineEvent {
  type: 'staff:online';
  payload: {
    staffId: string;
    staffName: string;
    role: string;
    timestamp: number;
  };
}

export interface StaffOfflineEvent {
  type: 'staff:offline';
  payload: {
    staffId: string;
    staffName: string;
    timestamp: number;
  };
}

// Chat Events
export interface ChatMessageEvent {
  type: 'chat:message';
  payload: {
    sessionId: string;
    message: {
      id: string;
      sender: 'user' | 'support';
      senderEmail?: string;
      message: string;
      createdAt: string;
    };
    timestamp: number;
  };
}

export interface ChatSessionStartedEvent {
  type: 'chat:session_started';
  payload: {
    sessionId: string;
    userEmail?: string;
    userName?: string;
    timestamp: number;
  };
}

export interface ChatSessionClosedEvent {
  type: 'chat:session_closed';
  payload: {
    sessionId: string;
    timestamp: number;
  };
}

export interface ChatTypingEvent {
  type: 'chat:typing';
  payload: {
    sessionId: string;
    sender: string;
    timestamp: number;
  };
}

// Connection Event
export interface ConnectedEvent {
  type: 'connected';
  payload: {
    clientId: string;
    timestamp: number;
  };
}

// Union of all event types
export type RealtimeEvent =
  | ReportCreatedEvent
  | ReportUpdatedEvent
  | ReportAssignedEvent
  | ReportPriorityChangedEvent
  | SettingsUpdatedEvent
  | SettingCategoryUpdatedEvent
  | CallMetricsEvent
  | CallQualityAlertEvent
  | StaffOnlineEvent
  | StaffOfflineEvent
  | ChatMessageEvent
  | ChatSessionStartedEvent
  | ChatSessionClosedEvent
  | ChatTypingEvent
  | ConnectedEvent;

// Event type union (just the type field)
export type RealtimeEventType = RealtimeEvent['type'];

// Notification for UI display
export interface Notification {
  id: string;
  type: 'report' | 'settings' | 'call' | 'staff' | 'chat' | 'system';
  title: string;
  message: string;
  timestamp: number;
  icon: 'info' | 'success' | 'warning' | 'error';
  dismissible: boolean;
  actionUrl?: string;
}

// Staff Status
export interface StaffStatus {
  staffId: string;
  staffName: string;
  role: string;
  isOnline: boolean;
  lastSeen: number;
}

// Call Metrics
export interface CallMetrics {
  callId: string;
  jitter: number;
  latency: number;
  packetLoss: number;
  bandwidth: number;
  quality: string;
  lastUpdate: number;
}

// Settings
export interface BroadcastedSettings {
  category?: string;
  settings: Record<string, any>;
  changedBy: string;
  timestamp: number;
}
