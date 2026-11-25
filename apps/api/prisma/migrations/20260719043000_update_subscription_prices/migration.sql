UPDATE "SubscriptionTier"
SET "priceMonthly" = 14.99,
    "displayName" = 'Premium',
    "description" = 'Premium access tier'
WHERE "tierName" = 'PREMIUM';

UPDATE "SubscriptionTier"
SET "priceMonthly" = 29.99,
    "displayName" = 'Elite',
    "description" = 'Elite access tier'
WHERE "tierName" = 'ELITE';
