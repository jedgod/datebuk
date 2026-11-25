-- Rollback of 20261124180000_sms_outbox_and_webhook_events (durable outbox, leases, webhook de-duplication).
-- Roll back 20261125100000 first. DESTRUCTIVE: queued (unsent) messages are lost - drain or accept that. Backup first.
BEGIN;
DROP TABLE IF EXISTS "SmsWebhookEvent";
ALTER TABLE "SmsMessage" DROP CONSTRAINT IF EXISTS "SmsMessage_state_check";
DROP INDEX IF EXISTS "SmsMessage_state_nextAttemptAt_idx";
DROP INDEX IF EXISTS "SmsMessage_idempotencyKey_key";
ALTER TABLE "SmsMessage"
  DROP COLUMN IF EXISTS "ref", DROP COLUMN IF EXISTS "toEncrypted", DROP COLUMN IF EXISTS "bodyEncrypted",
  DROP COLUMN IF EXISTS "idempotencyKey", DROP COLUMN IF EXISTS "attempts", DROP COLUMN IF EXISTS "nextAttemptAt",
  DROP COLUMN IF EXISTS "leaseUntil", DROP COLUMN IF EXISTS "claimedBy", DROP COLUMN IF EXISTS "lastError",
  DROP COLUMN IF EXISTS "expiresAt";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261124180000_sms_outbox_and_webhook_events';
COMMIT;
