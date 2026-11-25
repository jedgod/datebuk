-- Real block/report safety feature: block/report UI previously existed only as toast
-- stubs with no persisted state (see apps/web dashboard/matches/page.tsx handleBlockUser/
-- handleReportUser prior to this migration). This creates the persisted Block table and
-- extends the existing (previously unused) Report model into a general user-safety
-- report flow with status/severity/evidence-snapshot fields.

-- New report categories. ALTER TYPE ... ADD VALUE cannot be used in the same transaction
-- as a statement that references the new value, so this file never uses these values
-- itself — only later application code (via a separate connection) does.
ALTER TYPE "ViolationTypeEnum" ADD VALUE IF NOT EXISTS 'INAPPROPRIATE';
ALTER TYPE "ViolationTypeEnum" ADD VALUE IF NOT EXISTS 'SAFETY_CONCERN';
ALTER TYPE "ViolationTypeEnum" ADD VALUE IF NOT EXISTS 'UNDERAGE_CONCERN';
ALTER TYPE "ViolationTypeEnum" ADD VALUE IF NOT EXISTS 'EMERGENCY';

CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "ReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TABLE "Report"
  ADD COLUMN "matchId" TEXT,
  ADD COLUMN "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "severity" "ReportSeverity" NOT NULL DEFAULT 'LOW',
  ADD COLUMN "conversationSnapshot" JSONB,
  ADD COLUMN "alsoBlocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "resolvedBy" TEXT,
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "resolutionNote" TEXT;

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Report_status_idx" ON "Report"("status");
CREATE INDEX "Report_severity_idx" ON "Report"("severity");

CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");
CREATE INDEX "Block_blockerId_idx" ON "Block"("blockerId");
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
