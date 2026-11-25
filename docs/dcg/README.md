# DCG communications + DSACS access control - integration notes

Status: **NO-GO for production.** Implemented and tested locally; not certified. See "Release gates".

## What is implemented
| Area | Where |
|---|---|
| Feature policy (plans, limits, safety features) | `apps/api/src/subscriptions/feature-policy.ts` |
| Atomic quota / idempotency / kill switch | `subscriptions/feature-access.service.ts`, `require-feature.ts`, `admin/feature-admin.controller.ts` |
| Customer usage API + panel | `GET /api/subscriptions/usage`, `components/subscription/SubscriptionUsagePanel.tsx` |
| Credential vault (dedicated key, versioned, AAD-bound) | `common/security/credential-vault.ts` |
| Provider account lifecycle, rotation, migration, spend caps | `sms/sms-accounts.service.ts` |
| Durable outbox: atomic spend reservation, encrypted payload, leased workers, dispatch-time authorization, outcome classification, sweeper | `sms/sms-outbox.service.ts`, `sms/sms-worker.service.ts` (on the existing pg-boss), facade `sms/sms.service.ts` |
| Delivery-state model + response classification | `sms/sms-state.ts` |
| Admin reconciliation of uncertain messages | `POST /api/admin/sms/messages/:id/reconcile` |
| Account-bound signed webhooks, replay protection, STOP/START, transition-checked state | `sms/sms-webhook.controller.ts`, `sms/twilio-signature.ts` |
| Privileged admin API (superadmin + MFA step-up) | `sms/sms-admin.controller.ts`, `auth/step-up.guard.ts`, `POST /api/auth/step-up` |
| Dashboards | `/admin/communications`, `/staff/communications`, `/dashboard/subscription` |

## Configuration
See `.env.example` ("Communications (DCG)"). Generate the vault key with `openssl rand -base64 32`; it must differ from
`TOTP_ENCRYPTION_KEY`. `DCG_ENABLED`, `DCG_LIVE_SMS_ENABLED` and `DCG_ENV_FALLBACK_ENABLED` default to **off**.
The API reads `apps/api/.env`.

## Key rotation / migrating legacy credentials
1. Generate a new key. Set `DCG_ENCRYPTION_KEY=<new>`, bump `DCG_ENCRYPTION_KEY_VERSION`, and keep the old key as `DCG_ENCRYPTION_KEY_V<old>`.
   (First-time migration from the TOTP key: legacy rows are read with `TOTP_ENCRYPTION_KEY`, version 0 - keep it set.)
2. Superadmin, with MFA step-up: `POST /api/admin/sms/credentials/migrate?dryRun=true`, review, then run without `dryRun`.
   Each value is re-encrypted and decrypted again to prove the round trip before its row is written.
3. When `remainingKeyVersions` lists only the new version, remove the old key. TOTP seeds are never touched.

## Rollback
Application: redeploy the previous build; set `DCG_ENABLED=false` (admin + webhook surfaces return 503, nothing is sent).
Database (all additive; take a backup first, then run in order):
```sql
-- 20261124160100 / 20261124160000  (credential lifecycle)
ALTER TABLE "SmsMessage" DROP COLUMN "accountId", DROP COLUMN "segments";
DROP INDEX IF EXISTS "TwilioAccount_single_active";
ALTER TABLE "TwilioAccount" DROP CONSTRAINT IF EXISTS "TwilioAccount_credentials_check", DROP CONSTRAINT IF EXISTS "TwilioAccount_status_check";
ALTER TABLE "TwilioAccount" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
UPDATE "TwilioAccount" SET "enabled" = ("status" = 'active');
ALTER TABLE "TwilioAccount" DROP COLUMN "status", DROP COLUMN "statusReason", DROP COLUMN "apiKeySid", DROP COLUMN "encryptedApiKeySecret",
  DROP COLUMN "keyVersion", DROP COLUMN "lastValidatedAt", DROP COLUMN "rotatedAt", DROP COLUMN "dailySegmentLimit",
  DROP COLUMN "monthlySegmentLimit", DROP COLUMN "allowedPrefixes";
-- Only if every account still has an auth token (revoked accounts have had theirs wiped):
-- ALTER TABLE "TwilioAccount" ALTER COLUMN "encryptedAuthToken" SET NOT NULL;
DELETE FROM "_prisma_migrations" WHERE migration_name IN ('20261124160100_twilio_revoked_credentials','20261124160000_twilio_credential_lifecycle');
```
Credentials already re-encrypted with the dedicated key stay readable only while that key is kept; do not discard it on rollback.
Earlier migrations (`20261124140000_feature_access_and_twilio_accounts`, `20261124120000_identity_verification_and_signup_profile`) drop their tables/columns the same way.

## How a text is sent (V8.0)
1. `SmsService.send()` -> `SmsOutboxService.enqueue()`: in ONE transaction, serialized per provider account, it checks the daily/monthly
   segment caps, inserts the message (recipient + body encrypted with the credential vault, bound to the row) and so reserves its
   segments. 25 concurrent callers against a cap of 10 admit exactly 10. An idempotency key makes a retry of the caller a no-op.
2. A pg-boss job wakes a worker; the 30-second sweeper dispatches anything the wake-up missed. A worker takes an **exclusive lease**
   (`UPDATE ... WHERE state='queued'`), so only one process can call Twilio for a message.
3. Immediately before sending it re-checks: expired? opted out? still wanted (purpose guard, e.g. the verification link is still
   pending)? sending enabled? is the SAME provider account still active? destination allowed? Otherwise it cancels or waits.
4. Outcome: 2xx accepted | 429 retried with backoff (nothing was accepted) | 401/403 failed + account suspended | other 4xx failed |
   **5xx / timeout / lost worker -> `uncertain`, never retried.** `uncertain` is resolved only by an authenticated provider callback
   or an admin (`reconcile`); nothing is ever resent automatically.
5. The encrypted recipient/body are erased as soon as the message leaves queued/dispatching.

State model: `queued -> dispatching -> accepted -> sending -> sent -> delivered|undelivered|failed`, `dispatching -> uncertain`,
`queued|dispatching -> canceled`. Provider callbacks may only move a message forward through that table.

## Webhook security
Signature is verified with the Auth Token of the account named in the payload, against the public URL rebuilt from
`SMS_WEBHOOK_BASE_URL` (not from request headers). A callback may only affect a message sent through the account that signed it;
each (account, message, status) is applied at most once; a callback can never advance or bind a message that was not dispatched.

## Tests
`pnpm --filter api test`. `sms-outbox.integration.spec.ts` runs against the real PostgreSQL in `DATABASE_URL` (35 tests: reservation
races, lease exclusivity, crash recovery, outcome classification, dispatch-time authorization, webhook transitions, reconciliation).
Twilio is never contacted. They skip themselves if a real provider account is already active.

## Operations
- Workers run inside every API process when `DCG_ENABLED=true`. Any number may run; claiming is a database lease.
- Messages in `uncertain` need a human: check the Twilio console for that recipient/time, then `reconcile` as sent / not sent.
- Pausing: `DCG_LIVE_SMS_ENABLED=false` pauses dispatch (messages wait, then expire). `DCG_ENABLED=false` takes the module dark.
- Rollback for the outbox migration (`20261124180000_sms_outbox_and_webhook_events`; take a backup first; drain or accept loss of queued messages):
```sql
DROP TABLE "SmsWebhookEvent";
ALTER TABLE "SmsMessage" DROP CONSTRAINT "SmsMessage_state_check";
DROP INDEX IF EXISTS "SmsMessage_state_nextAttemptAt_idx", "SmsMessage_idempotencyKey_key";
ALTER TABLE "SmsMessage" DROP COLUMN "ref", DROP COLUMN "toEncrypted", DROP COLUMN "bodyEncrypted", DROP COLUMN "idempotencyKey",
  DROP COLUMN "attempts", DROP COLUMN "nextAttemptAt", DROP COLUMN "leaseUntil", DROP COLUMN "claimedBy", DROP COLUMN "lastError", DROP COLUMN "expiresAt";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261124180000_sms_outbox_and_webhook_events';
```

## Release gates - NOT passed
- **Live Twilio: still untested.** No real request has been made. Account registration, sender ownership, real sends, real status/inbound
  callbacks, and the Twilio-side idempotency header are unverified. Needs approved credentials and authorized test recipients.
- **Superadmin browser tests: not done.** The API access matrix and a real MFA superadmin HTTP run pass; the Communications Center UI has
  not been exercised in a browser.
- Redis coordination: deliberately not added (PostgreSQL advisory locks + row leases do the coordinating).
- Not built: OTP workflows and recovery protection, anti-fraud rules, per-recipient consent records, A2P 10DLC / toll-free verification
  evidence, a scheduled reconciliation job against Twilio's message list (today: callbacks + admin), cost reporting from Twilio prices.
- Not done: monitoring/alerting, backup/restore drill, load test, independent security review, migration rollback rehearsal on a copy.
