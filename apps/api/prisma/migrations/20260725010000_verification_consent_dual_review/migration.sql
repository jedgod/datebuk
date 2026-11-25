-- Supports two audit-flagged gaps in the (renamed) Photo Verification flow:
-- explicit consent capture at submission time, and a real dual-review path for
-- "uncertain" decisions — a staff member who escalates a request can no longer be the
-- one who finalizes it (firstReviewerId is checked against the finalizing reviewer's id
-- in VerificationService.review()). status stays a plain String column (see
-- verification.service.ts), so the new "ESCALATED" value needs no enum/type change.
ALTER TABLE "VerificationRequest"
  ADD COLUMN "consentedAt" TIMESTAMP(3),
  ADD COLUMN "firstReviewerId" TEXT;
