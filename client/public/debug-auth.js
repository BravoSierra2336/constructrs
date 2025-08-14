// Debug authentication issues in the browser
// Run this in the browser console to check auth state

console.log('🔍 AUTHENTICATION DEBUG');
console.log('=======================');

// Check localStorage
console.log('1️⃣ LocalStorage tokens:');
console.log('   token:', localStorage.getItem('token'));
console.log('   userData:', localStorage.getItem('userData'));

// Check if token exists and is valid format
const token = localStorage.getItem('token');
if (token) {
  console.log('2️⃣ Token analysis:');
  console.log('   Length:', token.length);
  console.log('   Starts with:', token.substring(0, 20) + '...');
  
  // Try to decode JWT (basic check)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('   Decoded payload:', payload);
      console.log('   Expires:', new Date(payload.exp * 1000));
      console.log('   Is expired:', new Date() > new Date(payload.exp * 1000));
    } else {
      console.log('   ❌ Token format invalid (not JWT)');
    }
  } catch (error) {
    console.log('   ❌ Token decode error:', error.message);
  }
} else {
  console.log('2️⃣ ❌ No token found in localStorage');
}

// Check current user state
console.log('3️⃣ User context (if available):');
// This would need to be run in the React context
console.log('   Check the React DevTools for AuthContext state');

// Test API call
console.log('4️⃣ Testing API call...');
if (token) {
  fetch('http://localhost:5050/users/profile-photo', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('   API Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('   API Response data:', data);
  })
  .catch(error => {
    console.error('   API Error:', error);
  });
} else {
  console.log('   ❌ Cannot test API - no token');
}

console.log('=======================');
console.log('💡 TROUBLESHOOTING TIPS:');
console.log('• If no token: User needs to log in');
console.log('• If token expired: User needs to log in again');
console.log('• If 401 error: Check token format or server auth');
console.log('• If 403 error: Check user permissions');
