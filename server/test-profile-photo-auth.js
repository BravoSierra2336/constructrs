import { generateToken } from './middleware/auth.js';
import User from './models/user.js';
import axios from 'axios';

// Test the profile photo endpoint with a real user
async function testProfilePhotoWithAuth() {
  try {
    console.log('🧪 Testing profile photo endpoint with authentication...');
    
    // First, let's find a user in the database
    const users = await User.findAll();
    console.log('👥 Found users in database:', users.length);
    
    if (users.length === 0) {
      console.log('⚠️ No users found in database');
      return;
    }
    
    const testUser = users[0];
    console.log('🧪 Using test user:', {
      id: testUser._id,
      email: testUser.email,
      authProvider: testUser.authProvider
    });
    
    // Generate a token for this user
    const token = generateToken(testUser);
    console.log('🎫 Generated token:', token.substring(0, 50) + '...');
    
    // Make the request with authentication
    const response = await axios.get('http://localhost:5050/users/profile-photo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.error('❌ Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.response?.status === 404) {
      console.log('📝 This is the "User not found" error from your screenshot');
    }
  }
}

testProfilePhotoWithAuth();
