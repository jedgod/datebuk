/**
 * Risk Assessment Utilities (Shared)
 * Mobile and Web use the same risk definitions
 */

export interface RiskAssessmentResponse {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresChallenge: boolean;
  requiresSMS: boolean;
  message?: string;
}

export const RISK_THRESHOLDS = {
  BLOCK: 80,
  SMS_CHALLENGE: 40,
  LOW: 0,
};

export const RISK_LEVELS = {
  LOW: { threshold: 20, level: 'low' as const, icon: '🟢' },
  MEDIUM: { threshold: 40, level: 'medium' as const, icon: '🟡' },
  HIGH: { threshold: 60, level: 'high' as const, icon: '🟠' },
  CRITICAL: { threshold: 80, level: 'critical' as const, icon: '🔴' },
};

/**
 * Determine risk level from score
 */
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= RISK_LEVELS.CRITICAL.threshold) return 'critical';
  if (score >= RISK_LEVELS.HIGH.threshold) return 'high';
  if (score >= RISK_LEVELS.MEDIUM.threshold) return 'medium';
  return 'low';
}

/**
 * Check if risk assessment requires a security challenge
 */
export function requiresSecurityChallenge(riskScore: number): boolean {
  return riskScore >= RISK_THRESHOLDS.SMS_CHALLENGE;
}

/**
 * Check if risk is too high and should block
 */
export function shouldBlock(riskScore: number): boolean {
  return riskScore >= RISK_THRESHOLDS.BLOCK;
}

/**
 * Get risk level icon
 */
export function getRiskIcon(score: number): string {
  const level = getRiskLevel(score);
  return RISK_LEVELS[level.toUpperCase() as keyof typeof RISK_LEVELS]?.icon || '❓';
}

/**
 * Get risk level description
 */
export function getRiskDescription(score: number): string {
  if (score >= 80)
    return 'Critical: Your account may have been compromised. Please verify immediately.';
  if (score >= 60) return 'High: Unusual activity detected. SMS verification required.';
  if (score >= 40) return 'Medium: Additional verification needed to proceed.';
  return 'Low: Your connection appears safe.';
}
