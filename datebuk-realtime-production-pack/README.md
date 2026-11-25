# DateBuk Realtime Communication Production Pack

This pack is the next implementation level after the DateBuk Mobile Calling Pack.

It adds production-ready call orchestration for mobile and web:

- authenticated Socket.IO signaling
- call session lifecycle and call history
- user presence and device registration
- Expo push notification routing
- incoming, accepted, rejected, missed, cancelled, and ended states
- block/report checks before calls
- Redis-backed signaling scale-out
- PostgreSQL/Prisma models
- Coturn STUN/TURN deployment
- call analytics and health endpoints
- mobile background notification handling
- web fallback call client
- Docker Compose
- unit and integration tests

## Architecture

```text
Mobile/Web Client
    |
    | HTTPS + Socket.IO + JWT
    v
Realtime API
    |---- PostgreSQL: users, devices, calls, reports, blocks
    |---- Redis: presence, socket routing, pub/sub
    |---- Expo Push API: incoming-call notifications
    |---- Coturn: STUN/TURN relay
```

## Folder layout

```text
apps/
  api/
  mobile/
  web/
infra/
  coturn/
  docker-compose.yml
packages/
  shared/
```

## Quick start

1. Copy environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env.local
```

2. Start infrastructure:

```bash
docker compose -f infra/docker-compose.yml up -d
```

3. Install API dependencies and migrate:

```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev --name realtime_calls
npm run dev
```

4. Run mobile development build:

```bash
cd apps/mobile
npm install
npx expo prebuild
npx expo run:android
```

5. Run web:

```bash
cd apps/web
npm install
npm run dev
```

## Important

- Expo Go is not sufficient for native WebRTC/CallKeep workflows.
- Use a real TURN server in production.
- Replace the demo JWT verifier with your existing DateBuk authentication service.
- Protect push tokens and never expose TURN secrets in client source code.
