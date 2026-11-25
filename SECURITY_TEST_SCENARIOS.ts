/**
 * Advanced Security Features - Test Scenarios
 * 
 * These scenarios demonstrate how the security features work
 * in realistic attack and normal use situations
 */

// ============================================================================
// SCENARIO 1: Normal Login (Low Risk)
// ============================================================================
export const SCENARIO_1_NORMAL_LOGIN = {
  name: 'User logs in from home (normal)',
  context: {
    userId: 'user-001',
    email: 'john@example.com',
    ip: '203.0.113.45',  // US ISP
    deviceId: 'device-abc123',
    country: 'US',
    previousLogins: 247,  // Many previous logins
  },
  riskFactors: {
    ipReputation: 8,        // Low threat (0-100)
    deviceTrust: 95,        // Trusted device
    mlScore: 0.05,          // Very low fraud score
    velocity: 0,            // No recent attempts
    accountAge: 3650,       // 10 years old
    behavior: 0,            // Normal behavior
  },
  expectedRiskScore: 15,    // (8+5+19+0+0+0) / 6 ≈ 5, but weighted = ~15
  expectedRiskLevel: 'LOW',
  expectedDecision: 'ALLOW',
  expectedAction: 'none',
  expectedResult: '✅ Login allowed immediately',
};

// ============================================================================
// SCENARIO 2: New Device Login (Medium Risk)
// ============================================================================
export const SCENARIO_2_NEW_DEVICE = {
  name: 'User logs in from new device',
  context: {
    userId: 'user-002',
    email: 'sarah@example.com',
    ip: '203.0.113.46',
    deviceId: 'device-new999',  // NEW device
    country: 'US',
    previousLogins: 156,
  },
  riskFactors: {
    ipReputation: 10,       // Same ISP, low threat
    deviceTrust: 25,        // New device, unverified
    mlScore: 0.2,           // Slightly elevated
    velocity: 1,            // One attempt today
    accountAge: 2000,       // Established account
    behavior: 5,            // Slightly suspicious pattern
  },
  expectedRiskScore: 35,    // Medium risk
  expectedRiskLevel: 'MEDIUM',
  expectedDecision: 'CHALLENGE',
  expectedAction: 'require_sms_verification',
  expectedResult: '📱 Send SMS code, verify device',
};

// ============================================================================
// SCENARIO 3: Credential Stuffing Attack (High Risk)
// ============================================================================
export const SCENARIO_3_CREDENTIAL_STUFFING = {
  name: 'Attacker trying multiple passwords from datacenter IP',
  context: {
    userId: 'user-003',  // Victim's account
    email: 'jane@example.com',
    ip: '198.51.100.1',   // AWS Datacenter (suspicious)
    deviceId: 'device-attacker',  // New device
    country: 'US',  // Spoofed
    previousLogins: 89,
  },
  riskFactors: {
    ipReputation: 75,       // Datacenter IP, high threat
    deviceTrust: 5,         // New device
    mlScore: 0.65,          // High fraud score
    velocity: 8,            // 8 attempts in 10 minutes
    accountAge: 500,        // Moderate age
    behavior: 50,           // Very suspicious
  },
  expectedRiskScore: 72,    // High risk
  expectedRiskLevel: 'HIGH',
  expectedDecision: 'SMS_REQUIRED_PLUS',
  expectedAction: 'require_sms_verification',
  expectedResult: '🔒 Send SMS, mark device suspicious',
};

// ============================================================================
// SCENARIO 4: Account Takeover Attempt (Critical)
// ============================================================================
export const SCENARIO_4_ACCOUNT_TAKEOVER = {
  name: 'Attacker from high-risk country, many failed attempts',
  context: {
    userId: 'user-004',
    email: 'bob@example.com',
    ip: '203.0.113.100',    // Known fraud IP
    deviceId: 'device-takeover',
    country: 'NG',          // Country change (high risk)
    previousLogins: 0,      // All fail
  },
  riskFactors: {
    ipReputation: 95,       // Known attack IP
    deviceTrust: 2,         // Never seen
    mlScore: 0.88,          // Critical fraud score
    velocity: 15,           // 15 attempts in 30 minutes
    accountAge: 10,         // Brand new
    behavior: 95,           // Highly suspicious
  },
  expectedRiskScore: 92,    // CRITICAL
  expectedRiskLevel: 'CRITICAL',
  expectedDecision: 'BLOCK',
  expectedAction: 'block_and_review',
  expectedResult: '❌ Block login, create moderator review, notify user',
};

// ============================================================================
// SCENARIO 5: VPN User (Medium-High Risk)
// ============================================================================
export const SCENARIO_5_VPN_USER = {
  name: 'Legitimate user using VPN',
  context: {
    userId: 'user-005',
    email: 'alex@example.com',
    ip: '198.51.100.50',    // NordVPN server
    isVpn: true,
    deviceId: 'device-laptop',
    country: 'US_VPN',
    previousLogins: 45,
  },
  riskFactors: {
    ipReputation: 35,       // VPN = elevated risk
    deviceTrust: 60,        // Known device
    mlScore: 0.35,          // Moderate score (VPN + typical patterns)
    velocity: 1,            // One today
    accountAge: 1200,       // 3+ years
    behavior: 10,           // Minor anomaly
  },
  expectedRiskScore: 42,    // High but not critical
  expectedRiskLevel: 'MEDIUM_HIGH',
  expectedDecision: 'SMS_VERIFICATION',
  expectedAction: 'require_sms_code',
  expectedResult: '📱 Send SMS, user verified, allow',
};

// ============================================================================
// SCENARIO 6: International Travel (Medium Risk)
// ============================================================================
export const SCENARIO_6_INTERNATIONAL_TRAVEL = {
  name: 'User traveling internationally',
  context: {
    userId: 'user-006',
    email: 'travel@example.com',
    ip: '203.0.113.75',     // Japan ISP
    previousCountry: 'US',
    currentCountry: 'JP',   // Significant change
    deviceId: 'device-phone',
    timeSinceLastLogin: 8,  // hours
  },
  riskFactors: {
    ipReputation: 45,       // Japan ISP, medium trust
    deviceTrust: 75,        // Mobile, trusted history
    mlScore: 0.42,          // Elevated (country change)
    velocity: 1,            // One login
    accountAge: 3000,       // Long-term user
    behavior: 30,           // Unusual pattern but explainable
  },
  expectedRiskScore: 55,    // Medium-high
  expectedRiskLevel: 'MEDIUM_HIGH',
  expectedDecision: 'SMS_CHECK',
  expectedAction: 'require_sms',
  expectedResult: '✅ SMS verification passed, account updated',
};

// ============================================================================
// SCENARIO 7: ML Model Fallback (ML Service Down)
// ============================================================================
export const SCENARIO_7_ML_FALLBACK = {
  name: 'Normal login but ML service is down',
  context: {
    userId: 'user-007',
    email: 'fallback@example.com',
    ip: '203.0.113.80',
    mlServiceStatus: 'DOWN',  // ML endpoint not responding
    deviceId: 'device-known',
  },
  riskFactors: {
    ipReputation: 12,       // Good
    deviceTrust: 90,        // Trusted
    mlScore: 'N/A',         // FALLBACK: Use rule-based
    fallbackScore: 0.15,    // Rules-based estimate
    velocity: 0,
    accountAge: 2500,
  },
  expectedRiskScore: 18,    // Uses fallback rules
  expectedRiskLevel: 'LOW',
  expectedDecision: 'ALLOW',
  expectedResult: '✅ ML fallback engaged, login allowed',
};

// ============================================================================
// SCENARIO 8: A/B Test (Shadow ML Mode)
// ============================================================================
export const SCENARIO_8_AB_TEST = {
  name: 'A/B testing new ML model (shadow mode)',
  context: {
    experimentId: 'exp_ml_v2',
    variant: 'treatment_a',  // New model test
    userId: 'user-008',
    ip: '203.0.113.85',
  },
  decisions: {
    controlModel: {
      mlScore: 0.3,
      riskScore: 32,
      decision: 'CHALLENGE',
    },
    treatmentModel: {
      mlScore: 0.25,  // Better accuracy
      riskScore: 28,
      decision: 'CHALLENGE',
    },
  },
  shadowMode: true,  // Treatment model doesn't affect decision
  expectedResult: '✅ Both models run, decision uses control, results logged for comparison',
};

// ============================================================================
// SCENARIO 9: Moderator Review (High-Risk Event)
// ============================================================================
export const SCENARIO_9_MODERATOR_REVIEW = {
  name: 'High-risk event auto-queued for human review',
  context: {
    fraudEventId: 12345,
    userId: 'user-009',
    ip: '203.0.113.90',
    riskScore: 78,          // > 70, triggers moderation
    decision: 'BLOCKED',
  },
  moderationFlow: {
    step1: 'Auto-queue created (riskScore > 70)',
    step2: 'Assigned to moderator (FIFO)',
    step3: 'Moderator reviews decision explanation',
    step4: 'Moderator provides feedback: "legitimate_false_positive"',
    step5: 'System learns (feedback logged for ML retraining)',
  },
  expectedResult: '✅ Event reviewed, feedback collected, ML improved',
};

// ============================================================================
// SCENARIO 10: IP Blacklist Management
// ============================================================================
export const SCENARIO_10_IP_BLACKLIST = {
  name: 'Managing IP blacklist after attack',
  context: {
    attackIp: '192.0.2.100',
    attackType: 'credential_stuffing',
    attemptCount: 50,
    timeWindow: '15 minutes',
  },
  actions: {
    automatic: [
      'Detect high velocity from IP',
      'Auto-block IP with 24-hour duration',
      'Log reason: "credential_stuffing"',
    ],
    manual: [
      'POST /admin/fraud/blacklist/add { ip, reason, severity }',
      'GET /admin/fraud/blacklist/check/:ip',
      'Extend blacklist duration if needed',
    ],
  },
  expectedResult: '🛡️ IP blocked, prevents future attacks from same source',
};

// ============================================================================
// EXPERIMENTAL SCENARIOS
// ============================================================================

export const SCENARIO_EXPERIMENTS = [
  {
    id: 'exp_weights_v2',
    name: 'Test new risk weights',
    control: {
      mlWeight: 0.25,
      ipWeight: 0.4,    // Higher IP weight
    },
    treatment: {
      mlWeight: 0.4,    // Higher ML weight
      ipWeight: 0.25,
    },
    metrics: {
      fraudDetectionRate: 'Compare %',
      falsePositiveRate: 'Compare %',
      userConversionRate: 'Impact on legit users',
    },
  },
  {
    id: 'exp_sms_threshold',
    name: 'Test SMS threshold change',
    control: {
      smsThreshold: 40,  // Current
    },
    treatment: {
      smsThreshold: 50,  // Higher flexibility
    },
    hypothesis: 'Lower false positives without compromising security',
  },
];

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

export function generateLoginRequest(scenario) {
  return {
    email: scenario.context.email,
    password: 'test123',
    metadata: {
      ip: scenario.context.ip,
      deviceId: scenario.context.deviceId,
      userAgent: 'Mozilla/5.0...',
      timestamp: new Date().toISOString(),
    },
  };
}

export function generateExpectedResponse(scenario) {
  return {
    decision: scenario.expectedDecision,
    riskScore: scenario.expectedRiskScore,
    riskLevel: scenario.expectedRiskLevel,
    action: scenario.expectedAction,
    requiresSMS: scenario.expectedDecision.includes('SMS'),
    blocked: scenario.expectedDecision === 'BLOCK',
  };
}

// ============================================================================
// VALIDATION HELPER
// ============================================================================

export function validateScenario(scenario, actualResponse) {
  const expected = generateExpectedResponse(scenario);
  const match = {
    decision: actualResponse.decision === expected.decision,
    riskScore: Math.abs(actualResponse.riskScore - expected.riskScore) < 5,
    riskLevel: actualResponse.riskLevel === expected.riskLevel,
  };

  return {
    passed: Object.values(match).every(v => v),
    details: match,
    scenario: scenario.name,
  };
}

// ============================================================================
// USAGE IN TESTS
// ============================================================================

/*
import { RiskEngine } from './risk.engine';
import { SCENARIO_1_NORMAL_LOGIN, validateScenario } from './SECURITY_TEST_SCENARIOS';

describe('Risk Engine - Test Scenarios', () => {
  let riskEngine: RiskEngine;

  beforeEach(() => {
    riskEngine = new RiskEngine(...);
  });

  it('should pass scenario 1: normal login', async () => {
    const response = await riskEngine.evaluateFullRisk(SCENARIO_1_NORMAL_LOGIN.riskFactors);
    const result = validateScenario(SCENARIO_1_NORMAL_LOGIN, response);
    expect(result.passed).toBe(true);
  });

  it('should pass scenario 4: account takeover (critical)', async () => {
    const response = await riskEngine.evaluateFullRisk(SCENARIO_4_ACCOUNT_TAKEOVER.riskFactors);
    const result = validateScenario(SCENARIO_4_ACCOUNT_TAKEOVER, response);
    expect(result.passed).toBe(true);
    expect(response.shouldBlock).toBe(true);
  });
});
*/

// ============================================================================
// MONITORING DASHBOARD DATA
// ============================================================================

export const DASHBOARD_METRICS = {
  realTime: {
    fraudEventsLastHour: 42,
    uniqueBlockedIps: 12,
    averageRiskScore: 38,
    fraudRate: 2.1,  // percent
  },
  moderator: {
    pendingItems: 8,
    avgReviewTime: '4 minutes',
    approvalRate: 82,    // percent
    rejectionRate: 18,
  },
  ml: {
    modelAccuracy: 94.2,  // percent
    falsePositiveRate: 3.1,
    predictionLatency: 45,  // ms
  },
};

export const ALERT_RULES = {
  criticalAlerts: [
    {
      rule: 'Fraud rate exceeds 5%',
      threshold: 5,
      window: '30 minutes',
      action: 'Alert security team',
    },
    {
      rule: 'ML service latency > 1000ms',
      threshold: 1000,
      action: 'Switch to fallback rules',
    },
    {
      rule: 'Moderation queue depth',
      threshold: 50,
      action: 'Notify moderators',
    },
  ],
};
