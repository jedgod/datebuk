-- A revoked account has its secrets wiped, so the "some credential present" check must not apply to it.
ALTER TABLE "TwilioAccount" DROP CONSTRAINT "TwilioAccount_credentials_check";
ALTER TABLE "TwilioAccount" ADD CONSTRAINT "TwilioAccount_credentials_check"
  CHECK ("status" = 'revoked' OR "encryptedAuthToken" IS NOT NULL OR ("apiKeySid" IS NOT NULL AND "encryptedApiKeySecret" IS NOT NULL));
