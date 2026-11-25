const http = require('http');

console.log('\n=== Testing Staff Creation API ===\n');

// Step 1: Login first to get token
console.log('Step 1: Getting authentication token...');

const loginPayload = JSON.stringify({
  email: '[REDACTED_EMAIL]',
  password: '[REDACTED_PASSWORD]',
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

let token = null;

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      const json = JSON.parse(data);
      token = json.token;
      console.log('✅ Logged in, token obtained\n');
      
      // Step 2: Try to create staff
      setTimeout(() => {
        console.log('Step 2: Testing POST /admin/staff endpoint...');
        console.log('   Endpoint: http://localhost:4000/admin/staff');
        console.log('   Method: POST');
        
        const staffPayload = JSON.stringify({
          email: 'newstaff@test.com',
          displayName: 'New Staff Member',
          jobTitle: 'Support Agent',
          department: 'Support',
          roleIds: []
        });
        
        const staffOptions = {
          hostname: 'localhost',
          port: 4000,
          path: '/admin/staff',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        };
        
        const staffReq = http.request(staffOptions, (staffRes) => {
          let staffData = '';
          staffRes.on('data', (chunk) => { staffData += chunk; });
          staffRes.on('end', () => {
            console.log(`   Status: ${staffRes.statusCode}`);
            
            if (staffRes.statusCode === 201 || staffRes.statusCode === 200) {
              console.log('✅ Staff creation endpoint is working!');
              try {
                const result = JSON.parse(staffData);
                console.log(`   Created staff: ${result.email || result.displayName}`);
                if (result.tempPassword) {
                  console.log(`   Temp password: ${result.tempPassword}`);
                }
              } catch (e) {
                console.log('   Response:', staffData.substring(0, 200));
              }
            } else if (staffRes.statusCode === 403) {
              console.log('❌ Forbidden - No permission to create staff');
              console.log('   Make sure your token has proper admin permissions');
            } else if (staffRes.statusCode === 401) {
              console.log('❌ Unauthorized - Token is invalid or expired');
            } else {
              console.log('❌ Error creating staff');
              console.log('   Response:', staffData.substring(0, 300));
            }
          });
        });
        
        staffReq.on('error', (error) => {
          console.log('❌ Network error:', error.message);
          console.log('   Check that API server is running on port 4000');
        });
        
        staffReq.write(staffPayload);
        staffReq.end();
      }, 500);
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
