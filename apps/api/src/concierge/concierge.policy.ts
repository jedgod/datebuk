export type ConciergeModerationDecision = {
  allowed: boolean;
  decision: "ALLOW" | "REVIEW" | "REJECT";
  matchedRules: string[];
};

const rules: Array<{ key: string; pattern: RegExp; decision: "REVIEW" | "REJECT" }> = [
  { key: "OFF_PLATFORM_PHONE", pattern: /(?:\+?\d[\d\s().-]{7,}\d)/i, decision: "REJECT" },
  { key: "OFF_PLATFORM_EMAIL", pattern: /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i, decision: "REJECT" },
  { key: "OFF_PLATFORM_SOCIAL", pattern: /\b(?:instagram|snapchat|telegram|whatsapp|signal|kik)\b/i, decision: "REJECT" },
  { key: "COERCION", pattern: /\b(?:make|force|pressure)\s+(?:him|her|them)\b|\bowes? me (?:a )?(?:reply|response|answer)\b/i, decision: "REJECT" },
  { key: "THREAT", pattern: /\b(?:hurt|harm|threaten|find where .* lives?)\b/i, decision: "REJECT" },
  { key: "PAYMENT_OFFER", pattern: /\b(?:pay|cash|venmo|cashapp)\b.*\b(?:reply|date|meet)\b/i, decision: "REJECT" },
  { key: "EMOTIONAL_REVIEW", pattern: /\b(?:ignored|angry|furious|desperate)\b/i, decision: "REVIEW" },
];

export function moderateConciergeText(text: string): ConciergeModerationDecision {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  const matched = rules.filter((rule) => rule.pattern.test(normalized));
  const matchedRules = matched.map((rule) => rule.key);
  const rejected = matched.some((rule) => rule.decision === "REJECT");
  const review = matched.some((rule) => rule.decision === "REVIEW");
  return {
    allowed: !rejected,
    decision: rejected ? "REJECT" : review ? "REVIEW" : "ALLOW",
    matchedRules,
  };
}
