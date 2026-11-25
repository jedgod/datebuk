-- Seed subscription tiers and feature flags for admin-managed subscriptions

INSERT INTO "SubscriptionTier" ("tierName", "displayName", "priceMonthly", "priceYearly", "description", "isActive")
VALUES
  ('FREE', 'Free', 0.00, NULL, 'Free access tier', true),
  ('PREMIUM', 'Premium', 14.99, NULL, 'Premium access tier', true),
  ('ELITE', 'Elite', 29.99, NULL, 'Elite access tier', true)
ON CONFLICT ("tierName") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "priceMonthly" = EXCLUDED."priceMonthly",
  "priceYearly" = EXCLUDED."priceYearly",
  "description" = EXCLUDED."description",
  "isActive" = EXCLUDED."isActive";

INSERT INTO "SubscriptionFeature" ("tierName", "featureName", "isEnabled", "displayOrder")
VALUES
  ('FREE', 'Unlimited Likes', false, 1),
  ('PREMIUM', 'Unlimited Likes', true, 1),
  ('ELITE', 'Unlimited Likes', true, 1),
  ('FREE', 'Advanced Filters', false, 2),
  ('PREMIUM', 'Advanced Filters', true, 2),
  ('ELITE', 'Advanced Filters', true, 2),
  ('FREE', 'Ad-Free Experience', false, 3),
  ('PREMIUM', 'Ad-Free Experience', true, 3),
  ('ELITE', 'Ad-Free Experience', true, 3),
  ('FREE', 'Profile Boost', false, 4),
  ('PREMIUM', 'Profile Boost', true, 4),
  ('ELITE', 'Profile Boost', true, 4)
ON CONFLICT ("tierName", "featureName") DO UPDATE SET
  "isEnabled" = EXCLUDED."isEnabled",
  "displayOrder" = EXCLUDED."displayOrder";
