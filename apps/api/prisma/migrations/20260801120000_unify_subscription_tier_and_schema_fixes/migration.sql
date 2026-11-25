-- Security/data-integrity remediation batch (see ultra_datebuk-08-01-2026.txt):
--   1. User.dateOfBirth: server-side age-gate source of truth (AuthService.signup).
--   2. Unify SubscriptionTierEnum (FREE/PREMIUM_BASIC/PREMIUM_PLUS/VIP) onto the
--      same FREE/PREMIUM/ELITE taxonomy already used by the Stripe-linked
--      SubscriptionTier table, removing the need for fuzzy string-matching
--      normalizers scattered across apps/api and apps/web.
--   3. Align Match/Like/Message onDelete behavior in schema.prisma with what is
--      actually enforced live (RESTRICT) — this migration does not change live
--      FK behavior for those three, only documents it (see part 4 below for the
--      FKs that DO change).
--   4. Change financial/safety audit trail FKs (SubscriptionInvoice, Report,
--      Flag, ModerationLog, QuarantinedVideo) from CASCADE to RESTRICT so
--      deleting a user cannot silently purge billing history or moderation
--      evidence. A real account-deletion flow should anonymize the User row
--      instead of hard-deleting it.

-- ============================================================
-- 1. User.dateOfBirth
-- ============================================================
ALTER TABLE "User" ADD COLUMN "dateOfBirth" TIMESTAMP(3);

-- ============================================================
-- 2. Unify SubscriptionTierEnum onto FREE/PREMIUM/ELITE
-- ============================================================
-- Create the new enum type with only the canonical values. Values in a
-- freshly-created type can be used immediately within the same transaction
-- (the "new enum value not yet visible" restriction only applies to values
-- ADDED to an EXISTING type via ALTER TYPE ... ADD VALUE), so this avoids
-- needing a second migration/transaction just to use the new labels.
CREATE TYPE "SubscriptionTierEnum_new" AS ENUM ('FREE', 'PREMIUM', 'ELITE');

-- User.subscriptionTier: remap legacy values, then swap the column's type.
ALTER TABLE "User" ALTER COLUMN "subscriptionTier" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "subscriptionTier" TYPE "SubscriptionTierEnum_new"
  USING (
    CASE "subscriptionTier"::text
      WHEN 'PREMIUM_BASIC' THEN 'PREMIUM'
      WHEN 'PREMIUM_PLUS' THEN 'PREMIUM'
      WHEN 'VIP' THEN 'ELITE'
      ELSE "subscriptionTier"::text
    END
  )::"SubscriptionTierEnum_new";
ALTER TABLE "User" ALTER COLUMN "subscriptionTier" SET DEFAULT 'FREE'::"SubscriptionTierEnum_new";

-- Legacy Subscription.tier column: same remap (table is currently empty in
-- every known environment, but handle real data defensively regardless).
ALTER TABLE "Subscription" ALTER COLUMN "tier" TYPE "SubscriptionTierEnum_new"
  USING (
    CASE "tier"::text
      WHEN 'PREMIUM_BASIC' THEN 'PREMIUM'
      WHEN 'PREMIUM_PLUS' THEN 'PREMIUM'
      WHEN 'VIP' THEN 'ELITE'
      ELSE "tier"::text
    END
  )::"SubscriptionTierEnum_new";

-- Swap the type into place.
DROP TYPE "SubscriptionTierEnum";
ALTER TYPE "SubscriptionTierEnum_new" RENAME TO "SubscriptionTierEnum";

-- ============================================================
-- 3. SubscriptionInvoice/Report/Flag/ModerationLog/QuarantinedVideo:
--    CASCADE -> RESTRICT on the user relation (preserve audit/financial
--    trail on account deletion instead of purging it).
-- ============================================================
ALTER TABLE "SubscriptionInvoice" DROP CONSTRAINT "SubscriptionInvoice_userId_fkey";
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Report" DROP CONSTRAINT "Report_reporterId_fkey";
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Report" DROP CONSTRAINT "Report_reportedId_fkey";
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedId_fkey"
  FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Flag" DROP CONSTRAINT "Flag_userId_fkey";
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ModerationLog" DROP CONSTRAINT "ModerationLog_userId_fkey";
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuarantinedVideo" DROP CONSTRAINT "QuarantinedVideo_userId_fkey";
ALTER TABLE "QuarantinedVideo" ADD CONSTRAINT "QuarantinedVideo_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 4. Match/Message: CASCADE -> RESTRICT on the user relations, to match
--    what is (and per the initial migration, always was) actually live.
--    schema.prisma previously documented these as Cascade, which was
--    inaccurate; this migration makes reality match the corrected schema
--    file rather than the other way around, since flipping to Cascade
--    would be a much bigger, riskier behavior change (silently deleting
--    match/message history on user deletion). Like.fromId/toId are
--    already RESTRICT live (Prisma's default for a required relation) —
--    no DB change needed there, only the schema.prisma annotation.
-- ============================================================
ALTER TABLE "Match" DROP CONSTRAINT "Match_user1Id_fkey";
ALTER TABLE "Match" ADD CONSTRAINT "Match_user1Id_fkey"
  FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Match" DROP CONSTRAINT "Match_user2Id_fkey";
ALTER TABLE "Match" ADD CONSTRAINT "Match_user2Id_fkey"
  FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
