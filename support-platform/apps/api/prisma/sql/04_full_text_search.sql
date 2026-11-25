-- Full-text search on User bio + interests

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

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

-- Backfill existing data
UPDATE "User"
SET "searchVector" =
  to_tsvector('english', COALESCE("bio", '')) ||
  to_tsvector('english', array_to_string("interests", ' '));
