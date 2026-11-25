const http = require('http');

console.log('\n=== Testing Staff Directory Access ===\n');

// Step 1: Login to get cookies
console.log('Step 1: Login and get authentication cookies...');
const loginPayload = JSON.stringify({
  email: '[REDACTED_EMAIL]',
  password: '[REDACTED_PASSWORD]',
  nextUrl: '/staff/directory'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

let cookies = [];

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      // Extract cookies
      const setCookieHeaders = res.headers['set-cookie'] || [];
      cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]);
      
      console.log('✅ Login successful');
      console.log(`   Cookies obtained: ${cookies.length}`);
      
      // Step 2: Access staff directory with cookies
      setTimeout(() => {
        console.log('\nStep 2: Access /staff/directory with auth cookies...');
        
        const dashboardOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/staff/directory',
          method: 'GET',
          headers: {
            'Cookie': cookies.join('; ')
          }
        };
        
        const dashboardReq = http.request(dashboardOptions, (dashRes) => {
          let dashData = '';
          dashRes.on('data', (chunk) => { dashData += chunk; });
          dashRes.on('end', () => {
            if (dashRes.statusCode === 200) {
              console.log(`✅ Access granted (${dashRes.statusCode} OK)`);
              console.log(`   Page size: ${dashData.length} bytes`);
              
              // Check for page content
              if (dashData.includes('directory') || dashData.includes('staff')) {
                console.log('✅ Staff directory page content found');
              }
              if (dashData.includes('create-staff') || dashData.includes('Create Staff')) {
                console.log('✅ Page contains staff management features');
              }
              
              console.log('\n✅ STAFF DIRECTORY IS NOW ACCESSIBLE!\n');
            } else if (dashRes.statusCode === 307 || dashRes.statusCode === 302 || dashRes.statusCode === 301) {
              const redirectTo = dashRes.headers.location;
              console.log(`⚠️  Redirected to: ${redirectTo}`);
              console.log('   Status: ' + dashRes.statusCode);
            } else {
              console.log(`❌ Access denied (${dashRes.statusCode})`);
              console.log('   First 200 chars:', dashData.substring(0, 200));
            }
          });
        });
        
        dashboardReq.on('error', (error) => {
          console.error('❌ Error:', error.message);
        });
        
        dashboardReq.end();
      }, 300);
    } else {
      console.log('❌ Login failed');
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Login error:', error.message);
});

loginReq.write(loginPayload);
loginReq.end();
