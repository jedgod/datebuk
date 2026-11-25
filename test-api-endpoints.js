const http = require('http');

// Test health endpoint
console.log('\n=== Testing API Endpoints ===\n');

// Test 1: Health endpoint (public)
console.log('Test 1: Health Endpoint (Public)');
const healthReq = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/health',
  method: 'GET',
  timeout: 5000
}, (res) => {
  console.log(`  Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`  Response: ${JSON.stringify(json)}`);
    } catch (e) {
      console.log(`  Response: ${data.substring(0, 100)}`);
    }
  });
});

healthReq.on('error', (error) => {
  console.log(`  Error: ${error.message}`);
});

healthReq.end();

// Test 2: Protected endpoint (without auth)
setTimeout(() => {
  console.log('\nTest 2: Protected Endpoint - GET /api/staff (No Auth)');
  const staffReq = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/staff',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log(`  Status: ${res.statusCode}`);
    console.log(`  Expected: 401 (Unauthorized)`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (data) {
        try {
          const json = JSON.parse(data);
          console.log(`  Error Message: ${json.message}`);
        } catch (e) {
          console.log(`  Response: ${data.substring(0, 100)}`);
        }
      }
    });
  });

  staffReq.on('error', (error) => {
    console.log(`  Error: ${error.message}`);
  });

  staffReq.end();
}, 500);

// Test 3: Check another public endpoint if auth login exists
setTimeout(() => {
  console.log('\nTest 3: Auth Login Endpoint - POST /api/auth/login');
  const loginReq = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 5000
  }, (res) => {
    console.log(`  Status: ${res.statusCode}`);
    console.log(`  Endpoint is available for testing`);
  });

  loginReq.on('error', (error) => {
    console.log(`  Error: ${error.message}`);
  });

  loginReq.write(JSON.stringify({ email: 'test@test.com', password: 'test' }));
  loginReq.end();
}, 1000);

// Test 4: Check roles endpoint
setTimeout(() => {
  console.log('\nTest 4: Protected Endpoint - GET /api/roles (No Auth)');
  const rolesReq = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/roles',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log(`  Status: ${res.statusCode}`);
    console.log(`  Expected: 401 (Unauthorized)`);
  });

  rolesReq.on('error', (error) => {
    console.log(`  Error: ${error.message}`);
  });

  rolesReq.end();
}, 1500);

console.log('Tests initiated...\n');
