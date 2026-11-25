#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let passCount = 0;
let failCount = 0;
const results = [];

function log(message) {
  console.log(message);
  results.push({type: 'log', message});
}

function pass(test) {
  console.log(`${colors.green}✓${colors.reset} ${test}`);
  results.push({type: 'pass', test});
  passCount++;
}

function fail(test, reason = '') {
  console.log(`${colors.red}✗${colors.reset} ${test}${reason ? ': ' + reason : ''}`);
  results.push({type: 'fail', test, reason});
  failCount++;
}

function section(title) {
  log(`\n${colors.bold}${colors.cyan}## ${title}${colors.reset}\n`);
}

// Test 1: Files exist
section('1. Advanced Security Files');

const requiredFiles = [
  'apps/api/src/common/redis/redis.service.ts',
  'apps/api/src/common/ml/ml.service.ts',
  'apps/api/src/common/risk/risk.engine.ts',
  'apps/api/src/common/fraud/fraud-event-tracker.ts',
  'apps/api/src/admin/fraud.controller.ts',
  'apps/api/src/admin/moderator.controller.ts',
  'apps/api/src/admin/experiment.controller.ts',
  'apps/api/src/common/common.module.ts',
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const size = fs.statSync(filePath).size;
    pass(`File exists: ${file} (${size} bytes)`);
  } else {
    fail(`File missing: ${file}`);
  }
});

// Test 2: Service implementations
section('2. Service Implementation Checks');

const redisServicePath = path.join(process.cwd(), 'apps/api/src/common/redis/redis.service.ts');
if (fs.existsSync(redisServicePath)) {
  const content = fs.readFileSync(redisServicePath, 'utf8');
  
  if (content.includes('class RedisService')) pass('RedisService class defined');
  else fail('RedisService class not found');
  
  if (content.includes('get(') || content.includes('getJson(')) pass('RedisService has get methods');
  else fail('RedisService missing get methods');
  
  if (content.includes('set(') || content.includes('setJson(')) pass('RedisService has set methods');
  else fail('RedisService missing set methods');
  
  if (content.includes('increment(') || content.includes('decrement(')) pass('RedisService has counter methods');
  else fail('RedisService missing counter methods');
  
  if (content.includes('checkRateLimit(') || content.includes('rate')) pass('RedisService has rate limiting');
  else fail('RedisService missing rate limiting');
}

const mlServicePath = path.join(process.cwd(), 'apps/api/src/common/ml/ml.service.ts');
if (fs.existsSync(mlServicePath)) {
  const content = fs.readFileSync(mlServicePath, 'utf8');
  
  if (content.includes('class MlService')) pass('MlService class defined');
  else fail('MlService class not found');
  
  if (content.includes('predict(')) pass('MlService has predict method');
  else fail('MlService missing predict method');
  
  if (content.includes('shadowPredict(')) pass('MlService has shadow mode');
  else fail('MlService missing shadow mode');
  
  if (content.includes('fallback') || content.includes('fallbackPredict')) pass('MlService has fallback logic');
  else fail('MlService missing fallback logic');
}

const riskEnginePath = path.join(process.cwd(), 'apps/api/src/common/risk/risk.engine.ts');
if (fs.existsSync(riskEnginePath)) {
  const content = fs.readFileSync(riskEnginePath, 'utf8');
  
  if (content.includes('class RiskEngine')) pass('RiskEngine class defined');
  else fail('RiskEngine class not found');
  
  if (content.includes('calculateInitialRisk') || content.includes('calculateInitial')) pass('RiskEngine has initial risk calculation');
  else fail('RiskEngine missing initial risk calculation');
  
  if (content.includes('evaluateFullRisk')) pass('RiskEngine has full risk evaluation');
  else fail('RiskEngine missing full risk evaluation');
  
  if (content.includes('0.35') || content.includes('weight')) pass('RiskEngine has weighted scoring');
  else fail('RiskEngine missing weighted scoring');
}

const fraudTrackerPath = path.join(process.cwd(), 'apps/api/src/common/fraud/fraud-event-tracker.ts');
if (fs.existsSync(fraudTrackerPath)) {
  const content = fs.readFileSync(fraudTrackerPath, 'utf8');
  
  if (content.includes('class FraudEventTracker')) pass('FraudEventTracker class defined');
  else fail('FraudEventTracker class not found');
  
  if (content.includes('trackEvent(')) pass('FraudEventTracker has trackEvent method');
  else fail('FraudEventTracker missing trackEvent method');
  
  if (content.includes('logDecision(')) pass('FraudEventTracker has logDecision method');
  else fail('FraudEventTracker missing logDecision method');
  
  if (content.includes('provideFeedback(')) pass('FraudEventTracker has feedback collection');
  else fail('FraudEventTracker missing feedback collection');
}

// Test 3: Controller implementations
section('3. Controller Implementation');

const fraudControllerPath = path.join(process.cwd(), 'apps/api/src/admin/fraud.controller.ts');
if (fs.existsSync(fraudControllerPath)) {
  const content = fs.readFileSync(fraudControllerPath, 'utf8');
  
  if (content.includes('@Controller')) pass('FraudController has @Controller decorator');
  else fail('FraudController missing @Controller decorator');
  
  if (content.includes('/admin/fraud') || content.includes('/fraud')) pass('FraudController defines fraud routes');
  else fail('FraudController missing fraud routes');
  
  const routeCount = (content.match(/@(Get|Post|Put|Delete)/g) || []).length;
  if (routeCount >= 5) pass(`FraudController has ${routeCount} HTTP handlers`);
  else fail(`FraudController has only ${routeCount} HTTP handlers (expected ≥5)`);
}

const moderatorControllerPath = path.join(process.cwd(), 'apps/api/src/admin/moderator.controller.ts');
if (fs.existsSync(moderatorControllerPath)) {
  const content = fs.readFileSync(moderatorControllerPath, 'utf8');
  
  if (content.includes('@Controller')) pass('ModeratorController has @Controller decorator');
  else fail('ModeratorController missing @Controller decorator');
  
  if (content.includes('/moderator') || content.includes('/queue')) pass('ModeratorController defines moderator routes');
  else fail('ModeratorController missing moderator routes');
  
  const routeCount = (content.match(/@(Get|Post|Put|Delete)/g) || []).length;
  if (routeCount >= 5) pass(`ModeratorController has ${routeCount} HTTP handlers`);
  else fail(`ModeratorController has only ${routeCount} HTTP handlers (expected ≥5)`);
}

const experimentControllerPath = path.join(process.cwd(), 'apps/api/src/admin/experiment.controller.ts');
if (fs.existsSync(experimentControllerPath)) {
  const content = fs.readFileSync(experimentControllerPath, 'utf8');
  
  if (content.includes('@Controller')) pass('ExperimentController has @Controller decorator');
  else fail('ExperimentController missing @Controller decorator');
  
  if (content.includes('experiment') && content.includes('/')) pass('ExperimentController defines experiment routes');
  else fail('ExperimentController missing experiment routes');
  
  if (content.includes('variant') || content.includes('Variant')) pass('ExperimentController handles variant assignment');
  else fail('ExperimentController missing variant assignment');
}

// Test 4: Prisma schema updates
section('4. Prisma Schema Update');

const prismaSchemaPath = path.join(process.cwd(), 'apps/api/prisma/schema.prisma');
if (fs.existsSync(prismaSchemaPath)) {
  const content = fs.readFileSync(prismaSchemaPath, 'utf8');
  
  const entities = [
    'IpLog',
    'IpBlacklist',
    'IpIntelCache',
    'FraudEvent',
    'FraudFeedback',
    'FraudExplanation',
    'ModeratorQueue',
    'SecurityMetric',
    'ExperimentAssignment',
  ];
  
  entities.forEach(entity => {
    if (content.includes(`model ${entity}`)) {
      pass(`Prisma entity defined: ${entity}`);
    } else {
      fail(`Prisma entity missing: ${entity}`);
    }
  });
  
  // Check User model relationships
  if (content.includes('ipLogs') && content.includes('fraudEvents')) {
    pass('User model has security relationships');
  } else {
    fail('User model missing security relationships');
  }
}

// Test 5: Module integration
section('5. Module Integration');

const appModulePath = path.join(process.cwd(), 'apps/api/src/app.module.ts');
if (fs.existsSync(appModulePath)) {
  const content = fs.readFileSync(appModulePath, 'utf8');
  
  if (content.includes('CommonModule')) pass('AppModule imports CommonModule');
  else fail('AppModule missing CommonModule import');
}

const commonModulePath = path.join(process.cwd(), 'apps/api/src/common/common.module.ts');
if (fs.existsSync(commonModulePath)) {
  const content = fs.readFileSync(commonModulePath, 'utf8');
  
  if (content.includes('Module')) pass('CommonModule is a NestJS Module');
  else fail('CommonModule not properly defined');
  
  if (content.includes('RedisService')) pass('CommonModule exports RedisService');
  else fail('CommonModule missing RedisService export');
  
  if (content.includes('MlService')) pass('CommonModule exports MlService');
  else fail('CommonModule missing MlService export');
  
  if (content.includes('RiskEngine')) pass('CommonModule exports RiskEngine');
  else fail('CommonModule missing RiskEngine export');
}

const adminModulePath = path.join(process.cwd(), 'apps/api/src/admin/admin.module.ts');
if (fs.existsSync(adminModulePath)) {
  const content = fs.readFileSync(adminModulePath, 'utf8');
  
  if (content.includes('FraudController')) pass('AdminModule includes FraudController');
  else fail('AdminModule missing FraudController');
  
  if (content.includes('ModeratorController')) pass('AdminModule includes ModeratorController');
  else fail('AdminModule missing ModeratorController');
  
  if (content.includes('ExperimentController')) pass('AdminModule includes ExperimentController');
  else fail('AdminModule missing ExperimentController');
}

// Test 6: Security features validation
section('6. Security Features Validation');

const riskPath = path.join(process.cwd(), 'apps/api/src/common/risk/risk.engine.ts');
if (fs.existsSync(riskPath)) {
  const content = fs.readFileSync(riskPath, 'utf8');
  
  // Check for weighted scoring (ML 0.35, IP 0.25, Device 0.15, etc.)
  if (content.includes('0.35') && content.includes('0.25') && content.includes('0.15')) {
    pass('Risk engine uses weighted factor scoring');
  } else {
    fail('Risk engine missing expected weight distribution');
  }
  
  // Check for risk levels
  if (content.includes('LOW') || content.includes('MEDIUM') || content.includes('HIGH')) {
    pass('Risk engine defines risk levels');
  } else {
    fail('Risk engine missing risk level definitions');
  }
  
  // Check for thresholds
  if (content.includes('20') || content.includes('40') || content.includes('80')) {
    pass('Risk engine has threshold definitions');
  } else {
    fail('Risk engine missing threshold definitions');
  }
}

// Check for guard implementations
section('7. Security Guards & Middleware');

if (fs.existsSync(riskPath)) {
  const content = fs.readFileSync(riskPath, 'utf8');
  if (content.includes('Guard') || content.includes('guard')) {
    pass('Security guards implemented');
  } else {
    fail('Security guards not found');
  }
}

// Test 8: API Endpoints
section('8. API Endpoints');

const fraudCtrlPath = path.join(process.cwd(), 'apps/api/src/admin/fraud.controller.ts');
if (fs.existsSync(fraudCtrlPath)) {
  const content = fs.readFileSync(fraudCtrlPath, 'utf8');
  
  const endpoints = [
    { method: 'GET', path: 'events' },
    { method: 'GET', path: 'stats' },
    { method: 'POST', path: 'feedback' },
    { method: 'GET', path: 'blacklist' },
  ];
  
  endpoints.forEach(ep => {
    if (content.includes(ep.path) || content.includes(`'${ep.path}`)) {
      pass(`Fraud endpoint exists: ${ep.method} /admin/fraud/${ep.path}`);
    } else {
      fail(`Fraud endpoint missing: ${ep.method} /admin/fraud/${ep.path}`);
    }
  });
}

const modCtrlPath = path.join(process.cwd(), 'apps/api/src/admin/moderator.controller.ts');
if (fs.existsSync(modCtrlPath)) {
  const content = fs.readFileSync(modCtrlPath, 'utf8');
  
  if (content.includes('queue')) {
    pass('Moderator queue endpoints exist');
  } else {
    fail('Moderator queue endpoints missing');
  }
}

const expCtrlPath = path.join(process.cwd(), 'apps/api/src/admin/experiment.controller.ts');
if (fs.existsSync(expCtrlPath)) {
  const content = fs.readFileSync(expCtrlPath, 'utf8');
  
  if (content.includes('variant') && content.includes('experiment')) {
    pass('Experiment/A/B testing endpoints exist');
  } else {
    fail('Experiment endpoints missing');
  }
}

// Test 9: Configuration files
section('9. Configuration Files');

const configDir = path.join(process.cwd(), 'apps/api/src/config');
if (fs.existsSync(configDir)) {
  const files = fs.readdirSync(configDir);
  if (files.length > 0) {
    pass(`Security config files exist (${files.length} files)`);
  } else {
    fail('Config directory is empty');
  }
} else {
  fail('Config directory not found');
}

// Test 10: Summary
section('10. Test Summary');
log(`\n${colors.bold}Total Tests: ${passCount + failCount}${colors.reset}`);
log(`${colors.green}${colors.bold}Passed: ${passCount}${colors.reset}`);
log(`${colors.red}${colors.bold}Failed: ${failCount}${colors.reset}`);

const passPercentage = ((passCount / (passCount + failCount)) * 100).toFixed(1);
log(`\nSuccess Rate: ${colors.bold}${passPercentage}%${colors.reset}\n`);

if (failCount === 0) {
  log(`${colors.green}${colors.bold}✓ ALL TESTS PASSED!${colors.reset}\n`);
  process.exit(0);
} else {
  log(`${colors.yellow}${colors.bold}⚠ Some tests need attention${colors.reset}\n`);
  process.exit(1);
}
