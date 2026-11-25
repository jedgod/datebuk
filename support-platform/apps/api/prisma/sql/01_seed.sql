-- Seed data for dating site demo
-- Uses existing schema in apps/api/prisma/schema.prisma

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clear existing data for a clean seed
TRUNCATE TABLE
  "VideoModerationItem",
  "ModeratorQueue",
  "FraudEvent",
  "Message",
  "Match",
  "Video",
  "User"
CASCADE;

-- Seed Users (10 demo users)
INSERT INTO "User" (
  "email",
  "password",
  "displayName",
  "gender",
  "genderPreference",
  "datingIntent",
  "age",
  "locationCity",
  "locationState",
  "locationCountry",
  "bio",
  "interests",
  "photos",
  "trustScore",
  "trustLevel",
  "visibility",
  "verifiedEmail",
  "verifiedVideo",
  "videoApproved",
  "emailVerified",
  "deviceFingerprints",
  "trustedDevices",
  "recentFlagsCount",
  "role",
  "isAdmin"
) VALUES
  (
    'emma@example.com',
    'pass123',
    'Emma J',
    'FEMALE'::"GenderEnum",
    'MEN'::"GenderPreferenceEnum",
    'CASUAL'::"DatingIntentEnum",
    28,
    'Miami',
    'FL',
    'US',
    'Adventure seeker looking for fun dates',
    ARRAY['hiking', 'beach']::text[],
    ARRAY['https://example.com/photo1.jpg']::text[],
    85,
    'HIGH'::"TrustLevelEnum",
    'BOOSTED'::"ProfileVisibilityEnum",
    true,
    true,
    true,
    true,
    ARRAY[]::text[],
    ARRAY[]::text[],
    0,
    'USER'::"UserRole",
    false
  ),
  (
    'liam@example.com',
    'pass123',
    'Liam S',
    'MALE'::"GenderEnum",
    'WOMEN'::"GenderPreferenceEnum",
    'FAITH'::"DatingIntentEnum",
    30,
    'Austin',
    'TX',
    'US',
    'Faith-driven, seeking meaningful connections',
    ARRAY['church', 'volunteering']::text[],
    ARRAY['https://example.com/photo2.jpg']::text[],
    65,
    'MEDIUM'::"TrustLevelEnum",
    'NORMAL'::"ProfileVisibilityEnum",
    true,
    false,
    false,
    true,
    ARRAY[]::text[],
    ARRAY[]::text[],
    1,
    'USER'::"UserRole",
    false
  ),
  (
    'sofia@example.com',
    'pass123',
    'Sofia R',
    'FEMALE'::"GenderEnum",
    'EVERYONE'::"GenderPreferenceEnum",
    'PROFESSIONAL'::"DatingIntentEnum",
    25,
    'New York',
    'NY',
    'US',
    'Networking and professional growth',
    ARRAY['business', 'tech']::text[],
    ARRAY['https://example.com/photo3.jpg']::text[],
    45,
    'LOW'::"TrustLevelEnum",
    'LOW'::"ProfileVisibilityEnum",
    false,
    true,
    true,
    false,
    ARRAY[]::text[],
    ARRAY[]::text[],
    2,
    'USER'::"UserRole",
    false
  ),
  (
    'noah@example.com',
    'pass123',
    'Noah T',
    'MALE'::"GenderEnum",
    'WOMEN'::"GenderPreferenceEnum",
    'CASUAL'::"DatingIntentEnum",
    31,
    'Denver',
    'CO',
    'US',
    'Outdoor enthusiast',
    ARRAY['skiing', 'hiking']::text[],
    ARRAY['https://example.com/photo4.jpg']::text[],
    95,
    'HIGH'::"TrustLevelEnum",
    'BOOSTED'::"ProfileVisibilityEnum",
    true,
    true,
    true,
    true,
    ARRAY[]::text[],
    ARRAY[]::text[],
    0,
    'USER'::"UserRole",
    false
  ),
  (
    'isabella@example.com',
    'pass123',
    'Isabella M',
    'FEMALE'::"GenderEnum",
    'MEN'::"GenderPreferenceEnum",
    'FAITH'::"DatingIntentEnum",
    26,
    'Los Angeles',
    'CA',
    'US',
    'Family-oriented',
    ARRAY['cooking', 'reading']::text[],
    ARRAY['https://example.com/photo5.jpg']::text[],
    75,
    'MEDIUM'::"TrustLevelEnum",
    'NORMAL'::"ProfileVisibilityEnum",
    true,
    false,
    false,
    true,
    ARRAY[]::text[],
    ARRAY[]::text[],
    0,
    'USER'::"UserRole",
    false
  ),
  (
    'ethan@example.com',
    'pass123',
    'Ethan K',
    'MALE'::"GenderEnum",
    'WOMEN'::"GenderPreferenceEnum",
    'PROFESSIONAL'::"DatingIntentEnum",
    28,
    'Chicago',
    'IL',
    'US',
    'Career-focused',
    ARRAY['networking', 'books']::text[],
    ARRAY['https://example.com/photo6.jpg']::text[],
    30,
    'LOW'::"TrustLevelEnum",
    'HIDDEN'::"ProfileVisibilityEnum",
    false,
    false,
    false,
    false,
    ARRAY[]::text[],
    ARRAY[]::text[],
    3,
    'USER'::"UserRole",
    false
  ),
  (
    'mia@example.com',
    'pass123',
    'Mia L',
    'FEMALE'::"GenderEnum",
    'MEN'::"GenderPreferenceEnum",
    'CASUAL'::"DatingIntentEnum",
    24,
    'Seattle',
    'WA',
    'US',
    'Fun-loving traveler',
    ARRAY['travel', 'music']::text[],
    ARRAY['https://example.com/photo7.jpg']::text[],
    90,
    'HIGH'::"TrustLevelEnum",
    'BOOSTED'::"ProfileVisibilityEnum",
    true,
    true,
    true,
    true,
    ARRAY[]::text[],
    ARRAY[]::text[],
    0,
    'USER'::"UserRole",
    false
  ),
  (
    'james@example.com',
    'pass123',
    'James P',
    'MALE'::"GenderEnum",
    'WOMEN'::"GenderPreferenceEnum",
    'FAITH'::"DatingIntentEnum",
    30,
    'Boston',
    'MA',
    'US',
    'Community builder',
    ARRAY['volunteering', 'sports']::text[],
    ARRAY['https://example.com/photo8.jpg']::text[],
    55,
    'MEDIUM'::"TrustLevelEnum",
    'NORMAL'::"ProfileVisibilityEnum",
    true,
    true,
    false,
    true,
    ARRAY[]::text[],
    ARRAY[]::text[],
    1,
    'USER'::"UserRole",
    false
  ),
  (
    'olivia@example.com',
    'pass123',
    'Olivia G',
    'FEMALE'::"GenderEnum",
    'EVERYONE'::"GenderPreferenceEnum",
    'CASUAL'::"DatingIntentEnum",
    27,
    'San Francisco',
    'CA',
    'US',
    'Art lover',
    ARRAY['painting', 'museums']::text[],
    ARRAY['https://example.com/photo9.jpg']::text[],
    20,
    'NEW'::"TrustLevelEnum",
    'LOW'::"ProfileVisibilityEnum",
    false,
    false,
    false,
    false,
    ARRAY[]::text[],
    ARRAY[]::text[],
    4,
    'USER'::"UserRole",
    false
  ),
  (
    'benjamin@example.com',
    'pass123',
    'Benjamin H',
    'MALE'::"GenderEnum",
    'WOMEN'::"GenderPreferenceEnum",
    'PROFESSIONAL'::"DatingIntentEnum",
    29,
    'Atlanta',
    'GA',
    'US',
    'Entrepreneur',
    ARRAY['business', 'innovation']::text[],
    ARRAY['https://example.com/photo10.jpg']::text[],
    80,
    'HIGH'::"TrustLevelEnum",
    'BOOSTED'::"ProfileVisibilityEnum",
    true,
    true,
    true,
    true,
    ARRAY[]::text[],
    ARRAY[]::text[],
    0,
    'USER'::"UserRole",
    false
  );

-- Seed Admin Users (2 demos)
INSERT INTO "User" (
  "email",
  "password",
  "displayName",
  "role",
  "isAdmin",
  "emailVerified",
  "deviceFingerprints",
  "trustedDevices"
) VALUES
  (
    'admin@example.com',
    'adminpass',
    'Admin One',
    'SUPERADMIN'::"UserRole",
    true,
    true,
    ARRAY[]::text[],
    ARRAY[]::text[]
  ),
  (
    'mod@example.com',
    'modpass',
    'Mod Two',
    'SUPPORT'::"UserRole",
    true,
    true,
    ARRAY[]::text[],
    ARRAY[]::text[]
  );

-- Seed Matches (5 demos)
INSERT INTO "Match" ("id", "user1Id", "user2Id", "createdAt") VALUES
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Liam S'),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Emma J'),
    NOW() - INTERVAL '1 day'
  ),
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Noah T'),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Sofia R'),
    NOW() - INTERVAL '2 hours'
  ),
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Ethan K'),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Isabella M'),
    NOW() - INTERVAL '3 days'
  ),
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'James P'),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Mia L'),
    NOW() - INTERVAL '4 hours'
  ),
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Benjamin H'),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Olivia G'),
    NOW() - INTERVAL '5 minutes'
  );

-- Seed Messages (two per match)
INSERT INTO "Message" ("id", "matchId", "senderId", "content", "createdAt")
SELECT
  gen_random_uuid(),
  m."id",
  m."user1Id",
  'Hey, how are you?',
  NOW() - INTERVAL '10 minutes'
FROM "Match" m;

INSERT INTO "Message" ("id", "matchId", "senderId", "content", "createdAt")
SELECT
  gen_random_uuid(),
  m."id",
  m."user2Id",
  'Good, you?',
  NOW() - INTERVAL '8 minutes'
FROM "Match" m;

-- Seed Videos (3 demos) as stand-in for video sessions
INSERT INTO "Video" (
  "id",
  "userId",
  "filename",
  "url",
  "durationSec",
  "aiScores",
  "status",
  "uploadedAt"
) VALUES
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Emma J'),
    'session_emma_1.mp4',
    'https://example.com/video1.mp4',
    300,
    '{"nudity": 0.1, "explicitAudio": 0.05, "overall": 0.07}'::jsonb,
    'APPROVED',
    NOW() - INTERVAL '2 days'
  ),
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Sofia R'),
    'session_sofia_1.mp4',
    'https://example.com/video2.mp4',
    120,
    '{"nudity": 0.6, "explicitAudio": 0.4, "overall": 0.55}'::jsonb,
    'QUARANTINED',
    NOW() - INTERVAL '1 day'
  ),
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Noah T'),
    'session_noah_1.mp4',
    'https://example.com/video3.mp4',
    45,
    '{"nudity": 0.8, "explicitAudio": 0.7, "overall": 0.75}'::jsonb,
    'INTERRUPTED',
    NOW() - INTERVAL '5 hours'
  );

-- Seed Video Moderation Items (as flags/reports)
INSERT INTO "VideoModerationItem" (
  "id",
  "userId",
  "videoId",
  "status",
  "severity",
  "riskScore",
  "riskLevel",
  "flagReason",
  "reportCount",
  "isLive",
  "userIntent",
  "userTrustLevel",
  "aiScores",
  "keyframes",
  "audioWaveform",
  "violationTimestamps",
  "recentMessages",
  "matchDetails",
  "flaggedAt"
) VALUES
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Liam S'),
    (SELECT "id" FROM "Video" WHERE "filename" = 'session_sofia_1.mp4'),
    'quarantined',
    'high',
    85,
    'high',
    'nudity',
    1,
    false,
    'faith',
    'medium',
    '{"overall": 0.55}'::jsonb,
    ARRAY['kf1.jpg', 'kf2.jpg']::text[],
    ARRAY[1, 2, 3, 2, 1]::int[],
    ARRAY[12, 28]::int[],
    '{"lastMessage": "Inappropriate comments"}'::jsonb,
    '{"match": "Liam S - Sofia R"}'::jsonb,
    NOW() - INTERVAL '6 hours'
  ),
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Noah T'),
    (SELECT "id" FROM "Video" WHERE "filename" = 'session_noah_1.mp4'),
    'interrupted',
    'high',
    92,
    'high',
    'explicit_audio',
    2,
    false,
    'casual',
    'high',
    '{"overall": 0.75}'::jsonb,
    ARRAY['kf3.jpg', 'kf4.jpg']::text[],
    ARRAY[2, 3, 4, 3, 2]::int[],
    ARRAY[5, 18, 33]::int[],
    '{"lastMessage": "Explicit content"}'::jsonb,
    '{"match": "Noah T - Sofia R"}'::jsonb,
    NOW() - INTERVAL '2 hours'
  );

-- Seed Fraud Events (as reports)
INSERT INTO "FraudEvent" (
  "id",
  "userId",
  "eventType",
  "riskScore",
  "riskLevel",
  "details",
  "resolved",
  "createdAt"
) VALUES
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Emma J'),
    'video_report',
    70,
    'high',
    '{"reason": "harassment", "details": "Inappropriate comments"}'::jsonb,
    false,
    NOW() - INTERVAL '3 hours'
  ),
  (
    gen_random_uuid(),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Sofia R'),
    'video_report',
    85,
    'high',
    '{"reason": "nudity", "details": "Explicit content"}'::jsonb,
    false,
    NOW() - INTERVAL '1 hour'
  );

-- Seed Moderator Queue (moderation logs)
INSERT INTO "ModeratorQueue" (
  "id",
  "fraudEventId",
  "reason",
  "status",
  "priority",
  "createdAt"
) VALUES
  (
    gen_random_uuid(),
    (SELECT "id" FROM "FraudEvent" WHERE "details"->>'reason' = 'harassment' LIMIT 1),
    'High risk harassment report',
    'pending',
    2,
    NOW() - INTERVAL '2 hours'
  ),
  (
    gen_random_uuid(),
    (SELECT "id" FROM "FraudEvent" WHERE "details"->>'reason' = 'nudity' LIMIT 1),
    'High risk nudity report',
    'pending',
    3,
    NOW() - INTERVAL '1 hour'
  );

-- Seed Audit Logs (admin actions)
INSERT INTO "AuditLog" (
  "id",
  "action",
  "actorUserId",
  "targetUserId",
  "metadata",
  "createdAt"
) VALUES
  (
    gen_random_uuid(),
    'quarantined',
    (SELECT "id" FROM "User" WHERE "email" = 'admin@example.com'),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Liam S'),
    '{"reason": "High nudity score"}'::jsonb,
    NOW() - INTERVAL '50 minutes'
  ),
  (
    gen_random_uuid(),
    'interrupted',
    (SELECT "id" FROM "User" WHERE "email" = 'admin@example.com'),
    (SELECT "id" FROM "User" WHERE "displayName" = 'Noah T'),
    '{"reason": "User report"}'::jsonb,
    NOW() - INTERVAL '30 minutes'
  );
