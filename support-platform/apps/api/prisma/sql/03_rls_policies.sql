-- Enable RLS on core tables

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Video" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VideoModerationItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FraudEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ModeratorQueue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Helper functions (replace with app/session logic)
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

-- Users: own data + public profiles
CREATE POLICY user_own_data ON "User"
  FOR ALL
  USING ("id" = current_user_id());

CREATE POLICY user_public_profiles ON "User"
  FOR SELECT
  USING ("visibility" IN ('NORMAL'::"ProfileVisibilityEnum", 'BOOSTED'::"ProfileVisibilityEnum") AND "deletedAt" IS NULL);

-- Matches: only your matches
CREATE POLICY match_own ON "Match"
  FOR ALL
  USING ("user1Id" = current_user_id() OR "user2Id" = current_user_id());

-- Messages: only in your matches
CREATE POLICY message_own_match ON "Message"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Match" m
      WHERE m."id" = "Message"."matchId"
        AND (m."user1Id" = current_user_id() OR m."user2Id" = current_user_id())
    )
  );

-- Videos: only your own uploads
CREATE POLICY video_own ON "Video"
  FOR ALL
  USING ("userId" = current_user_id());

-- Moderation: admin/support only
CREATE POLICY moderation_admin_only ON "VideoModerationItem"
  FOR ALL
  USING (current_user_role() IN ('SUPERADMIN', 'SUPPORT'));

CREATE POLICY fraud_admin_only ON "FraudEvent"
  FOR ALL
  USING (current_user_role() IN ('SUPERADMIN', 'SUPPORT'));

CREATE POLICY queue_admin_only ON "ModeratorQueue"
  FOR ALL
  USING (current_user_role() IN ('SUPERADMIN', 'SUPPORT'));

CREATE POLICY audit_admin_only ON "AuditLog"
  FOR ALL
  USING (current_user_role() IN ('SUPERADMIN', 'SUPPORT'));
