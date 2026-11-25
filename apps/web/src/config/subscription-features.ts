export type Plan = "FREE" | "PREMIUM" | "ELITE";

export interface Feature {
  key: string;
  label: string;
  plans: Plan[];
  adminEnabled: boolean;
}

export const SUBSCRIPTION_FEATURES: Feature[] = [
  {
    key: "profile",
    label: "Create and manage a profile",
    plans: ["FREE", "PREMIUM", "ELITE"],
    adminEnabled: true,
  },
  {
    key: "browse",
    label: "Browse, match, and save favorites",
    plans: ["FREE", "PREMIUM", "ELITE"],
    adminEnabled: true,
  },
  {
    key: "likes",
    label: "Unlimited likes (Free includes 10/day)",
    plans: ["PREMIUM", "ELITE"],
    adminEnabled: true,
  },
  {
    key: "filters",
    label: "Advanced Filters",
    plans: ["PREMIUM", "ELITE"],
    adminEnabled: true,
  },
  {
    key: "ads",
    label: "Ad-Free Experience",
    plans: ["PREMIUM", "ELITE"],
    adminEnabled: true,
  },
  {
    key: "see-likes",
    label: "See who liked you",
    plans: ["PREMIUM", "ELITE"],
    adminEnabled: true,
  },
  {
    key: "chat",
    label: "Secure chat",
    plans: ["PREMIUM", "ELITE"],
    adminEnabled: true,
  },
  {
    key: "voice",
    label: "Voice calling",
    plans: ["PREMIUM", "ELITE"],
    adminEnabled: true,
  },
  {
    key: "date-planner",
    label: "Date planner and scheduling",
    plans: ["PREMIUM", "ELITE"],
    adminEnabled: true,
  },
  {
    key: "boost",
    label: "Profile boost",
    plans: ["PREMIUM", "ELITE"],
    adminEnabled: true,
  },
  {
    key: "video",
    label: "Video calling",
    plans: ["ELITE"],
    adminEnabled: true,
  },
  {
    key: "in-call",
    label: "Advanced in-call tools and location sharing",
    plans: ["ELITE"],
    adminEnabled: true,
  },
  {
    key: "priority-visibility",
    label: "Priority profile visibility",
    plans: ["ELITE"],
    adminEnabled: true,
  },
];
