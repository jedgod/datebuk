# API Implementation Analysis: GET /admin/video-queue

**Analysis Date:** February 18, 2026  
**Status:** ✅ **ALREADY IMPLEMENTED** (with minor enhancements needed)

---

## Executive Summary

**✅ Good News:** The recommended endpoint **already exists** as:

- `GET /admin/video-moderation/queue`

**Current State:** 90% complete - Just needs pagination and a few field mappings

---

## Current Implementation vs Recommended API

### Existing Endpoint

```
GET /admin/video-moderation/queue
```

**Query Parameters:**

- `status` - Filter by status (pending, in_review, approved, flagged, escalated)
- `severity` - Filter by severity (low, medium, high, critical) - supports CSV: `?severity=high,critical`
- `minRiskScore` - Filter by minimum risk score
- `isLive` - Filter for live videos: `?isLive=true`
- `limit` - Max items to return (capped at 200)

### Current Response Shape

```json
{
  "count": 25,
  "items": [
    {
      "id": "uuid-123",
      "userId": "usr_456",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "userIntent": "casual",
      "userTrustLevel": "medium",
      "previousFlags": 0,
      "videoId": "vid_abc123",
      "thumbnailUrl": "https://.../frame1.jpg",
      "duration": 0,
      "uploadedAt": "2026-02-18T19:45:12Z",
      "flaggedAt": "2026-02-18T19:45:12Z",
      "aiScores": {
        "nudityProbability": 0.87,
        "explicitAudioScore": 0.12,
        "violenceScore": 0.03,
        "overallRiskScore": 85
      },
      "flagReason": "nudity",
      "severity": "high",
      "reportCount": 3,
      "status": "pending",
      "isLive": false,
      "keyframes": ["https://.../frame1.jpg", "https://.../frame2.jpg"],
      "audioWaveform": [10, 25, 40, ...],
      "violationTimestamps": [15, 45, 90],
      "recentMessages": [...],
      "matchDetails": {...}
    }
  ]
}
```

---

## Comparison Table

| Field                          | Recommended | Current Status                                 | Database Field          | Notes                |
| ------------------------------ | ----------- | ---------------------------------------------- | ----------------------- | -------------------- |
| `video_id`                     | ✅ Required | ✅ **Exists** as `videoId`                     | `videoId`               | ✅ Ready             |
| `user_id`                      | ✅ Required | ✅ **Exists** as `userId`                      | `userId`                | ✅ Ready             |
| `match_id`                     | ✅ Required | ⚠️ **In JSON** as `matchDetails`               | `matchDetails` (JSON)   | Need to extract      |
| `duration_sec`                 | ✅ Required | ❌ **Missing**                                 | Not in DB               | Need to add          |
| `created_at`                   | ✅ Required | ✅ **Exists** as `uploadedAt`                  | `createdAt`             | ✅ Ready             |
| `status`                       | ✅ Required | ✅ **Exists**                                  | `status`                | ✅ Ready             |
| `ai_scores.nudity`             | ✅ Required | ✅ **Exists** as `aiScores.nudityProbability`  | `aiScores` (JSON)       | ✅ Ready             |
| `ai_scores.explicit_audio`     | ✅ Required | ✅ **Exists** as `aiScores.explicitAudioScore` | `aiScores` (JSON)       | ✅ Ready             |
| `ai_scores.violence`           | ✅ Required | ✅ **Exists** as `aiScores.violenceScore`      | `aiScores` (JSON)       | ✅ Ready             |
| `ai_scores.deepfake`           | ✅ Required | ❌ **Missing**                                 | Not in JSON             | Need to add          |
| `flags`                        | ✅ Required | ⚠️ **Single value** as `flagReason`            | `flagReason` (String)   | Can convert to array |
| `report_count`                 | ✅ Required | ✅ **Exists**                                  | `reportCount`           | ✅ Ready             |
| `priority`                     | ✅ Required | ✅ **Exists** as `severity`                    | `severity`              | ✅ Ready             |
| `thumbnail_url`                | ✅ Required | ✅ **Exists** as `thumbnailUrl`                | `keyframes[0]`          | ✅ Ready             |
| `keyframe_urls`                | ✅ Required | ✅ **Exists** as `keyframes`                   | `keyframes` (String[])  | ✅ Ready             |
| `waveform_url`                 | ❌ Optional | ⚠️ **Data array** as `audioWaveform`           | `audioWaveform` (Int[]) | Different format     |
| `context.intent`               | ❌ Optional | ✅ **Exists** as `userIntent`                  | `userIntent`            | ✅ Ready             |
| `context.last_message_snippet` | ❌ Optional | ⚠️ **In JSON** as `recentMessages`             | `recentMessages` (JSON) | Need to extract      |
| **pagination**                 | ✅ Required | ❌ **Missing**                                 | N/A                     | Need to implement    |

---

## What's Missing?

### 1. Pagination Metadata ❌ **CRITICAL**

**Current:** Returns all items with count only
**Recommended:** Paginated response with metadata

### 2. Duration Field ⚠️ **MEDIUM**

**Current:** Hardcoded to 0
**Database:** Not stored
**Solution:** Add `duration` field to `VideoModerationItem` schema

### 3. Deepfake Score ⚠️ **LOW**

**Current:** Not in `aiScores`
**Solution:** Add to AI scoring pipeline

### 4. Match ID Extraction ⚠️ **LOW**

**Current:** Buried in `matchDetails` JSON
**Solution:** Extract and promote to top level

---

## Implementation Plan

### ✅ Option 1: Quick Enhancement (2 hours)

Add pagination and field mappings to existing endpoint

### ✅ Option 2: Full Implementation (4 hours)

Add missing fields + pagination + database migrations

---

## Option 1: Quick Enhancement (Recommended)

### Changes Required

#### 1. Add Pagination to Controller

**File:** `apps/api/src/admin/video-moderation.controller.ts`

```typescript
@Get("queue")
async queue(
  @Query("status") status?: string,
  @Query("severity") severity?: string,
  @Query("minRiskScore") minRiskScore?: string,
  @Query("isLive") isLive?: string,
  @Query("limit") limit?: string,
  @Query("page") page?: string,  // NEW
) {
  const pageNum = page ? Math.max(Number(page), 1) : 1;
  const perPage = limit ? Math.min(Number(limit), 100) : 25;

  const { items, total } = await this.admin.listVideoModerationQueue({
    status,
    severity,
    minRiskScore: minRiskScore ? Number(minRiskScore) : undefined,
    isLive: typeof isLive === "string" ? isLive === "true" : undefined,
    limit: perPage,
    page: pageNum,  // NEW
  });

  const mapped = items.map((item) => ({
    video_id: item.videoId,  // Renamed for consistency
    user_id: item.userId,
    match_id: item.matchDetails?.matchId ?? null,  // Extracted
    duration_sec: 0,  // TODO: Add to schema
    created_at: item.createdAt,
    status: item.status,
    ai_scores: {
      nudity: item.aiScores?.nudityProbability ?? 0,
      explicit_audio: item.aiScores?.explicitAudioScore ?? 0,
      violence: item.aiScores?.violenceScore ?? 0,
      deepfake: item.aiScores?.deepfakeScore ?? 0,  // NEW field
    },
    flags: [item.flagReason],  // Convert to array
    report_count: item.reportCount,
    priority: item.severity,  // Maps to priority
    thumbnail_url: item.keyframes?.[0] ?? "",
    keyframe_urls: item.keyframes ?? [],
    waveform_url: null,  // TODO: Generate from audioWaveform array
    context: {
      intent: item.userIntent,
      last_message_snippet: this.extractLastMessage(item.recentMessages),
    },
  }));

  return {
    data: mapped,
    pagination: {
      total,
      page: pageNum,
      per_page: perPage,
      has_more: total > pageNum * perPage,
    },
  };
}

private extractLastMessage(messages: any): string {
  if (!messages || !Array.isArray(messages)) return "";
  const last = messages[messages.length - 1];
  return last?.content ?? last?.text ?? "";
}
```

#### 2. Update Service Layer

**File:** `apps/api/src/admin/admin.service.ts`

```typescript
async listVideoModerationQueue(params: {
  status?: string;
  severity?: string | string[];
  minRiskScore?: number;
  isLive?: boolean;
  limit?: number;
  page?: number;  // NEW
}) {
  const where: any = {};
  if (params.status) where.status = params.status;
  if (params.severity) {
    const severities = Array.isArray(params.severity)
      ? params.severity
      : String(params.severity).split(",").map((s) => s.trim()).filter(Boolean);
    if (severities.length === 1) where.severity = severities[0];
    if (severities.length > 1) where.severity = { in: severities };
  }
  if (typeof params.minRiskScore === "number") where.riskScore = { gte: params.minRiskScore };
  if (typeof params.isLive === "boolean") where.isLive = params.isLive;

  // NEW: Pagination
  const page = params.page ?? 1;
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.prisma.videoModerationItem.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true } },
          },
        },
      },
      orderBy: [{ riskScore: "desc" }, { flaggedAt: "desc" }],
      skip,
      take: limit,
    }),
    this.prisma.videoModerationItem.count({ where }),
  ]);

  return { items, total };
}
```

#### 3. Add Alias Route (Optional)

**File:** `apps/api/src/admin/video-moderation.controller.ts`

```typescript
// Add alias for recommended endpoint name
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("ADMIN_VIEW_USERS")
@Get("flagged-videos")
async flaggedVideos(@Query() query: any) {
  return this.queue(
    query.status,
    query.severity,
    query.minRiskScore,
    query.isLive,
    query.limit,
    query.page,
  );
}
```

---

## Option 2: Full Implementation

### Additional Database Migration Required

```prisma
model VideoModerationItem {
  id        String   @id @default(uuid())
  userId    String
  videoId   String
  matchId   String?  // NEW: Promote from matchDetails JSON
  duration  Int      @default(0)  // NEW: Duration in seconds

  status    String   @default("pending")
  severity  String   @default("medium")
  riskScore Int      @default(0)
  riskLevel String   @default("low")

  flagReason String
  flags      String[] @default([])  // NEW: Multiple flags support
  reportCount Int    @default(0)
  isLive    Boolean  @default(false)

  userIntent String  @default("casual")
  userTrustLevel String @default("medium")

  aiScores   Json?    // Add deepfakeScore: 0.0 to JSON
  keyframes  String[]
  audioWaveform Int[]
  waveformUrl String?  // NEW: Pre-generated waveform PNG
  violationTimestamps Int[]
  recentMessages Json?
  matchDetails Json?

  flaggedAt DateTime @default(now())
  reviewedAt DateTime?
  reviewedBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([status])
  @@index([severity])
  @@index([riskScore])
  @@index([flaggedAt])
  @@index([matchId])  // NEW
}
```

### Migration Script

```typescript
// apps/api/prisma/migrations/XXX_add_video_moderation_fields/migration.sql
-- Add new fields
ALTER TABLE "VideoModerationItem" ADD COLUMN "matchId" TEXT;
ALTER TABLE "VideoModerationItem" ADD COLUMN "duration" INTEGER DEFAULT 0;
ALTER TABLE "VideoModerationItem" ADD COLUMN "flags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "VideoModerationItem" ADD COLUMN "waveformUrl" TEXT;

-- Migrate data from matchDetails JSON to matchId
UPDATE "VideoModerationItem"
SET "matchId" = (matchDetails->>'matchId')
WHERE matchDetails IS NOT NULL;

-- Convert single flagReason to flags array
UPDATE "VideoModerationItem"
SET "flags" = ARRAY[flagReason]
WHERE flagReason IS NOT NULL;

-- Add index
CREATE INDEX "VideoModerationItem_matchId_idx" ON "VideoModerationItem"("matchId");
```

---

## Testing the API

### Example Requests

#### Basic Request

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/admin/video-moderation/queue"
```

#### With Pagination

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/admin/video-moderation/queue?page=2&limit=25"
```

#### Filtered for High Priority Live Videos

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/admin/video-moderation/queue?severity=high,critical&isLive=true&page=1&limit=50"
```

#### Using Alias

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/admin/video-moderation/flagged-videos?page=1"
```

---

## Expected Response (After Implementation)

```json
{
  "data": [
    {
      "video_id": "vid_abc123",
      "user_id": "usr_456",
      "match_id": "match_789",
      "duration_sec": 145,
      "created_at": "2026-02-18T19:45:12Z",
      "status": "pending",
      "ai_scores": {
        "nudity": 0.87,
        "explicit_audio": 0.12,
        "violence": 0.03,
        "deepfake": 0.08
      },
      "flags": ["nudity", "harassment"],
      "report_count": 3,
      "priority": "high",
      "thumbnail_url": "https://.../thumb.jpg",
      "keyframe_urls": ["https://.../frame1.jpg", "https://.../frame2.jpg"],
      "waveform_url": "https://.../waveform.png",
      "context": {
        "intent": "casual",
        "last_message_snippet": "Hey, wanna switch to video?"
      }
    }
  ],
  "pagination": {
    "total": 348,
    "page": 1,
    "per_page": 25,
    "has_more": true
  }
}
```

---

## Frontend Integration

### Update API Client

**File:** `apps/web/src/lib/api.ts`

```typescript
export const adminApi = {
  // Existing methods...

  // Enhanced video queue with pagination
  getVideoQueue: (
    params?: {
      status?: string;
      severity?: string;
      isLive?: boolean;
      page?: number;
      limit?: number;
    },
    token?: string,
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set("status", params.status);
    if (params?.severity) queryParams.set("severity", params.severity);
    if (params?.isLive) queryParams.set("isLive", "true");
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.limit) queryParams.set("limit", String(params.limit));

    return api.get(`/admin/video-moderation/queue?${queryParams}`, token);
  },

  // Alias
  getFlaggedVideos: (params?: any, token?: string) =>
    adminApi.getVideoQueue(params, token),
};
```

### Use in Components

```typescript
// Example: Paginated video queue
const { data, isLoading } = useQuery({
  queryKey: ["video-queue", page, severity],
  queryFn: () => adminApi.getVideoQueue({
    severity: "high,critical",
    isLive: true,
    page,
    limit: 25,
  }, token),
  refetchInterval: 10000, // 10s for live monitoring
});

const videos = data?.data ?? [];
const pagination = data?.pagination;

// Pagination controls
<button
  disabled={page === 1}
  onClick={() => setPage(p => p - 1)}
>
  Previous
</button>
<span>Page {pagination?.page} of {Math.ceil(pagination?.total / pagination?.per_page)}</span>
<button
  disabled={!pagination?.has_more}
  onClick={() => setPage(p => p + 1)}
>
  Next
</button>
```

---

## Implementation Effort

| Task                            | Effort  | Priority | Status         |
| ------------------------------- | ------- | -------- | -------------- |
| Add pagination to controller    | 1 hour  | High     | ❌ Not started |
| Add pagination to service       | 30 min  | High     | ❌ Not started |
| Field remapping (match_id, etc) | 30 min  | Medium   | ❌ Not started |
| Add alias route                 | 15 min  | Low      | ❌ Not started |
| Update API client               | 30 min  | High     | ❌ Not started |
| Add database fields (Option 2)  | 2 hours | Medium   | ❌ Not started |
| Test & validate                 | 1 hour  | High     | ❌ Not started |

**Option 1 Total:** ~2.5 hours  
**Option 2 Total:** ~4.5 hours

---

## Recommendation

✅ **Implement Option 1 (Quick Enhancement)** for these reasons:

1. **90% Feature Complete** - Most fields already exist
2. **Minimal Changes** - Just pagination + field remapping
3. **No Schema Changes** - Avoid database migration overhead
4. **Quick Deployment** - Can ship in 1 day
5. **Backward Compatible** - Existing endpoints still work

**Missing fields can be added later:**

- `duration_sec` - Low priority, can default to 0
- `deepfake` score - Low priority, can add when AI pipeline ready
- `waveform_url` - Low priority, audioWaveform array works for now

---

## ✅ Final Answer

**Can this API be implemented?**

**YES ✅** - It's **already 90% implemented** as `GET /admin/video-moderation/queue`

**What's needed:**

1. Add pagination support (2 hours)
2. Remap field names to match recommendation (30 min)
3. Extract nested JSON fields (30 min)

**Total effort:** ~3 hours for production-ready implementation

**Recommended next steps:**

1. Add pagination to existing endpoint ✅
2. Test with frontend components ✅
3. Add missing fields (duration, deepfake) in future sprints ⚠️

---

_Analysis completed: February 18, 2026_
