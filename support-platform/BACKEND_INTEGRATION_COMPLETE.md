# Real-time Features - Backend Integration Complete ✅

## Overview

All 4 real-time features have been fully integrated into the backend API (`support-platform/apps/api/src/`):

1. ✅ **Live Report Notifications**
2. ✅ **Settings Broadcast**
3. ✅ **Real-time Call Metrics**
4. ✅ **Staff Status Indicators**

## Files Modified/Created

### New Files

- `src/realtime.ts` - Realtime emitter (integrates with Express WebSocket)

### Modified Files

- `src/index.ts` - Main backend file with:
  - Realtime emitter initialization
  - Staff login/logout endpoints
  - Settings broadcast endpoint
  - Call metrics endpoint
  - WebSocket handlers with event emission

## API Endpoints Added

### Staff Status Endpoints

**Staff Login** - Mark staff as online

```bash
POST /staff/login
Authorization: Bearer {token}
Response: { status: "online", staffId, onlineStaff: [...], timestamp }
```

**Staff Logout** - Mark staff as offline

```bash
POST /staff/logout
Authorization: Bearer {token}
Response: { status: "offline", staffId, onlineStaff: [...], timestamp }
```

**Get Online Staff** - List all online staff members

```bash
GET /staff/online
Authorization: Bearer {token}
Response: { onlineStaff: [...], staffList: [...], count: number }
```

### Settings Broadcast Endpoint

**Broadcast Settings** - Send settings to all connected clients

```bash
POST /admin/settings/broadcast
Authorization: Bearer {admin-token}
Body: {
  "settings": { ... },
  "category": "moderation" // optional
}
Response: { message: "Settings broadcasted", category, timestamp }
```

### Call Metrics Endpoint

**Update Call Metrics** - Stream call quality metrics

```bash
POST /calls/{callId}/metrics
Authorization: Bearer {token}
Body: {
  "metrics": {
    "jitter": 25.5,
    "latency": 50,
    "packetLoss": 0.2,
    "bandwidth": 1500,
    "quality": "good"
  }
}
Response: { callId, message: "Metrics streamed", timestamp }
```

## Automatic Real-time Events

### When Creating Ticket

```
POST /support/requests
→ Emits: "report:created" to all connected clients
```

Example:

```bash
curl -X POST http://localhost:4500/support/requests \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": {
      "customer": "John Doe",
      "priority": "High",
      "status": "Pending"
    }
  }'
# Connected clients instantly receive: report:created event
```

### When Updating Ticket Status

```
PATCH /support/requests
Action: "start_chat" → Emits: "report:updated"
Action: "resolve" → Emits: "report:updated"
```

### When Assigning Ticket

```
PATCH /support/requests
Action: "transfer" → Emits: "report:assigned"
```

### When Adding Notes

```
PATCH /support/requests
Action: "add_note" → Emits: "report:updated"
Action: "priority_note" → Emits: "report:updated"
```

### When Staff Connects/Disconnects WebSocket

```
WebSocket connection → Emits: "staff:online"
WebSocket disconnect → Emits: "staff:offline"
```

## Real-time Events Reference

All events are sent to connected clients in this format:

```json
{
  "event": "event:name",
  "payload": { ... },
  "timestamp": "2026-02-18T..."
}
```

### Report Events

| Event                     | When             | Payload                                   |
| ------------------------- | ---------------- | ----------------------------------------- |
| `report:created`          | Ticket created   | `{ id, customer, status, priority, ... }` |
| `report:updated`          | Ticket updated   | `{ reportId, updates }`                   |
| `report:assigned`         | Ticket assigned  | `{ reportId, staffId }`                   |
| `report:priority_changed` | Priority changed | `{ reportId, priority }`                  |

### Settings Events

| Event                      | When                 | Payload               |
| -------------------------- | -------------------- | --------------------- |
| `settings:updated`         | Any settings updated | `{ ...settings }`     |
| `setting:category_updated` | Category updated     | `{ category, value }` |

### Call Events

| Event                | When             | Payload               |
| -------------------- | ---------------- | --------------------- |
| `call:metrics`       | Metrics updated  | `{ callId, metrics }` |
| `call:quality_alert` | Quality degrades | `{ callId, quality }` |

### Staff Events

| Event           | When               | Payload                    |
| --------------- | ------------------ | -------------------------- |
| `staff:online`  | Staff goes online  | `{ staffId, onlineCount }` |
| `staff:offline` | Staff goes offline | `{ staffId, onlineCount }` |

## How It Works

### 1. Realtime Emitter (`src/realtime.ts`)

The `realtimeEmitter` is a singleton that:

- Broadcasts to ALL connected WebSocket clients
- Broadcasts to ALL SSE stream clients
- Tracks staff online/offline status
- Stores call metrics data

### 2. Backend Integration (`src/index.ts`)

Changes made:

1. **Import realtime emitter** at the top
2. **Initialize** with WebSocket server and SSE clients
3. **Call emitter methods** when:
   - Tickets are created → `realtimeEmitter.emitReportCreated(ticket)`
   - Tickets are updated → `realtimeEmitter.emitReportUpdated(id, update)`
   - Tickets are assigned → `realtimeEmitter.emitReportAssigned(id, staffId)`
   - Staff logs in → `realtimeEmitter.staffOnline(staffId)`
   - Staff logs out → `realtimeEmitter.staffOffline(staffId)`
   - Settings change → `realtimeEmitter.broadcastSettings(...)`
   - Call metrics arrive → `realtimeEmitter.updateCallMetrics(...)`

### 3. WebSocket Handler

When a staff member connects via WebSocket:

1. Token is verified
2. Staff marked as online: `realtimeEmitter.staffOnline(staffId)`
3. When staff disconnects: `realtimeEmitter.staffOffline(staffId)`
4. All actions (create, update, assign, etc.) emit real-time events

## Usage Examples

### Create Ticket (Auto-broadcasts)

```typescript
// Backend automatically emits "report:created"
POST /support/requests
{
  "ticket": {
    "customer": "Jane Smith",
    "priority": "High",
    "status": "Pending"
  }
}
// ✅ All connected clients receive: report:created event
```

### Update Ticket

```typescript
// Backend automatically emits "report:updated"
PATCH /support/requests
{
  "action": "add_note",
  "ticketId": "abc-123",
  "note": "Customer called, issue resolved"
}
// ✅ All clients receive: report:updated event
```

### Assign Ticket

```typescript
// Backend automatically emits "report:assigned"
PATCH /support/requests
{
  "action": "transfer",
  "ticketId": "abc-123",
  "assignedTo": "staff-456"
}
// ✅ All clients receive: report:assigned event
```

### Staff Login

```bash
# Backend automatically marks as online
POST /staff/login
Authorization: Bearer {token}
# ✅ All clients receive: staff:online event
```

### Broadcast Settings

```bash
# Admin broadcasts new settings
POST /admin/settings/broadcast
Authorization: Bearer {admin-token}
{
  "settings": {
    "maxTicketsPerStaff": 10,
    "responseTimeLimit": 300
  },
  "category": "moderation"
}
# ✅ All clients receive: setting:category_updated event
```

### Stream Call Metrics

```bash
# During a call, send metrics periodically
POST /calls/call-123/metrics
Authorization: Bearer {token}
{
  "metrics": {
    "jitter": 25.5,
    "latency": 50,
    "packetLoss": 0.2,
    "bandwidth": 1500,
    "quality": "good"
  }
}
# ✅ All clients receive: call:metrics event
# ⚠️ If quality is "poor", also emits: call:quality_alert
```

## Testing Checklist

### 1. Start Backend

```bash
cd support-platform/apps/api
npm install
npm run dev
```

### 2. Test Endpoints

```bash
# Create token
curl -X POST http://localhost:4500/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId": "staff-1", "role": "staff"}'

# Staff login
curl -X POST http://localhost:4500/staff/login \
  -H "Authorization: Bearer {token}"

# Create ticket (should emit report:created)
curl -X POST http://localhost:4500/support/requests \
  -H "Authorization: Bearer {token}" \
  -d '{"ticket": {...}}'

# Broadcast settings
curl -X POST http://localhost:4500/admin/settings/broadcast \
  -H "Authorization: Bearer {admin-token}" \
  -d '{"settings": {...}}'

# Send call metrics
curl -X POST http://localhost:4500/calls/call-1/metrics \
  -H "Authorization: Bearer {token}" \
  -d '{"metrics": {...}}'

# Staff logout
curl -X POST http://localhost:4500/staff/logout \
  -H "Authorization: Bearer {token}"
```

### 3. Verify Real-time Events

Open WebSocket connection:

```javascript
const ws = new WebSocket("ws://localhost:4500/support/ws?token={token}");
ws.onmessage = (event) => {
  console.log("Event:", JSON.parse(event.data));
};
```

Then trigger events above - should see them in console.

## Architecture Diagram

```
┌─────────────────────────────────────┐
│       Express API Server            │
│   (support-platform/apps/api)       │
├─────────────────────────────────────┤
│                                     │
│  POST /support/requests             │
│  → normalizeTicket()                │
│  → realtimeEmitter.emitReportCreated│
│  ✅ Broadcasts to all clients       │
│                                     │
│  PATCH /support/requests            │
│  → Update ticket status/assign      │
│  → realtimeEmitter.emitReportUpdated│
│  ✅ Broadcasts to all clients       │
│                                     │
│  POST /staff/login                  │
│  → realtimeEmitter.staffOnline()    │
│  ✅ Broadcasts to all clients       │
│                                     │
│  POST /admin/settings/broadcast     │
│  → realtimeEmitter.broadcastSettings│
│  ✅ Broadcasts to all clients       │
│                                     │
│  POST /calls/:id/metrics            │
│  → realtimeEmitter.updateCallMetrics│
│  ✅ Broadcasts to all clients       │
│                                     │
├─────────────────────────────────────┤
│    Realtime Emitter (realtime.ts)   │
│                                     │
│  ✓ Tracks staff online/offline      │
│  ✓ Stores call metrics              │
│  ✓ Broadcasts via WebSocket         │
│  ✓ Broadcasts via SSE               │
│                                     │
├─────────────────────────────────────┤
│   Connected Clients (All receive)    │
│                                     │
│  ✓ report:created                   │
│  ✓ report:updated                   │
│  ✓ report:assigned                  │
│  ✓ settings:updated                 │
│  ✓ call:metrics                     │
│  ✓ staff:online/offline             │
│                                     │
└─────────────────────────────────────┘
```

## What's Next

1. ✅ Backend implementation complete
2. ⏭️ Frontend WebSocket client implementation
3. ⏭️ React components to display real-time updates
4. ⏭️ Mobile app WebSocket client
5. ⏭️ Load testing (50+ concurrent connections)
6. ⏭️ Production deployment

## Summary

✅ **Backend real-time features are LIVE**

- All endpoints integrated
- All events automatically emitted
- WebSocket handlers updated
- Staff status tracking enabled
- Call metrics streaming ready
- Settings broadcast functional
- Ready for frontend consumption

**See:** `WEBSOCKET_REALTIME_GUIDE.md` for client implementation
