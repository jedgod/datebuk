// Implementation Checklist & Monitoring Guide
// Video Date Control System - Production Readiness

## IMPLEMENTATION CHECKLIST

### Phase 1: Setup (Week 1)

- [ ] Install all npm packages (frontend + backend)
- [ ] Update prisma/schema.prisma with new models
- [ ] Run database migrations: `npx prisma migrate dev`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Seed database with test data (optional)

### Phase 2: API Routes (Week 1)

- [ ] Create apps/api/src/routes/admin/active-video-queue.ts
- [ ] Create apps/api/src/routes/admin/interrupt-video.ts
- [ ] Create apps/api/src/routes/admin/bulk-video-action.ts
- [ ] Create apps/api/src/routes/admin/moderator-stats.ts
- [ ] Create apps/api/src/routes/admin/agreement-trend.ts
- [ ] Create apps/api/src/routes/admin/filter-presets.ts
- [ ] Register all routes in Express server
- [ ] Test each endpoint with curl/Postman

### Phase 3: Service Layer (Week 1)

- [ ] Create apps/api/src/services/moderatorAnalyticsService.ts
- [ ] Implement fatigueScore calculation
- [ ] Implement performanceReport generation
- [ ] Wire up to API endpoints
- [ ] Test service methods directly

### Phase 4: Frontend (Week 2)

- [ ] Create apps/web/src/app/(admin)/admin/video-date-controls/page.tsx
- [ ] Verify all dependencies are installed
- [ ] Test page loads without errors
- [ ] Test infinite scroll functionality
- [ ] Test filter state management
- [ ] Test keyboard shortcuts (j/k/a/f/esc)
- [ ] Test theme toggle persistence
- [ ] Test CSV export

### Phase 5: WebSocket Integration (Week 2)

- [ ] Setup Socket.io in apps/api
- [ ] Configure CORS for WebSocket
- [ ] Implement connection/disconnection handlers
- [ ] Broadcast events: video-flag-update, moderator-fatigue-alert
- [ ] Test real-time updates in browser
- [ ] Test fallback polling (every 20 seconds)

### Phase 6: Testing (Week 2)

- [ ] Manual test with sample data
- [ ] Test all API endpoints: GET, POST, DELETE
- [ ] Test error handling (400, 404, 500)
- [ ] Test pagination (page 1, 2, 3)
- [ ] Test filters (intent, highRisk, sort)
- [ ] Test bulk actions on multiple items
- [ ] Test preset CRUD operations
- [ ] Performance test with 200+ items

### Phase 7: Documentation (Week 2)

- [ ] Document API endpoints with examples
- [ ] Create deployment runbook
- [ ] Document connection strings (env vars)
- [ ] Create troubleshooting guide
- [ ] Add inline code comments
- [ ] Generate API OpenAPI/Swagger spec (optional)

### Phase 8: Deployment Prep (Week 3)

- [ ] Verify environment variables in production
- [ ] Setup SSL certificates for WSS
- [ ] Configure logging (Pino/Winston)
- [ ] Setup monitoring alerts
- [ ] Create database backups
- [ ] Test database failover
- [ ] Load test with k6 or Artillery
- [ ] Security audit (OWASP top 10)

### Phase 9: Production Deploy (Week 3)

- [ ] Deploy to staging environment
- [ ] Smoke test all endpoints
- [ ] Monitor error rates for 24 hours
- [ ] Verify database query performance
- [ ] Deploy to production
- [ ] Monitor real-time metrics
- [ ] Prepare rollback plan

### Phase 10: Post-Deployment (Week 4)

- [ ] Monitor error rates and latency
- [ ] Gather moderator feedback
- [ ] Fine-tune fatigue thresholds
- [ ] Optimize database queries if needed
- [ ] Document lessons learned
- [ ] Plan Phase 2 enhancements

---

## MONITORING DASHBOARD

### Key Metrics to Track

**API Performance:**

```
GET /api/admin/active-video-queue
  - Response time: target < 500ms
  - Error rate: target < 1%
  - P95 latency: target < 1000ms

GET /api/admin/moderator-stats
  - Response time: target < 200ms
  - Cache hit rate: target > 80%

WebSocket
  - Connection success rate: target > 99%
  - Message delivery time: target < 100ms
  - Reconnection success: target > 95%
```

**Business Metrics:**

```
Moderator Performance:
  - Decisions per hour: baseline 15-20
  - AI agreement rate: target > 85%
  - Escalation rate: target < 25%
  - Fatigue score: alert if > 75

Queue Health:
  - Average queue length: baseline 50-100
  - Time in queue: target < 5 minutes
  - Items per status: active/flagged/reviewed/escalated
```

**System Metrics:**

```
Database:
  - Query execution time: target < 100ms for active-video-queue
  - Connection pool: usage < 80%
  - Transaction rollback rate: target < 0.1%

Server:
  - CPU usage: target < 70%
  - Memory usage: target < 80%
  - Disk I/O: monitor for spikes
```

### Monitoring Setup (Sample Prometheus)

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "video-date-api"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/metrics"

  - job_name: "websocket-server"
    static_configs:
      - targets: ["localhost:3001"]
```

### Alerting Rules

```yaml
# Create alerts.yaml
groups:
  - name: video_date_alerts
    rules:
      # High API latency
      - alert: HighAPILatency
        expr: histogram_quantile(0.95, rate(http_request_duration_ms[5m])) > 1000
        annotations:
          summary: "API latency exceeds 1s"

      # High error rate
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.01
        annotations:
          summary: "API error rate exceeds 1%"

      # WebSocket connection failures
      - alert: WebSocketFailures
        expr: rate(websocket_connection_errors[5m]) > 0.05
        annotations:
          summary: "WebSocket connection failures > 5%"

      # Critical moderator fatigue
      - alert: CriticalFatigue
        expr: moderator_fatigue_score > 85
        annotations:
          summary: "Moderator fatigue critical"
```

---

## LOGGING & DEBUGGING

### Pino Logger Setup

```typescript
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      singleLine: false,
      translateTime: "SYS:standard",
    },
  },
});

// Usage in routes
logger.info({ ids: ["id1", "id2"] }, "Interrupting sessions");
logger.error({ err }, "Database error occurred");
```

### Log Aggregation (ELK Stack)

```typescript
// Optional: Send logs to Elasticsearch
const transport = pino.transport({
  targets: [
    {
      level: "info",
      target: "pino/file",
      options: { destination: "./logs/app.log" },
    },
    {
      level: "warn",
      target: "@logtail/pino",
      options: { sourceToken: process.env.LOGTAIL_TOKEN },
    },
  ],
});

const logger = pino(transport);
```

### Browser DevTools Monitoring

```typescript
// In frontend, monitor WebSocket in DevTools:
// 1. Open DevTools → Network → WS
// 2. Watch for connection/message events
// 3. Check message payload in "Messages" tab
// 4. Monitor reconnections in Console

// Debug presets:
localStorage.getItem("video-presets"); // View saved presets
localStorage.setItem("video-control-theme", "light"); // Override theme
```

---

## PERFORMANCE TUNING

### Database Query Optimization

```typescript
// Before: N+1 query problem
const sessions = await prisma.activeVideoSession.findMany();
// Then loop and fetch user data separately

// After: Use include/select to join
const sessions = await prisma.activeVideoSession.findMany({
  include: {
    users: { select: { id: true, name: true, avatarUrl: true } },
  },
});

// Use pagination
const sessions = await prisma.activeVideoSession.findMany({
  skip: (page - 1) * limit,
  take: limit,
});
```

### API Caching Strategy

```typescript
// Cache stats for 1 minute
const getCachedStats = async () => {
  const cacheKey = "moderator-stats";
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const stats = await calculateStats();
  await redis.setex(cacheKey, 60, JSON.stringify(stats));

  return stats;
};
```

### Frontend Performance

```typescript
// Memoize expensive calculations
const formattedItems = useMemo(() => {
  return items.map(item => formatQuarantineResponse(item))
}, [items])

// Lazy load charts
const AgreementChart = lazy(() => import('./AgreementChart'))
<Suspense fallback={<Skeleton height={200} />}>
  <AgreementChart data={trendData} />
</Suspense>

// Virtualize long lists (optional enhancement)
import { FixedSizeList } from 'react-window'
```

---

## SECURITY CHECKLIST

- [ ] Verify user authentication on all API routes
- [ ] Validate request body with Zod/Joi schema
- [ ] Implement rate limiting (100 requests/minute per user)
- [ ] Add CORS headers (specify whitelist domains)
- [ ] Use HTTPS/WSS in production
- [ ] Sanitize user inputs before database queries
- [ ] Implement audit logging for all moderation actions
- [ ] Add CSRF protection if using cookies
- [ ] Verify WebSocket authentication before emitting
- [ ] Encrypt sensitive data (passwords, API keys)
- [ ] Implement request signing/verification
- [ ] Add database encryption at rest
- [ ] Review Prisma query security

---

## INCIDENT RESPONSE

### Common Issues & Resolutions

**WebSocket Disconnection:**

```
1. Check browser console for errors
2. Verify WSS URL in NEXT_PUBLIC_WS_URL env var
3. Confirm CORS configuration in Socket.io
4. Check if server is running and listening
5. Verify firewall/proxy not blocking WebSocket
6. Check automatic reconnection is working (20s fallback)
```

**Slow Queue Loading:**

```
1. Check database query performance:
   EXPLAIN ANALYZE SELECT * FROM ActiveVideoSession ...
2. Verify indexes exist on status, priority, createdAt
3. Check if pagination limit is reasonable (default: 15)
4. Monitor database connection pool usage
5. Enable slow query logging if > 500ms
```

**Fatigue Alerts Not Triggering:**

```
1. Verify moderatorAnalyticsService is loaded
2. Check if WebSocket is connected
3. Verify fatigue threshold (default: > 75)
4. Check moderator activity data exists in DB
5. Test calculateFatigueScore directly
```

**CSV Export Issues:**

```
1. Ensure items array is populated
2. Check special characters in data (quotes, newlines)
3. Verify file download doesn't block popup
4. Test with small dataset first
```

---

## BACKUP & RECOVERY

### Database Backup Schedule

```bash
# Daily backup at 2 AM
0 2 * * * pg_dump $DATABASE_URL > backups/db-$(date +%Y%m%d).sql

# Weekly compression
0 3 * * 0 gzip backups/db-* &&  \
  aws s3 sync backups/ s3://backup-bucket/video-date/
```

### Recovery Procedure

```bash
# List backups
ls -la backups/

# Restore from backup
psql $DATABASE_URL < backups/db-20260219.sql

# Run migrations if schema changed
npx prisma migrate deploy
```

---

## CAPACITY PLANNING

**Current Assumptions:**

- 100 concurrent moderators
- 1000 active sessions per day
- 50 decisions per moderator per hour
- 5000 total sessions stored per month

**Scale Targets:**

- 500 concurrent moderators (5x)
- 5000 active sessions (5x)
- Need: Database sharding, Redis caching, load balancing

**Resource Requirements:**

- CPU: 2-4 cores (can scale horizontally)
- Memory: 4-8 GB (API + cache)
- Database: 10 GB initial (can grow)
- Storage: 1 TB/month for logs + exports

---

## ROLLBACK PLAN

If production deploy fails:

```bash
# Option 1: Revert database migrations
npx prisma migrate resolve --rolled-back add_video_control_schema

# Option 2: Revert to previous code commit
git revert HEAD

# Option 3: Restore from database backup
psql $DATABASE_URL < backups/db-pre-deploy.sql

# Option 4: Scale down new deployment
docker-compose scale video-date-api=0
docker-compose scale video-date-api=2
```

---

## SUCCESS METRICS

**After 1 Month:**

- [ ] 95% uptime (target)
- [ ] 99.5% API availability
- [ ] < 1% error rate
- [ ] Average response time < 500ms
- [ ] 90% moderator satisfaction
- [ ] 85%+ AI agreement rate

**After 3 Months:**

- [ ] System handles 5x traffic
- [ ] 99.9% uptime
- [ ] Moderator decisions 40% faster
- [ ] 90% fatigue alert acceptance
- [ ] < 5% false positive escalations

---

**Document Owner:** Engineering Team
**Last Updated:** February 19, 2026
**Review Frequency:** Monthly
**Status:** Ready for Production ✅
