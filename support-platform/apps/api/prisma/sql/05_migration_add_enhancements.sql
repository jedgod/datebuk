-- Migration script to add enhancements without data loss

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add search vector column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'searchVector'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "searchVector" tsvector;
  END IF;
END
$$;

-- Trigger for search vector
CREATE OR REPLACE FUNCTION user_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    to_tsvector('english', COALESCE(NEW."bio", '')) ||
    to_tsvector('english', array_to_string(NEW."interests", ' '));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_search_update ON "User";
CREATE TRIGGER user_search_update
  BEFORE INSERT OR UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION user_search_trigger();

CREATE INDEX IF NOT EXISTS "idx_user_search" ON "User" USING GIN ("searchVector");

-- Materialized view
DROP MATERIALIZED VIEW IF EXISTS "active_video_queue";
CREATE MATERIALIZED VIEW "active_video_queue" AS
SELECT
  v."id" AS video_id,
  v."userId" AS user_id,
  v."uploadedAt" AS started_at,
  v."durationSec" AS duration_seconds,
  v."status" AS status,
  v."aiScores" AS ai_scores,
  u."displayName" AS user_name,
  u."trustScore" AS user_trust,
  u."datingIntent" AS user_intent,
  CASE
    WHEN COALESCE((v."aiScores"->>'overall')::numeric, 0) > 0.7 THEN 'high'
    WHEN COALESCE((v."aiScores"->>'overall')::numeric, 0) > 0.4 THEN 'medium'
    ELSE 'low'
  END AS risk_priority
FROM "Video" v
JOIN "User" u ON v."userId" = u."id"
WHERE v."status" IN ('PENDING', 'APPROVED')
ORDER BY COALESCE((v."aiScores"->>'overall')::numeric, 0) DESC, v."uploadedAt" DESC;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_active_video_queue_id" ON "active_video_queue"(video_id);

-- Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Video" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VideoModerationItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FraudEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ModeratorQueue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid AS $$
BEGIN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS text AS $$
BEGIN
  RETURN 'USER';
END;
$$ LANGUAGE plpgsql;

-- Policies (guarded by checks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_own_data') THEN
    CREATE POLICY user_own_data ON "User"
      FOR ALL
      USING ("id" = current_user_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_public_profiles') THEN
    CREATE POLICY user_public_profiles ON "User"
      FOR SELECT
      USING ("visibility" IN ('NORMAL'::"ProfileVisibilityEnum", 'BOOSTED'::"ProfileVisibilityEnum") AND "deletedAt" IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'match_own') THEN
    CREATE POLICY match_own ON "Match"
      FOR ALL
      USING ("user1Id" = current_user_id() OR "user2Id" = current_user_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'message_own_match') THEN
    CREATE POLICY message_own_match ON "Message"
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM "Match" m
          WHERE m."id" = "Message"."matchId"
            AND (m."user1Id" = current_user_id() OR m."user2Id" = current_user_id())
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'video_own') THEN
    CREATE POLICY video_own ON "Video"
      FOR ALL
      USING ("userId" = current_user_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'moderation_admin_only') THEN
    CREATE POLICY moderation_admin_only ON "VideoModerationItem"
      FOR ALL
      USING (current_user_role() IN ('SUPERADMIN', 'SUPPORT'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'fraud_admin_only') THEN
    CREATE POLICY fraud_admin_only ON "FraudEvent"
      FOR ALL
      USING (current_user_role() IN ('SUPERADMIN', 'SUPPORT'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'queue_admin_only') THEN
    CREATE POLICY queue_admin_only ON "ModeratorQueue"
      FOR ALL
      USING (current_user_role() IN ('SUPERADMIN', 'SUPPORT'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'audit_admin_only') THEN
    CREATE POLICY audit_admin_only ON "AuditLog"
      FOR ALL
      USING (current_user_role() IN ('SUPERADMIN', 'SUPPORT'));
  END IF;
END
$$;

-- Backfill search vector
UPDATE "User"
SET "searchVector" =
  to_tsvector('english', COALESCE("bio", '')) ||
  to_tsvector('english', array_to_string("interests", ' '));

-- Refresh materialized view
REFRESH MATERIALIZED VIEW "active_video_queue";
