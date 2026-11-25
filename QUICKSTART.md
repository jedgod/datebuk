# Quick Start Guide - Security Implementation

## 5-Minute Setup

### 1. Copy Environment Templates

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 2. Configure API (.env)

```bash
# Get free IP API key from: https://ipapi.is/
IP_API_KEY=your_key_here

# (Keep other defaults for now)
```

### 3. Install Dependencies

```bash
cd apps/api
npm install

cd ../web
npm install
```

### 4. Start Both Apps

```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

### 5. Test

Open http://localhost:3000 in browser and use security features!

## Integration Checklist

- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] API server running (port 3000)
- [ ] Web server running (port 3000)
- [ ] Can assess risk: Try login/signup
- [ ] Device fingerprint stored in localStorage
- [ ] SMS verification modal appears for medium-high risk

## Testing Risk Assessment

```bash
curl -X POST http://localhost:3000/api/security/assess-risk \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-device-123",
    "userAgent": "Mozilla/5.0",
    "timezone": "America/New_York",
    "screenResolution": "1920x1080",
    "suspiciousActivity": false
  }'
```

Expected response:

```json
{
  "riskScore": 10,
  "riskLevel": "low",
  "requiresChallenge": false,
  "requiresSMS": false,
  "reasons": []
}
```

## What's Implemented

✅ **Backend**

- Risk scoring (0-100)
- IP intelligence lookups
- Device fingerprinting
- Blacklist checking

✅ **Frontend**

- React hooks for security
- SMS challenge UI
- Device fingerprint storage
- Risk assessment display

⚠️ **Not Yet Implemented**

- SMS sending (Twilio/Firebase needed)
- IP blacklist database
- Audit logging database
- ML model integration
- Admin dashboard

## Common Issues

### "IP_API_KEY not configured"

→ Get key from https://ipapi.is/, add to `.env`

### "Cannot POST /api/security/assess-risk"

→ API server might not be running. Check: `npm run dev` in `apps/api/`

### Device fingerprint not storing

→ Check localStorage is enabled in browser
→ Check console for permission errors

### SMS modal not showing

→ Risk score is below threshold. Try `"suspiciousActivity": true`

## Next: Full Setup

See [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md) for:

- Complete API documentation
- Twilio/SMS integration
- ML model setup
- Admin dashboard integration
- Production deployment

---

**Ready to go!** 🚀
