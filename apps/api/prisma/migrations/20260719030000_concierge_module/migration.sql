CREATE TYPE "ConciergeRequestStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'OUTREACH_SENT', 'RECIPIENT_INTERESTED', 'RECIPIENT_DECLINED', 'EXPIRED', 'CANCELLED', 'CLOSED');
CREATE TYPE "ConciergeResponseType" AS ENUM ('INTERESTED', 'REPLY_NOW', 'MAYBE_LATER', 'NOT_INTERESTED', 'BLOCK_REQUESTER', 'OPT_OUT', 'REPORT');
CREATE TYPE "ConciergeServiceType" AS ENUM ('CONCIERGE_OUTREACH_PACKAGE', 'PROFILE_REVIEW', 'PROFILE_OPTIMIZATION', 'PHOTO_REVIEW', 'BACKGROUND_CHECK_REQUEST', 'DATE_PLANNING', 'RELATIONSHIP_COACHING', 'PRIORITY_SUPPORT');
CREATE TYPE "ConciergeOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_MEMBER', 'COMPLETED', 'CANCELLED', 'REFUNDED');

ALTER TABLE "User" ADD COLUMN "conciergeOptOut" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ConciergeWallet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "availableCredits" INTEGER NOT NULL DEFAULT 0,
  "lifetimePurchased" INTEGER NOT NULL DEFAULT 0,
  "lifetimeUsed" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConciergeWallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConciergeRequest" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "staffId" TEXT,
  "status" "ConciergeRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "reason" TEXT NOT NULL,
  "requesterMessage" TEXT NOT NULL,
  "staffMessage" TEXT,
  "staffNotes" TEXT,
  "recipientResponse" "ConciergeResponseType",
  "recipientMessage" TEXT,
  "creditConsumed" BOOLEAN NOT NULL DEFAULT true,
  "outreachSentAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConciergeRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConciergeMessage" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "senderId" TEXT,
  "senderRole" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "internal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConciergeMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConciergeBlock" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConciergeBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConciergeServiceCatalog" (
  "id" TEXT NOT NULL,
  "type" "ConciergeServiceType" NOT NULL,
  "name" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "fullDescription" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "includedUnits" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "premiumEligible" BOOLEAN NOT NULL DEFAULT true,
  "eliteEligible" BOOLEAN NOT NULL DEFAULT true,
  "freeEligible" BOOLEAN NOT NULL DEFAULT false,
  "turnaroundHours" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConciergeServiceCatalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConciergeServiceOrder" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "serviceCatalogId" TEXT NOT NULL,
  "assignedStaffId" TEXT,
  "status" "ConciergeOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "intakeJson" JSONB,
  "deliveryJson" JSONB,
  "memberNotes" TEXT,
  "staffNotes" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConciergeServiceOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConciergeWallet_userId_key" ON "ConciergeWallet"("userId");
CREATE INDEX "ConciergeRequest_requesterId_createdAt_idx" ON "ConciergeRequest"("requesterId", "createdAt");
CREATE INDEX "ConciergeRequest_recipientId_createdAt_idx" ON "ConciergeRequest"("recipientId", "createdAt");
CREATE INDEX "ConciergeRequest_status_createdAt_idx" ON "ConciergeRequest"("status", "createdAt");
CREATE INDEX "ConciergeRequest_staffId_status_idx" ON "ConciergeRequest"("staffId", "status");
CREATE INDEX "ConciergeMessage_requestId_createdAt_idx" ON "ConciergeMessage"("requestId", "createdAt");
CREATE UNIQUE INDEX "ConciergeBlock_blockerId_blockedId_key" ON "ConciergeBlock"("blockerId", "blockedId");
CREATE INDEX "ConciergeBlock_blockedId_idx" ON "ConciergeBlock"("blockedId");
CREATE UNIQUE INDEX "ConciergeServiceCatalog_type_key" ON "ConciergeServiceCatalog"("type");
CREATE INDEX "ConciergeServiceOrder_memberId_createdAt_idx" ON "ConciergeServiceOrder"("memberId", "createdAt");
CREATE INDEX "ConciergeServiceOrder_status_createdAt_idx" ON "ConciergeServiceOrder"("status", "createdAt");
CREATE INDEX "ConciergeServiceOrder_assignedStaffId_status_idx" ON "ConciergeServiceOrder"("assignedStaffId", "status");

ALTER TABLE "ConciergeWallet" ADD CONSTRAINT "ConciergeWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeRequest" ADD CONSTRAINT "ConciergeRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeRequest" ADD CONSTRAINT "ConciergeRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeRequest" ADD CONSTRAINT "ConciergeRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConciergeMessage" ADD CONSTRAINT "ConciergeMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ConciergeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeMessage" ADD CONSTRAINT "ConciergeMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConciergeBlock" ADD CONSTRAINT "ConciergeBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeBlock" ADD CONSTRAINT "ConciergeBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeServiceOrder" ADD CONSTRAINT "ConciergeServiceOrder_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeServiceOrder" ADD CONSTRAINT "ConciergeServiceOrder_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConciergeServiceOrder" ADD CONSTRAINT "ConciergeServiceOrder_serviceCatalogId_fkey" FOREIGN KEY ("serviceCatalogId") REFERENCES "ConciergeServiceCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
