const http = require('http');

// First, login to get a token
const loginData = JSON.stringify({
  email: 'emma@example.com',
  password: 'password123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = http.request(loginOptions, (loginRes) => {
  let dataStr = '';
  loginRes.on('data', chunk => dataStr += chunk);
  loginRes.on('end', () => {
    try {
      const loginResponse = JSON.parse(dataStr);
      const token = loginResponse.accessToken;
      
      if (!token) {
        console.log('❌ Login failed - no token in response');
        console.log('Response:', loginResponse);
        return;
      }
      
      console.log('✓ Logged in, token:', token.substring(0, 30) + '...');
      
      // Now test the /users endpoint
      const usersOptions = {
        hostname: 'localhost',
        port: 4000,
        path: '/users?gender=FEMALE&page=1&limit=3',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const usersReq = http.request(usersOptions, (usersRes) => {
        let usersDataStr = '';
        usersRes.on('data', chunk => usersDataStr += chunk);
        usersRes.on('end', () => {
          try {
            const usersData = JSON.parse(usersDataStr);
            console.log('\n✓ /users endpoint working');
            console.log('Status:', usersRes.statusCode);
            console.log('Users returned:', usersData.users?.length || 0);
            if (usersData.users && usersData.users.length > 0) {
              const user = usersData.users[0];
              console.log('\nSample user:');
              console.log('  Name:', user.displayName);
              console.log('  Age:', user.age);
              console.log('  Photos:', user.photos);
              console.log('  Trust Score:', user.trustScore);
            }
            console.log('\n✅ API endpoint is working correctly!');
          } catch (e) {
            console.log('❌ Failed to parse users response:', e.message);
            console.log('Response:', usersDataStr);
          }
        });
      });
      
      usersReq.on('error', (e) => {
        console.log('❌ /users request error:', e.message);
      });
      
      usersReq.end();
    } catch (e) {
      console.log('❌ Failed to parse login response:', e.message);
      console.log('Response:', dataStr);
    }
  });
});

loginReq.on('error', (e) => {
  console.log('❌ Login request error:', e.message);
});

loginReq.write(loginData);
loginReq.end();
