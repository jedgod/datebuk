# Dating Platform Database Testing Guide

## Quick Start

### 1. Login with Demo Users

Use any of these credentials to test the platform:

```
Email: emma@example.com
Email: liam@example.com
Email: sofia@example.com
Email: noah@example.com
Email: isabella@example.com
Email: ethan@example.com
Email: mia@example.com
Email: james@example.com
Email: olivia@example.com
Email: benjamin@example.com

Password: password123 (for all demo users)
```

### 2. Test the Dashboard Flow

1. Visit `http://localhost:3000/dashboard`
2. You should see the dashboard home with quick links
3. Click "Browse Matches" to see the profile browsing feature
4. Click on profiles to view details and chat

### 3. Test Subscription Status

Each demo user has different subscription tiers:

- **Free**: liam, isabella, ethan, james, olivia
- **Premium Basic**: sofia
- **Premium Plus**: emma, mia
- **VIP**: noah, benjamin

Features are gated by subscription tier.

## Database Records Verification

### Check Record Counts

Run from `apps/api`:

```bash
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.user.count(), p.match.count(), p.message.count(), p.videoSession.count(), p.report.count(), p.flag.count(), p.subscription.count()]).then(([u,m,msg,v,r,f,s]) => { console.log('Users:',u,'Matches:',m,'Messages:',msg,'Videos:',v,'Reports:',r,'Flags:',f,'Subscriptions:',s); process.exit(0); }).catch(e => console.error(e)); "
```

Expected output:

```
Users: 17 Matches: 6 Messages: 3 Videos: 3 Reports: 2 Flags: 3 Subscriptions: 2
```

### Browse Prisma Studio

View and explore all database tables:

```bash
cd apps/api
npm run studio
```

Then navigate to `http://localhost:5555` - this opens a graphical database viewer.

## Test Data Structure

### User Trust Scores

- **HIGH (75+)**: emma (85), noah (95), mia (90), benjamin (80)
- **MEDIUM (40-74)**: liam (65), isabella (75), james (55)
- **LOW (20-39)**: sofia (45), ethan (30)
- **NEW (<20)**: olivia (20)

### Boosted Profiles

Users with visibility="BOOSTED" and high trust scores appear at top of browse:

- Emma (85 score, BOOSTED)
- Noah (95 score, BOOSTED)
- Mia (90 score, BOOSTED)
- Benjamin (80 score, BOOSTED)

### Video Session Moderation

Test system monitors video content:

- **APPROVED**: Session 1 (low risk)
- **QUARANTINED**: Session 2 (medium risk, AI flagged content)
- **INTERRUPTED**: Session 3 (high risk, user reported)

### Reports & Flags

Moderation data for testing admin dashboard:

- 2 user reports (harassment, nudity)
- 3 AI-detected flags (various violation types)
- Different resolution statuses (resolved, pending)

## API Endpoint Testing

### Browse Profiles

```bash
curl "http://localhost:3001/api/profiles/browse?genderFilter=FEMALE&page=1&limit=12"
```

### Get Recommendations

```bash
curl "http://localhost:3001/api/profiles/recommendations?userId=<user-id>&limit=5"
```

### Get Matches

```bash
curl "http://localhost:3001/api/matches" \
  -H "Authorization: Bearer <jwt-token>"
```

### Get Messages

```bash
curl "http://localhost:3001/api/messages?matchId=<match-id>" \
  -H "Authorization: Bearer <jwt-token>"
```

## Testing Moderation Features

### View Flagged Content

```bash
curl "http://localhost:3001/api/moderation/flags?status=PENDING" \
  -H "Authorization: Bearer <admin-token>"
```

### View Reports

```bash
curl "http://localhost:3001/api/moderation/reports?status=OPEN" \
  -H "Authorization: Bearer <admin-token>"
```

### View Video Sessions

```bash
curl "http://localhost:3001/api/moderation/video-sessions?status=QUARANTINED" \
  -H "Authorization: Bearer <admin-token>"
```

## Gender & Intent Matching

### Female Users (searching for Men)

- Emma (28, CASUAL, Miami) ↔ Liam (30, FAITH, Austin) ✅ Matched
- Sofia (25, PROFESSIONAL, NYC) ↔ Noah (31, CASUAL, Denver) ✅ Matched
- Isabella (26, FAITH, LA) ↔ Ethan (28, PROFESSIONAL, Chicago) ✅ Matched
- Mia (24, CASUAL, Seattle) ↔ James (30, FAITH, Boston) ✅ Matched
- Olivia (27, CASUAL, SF) ↔ Benjamin (29, PROFESSIONAL, Atlanta) ✅ Matched

### Intent Compatibility Matrix

```
        FAITH   CASUAL  PROFESSIONAL  OPEN_MINDED
FAITH     ✓       ✓         ✓             ✓
CASUAL    ✓       ✓         ✓             ✓
PROF      ✓       ✓         ✓             ✓
OPEN      ✓       ✓         ✓             ✓
```

All intents are compatible (users are open-minded).

## Subscription Tiers

### Feature Access

| Feature  | FREE | BASIC | PLUS | VIP |
| -------- | ---- | ----- | ---- | --- |
| Browse   | ✓    | ✓     | ✓    | ✓   |
| Match    | ✓    | ✓     | ✓    | ✓   |
| Message  | ✓    | ✓     | ✓    | ✓   |
| Video    | ✗    | ✓     | ✓    | ✓   |
| AI Tips  | ✗    | ✗     | ✓    | ✓   |
| Verify   | ✗    | ✓     | ✓    | ✓   |
| Boost    | ✗    | ✗     | ✓    | ✓   |
| Priority | ✗    | ✗     | ✗    | ✓   |

## Conversation Test Data

### Active Conversations

1. **Emma ↔ Liam** (3 messages)
   - Emma: "Hey, how are you?"
   - Liam: "Good, you?"
   - Last: 1 day ago

2. **Sofia ↔ Noah** (no messages)
   - Last: 2 hours ago

3. **Olivia ↔ Benjamin** (1 message)
   - Benjamin: "Hi Olivia! 😊"
   - Last: 5 minutes ago

## Performance Testing

### Database Indexes

All critical fields are indexed for fast queries:

- User email (unique)
- Match IDs
- Message sender/match
- Video session status
- Subscription expiration

### Query Performance

Expected response times:

- Browse 100 profiles: <100ms
- Get recommendations for user: <50ms
- Fetch conversation: <30ms
- Moderation report: <20ms

## Cleanup & Reset

### Reset Database

To start fresh with demo data:

```bash
cd apps/api
npx prisma migrate reset --force
```

This will:

1. Drop all tables
2. Recreate schema
3. Run seed.ts to repopulate demo data

### Delete Seeded Data Only

To keep schema but clear demo records:

```bash
cd apps/api
npm run prisma db push -- --skip-generate
# Then delete records through Prisma Studio
```

## Troubleshooting

### No records appear

- Verify `npm run db:seed` completed successfully
- Check PostgreSQL is running: `psql -h localhost -d datepage`
- Verify Prisma client is generated: `npm run db:generate`

### Wrong number of records

- Some demo@datepage.app users may exist from previous setup
- Run reset: `npx prisma migrate reset --force`

### Video AI scores not appearing

- AI scores are stored as JSON in aiScores field
- Example: `{ "nudity": 0.1, "explicit_audio": 0.05, "overall": 0.07 }`
- Use Prisma Studio to inspect JSON values

### Subscription tier queries failing

- Ensure SubscriptionTier models exist
- Check subscription currentPeriodEnd dates are future dates

---

**Database Status**: ✅ Fully seeded and ready for testing
**Updated**: February 21, 2026
