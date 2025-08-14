import axios from 'axios';

class WeatherService {
  constructor() {
    // You'll need to get a free API key from https://openweathermap.org/api
    this.apiKey = process.env.OPENWEATHER_API_KEY || 'your_openweather_api_key_here';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    
    // Log API key status (without revealing the key)
    if (this.apiKey === 'your_openweather_api_key_here') {
      console.warn('⚠️  OpenWeatherMap API key not configured. Set OPENWEATHER_API_KEY environment variable.');
    } else {
      console.log('✅ OpenWeatherMap API key configured');
    }
  }

  /**
   * Get current weather by coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Object} Weather data
   */
  async getCurrentWeather(lat, lon) {
    try {
      console.log(`🌤️  Fetching current weather for coordinates: ${lat}, ${lon}`);
      
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'imperial' // Fahrenheit
        }
      });
      
      console.log('✅ Current weather data received successfully');
      
      return {
        temperature: Math.round(response.data.main.temp),
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        location: response.data.name
      };
    } catch (error) {
      console.error('❌ Error fetching current weather:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
      } else if (error.response?.status === 404) {
        throw new Error('Location not found. Please check the coordinates.');
      } else {
        throw new Error(`Failed to fetch current weather data: ${error.message}`);
      }
    }
  }

  /**
   * Get 24-hour forecast by coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Object} 24-hour forecast data
   */
  async get24HourForecast(lat, lon) {
    try {
      console.log(`🌤️  Fetching 24-hour forecast for coordinates: ${lat}, ${lon}`);
      
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'imperial', // Fahrenheit
          cnt: 8 // 8 periods of 3 hours = 24 hours
        }
      });

      console.log('✅ 24-hour forecast data received successfully');

      const forecast = response.data.list.map(item => ({
        time: new Date(item.dt * 1000),
        temperature: Math.round(item.main.temp),
        description: item.weather[0].description,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        precipitation: item.rain ? item.rain['3h'] || 0 : 0, // Rain in last 3 hours (mm)
        precipitationProbability: item.pop * 100, // Probability of precipitation (%)
        icon: item.weather[0].icon
      }));

      // Calculate summary for the 24-hour period
      const temperatures = forecast.map(f => f.temperature);
      const precipitationAmounts = forecast.map(f => f.precipitation);
      const precipitationProbs = forecast.map(f => f.precipitationProbability);

      return {
        location: response.data.city.name,
        forecast: forecast,
        summary: {
          minTemp: Math.min(...temperatures),
          maxTemp: Math.max(...temperatures),
          avgTemp: Math.round(temperatures.reduce((a, b) => a + b, 0) / temperatures.length),
          totalPrecipitation: precipitationAmounts.reduce((a, b) => a + b, 0),
          maxPrecipitationProb: Math.max(...precipitationProbs),
          avgHumidity: Math.round(forecast.reduce((sum, f) => sum + f.humidity, 0) / forecast.length)
        }
      };
    } catch (error) {
      console.error('❌ Error fetching 24-hour forecast:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
      } else if (error.response?.status === 404) {
        throw new Error('Location not found for forecast. Please check the coordinates.');
      } else {
        throw new Error(`Failed to fetch 24-hour forecast data: ${error.message}`);
      }
    }
  }

  /**
   * Get weather by city name
   * @param {string} cityName - City name
   * @returns {Object} Weather data with coordinates
   */
  async getWeatherByCity(cityName) {
    try {
      console.log(`🌍 Fetching weather for city: ${cityName}`);
      
      // First get coordinates for the city
      const geoResponse = await axios.get(`http://api.openweathermap.org/geo/1.0/direct`, {
        params: {
          q: cityName,
          limit: 1,
          appid: this.apiKey
        }
      });

      if (!geoResponse.data || geoResponse.data.length === 0) {
        throw new Error(`City "${cityName}" not found`);
      }

      console.log(`✅ Coordinates found for ${cityName}:`, geoResponse.data[0]);

      const { lat, lon } = geoResponse.data[0];
      
      // Get both current weather and 24-hour forecast
      const [currentWeather, forecast] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.get24HourForecast(lat, lon)
      ]);

      return {
        coordinates: { lat, lon },
        current: currentWeather,
        forecast24h: forecast
      };
    } catch (error) {
      console.error('Error fetching weather by city:', error.message);
      throw new Error(`Failed to fetch weather data for ${cityName}`);
    }
  }

  /**
   * Parse location string and get weather data
   * @param {string} location - Location string (could be "City, State" or coordinates)
   * @returns {Object} Weather data
   */
  async getWeatherForLocation(location) {
    if (!location || location.trim() === '') {
      throw new Error('Location is required');
    }

    // If no valid API key, return mock data for testing
    if (this.apiKey === 'your_openweather_api_key_here') {
      console.log('🧪 Using mock weather data (no API key configured)');
      return this.getMockWeatherData(location);
    }

    // Check if location contains coordinates (lat,lon format)
    const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    if (coordPattern.test(location.trim())) {
      const [lat, lon] = location.split(',').map(coord => parseFloat(coord.trim()));
      const [currentWeather, forecast] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.get24HourForecast(lat, lon)
      ]);
      
      return {
        coordinates: { lat, lon },
        current: currentWeather,
        forecast24h: forecast
      };
    } else {
      // Treat as city name
      return await this.getWeatherByCity(location);
    }
  }

  /**
   * Get mock weather data for testing when API key is not available
   * @param {string} location - Location string
   * @returns {Object} Mock weather data
   */
  getMockWeatherData(location) {
    const mockForecast = [];
    const baseTemp = 75; // Base temperature
    
    // Generate 8 periods (24 hours) of mock data
    for (let i = 0; i < 8; i++) {
      const time = new Date();
      time.setHours(time.getHours() + (i * 3));
      
      mockForecast.push({
        time: time,
        temperature: baseTemp + Math.round((Math.random() - 0.5) * 10),
        description: i % 2 === 0 ? 'clear sky' : 'few clouds',
        humidity: 45 + Math.round(Math.random() * 30),
        windSpeed: 5 + Math.round(Math.random() * 10),
        precipitation: Math.random() > 0.7 ? Math.round(Math.random() * 5) : 0,
        precipitationProbability: Math.round(Math.random() * 100),
        icon: i % 2 === 0 ? '01d' : '02d'
      });
    }

    const temperatures = mockForecast.map(f => f.temperature);
    
    return {
      coordinates: { lat: 40.7128, lon: -74.0060 },
      current: {
        temperature: baseTemp,
        description: 'clear sky',
        humidity: 50,
        windSpeed: 8,
        location: location
      },
      forecast24h: {
        location: location,
        forecast: mockForecast,
        summary: {
          minTemp: Math.min(...temperatures),
          maxTemp: Math.max(...temperatures),
          avgTemp: Math.round(temperatures.reduce((a, b) => a + b, 0) / temperatures.length),
          totalPrecipitation: mockForecast.reduce((sum, f) => sum + f.precipitation, 0),
          maxPrecipitationProb: Math.max(...mockForecast.map(f => f.precipitationProbability)),
          avgHumidity: Math.round(mockForecast.reduce((sum, f) => sum + f.humidity, 0) / mockForecast.length)
        }
      }
    };
  }
}

export default new WeatherService();
