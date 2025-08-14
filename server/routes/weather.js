import express from 'express';
import weatherService from '../services/weatherService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint to check if weather routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Weather API routes are working',
    timestamp: new Date().toISOString()
  });
});

// Get current weather by location
router.get('/current/:location', authenticateToken, async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location || location.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Location parameter is required'
      });
    }
    
    console.log('Fetching current weather for location:', location);
    const weatherData = await weatherService.getWeatherForLocation(location);
    
    res.json({
      success: true,
      data: weatherData.current
    });
  } catch (error) {
    console.error('Error fetching current weather:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get 24-hour forecast by location
router.get('/forecast/:location', authenticateToken, async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location || location.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Location parameter is required'
      });
    }
    
    console.log('Fetching forecast for location:', location);
    const weatherData = await weatherService.getWeatherForLocation(location);
    
    res.json({
      success: true,
      data: weatherData.forecast24h
    });
  } catch (error) {
    console.error('Error fetching 24-hour forecast:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get complete weather data (current + 24h forecast) by location
router.get('/complete/:location', authenticateToken, async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location || location.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Location parameter is required'
      });
    }
    
    console.log('Fetching complete weather data for location:', location);
    const weatherData = await weatherService.getWeatherForLocation(location);
    
    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Error fetching complete weather data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
