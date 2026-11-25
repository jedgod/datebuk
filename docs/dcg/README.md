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
| Dispatch-time checks (consent, destination, active account, budget) | `sms/sms.service.ts` |
| Signed webhooks, STOP/START, forward-only delivery state | `sms/sms-webhook.controller.ts`, `sms/twilio-signature.ts` |
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

## Release gates - NOT passed
- Live Twilio: no real request has been made (no credentials). Registration, sender ownership, sending, status and inbound webhooks are untested live.
- Durable outbox, worker leases, Redis coordination, retry classification, reconciliation job: **not built** (sending is synchronous; ambiguous results are marked `uncertain` and never retried).
- OTP workflows, recovery protection, anti-fraud, consent records, A2P 10DLC / toll-free verification evidence: **not built**.
- Monitoring/alerting, backups drill, disaster recovery, load tests, browser tests, independent security review: not done.
- Admin Communications Center UI has not been exercised in a browser with a live superadmin session.
