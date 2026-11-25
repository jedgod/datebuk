# DateBuk DSACS V3–V7 integration candidate

Free $0, Premium $14.99/month, Elite $29.99/month. This is an isolated reference implementation derived from the v2 policy, not a patch against the actual DateBuk repository. Do not deploy to production. No live credentials included. Guest admission is disabled by omission; Elite-only initiation remains the baseline. Additional quotas are proposed.

## Local setup
Copy `.env.example` to `.env`; supply a strong development database password and matching DATABASE_URL (postgresql://postgres:PASSWORD@db:5432/dsacs), test identity issuer/audience/JWKS and optional Stripe test credentials. Run `docker compose up --build`. The database initialization scripts run only on a fresh volume. Never point this compose file at an existing database. Docker and PostgreSQL were not available in the authoring environment. Run `npm install` and `npm test` locally; generate and review a lockfile before deployment. API listens on localhost port 4090. Configure HTTPS and a trusted identity provider before exposing any endpoint. Provision staff roles through a controlled DBA migration, not customer JWT claims.

## Contents and limits
V3: policy, decision engine, transaction-scoped quota consumption and payload hash. Host must invoke consume() inside real feature routes with trusted match/block/consent context and database-only work callback; never expose it as a generic customer endpoint. External AI work needs reservation/outbox and compensation. Safety operations still require identity and object authorization.
V4: Stripe test webhook reconciliation for pre-bound customers; no checkout, portal, refund or mobile verification yet. Apple/Google adapters fail closed. No production billing switch. Reconciliation selects highest valid grant; duplicate paid grants need support resolution. Existing v2 accounts must be backfilled from verified provider records before enabling reconcile. Never silently migrate legacy Plus.
V5: three responsive shadcn dashboard views in one component, read-only customer/admin/staff views plus support creation API. Host supplies authenticated fetch and shadcn components. No standalone frontend build, payment actions, admin policy editor or MFA approval workflow.
V6: Redis Streams dispatcher, SLA breach event, lease/risk schema. Delivery is at least once; consumers must deduplicate eventId, re-read authoritative state and implement retries. No actual media lease issuance, revocation consumer, guest video, fraud classifier or AI provider. No location data collected.
V7: Docker development configuration, unit tests and release checklist. No production certification. See docs/RELEASE.md.

## Integration order
Inventory actual authentication, subscription tables, routes, billing provider IDs, role model, signaling and TURN. Map existing tables rather than introducing competing authority. Back up and rehearse on a scratch database. Integrate feature enforcement before exposing upgrade UI. Add provider sandbox tests, dashboard tests and independent review. Do not merge/deploy without approval.

## API
GET /health; authenticated GET /api/subscriptions/plans, /me, /usage (under /api/subscriptions); POST /api/subscriptions/support; GET /api/admin/subscriptions/analytics; GET /api/staff/subscriptions/cases and /cases/:id. POST /api/webhooks/stripe (signed test events); Apple/Google webhook endpoints return 503. Staff case access requires assignment. No public entitlement consumption endpoint.
