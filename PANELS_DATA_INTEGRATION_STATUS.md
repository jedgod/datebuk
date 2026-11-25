# Admin Panels - Data Integration Status Report

**Date:** February 18, 2026  
**Status:** Mixed (API endpoints ready, but frontend using mock data)

---

## 🎯 Executive Summary

The admin dashboard has a **dual-layer architecture**:

- ✅ **Backend API**: Real endpoints with database integration (Prisma)
- ⚠️ **Frontend Panels**: Currently displaying mock data instead of API responses

### Current Situation

**Backend (API)** ✅ READY

- Real database queries via Prisma ORM
- Authenticated endpoints with JWT guards
- Proper error handling and logging
- Controllers: fraud, moderator, experiment, video-moderation

**Frontend (Web App)** ⚠️ PARTIALLY INTEGRATED

- API client methods defined in `/lib/api.ts`
- TanStack Query configured for data fetching
- API calls are being made BUT...
- **Mock data is still being displayed instead of API responses**

---

## 📊 Panel-by-Panel Analysis

### 1. **Fraud Events Panel**

**Location:** `apps/web/src/app/(admin)/admin/fraud-events/page.tsx`

**Status:** ⚠️ API connected but mock data displayed

**Backend Endpoint:** ✅ `/admin/fraud/events`

```typescript
// Real implementation in apps/api/src/admin/fraud.controller.ts
async getEvents() {
  const events = await this.prisma.fraudEvent.findMany({
    where, include: { feedback: true, explanation: true },
    orderBy: { createdAt: 'desc' }
  });
  return { count: events.length, events };
}
```

**Frontend Code:**

```typescript
// Fetching from API ✅
const { data: stats, isLoading } = useQuery({
  queryKey: ["admin-fraud-stats"],
  queryFn: () => adminApi.getFraudStats(token),
  refetchInterval: 30000,
});

// BUT displaying mock data ⚠️
const mockEvents = [
  { id: 'evt_001', type: 'high_risk_score', ... },
  { id: 'evt_002', type: 'vpn_detected', ... },
  // ... more mock items
];
// Then uses mockEvents in JSX instead of stats
```

**Fix Required:** Replace `mockEvents` with `stats?.events || []`

---

### 2. **Moderator Queue Panel**

**Location:** `apps/web/src/app/(admin)/admin/moderator-queue/page.tsx`

**Status:** ⚠️ API connected but mock data displayed

**Backend Endpoint:** ✅ `/admin/moderator/queue`

```typescript
// Real implementation
async getQueue() {
  const queue = await this.prisma.moderatorQueue.findMany({
    where, include: { fraudEvent: { ... } },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }]
  });
  return { count: queue.length, queue };
}
```

**Frontend Code:**

```typescript
// Fetching from API ✅
const { data: queueData } = useQuery({
  queryKey: ["moderator-queue"],
  queryFn: () => adminApi.getModeratorQueue(token),
  refetchInterval: 30000,
});

// BUT displaying mock data ⚠️
const mockQueueItems = [
  { id: 'queue_001', userId: 'user_123', reason: '...', ... },
  // ... more mock items
];
// Then uses mockQueueItems in JSX instead of queueData
```

**Fix Required:** Replace `mockQueueItems` with `queueData?.queue || []`

---

### 3. **IP Monitoring Panel**

**Location:** `apps/web/src/app/(admin)/admin/ip-monitoring/page.tsx`

**Status:** ⚠️ API connected but mock data displayed

**Backend Endpoint:** ✅ `/admin/fraud/blacklist/list`

```typescript
// Real implementation in fraud.controller.ts
async getBlacklistedIps() {
  const ips = await this.prisma.ipBlacklist.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return { count: ips.length, ips };
}
```

**Frontend Code:**

```typescript
// Fetching from API ✅
const { data: blacklistedIps } = useQuery({
  queryKey: ["blacklisted-ips"],
  queryFn: () => adminApi.getBlacklistedIps(token),
  refetchInterval: 30000,
});

// Mock data not shown in initial view but chart uses mock
```

**Status:** Partially integrated (blacklist uses API, stats use API)

---

### 4. **Experiments Panel (A/B Testing)**

**Location:** `apps/web/src/app/(admin)/admin/experiments/page.tsx`

**Status:** ⚠️ API connected but mock data displayed

**Backend Endpoint:** ✅ `/admin/experiment/list`

```typescript
// Real implementation in experiment.controller.ts
async listExperiments() {
  const experiments = await this.prisma.experiment.findMany({
    include: { _count: { select: { assignments: true } } }
  });
  return experiments;
}
```

**Frontend Code:**

```typescript
// Fetching from API ✅
const { data: experiments } = useQuery({
  queryKey: ["experiments-list"],
  queryFn: () => adminApi.listExperiments(token),
  refetchInterval: 60000,
});

// BUT displaying mock data ⚠️
const mockExperiments = [
  { id: 'exp_001', name: 'Swipe Button Color', ... },
  // ... more mock items
];
// Then uses mockExperiments in JSX instead of experiments
```

**Fix Required:** Replace `mockExperiments` with `experiments || []`

---

### 5. **Risk Scores Panel**

**Location:** `apps/web/src/app/(admin)/admin/risk-scores/page.tsx`

**Status:** ⚠️ API connected but mock data displayed

**Backend Endpoint:** ✅ `/admin/fraud/stats`

```typescript
// Uses FraudEventTracker service
async getFraudStats(hours: number) {
  // Returns comprehensive stats from database
  return {
    totalEvents, blockedEvents, allowedEvents,
    fraudRate, topRiskyIps, recentEvents, ...
  };
}
```

**Frontend Code:**

```typescript
// Fetching from API ✅
const { data: stats } = useQuery({
  queryKey: ["admin-risk-stats"],
  queryFn: () => adminApi.getFraudStats(token),
  refetchInterval: 30000,
});

// BUT displaying mock data ⚠️
const mockUserRisks = [
  { userId: 'user_123', riskScore: 78, ... },
  // ... 10+ mock users
];
// Then uses mockUserRisks in JSX instead of stats
```

**Fix Required:** Replace `mockUserRisks` with API call for user-specific risks

---

### 6. **User Lookup Panel**

**Location:** `apps/web/src/app/(admin)/admin/user-lookup/page.tsx`

**Status:** ⚠️ Mock data only

**Backend Endpoint:** ⚠️ Needs `/admin/fraud/user/:userId/events`

```typescript
// Exists in adminApi
getUserEvents: (userId: string, token?: string) =>
  api.get(`/admin/fraud/user/${userId}/events`, token);
```

**Frontend Code:**

```typescript
// Mock search only ⚠️
const handleSearch = async () => {
  // Mock search - replace with actual API call
  console.log("Searching for:", searchQuery);
};
```

**Fix Required:** Implement real search using `adminApi.getUserEvents()`

---

### 7. **Staff Management Panels**

#### Staff Directory

**Location:** `apps/web/src/app/staff/directory/page.tsx`

**Status:** ⚠️ Using localStorage mock data

**Code:**

```typescript
// Load mock staff from localStorage ⚠️
const mockStaffMembers = JSON.parse(
  localStorage.getItem("mockStaffMembers") || "[]",
);
setStaff(mockStaffMembers);
```

**Backend:** Staff endpoints exist in `apps/api/src/staff/`

**Fix Required:** Replace localStorage with API calls to `/staff` endpoints

---

#### Staff Users Panel

**Location:** `apps/web/src/app/(admin)/staff/users/page.tsx`

**Status:** ⚠️ Mock data only

**Code:**

```typescript
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', ... },
  // ... more mock users
];
const [selectedUser, setSelectedUser] = useState(mockUsers[0]);
```

**Fix Required:** Replace with API calls

---

#### Staff Chats Panel

**Location:** `apps/web/src/app/(admin)/staff/chats/page.tsx`

**Status:** ⚠️ Mock data only

**Code:**

```typescript
const mockChats = [
  { id: '1', user: 'Alice Johnson', message: '...', ... },
  // ... more mock chats
];
const mockActiveUsers = [
  { id: 'staff_001', name: 'Sarah Chen', ... },
  // ... more mock users
];
```

**Fix Required:** Integrate with real-time chat system

---

### 8. **Support Tickets Panel**

**Location:** `apps/web/src/app/(admin)/admin/support-tickets/page.tsx`

**Status:** ✅ PARTIALLY INTEGRATED

**Code:**

```typescript
const { data: tickets, isLoading } = useQuery({
  queryKey: ["admin-support-tickets"],
  queryFn: async () => {
    const res = await fetch("/api/support/tickets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },
});
```

**Backend:** Support endpoints exist in `apps/api/src/support/`

**Status:** Actually using API! ✅

---

### 9. **Video Moderation Panels**

#### Sessions Panel

**Location:** `apps/web/src/app/(admin)/admin/sessions/page.tsx`

**Status:** ⚠️ Mock data (using mockVideoData)

**Code:**

```typescript
import type { FlaggedVideo } from "@/lib/mockVideoData";
```

#### Quarantine Panel

**Location:** `apps/web/src/app/(admin)/admin/quarantine/page.tsx`

**Status:** ⚠️ Mock data (using mockVideoData)

**Backend:** Video moderation controller exists at `apps/api/src/admin/video-moderation.controller.ts`

**Fix Required:** Replace mock imports with API calls

---

### 10. **Video Date Settings Panel**

**Location:** `apps/web/src/app/(admin)/admin/video-date/settings/page.tsx`

**Status:** ⚠️ Mock data only

**Fix Required:** Connect to video date settings API

---

### 11. **Staff Dashboard (Support Portal)**

**Location:** `apps/web/src/components/staff/StaffDashboard.tsx`

**Status:** ⚠️ Mock tickets and stats

**Code:**

```typescript
const mockTickets: Ticket[] = [
  { id: "12345", customer: "John Doe", status: "Pending", ... },
  // ... more mock tickets
];

const mockStats = {
  openTickets: 42,
  aht: "5m 23s",
  csat: "92%",
};

const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
```

**Backend:** Support endpoints exist

**Fix Required:** Replace with real ticket API calls

---

## 🔧 API Endpoints Summary

### ✅ Backend Ready (Real Database Queries)

| Endpoint                                 | Controller           | Method                 | Database Query                             |
| ---------------------------------------- | -------------------- | ---------------------- | ------------------------------------------ |
| GET `/admin/fraud/events`                | FraudController      | getEvents()            | `prisma.fraudEvent.findMany()`             |
| GET `/admin/fraud/stats`                 | FraudController      | getStats()             | `fraudTracker.getFraudStats()`             |
| POST `/admin/fraud/events/:id/feedback`  | FraudController      | provideFeedback()      | `fraudTracker.provideFeedback()`           |
| POST `/admin/fraud/blacklist/add`        | FraudController      | addIpToBlacklist()     | `prisma.ipBlacklist.create()`              |
| GET `/admin/fraud/blacklist/list`        | FraudController      | getBlacklistedIps()    | `prisma.ipBlacklist.findMany()`            |
| POST `/admin/fraud/blacklist/remove`     | FraudController      | removeFromBlacklist()  | `prisma.ipBlacklist.delete()`              |
| GET `/admin/moderator/queue`             | ModeratorController  | getQueue()             | `prisma.moderatorQueue.findMany()`         |
| GET `/admin/moderator/queue/stats`       | ModeratorController  | getQueueStats()        | `prisma.moderatorQueue.count()`            |
| POST `/admin/moderator/queue/:id/assign` | ModeratorController  | assignQueueItem()      | `prisma.moderatorQueue.update()`           |
| POST `/admin/moderator/queue/:id/review` | ModeratorController  | reviewQueueItem()      | `fraudTracker.resolveModerationItem()`     |
| GET `/admin/experiment/variant/:id`      | ExperimentController | getUserVariant()       | `prisma.experimentAssignment.findUnique()` |
| GET `/admin/experiment/results/:id`      | ExperimentController | getExperimentResults() | `prisma.experimentAssignment.groupBy()`    |
| GET `/admin/experiment/list`             | ExperimentController | listExperiments()      | `prisma.experiment.findMany()`             |

**Total:** 13+ real endpoints with database integration ✅

---

## 🛠️ Frontend API Client

**Location:** `apps/web/src/lib/api.ts`

### Admin API Methods (Already Defined)

```typescript
export const adminApi = {
  // Fraud Events
  getFraudEvents: (token?: string) => api.get("/admin/fraud/events", token),
  getFraudStats: (token?: string) => api.get("/admin/fraud/stats", token),
  getFraudEventById: (id: string, token?: string) =>
    api.get(`/admin/fraud/events/${id}`, token),
  provideFraudFeedback: (
    id: string,
    feedback: string,
    notes?: string,
    token?: string,
  ) =>
    api.post(`/admin/fraud/events/${id}/feedback`, { feedback, notes }, token),

  // IP Management
  addIpToBlacklist: (
    ip: string,
    reason: string,
    severity: number,
    token?: string,
  ) => api.post("/admin/fraud/blacklist/add", { ip, reason, severity }, token),
  checkIpBlacklist: (ip: string, token?: string) =>
    api.get(`/admin/fraud/blacklist/check/${ip}`, token),
  removeIpFromBlacklist: (ip: string, token?: string) =>
    api.post("/admin/fraud/blacklist/remove", { ip }, token),
  getBlacklistedIps: (token?: string) =>
    api.get("/admin/fraud/blacklist/list", token),
  getIpEvents: (ip: string, token?: string) =>
    api.get(`/admin/fraud/ip/${ip}/events`, token),

  // Moderator Queue
  getModeratorQueue: (token?: string) =>
    api.get("/admin/moderator/queue", token),
  getQueueStats: (token?: string) =>
    api.get("/admin/moderator/queue/stats", token),
  assignQueueItem: (itemId: string, moderatorId: string, token?: string) =>
    api.post(`/admin/moderator/queue/${itemId}/assign`, { moderatorId }, token),
  reviewQueueItem: (
    itemId: string,
    decision: "approved" | "rejected",
    notes?: string,
    token?: string,
  ) =>
    api.post(
      `/admin/moderator/queue/${itemId}/review`,
      { decision, notes },
      token,
    ),
  escalateQueueItem: (itemId: string, token?: string) =>
    api.post(`/admin/moderator/queue/${itemId}/escalate`, {}, token),

  // Experiments (A/B Testing)
  createExperiment: (
    name: string,
    variants: string[],
    duration: number,
    token?: string,
  ) =>
    api.post("/admin/experiment/create", { name, variants, duration }, token),
  getExperimentVariant: (experimentId: string, token?: string) =>
    api.get(`/admin/experiment/variant/${experimentId}`, token),
  getExperimentResults: (experimentId: string, token?: string) =>
    api.get(`/admin/experiment/results/${experimentId}`, token),
  listExperiments: (token?: string) => api.get("/admin/experiment/list", token),
  endExperiment: (experimentId: string, token?: string) =>
    api.post(`/admin/experiment/end/${experimentId}`, {}, token),

  // User Management
  getUserEvents: (userId: string, token?: string) =>
    api.get(`/admin/fraud/user/${userId}/events`, token),
};
```

**Status:** ✅ All methods defined and ready to use

---

## 🚨 The Problem

The frontend pages are making API calls with TanStack Query:

```typescript
const { data: queueData } = useQuery({
  queryKey: ["moderator-queue"],
  queryFn: () => adminApi.getModeratorQueue(token), // ✅ API called
  refetchInterval: 30000,
});
```

BUT then ignoring the response and using mock data instead:

```typescript
// ⚠️ Mock data still displayed
const mockQueueItems = [ /* ... */ ];

// In JSX
{mockQueueItems.map(item => /* ... */)}  // ❌ Should be queueData
```

---

## ✅ The Solution

### Quick Fix Pattern

**Before:**

```typescript
const { data: apiData } = useQuery({
  queryKey: ["my-data"],
  queryFn: () => adminApi.getSomeData(token),
});

const mockData = [ /* mock items */ ];

return <div>{mockData.map(/* ... */)}</div>;
```

**After:**

```typescript
const { data: apiData, isLoading } = useQuery({
  queryKey: ["my-data"],
  queryFn: () => adminApi.getSomeData(token),
});

// Use API data with fallback
const displayData = apiData?.items || [];

if (isLoading) return <div>Loading...</div>;

return <div>{displayData.map(/* ... */)}</div>;
```

---

## 📋 Action Items to Complete Integration

### High Priority (Core Admin Functions)

- [ ] **Fraud Events Panel**
  - Replace `mockEvents` with `stats?.events || []`
  - File: `apps/web/src/app/(admin)/admin/fraud-events/page.tsx`

- [ ] **Moderator Queue Panel**
  - Replace `mockQueueItems` with `queueData?.queue || []`
  - File: `apps/web/src/app/(admin)/admin/moderator-queue/page.tsx`

- [ ] **Experiments Panel**
  - Replace `mockExperiments` with `experiments || []`
  - File: `apps/web/src/app/(admin)/admin/experiments/page.tsx`

- [ ] **Risk Scores Panel**
  - Replace `mockUserRisks` with API data
  - May need new endpoint: `/admin/users/risk-scores`
  - File: `apps/web/src/app/(admin)/admin/risk-scores/page.tsx`

### Medium Priority (Staff Features)

- [ ] **Staff Directory**
  - Replace localStorage with `/staff` API
  - File: `apps/web/src/app/staff/directory/page.tsx`

- [ ] **Staff Dashboard**
  - Replace `mockTickets` with support API
  - Replace `mockStats` with real metrics
  - File: `apps/web/src/components/staff/StaffDashboard.tsx`

- [ ] **Staff Users Panel**
  - Replace `mockUsers` with `/staff/users` API
  - File: `apps/web/src/app/(admin)/staff/users/page.tsx`

- [ ] **Staff Chats Panel**
  - Integrate with real-time chat gateway
  - File: `apps/web/src/app/(admin)/staff/chats/page.tsx`

### Lower Priority (Video Features)

- [ ] **Video Sessions Panel**
  - Replace mockVideoData with video moderation API
  - File: `apps/web/src/app/(admin)/admin/sessions/page.tsx`

- [ ] **Quarantine Panel**
  - Replace mockVideoData with video moderation API
  - File: `apps/web/src/app/(admin)/admin/quarantine/page.tsx`

- [ ] **Video Date Settings**
  - Connect to settings API
  - File: `apps/web/src/app/(admin)/admin/video-date/settings/page.tsx`

---

## 🎯 Completion Estimate

| Task Category                                 | Files        | Estimated Time |
| --------------------------------------------- | ------------ | -------------- |
| Admin Panels (Fraud, Queue, Experiments)      | 4 files      | 2-3 hours      |
| Staff Panels (Directory, Dashboard, Users)    | 4 files      | 3-4 hours      |
| Video Panels (Sessions, Quarantine, Settings) | 3 files      | 2-3 hours      |
| Testing & QA                                  | All          | 2 hours        |
| **TOTAL**                                     | **11 files** | **9-12 hours** |

---

## 📝 Notes

1. **Backend is Production Ready** ✅
   - All database queries use Prisma
   - Proper error handling
   - JWT authentication
   - Logging in place

2. **API Client is Complete** ✅
   - All methods defined in `adminApi`
   - Proper TypeScript types
   - Token-based auth headers

3. **Frontend Uses TanStack Query** ✅
   - Auto-refresh configured (30s intervals)
   - Caching enabled
   - Loading states handled

4. **The Only Issue**: Frontend renders mock data instead of API responses ⚠️

5. **Simple Fix**: Replace mock arrays with query results

---

## 🔍 How to Verify

### Check if a Panel is Using Real Data

1. **Look for `useQuery` call**: ✅ Good sign
2. **Check what renders in JSX**:
   - ❌ Uses `mockSomething.map()`
   - ✅ Uses `data?.items.map()`
3. **Check browser DevTools**:
   - Network tab should show API calls
   - If API returns data but UI shows mock = needs fix

### Example Verification

```typescript
// ✅ This is correct
const { data } = useQuery({ ... });
return <div>{data?.items.map(/* ... */)}</div>;

// ❌ This needs fixing
const { data } = useQuery({ ... });
const mockItems = [/* ... */];
return <div>{mockItems.map(/* ... */)}</div>;
```

---

## 📞 Summary

**Question:** Are panels data-driven from real endpoints?

**Answer:**

- **Backend**: YES ✅ (Full database integration via Prisma)
- **Frontend API Client**: YES ✅ (All methods defined)
- **Frontend UI**: NO ⚠️ (Still displaying mock data)

**Root Cause:** Frontend pages fetch API data but don't use it for rendering.

**Solution:** Simple find-replace in 11 files to use API response instead of mock arrays.

**Complexity:** Low - mostly mechanical changes
**Risk:** Low - backup mock data already in place for testing
**Time:** ~10 hours for full integration + testing

---

_Generated: February 18, 2026_
