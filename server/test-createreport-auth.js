import axios from 'axios';

// Test the fixed API calls from CreateReport
async function testCreateReportAuth() {
  console.log('🔍 Testing CreateReport authentication fixes...');
  
  try {
    // Helper function to get API URL (same as in CreateReport)
    const getApiUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:5050';
        }
      }
      return 'http://localhost:5050'; // Default for testing
    };

    console.log('1️⃣ Testing /projects endpoint...');
    
    // First, register a test user to get a valid token
    const testUser = {
      firstName: 'Report',
      lastName: 'Tester',
      email: `report.test.${Date.now()}@example.com`,
      password: 'testpass123',
      jobName: 'inspector',
      role: 'inspector'
    };
    
    const registerResponse = await axios.post(`${getApiUrl()}/auth/register`, testUser);
    const token = registerResponse.data.token;
    console.log('✅ User registered and token obtained');
    
    // Test the projects endpoint (this is what was failing)
    const projectsResponse = await axios.get(`${getApiUrl()}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Projects API call successful:', {
      status: projectsResponse.status,
      projectCount: projectsResponse.data.projects?.length || 0
    });
    
    console.log('2️⃣ Testing /weather endpoint...');
    
    // Test weather endpoint
    const weatherResponse = await axios.get(`${getApiUrl()}/weather/complete/New York`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Weather API call successful:', {
      status: weatherResponse.status,
      hasWeatherData: !!weatherResponse.data.current
    });
    
    console.log('3️⃣ Testing /reports endpoint...');
    
    // Test report creation with minimal data
    const testReportData = {
      title: 'API Test Report',
      content: 'This is a test report to verify API authentication',
      author: 'Report Tester',
      jobname: 'API Test',
      jobid: `TEST-${Date.now()}`,
      inspectionType: 'safety',
      status: 'draft'
    };
    
    const reportResponse = await axios.post(`${getApiUrl()}/reports`, testReportData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Report creation successful:', {
      status: reportResponse.status,
      success: reportResponse.data.success
    });
    
    console.log('🎉 All API endpoints working correctly with authentication!');
    
  } catch (error) {
    console.error('❌ API test error:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', error.response?.data);
    console.error('   Message:', error.message);
    
    if (error.response?.status === 401) {
      console.log('🔧 Fix applied: Using proper API URL and authentication headers');
    }
  }
}

testCreateReportAuth();
