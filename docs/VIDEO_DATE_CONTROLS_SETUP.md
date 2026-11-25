# Admin Video Date Control System - Complete Setup Guide

## Overview

This guide covers the complete implementation of the **Admin Video Date Control System**, a real-time moderation interface for monitoring and managing live video dating sessions with advanced analytics, fatigue detection, and bulk operations.

### Key Features

✅ Real-time video session queue with infinite scroll
✅ AI risk scoring (nudity, audio, overall)
✅ Moderator fatigue detection with alerts
✅ AI agreement rate trend charts (24-hour)
✅ Bulk actions: approve, interrupt, escalate
✅ User-specific filter presets (server-persisted)
✅ CSV export with filtering
✅ Live WebSocket updates
✅ Dark/light theme toggle
✅ Keyboard shortcuts (j/k/a/f/esc)

---

## Architecture Overview

```
Frontend (Next.js React)
├── Page Component (video-date-controls/page.tsx)
├── Infinite Scroll with Skeleton Loading
├── Charts (Recharts: Area/Line)
├── Theme Toggle & Persistence
└── WebSocket Integration (react-use-websocket)

↓ API Routes (Express.js)
├── /api/admin/active-video-queue (GET)
├── /api/admin/interrupt-video (POST)
├── /api/admin/bulk-video-action (POST)
├── /api/admin/moderator-stats (GET)
├── /api/admin/agreement-trend (GET)
└── /api/admin/filter-presets (CRUD)

↓ Service Layer
├── ModeratorAnalyticsService (Fatigue calculation)
├── PresetService (Persistence)
└── VideoSessionService (CRUD)

↓ Database (Prisma)
├── ActiveVideoSession (Live sessions)
├── FilterPreset (User presets)
└── User (Extended metadata)
```

---

## Part 1: Installation & Dependencies

### 1.1 Frontend Dependencies

```bash
cd apps/web

# Core UI components and utilities
npm install react-infinite-scroll-component \
            react-loading-skeleton \
            react-hotkeys-hook \
            react-use-websocket \
            recharts

# Or using pnpm (if in workspace)
pnpm add -D react-infinite-scroll-component react-loading-skeleton react-hotkeys-hook react-use-websocket recharts
```

**Package Versions:**

- `react-infinite-scroll-component`: ^6.1.0
- `react-loading-skeleton`: ^3.4.0
- `react-hotkeys-hook`: ^4.4.0
- `react-use-websocket`: ^4.5.0
- `recharts`: ^2.10.0

### 1.2 Backend Dependencies

```bash
cd apps/api

# Core dependencies (likely already installed)
npm install express prisma

# Additional if needed
npm install aws-sdk dotenv
```

### 1.3 Verify Lucide React Installation

```bash
# Both frontend and backend may use Lucide
npm list lucide-react

# Should output: lucide-react@^0.263.0 or newer
```

---

## Part 2: Database Setup

### 2.1 Prisma Schema Update

Add the following models to `prisma/schema.prisma`:

```prisma
// Active Video Sessions (Live moderation queue)
model ActiveVideoSession {
  id                String    @id @default(cuid())
  matchId           String    @unique
  startedAt         DateTime  @default(now())
  endedAt           DateTime?
  durationSeconds   Int?
  userIds           String[]  @default([])

  // AI Analysis
  aiScores          Json      @default("{\"nudity\":0,\"audio\":0,\"overall\":0}")
  reportCount       Int       @default(0)
  lastMessageSnippet String?
  priority          String    @default("medium")

  // Status
  status            String    @default("active")
  reviewedAt        DateTime?
  interruptedAt     DateTime?
  escalatedAt       DateTime?
  escalationReason  String?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([status])
  @@index([priority])
  @@index([createdAt])
}

// User Filter Presets
model FilterPreset {
  id        String    @id @default(cuid())
  userId    String
  name      String
  filters   Json
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([userId, name])
  @@index([userId])
}
```

### 2.2 Run Migration

```bash
cd apps/api  # or root

# Create migration
npx prisma migrate dev --name add_video_control_schema

# Or push directly (development only)
npx prisma db push
```

### 2.3 Seed Sample Data (Optional)

```bash
npx prisma db seed --skip-generate

# Or manually via Prisma Studio
npx prisma studio
```

Sample data script:

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create sample active sessions
  for (let i = 0; i < 15; i++) {
    await prisma.activeVideoSession.create({
      data: {
        matchId: `match-${Date.now()}-${i}`,
        startedAt: new Date(Date.now() - Math.random() * 3600000),
        userIds: [`user-${i * 2}`, `user-${i * 2 + 1}`],
        aiScores: {
          nudity: Math.round(Math.random() * 100),
          audio: Math.round(Math.random() * 100),
          overall: Math.round(Math.random() * 100),
        },
        priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
        status: ["active", "flagged"][Math.floor(Math.random() * 2)],
        reportCount: Math.floor(Math.random() * 5),
      },
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Part 3: API Routes Setup

### 3.1 Register Routes in Express

Add to your Express app initialization (e.g., `apps/api/src/server.ts`):

```typescript
import activeVideoQueueRouter from "./routes/admin/active-video-queue";
import interruptVideoRouter from "./routes/admin/interrupt-video";
import bulkVideoActionRouter from "./routes/admin/bulk-video-action";
import moderatorStatsRouter from "./routes/admin/moderator-stats";
import agreementTrendRouter from "./routes/admin/agreement-trend";
import filterPresetsRouter from "./routes/admin/filter-presets";

// Mount routes
app.use("/api/admin/active-video-queue", activeVideoQueueRouter);
app.use("/api/admin/interrupt-video", interruptVideoRouter);
app.use("/api/admin/bulk-video-action", bulkVideoActionRouter);
app.use("/api/admin/moderator-stats", moderatorStatsRouter);
app.use("/api/admin/agreement-trend", agreementTrendRouter);
app.use("/api/admin/filter-presets", filterPresetsRouter);
```

### 3.2 API Endpoint Specifications

#### GET /api/admin/active-video-queue

**Query Parameters:**

```
page=1&limit=15&sortBy=priority&dir=desc&onlyHighRisk=true&intent=Faith
```

**Response:**

```json
{
  "data": [
    {
      "id": "cuid",
      "matchId": "match-123",
      "users": [{ "name": "John", "avatar": "url", "intent": "Faith" }],
      "startedAt": "2026-02-19T10:00:00.000Z",
      "durationSec": 1200,
      "aiScores": { "nudity": 85, "audio": 65, "overall": 75 },
      "status": "flagged",
      "reports": 2,
      "priority": "high",
      "chatSnippet": "..."
    }
  ],
  "pagination": { "page": 1, "hasMore": true, "total": 150 }
}
```

**Status Codes:**

- 200: Success
- 400: Invalid parameters
- 500: Server error

---

#### POST /api/admin/interrupt-video

**Body:**

```json
{
  "ids": ["id1", "id2", "id3"]
}
```

**Response:**

```json
{
  "success": true,
  "interrupted": 3
}
```

---

#### POST /api/admin/bulk-video-action

**Body:**

```json
{
  "ids": ["id1", "id2"],
  "action": "approve|interrupt|escalate",
  "reason": "Optional reason for escalation"
}
```

**Response:**

```json
{
  "success": true,
  "action": "approve",
  "count": 2
}
```

---

#### GET /api/admin/moderator-stats

**Response:**

```json
{
  "decisionsPerHour": 18,
  "aiAgreementRate": 87,
  "fatigueScore": 45,
  "topViolations": [
    { "category": "Explicit Content", "count": 12 },
    { "category": "Inappropriate Audio", "count": 8 }
  ],
  "metadata": {
    "reviewedLast24h": 432,
    "currentlyActive": 23,
    "escalatedLast24h": 12,
    "dataRange": "24h"
  }
}
```

---

#### GET /api/admin/agreement-trend

**Response:**

```json
{
  "data": [
    {
      "hour": "00:00",
      "agreementRate": 85,
      "decisions": 12,
      "fatigueLevel": 30
    },
    {
      "hour": "01:00",
      "agreementRate": 88,
      "decisions": 15,
      "fatigueLevel": 35
    }
  ]
}
```

---

#### Filter Presets (CRUD)

**GET /api/admin/filter-presets**

```json
{
  "presets": [
    {
      "id": "preset-1",
      "name": "High Risk Sessions",
      "filters": {
        "sortBy": "priority",
        "direction": "desc",
        "onlyHighRisk": true
      },
      "createdAt": "2026-02-19T10:00:00Z"
    }
  ]
}
```

**POST /api/admin/filter-presets**

```json
{
  "name": "My Preset",
  "filters": { "sortBy": "priority", "direction": "desc", "onlyHighRisk": true }
}
```

**DELETE /api/admin/filter-presets/:id**

- Returns: `{ "success": true, "id": "preset-1" }`

---

## Part 4: WebSocket Integration

### 4.1 Server Setup (Socket.io)

```typescript
// apps/api/src/websocket.ts
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Join video queue room
    socket.on("join:video-queue", () => {
      socket.join("video-queue");
      console.log(`[WebSocket] Joined video-queue: ${socket.id}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Broadcast new flag to all connected clients
export function broadcastVideoFlag(io: SocketIOServer, item: any) {
  io.to("video-queue").emit("video:flag-update", {
    type: "video-flag-update",
    item,
  });
}

// Broadcast fatigue alert
export function broadcastFatigueAlert(io: SocketIOServer, alert: any) {
  io.emit("moderator:fatigue", {
    type: "moderator-fatigue-alert",
    message: alert.message,
    score: alert.score,
  });
}
```

### 4.2 Client Integration

Frontend component already includes WebSocket via `react-use-websocket`:

```typescript
const { lastJsonMessage } = useWebSocket(
  "wss://your-domain.com/ws/video-queue",
  {
    shouldReconnect: () => true,
  },
);

useEffect(() => {
  if (lastJsonMessage?.type === "video-flag-update") {
    // Update items with new flagged session
    const updated = lastJsonMessage.item as VideoReviewItem;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
  }
}, [lastJsonMessage]);
```

### 4.3 Update WebSocket URL

Replace `'wss://your-domain.com/ws/video-queue'` with your actual domain:

```typescript
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/socket.io";
const { lastJsonMessage } = useWebSocket(WS_URL, {
  shouldReconnect: () => true,
});
```

Add to `.env.local`:

```
NEXT_PUBLIC_WS_URL=wss://yourdomain.com/socket.io
```

---

## Part 5: Moderator Fatigue Alerts

### 5.1 Service Integration

The `ModeratorAnalyticsService` provides real-time fatigue detection:

```typescript
import { moderatorAnalyticsService } from "@/services/moderatorAnalyticsService";

// In your API route or cron job
const fatigueAlert =
  await moderatorAnalyticsService.calculateFatigueScore(userId);

if (fatigueAlert.level === "critical" || fatigueAlert.level === "high") {
  broadcastFatigueAlert(io, fatigueAlert);
}
```

### 5.2 Fatigue Score Calculation

- **Decision Velocity** (reviews/hour): 0-35 points
- **Request Spike** (hourly surge): 0-20 points
- **Escalation Rate**: 0-30 points
- **Review Time**: 0-15 points
- **Break Duration**: 0-25 points

**Levels:**

- **Critical** (85-100): Immediate break required
- **High** (70-84): Break recommended soon
- **Medium** (50-69): Monitor performance
- **Low** (0-49): Normal fatigue levels

### 5.3 Monitoring Endpoint

Create optional monitoring dashboard:

```typescript
// GET /api/admin/moderator-performance
const report = await moderatorAnalyticsService.generateFatigueReport([
  "user1",
  "user2",
  "user3",
]);
```

---

## Part 6: Testing

### 6.1 Test with cURL

```bash
# Fetch active queue
curl "http://localhost:3000/api/admin/active-video-queue?page=1&limit=10&onlyHighRisk=true"

# Interrupt sessions
curl -X POST http://localhost:3000/api/admin/interrupt-video \
  -H "Content-Type: application/json" \
  -d "{\"ids\":[\"id1\",\"id2\"]}"

# Bulk action
curl -X POST http://localhost:3000/api/admin/bulk-video-action \
  -H "Content-Type: application/json" \
  -d "{\"ids\":[\"id1\"],\"action\":\"approve\"}"

# Get stats
curl http://localhost:3000/api/admin/moderator-stats

# Get trends
curl http://localhost:3000/api/admin/agreement-trend

# Save preset
curl -X POST http://localhost:3000/api/admin/filter-presets \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"High Risk\",\"filters\":{\"sortBy\":\"priority\",\"direction\":\"desc\",\"onlyHighRisk\":true}}"
```

### 6.2 Sample Test Data Generation

```typescript
// Generate realistic test sessions
async function generateTestSessions(count: number) {
  const intents = ["Faith", "Casual", "Professional"];

  for (let i = 0; i < count; i++) {
    await prisma.activeVideoSession.create({
      data: {
        matchId: `test-${Date.now()}-${i}`,
        startedAt: new Date(Date.now() - Math.random() * 3600000),
        userIds: [`u${i * 2}`, `u${i * 2 + 1}`],
        lastMessageSnippet: "Test message content...",
        aiScores: {
          nudity: Math.floor(Math.random() * 100),
          audio: Math.floor(Math.random() * 100),
          overall: Math.floor(Math.random() * 100),
        },
        priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
        status: ["active", "flagged", "reviewed"][
          Math.floor(Math.random() * 3)
        ],
      },
    });
  }
}
```

---

## Part 7: Advanced Features

### 7.1 CSV Export Enhancement

Current export includes:

- ID, Match ID, Users, Intent
- Started Time, Duration
- AI Scores (nudity, audio, overall)
- Reports, Priority, Status
- Last Message

To add more columns:

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
  "Last Message",
  // NEW COLUMNS:
  "Reviewed Status",
  "Review Time",
  "Escalation Reason",
];

// Modify data mapping to include new fields
```

### 7.2 Chart Customization (Recharts)

The component supports both Area and Line charts. To add more visualizations:

```typescript
// Multi-line comparison
<LineChart data={trendData}>
  <Line dataKey="agreementRate" stroke="#10B981" />
  <Line dataKey="fatigueLevel" stroke="#EF4444" />
  <Line dataKey="decisions" stroke="#3B82F6" />
</LineChart>

// Stacked bar chart (decisions vs escalations)
<BarChart data={trendData}>
  <Bar dataKey="decisions" stackId="a" fill="#10B981" />
  <Bar dataKey="escalations" stackId="a" fill="#EF4444" />
</BarChart>
```

### 7.3 Preset Persistence Options

Currently presets are stored in **database** (recommended). To use **localStorage** instead:

```typescript
// Switch from server to localStorage
useEffect(() => {
  const saved = localStorage.getItem("video-presets");
  if (saved) setPresets(JSON.parse(saved));
}, []);

const savePreset = () => {
  const updated = [
    ...presets,
    { id: Date.now().toString(), name: presetName, filters },
  ];
  setPresets(updated);
  localStorage.setItem("video-presets", JSON.stringify(updated));
};
```

---

## Part 8: Production Deployment

### 8.1 Environment Variables

```env
# .env or .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_WS_URL=wss://yourdomain.com/socket.io

# Optional
MODERATOR_FATIGUE_CHECK_INTERVAL=300000  # Check every 5 min
MAX_DECISIONS_PER_HOUR=30  # Alert if exceeded
```

### 8.2 Performance Optimization

**Database Indexes:**

```sql
CREATE INDEX idx_active_video_status ON ActiveVideoSession(status);
CREATE INDEX idx_active_video_priority ON ActiveVideoSession(priority);
CREATE INDEX idx_active_video_reviewed_at ON ActiveVideoSession(reviewedAt);
```

**API Caching:**

```typescript
// Cache moderator stats for 60 seconds
const stats = await cache.get("moderator-stats", () => calculateStats(), 60000);
```

**Pagination:**

- Default limit: 15 items
- Max limit: 100 items
- Cursor-based for large datasets (optional)

### 8.3 Monitoring & Alerting

Set up alerts for:

- API response times > 1s
- WebSocket disconnections
- Fatigue scores > 85 (critical)
- Escalation rate > 30%
- Database query times > 500ms

---

## Part 9: Troubleshooting

| Issue                        | Solution                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| WebSocket fails to connect   | Check CORS config, verify domain in env, test connectivity   |
| Charts don't render          | Ensure recharts is installed, verify data structure matches  |
| Presets not saving           | Check database connection, verify user auth middleware       |
| CSV export empty             | Verify items array is populated, check data mapping          |
| Fatigue alerts never trigger | Check service integration, verify moderator activity logging |
| API 404 on routes            | Verify routes registered in Express, check path spelling     |

---

## Part 10: Future Enhancements

- [ ] Add detailed moderation decision logging
- [ ] Integrate with video service (Agora/Twilio) for actual interruption
- [ ] Multi-moderator team stats dashboard
- [ ] A/B testing framework for AI model improvements
- [ ] Custom alert thresholds per moderator
- [ ] Session replay/recording features
- [ ] Integration with user reputation system
- [ ] Automated content analysis (Rekognition/Google Vision)
- [ ] Moderator training module with feedback
- [ ] Export to security incident management system

---

## Quick Start Command

```bash
# One-time setup
npm install
npx prisma migrate dev --name add_video_control_schema
npm run dev

# Then navigate to: http://localhost:3000/admin/video-date-controls
```

---

**Last Updated:** February 19, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅

For issues or questions, refer to the inline code comments and API documentation above.
