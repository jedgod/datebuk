export const PLAN_CATALOG = {
  FREE: {
    name: "Free",
    priceMonthly: 0,
    features: ["profile", "browse", "likes:10/day"],
  },
  PREMIUM: {
    name: "Premium",
    priceMonthly: 14.99,
    features: ["profile", "browse", "likes:unlimited", "see-likes", "advanced-filters", "chat", "voice", "no-ads"],
  },
  ELITE: {
    name: "Elite",
    priceMonthly: 29.99,
    features: ["profile", "browse", "likes:unlimited", "see-likes", "advanced-filters", "chat", "voice", "video", "incall", "location-sharing", "no-ads", "priority-visibility"],
  },
} as const;

export type PlanName = keyof typeof PLAN_CATALOG;
