-- Tamper-evident audit storage: hash/previousHash let a periodic integrity check detect
-- deletion or editing of any past AuditLog row (each row's hash commits to the previous
-- row's hash). requestId cross-references an entry to the specific HTTP request that
-- produced it (see request-context.ts). Existing rows get NULL for all three — they
-- predate the chain and are exempted from verification, not retroactively chained.
ALTER TABLE "AuditLog"
  ADD COLUMN "requestId" TEXT,
  ADD COLUMN "hash" TEXT,
  ADD COLUMN "previousHash" TEXT;

CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- Real, persisted security-alert queue (rule-based detection over audit events), staff
-- review workflow modeled on the existing ModeratorQueue pattern.
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetUserId" TEXT,
    "evidence" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityAlert_status_idx" ON "SecurityAlert"("status");
CREATE INDEX "SecurityAlert_severity_idx" ON "SecurityAlert"("severity");
CREATE INDEX "SecurityAlert_ruleId_idx" ON "SecurityAlert"("ruleId");
CREATE INDEX "SecurityAlert_actorUserId_idx" ON "SecurityAlert"("actorUserId");
CREATE INDEX "SecurityAlert_createdAt_idx" ON "SecurityAlert"("createdAt");
