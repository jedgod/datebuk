-- Admin dashboard views and queries

-- Moderation queue (active items)
CREATE OR REPLACE VIEW admin_moderation_queue AS
SELECT
  vmi."id" AS flag_id,
  vmi."flagReason" AS violation_type,
  vmi."riskScore" AS ai_score,
  vmi."flaggedAt" AS flagged_at,
  u."displayName" AS flagged_user,
  u."trustScore" AS trust_score,
  v."id" AS video_id,
  v."aiScores" AS session_scores,
  vmi."matchDetails" AS report_details,
  CASE
    WHEN vmi."riskScore" > 80 THEN 'high'
    WHEN vmi."riskScore" > 50 THEN 'medium'
    ELSE 'low'
  END AS priority
FROM "VideoModerationItem" vmi
LEFT JOIN "User" u ON vmi."userId" = u."id"
LEFT JOIN "Video" v ON vmi."videoId" = v."id"
WHERE vmi."status" IN ('pending', 'in_review', 'quarantined')
ORDER BY vmi."riskScore" DESC, vmi."flaggedAt" DESC;

-- Admin stats dashboard (example query)
-- Use as a template for reporting
-- SELECT
--   COUNT(*) FILTER (WHERE "status" = 'quarantined') AS quarantined_today,
--   AVG(("aiScores"->>'overall')::numeric) AS avg_risk_score,
--   COUNT(DISTINCT "reviewedBy") AS active_moderators,
--   COUNT(*) AS total_reviews
-- FROM "VideoModerationItem"
-- WHERE "flaggedAt" >= CURRENT_DATE;

-- User trends (for charts)
CREATE OR REPLACE VIEW admin_user_trends AS
SELECT
  DATE_TRUNC('day', "createdAt") AS day,
  COUNT(*) AS new_users,
  AVG("trustScore") AS avg_trust,
  SUM(CASE WHEN "datingIntent" = 'FAITH'::"DatingIntentEnum" THEN 1 ELSE 0 END) AS faith_intent,
  SUM(CASE WHEN "datingIntent" = 'CASUAL'::"DatingIntentEnum" THEN 1 ELSE 0 END) AS casual_intent,
  SUM(CASE WHEN "datingIntent" = 'PROFESSIONAL'::"DatingIntentEnum" THEN 1 ELSE 0 END) AS professional_intent
FROM "User"
GROUP BY day
ORDER BY day DESC;

-- High-risk users (example query)
-- SELECT
--   "displayName",
--   "trustScore",
--   "recentFlagsCount",
--   COUNT(fe."id") AS flags_last_7_days
-- FROM "User" u
-- LEFT JOIN "FraudEvent" fe
--   ON u."id" = fe."userId" AND fe."createdAt" >= NOW() - INTERVAL '7 days'
-- WHERE u."trustLevel" IN ('LOW'::"TrustLevelEnum", 'NEW'::"TrustLevelEnum")
-- GROUP BY u."id"
-- HAVING COUNT(fe."id") > 2
-- ORDER BY "recentFlagsCount" DESC;
