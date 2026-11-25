-- Materialized view for fast active video queue

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

-- Refresh function for cron (every 1-5 min)
CREATE OR REPLACE FUNCTION refresh_active_video_queue()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY "active_video_queue";
END;
$$ LANGUAGE plpgsql;
