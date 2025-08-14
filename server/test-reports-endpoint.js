// Test script to check the reports endpoint authentication
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');

async function testReportsEndpoint() {
  console.log('🧪 Testing Reports Endpoint...\n');

  const baseURL = 'http://localhost:5050';

  // First, let's try to access the reports endpoint without authentication
  console.log('1. Testing reports endpoint without authentication...');
  try {
    const response = await axios.get(`${baseURL}/reports`);
    console.log('✅ Success (unexpected!):', response.status, response.data);
  } catch (error) {
    console.log('❌ Expected failure:', error.response?.status, error.response?.data?.error || error.message);
    console.log('   This is correct - endpoint should require authentication\n');
  }

  // Test with a dummy/invalid token
  console.log('2. Testing reports endpoint with invalid token...');
  try {
    const response = await axios.get(`${baseURL}/reports`, {
      headers: {
        'Authorization': 'Bearer invalid_token_123'
      }
    });
    console.log('✅ Success (unexpected!):', response.status, response.data);
  } catch (error) {
    console.log('❌ Expected failure:', error.response?.status, error.response?.data?.error || error.message);
    if (error.response?.status === 403 && error.response?.data?.error === 'Invalid or expired token') {
      console.log('   ✅ This is the error you\'re seeing! The token is invalid/expired\n');
    }
  }

  // Check if we can create a valid token by logging in
  console.log('3. Testing authentication flow...');
  try {
    // Try to get login page to see if auth endpoint is working
    const authCheck = await axios.get(`${baseURL}/auth/test`, {
      timeout: 5000
    });
    console.log('✅ Auth endpoint accessible:', authCheck.status);
  } catch (error) {
    console.log('❌ Auth endpoint issue:', error.response?.status, error.response?.data?.error || error.message);
  }

  console.log('\n🔍 Analysis:');
  console.log('- The "Invalid or expired token" error suggests the authentication token is not valid');
  console.log('- This could be because:');
  console.log('  • The token has expired');
  console.log('  • The token was not properly set in localStorage');
  console.log('  • The JWT_SECRET has changed');
  console.log('  • The user needs to log in again');
  console.log('\n💡 Solution:');
  console.log('- Try logging out and logging back in');
  console.log('- Check browser localStorage for token');
  console.log('- Verify JWT_SECRET in .env hasn\'t changed');
}

testReportsEndpoint().catch(console.error);
