/**
 * Risk Assessment Client
 * Collects client-side risk signals and sends them to backend
 */

export interface RiskSignals {
  deviceId: string;
  userAgent: string;
  timezone: string;
  screenResolution: string;
  timestamp: number;
  suspiciousActivity?: boolean;
  previousFailedAttempts?: number;
}

export interface RiskAssessmentResponse {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresChallenge: boolean;
  requiresSMS: boolean;
  message?: string;
}

const RISK_THRESHOLDS = {
  BLOCK: 80,
  SMS_CHALLENGE: 40,
  LOW: 0,
};

export const RISK_LEVELS = {
  LOW: { threshold: 20, level: 'low' as const },
  MEDIUM: { threshold: 40, level: 'medium' as const },
  HIGH: { threshold: 60, level: 'high' as const },
  CRITICAL: { threshold: 80, level: 'critical' as const },
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
 * Local risk calculation (before sending to backend)
 * This is a basic implementation; full ML happens on backend
 */
export function calculateLocalRiskScore(signals: Partial<RiskSignals>): number {
  let score = 0;

  // Check for suspicious activity
  if (signals.suspiciousActivity) {
    score += 30;
  }

  // Check for previous failed attempts
  if (signals.previousFailedAttempts && signals.previousFailedAttempts > 2) {
    score += Math.min(signals.previousFailedAttempts * 10, 30);
  }

  return Math.min(score, 100);
}
