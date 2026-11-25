# Video Date Feature Control Architecture

## Overview

This document outlines the **Admin-Staff separation of concerns** for video date features. The system implements a clear policy boundary:

- **ADMIN**: Policy, Control, Monetization, System Integrity
- **STAFF**: Operations, Moderation, Support

---

## 1. Admin Dashboard Controls

### Location: `/admin/video-date/settings`

Admins control **what is allowed** system-wide. All settings are:

- ✅ Audit logged with timestamp + admin ID
- ✅ Version controlled for rollback
- ✅ Broadcast to live components
- ✅ Compliance-verified before save

#### 1.1 Calendar Follow-up Flow

**Admin Controls:**

```
✓ Enable/disable per intent (faith / casual / professional)
✓ Rules: both-must-accept, cooldown days, max per week
✓ Integrations: Google, Apple, internal only
```

**Staff Sees:**

- Usage metrics (follow-up completion rate)
- Failed follow-ups (calendar validation errors)
- Abuse patterns (users exceeding limits)

**Component:** `FollowupSettingsControl.tsx`

---

#### 1.2 AI Icebreaker Panel

**Admin Controls:**

```
✓ Enable/disable feature
✓ Prompt templates per intent
✓ Banned topics list (e.g., "politics", "religion")
✓ Response length min/max
✓ AI provider: OpenAI / Anthropic / Local
✓ Rate limits: per-user and global
✓ Tone presets: respectful, fun, professional
```

**Staff Sees:**

- Icebreaker success rates (% users engage)
- Flagged outputs (manually reviewed)
- Prompt feedback (what works best)

**Component:** `IcebreakerSettingsControl.tsx`

---

#### 1.3 Report / Block Safety Modal

**Admin Controls:**

```
✓ Report categories (Harassment, Inappropriate, etc.)
✓ Severity levels (low/medium/high/critical)
✓ Auto-actions: mute, suspend, shadow ban
✓ Compliance: GDPR, COPPA, faith-based safeguards
```

**Staff Sees:**

- Incoming reports queued by severity
- Case status (new → investigating → verified → resolved)
- Evidence & transcripts
- Action audit trail

**Component:** `SafetySettingsControl.tsx`

---

#### 1.4 Location Display Settings

**Admin Controls:**

```
✓ Precision level: city / region / hidden
✓ Require user opt-in (Y/N)
✓ Faith-based restrictions by intent
✓ Restricted countries list
✓ Regional compliance (GDPR, etc.)
```

**Staff Sees:**

- Location mismatch flags (user claimed vs. actual)
- Abuse signals (consecutive dates in suspicious locations)
- Compliance violations

**Component:** `LocationSettingsControl.tsx`

---

#### 1.5 Post-date Reflection Settings

**Admin Controls:**

```
✓ Enable/disable reflection flow
✓ Reflection questions per intent
✓ AI tone: supportive / neutral / values-focused
✓ Data retention: days before anonymize
✓ Affects matching: Y/N
```

**Staff Sees:**

- Aggregated sentiment dashboard
- Red-flag indicators (concerning patterns)
- User trend analysis

---

#### 1.6 Date Readiness Scoring

**Admin Controls:**

```
✓ Enable/disable scoring
✓ Scoring formula weights:
  - Punctuality: X%
  - Engagement: Y%
  - Respect: Z%
✓ Thresholds:
  - Ready: 75+
  - Needs Coaching: 50-75
  - Restricted: <50
```

**Staff Sees:**

- User readiness scores
- Intervention suggestions
- Coaching resource recommendations

**Component:** `ReadinessScoringControl.tsx`

---

#### 1.7 Subscription Gating (Future)

**Admin Controls:**

```
✓ Features by plan (free / pro / premium)
✓ Trial rules: days, trial features list
✓ Regional pricing: currency + monthly cost
✓ Community discounts: faith %, community %
```

**Staff Sees:**

- Support visibility only (cannot override)

---

#### 1.8 System Settings (Future)

**Admin Controls:**

```
✓ Enabled intents: faith / casual / professional
✓ Max call duration
✓ Recording enabled: Y/N
✓ Encryption required: Y/N
✓ Audit logging enabled: Y/N
```

**Staff Sees:**

- Read-only operational data

---

## 2. Staff Dashboard Operations

### Location: `/staff/video-monitor/dashboard`

Staff execute admin policies. They can **take action within admin rules** but cannot redefine rules.

### 2.1 Moderation Queue

**Component:** `ModerationQueue.tsx`

**Staff Responsibilities:**

```
✓ Review safety reports (flagged by automated systems)
✓ Investigate with call transcripts & evidence
✓ Update case status: new → investigating → verified → resolved/dismissed
✓ Apply enforcement actions within admin-defined auto-actions:
  - Mute (24h): no video/audio
  - Suspend (48h): full account lock
  - Shadow Ban: hidden from matchmaking
  - Send Warning: notify user
  - Escalate: to admin for policy guidance
✓ Document investigation notes
✓ Track case turnaround time
```

**Report Queue Features:**

- Quick stats: critical count, new cases, under review, resolved this week
- Color-coded severity (low/medium/high/critical)
- Expandable details: description, evidence, transcripts
- Status workflow: new → investigating → verified → action → resolved
- Staff notes field with audit trail

---

### 2.2 WebRTC Health Monitor

**Component:** `WebRTCHealthMonitor.tsx`

**Staff Responsibilities:**

```
✓ Monitor active call quality in real-time
✓ Watch for:
  - Connection drops
  - Bitrate degradation
  - High latency (>200ms)
  - Packet loss (>5%)
✓ Investigate specific calls
✓ Support users experiencing issues
✓ Track infrastructure health
```

**Metrics Tracked:**

- Duration (MM:SS format)
- Quality: excellent / good / fair / poor
- Bitrate: kbps (target: >1500)
- Latency: ms (target: <100)
- Packet loss: % (target: <3%)

---

### 2.3 Feedback Trends & User Insights

**Component:** `FeedbackTrends.tsx`

**Staff Responsibilities:**

```
✓ Monitor post-date feedback sentiment
✓ Identify user behavior patterns:
  - Would meet again rate
  - Connection vibe scores
  - Follow-up rates
✓ Flag red-flag users:
  - Repeated misrepresentation
  - Boundary violations
  - Safety concerns
✓ Review user compatibility scores
✓ Escalate concerning patterns to admin
```

**Insights Provided:**

- Sentiment aggregates (positive/neutral/negative)
- Community compatibility % per user
- Red flag indicators with auto-detection
- Trend lines: follow-up rate, vibe scores, sentiment

---

## 3. Data Flow Architecture

### 3.1 Admin Settings → User Components

```
Admin changes settings
    ↓
API POST /api/admin/video-date/settings
    ↓
Database saves + audit log
    ↓
Real-time broadcast to all connected clients (WebSocket)
    ↓
User components read from settings context
    ↓
UI re-renders with new constraints
```

**Example:** Admin sets `icebrakerEnabled: false`
→ All users see icebreaker button disabled
→ Users cannot trigger icebreaker prompts

---

### 3.2 User Action → Staff Moderation

```
User submits safety report
    ↓
API POST /api/date-feedback or /api/safety-report
    ↓
Database creates Report record
    ↓
Real-time notification to staff
    ↓
Staff Queue updated with new report
    ↓
Staff investigates, updates status
    ↓
Staff applies action (within admin policy)
    ↓
Database updates user restrictions
    ↓
Next video call, user sees warning or is blocked
```

---

## 4. API Endpoints Reference

### Admin Endpoints

```
POST   /api/admin/video-date/settings
       Save feature settings (followup, icebreaker, safety, etc.)

GET    /api/admin/video-date/settings
       Fetch all current settings

GET    /api/admin/video-date/audit-log
       Fetch settings change history with admin ID, timestamp, diff
```

### Staff Endpoints

```
GET    /api/staff/video-monitor/reports
       Fetch safety reports queue (paginated, sortable by severity)

PATCH  /api/staff/video-monitor/reports/[reportId]
       Update report status (new/investigating/verified/resolved/dismissed)

POST   /api/staff/video-monitor/reports/[reportId]/action
       Apply enforcement action (mute/suspend/shadowBan/warn/escalate)

GET    /api/staff/video-monitor/active-calls
       Fetch real-time connection metrics for all active calls

GET    /api/staff/video-monitor/feedback-trends
       Fetch sentiment trends over time (7d, 30d, custom)

GET    /api/staff/video-monitor/user-insights
       Fetch aggregated user behavior patterns & red flags
```

---

## 5. Settings Data Types

### CalendarFollowupSettings

```typescript
{
  enabledByIntent: { faith, casual, professional } // boolean each
  rules: {
    bothMustAccept: boolean
    cooldownDays: number
    maxPerWeek: number
  }
  integrationsAllowed: ('google' | 'apple' | 'internal')[]
  updatedAt: Date
  updatedBy: string (admin ID)
}
```

### IcebreakerSettings

```typescript
{
  enabled: boolean
  promptTemplates: { faith: [], casual: [], professional: [] }
  safetyFilters: {
    banTopics: string[]
    minLength: number
    maxLength: number
  }
  tonePresets: { faith: string, casual: string, professional: string }
  aiProvider: 'openai' | 'anthropic' | 'local'
  rateLimit: { perUser: number, perDay: number }
  updatedAt: Date
  updatedBy: string
}
```

See `/apps/web/src/types/video-date-settings.ts` for all types.

---

## 6. Audit & Compliance

### Settings Audit Log

Every admin setting change is recorded:

```
{
  id: "audit_1708426800"
  adminId: "admin_123"
  adminName: "Sarah Admin"
  settingsType: "safety"
  changes: [
    {
      field: "autoActions.suspend",
      oldValue: false,
      newValue: true
    }
  ]
  timestamp: 2024-02-19T15:00:00Z
  reason: "GDPR compliance update"
}
```

### Report Audit Trail

Every moderation action is logged:

```
{
  reportId: "report_456"
  staffId: "staff_789"
  action: "applied suspension"
  notes: "User repeated harassment after warning"
  timestamp: 2024-02-19T15:05:00Z
  actionId: "action_xyz"
}
```

---

## 7. Permission Model

### Admin Permissions

```
✓ Create/Read/Update settings
✓ View audit logs
✓ Override staff decisions (escalation)
✓ Create compliance policies
✓ Access analytics dashboard
```

### Staff Permissions

```
✓ Read: reports, feedback, insights
✓ Update: report status
✓ Execute: mute, suspend, shadow ban, warn, escalate
✗ Create policies
✗ Change settings
✗ Access financial data
```

**Enforcement:** Check `dp_admin` and `dp_staff` cookies on each request.

---

## 8. Implementation Checklist

### Phase 1: Core Admin Controls (MVP) ✅

- [x] Settings type definitions
- [x] Admin control components (5 controls)
- [x] Admin dashboard page
- [x] Admin API endpoint (POST/GET)
- [x] Audit logging framework

### Phase 2: Staff Moderation (Next Sprint) 🔄

- [x] Moderation queue component
- [x] WebRTC monitor component
- [x] Feedback trends component
- [x] Staff dashboard page
- [x] Staff API endpoints (reports, actions)

### Phase 3: Backend Integration (Backend Team)

- [ ] Implement database models (SettingsConfig, SettingsAuditLog, SafetyReport)
- [ ] Connect Prisma schema migrations
- [ ] Implement settings broadcast (WebSocket)
- [ ] Integrate enforcement actions (mute user, suspend, shadow ban)
- [ ] Implement audit logging middleware

### Phase 4: Real-time Features

- [ ] WebSocket for live report notifications
- [ ] Real-time settings push to clients
- [ ] Live call metrics streaming
- [ ] Staff status indicators

---

## 9. Key Features Summary

| Feature                  | Admin-Owned  | Staff-Owned | Shared        |
| ------------------------ | ------------ | ----------- | ------------- |
| Calendar follow-up rules | ✓ Policy     | -           | Metrics       |
| Icebreaker prompts       | ✓ Templates  | -           | Success rates |
| Safety categories        | ✓ Categories | Enforcement | -             |
| Location precision       | ✓ Level      | Detection   | Abuse flags   |
| Reflection questions     | ✓ Content    | -           | Sentiment     |
| Readiness scoring        | ✓ Formula    | -           | Scores        |
| Moderation actions       | Approves     | ✓ Executes  | Case audit    |
| WebRTC infrastructure    | ✓ Providers  | Monitoring  | Health        |

---

## 10. Error Handling & Edge Cases

### When Admin Changes Setting Mid-Call

1. Setting is saved to database
2. Broadcasting notifies all clients
3. Active calls can still complete (no interruption)
4. New calls use updated setting
5. Example: If icebreaker disabled mid-call, new users get disabled

### When Staff Applies Action to Active User

1. User is muted/suspended immediately
2. If in call, connection warning shown ("Session suspended")
3. User can reconnect after cooldown (if applicable)
4. Report status updated to "resolved"
5. Audit logged with staff ID

### When Report Gets Auto-Verified by System

1. Multiple user flags trigger verification
2. Auto-action executes (per admin policy)
3. Staff is notified for manual review
4. Staff can approve/override
5. Final action logged with chain of custody

---

## 11. Next Steps

**For Admins:**

- Configure settings at `/admin/video-date/settings`
- Review audit log monthly
- Adjust thresholds based on reports

**For Staff:**

- Monitor dashboard daily: `/staff/video-monitor/dashboard`
- Process new reports within 2 hours (SLA)
- Escalate edge cases to admin
- Document reasoning in notes

**For Engineering:**

- Implement database persistence
- Add WebSocket broadcasting
- Integrate with enforcement systems
- Build reporting analytics

---

**Document Version:** 1.0
**Last Updated:** 2024-02-19
**Status:** Ready for Implementation
