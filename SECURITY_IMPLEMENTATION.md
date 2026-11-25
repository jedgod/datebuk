# Security Implementation Guide

## Architecture Overview

The security system has been implemented with a **client-server separation**:

- **Backend (API)**: NestJS security services for risk assessment, IP intelligence, and ML integration
- **Frontend (Web)**: Next.js React components and hooks that call backend APIs

## File Structure

### API Security Module (`apps/api/src/security/`)

```
security/
├── risk-engine.service.ts       # Fraud/risk scoring engine
├── ip-intelligence.service.ts   # IP geolocation and threat intelligence
├── security.controller.ts        # REST endpoints
└── security.module.ts            # Module definition
```

### Web Frontend Security (`apps/web/src/`)

```
lib/security/
├── device-fingerprint.ts        # Device identification
└── risk-assessment.ts           # Risk level definitions

services/
└── security-api.service.ts      # API client

hooks/
├── useSecurity.ts               # React hooks for security features
└── SecurityContext.tsx          # Global security state

components/
└── SecurityChallenge.tsx        # SMS verification UI
```

## Backend Setup

### 1. Install Dependencies

```bash
cd apps/api
npm install
```

Required packages (already in package.json):

- `@nestjs/axios` - HTTP client for external APIs
- `@nestjs/config` - Configuration management
- `rxjs` - Reactive programming

### 2. Environment Variables

Create `.env` file in `apps/api/`:

```bash
# IP Intelligence
IP_API_KEY=your_ipapi_key_here
# Get from: https://ipapi.is/ or similar service

# ML Service (optional)
ML_ENDPOINT=http://localhost:5000/predict

# Security Settings
ADMIN_IPS=127.0.0.1,your.admin.ip
```

### 3. Run the API

```bash
cd apps/api
npm run dev
```

API will start on `http://localhost:3000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd apps/web
npm install
```

### 2. Environment Variables

Create `.env.local` file in `apps/web/`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Integrate into App

Wrap your app with the `SecurityProvider`:

```tsx
// apps/web/src/layout.tsx (or App.tsx)
import { SecurityProvider } from "@/hooks/SecurityContext";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SecurityProvider>{children}</SecurityProvider>
      </body>
    </html>
  );
}
```

### 4. Use Security Hooks in Components

```tsx
"use client";
import { useSecurity } from "@/hooks/SecurityContext";

export function LoginForm() {
  const { assess, riskAssessment, requiresChallenge } = useSecurity();

  const handleLogin = async () => {
    const assessment = await assess();

    if (requiresChallenge) {
      // Show security challenge
      return;
    }

    // Proceed with login
  };

  return (
    <>
      <form>{/* Login form */}</form>

      {requiresChallenge && (
        <SecurityChallenge
          onChallengeResolved={() => console.log("Verified!")}
          onChallengeFailed={() => console.log("Failed")}
        />
      )}
    </>
  );
}
```

## API Endpoints

### GET `/api/security/ip-intel`

Get IP intelligence for current request.

**Response:**

```json
{
  "ip": "1.2.3.4",
  "country": "US",
  "city": "New York",
  "isVpn": false,
  "isProxy": false,
  "isDatacenter": false,
  "threatLevel": "low",
  "timestamp": 1707829200000
}
```

### POST `/api/security/assess-risk`

Assess risk based on device and behavior signals.

**Request:**

```json
{
  "deviceId": "abc123...",
  "userAgent": "Mozilla/5.0...",
  "timezone": "America/New_York",
  "screenResolution": "1920x1080",
  "suspiciousActivity": false,
  "previousFailedAttempts": 0
}
```

**Response:**

```json
{
  "riskScore": 35,
  "riskLevel": "medium",
  "requiresChallenge": true,
  "requiresSMS": false,
  "reasons": ["Unusual time-of-access pattern detected"]
}
```

### GET `/api/security/check-blacklist`

Check if current IP is blacklisted.

**Response:**

```json
{
  "isBlacklisted": false
}
```

### POST `/api/auth/verify-sms`

Verify SMS code.

**Request:**

```json
{
  "phone": "+1234567890",
  "code": "123456"
}
```

**Response:**

```json
{
  "verified": true
}
```

## Risk Levels

| Score | Level    | Action                   |
| ----- | -------- | ------------------------ |
| 0-20  | Low      | Allow                    |
| 21-40 | Medium   | Require SMS verification |
| 41-80 | High     | Require SMS verification |
| 80+   | Critical | Block                    |

## Device Fingerprinting

The system generates a device fingerprint from:

- User Agent
- Accept-Language
- Timezone
- Screen Resolution
- Color Depth

Fingerprint is stored in `localStorage` and used to detect device changes.

## IP Intelligence Integration

By default, the system uses basic geolocation. To enable threat intelligence:

1. Sign up for [IPQualityScore](https://www.ipqualityscore.com/) or similar service
2. Add your API key to `.env`
3. The system will automatically fetch:
   - VPN/Proxy detection
   - Datacenter IPs
   - Threat levels

## Machine Learning Integration

For ML-powered fraud detection:

1. Set up ML service on a separate endpoint
2. Configure `ML_ENDPOINT` in `.env`
3. The RiskEngine will blend ML predictions with rule-based scores

Example ML request:

```json
{
  "features": {
    "isVpn": 0,
    "isProxy": 0,
    "isDatacenter": 1,
    "threatLevel": 1,
    "previousAttempts": 2
  }
}
```

## Testing

### Test Risk Assessment

```bash
curl -X POST http://localhost:3000/api/security/assess-risk \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test123",
    "userAgent": "Mozilla/5.0",
    "timezone": "UTC",
    "screenResolution": "1920x1080"
  }'
```

### Test IP Intelligence

```bash
curl http://localhost:3000/api/security/ip-intel \
  -H "X-Forwarded-For: 8.8.8.8"
```

## Security Features

✅ **Device Fingerprinting** - Detects device changes
✅ **IP Intelligence** - VPN/Proxy detection
✅ **Risk Scoring** - ML + rule-based assessment
✅ **SMS Verification** - Additional security challenge
✅ **Audit Logging** - Track access patterns
✅ **Blacklist Management** - Block suspicious IPs
✅ **GDPR Ready** - Export user decision data

## Known Limitations

- SMS sending requires Twilio integration (not yet implemented)
- ML endpoint must be configured separately
- IP Intelligence requires external API key
- Blacklist is in-memory (use database in production)

## Next Steps

1. Integrate SMS service (Twilio/Firebase)
2. Add IP blacklist database table
3. Implement fraud event logging
4. Set up ML model endpoint
5. Add comprehensive audit logging
6. Create admin dashboard for fraud monitoring
