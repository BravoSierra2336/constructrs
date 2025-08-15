// Admin Authentication Fix Script
// This script can be run to test and fix authentication issues

const testAdminAuth = async () => {
    console.log('🔍 Testing Admin Authentication...');
    
    // Check if we have any tokens
    const authToken = localStorage.getItem('authToken');
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    console.log('📋 Token Status:');
    console.log('- authToken:', authToken ? `${authToken.substring(0, 20)}...` : 'NOT FOUND');
    console.log('- token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    console.log('- userData:', userData ? 'FOUND' : 'NOT FOUND');
    
    const effectiveToken = authToken || token;
    
    if (!effectiveToken) {
        console.log('❌ No tokens found. User needs to log in.');
        return false;
    }
    
    // Test token with server
    try {
        console.log('⏳ Testing token with server...');
        const response = await fetch('/admin/check-access', {
            headers: {
                'Authorization': `Bearer ${effectiveToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Authentication successful!');
            console.log('👤 User:', data.user?.email);
            console.log('🔑 Role:', data.user?.role);
            return true;
        } else {
            console.log('❌ Authentication failed:', response.status);
            const errorText = await response.text();
            console.log('Error details:', errorText);
            return false;
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
        return false;
    }
};

// Auto-fix function that tries to resolve common issues
const autoFixAuth = () => {
    console.log('🔧 Attempting auto-fix...');
    
    // Check if user data exists but tokens are missing
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.token) {
                console.log('🔄 Found token in userData, copying to localStorage...');
                localStorage.setItem('authToken', user.token);
                localStorage.setItem('token', user.token);
                console.log('✅ Tokens restored from userData');
                return true;
            }
        } catch (e) {
            console.log('⚠️ Could not parse userData:', e.message);
        }
    }
    
    console.log('❌ Auto-fix failed. Manual login required.');
    return false;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.testAdminAuth = testAdminAuth;
    window.autoFixAuth = autoFixAuth;
    
    // Auto-run on page load if this script is included
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Admin Auth Fix Script Loaded');
            console.log('Run testAdminAuth() or autoFixAuth() in console to debug');
        });
    } else {
        console.log('🚀 Admin Auth Fix Script Loaded');
        console.log('Run testAdminAuth() or autoFixAuth() in console to debug');
    }
}
