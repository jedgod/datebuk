-- Credential lifecycle, versioned encryption, spending controls (DCG V7.1 / V8.1 / V8.3)
ALTER TABLE "TwilioAccount"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "statusReason" TEXT,
  ADD COLUMN "apiKeySid" TEXT,
  ADD COLUMN "encryptedApiKeySecret" TEXT,
  ADD COLUMN "keyVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastValidatedAt" TIMESTAMP(3),
  ADD COLUMN "rotatedAt" TIMESTAMP(3),
  ADD COLUMN "dailySegmentLimit" INTEGER,
  ADD COLUMN "monthlySegmentLimit" INTEGER,
  ADD COLUMN "allowedPrefixes" TEXT[] NOT NULL DEFAULT ARRAY['+1'];

-- Existing rows: enabled accounts stay usable; keyVersion 0 marks credentials still encrypted
-- with the legacy key so they can be migrated (and verified) before that key is retired.
UPDATE "TwilioAccount" SET "status" = CASE WHEN "enabled" THEN 'active' ELSE 'suspended' END;

ALTER TABLE "TwilioAccount" ALTER COLUMN "encryptedAuthToken" DROP NOT NULL;
ALTER TABLE "TwilioAccount" DROP COLUMN "enabled";

ALTER TABLE "TwilioAccount" ADD CONSTRAINT "TwilioAccount_status_check"
  CHECK ("status" IN ('pending','verified','active','suspended','rotating','revoked'));
ALTER TABLE "TwilioAccount" ADD CONSTRAINT "TwilioAccount_credentials_check"
  CHECK ("encryptedAuthToken" IS NOT NULL OR ("apiKeySid" IS NOT NULL AND "encryptedApiKeySecret" IS NOT NULL));
CREATE UNIQUE INDEX "TwilioAccount_single_active" ON "TwilioAccount" ((true)) WHERE "status" = 'active';

ALTER TABLE "SmsMessage" ADD COLUMN "accountId" TEXT, ADD COLUMN "segments" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX "SmsMessage_accountId_createdAt_idx" ON "SmsMessage"("accountId", "createdAt");
