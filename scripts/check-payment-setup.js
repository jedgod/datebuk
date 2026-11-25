#!/usr/bin/env node

/**
 * Payment Integration Setup Checker
 * Verifies all RevenueCat payment components are in place
 */

const fs = require('fs');
const path = require('path');

const checks = [
  {
    name: 'RevenueCat API Key Configured',
    path: 'apps/api/.env',
    type: 'file',
    search: 'REVENUECAT_API_KEY=test_SKMBOnYOxYPLzkuPeUetBKfcXkl',
  },
  {
    name: 'Frontend Pricing Component',
    path: 'apps/web/src/components/PricingSection.tsx',
    type: 'file',
  },
  {
    name: 'Frontend Paywall Modal',
    path: 'apps/web/src/components/PaywallModal.tsx',
    type: 'file',
  },
  {
    name: 'Feature Gate Component',
    path: 'apps/web/src/components/FeatureGateWeb.tsx',
    type: 'file',
  },
  {
    name: 'Entitlements Hook',
    path: 'apps/web/src/hooks/useRevenueCatEntitlements.ts',
    type: 'file',
  },
  {
    name: 'Backend Subscriptions Controller',
    path: 'apps/api/src/subscriptions/subscriptions.controller.ts',
    type: 'file',
  },
  {
    name: 'Backend Subscriptions Service',
    path: 'apps/api/src/subscriptions/subscriptions.service.ts',
    type: 'file',
  },
  {
    name: 'Backend Subscriptions Module',
    path: 'apps/api/src/subscriptions/subscriptions.module.ts',
    type: 'file',
  },
  {
    name: 'Axios dependency installed',
    path: 'apps/api/package.json',
    type: 'file',
    search: '"axios"',
  },
];

console.log('\n🔍 RevenueCat Payment Integration Checker\n');
console.log('Checking required files and configurations...\n');

let passed = 0;
let failed = 0;

checks.forEach((check) => {
  const filePath = path.join(__dirname, '..', check.path);
  const exists = fs.existsSync(filePath);

  if (!exists) {
    console.log(`❌ ${check.name} - NOT FOUND at ${check.path}`);
    failed++;
    return;
  }

  if (check.search) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(check.search)) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name} - Missing expected content: "${check.search}"`);
      failed++;
    }
  } else {
    console.log(`✅ ${check.name}`);
    passed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✨ All RevenueCat payment components are configured!\n');
  console.log('🚀 Ready to start:\n');
  console.log('  1. pnpm --filter api dev       # Start API server');
  console.log('  2. pnpm --filter web dev       # Start web app');
  console.log('  3. Visit http://localhost:3000 to test pricing page\n');
  console.log('📚 Docs: See PAYMENT_INTEGRATION.md for detailed information\n');
} else {
  console.log('⚠️  Some files are missing. Please check the setup configuration.\n');
  process.exit(1);
}

