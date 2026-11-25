# 🎥 Video Call System - Complete Implementation Guide

## 📋 Overview

This document outlines the complete video dating system implementation for DatePage/DateBuk platform, following 2026 industry standards for dating applications.

## 🏗️ Architecture

### Tech Stack

**Frontend/Web:**

- Next.js 14+ (React) with TypeScript
- WebRTC for peer-to-peer video
- Socket.io for signaling
- Tailwind CSS for UI

**Backend:**

- Node.js + Next.js API Routes
- PostgreSQL (user data, matches, sessions)
- Redis (real-time sessions, caching)
- Socket.io signaling server (apps/signaling)

**Video Infrastructure:**

- WebRTC (peer-to-peer core)
- STUN/TURN servers (Google STUN or self-hosted TURN)
- Recommended: Agora.io or 100ms for production (managed WebRTC)

**Security & Verification:**

- Liveness Detection: Persona, Veriff, or AWS Rekognition
- VPN Detection: IP2Proxy or MaxMind
- Rate Limiting: Upstash Redis
- End-to-End Encryption: Built into WebRTC

---

## 📁 File Structure

```
apps/web/src/
├── app/
│   ├── (app)/
│   │   ├── video-call/
│   │   │   └── [roomId]/
│   │   │       ├── page.tsx                    # Main video call interface
│   │   │       └── page-enhanced.tsx           # Enhanced version with all features
│   │   ├── video-schedule/
│   │   │   └── page.tsx                        # Scheduled video dates management
│   │   └── verification/
│   │       └── page.tsx                        # Identity verification flow
│   └── api/
│       ├── video-session/
│       │   ├── create/route.ts                 # Create video session
│       │   ├── verify/route.ts                 # Identity verification
│       │   ├── location-share/route.ts         # Location sharing
│       │   ├── report/route.ts                 # Safety reports
│       │   └── schedule/route.ts               # Scheduling API
│       └── security/
│           └── ip-geolocation/route.ts         # VPN/IP detection
├── components/
│   └── video/
│       ├── VideoCallControls.tsx               # Mute, video, end call, safety
│       ├── VideoCallTimer.tsx                  # Time-limited call timer
│       ├── LocationShareDialog.tsx             # Location consent dialog
│       ├── SafetyPanel.tsx                     # Report/block interface
│       ├── IcebreakerPrompt.tsx                # Conversation starters
│       └── EndCallDialog.tsx                   # Post-call actions
├── lib/
│   ├── webrtc/
│   │   └── peer.ts                             # WebRTC peer connection logic
│   └── security/
│       └── vpn-detection.ts                    # VPN/spoofing detection
└── ...

apps/signaling/
└── src/
    └── index.ts                                # WebRTC signaling server
```

---

## 🎯 Features Implemented

### ✅ Core Video Features

1. **One-tap Video Initiation**
   - Direct video call from match profile
   - Automatic room creation
   - Instant signaling connection

2. **Time-Limited Calls**
   - Default: 3 minutes for free users
   - Premium: Extended time (5+ minutes)
   - Countdown timer with warnings at 30s
   - Auto-end when time expires

3. **Scheduled Video Dates**
   - Calendar picker for scheduling
   - Automatic reminders (1hr, 15min before)
   - Confirmation system
   - Cancel/reschedule options

4. **Media Controls**
   - Mute/unmute audio
   - Toggle video on/off
   - End call button
   - Quality: Auto-adaptive bitrate (WebRTC default)

### 🛡️ Safety & Trust Features

5. **Identity Verification**
   - Liveness detection (smile, head turn)
   - Verified badge system
   - 30-day expiration
   - Required before video dates
   - Reduces catfishing by 70-90%

6. **Approximate Location Sharing**
   - Mutual consent required
   - Shows city + radius (8-10 miles)
   - Displayed as on-screen overlay
   - Ephemeral (expires after call)
   - Only for verified users

7. **Report & Block System**
   - One-tap report during call
   - Categories: Harassment, Inappropriate, Safety, Spam, Fake
   - High-priority auto-actions
   - Screenshot optional
   - Immediate moderation queue

8. **Emergency Button**
   - Share exact location with emergency contact
   - Option to call 911
   - Auto-end call and report
   - Visible red button in controls

9. **VPN/Spoofing Nullification**
   - IP geolocation check
   - GPS vs IP comparison
   - Risk scoring (0-100)
   - Enforcement actions:
     - 80+: Block video calls
     - 60+: Restrict location sharing
     - 40+: Warning
     - <40: Allow
   - Timezone mismatch detection

10. **No Secret Recording**
    - Recording disabled by default
    - Dual consent popup if enabled
    - Policy shown on first call

### 🎨 Premium Features

11. **Icebreaker Prompts**
    - Random conversation starters
    - Shown at call start
    - 10 preset prompts
    - Dismissible overlay

12. **Virtual Background** (Planned)
    - Blur background
    - Preset backgrounds
    - Privacy protection

13. **Post-Call Actions**
    - Plan in-person date
    - Share meet-up ideas
    - Continue chatting
    - Rate experience

14. **Low-Data Fallback** (Planned)
    - Auto-detect bandwidth
    - Switch to audio-only
    - Quality adaptation

---

## 🔧 API Endpoints

### Video Session Management

**POST** `/api/video-session/create`

```json
{
  "matchId": "user123",
  "scheduledTime": "2026-02-20T19:00:00Z", // optional
  "duration": 180 // seconds
}
```

**Response:**

```json
{
  "success": true,
  "session": {
    "id": "session_xxx",
    "roomId": "room_yyy",
    "status": "ready",
    "expiresAt": "...",
    "participants": ["user1", "user2"]
  }
}
```

### Identity Verification

**POST** `/api/video-session/verify`

```json
{
  "userId": "user123",
  "livenessScore": 0.95,
  "faceHash": "hash_xxx"
}
```

**GET** `/api/video-session/verify?userId=user123`

### Location Sharing

**POST** `/api/video-session/location-share`

```json
{
  "sessionId": "session_xxx",
  "userId": "user123",
  "consent": true,
  "location": {
    "city": "Bowie",
    "state": "MD",
    "radius": 8
  }
}
```

**GET** `/api/video-session/location-share?sessionId=xxx`

### Safety Reports

**POST** `/api/video-session/report`

```json
{
  "sessionId": "session_xxx",
  "reportedUserId": "user456",
  "reason": "harassment",
  "description": "Details...",
  "screenshot": "base64..." // optional
}
```

### Scheduling

**POST** `/api/video-session/schedule`

```json
{
  "matchId": "user123",
  "scheduledTime": "2026-02-20T19:00:00Z",
  "duration": 300,
  "timezone": "America/New_York"
}
```

**GET** `/api/video-session/schedule` - Get upcoming calls

**DELETE** `/api/video-session/schedule?sessionId=xxx` - Cancel

### Security

**POST** `/api/security/ip-geolocation`

```json
{
  "ip": "1.2.3.4" // optional, uses request IP if empty
}
```

---

## 🚀 Implementation Steps

### Phase 1: Basic Video Calls (COMPLETED ✅)

- [x] WebRTC peer connection setup
- [x] Signaling server integration
- [x] Basic video call UI
- [x] Media controls (mute, video toggle, end call)

### Phase 2: Enhanced Features (COMPLETED ✅)

- [x] Time-limited calls with countdown
- [x] Full-screen video interface
- [x] Floating local video
- [x] Status overlays
- [x] Enhanced controls bar

### Phase 3: Safety & Verification (COMPLETED ✅)

- [x] Verification page UI
- [x] Verification API endpoints
- [x] Safety panel (report/block)
- [x] Auto-moderation system
- [x] VPN detection utility
- [x] Location sharing consent dialog

### Phase 4: Scheduling (COMPLETED ✅)

- [x] Schedule page UI
- [x] Schedule API endpoints
- [x] Upcoming calls display
- [x] Cancel/reschedule logic

### Phase 5: Premium Features (COMPLETED ✅)

- [x] Icebreaker prompts
- [x] End-call dialog with actions
- [x] Time extension for premium
- [x] Location on-screen display

### Phase 6: Production Ready (TODO 🔄)

- [ ] Integrate Agora or 100ms SDK
- [ ] Connect to PostgreSQL database
- [ ] Implement Redis session management
- [ ] Connect Persona/Veriff for verification
- [ ] Setup IP2Proxy for VPN detection
- [ ] Implement push notifications (FCM)
- [ ] Add TURN server for NAT traversal
- [ ] Setup cron jobs for reminders
- [ ] Load testing
- [ ] E2E testing with Playwright

---

## 🔐 Security Measures

### 1. End-to-End Encryption

- WebRTC native encryption (DTLS-SRTP)
- Signaling via WSS (secure WebSocket)

### 2. Rate Limiting

```typescript
// Example rate limit config
{
  maxCallsPerDay: 10,
  maxReportsPerUser: 3,
  maxVerificationAttempts: 3
}
```

### 3. VPN Detection Flow

```
User initiates video call
  ↓
Check IP geolocation
  ↓
Compare with GPS location
  ↓
Calculate distance & risk score
  ↓
Enforcement action:
  - <40: Allow
  - 40-60: Warn
  - 60-80: Restrict
  - 80+: Block
```

### 4. Verification Requirements

- Required before first video call
- Expires after 30 days
- Re-verification prompt
- Liveness score > 0.90 required

---

## 📱 Mobile App Integration

The same API endpoints work for both web and mobile (React Native).

### React Native Integration:

```bash
npm install react-native-webrtc socket.io-client
```

### Key Differences:

- Use `react-native-webrtc` instead of browser WebRTC
- Push notifications via Firebase/OneSignal
- Native camera/mic permissions
- Background call handling

---

## 🧪 Testing

### Local Testing:

1. Start signaling server: `cd apps/signaling && pnpm dev`
2. Start web app: `cd apps/web && pnpm dev`
3. Open two browser tabs with same room ID
4. Click "Start Call" in one tab

### Test Credentials:

```
Verification: Mock liveness (auto-pass)
VPN Detection: Returns mock data
Location: Uses browser GPS or mock data
```

---

## 📊 Database Schema (Recommended)

```sql
-- Video Sessions
CREATE TABLE video_sessions (
  id UUID PRIMARY KEY,
  room_id VARCHAR(255) UNIQUE NOT NULL,
  match_id UUID NOT NULL,
  user_id UUID NOT NULL,
  scheduled_time TIMESTAMP,
  duration INTEGER DEFAULT 180,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (match_id) REFERENCES users(id)
);

-- User Verification
CREATE TABLE user_verifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  verified BOOLEAN DEFAULT false,
  liveness_score FLOAT,
  face_hash VARCHAR(255),
  verified_at TIMESTAMP,
  expires_at TIMESTAMP,
  method VARCHAR(50) DEFAULT 'liveness_detection',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  session_id UUID,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason VARCHAR(100),
  description TEXT,
  screenshot_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (reported_user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES video_sessions(id)
);

-- Location Shares (Ephemeral - use Redis)
-- Stored in Redis with TTL of 1 hour
```

---

## 🔗 Third-Party Integrations

### Recommended Providers:

| Feature                | Recommended          | Alternative        | Notes                    |
| ---------------------- | -------------------- | ------------------ | ------------------------ |
| **Video SDK**          | Agora.io             | 100ms, Twilio      | Low latency, mobile SDKs |
| **Verification**       | Persona              | Veriff, Vouched    | Liveness detection       |
| **VPN Detection**      | IP2Proxy             | MaxMind            | 99% accuracy             |
| **Push Notifications** | Firebase (FCM)       | OneSignal          | Free tier available      |
| **Geolocation**        | ipapi.co             | ipstack, MaxMind   | Free tier: 1000/day      |
| **TURN Server**        | Twilio NAT Traversal | Self-hosted coturn | Handles NAT/firewall     |

---

## 💰 Cost Estimates (Monthly)

**Free Tier (Self-hosted):**

- Signaling: $0 (self-hosted)
- WebRTC: $0 (peer-to-peer)
- Database: $25 (PostgreSQL)
- Storage: $10 (images/videos)
- **Total: ~$35/month**

**Production (1000 active users):**

- Video (Agora): $500 (10,000 minutes)
- Verification (Persona): $200 (400 verifications)
- VPN Detection (IP2Proxy): $29
- Database: $50
- Redis: $29
- Push Notifications: Free (FCM)
- **Total: ~$808/month**

---

## 📚 Documentation Links

- [WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Agora Flutter SDK](https://docs.agora.io/en/video-calling/get-started/get-started-sdk)
- [Persona Verification](https://docs.withpersona.com/)
- [IP2Proxy API](https://www.ip2location.com/web-service/ip2proxy)
- [Socket.io Documentation](https://socket.io/docs/v4/)

---

## 🐛 Troubleshooting

### Common Issues:

**Video not connecting:**

- Check firewall/NAT settings
- Ensure STUN server is accessible
- Add TURN server for restrictive networks
- Verify both users granted camera/mic permissions

**Audio echo:**

- Ensure local video is muted
- Add echo cancellation: `echoCancellation: true` in getUserMedia

**High latency:**

- Check network connection
- Consider TURN server instead of STUN
- Reduce video resolution/bitrate

**Verification failing:**

- Ensure good lighting
- Clear face visibility
- Check camera permissions
- Try different browser

**VPN detection false positives:**

- Adjust risk score thresholds
- Whitelist corporate IPs
- Consider geography (some regions have limited routing)

---

## 🚦 Next Steps

1. **Replace with production page:**

   ```bash
   mv apps/web/src/app/(app)/video-call/[roomId]/page-enhanced.tsx apps/web/src/app/(app)/video-call/[roomId]/page.tsx
   ```

2. **Connect to database:**
   - Setup Prisma schema
   - Replace mock data with real DB queries

3. **Integrate Agora SDK:**

   ```bash
   npm install agora-rtc-sdk-ng
   ```

4. **Setup verification provider:**
   - Sign up for Persona/Veriff
   - Add API keys to `.env`
   - Implement SDK integration

5. **Configure push notifications:**
   - Setup Firebase project
   - Add FCM credentials
   - Implement reminder cron jobs

6. **Deploy signaling server:**
   - Docker containerize
   - Deploy to cloud (AWS, GCP, Render)
   - Setup load balancing for scale

---

## 📞 Support

For implementation questions or issues:

- Check existing code comments
- Review API endpoint documentation
- Test with browser dev tools (Network & Console tabs)
- Check signaling server logs

---

**Last Updated:** February 17, 2026  
**Version:** 1.0.0  
**Status:** Phase 1-5 Complete ✅ | Phase 6 In Progress 🔄
