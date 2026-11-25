# Backend Changes Summary

## Files Modified

### 1. `src/realtime.ts` (NEW) ✅

- **Purpose:** Real-time events emitter
- **Size:** ~250 lines
- **Functions:**
  - Initialize WebSocket and SSE
  - Broadcast to all clients
  - Emit report events (created, updated, assigned, priority)
  - Broadcast settings
  - Stream call metrics
  - Track staff online/offline status

### 2. `src/index.ts` (UPDATED) ✅

- **Line 7:** Added `import { realtimeEmitter }`
- **Line 38:** Initialize realtime emitter with wss and sseClients
- **Line 121-127:** Added real-time calls to `POST /support/requests`
  - Calls `realtimeEmitter.emitReportCreated(ticket)`
- **Line 137-180:** Added real-time calls to `PATCH /support/requests`
  - Calls appropriate emit functions based on action type
- **Line 190-210:** NEW - `POST /staff/login` endpoint
  - Marks staff as online
  - Calls `realtimeEmitter.staffOnline(staffId)`
- **Line 212-232:** NEW - `POST /staff/logout` endpoint
  - Marks staff as offline
  - Calls `realtimeEmitter.staffOffline(staffId)`
- **Line 234-244:** NEW - `GET /staff/online` endpoint
  - Returns list of online staff
- **Line 246-268:** NEW - `POST /admin/settings/broadcast` endpoint
  - Broadcasts settings to all clients
  - Calls `realtimeEmitter.broadcastSettings()` or `broadcastSettingCategory()`
- **Line 270-292:** NEW - `POST /calls/{callId}/metrics` endpoint
  - Streams call metrics
  - Auto-checks for poor quality and alerts
- **Line 316-320:** WebSocket connection handler
  - Calls `realtimeEmitter.staffOnline()` on connect
  - Calls `realtimeEmitter.staffOffline()` on disconnect
- **Line 322-372:** WebSocket message handler
  - Added real-time event emission for all actions
  - Emits specific events based on action type

## Code Changes Details

### Import Addition

```typescript
import { realtimeEmitter } from "./realtime";
```

### Initialization

```typescript
// Initialize realtime emitter with WebSocket server and SSE clients
realtimeEmitter.initialize(wss, sseClients);
```

### Ticket Creation

```typescript
const ticket = normalizeTicket(body.ticket ?? body);
tickets.unshift(ticket);
// 🔴 NEW: Emit real-time notification
realtimeEmitter.emitReportCreated(ticket);
broadcast("ticket.created", ticket);
```

### Ticket Updates

```typescript
switch (action.action) {
  case "transfer":
    ticket.assignedTo = action.assignedTo;
    // 👤 NEW: Emit assignment event
    realtimeEmitter.emitReportAssigned(ticketId, action.assignedTo);
    break;
  // ... other cases with similar emit calls
}
```

### Staff Login/Logout

```typescript
app.post("/staff/login", requireStaff, (req, res) => {
  const staffId = req.user?.id;
  // 👤 NEW: Emit staff online status
  realtimeEmitter.staffOnline(staffId);
  res.json({
    status: "online",
    staffId,
    onlineStaff: realtimeEmitter.getOnlineStaff(),
  });
});
```

### Settings Broadcast

```typescript
app.post("/admin/settings/broadcast", requireAdmin, (req, res) => {
  const { settings, category } = req.body;
  if (category) {
    // 📢 NEW: Broadcast specific category
    realtimeEmitter.broadcastSettingCategory(category, settings, adminId);
  } else {
    // 📢 NEW: Broadcast all settings
    realtimeEmitter.broadcastSettings(settings, adminId);
  }
});
```

### Call Metrics

```typescript
app.post("/calls/:callId/metrics", requireStaff, (req, res) => {
  // 📊 NEW: Stream call metrics to all clients
  realtimeEmitter.updateCallMetrics(callId, metrics);
  // ⚠️ NEW: Alert if quality is poor
  if (metrics.quality === "poor" || metrics.latency > 200) {
    realtimeEmitter.alertCallQualityIssue(callId, metrics.quality || "poor");
  }
});
```

### WebSocket Connection

```typescript
wss.on("connection", (socket, req) => {
  // ... token verification ...
  // 👤 NEW: Mark staff as online when connected
  realtimeEmitter.staffOnline(payload.id);
  // ...
  socket.on("close", () => {
    // 👤 NEW: Mark staff as offline when disconnected
    realtimeEmitter.staffOffline(payload.id);
  });
});
```

## New API Endpoints

| Method | Endpoint                    | Purpose                           |
| ------ | --------------------------- | --------------------------------- |
| POST   | `/staff/login`              | Mark staff as online              |
| POST   | `/staff/logout`             | Mark staff as offline             |
| GET    | `/staff/online`             | Get list of online staff          |
| POST   | `/admin/settings/broadcast` | Broadcast settings to all clients |
| POST   | `/calls/:callId/metrics`    | Stream call metrics               |

## Events Now Emitted

### From Endpoints

- `POST /support/requests` → `report:created`
- `PATCH /support/requests` → `report:updated` or `report:assigned`
- `POST /staff/login` → `staff:online`
- `POST /staff/logout` → `staff:offline`
- `POST /admin/settings/broadcast` → `settings:updated` or `setting:category_updated`
- `POST /calls/:id/metrics` → `call:metrics` or `call:quality_alert`

### From WebSocket Handler

- Connection → `staff:online`
- Disconnect → `staff:offline`
- Any action → appropriate report event

## Lines of Code Modified

- **src/realtime.ts:** +250 lines (NEW)
- **src/index.ts:** +100 lines of modifications (imports, initialization, new endpoints, event emissions)
- **Total:** ~350 lines added to backend

## Backward Compatibility

✅ All existing endpoints continue to work
✅ Existing `broadcast()` function still called (for legacy clients)
✅ New real-time events sent in parallel (no breaking changes)
✅ All auth checks and validation unchanged

## Testing

To test the integration:

```bash
# 1. Start the backend
cd support-platform/apps/api
npm install
npm run dev

# 2. Create a token
curl -X POST http://localhost:4500/auth/token \
  -d '{"userId":"staff-1"}' -H "Content-Type: application/json"

# 3. Test endpoints
curl -X POST http://localhost:4500/staff/login \
  -H "Authorization: Bearer {token}"

curl -X POST http://localhost:4500/support/requests \
  -H "Authorization: Bearer {token}" \
  -d '{"ticket":{...}}' -H "Content-Type: application/json"

# 4. Open WebSocket and see real-time events
# Check src/realtime.ts console.log statements
```

## Summary

✅ **Backend integration COMPLETE**

- Real-time emitter created and initialized
- All 4 features integrated into API
- New endpoints added for staff status and settings
- WebSocket handlers updated
- Event emission on all relevant actions
- Backward compatible
- Ready for frontend client implementation
