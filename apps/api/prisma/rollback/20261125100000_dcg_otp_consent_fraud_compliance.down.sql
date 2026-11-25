-- Rollback of 20261125100000_dcg_otp_consent_fraud_compliance (OTP, consent history, fraud events,
-- compliance records, emergency-stop control).
-- DESTRUCTIVE for the data in those tables: take a backup first. Run in a transaction, newest object first.
BEGIN;
DROP TABLE IF EXISTS "SmsControl";
ALTER TABLE IF EXISTS "ComplianceRegistration" DROP CONSTRAINT IF EXISTS "ComplianceRegistration_accountId_fkey";
DROP TABLE IF EXISTS "ComplianceRegistration";
DROP TABLE IF EXISTS "SmsRiskEvent";
DROP TRIGGER IF EXISTS sms_consent_event_immutable ON "SmsConsentEvent";
DROP FUNCTION IF EXISTS sms_consent_event_immutable();
DROP TABLE IF EXISTS "SmsConsentEvent";
DROP TABLE IF EXISTS "SmsConsent";
DROP TABLE IF EXISTS "OtpChallenge";
ALTER TABLE "SmsMessage" DROP COLUMN IF EXISTS "needsReview", DROP COLUMN IF EXISTS "lastReconciledAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "phoneVerifiedAt";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261125100000_dcg_otp_consent_fraud_compliance';
COMMIT;
