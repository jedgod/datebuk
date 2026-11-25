/**
 * Subscription feature access policy, ported from the DSACS reference pack
 * (datebuk-dsacs-v3-v7/src/policy.js). Pure data + functions: no I/O.
 *
 * The plan is NOT decided here. It comes from SubscriptionsService.getAccessTier (which
 * already honours active/trialing status and expiry) so there is one authority for "what
 * does this user pay for"; this file only answers "what does that plan allow".
 */

export const PLANS = ["free", "premium", "elite"] as const;
export type Plan = (typeof PLANS)[number];

/** Monthly list prices in cents (Free $0, Premium $14.99, Elite $29.99). */
export const PRICES_CENTS: Record<Plan, number> = { free: 0, premium: 1499, elite: 2999 };

/**
 * [free, premium, elite]. -1 = unlimited / boolean grant, 0 = denied,
 * positive = daily quota (UTC day).
 */
export const LIMITS: Record<string, [number, number, number]> = {
  "profile.create": [-1, -1, -1],
  "profile.edit": [-1, -1, -1],
  "match.browse": [-1, -1, -1],
  "match.likes": [10, -1, -1],
  "match.see_likes": [0, -1, -1],
  "match.advanced": [0, -1, -1],
  "match.insights": [0, 5, 30],
  "match.concierge": [0, 0, -1],
  "match.compatibility": [3, 20, 100],
  "match.undo": [0, 5, 30],
  "match.save": [10, -1, -1],
  "match.intent.casual": [-1, -1, -1],
  "match.intent.faith": [-1, -1, -1],
  "match.intent.intentional": [-1, -1, -1],
  "match.intent.professional": [-1, -1, -1],
  // NOTE: the DSACS pack grants chat.send to Free ([-1,-1,-1]); DateBuk's live rule (and the
  // "Messaging is locked" UI) is Premium+, so this keeps the shipped product behaviour.
  "chat.send": [0, -1, -1],
  "chat.attach": [5, 30, 100],
  "chat.voice_note": [5, 30, 100],
  "chat.read_receipts": [0, -1, -1],
  "voice.start": [0, -1, -1],
  "video.start": [0, 0, -1],
  "video.schedule": [0, 0, -1],
  "video.extend": [0, 0, -1],
  "video.background": [0, 0, -1],
  "video.icebreaker": [-1, -1, -1],
  "ai.icebreaker": [0, 10, 50],
  "video.followup": [0, 10, 30],
  "ai.reflection": [0, 5, 20],
  "date.feedback": [-1, -1, -1],
  "date.readiness": [0, 3, 10],
  "profile.boost": [0, 1, 3],
  "profile.priority": [0, 0, -1],
  "ads.hide": [0, -1, -1],
  "location.share": [0, 0, -1],
  "events.browse": [-1, -1, -1],
  "events.rsvp": [-1, -1, -1],
  "match.travel_mode": [0, 0, -1],
  "ai.profile": [0, 3, 10],
  "ai.reply": [0, 10, 50],
  "profile.incognito": [0, -1, -1],
  "privacy.online_status": [-1, -1, -1],
  "ai.relationship": [0, 10, 50],
  "events.speed": [0, -1, -1],
  "events.private": [0, 0, -1],
  "voice.schedule": [0, -1, -1],
  "video.activities": [0, 0, -1],
  "match.second_chance": [0, 5, 30],
};

/** Safety, privacy and account-control actions are available on every plan, always. */
export const SAFETY_FEATURES: readonly string[] = [
  "safety.report",
  "safety.block",
  "safety.exit",
  "safety.appeal",
  "privacy.settings",
  "privacy.revoke",
  "account.cancel",
  "account.delete",
  "account.export",
  "identity.verify",
];

export type DenyReason =
  | "ACCOUNT_SUSPENDED"
  | "FEATURE_DISABLED"
  | "UPGRADE_REQUIRED"
  | "USER_BLOCKED"
  | "MATCH_REQUIRED"
  | "CONSENT_REQUIRED"
  | "QUOTA_EXHAUSTED";
export type Decision = "ACCESS_GRANTED" | DenyReason;

export function isKnownFeature(feature: string): boolean {
  return SAFETY_FEATURES.includes(feature) || Object.prototype.hasOwnProperty.call(LIMITS, feature);
}

/** Daily quota / grant for a feature on a plan. Unknown features are denied (0). */
export function limitFor(plan: Plan, feature: string): number {
  if (SAFETY_FEATURES.includes(feature)) return -1;
  if (!Object.prototype.hasOwnProperty.call(LIMITS, feature)) return 0;
  return LIMITS[feature][PLANS.indexOf(plan)] ?? 0;
}

export interface DecideInput {
  plan: Plan;
  feature: string;
  suspended?: boolean;
  disabled?: boolean;
  /** Trusted, server-derived relationship context. Never take these from the client. */
  matched?: boolean;
  blocked?: boolean;
  consent?: boolean;
}

// Features that act on another member: they need a match, no block, and (for voice/video/
// location) that member's consent, in addition to the plan.
const NEEDS_MATCH = /^(voice\.|video\.(start|schedule|extend)|location\.|chat\.)/;
const NEEDS_CONSENT = /^(voice\.|video\.|location\.)/;

export function decide(i: DecideInput): Decision {
  if (SAFETY_FEATURES.includes(i.feature)) return "ACCESS_GRANTED";
  if (i.suspended) return "ACCOUNT_SUSPENDED";
  if (i.disabled) return "FEATURE_DISABLED";
  if (!limitFor(i.plan, i.feature)) return "UPGRADE_REQUIRED";
  if (NEEDS_MATCH.test(i.feature)) {
    if (i.blocked) return "USER_BLOCKED";
    if (!i.matched) return "MATCH_REQUIRED";
    if (NEEDS_CONSENT.test(i.feature) && !i.consent) return "CONSENT_REQUIRED";
  }
  return "ACCESS_GRANTED";
}

export function toPlan(tier: string): Plan {
  const t = tier.toLowerCase();
  return t === "elite" ? "elite" : t === "premium" ? "premium" : "free";
}

/** Human-facing message for a denial (used in 403 bodies). */
export function denialMessage(reason: DenyReason, feature: string): string {
  switch (reason) {
    case "UPGRADE_REQUIRED":
      return `${feature} isn't included in your plan. Upgrade to unlock it.`;
    case "QUOTA_EXHAUSTED":
      return `You've reached today's limit for ${feature}. It resets at midnight UTC.`;
    case "ACCOUNT_SUSPENDED":
      return "Your account is suspended.";
    case "FEATURE_DISABLED":
      return "This feature is temporarily unavailable.";
    case "USER_BLOCKED":
      return "You can't do this with this member.";
    case "MATCH_REQUIRED":
      return "You need to match with this member first.";
    case "CONSENT_REQUIRED":
      return "This member hasn't consented to this yet.";
  }
}
