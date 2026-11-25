# DateBuk DSACS v1.0 — integration candidate
Node 22, Express, PostgreSQL, Stripe web billing. No existing DateBuk source was supplied. Do not deploy as-is. Proposed tiers and daily UTC quotas are in src/policy.js; -1 unlimited, 0 denied, positive daily count. No prices are assumed. Intent is independent of tier. Safety is always available and should bypass billing entirely.

## Setup
Create an isolated database; apply sql/001.sql with psql -v ON_ERROR_STOP=1. Use a separate migration owner and least-privilege runtime role (no DDL, audit update/delete/truncate). npm install, configure environment from .env.example using a secret manager, npm test, node --env-file=.env src/server.js. Configure Stripe webhook at /webhooks/stripe for listed events. Use test keys first. Configure JWT issuer to issue short-lived access tokens with trusted role claims; enforce MFA and fresh staff authorization in host app. Restrict staff lookup to assigned support cases before enabling. Add gateway rate limits, HTTPS, monitoring and database backups. Never expose secrets to frontend.

## Integration
GET /subscription for UI hints; POST /checkout {plan}; POST /portal; GET /staff/accounts/:id (restricted). For each actual feature route import consume(pool,user,feature,requestId,work) from service.js. Derive user from authenticated session and feature from route, never from client input. work(c) must perform the authorized business write in the SAME transaction, or enqueue a durable outbox job; do not perform external side effects inside it. Check matching consent, blocks, age eligibility and resource membership independently. Use a UUID per logical operation and bind it to the payload in host route (current helper binds only feature). Return 403 or 429 for denied results. Do not expose a generic consume endpoint. WebRTC admission and extensions must use server authorization, not UI gating. Existing sessions need explicit downgrade policy. Safety endpoints must remain available even if billing is unavailable.

## Release gates (not completed)
- Integrate with canonical DateBuk user, session, RBAC, moderation and billing tables; avoid duplicate subscription authority.
- Add staff case scope, MFA, admin policy versioning and dual approval, audit export to independent immutable storage.
- Add scheduled Stripe reconciliation, checkout recovery, webhook retry/dead-letter monitoring, event mode checks and provider outage handling. Test duplicate and reordered events, refunds, disputes, upgrades, cancellation and concurrent checkout. Current implementation intentionally fails closed on ambiguous subscriptions and downgrades past_due immediately.
- Add Apple/Google native purchase verification and store policy review if mobile digital subscriptions are sold; not implemented.
- Add idempotency payload binding, quota retention, privacy deletion, outbox worker, per-feature integration tests, real PostgreSQL concurrency tests and Stripe sandbox end-to-end tests.
- Add customer pricing UI and admin/staff dashboard integration; no standalone UI included.
- Verify all safety paths remain available, conduct independent security review, load test, staging certification and approve release. NO-GO until gates pass.

Rollback: disable new checkout and feature enforcement via host deployment rollback; retain billing/audit data and webhook processing until reconciliation. Never drop production schema to roll back. For disposable test DB only: DROP SCHEMA dsacs CASCADE.
