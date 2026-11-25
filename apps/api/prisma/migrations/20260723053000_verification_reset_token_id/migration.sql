-- O(1)-lookup token id for email verification / password reset tokens, mirroring the
-- Session refresh-token split-secret design. Nullable: legacy bcrypt-hashed rows keep
-- working via a fallback scan until they naturally expire (short TTLs, no backfill needed).
ALTER TABLE "EmailVerificationToken" ADD COLUMN "tokenId" TEXT;
CREATE UNIQUE INDEX "EmailVerificationToken_tokenId_key" ON "EmailVerificationToken"("tokenId");

ALTER TABLE "PasswordResetToken" ADD COLUMN "tokenId" TEXT;
CREATE UNIQUE INDEX "PasswordResetToken_tokenId_key" ON "PasswordResetToken"("tokenId");
