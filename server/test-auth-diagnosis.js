import axios from 'axios';

// Test and fix authentication issues
async function diagnoseAuthError() {
  console.log('🔍 Diagnosing authentication error...');
  
  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    const healthCheck = await axios.get('http://localhost:5050');
    console.log('✅ Server is running');
    
    // Test 2: Try authentication without token
    console.log('2️⃣ Testing profile photo without token (should fail with 401)...');
    try {
      await axios.get('http://localhost:5050/users/profile-photo');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correct 401 response for missing token');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }
    
    // Test 3: Try with invalid token
    console.log('3️⃣ Testing with invalid token...');
    try {
      await axios.get('http://localhost:5050/users/profile-photo', {
        headers: { 'Authorization': 'Bearer invalid_token_here' }
      });
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correct 403 response for invalid token');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }
    
    // Test 4: Create a test user and try authentication
    console.log('4️⃣ Testing with valid user credentials...');
    
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.${Date.now()}@example.com`, // Unique email
      password: 'testpass123',
      jobName: 'inspector',
      role: 'inspector'
    };
    
    // Register user
    const registerResponse = await axios.post('http://localhost:5050/auth/register', testUser);
    console.log('✅ User registration successful');
    
    const token = registerResponse.data.token;
    console.log('🎫 Received token:', token.substring(0, 20) + '...');
    
    // Test profile photo with valid token
    const profileResponse = await axios.get('http://localhost:5050/users/profile-photo', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Profile photo request successful!');
    console.log('📸 Response:', profileResponse.data);
    
  } catch (error) {
    console.error('❌ Diagnostic error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    // Provide specific guidance based on error
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Fix: Make sure the server is running on port 5050');
    } else if (error.response?.status === 401) {
      console.log('🔧 Fix: Check token format and authorization headers');
    } else if (error.response?.status === 403) {
      console.log('🔧 Fix: Token is invalid or expired');
    }
  }
}

diagnoseAuthError();
