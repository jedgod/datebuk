-- Absolute expiry for refresh-token sessions. Nullable: existing sessions are
-- unaffected; every session issued after this migration always sets it.
ALTER TABLE "Session" ADD COLUMN "expiresAt" TIMESTAMP(3);
