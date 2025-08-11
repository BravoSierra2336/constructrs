import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

const testData = JSON.stringify({
  firstName: "Test",
  lastName: "User", 
  email: "test@example.com",
  password: "testpass123",
  role: "employee"
});

const options = {
  hostname: 'localhost',
  port: 5050,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('Parsed response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Failed to parse response as JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(testData);
req.end();
