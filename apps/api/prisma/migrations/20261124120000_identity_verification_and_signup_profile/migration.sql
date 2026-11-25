-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "sexualOrientation" TEXT,
  ADD COLUMN "relationshipGoal" TEXT,
  ADD COLUMN "heightCm" INTEGER,
  ADD COLUMN "phoneE164" TEXT,
  ADD COLUMN "identityVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "IdentityVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_CAPTURE',
  "tokenHash" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "phoneLast4" TEXT,
  "challenge" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consentedAt" TIMESTAMP(3) NOT NULL,
  "docType" TEXT,
  "docExpired" BOOLEAN,
  "ageOk" BOOLEAN,
  "dobMatches" BOOLEAN,
  "nameMatches" BOOLEAN,
  "faceSimilarity" DOUBLE PRECISION,
  "livenessPassed" BOOLEAN,
  "decisionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdentityVerification_tokenHash_key" ON "IdentityVerification"("tokenHash");
CREATE INDEX "IdentityVerification_userId_idx" ON "IdentityVerification"("userId");
CREATE INDEX "IdentityVerification_status_idx" ON "IdentityVerification"("status");

ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
