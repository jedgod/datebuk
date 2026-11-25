-- DCG V12.2-V14.0: OTP, consent history, fraud events, compliance records, emergency stop
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "SmsMessage" ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "lastReconciledAt" TIMESTAMP(3);

CREATE TABLE "OtpChallenge" (
  "id" TEXT NOT NULL, "purpose" TEXT NOT NULL, "userId" TEXT,
  "recipientHash" TEXT NOT NULL, "recipientLast4" TEXT NOT NULL, "codeHmac" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "attempts" INTEGER NOT NULL DEFAULT 0, "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "consumedAt" TIMESTAMP(3), "lastSentAt" TIMESTAMP(3) NOT NULL, "ipHash" TEXT, "deviceHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OtpChallenge_recipientHash_purpose_createdAt_idx" ON "OtpChallenge"("recipientHash","purpose","createdAt");
CREATE INDEX "OtpChallenge_userId_purpose_createdAt_idx" ON "OtpChallenge"("userId","purpose","createdAt");
CREATE INDEX "OtpChallenge_ipHash_createdAt_idx" ON "OtpChallenge"("ipHash","createdAt");
CREATE INDEX "OtpChallenge_deviceHash_createdAt_idx" ON "OtpChallenge"("deviceHash","createdAt");
CREATE INDEX "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");

CREATE TABLE "SmsConsent" (
  "phoneHash" TEXT NOT NULL, "purpose" TEXT NOT NULL, "status" TEXT NOT NULL, "source" TEXT NOT NULL,
  "policyVersion" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SmsConsent_pkey" PRIMARY KEY ("phoneHash","purpose"),
  CONSTRAINT "SmsConsent_status_check" CHECK ("status" IN ('granted','withdrawn'))
);
CREATE TABLE "SmsConsentEvent" (
  "id" TEXT NOT NULL, "phoneHash" TEXT NOT NULL, "recipientLast4" TEXT NOT NULL, "purpose" TEXT NOT NULL,
  "action" TEXT NOT NULL, "source" TEXT NOT NULL, "policyVersion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmsConsentEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SmsConsentEvent_action_check" CHECK ("action" IN ('granted','withdrawn','stop','start'))
);
CREATE INDEX "SmsConsentEvent_phoneHash_createdAt_idx" ON "SmsConsentEvent"("phoneHash","createdAt");
-- Consent history is append-only: rows can be added, never edited. Deletion is allowed only inside the
-- documented retention job, which sets dcg.retention_job = 'on' for its own transaction.
CREATE FUNCTION sms_consent_event_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('dcg.retention_job', true) = 'on' AND TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'SmsConsentEvent is append-only';
END $$;
CREATE TRIGGER sms_consent_event_immutable BEFORE UPDATE OR DELETE ON "SmsConsentEvent"
  FOR EACH ROW EXECUTE FUNCTION sms_consent_event_immutable();

CREATE TABLE "SmsRiskEvent" (
  "id" TEXT NOT NULL, "kind" TEXT NOT NULL, "score" INTEGER NOT NULL, "severity" TEXT NOT NULL, "action" TEXT NOT NULL,
  "userId" TEXT, "subjectHash" TEXT, "ipHash" TEXT, "details" JSONB, "status" TEXT NOT NULL DEFAULT 'open',
  "reviewedBy" TEXT, "reviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmsRiskEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SmsRiskEvent_kind_createdAt_idx" ON "SmsRiskEvent"("kind","createdAt");
CREATE INDEX "SmsRiskEvent_status_createdAt_idx" ON "SmsRiskEvent"("status","createdAt");
CREATE INDEX "SmsRiskEvent_ipHash_createdAt_idx" ON "SmsRiskEvent"("ipHash","createdAt");

CREATE TABLE "ComplianceRegistration" (
  "id" TEXT NOT NULL, "accountId" TEXT NOT NULL, "type" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending',
  "brandId" TEXT, "campaignId" TEXT, "senderId" TEXT, "evidenceNote" TEXT, "submittedAt" TIMESTAMP(3),
  "decidedAt" TIMESTAMP(3), "decidedBy" TEXT, "expiresAt" TIMESTAMP(3), "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ComplianceRegistration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ComplianceRegistration_type_check" CHECK ("type" IN ('A2P_10DLC_BRAND','A2P_10DLC_CAMPAIGN','TOLLFREE_VERIFICATION')),
  CONSTRAINT "ComplianceRegistration_status_check" CHECK ("status" IN ('pending','approved','rejected','suspended','expired'))
);
CREATE INDEX "ComplianceRegistration_accountId_type_status_idx" ON "ComplianceRegistration"("accountId","type","status");
ALTER TABLE "ComplianceRegistration" ADD CONSTRAINT "ComplianceRegistration_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "TwilioAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SmsControl" (
  "key" TEXT NOT NULL, "value" TEXT NOT NULL, "reason" TEXT, "updatedBy" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SmsControl_pkey" PRIMARY KEY ("key")
);
