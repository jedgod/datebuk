-- Enforces "at most one PENDING verification request per user" at the database level.
-- The application-level check-then-create in VerificationService.submit() has a real
-- TOCTOU race under Postgres's default READ COMMITTED isolation: two concurrent
-- submissions can both see "no pending request" before either commits, producing two
-- PENDING rows for the same user. Prisma's schema.prisma has no syntax for a partial
-- (WHERE-scoped) unique index, so this is applied as raw SQL and is not represented in
-- schema.prisma — the service catches the resulting unique-violation (Prisma error
-- P2002) and treats it as "someone else's concurrent request already won, fall back to
-- updating it" rather than surfacing a raw 500.
CREATE UNIQUE INDEX "VerificationRequest_one_pending_per_user"
    ON "VerificationRequest"("userId")
    WHERE "status" = 'PENDING';
