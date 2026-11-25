#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Mobile Security Validation Script
 *
 * Validates that all mobile security components are properly implemented
 * and configured. Run with: node scripts/validate-mobile-security.js
 */

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const checkResults = [];

function pass(message) {
  console.log(`${COLORS.green}✓${COLORS.reset} ${message}`);
  checkResults.push({ message, status: 'pass' });
}

function fail(message) {
  console.log(`${COLORS.red}✗${COLORS.reset} ${message}`);
  checkResults.push({ message, status: 'fail' });
}

function warn(message) {
  console.log(`${COLORS.yellow}⚠${COLORS.reset} ${message}`);
  checkResults.push({ message, status: 'warn' });
}

function info(message) {
  console.log(`${COLORS.cyan}ℹ${COLORS.reset} ${message}`);
}

function fileExists(filepath, description) {
  const fullPath = path.join(process.cwd(), filepath);
  if (fs.existsSync(fullPath)) {
    pass(`File exists: ${description}`);
    return true;
  } else {
    fail(`File missing: ${filepath} (${description})`);
    return false;
  }
}

function fileContains(filepath, searchString, description) {
  const fullPath = path.join(process.cwd(), filepath);
  if (!fs.existsSync(fullPath)) {
    fail(`File not found: ${filepath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  if (content.includes(searchString)) {
    pass(`${description}`);
    return true;
  } else {
    fail(`Code missing: ${description} in ${filepath}`);
    return false;
  }
}

function section(title) {
  console.log(`\n${COLORS.cyan}=== ${title} ===${COLORS.reset}`);
}

// Main validation
console.log(`\n${COLORS.cyan}Mobile Security Validation${COLORS.reset}`);
console.log('================================\n');

// 1. Check mobile app structure
section('Mobile App Structure');
fileExists('apps/mobile/package.json', 'Mobile app package.json');
fileExists('apps/mobile/tsconfig.json', 'Mobile TypeScript config');
fileExists('apps/mobile/.env.example', 'Mobile environment template');

// 2. Check security utilities
section('Security Utilities');
fileExists(
  'apps/mobile/src/lib/security/mobile-device-fingerprint.ts',
  'Device fingerprinting utility',
);
fileExists(
  'apps/mobile/src/lib/security/risk-assessment.ts',
  'Risk assessment definitions',
);

// 3. Check API client
section('API Client');
fileExists(
  'apps/mobile/src/services/mobile-security-api.ts',
  'Mobile security API client',
);
fileContains(
  'apps/mobile/src/services/mobile-security-api.ts',
  'MobileSecurityApiClient',
  'Mobile security API client class exported',
);
fileContains(
  'apps/mobile/src/services/mobile-security-api.ts',
  'axios',
  'API client uses axios',
);

// 4. Check security hooks
section('Security Hooks');
fileExists('apps/mobile/src/hooks/useMobileSecurity.ts', 'Mobile security hooks');
fileContains(
  'apps/mobile/src/hooks/useMobileSecurity.ts',
  'useMobileDeviceFingerprint',
  'Device fingerprint hook exported',
);
fileContains(
  'apps/mobile/src/hooks/useMobileSecurity.ts',
  'useMobileRiskAssessment',
  'Risk assessment hook exported',
);
fileContains(
  'apps/mobile/src/hooks/useMobileSecurity.ts',
  'useMobileSmsVerification',
  'SMS verification hook exported',
);
fileContains(
  'apps/mobile/src/hooks/useMobileSecurity.ts',
  'useMobileAuthAttempts',
  'Auth attempts hook exported',
);
fileContains(
  'apps/mobile/src/hooks/useMobileSecurity.ts',
  'useMobileBlacklistCheck',
  'Blacklist check hook exported',
);
fileContains(
  'apps/mobile/src/hooks/useMobileSecurity.ts',
  'useMobileIpIntelligence',
  'IP intelligence hook exported',
);
fileContains(
  'apps/mobile/src/hooks/useMobileSecurity.ts',
  'useMobileAppSecurityStatus',
  'App security status hook exported',
);

// 5. Check biometric authentication
section('Biometric Authentication');
fileExists(
  'apps/mobile/src/hooks/useBiometricAuth.ts',
  'Biometric authentication hook',
);
fileContains(
  'apps/mobile/src/hooks/useBiometricAuth.ts',
  'expo-local-authentication',
  'Uses Expo LocalAuthentication API',
);
fileContains(
  'apps/mobile/src/hooks/useBiometricAuth.ts',
  'Face ID',
  'Biometric hook documents Face ID support',
);

// 6. Check UI components
section('UI Components');
fileExists(
  'apps/mobile/src/components/MobileSmsVerification.tsx',
  'SMS verification modal component',
);
fileContains(
  'apps/mobile/src/components/MobileSmsVerification.tsx',
  'React Native',
  'SMS modal uses React Native',
);
fileContains(
  'apps/mobile/src/components/MobileSmsVerification.tsx',
  'StyleSheet',
  'SMS modal uses React Native StyleSheet',
);

fileExists(
  'apps/mobile/src/components/AccountLockoutScreen.tsx',
  'Account lockout screen component',
);
fileContains(
  'apps/mobile/src/components/AccountLockoutScreen.tsx',
  'import',
  'Lockout screen is a TypeScript/React component',
);
fileContains(
  'apps/mobile/src/components/AccountLockoutScreen.tsx',
  'lockoutTime',
  'Lockout screen tracks lockout time',
);

// 7. Check context provider
section('Context Provider');
fileExists(
  'apps/mobile/src/context/MobileSecurityContext.tsx',
  'Mobile security context provider',
);
fileContains(
  'apps/mobile/src/context/MobileSecurityContext.tsx',
  'createContext',
  'Context provider uses React Context API',
);
fileContains(
  'apps/mobile/src/context/MobileSecurityContext.tsx',
  'useMobileSecurityContext',
  'Context hook exported',
);
fileContains(
  'apps/mobile/src/context/MobileSecurityContext.tsx',
  'MobileSecurityProvider',
  'Context provider component exported',
);

// 8. Check integration example
section('Integration Example');
fileExists(
  'apps/mobile/src/screens/LoginScreen.example.tsx',
  'Example login screen integration',
);
fileContains(
  'apps/mobile/src/screens/LoginScreen.example.tsx',
  'useMobileSecurityContext',
  'Example uses security context',
);
fileContains(
  'apps/mobile/src/screens/LoginScreen.example.tsx',
  'MobileSmsVerification',
  'Example shows SMS verification',
);
fileContains(
  'apps/mobile/src/screens/LoginScreen.example.tsx',
  'AccountLockoutScreen',
  'Example shows account lockout',
);

// 9. Check documentation
section('Documentation');
fileExists('MOBILE_SECURITY_GUIDE.md', 'Mobile security guide');
fileContains(
  'MOBILE_SECURITY_GUIDE.md',
  'Device Fingerprinting',
  'Guide documents device fingerprinting',
);
fileContains(
  'MOBILE_SECURITY_GUIDE.md',
  'Risk Assessment',
  'Guide documents risk assessment',
);
fileContains(
  'MOBILE_SECURITY_GUIDE.md',
  'useMobileDeviceFingerprint',
  'Guide documents security hooks',
);

// 10. Check backend security module
section('Backend Integration');
fileExists('apps/api/src/security/security.module.ts', 'Backend security module');
fileExists('apps/api/src/security/security.controller.ts', 'Security API controller');
fileExists('apps/api/src/security/risk-engine.service.ts', 'Risk engine service');
fileExists('apps/api/src/security/ip-intelligence.service.ts', 'IP intelligence service');

fileContains(
  'apps/api/src/security/security.controller.ts',
  'assess-risk',
  'Backend has risk assessment endpoint',
);
fileContains(
  'apps/api/src/security/security.controller.ts',
  'checkBlacklist',
  'Backend has blacklist check endpoint',
);
fileContains(
  'apps/api/src/security/security.controller.ts',
  'isBlacklisted',
  'Backend implements blacklist checking',
);

// 12. Check async storage for mobile persistence
section('Mobile Persistence');
fileContains(
  'apps/mobile/src/lib/security/mobile-device-fingerprint.ts',
  'AsyncStorage',
  'Device fingerprint uses AsyncStorage for persistence',
);
fileContains(
  'apps/mobile/src/hooks/useMobileSecurity.ts',
  'AsyncStorage',
  'Mobile hooks use AsyncStorage for state persistence',
);

// 12. Summary
section('Summary');
const passed = checkResults.filter((r) => r.status === 'pass').length;
const failed = checkResults.filter((r) => r.status === 'fail').length;
const warned = checkResults.filter((r) => r.status === 'warn').length;

info(`Total checks: ${checkResults.length}`);
info(
  `${COLORS.green}Passed: ${passed}${COLORS.reset} | ${COLORS.red}Failed: ${failed}${COLORS.reset} | ${COLORS.yellow}Warned: ${warned}${COLORS.reset}`,
);

if (failed === 0) {
  console.log(
    `\n${COLORS.green}✓ All mobile security checks passed!${COLORS.reset}\n`,
  );
  process.exit(0);
} else {
  console.log(
    `\n${COLORS.red}✗ ${failed} check(s) failed. Please review above.${COLORS.reset}\n`,
  );
  process.exit(1);
}
