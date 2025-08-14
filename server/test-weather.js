import axios from 'axios';

const API_KEY = 'b2177e98c6c1e97a1d0e0d1a4497ebbc';
const testCity = 'Jacksonville,FL';

console.log('Testing OpenWeatherMap API...');
console.log('API Key:', API_KEY ? 'SET' : 'NOT SET');
console.log('Testing city:', testCity);

async function testDirectAPI() {
  try {
    // Test geocoding first
    console.log('\n1. Testing Geocoding API...');
    const geoResponse = await axios.get(`http://api.openweathermap.org/geo/1.0/direct`, {
      params: {
        q: testCity,
        limit: 1,
        appid: API_KEY
      }
    });
    
    console.log('Geocoding response:', geoResponse.data);
    
    if (geoResponse.data && geoResponse.data.length > 0) {
      const { lat, lon } = geoResponse.data[0];
      console.log(`Coordinates found: ${lat}, ${lon}`);
      
      // Test current weather
      console.log('\n2. Testing Current Weather API...');
      const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'imperial'
        }
      });
      
      console.log('Weather response:', {
        temp: weatherResponse.data.main.temp,
        description: weatherResponse.data.weather[0].description,
        location: weatherResponse.data.name
      });
      
      // Test forecast
      console.log('\n3. Testing Forecast API...');
      const forecastResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'imperial',
          cnt: 8
        }
      });
      
      console.log('Forecast response:', {
        count: forecastResponse.data.list.length,
        firstForecast: {
          time: new Date(forecastResponse.data.list[0].dt * 1000),
          temp: forecastResponse.data.list[0].main.temp,
          description: forecastResponse.data.list[0].weather[0].description
        }
      });
      
      console.log('\n✅ All API tests passed!');
    } else {
      console.log('❌ No geocoding results found');
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

testDirectAPI();
