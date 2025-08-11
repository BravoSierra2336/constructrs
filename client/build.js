const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting build process...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

try {
  // Ensure we're in the right directory
  process.chdir(__dirname);
  
  console.log('Current directory:', process.cwd());
  console.log('Contents:', fs.readdirSync('.'));
  
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm ci', { stdio: 'inherit' });
  
  // Verify critical packages
  console.log('Verifying packages...');
  try {
    require.resolve('@vitejs/plugin-react');
    console.log('✓ @vitejs/plugin-react found');
  } catch (e) {
    console.error('✗ @vitejs/plugin-react not found');
    throw e;
  }
  
  try {
    require.resolve('vite');
    console.log('✓ vite found');
  } catch (e) {
    console.error('✗ vite not found');
    throw e;
  }
  
  // Build the project
  console.log('Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
  
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
