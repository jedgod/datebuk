// Admin Video Date Control System - Developer Quick Reference
// Fast integration guide and API cheat sheet

## 🚀 QUICK START (5 minutes)

### 1. Install Dependencies

```bash
# Frontend
cd apps/web
npm install recharts react-hotkeys-hook react-use-websocket

# Backend
cd apps/api
npm install (should already have express, prisma)
```

### 2. Database Setup

```bash
# Add to prisma/schema.prisma (see VIDEO_CONTROL_SCHEMA.prisma)
# Then run:
npx prisma migrate dev --name add_video_control_schema
npx prisma db seed  # Optional: add test data
```

### 3. Register API Routes

```typescript
// In apps/api/src/server.ts
import activeVideoQueue from "./routes/admin/active-video-queue";
import interruptVideo from "./routes/admin/interrupt-video";
import bulkVideoAction from "./routes/admin/bulk-video-action";
import moderatorStats from "./routes/admin/moderator-stats";
import agreementTrend from "./routes/admin/agreement-trend";
import filterPresets from "./routes/admin/filter-presets";

app.use("/api/admin/active-video-queue", activeVideoQueue);
app.use("/api/admin/interrupt-video", interruptVideo);
app.use("/api/admin/bulk-video-action", bulkVideoAction);
app.use("/api/admin/moderator-stats", moderatorStats);
app.use("/api/admin/agreement-trend", agreementTrend);
app.use("/api/admin/filter-presets", filterPresets);
```

### 4. Test It Works

```bash
curl http://localhost:3000/api/admin/active-video-queue?page=1
# Should return: { data: [...], pagination: {...} }
```

**Done!** 🎉 Page works at `/admin/video-date-controls`

---

## 📊 COMPONENT ARCHITECTURE

```
page.tsx (Page Component)
├── State Management
│   ├── items[] (VideoReviewItem[])
│   ├── filters (FilterState)
│   ├── pagination, stats, trendData
│   └── UI state (theme, preview, bulk modal)
│
├── Sidebar (Controls & Stats)
│   ├── Queue stats card
│   ├── Chart (Recharts Area/Line)
│   ├── Filter controls (intent, highRisk, sort)
│   └── Preset management (CRUD)
│
├── Main (Infinite scroll grid)
│   ├── Infinite scroll component
│   ├── Item cards (3-col grid)
│   ├── Selection checkboxes
│   └── Bulk action buttons
│
├── Right panel (Preview)
│   ├── AI scores
│   ├── Chat snippet
│   ├── Action buttons
│   └── Session info
│
└── Modals
    └── Bulk action confirmation
```

---

## 🔌 API ENDPOINTS CHEAT SHEET

### Fetch Sessions

```bash
GET /api/admin/active-video-queue
?page=1
&limit=15
&sortBy=priority|recency|nudity|overall|reports
&dir=asc|desc
&onlyHighRisk=true|false
&intent=Faith|Casual|Professional

Response: { data: VideoReviewItem[], pagination: {page, hasMore, total} }
```

### Interrupt Session(s)

```bash
POST /api/admin/interrupt-video
Body: { ids: string[] }
Response: { success: true, interrupted: number }
```

### Bulk Actions

```bash
POST /api/admin/bulk-video-action
Body: { ids: string[], action: "approve"|"interrupt"|"escalate", reason?: string }
Response: { success: true, action: string, count: number }
```

### Get Stats

```bash
GET /api/admin/moderator-stats
Response: {
  decisionsPerHour: number,
  aiAgreementRate: number,
  fatigueScore: number,
  topViolations: [{category, count}]
}
```

### Get Chart Data

```bash
GET /api/admin/agreement-trend
Response: { data: [{hour, agreementRate, decisions, fatigueLevel}] }
```

### Presets (CRUD)

```bash
GET /api/admin/filter-presets
→ { presets: [{id, name, filters, createdAt}] }

POST /api/admin/filter-presets
Body: { name: string, filters: FilterState }
→ { preset: {...} }

DELETE /api/admin/filter-presets/:id
→ { success: true }
```

---

## 🎮 KEYBOARD SHORTCUTS

| Key   | Action                          | Context             |
| ----- | ------------------------------- | ------------------- |
| `j`   | Next item                       | In queue            |
| `k`   | Previous item                   | In queue            |
| `a`   | Approve selected                | When items selected |
| `f`   | Flag/escalate                   | When items selected |
| `Esc` | Clear selection + close preview | Anywhere            |

---

## 🔌 WEBSOCKET INTEGRATION

### Connect (Already done in page component)

```typescript
const { lastJsonMessage } = useWebSocket("wss://yourdomain.com/ws/video-queue");
```

### Handle Messages

```typescript
useEffect(() => {
  if (lastJsonMessage?.type === "video-flag-update") {
    // New item flagged - add to queue
    const updated = lastJsonMessage.item;
    setItems((prev) => [updated, ...prev]);
  }

  if (lastJsonMessage?.type === "moderator-fatigue-alert") {
    // Show fatigue alert
    setFatigueAlert(lastJsonMessage.message);
  }
}, [lastJsonMessage]);
```

### Emit Events (Server side)

```typescript
// In API route or cron job
io.to("video-queue").emit("video:flag-update", {
  type: "video-flag-update",
  item: newFlaggedSession,
});

io.emit("moderator:fatigue", {
  type: "moderator-fatigue-alert",
  message: "High fatigue detected...",
});
```

---

## 📈 CHART CUSTOMIZATION

### Switch Chart Type

```typescript
<select value={chartType} onChange={e => setChartType(e.target.value)}>
  <option value="area">Area Chart</option>
  <option value="line">Line Chart (Multi-line)</option>
</select>
```

### Add More Lines to Chart

```typescript
{chartType === 'line' ? (
  <LineChart data={trendData}>
    <Line dataKey="agreementRate" stroke="#10B981" name="Agreement %" />
    <Line dataKey="fatigueLevel" stroke="#EF4444" name="Fatigue Level" />
    <Line dataKey="decisions" stroke="#3B82F6" name="Decisions" /> {/* NEW */}
  </LineChart>
) : (...)}
```

### Recolor Area Chart

```typescript
<Area
  dataKey="agreementRate"
  stroke="#10B981"  // Line color
  fill="#10B98133"  // Fill color (hex + opacity)
  strokeWidth={2}
/>
```

---

## 🔐 AUTH INTEGRATION

Add middleware to protect routes:

```typescript
// apps/api/src/middleware/auth.ts
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  // Verify token
  const user = jwt.verify(token, process.env.JWT_SECRET);
  req.user = user;
  next();
}

// Apply to routes
app.use("/api/admin/*", requireAuth);
```

---

## 📤 CSV EXPORT ADDITION

Already implemented! But to customize columns:

```typescript
const headers = [
  "ID",
  "Match ID",
  "Users",
  "Intent",
  "Started",
  "Duration",
  "Nudity %",
  "Audio %",
  "Overall %",
  "Reports",
  "Priority",
  "Status",
  // Add custom headers here:
  "Reviewed By",
  "Review Time",
  "Escalation Reason",
];

const rows = items.map((item) => [
  item.id,
  item.matchId,
  // ... existing fields ...
  // Add custom data:
  item.reviewedBy || "",
  item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : "",
  item.escalationReason || "",
]);
```

---

## 🛠️ COMMON TASKS

### Add a New Filter Option

```typescript
// 1. Update FilterState interface
type FilterState = {
  // ... existing ...
  newFilter?: string  // NEW
}

// 2. Add to filter controls (sidebar)
<select
  value={filters.newFilter || ''}
  onChange={e => setFilters(f => ({ ...f, newFilter: e.target.value }))}
>
  <option value="">All</option>
  <option value="opt1">Option 1</option>
</select>

// 3. Use in API query
const params = new URLSearchParams({
  // ... existing ...
  ...(filters.newFilter && { newFilter: filters.newFilter })
})

// 4. Handle in backend route
if (searchParams.get('newFilter')) {
  where.fieldName = searchParams.get('newFilter')
}
```

### Add a New Bulk Action

```typescript
// 1. Update bulkAction type
type bulkAction = 'approve' | 'interrupt' | 'escalate' | 'newAction'

// 2. Add button in header
<button onClick={() => { setBulkAction('newAction'); setShowBulkModal(true) }}>
  New Action
</button>

// 3. Handle in modal
if (bulkAction === 'newAction') {
  // Handle new action
}

// 4. Post to API
const res = await fetch('/api/admin/bulk-video-action', {
  method: 'POST',
  body: JSON.stringify({ ids: selected, action: 'newAction' })
})
```

### Enable Moderator Fatigue Monitoring

```typescript
// Already integrated! Just make sure:
// 1. Moderator stats endpoint returns fatigueScore
// 2. Frontend displays fatigueAlert
// 3. WebSocket broadcasts moderator-fatigue-alert events

// Optional: Customize thresholds in ModeratorAnalyticsService:
if (score > 85)
  level = "critical"; // Highest threshold
else if (score > 70)
  level = "high"; // Change these numbers
else if (score > 50) level = "medium";
```

---

## 🐛 DEBUGGING TIPS

### Check WebSocket Connection

```javascript
// In browser console
ws = new WebSocket("wss://yourdomain.com/ws/video-queue");
ws.onmessage = (e) => console.log("Received:", JSON.parse(e.data));
ws.onclose = () => console.log("Disconnected");
```

### Test API Manually

```bash
# List all sessions
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/admin/active-video-queue

# Test interrupt
curl -X POST http://localhost:3000/api/admin/interrupt-video \
  -H "Content-Type: application/json" \
  -d '{"ids":["test-id"]}'
```

### Database Inspection

```bash
# Open Prisma Studio
npx prisma studio

# Run raw SQL
npx prisma db execute --stdin
SELECT COUNT(*) FROM ActiveVideoSession WHERE status = 'active';
```

### Browser DevTools

```
1. Network tab: Monitor API calls & WebSocket
2. Console: Watch for errors, test functions
3. Application: Check localStorage (theme, presets)
4. Performance: Monitor for slow renders
```

---

## 📚 DOCUMENTATION FILES

| File                             | Purpose                             |
| -------------------------------- | ----------------------------------- |
| `VIDEO_DATE_CONTROLS_SETUP.md`   | Complete setup guide (10 parts)     |
| `VIDEO_DATE_MONITORING_GUIDE.md` | Monitoring, alerts, troubleshooting |
| This file                        | Quick reference (you are here)      |

---

## ⚠️ COMMON PITFALLS

❌ **Don't:**

- Hardcode domain URLs (use env vars)
- Skip database migrations
- Forget to install recharts
- Call API without proper error handling
- Use localStorage for sensitive data

✅ **Do:**

- Use environment variables for all URLs
- Test migrations on staging first
- Handle WebSocket disconnections gracefully
- Implement proper error boundaries
- Secure authentication on all routes

---

## 🚀 NEXT STEPS

1. **Immediate:** Run quick start above (5 min)
2. **Today:** Deploy to staging, run smoke tests
3. **This week:** Gather moderator feedback
4. **Next week:** Optimize based on usage patterns
5. **Next month:** Phase 2 features (AI Integration, Advanced Analytics)

---

**Updated:** February 19, 2026
**Status:** Production Ready ✅
**Support:** See VIDEO_DATE_CONTROLS_SETUP.md for detailed docs
