# Support Platform Real-time Features

This guide explains how to use the WebSocket real-time features implemented for the support platform.

## Overview

The support platform now includes 4 real-time features:

1. **Live Report Notifications** - Get instant notifications when tickets/reports are created, updated, or assigned
2. **Settings Broadcast** - All connected clients receive settings updates in real-time
3. **Real-time Call Metrics** - Stream call quality metrics (jitter, latency, packet loss, bandwidth)
4. **Staff Status Indicators** - Track which staff members are online/offline

## WebSocket Connection

**URL:** `ws://localhost:4500/support/ws`
**Namespace:** `/`

### Connect with Token

```javascript
const socket = io("http://localhost:4500", {
  path: "/support/ws",
  auth: {
    token: "your-jwt-token",
  },
});

socket.on("connected", (data) => {
  console.log("Connected with client ID:", data.clientId);
});
```

## Feature 1: Live Report Notifications

### Subscribe to Reports

```javascript
// Subscribe to all report events
socket.emit("report:subscribe");

// Listen for new reports
socket.on("report:created", (data) => {
  console.log("New report:", data.payload);
  // {
  //   event: "report_created",
  //   payload: { id, customer, status, priority, ... },
  //   timestamp: "2026-02-18T..."
  // }
});

// Listen for updated reports
socket.on("report:updated", (data) => {
  console.log("Report updated:", data.reportId, data.payload);
});

// Listen for assignments
socket.on("report:assigned", (data) => {
  console.log("Report assigned to:", data.staffId);
});

// Listen for priority changes
socket.on("report:priority_changed", (data) => {
  console.log("Priority changed to:", data.priority);
});
```

### Unsubscribe from Reports

```javascript
socket.emit("report:unsubscribe");
```

## Feature 2: Settings Broadcast

### Subscribe to Settings Changes

```javascript
// Subscribe to all settings changes
socket.emit("settings:subscribe");

// Listen for any settings update
socket.on("settings:updated", (data) => {
  console.log("Settings updated:", data.payload);
  console.log("Changed by:", data.changedBy);
  // {
  //   event: "settings_updated",
  //   payload: { ... },
  //   changedBy: "admin-user-id",
  //   timestamp: "2026-02-18T..."
  // }
});

// Listen for specific category updates
socket.on("setting:category_updated", (data) => {
  console.log(`${data.category} updated:`, data.payload);
  // Categories: "moderation", "features", "safety", etc.
});
```

### Broadcast Settings (Server-side, in API)

```typescript
import { RealtimeService } from '@/modules/realtime';

constructor(private realtimeService: RealtimeService) {}

updateSettings(settings: any, userId: string) {
  // ... save to database ...

  // Broadcast to all connected clients
  this.realtimeService.broadcastSettings(settings, userId);
}

updateModerationSettings(moderationSettings: any, userId: string) {
  // Broadcast specific category
  this.realtimeService.broadcastSettingCategory(
    'moderation',
    moderationSettings,
    userId
  );
}
```

## Feature 3: Real-time Call Metrics

### Subscribe to Call Metrics

```javascript
const callId = "call-12345";

// Subscribe to specific call metrics
socket.emit("call:subscribe", { callId });

// Listen for metrics updates
socket.on("call:metrics", (data) => {
  console.log("Call metrics:", data.payload);
  // {
  //   event: "call_metrics",
  //   callId: "call-12345",
  //   payload: {
  //     jitter: 25.5,        // ms
  //     latency: 50,         // ms
  //     packetLoss: 0.2,     // %
  //     bandwidth: 1500,     // kbps
  //     quality: "good",     // excellent | good | fair | poor
  //     timestamp: "2026-02-18T..."
  //   }
  // }
});

// Listen for quality alerts
socket.on("call:quality_alert", (data) => {
  console.warn("Call quality issue:", data.quality);
});
```

### Emit Call Metrics (Client-side)

```javascript
const callMetrics = {
  jitter: 25.5,
  latency: 50,
  packetLoss: 0.2,
  bandwidth: 1500,
  quality: "good",
};

socket.emit("call:metrics", {
  callId: "call-12345",
  metrics: callMetrics,
});
```

### Stream Call Metrics (Server-side)

```typescript
import { RealtimeService } from '@/modules/realtime';

constructor(private realtimeService: RealtimeService) {}

// In your call monitoring service
monitorCallQuality(callId: string) {
  setInterval(() => {
    const metrics = getCallMetrics(callId);

    // Stream metrics to all connected clients
    this.realtimeService.updateCallMetrics(callId, {
      jitter: metrics.jitter,
      latency: metrics.latency,
      packetLoss: metrics.packetLoss,
      bandwidth: metrics.bandwidth,
      quality: metrics.quality
    });

    // Alert if quality degrades
    if (metrics.quality === 'poor') {
      this.realtimeService.alertCallQualityIssue(callId, 'poor');
    }
  }, 5000); // Every 5 seconds
}
```

### Unsubscribe from Call Metrics

```javascript
socket.emit("call:unsubscribe", { callId });
```

## Feature 4: Staff Status Indicators

### Subscribe to Staff Status Changes

```javascript
// Subscribe to all staff status changes
socket.on("staff:status_changed", (data) => {
  console.log(`Staff ${data.staffId} is now ${data.status}`);
  // {
  //   event: "staff_online" | "staff_offline",
  //   staffId: "staff-123",
  //   status: "online" | "offline",
  //   timestamp: "2026-02-18T..."
  // }
});

// Get list of online staff
socket.emit("staff:list");
socket.on("staff:list", (data) => {
  console.log("Online staff:", data.onlineStaff);
  console.log("Count:", data.count);
  // {
  //   onlineStaff: [
  //     { staffId: "s1", status: "online", timestamp: "..." },
  //     { staffId: "s2", status: "online", timestamp: "..." }
  //   ],
  //   count: 2
  // }
});
```

### Update Staff Status (From Staff Client)

```javascript
const staffId = "staff-123";

// Mark as online
socket.emit("staff:online", { staffId });
socket.on("staff:status_updated", (data) => {
  console.log(`You are now ${data.status}`);
  console.log(`Online staff count: ${data.onlineStaffCount}`);
});

// Mark as offline (on disconnect or logout)
socket.emit("staff:offline", { staffId });
```

### Track Staff Status (Server-side)

```typescript
import { RealtimeService } from '@/modules/realtime';

constructor(private realtimeService: RealtimeService) {}

staffLogin(staffId: string) {
  this.realtimeService.markStaffOnline(staffId);
}

staffLogout(staffId: string) {
  this.realtimeService.markStaffOffline(staffId);
}

checkStaffAvailability(staffId: string): boolean {
  return this.realtimeService.isStaffOnline(staffId);
}

getAvailableStaff(): string[] {
  return this.realtimeService.getOnlineStaffList();
}
```

## Complete Example: Report Dashboard

```javascript
import { io } from "socket.io-client";

class SupportDashboard {
  constructor(token) {
    this.socket = io("http://localhost:4500", {
      path: "/support/ws",
      auth: { token },
    });
    this.setupListeners();
  }

  setupListeners() {
    // Connected
    this.socket.on("connected", (data) => {
      console.log("Dashboard connected");
      this.subscribeToAll();
    });

    // Report notifications
    this.socket.on("report:created", (data) => {
      console.log("📨 New report:", data.payload);
      this.addReportToList(data.payload);
    });

    this.socket.on("report:updated", (data) => {
      console.log("✏️ Report updated:", data.reportId);
      this.updateReportInList(data.reportId, data.payload);
    });

    // Settings broadcast
    this.socket.on("settings:updated", (data) => {
      console.log("⚙️ Settings updated");
      this.applySettings(data.payload);
    });

    // Call metrics
    this.socket.on("call:metrics", (data) => {
      this.updateCallMetricsDisplay(data.callId, data.payload);
    });

    // Staff status
    this.socket.on("staff:status_changed", (data) => {
      console.log(`👤 ${data.staffId} is ${data.status}`);
      this.updateStaffStatusDisplay(data.staffId, data.status);
    });
  }

  subscribeToAll() {
    this.socket.emit("report:subscribe");
    this.socket.emit("settings:subscribe");
    this.socket.emit("staff:list");
  }

  disconnect() {
    this.socket.disconnect();
  }

  // UI update methods
  addReportToList(report) {
    /* ... */
  }
  updateReportInList(id, updates) {
    /* ... */
  }
  applySettings(settings) {
    /* ... */
  }
  updateCallMetricsDisplay(callId, metrics) {
    /* ... */
  }
  updateStaffStatusDisplay(staffId, status) {
    /* ... */
  }
}
```

## Error Handling

```javascript
socket.on("error", (error) => {
  console.error("WebSocket error:", error);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
  // Attempt to reconnect
  setTimeout(() => {
    socket.connect();
  }, 5000);
});
```

## Testing

### Test Live Notifications

```bash
# Open two browser tabs with the dashboard
# In one tab, create a new report via API:
curl -X POST http://localhost:4500/support/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": {
      "customer": "John Doe",
      "priority": "High",
      "status": "Pending"
    }
  }'

# Both tabs should receive the notification immediately
```

### Test Settings Broadcast

```bash
# Update settings in API
# All connected clients should receive update instantly
```

### Test Call Metrics

```bash
# During a call, emit metrics periodically
socket.emit('call:metrics', {
  callId: 'call-1',
  metrics: {
    latency: 50,
    quality: 'good'
  }
});
```

### Test Staff Status

```bash
# Staff logs in
socket.emit('staff:online', { staffId: 'staff-1' });

# Query online staff
socket.emit('staff:list');
```

## Best Practices

1. **Always unsubscribe** when leaving a room to avoid memory leaks
2. **Handle connection errors** gracefully with retry logic
3. **Debounce frequent updates** (e.g., call metrics) to avoid overwhelming clients
4. **Use specific rooms** instead of broadcasting to all when possible
5. **Validate token** before allowing WebSocket connections
6. **Clean up on disconnect** (staff going offline, etc.)
7. **Monitor connection count** to detect issues

## Migration from Old System

If you were using the old Express WebSocket:

**OLD:**

```javascript
socket.on("ticket.created", (ticket) => {
  /* ... */
});
```

**NEW:**

```javascript
socket.on("report:created", (data) => {
  const ticket = data.payload;
  /* ... */
});
```

The new system uses a consistent envelope with `event`, `payload`, and `timestamp`.
