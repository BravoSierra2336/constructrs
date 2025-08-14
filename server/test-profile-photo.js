import axios from 'axios';

// Test the profile photo endpoint directly
async function testProfilePhoto() {
  try {
    console.log('🧪 Testing profile photo endpoint...');
    
    // You'll need to replace this with a valid JWT token from a logged-in user
    // For now, let's test without authentication to see the error
    const response = await axios.get('http://localhost:5050/users/profile-photo', {
      headers: {
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
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
      console.log('📝 This might be a "User not found" error from the attachment you showed');
    }
  }
}

testProfilePhoto();
