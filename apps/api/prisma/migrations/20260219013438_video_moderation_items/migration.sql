-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "assignedById" DROP NOT NULL;

-- CreateTable
CREATE TABLE "VideoModerationItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "flagReason" TEXT NOT NULL,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "userIntent" TEXT NOT NULL DEFAULT 'casual',
    "userTrustLevel" TEXT NOT NULL DEFAULT 'medium',
    "aiScores" JSONB,
    "keyframes" TEXT[],
    "audioWaveform" INTEGER[],
    "violationTimestamps" INTEGER[],
    "recentMessages" JSONB,
    "matchDetails" JSONB,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoModerationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoModerationItem_status_idx" ON "VideoModerationItem"("status");

-- CreateIndex
CREATE INDEX "VideoModerationItem_severity_idx" ON "VideoModerationItem"("severity");

-- CreateIndex
CREATE INDEX "VideoModerationItem_riskScore_idx" ON "VideoModerationItem"("riskScore");

-- CreateIndex
CREATE INDEX "VideoModerationItem_flaggedAt_idx" ON "VideoModerationItem"("flaggedAt");

-- AddForeignKey
ALTER TABLE "VideoModerationItem" ADD CONSTRAINT "VideoModerationItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
