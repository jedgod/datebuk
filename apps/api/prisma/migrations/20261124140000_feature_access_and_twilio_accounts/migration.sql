-- CreateTable
CREATE TABLE "FeatureUsage" (
  "userId" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "count" INTEGER NOT NULL,
  CONSTRAINT "FeatureUsage_pkey" PRIMARY KEY ("userId","feature","day")
);
CREATE INDEX "FeatureUsage_day_idx" ON "FeatureUsage"("day");

CREATE TABLE "FeatureOperation" (
  "userId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeatureOperation_pkey" PRIMARY KEY ("userId","requestId")
);

CREATE TABLE "DisabledFeature" (
  "feature" TEXT NOT NULL,
  "disabledBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DisabledFeature_pkey" PRIMARY KEY ("feature")
);

CREATE TABLE "TwilioAccount" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "accountSid" TEXT NOT NULL,
  "encryptedAuthToken" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TwilioAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TwilioAccount_sid_format" CHECK ("accountSid" ~ '^AC[0-9a-fA-F]{32}$')
);
CREATE UNIQUE INDEX "TwilioAccount_accountSid_key" ON "TwilioAccount"("accountSid");

CREATE TABLE "TwilioSender" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "senderNumber" TEXT,
  "messagingServiceSid" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TwilioSender_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TwilioSender_one_of" CHECK (("senderNumber" IS NOT NULL) <> ("messagingServiceSid" IS NOT NULL)),
  CONSTRAINT "TwilioSender_number_format" CHECK ("senderNumber" IS NULL OR "senderNumber" ~ '^\+[1-9][0-9]{1,14}$'),
  CONSTRAINT "TwilioSender_service_format" CHECK ("messagingServiceSid" IS NULL OR "messagingServiceSid" ~ '^MG[0-9a-fA-F]{32}$')
);
CREATE INDEX "TwilioSender_accountId_idx" ON "TwilioSender"("accountId");
ALTER TABLE "TwilioSender" ADD CONSTRAINT "TwilioSender_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "TwilioAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SmsSuppression" (
  "phone" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmsSuppression_pkey" PRIMARY KEY ("phone")
);

CREATE TABLE "SmsMessage" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "purpose" TEXT NOT NULL,
  "recipientLast4" TEXT NOT NULL,
  "providerSid" TEXT,
  "state" TEXT NOT NULL DEFAULT 'queued',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SmsMessage_providerSid_key" ON "SmsMessage"("providerSid");
CREATE INDEX "SmsMessage_userId_idx" ON "SmsMessage"("userId");
