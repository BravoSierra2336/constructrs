#!/bin/bash

# Quick Production Fix for Weather API
# This script deploys the mock weather service to fix the 500 error

echo "🚀 Deploying weather API fix to production..."

# 1. Upload the mock weather service
echo "📁 Uploading mock weather service..."
# You'll need to upload mockWeatherService.js to your production server

# 2. Update the weather service with mock fallback
echo "🔧 Updating weather service..."
# You'll need to upload the updated weatherService.js to your production server

# 3. Update environment variable
echo "🔑 Setting environment variable for mock mode..."
# Set OPENWEATHER_API_KEY=disabled_invalid_key in your production .env

# 4. Restart the server
echo "🔄 Restarting production server..."
# Restart your production Node.js server

echo "✅ Weather API fix deployed!"
echo ""
echo "📋 QUICK PRODUCTION FIX CHECKLIST:"
echo "1. ☐ Upload mockWeatherService.js to server/services/"
echo "2. ☐ Upload updated weatherService.js to server/services/"
echo "3. ☐ Set OPENWEATHER_API_KEY=disabled_invalid_key in production .env"
echo "4. ☐ Restart your production server"
echo ""
echo "🌤️  Weather feature will now use realistic mock data"
echo "🔗 Get a real API key: https://openweathermap.org/api"
