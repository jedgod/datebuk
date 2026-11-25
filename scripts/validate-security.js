#!/usr/bin/env node

/**
 * Security Setup Validation Script
 * Run from project root: node scripts/validate-security.js
 */

const fs = require('fs');
const path = require('path');

const checks = [];

function check(name, condition, details = '') {
  const status = condition ? '✓' : '✗';
  checks.push({ name, status, details });
  console.log(`${status} ${name}${details ? ' - ' + details : ''}`);
}

console.log('\n🔒 Security Implementation Validation\n');

// Check API files
console.log('Backend (API):');
check(
  'Risk Engine Service',
  fs.existsSync('apps/api/src/security/risk-engine.service.ts')
);
check(
  'IP Intelligence Service',
  fs.existsSync('apps/api/src/security/ip-intelligence.service.ts')
);
check(
  'Security Controller',
  fs.existsSync('apps/api/src/security/security.controller.ts')
);
check(
  'Security Module',
  fs.existsSync('apps/api/src/security/security.module.ts')
);

// Check Frontend files
console.log('\nFrontend (Web):');
check(
  'Device Fingerprint Utility',
  fs.existsSync('apps/web/src/lib/security/device-fingerprint.ts')
);
check(
  'Risk Assessment Utility',
  fs.existsSync('apps/web/src/lib/security/risk-assessment.ts')
);
check(
  'Security API Service',
  fs.existsSync('apps/web/src/services/security-api.service.ts')
);
check(
  'Security Hooks',
  fs.existsSync('apps/web/src/hooks/useSecurity.ts')
);
check(
  'Security Context',
  fs.existsSync('apps/web/src/hooks/SecurityContext.tsx')
);
check(
  'Security Challenge Component',
  fs.existsSync('apps/web/src/components/SecurityChallenge.tsx')
);

// Check dependencies
console.log('\nDependencies:');
const apiPackage = JSON.parse(fs.readFileSync('apps/api/package.json', 'utf-8'));
check(
  '@nestjs/axios',
  apiPackage.dependencies['@nestjs/axios'],
  'HTTP client for external APIs'
);
check(
  '@nestjs/config',
  apiPackage.dependencies['@nestjs/config'],
  'Configuration management'
);
check('rxjs', apiPackage.dependencies['rxjs'], 'Reactive programming');

// Check documentation
console.log('\nDocumentation:');
check(
  'Security Implementation Guide',
  fs.existsSync('SECURITY_IMPLEMENTATION.md')
);

// Summary
console.log('\n' + '─'.repeat(50));
const passed = checks.filter(c => c.status === '✓').length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);
console.log(`\nResult: ${passed}/${total} checks passed (${percentage}%)\n`);

if (percentage === 100) {
  console.log('✓ All security components are in place!\n');
  console.log('Next steps:');
  console.log('1. Configure environment variables (.env files)');
  console.log('2. Set up IP API key (https://ipapi.is/)');
  console.log('3. Integrate SMS service (Twilio/Firebase)');
  console.log('4. Run: npm install in both apps/api and apps/web');
  console.log('5. Start API: npm run dev -w api');
  console.log('6. Start Web: npm run dev -w web\n');
} else {
  console.log('⚠ Some components are missing. Check the output above.\n');
  process.exit(1);
}
