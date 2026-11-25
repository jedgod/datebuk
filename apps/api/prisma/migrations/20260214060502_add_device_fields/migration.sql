-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deviceFingerprints" TEXT[],
ADD COLUMN     "trustedDevices" TEXT[];

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpLog" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userId" TEXT,
    "userAgent" TEXT,
    "geoCountry" TEXT,
    "geoCity" TEXT,
    "isVpnSuspect" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IpLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpBlacklist" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "addedBy" TEXT,

    CONSTRAINT "IpBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpIntelCache" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "intel" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "IpIntelCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "eventType" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "decisionApplied" TEXT,
    "challengeMethod" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudFeedback" (
    "id" TEXT NOT NULL,
    "fraudEventId" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 100,
    "reason" TEXT,
    "providedBy" TEXT,
    "providedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudExplanation" (
    "id" TEXT NOT NULL,
    "fraudEventId" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "sources" JSONB NOT NULL,
    "modelScore" DOUBLE PRECISION,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeratorQueue" (
    "id" TEXT NOT NULL,
    "fraudEventId" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assignedTo" TEXT,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeratorQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityMetric" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dimension" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "assignment" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX "IpLog_ip_idx" ON "IpLog"("ip");

-- CreateIndex
CREATE INDEX "IpLog_userId_idx" ON "IpLog"("userId");

-- CreateIndex
CREATE INDEX "IpLog_createdAt_idx" ON "IpLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IpBlacklist_ip_key" ON "IpBlacklist"("ip");

-- CreateIndex
CREATE INDEX "IpBlacklist_ip_idx" ON "IpBlacklist"("ip");

-- CreateIndex
CREATE INDEX "IpBlacklist_blocked_idx" ON "IpBlacklist"("blocked");

-- CreateIndex
CREATE UNIQUE INDEX "IpIntelCache_ip_key" ON "IpIntelCache"("ip");

-- CreateIndex
CREATE INDEX "IpIntelCache_ip_idx" ON "IpIntelCache"("ip");

-- CreateIndex
CREATE INDEX "FraudEvent_userId_idx" ON "FraudEvent"("userId");

-- CreateIndex
CREATE INDEX "FraudEvent_ip_idx" ON "FraudEvent"("ip");

-- CreateIndex
CREATE INDEX "FraudEvent_eventType_idx" ON "FraudEvent"("eventType");

-- CreateIndex
CREATE INDEX "FraudEvent_createdAt_idx" ON "FraudEvent"("createdAt");

-- CreateIndex
CREATE INDEX "FraudEvent_resolved_idx" ON "FraudEvent"("resolved");

-- CreateIndex
CREATE UNIQUE INDEX "FraudFeedback_fraudEventId_key" ON "FraudFeedback"("fraudEventId");

-- CreateIndex
CREATE INDEX "FraudFeedback_fraudEventId_idx" ON "FraudFeedback"("fraudEventId");

-- CreateIndex
CREATE UNIQUE INDEX "FraudExplanation_fraudEventId_key" ON "FraudExplanation"("fraudEventId");

-- CreateIndex
CREATE INDEX "FraudExplanation_fraudEventId_idx" ON "FraudExplanation"("fraudEventId");

-- CreateIndex
CREATE UNIQUE INDEX "ModeratorQueue_fraudEventId_key" ON "ModeratorQueue"("fraudEventId");

-- CreateIndex
CREATE INDEX "ModeratorQueue_status_idx" ON "ModeratorQueue"("status");

-- CreateIndex
CREATE INDEX "ModeratorQueue_priority_idx" ON "ModeratorQueue"("priority");

-- CreateIndex
CREATE INDEX "ModeratorQueue_assignedTo_idx" ON "ModeratorQueue"("assignedTo");

-- CreateIndex
CREATE INDEX "SecurityMetric_metric_idx" ON "SecurityMetric"("metric");

-- CreateIndex
CREATE INDEX "SecurityMetric_recordedAt_idx" ON "SecurityMetric"("recordedAt");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_experimentId_idx" ON "ExperimentAssignment"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentAssignment_userId_experimentId_key" ON "ExperimentAssignment"("userId", "experimentId");

-- AddForeignKey
ALTER TABLE "IpLog" ADD CONSTRAINT "IpLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudEvent" ADD CONSTRAINT "FraudEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudFeedback" ADD CONSTRAINT "FraudFeedback_fraudEventId_fkey" FOREIGN KEY ("fraudEventId") REFERENCES "FraudEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudExplanation" ADD CONSTRAINT "FraudExplanation_fraudEventId_fkey" FOREIGN KEY ("fraudEventId") REFERENCES "FraudEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeratorQueue" ADD CONSTRAINT "ModeratorQueue_fraudEventId_fkey" FOREIGN KEY ("fraudEventId") REFERENCES "FraudEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
