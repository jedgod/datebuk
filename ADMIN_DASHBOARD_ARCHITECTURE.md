# Admin Dashboard - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                          │
│                    (React 18 + TypeScript)                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────── ROUTING LAYER ────────────────────────┐
│                                                                  │
│  /admin          → Navigate to /admin/dashboard                │
│  /admin/dashboard → DashboardHome (Overview)                   │
│  /admin/ip-monitoring → IpMonitoringPage                       │
│  /admin/risk-scores → RiskScoresPage                           │
│  /admin/fraud-events → FraudEventsPage                         │
│  /admin/moderator-queue → ModeratorQueuePage                  │
│  /admin/experiments → ExperimentsPage                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────── LAYOUT LAYER ─────────────────────────┐
│                                                                  │
│   ┌────────────────────────────────────────────────────────┐  │
│   │            DashboardLayout (Master Wrapper)           │  │
│   │  - Responsive detection (mobile/desktop)              │  │
│   │  - Window resize listener                             │  │
│   │  - Conditional margin adjustment                      │  │
│   └────────────────────────────────────────────────────────┘  │
│                      ↓                    ↓                     │
│            ┌─────────────────────────────────────┐             │
│            │  Sidebar.tsx        │  MobileNav.tsx│             │
│            │  (Desktop/Tablet)   │ (Mobile Only) │             │
│            │                     │               │             │
│            │ • 6 Nav Items       │ • Hamburger   │             │
│            │ • Toggle (256↔64px) │ • Sheet Drawer│             │
│            │ • Active highlight  │ • Auto-close  │             │
│            │ • Logout button     │ • Logout btn  │             │
│            └─────────────────────────────────────┘             │
│                                                                  │
│            ┌─────────────────────────────────────┐             │
│            │     Page Content Area (Main)        │             │
│            │  - Responsive grid layout           │             │
│            │  - Flex-based columns               │             │
│            │  - Auto scroll overflow             │             │
│            └─────────────────────────────────────┘             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────── DATA VISUALIZATION ──────────────────────┐
│                                                                │
│  COMPONENTS (for all pages)                                  │
│                                                                │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  StatCard        │  │ RiskScoreGauge   │                 │
│  │  • title         │  │ • SVG circle     │                 │
│  │  • value         │  │ • 0-100 scale    │                 │
│  │  • trend         │  │ • Color gradient │                 │
│  │  • icon          │  │ • Risk level txt │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                                │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ FraudEventsChart │  │  IpFraudTable    │                 │
│  │ • Recharts Line  │  │ • shadcn Table   │                 │
│  │ • 3 data series  │  │ • Sortable cols  │                 │
│  │ • 24h timeline   │  │ • Action buttons │                 │
│  │ • Tooltips       │  │ • Risk color idx │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                                │
│  Other Components:                                            │
│  • EventTable (Fraud Events page)                            │
│  • QueueTable (Moderator Queue page)                         │
│  • BarChart (Experiments page)                               │
│  • Various detail cards and lists                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────── DATA MANAGEMENT ───────────────────────┐
│                                                              │
│        TanStack React Query (@tanstack/react-query)       │
│                                                              │
│  useQuery({                                               │
│    queryKey: ['dashboard-stats'],                         │
│    queryFn: () => adminApi.getFraudStats(token),          │
│    refetchInterval: 30000,  // 30 seconds                 │
│  })                                                        │
│                                                              │
│  Features:                                                 │
│  • Automatic caching                                      │
│  • Background refetch                                     │
│  • Stale data management                                  │
│  • Error handling                                         │
│  • Loading states                                         │
│  • Deduplication                                          │
│                                                              │
└────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────── API INTEGRATION ──────────────────────┐
│                                                            │
│           adminApi Helper (apps/web/src/lib/api.ts)      │
│                                                            │
│  FRAUD MANAGEMENT                                         │
│  ├─ getFraudStats()          → GET /admin/fraud/stats    │
│  ├─ getFraudEvents()         → GET /admin/fraud/events   │
│  ├─ getFraudEventById(id)    → GET /admin/fraud/events/:id
│  └─ provideFraudFeedback()   → POST /admin/fraud/feedback │
│                                                            │
│  IP BLACKLIST MANAGEMENT                                  │
│  ├─ addIpToBlacklist()       → POST /admin/fraud/blacklist/add
│  ├─ removeIpFromBlacklist()  → POST /admin/fraud/blacklist/remove
│  ├─ checkIpBlacklist()       → GET /admin/fraud/blacklist/check
│  ├─ getBlacklistedIps()      → GET /admin/fraud/blacklist/list
│  └─ getIpEvents()            → GET /admin/fraud/ip/:ip/events
│                                                            │
│  MODERATOR QUEUE                                          │
│  ├─ getModeratorQueue()      → GET /admin/moderator/queue
│  ├─ getQueueStats()          → GET /admin/moderator/stats
│  ├─ assignQueueItem()        → POST /admin/moderator/assign
│  ├─ reviewQueueItem()        → POST /admin/moderator/review
│  └─ escalateQueueItem()      → POST /admin/moderator/escalate
│                                                            │
│  EXPERIMENTS                                              │
│  ├─ createExperiment()       → POST /admin/experiment/create
│  ├─ listExperiments()        → GET /admin/experiment/list
│  ├─ getExperimentResults()   → GET /admin/experiment/:id/results
│  └─ endExperiment()          → POST /admin/experiment/:id/end
│                                                            │
│  All methods:                                             │
│  • Accept optional token parameter                       │
│  • Return Promise<Data>                                  │
│  • Handle errors gracefully                              │
│  • Support mock data fallback                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────── BACKEND API ────────────────────────┐
│                                                          │
│        NestJS API Server (apps/api)                    │
│                                                          │
│  Authentication:                                       │
│  • JWT token validation                               │
│  • Role-based access (admin/moderator)                │
│  • Token passed in Authorization header               │
│                                                        │
│  Endpoints:                                           │
│  • GET /admin/fraud/stats                             │
│  • GET /admin/fraud/events                            │
│  • POST /admin/fraud/blacklist/add                    │
│  • GET /admin/moderator/queue                         │
│  • POST /admin/moderator/assign                       │
│  • GET /admin/experiment/list                         │
│  • [+ more endpoints as needed]                       │
│                                                        │
│  Response Format:                                     │
│  {                                                     │
│    status: 'success' | 'error',                       │
│    data: {...},                                        │
│    error?: string                                      │
│  }                                                     │
│                                                        │
└────────────────────────────────────────────────────────┘
                        ↓      ↓      ↓
        ┌───────────────┴──────┴──────┴────────────┐
        │                                           │
    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
    │PostgreSQL│    │   Redis  │    │  Prisma  │ │
    │Database  │    │  Cache   │    │   ORM    │ │
    └──────────┘    └──────────┘    └──────────┘ │
                                                  │
              Backend Services                   │
         (RiskEngine, MlService, etc.)          │
                                                  │
        └──────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────────┐
│  User Action     │
│  (Click button,  │
│   navigate)      │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────┐
│  React Component Event   │
│  Handler (onClick, etc)  │
└────────┬─────────────────┘
         │
         ↓
┌────────────────────────────────┐
│  useQuery Hook / API Call      │
│  (adminApi.getFraudStats())    │
└────────┬───────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  TanStack Query Manager          │
│  • Check cache                   │
│  • Manage loading state          │
│  • Handle errors                 │
└────────┬───────────────────────────┘
         │
         ↓
┌───────────────────────────────────────┐
│  API Fetch / Mock Data Check         │
│  • If backend ready: fetch           │
│  • Else: return mock data            │
└────────┬─────────────────────────────┘
         │
         ↓
    ┌────────────────────────┐
    │  Backend API Response  │
    │  (or mock fallback)    │
    └────────┬───────────────┘
             │
             ↓
    ┌────────────────────────┐
    │  Query Cache Update    │
    │  (TanStack manages)    │
    └────────┬───────────────┘
             │
             ↓
    ┌────────────────────────┐
    │  Component Re-render   │
    │  (with new data)       │
    └────────┬───────────────┘
             │
             ↓
    ┌────────────────────────┐
    │  UI Update             │
    │  (charts, tables, etc) │
    └────────────────────────┘
```

---

## Component Hierarchy

```
DashboardLayout (Master)
├── Sidebar
│   ├── Nav Items
│   │   ├── Link: Overview
│   │   ├── Link: IP Monitoring
│   │   ├── Link: Risk Scores
│   │   ├── Link: Fraud Events
│   │   ├── Link: Moderator Queue
│   │   └── Link: Experiments
│   └── Logout Button
│
├── MobileNav (visible on mobile)
│   ├── Hamburger Menu Icon
│   ├── Sheet Drawer
│   │   ├── Nav Items
│   │   └── Logout Button
│   └── Auto-close on navigation
│
└── Page Content
    ├── Dashboard Overview (/admin/dashboard)
    │   ├── Stat Cards (4x)
    │   │   └── StatCard (4 copies with different props)
    │   ├── Risk Score Gauge
    │   │   └── RiskScoreGauge (SVG-based)
    │   ├── Fraud Events Chart
    │   │   └── FraudEventsChart (Recharts)
    │   ├── IP Fraud Table
    │   │   └── IpFraudTable (shadcn Table)
    │   └── Quick Stats Footer
    │
    ├── IP Monitoring (/admin/ip-monitoring)
    │   ├── Stat Cards (3x)
    │   ├── Top Risky IPs Table
    │   │   └── shadcn Table with custom styling
    │   └── Blacklist Management
    │
    ├── Risk Scores (/admin/risk-scores)
    │   ├── Search Input
    │   ├── User Risk Table
    │   ├── Risk History Chart
    │   │   └── LineChart (Recharts)
    │   └── Factor Breakdown Cards
    │
    ├── Fraud Events (/admin/fraud-events)
    │   ├── Event Stats (4x)
    │   ├── Filter Controls
    │   ├── Events Table
    │   │   └── shadcn Table with actions
    │   └── Event Detail Cards
    │
    ├── Moderator Queue (/admin/moderator-queue)
    │   ├── Queue Metrics (4x)
    │   ├── Queue Filters
    │   ├── Queue Table
    │   │   └── shadcn Table with priority
    │   ├── Urgent Cases Section
    │   └── Moderator Leaderboard
    │
    └── Experiments (/admin/experiments)
        ├── Experiment Stats (3x)
        ├── Active Experiments
        │   └── BarChart (Recharts) for comparison
        ├── Completed Experiments Table
        └── Key Insights Section
```

---

## State Management Flow

```
┌─────────────────────────────────────┐
│   localStorage                      │
│   • 'auth_token': JWT string        │
│   • 'user_role': 'admin'/'moderator'│
│   • 'user_id': string               │
└────────────┬────────────────────────┘
             │
             ↓
       ┌────────────┐
       │ Components │
       │  useQuery  │
       └────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   TanStack Query Cache              │
│   • queryKey: ['dashboard-stats']   │
│   • queryKey: ['fraud-events']      │
│   • queryKey: ['moderator-queue']   │
│   • ... other keys                  │
│   • Auto-refetch every 30s          │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   API Response Data                 │
│   • Stats object                    │
│   • Events array                    │
│   • Queue items                     │
│   • ... other responses             │
└─────────────────────────────────────┘

No Redux/Zustand needed!
TanStack Query handles all state needs.
```

---

## Responsive Behavior

```
┌────────────────────────────────────────────┐
│            Window Size Detected            │
└────────────────┬───────────────────────────┘
                 │
     ┌───────────┴────────────┐
     │                        │
     ↓                        ↓
┌──────────────┐      ┌──────────────┐
│ < 768px      │      │ ≥ 768px      │
│ Mobile View  │      │ Desktop View │
└──────┬───────┘      └──────┬───────┘
       │                     │
       ↓                     ↓
   MobileNav            Sidebar (Open)
   (Hamburger)          (256px wide)
   + Sheet.tsx              ↓
   + Mobile Layout      Content (flex)
   + Single column         ↓
   + Drawer nav        Multi-column grid
   + Auto-close            ↓
                       Stats: 4 columns
                       Charts: 2 columns
                       Tables: Full width

┌──────────────────────────────────────┐
│       Resize Event Listener          │
│  (DashboardLayout useEffect)         │
│                                      │
│  window.addEventListener('resize')  │
│  → Update isMobile state            │
│  → Re-render conditional components  │
│  → Smooth transition                │
└──────────────────────────────────────┘
```

---

## API Response Structure Examples

```typescript
// GET /admin/fraud/stats
{
  currentRiskScore: 45,
  avgRiskScore: 42.5,
  totalEvents: 234,
  blockedCount: 45,
  fraudRate: 2.3,
  highRiskIps: 12,
  vpnDetections: 8,
  activeUsers: 1250,
  uniqueIps: 567,
  blacklistCount: 45,
  topIPs: [
    {
      ip: "192.168.1.1",
      country: "US",
      isVpn: true,
      attempts: 45,
      riskScore: 85,
      isBlacklisted: false,
      lastSeen: "2025-02-11T03:50:00Z"
    }
    // ... more IPs
  ],
  hourly: [
    { time: "00:00", count: 10 },
    // ... 23 more hours
  ]
}

// GET /admin/fraud/events
[
  {
    id: "evt_001",
    userId: "user_123",
    email: "user@example.com",
    type: "high_velocity",
    riskScore: 78,
    status: "flagged",
    timestamp: "2025-02-11T03:45:22Z",
    details: "10 login attempts in 5 minutes",
    ip: "192.168.1.100",
    country: "US"
  }
  // ... more events
]

// GET /admin/moderator/queue
[
  {
    id: "queue_001",
    userId: "user_123",
    email: "user@example.com",
    reason: "Multiple failed login attempts",
    riskScore: 85,
    priority: "urgent",
    status: "pending",
    assignedTo: null,
    createdAt: "2025-02-11T03:50:00Z",
    flag: "suspicious_activity"
  }
  // ... more queue items
]
```

---

## Technology Stack

```
┌──────────────────────────────────────────────┐
│         Frontend Technology Stack            │
├──────────────────────────────────────────────┤
│ Core                                         │
│ • React 18.x                                │
│ • TypeScript 5.x                            │
│ • React Router v6 (routing)                 │
│                                              │
│ State & Data Management                     │
│ • @tanstack/react-query (data fetching)     │
│ • TanStack Query (caching, refetch)         │
│                                              │
│ UI Components & Styling                     │
│ • shadcn/ui (pre-built components)          │
│ • Tailwind CSS v3 (utility styling)         │
│ • Lucide React (icons)                      │
│ • Radix UI (accessibility primitives)       │
│                                              │
│ Data Visualization                          │
│ • Recharts v2 (charts & graphs)             │
│                                              │
│ Build & Dev                                 │
│ • Vite (build tool)                         │
│ • npm/pnpm (package management)             │
│                                              │
│ Development                                 │
│ • VS Code (editor)                          │
│ • ESLint (linting)                          │
│ • Prettier (formatting)                     │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│         Backend Integration                  │
├──────────────────────────────────────────────┤
│ • NestJS API (Node.js)                      │
│ • PostgreSQL (database)                     │
│ • Redis (caching)                           │
│ • Prisma (ORM)                              │
│ • JWT (authentication)                      │
│ • ML/Fraud Detection Services               │
└──────────────────────────────────────────────┘
```

---

## Performance Optimization

```
Caching Strategy:
┌────────────────────────────────────┐
│ TanStack Query Cache               │
│ • Cache duration: By refetchInterval│
│ • Auto-refresh: Every 30 seconds  │
│ • Stale while revalidate pattern   │
│ • Background refetch capability    │
└────────────────────────────────────┘

Rendering Optimization:
┌────────────────────────────────────┐
│ • React memoization (memo)         │
│ • Component lazy loading (ready)   │
│ • Efficient re-renders             │
│ • Virtualized tables (ready for)   │
└────────────────────────────────────┘

Bundle Size:
┌────────────────────────────────────┐
│ • React: ~40KB gzipped             │
│ • Recharts: ~60KB gzipped          │
│ • shadcn/ui: ~10KB per component  │
│ • Tailwind: ~8KB gzipped (optimized)
│ • Total estimated: ~150-200KB      │
└────────────────────────────────────┘
```

---

## Security Flow

```
┌─────────────────────────────────────────────┐
│          Authentication Flow                │
├─────────────────────────────────────────────┤
│                                             │
│ 1. User logs in (backend)                  │
│    → Backend returns JWT token             │
│                                             │
│ 2. Frontend stores token                   │
│    → localStorage.setItem('auth_token')    │
│                                             │
│ 3. Every API call includes token           │
│    → adminApi.getFraudStats(token)         │
│    → Passed in Authorization header        │
│                                             │
│ 4. Backend validates token                 │
│    → JWT verification                      │
│    → Role check (admin/moderator)          │
│    → Permission validation                 │
│                                             │
│ 5. Response returns data (or 401)          │
│    → On error: redirect to login           │
│    → On success: display data              │
│                                             │
│ 6. User logs out                           │
│    → localStorage.removeItem('auth_token') │
│    → Clear cache                           │
│    → Redirect to login                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

**Diagram Status:** ✅ Complete  
**Last Updated:** 2025-02-11
