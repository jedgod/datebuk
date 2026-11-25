# Frontend WebSocket Real-time Integration Guide

## Overview

This guide covers the complete frontend implementation of real-time features for the support platform. All components are built with React/TypeScript using Zustand for state management.

## Quick Start

### 1. Add Notification Center to Your Layout

The notification center should be added once in your root layout to display all real-time notifications:

```tsx
// app/layout.tsx
import { RealtimeNotificationCenter } from "@/components/realtime";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <RealtimeNotificationCenter position="top-right" maxNotifications={5} />
      </body>
    </html>
  );
}
```

### 2. Use Components in Your Pages

```tsx
// app/dashboard/page.tsx
import {
  StaffStatusDisplay,
  CallMetricsDashboard,
  NotificationPanel,
  SettingsUpdateHandler,
} from "@/components/realtime";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <StaffStatusDisplay />
      </div>
      <div>{/* Main content */}</div>
      <div className="space-y-4">
        <NotificationPanel />
        <CallMetricsDashboard />
      </div>
    </div>
  );
}
```

## Components Reference

### RealtimeNotificationCenter

Displays toast-style notifications from real-time events.

**Props:**

- `position`: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' (default: 'top-right')
- `maxNotifications`: number (default: 5)

**Example:**

```tsx
<RealtimeNotificationCenter position="top-right" maxNotifications={3} />
```

---

### NotificationPanel

Dashboard widget showing all notifications in a panel.

**Example:**

```tsx
<NotificationPanel />
```

---

### StaffStatusDisplay

Shows online/offline status of all support staff.

**Props:**

- `showOnlineOnly`: boolean (default: false)
- `maxDisplay`: number (default: 10)
- `compact`: boolean (default: false)

**Examples:**

```tsx
// Full display
<StaffStatusDisplay />

// Online staff only, compact
<StaffStatusDisplay showOnlineOnly={true} compact={true} />

// Show top 5 staff
<StaffStatusDisplay maxDisplay={5} />
```

---

### OnlineStaffIndicator

Small badge showing count of online staff.

**Example:**

```tsx
<OnlineStaffIndicator /> {/* Shows: "5 online" */}
```

---

### StaffQuickList

Quick list of online staff (sidebar component).

**Example:**

```tsx
<StaffQuickList />
```

---

### CallMetricsDashboard

Displays real-time call quality metrics.

**Props:**

- `maxDisplay`: number (default: 5)
- `compact`: boolean (default: false)

**Metrics displayed:**

- Latency (ms)
- Jitter (ms)
- Packet Loss (%)
- Bandwidth (kbps)
- Quality Level (excellent/good/fair/poor)

**Example:**

```tsx
<CallMetricsDashboard maxDisplay={5} />
```

---

### CallQualityIndicator

Small badge for a specific call's quality.

**Example:**

```tsx
<CallQualityIndicator callId="call-123" />
```

---

### MetricsSummary

Summary statistics of all active calls.

**Example:**

```tsx
<MetricsSummary />
```

---

### SettingsUpdateHandler

Handles admin settings broadcasts and applies them automatically.

**Props:**

- `onSettingsUpdate`: (settings, category) => void
- `autoApply`: boolean (default: true)
- `showNotification`: boolean (default: true)

**Example:**

```tsx
<SettingsUpdateHandler
  autoApply={true}
  onSettingsUpdate={(settings, category) => {
    console.log("Settings updated:", category, settings);
  }}
/>
```

---

### SettingsBadge

Shows when settings are being broadcasted.

**Example:**

```tsx
<SettingsBadge /> {/* Shows: "Settings Broadcasted" */}
```

---

### SettingsSyncStatus

Shows the status of settings synchronization.

**Example:**

```tsx
<SettingsSyncStatus />
```

---

## Hooks Reference

### useRealtime()

Main hook to initialize WebSocket connection.

**Returns:**

```typescript
{
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  subscribe: (event: string, handler: (data: any) => void) => () => void;
  isConnected: boolean;
}
```

**Example:**

```tsx
function MyComponent() {
  const { isConnected, emit, subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe("staff:online", (data) => {
      console.log("Staff online:", data);
    });

    return unsubscribe;
  }, [subscribe]);

  return <div>Status: {isConnected ? "Connected" : "Disconnected"}</div>;
}
```

---

### useRealtimeEvent()

Subscribe to a specific event type.

**Example:**

```tsx
function MyComponent() {
  useRealtimeEvent("report:created", (payload) => {
    console.log("New report:", payload);
  });

  return <div>Listening for new reports...</div>;
}
```

---

### useStaffStatus()

Get the status of a specific staff member.

**Example:**

```tsx
function StaffCard({ staffId }) {
  const status = useStaffStatus(staffId);

  return (
    <div>
      <h3>{status?.staffName}</h3>
      <p>{status?.isOnline ? "Online" : "Offline"}</p>
    </div>
  );
}
```

---

### useCallMetrics()

Get metrics for a specific call.

**Example:**

```tsx
function CallDisplay({ callId }) {
  const metrics = useCallMetrics(callId);

  return (
    <div>
      <p>Latency: {metrics?.latency}ms</p>
      <p>Quality: {metrics?.quality}</p>
    </div>
  );
}
```

---

## Store Reference

### useRealtimeStore()

Direct access to the realtime state store.

**Available methods:**

- `addNotification(notification)` - Add a notification
- `removeNotification(id)` - Remove a notification
- `clearNotifications()` - Clear all notifications
- `updateStaffStatus(status)` - Update staff status
- `updateMultipleStaffStatus(statuses)` - Update multiple staff statuses
- `getStaffStatus(staffId)` - Get status of specific staff
- `isStaffOnline(staffId)` - Check if staff is online
- `updateCallMetrics(metrics)` - Update call metrics
- `getCallMetrics(callId)` - Get metrics for specific call
- `removeCallMetrics(callId)` - Remove call metrics
- `updateSettings(settings)` - Update settings
- `setConnected(connected)` - Set connection status
- `setConnectionError(error)` - Set connection error
- `processEvent(event)` - Process a real-time event

**Example:**

```tsx
function MyComponent() {
  const { notifications, addNotification, staffStatusMap, isConnected } =
    useRealtimeStore();

  const handleAdd = () => {
    addNotification({
      type: "system",
      title: "Test",
      message: "This is a test",
      icon: "info",
      dismissible: true,
    });
  };

  return (
    <div>
      <button onClick={handleAdd}>Add Notification</button>
      <p>Notifications: {notifications.length}</p>
      <p>Connected: {isConnected ? "Yes" : "No"}</p>
    </div>
  );
}
```

---

## Real-time Events

### Report Events

**report:created** - New report/ticket created

```json
{
  "reportId": "uuid",
  "userId": "string",
  "summary": "string",
  "timestamp": 1629876543210,
  "status": "string"
}
```

**report:updated** - Report details updated

```json
{
  "reportId": "uuid",
  "updates": {},
  "timestamp": 1629876543210,
  "updatedBy": "string"
}
```

**report:assigned** - Report assigned to staff

```json
{
  "reportId": "uuid",
  "staffId": "string",
  "assignedAt": 1629876543210,
  "assignedBy": "string"
}
```

**report:priority_changed** - Report priority changed

```json
{
  "reportId": "uuid",
  "oldPriority": "string",
  "newPriority": "string",
  "timestamp": 1629876543210,
  "changedBy": "string"
}
```

---

### Settings Events

**settings:updated** - Any settings updated

```json
{
  "settings": {},
  "changedBy": "string",
  "timestamp": 1629876543210
}
```

**setting:category_updated** - Specific category updated

```json
{
  "category": "string",
  "value": {},
  "changedBy": "string",
  "timestamp": 1629876543210
}
```

---

### Call Events

**call:metrics** - Call metrics update

```json
{
  "callId": "string",
  "metrics": {
    "jitter": 15.5,
    "latency": 45.2,
    "packetLoss": 0.3,
    "bandwidth": 2500,
    "quality": "good"
  },
  "timestamp": 1629876543210
}
```

**call:quality_alert** - Call quality degraded

```json
{
  "callId": "string",
  "quality": "poor",
  "reason": "High packet loss detected",
  "timestamp": 1629876543210
}
```

---

### Staff Events

**staff:online** - Staff member logged in

```json
{
  "staffId": "string",
  "staffName": "string",
  "role": "string",
  "timestamp": 1629876543210
}
```

**staff:offline** - Staff member logged out

```json
{
  "staffId": "string",
  "staffName": "string",
  "timestamp": 1629876543210
}
```

---

## Integration Patterns

### Pattern 1: Sidebar with Real-time Status

```tsx
function Sidebar() {
  return (
    <div className="w-64 bg-white border-r p-4 space-y-4">
      <OnlineStaffIndicator />
      <StaffQuickList />
      <hr />
      <NotificationBadge />
    </div>
  );
}
```

### Pattern 2: Dashboard Grid

```tsx
function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <StaffStatusDisplay />
      </div>
      <div>{/* Main content */}</div>
      <div className="space-y-4">
        <NotificationPanel />
        <CallMetricsDashboard />
      </div>
    </div>
  );
}
```

### Pattern 3: Ticket Detail with Real-time

```tsx
function TicketDetail({ ticketId, assignedStaffId, callId }) {
  const staffStatus = useStaffStatus(assignedStaffId);
  const callMetrics = useCallMetrics(callId);

  return (
    <div className="space-y-4">
      <h1>Ticket {ticketId}</h1>

      {staffStatus && (
        <div className="p-3 bg-gray-50 rounded">
          Staff: {staffStatus.staffName}
          <span
            className={
              staffStatus.isOnline ? "text-green-600" : "text-gray-600"
            }
          >
            {staffStatus.isOnline ? "● Online" : "● Offline"}
          </span>
        </div>
      )}

      {callMetrics && (
        <div className="p-3 bg-blue-50 rounded">
          Call Quality: {callMetrics.quality}
          Latency: {callMetrics.latency}ms
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: Admin Settings Panel

```tsx
function AdminSettings() {
  return (
    <div className="space-y-4">
      <h2>Admin Settings</h2>

      <SettingsUpdateHandler
        autoApply={false}
        onSettingsUpdate={(settings, category) => {
          console.log(`Settings updated: ${category}`, settings);
        }}
      />

      <SettingsSyncStatus />
    </div>
  );
}
```

---

## Performance Tips

1. **Use selective components** - Only render components you need
2. **Memoize callbacks** - Use `useCallback` for event handlers
3. **Limit max displays** - Use `maxDisplay` prop to limit rendered items
4. **Compact mode** - Use `compact` prop for lightweight views
5. **Unsubscribe properly** - Always clean up event subscriptions

---

## Troubleshooting

### Connection Issues

If WebSocket connection fails:

1. Check backend is running on correct port (4500)
2. Verify JWT token is valid
3. Check browser console for connection errors
4. Ensure CORS is configured correctly

```tsx
const { isConnected, connectionError } = useRealtimeStore((s) => ({
  isConnected: s.isConnected,
  connectionError: s.connectionError,
}));

if (!isConnected) {
  return <div>Error: {connectionError}</div>;
}
```

### Events Not Received

1. Ensure you've called `useRealtime()` in parent component
2. Check that events are being emitted from backend
3. Verify event type matches handler subscription

---

## File Structure

```
src/
├── components/realtime/
│   ├── index.ts
│   ├── RealtimeNotificationCenter.tsx
│   ├── StaffStatusDisplay.tsx
│   ├── CallMetricsDashboard.tsx
│   ├── SettingsUpdateHandler.tsx
│   └── INTEGRATION_EXAMPLES.ts
├── hooks/
│   └── useRealtime.ts
├── stores/
│   └── realtime.ts
└── types/
    └── realtime.ts
```

---

## Next Steps

1. ✅ Frontend WebSocket client created
2. ✅ React components implemented
3. ✅ Zustand store for state management
4. ⏭️ **Integrate into your existing pages**
5. ⏭️ **Test with backend real-time events**
6. ⏭️ **Deploy to production**

---

**Last Updated:** February 18, 2026
**Status:** Production Ready
