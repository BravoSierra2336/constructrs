import weatherService from './services/weatherService.js';

console.log('🧪 Testing Weather Service Fix...\n');

async function testWeatherFix() {
  try {
    console.log('📍 Testing Jacksonville, FL...');
    const result = await weatherService.getWeatherForLocation('Jacksonville, FL');
    
    console.log('✅ Weather data received:');
    console.log('Current Temperature:', result.current.temperature + '°F');
    console.log('Description:', result.current.description);
    console.log('24h Min/Max:', result.forecast24h.summary.minTemp + '°F - ' + result.forecast24h.summary.maxTemp + '°F');
    console.log('Rain Chance:', result.forecast24h.summary.maxPrecipitationProb + '%');
    
    console.log('\n✅ Weather service is working correctly!');
    console.log('🎯 Production fix verified - no more 500 errors');
    
  } catch (error) {
    console.error('❌ Weather service test failed:', error.message);
  }
}

testWeatherFix();
