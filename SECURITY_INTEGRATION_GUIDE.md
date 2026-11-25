# Advanced Security Features - Integration Guide

## Quick Start

All advanced security features have been implemented and are ready to use. Here's how to integrate them:

---

## 📋 What's Available

### Core Services (Ready to Inject)

- ✅ **RedisService** - Caching, rate limiting, real-time metrics
- ✅ **MlService** - ML fraud prediction with fallback
- ✅ **RiskEngine** - Multi-factor risk assessment (0-100 scale)
- ✅ **FraudEventTracker** - Event logging and moderation integration

### Controllers (Production-Ready)

- ✅ **FraudController** - Fraud event management
- ✅ **ModeratorController** - Moderation queue workflow
- ✅ **ExperimentController** - A/B testing framework

### Database Models (9 Entities)

- ✅ IpLog, IpBlacklist, IpIntelCache
- ✅ FraudEvent, FraudFeedback, FraudExplanation
- ✅ ModeratorQueue, SecurityMetric, ExperimentAssignment

---

## 🔧 Integration Steps

### Step 1: Inject Into Auth Service

**File:** `apps/api/src/auth/auth.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { RiskEngine } from "../common/risk/risk.engine";
import { MlService } from "../common/ml/ml.service";
import { FraudEventTracker } from "../common/fraud/fraud-event-tracker";
import { RedisService } from "../common/redis/redis.service";

@Injectable()
export class AuthService {
  constructor(
    // ... existing dependencies
    private riskEngine: RiskEngine,
    private mlService: MlService,
    private fraudTracker: FraudEventTracker,
    private redis: RedisService,
  ) {}

  async login(email: string, password: string, req: any) {
    // Get IP from request
    const clientIp = req.ip || req.headers["x-forwarded-for"];

    // 1. Calculate risk
    const risk = await this.riskEngine.evaluateFullRisk({
      ipIntel: req.ipIntel, // From middleware
      deviceId: req.deviceFingerprint, // From middleware
      mlScore: (
        await this.mlService.predict({
          /* features */
        })
      ).fraudScore,
      previousAttempts: await this.redis.get(`login:${clientIp}`),
    });

    // 2. Make decision
    if (risk.shouldBlock) {
      // Log and block
      await this.fraudTracker.trackEvent({
        userId: user.id,
        ip: clientIp,
        eventType: "login_blocked",
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
      });
      throw new UnauthorizedException("High risk detected");
    }

    if (risk.requiresChallenge) {
      // Send SMS
      await this.smsService.sendCode(user.phone);
      return { requiresSms: true };
    }

    // 3. Login success
    await this.fraudTracker.trackEvent({
      userId: user.id,
      ip: clientIp,
      eventType: "login_success",
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
    });

    return { token: this.generateToken(user) };
  }
}
```

### Step 2: Update Auth Controller

**File:** `apps/api/src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  async login(@Body() { email, password }, @Req() req: Request) {
    // Risk assessment happens in service
    return this.authService.login(email, password, req);
  }

  @Post("signup")
  async signup(@Body() { email, password, phone }, @Req() req: Request) {
    // Same risk assessment for signup
    return this.authService.signup(email, password, phone, req);
  }
}
```

### Step 3: Add Security Middleware

**File:** `apps/api/src/common/middleware/security.middleware.ts`

```typescript
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { IpService } from "../../ip/ip.service";

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private ipService: IpService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract client IP
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress;
    req["clientIp"] = clientIp;

    // Get IP intelligence
    const ipIntel = await this.ipService.getIpIntel(clientIp);
    req["ipIntel"] = ipIntel;

    // Extract device fingerprint
    const userAgent = req.headers["user-agent"];
    const fingerprint = require("crypto")
      .createHash("sha256")
      .update(`${clientIp}:${userAgent}:${req.headers["accept-language"]}`)
      .digest("hex");
    req["deviceFingerprint"] = fingerprint;

    next();
  }
}
```

### Step 4: Register Middleware in App Module

**File:** `apps/api/src/app.module.ts` (Update existing)

```typescript
import { MiddlewareConsumer, NestModule } from "@nestjs/common";
import { SecurityMiddleware } from "./common/middleware/security.middleware";

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware).forRoutes("auth", "api"); // Apply to auth and api routes
  }
}
```

---

## 🧪 Testing the Features

### 1. Run Validation Test

```bash
node scripts/test-advanced-security.js
```

### 2. Test Risk Scoring

```typescript
// Test what happens at different risk levels
const testCases = [
  {
    name: "Low Risk",
    factors: { ipRep: 10, deviceTrust: 90, mlScore: 0.1 },
    expectedDecision: "ALLOW",
  },
  {
    name: "Medium Risk",
    factors: { ipRep: 50, deviceTrust: 40, mlScore: 0.4 },
    expectedDecision: "CHALLENGE",
  },
  {
    name: "High Risk",
    factors: { ipRep: 80, deviceTrust: 10, mlScore: 0.75 },
    expectedDecision: "BLOCK",
  },
];
```

### 3. Test Fraud Tracking

```bash
# Check fraud events
curl http://localhost:3000/admin/fraud/events

# Get statistics
curl http://localhost:3000/admin/fraud/stats

# View moderation queue
curl http://localhost:3000/admin/moderator/queue
```

---

## 📊 API Endpoints Overview

### Fraud Management

```
GET  /admin/fraud/events          - List fraud events
GET  /admin/fraud/events/:id      - event details
POST /admin/fraud/events/:id/feedback - Provide feedback
GET  /admin/fraud/stats           - Fraud statistics
POST /admin/fraud/blacklist/add   - Blacklist IP
GET  /admin/fraud/blacklist/check/:ip - Check if blacklisted
GET  /admin/fraud/ip/:ip/events   - Events from IP
```

### Moderation Queue

```
GET  /admin/moderator/queue       - View pending items
GET  /admin/moderator/queue/stats - Queue metrics
POST /admin/moderator/queue/:id/assign  - Assign to moderator
POST /admin/moderator/queue/:id/review  - Review decision
GET  /admin/moderator/my-queue    - My assigned items
```

### A/B Testing

```
POST /admin/experiment/create     - Create experiment
GET  /admin/experiment/variant/:expId  - Get user's variant
GET  /admin/experiment/results/:expId  - Compare variants
GET  /admin/experiment/list       - All experiments
POST /admin/experiment/end/:expId - End experiment
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# ML Service
ML_ENDPOINT=http://localhost:5000/predict
SHADOW_MODE=false

# Security
ADMIN_IPS=192.168.1.1,192.168.1.2
IP_API_KEY=your-api-key
```

### Risk Thresholds

```typescript
// In RiskEngine
const RISK_LEVELS = {
  ALLOW: 20, // 0-20
  CHALLENGE: 40, // 21-40
  HIGH: 80, // 41-80
  CRITICAL: 100, // 81+
};
```

### Weights

```typescript
// Multi-factor scoring weights (totals 1.0)
const WEIGHTS = {
  mlScore: 0.35, // ML model prediction
  ipReputation: 0.25, // IP intelligence
  deviceTrust: 0.15, // Device fingerprint
  velocity: 0.1, // Rate limiting
  accountAge: 0.1, // Account age
  behavior: 0.05, // Behavioral patterns
};
```

---

## 🚀 Advanced Features

### 1. Shadow ML Mode

Test new ML models without affecting decisions:

```typescript
if (experiment.variant === "treatment_a") {
  await mlService.shadowPredict(features); // Model runs but doesn't affect decision
}
```

### 2. Feedback Loop

Collect human feedback to improve ML:

```typescript
await fraudTracker.provideFeedback({
  eventId: 1,
  feedback: "fraud", // 'fraud' | 'legitimate' | 'unsure'
  notes: "Confirmed account takeover",
  reviewedBy: "mod-123",
});
// Automatically triggers ML retraining
```

### 3. Deterministic A/B Testing

Users always get same variant:

```typescript
// Hash-based assignment (deterministic)
const variant = hashFunction(userId) % variants.length;
// User with ID X always gets same variant across sessions
```

### 4. Real-Time Metrics

Use Redis for instant dashboards:

```typescript
const metrics = await redis.getJson("fraud:metrics:hourly");
// Returns: { fraudEvents: 34, uniqueIps: 8, avgRiskScore: 42 }
```

---

## 📝 Checklist for Full Implementation

- [ ] Install dependencies: `npm install ioredis`
- [ ] Configure Redis connection in `.env`
- [ ] Run database migration: `npx prisma migrate dev`
- [ ] Add SecurityMiddleware to AppModule
- [ ] Inject services into AuthService
- [ ] Update login/signup endpoints
- [ ] Test fraud detection with test cases
- [ ] Set up moderator dashboard
- [ ] Configure admin access controls
- [ ] Set up ML endpoint connection
- [ ] Create monitoring/alerting

---

## 🔍 Monitoring & Alerts

### Key Metrics to Monitor

- **Fraud rate** - % of events flagged as fraud
- **False positive rate** - Legitimate users challenged
- **Moderation queue depth** - Pending reviews
- **ML model accuracy** - Fraud prediction precision
- **Performance** - Risk assessment latency

### Alert Thresholds

- Fraud rate > 5% in last 30 minutes
- Moderation queue > 50 items
- Risk assessment > 500ms average
- ML endpoint down for > 5 minutes

---

## 🎯 Next Steps

1. **Install Redis**: `npm install ioredis`
2. **Run Database Migration**: `npx prisma migrate dev`
3. **Configure Environment**: Set ML_ENDPOINT and Redis connection
4. **Integrate into Auth**: Add RiskEngine to login flow
5. **Test & Validate**: Run `node scripts/test-advanced-security.js`
6. **Monitor**: Set up alerts for high fraud rates

---

## 📚 Architecture Diagram

```
User Login
    ↓
SecurityMiddleware (Extract IP, device, user-agent)
    ↓
AuthService.login()
    ├─ RiskEngine.evaluateFullRisk()
    │  ├─ IP Reputation (25%)
    │  ├─ ML Prediction (35%)
    │  ├─ Device Trust (15%)
    │  ├─ Velocity Check (10%)
    │  └─ Account Age (10%)
    ├─ Decision: Allow/Challenge/Block
    └─ FraudEventTracker.trackEvent()
        ├─ Save to Prisma (authoritative)
        ├─ Update Redis (real-time)
        └─ Auto-queue if risk > 70
            ↓
    ModeratorQueue ← Human Review
            ↓
    Feedback → ML Retraining
```

---

**Status: ✅ All features implemented and ready to integrate!**
