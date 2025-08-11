#!/bin/bash
set -e

echo "Starting build process..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Clean install
echo "Installing dependencies..."
npm ci --verbose

# Verify critical dependencies
echo "Verifying @vitejs/plugin-react..."
npm list @vitejs/plugin-react

echo "Verifying vite..."
npm list vite

# Build the project
echo "Building project..."
npm run build

echo "Build completed successfully!"
