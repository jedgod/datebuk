export const APP_NAME = "DatePage";

// Single source of truth for the subscription tier display strings shown
// across the web app (landing page pricing section, subscription page,
// checkout page) — previously each of those had its own independently
// hardcoded copy of "$14.99 / month" / "$29.99 / month", risking drift if
// only one copy got updated. The actual dollar amount CHARGED is still
// controlled by the Stripe Price object behind
// NEXT_PUBLIC_STRIPE_PRICE_PREMIUM/ELITE — these are display labels only,
// so keep them in sync with the DB's SubscriptionTier.priceMonthly (see
// apps/api/prisma/prisma/sql/09_subscription_features_seed.sql) and the
// actual Stripe Price whenever pricing changes.
//
// apps/mobile can't import this directly (separate package manager/bundler
// boundary — see EXPO_PUBLIC_STRIPE_PRICE_PREMIUM/ELITE in apps/mobile/.env
// instead), so its SubscriptionScreen keeps its own copy of these same two
// values; update both places together.
export const SUBSCRIPTION_TIER_PRICING = {
  PREMIUM: { displayPrice: "$14.99 / month", priceMonthly: 14.99 },
  ELITE: { displayPrice: "$29.99 / month", priceMonthly: 29.99 },
} as const;
