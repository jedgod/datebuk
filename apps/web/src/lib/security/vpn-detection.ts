/**
 * Enforcement policy for a network-risk score (0-100) computed elsewhere from real
 * IP intelligence — see lib/server/network-policy.ts, which sources the score from
 * apps/api's canonical IpIntelligenceService rather than duplicating VPN/proxy
 * detection here.
 */
export function getEnforcementAction(riskScore: number): {
  action: "allow" | "warn" | "restrict" | "block";
  message: string;
  restrictions: string[];
} {
  if (riskScore >= 80) {
    return {
      action: "block",
      message: "Suspicious activity detected. Please contact support.",
      restrictions: ["video_calls_blocked", "location_share_blocked", "local_search_disabled"],
    };
  }

  if (riskScore >= 60) {
    return {
      action: "restrict",
      message: "VPN detected. Some features are restricted for security.",
      restrictions: ["location_share_disabled", "local_search_limited"],
    };
  }

  if (riskScore >= 40) {
    return {
      action: "warn",
      message: "Location verification recommended for full features.",
      restrictions: [],
    };
  }

  return {
    action: "allow",
    message: "Location verified",
    restrictions: [],
  };
}
