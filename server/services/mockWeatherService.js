// Mock weather data for testing when API key is not available
class MockWeatherService {
  async getCurrentWeather(lat, lon) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      temperature: Math.round(75 + Math.random() * 20), // Random temp between 75-95°F
      description: 'partly cloudy',
      humidity: Math.round(50 + Math.random() * 30), // 50-80%
      windSpeed: Math.round(5 + Math.random() * 10), // 5-15 mph
      location: 'Mock Location'
    };
  }

  async get24HourForecast(lat, lon) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const forecast = [];
    const baseTemp = 75;
    
    for (let i = 0; i < 8; i++) {
      const time = new Date();
      time.setHours(time.getHours() + (i * 3));
      
      forecast.push({
        time: time,
        temperature: Math.round(baseTemp + Math.random() * 20 - 10),
        description: ['clear sky', 'partly cloudy', 'scattered clouds', 'light rain'][Math.floor(Math.random() * 4)],
        humidity: Math.round(40 + Math.random() * 40),
        windSpeed: Math.round(3 + Math.random() * 12),
        precipitation: Math.random() > 0.7 ? Math.random() * 2 : 0, // 30% chance of rain
        precipitationProbability: Math.round(Math.random() * 100),
        icon: '01d'
      });
    }

    const temperatures = forecast.map(f => f.temperature);
    const precipitationAmounts = forecast.map(f => f.precipitation);
    const precipitationProbs = forecast.map(f => f.precipitationProbability);

    return {
      location: 'Mock Location',
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
  }

  async getWeatherByCity(cityName) {
    console.log(`🧪 Mock: Fetching weather for city: ${cityName}`);
    
    const [currentWeather, forecast] = await Promise.all([
      this.getCurrentWeather(0, 0),
      this.get24HourForecast(0, 0)
    ]);

    return {
      coordinates: { lat: 30.3322, lon: -81.6557 }, // Jacksonville coords
      current: { ...currentWeather, location: cityName },
      forecast24h: { ...forecast, location: cityName }
    };
  }

  async getWeatherForLocation(location) {
    console.log(`🧪 Mock: Using mock weather data for: ${location}`);
    return await this.getWeatherByCity(location);
  }
}

export default new MockWeatherService();
