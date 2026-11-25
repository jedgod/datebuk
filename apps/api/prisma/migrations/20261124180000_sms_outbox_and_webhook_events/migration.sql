-- Durable outbox, leases and webhook de-duplication (DCG V8.0)
ALTER TABLE "SmsMessage"
  ADD COLUMN "ref" TEXT,
  ADD COLUMN "toEncrypted" TEXT,
  ADD COLUMN "bodyEncrypted" TEXT,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "leaseUntil" TIMESTAMP(3),
  ADD COLUMN "claimedBy" TEXT,
  ADD COLUMN "lastError" TEXT,
  ADD COLUMN "expiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "SmsMessage_idempotencyKey_key" ON "SmsMessage"("idempotencyKey");
CREATE INDEX "SmsMessage_state_nextAttemptAt_idx" ON "SmsMessage"("state", "nextAttemptAt");
ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_state_check"
  CHECK ("state" IN ('queued','dispatching','accepted','sending','sent','delivered','undelivered','failed','canceled','uncertain','scheduled'));
-- Rows written before the outbox existed are already final; none can be waiting to send.
UPDATE "SmsMessage" SET "state" = 'accepted' WHERE "state" NOT IN ('queued','dispatching','accepted','sending','sent','delivered','undelivered','failed','canceled','uncertain','scheduled');

CREATE TABLE "SmsWebhookEvent" (
  "eventKey" TEXT NOT NULL,
  "accountSid" TEXT NOT NULL,
  "providerSid" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmsWebhookEvent_pkey" PRIMARY KEY ("eventKey")
);
CREATE INDEX "SmsWebhookEvent_providerSid_idx" ON "SmsWebhookEvent"("providerSid");
