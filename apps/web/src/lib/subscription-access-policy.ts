export type AccessTier = "FREE" | "PREMIUM" | "ELITE";
export type AccessCapability = "CHAT" | "VOICE" | "VIDEO" | "INCALL";

export const TIER_RANK: Record<AccessTier, number> = {
  FREE: 0,
  PREMIUM: 1,
  ELITE: 2,
};

export function normalizeTier(value: unknown): AccessTier {
  if (typeof value !== "string") return "FREE";
  const upper = value.toUpperCase();

  // Exact match: FREE/PREMIUM/ELITE is the single canonical tier taxonomy
  // shared by the DB enum and the Stripe-linked tier table (legacy values
  // VIP/PREMIUM_BASIC/PREMIUM_PLUS no longer exist anywhere).
  if (upper === "ELITE") return "ELITE";
  if (upper === "PREMIUM") return "PREMIUM";
  return "FREE";
}

export function hasCapability(
  tier: AccessTier,
  capability: AccessCapability,
): boolean {
  if (capability === "CHAT" || capability === "VOICE") {
    return TIER_RANK[tier] >= TIER_RANK.PREMIUM;
  }
  if (capability === "VIDEO" || capability === "INCALL") {
    return tier === "ELITE";
  }
  return false;
}

export function deniedMessage(capability: AccessCapability): string {
  if (capability === "CHAT") return "Chat requires Premium or Elite";
  if (capability === "VOICE") return "Voice calling requires Premium or Elite";
  if (capability === "VIDEO") return "Video calling requires Elite";
  return "Advanced in-call features require Elite";
}
