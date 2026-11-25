# DateBuk Enterprise Integrated Pack

Next-level DateBuk pack for moving from prototype to an integrated production-ready dating platform.

## Included

- Web app pages: dashboard, smart match, chat, safety, verification, premium, admin.
- Mobile app screens: matches, chat, verification, safety, premium.
- API modules: auth, matching, chat, safety, payments, verification, admin.
- Prisma schema: users, profiles, matches, messages, reports, tickets, subscriptions, verification.
- Realtime design: Socket.IO chat event contract.
- Payment design: subscription + credits service stubs.
- Safety design: report/block/moderation workflows.
- Deployment: Docker Compose for API + PostgreSQL + Redis.

## Run Plan

### 1. Install
```bash
cd apps/api
npm install
```

### 2. Configure
Copy `.env.example` to `.env` and update values.

### 3. Database
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start API
```bash
npm run dev
```

### 5. Start Web
```bash
cd apps/web
npm install
npm run dev
```

### 6. Start Mobile
```bash
cd apps/mobile
npm install
npx expo start
```

## Recommended Next Pack
After this pack, build **DateBuk Compliance + App Store Launch Pack** with Terms, Privacy, Cookie Policy, safety reporting, age-gating, app store assets, Play Store policy checklist, and Apple review checklist.
