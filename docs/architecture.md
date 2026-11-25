# DatePage Architecture

- **apps/web**: Next.js 14 App Router UI
- **apps/api**: NestJS + Prisma (PostgreSQL), JWT auth
- **apps/signaling**: Socket.IO signaling service for WebRTC
- **packages/shared**: shared types

## Security baseline
- Password hashing (bcrypt)
- JWT access + refresh (rotating refresh)
- Protected routes via Next middleware + cookie

## Real-time baseline
- Chat over API (persisted) + Socket.IO broadcast hook points
- WebRTC signaling in separate service (room-based)


## Next-level add-ons included
- DB-backed refresh sessions (hashed) + rotation + revoke-all
- Global rate limiting + login throttling
- Email verification + password reset flows (emails logged in dev)
- Chat typing indicators + read receipts
- Swipe queue + mutual match creation
- S3-compatible presigned upload endpoint (optional config)
- Web Push subscription + test notification endpoint (optional config)
- GitHub Actions CI workflow

## Production hardening added
- Refresh token format: `<sessionId>.<secret>` with **indexed lookup** (no session scans)
- Rotation chain + **reuse detection** (replay triggers revoke-all)
- Account lockout escalation (5 failed attempts -> timed lockouts)
- Audit logging (DB model + hooks for auth/chat/swipes)
- Background job queues (BullMQ + Redis) for email/push/uploads
- Image pipeline (sharp): download -> validate -> re-encode -> create variants -> upload

## One more production notch
- Refresh token lookup optimized: token id prefix `refreshTokenId` (12 chars) -> indexed lookup -> HMAC SHA-256 constant-time compare
- Session management endpoints + Settings UI snippet for device/IP visibility
- ClamAV INSTREAM scanning in uploads pipeline + clamav service in docker-compose
- Push fanout jobs: chat messages enqueue per-recipient push payload; `/push/send` enqueues jobs

## Final polish
- Sessions UI: per-row revoke button + current session highlight
- Admin push broadcast endpoint with simple segmentation: emailVerified/gender/age/interest
- ClamAV fail-closed + quarantine: infected uploads copied to `quarantine/` and original deleted

## Production finishing layer
- Support staff tools:
  - Admin Sessions: search users -> list/revoke sessions for any user
  - Admin Audit: filter/search + CSV export
  - Admin Quarantine: browse quarantined objects + release/delete
- Broadcast batching:
  - `/admin/push/broadcast` enqueues one `broadcast` job
  - BroadcastProcessor resolves segment and enqueues pushes in chunks with delays

## Enterprise SRE layer
- Structured logs (JSON) with correlation IDs:
  - `x-request-id` propagated and returned on every response
  - per-endpoint logs include method/path/status/duration/requestId
- Metrics & probes:
  - Prometheus `/metrics` (protected; scrape with auth or internal mesh)
  - Liveness `/health` and readiness `/ready` (DB check)
- Admin roles + scoped permissions:
  - User.role: USER / SUPPORT / SUPERADMIN
  - PermissionsGuard enforces per-endpoint permissions via @RequirePermissions
- Quarantine reason surfacing + safe preview rules:
  - shows quarantine reason (S3 metadata) in UI
  - presigned preview allowed only for small images (jpeg/png/webp <= 2MB) under quarantine/
