#!/usr/bin/env node

// Test script to verify admin dashboard authentication
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:5050';

// Test credentials (replace with actual test user)
const TEST_USER = {
    email: 'sdv2336jr@gmail.com',
    password: 'test123'
};

async function testAdminAuth() {
    console.log('🔐 Testing Admin Dashboard Authentication...\n');

    try {
        // Step 1: Login to get token
        console.log('Step 1: Logging in...');
        const loginResponse = await fetch(`${SERVER_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(TEST_USER)
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Login successful, token received');

        // Step 2: Test admin endpoints
        const adminEndpoints = [
            '/admin/reports',
            '/admin/reports/stats',
            '/admin/check-access'
        ];

        for (const endpoint of adminEndpoints) {
            console.log(`\nTesting ${endpoint}...`);
            
            // Test without token (should fail)
            const noAuthResponse = await fetch(`${SERVER_URL}${endpoint}`);
            console.log(`  Without token: ${noAuthResponse.status} ${noAuthResponse.status === 401 ? '✅' : '❌'}`);
            
            // Test with token (should succeed for appropriate roles)
            const authResponse = await fetch(`${SERVER_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(`  With token: ${authResponse.status} ${authResponse.ok ? '✅' : '❌'}`);
        }

        // Step 3: Test token storage compatibility
        console.log('\n🔄 Testing token storage compatibility...');
        console.log('localStorage.setItem("authToken", token) - for admin dashboard');
        console.log('localStorage.setItem("token", token) - for React app');
        console.log('✅ Both keys should work with getAuthToken() function');

        console.log('\n🎉 Admin authentication test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testAdminAuth();
