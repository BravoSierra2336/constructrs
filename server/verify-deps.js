#!/usr/bin/env node

// Pre-build verification script for Render deployment
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);

console.log('🔍 Verifying server dependencies...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current directory:', process.cwd());

const requiredPackages = [
  'express',
  'cors',
  'mongodb',
  'pdfkit',
  'bcryptjs',
  'jsonwebtoken',
  'passport',
  'passport-microsoft',
  'openai',
  'dotenv',
  'canvas',
  'fontkit'
];

let allPackagesFound = true;

for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
    console.log(`✅ ${pkg} - Found`);
  } catch (error) {
    console.error(`❌ ${pkg} - NOT FOUND`);
    allPackagesFound = false;
  }
}

// Test pdfkit specifically
try {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();
  console.log('✅ PDFDocument instantiation - Success');
} catch (error) {
  console.error('❌ PDFDocument instantiation failed:', error.message);
  allPackagesFound = false;
}

// Test OpenAI specifically
try {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: 'test-key' });
  console.log('✅ OpenAI client instantiation - Success');
} catch (error) {
  console.error('❌ OpenAI client instantiation failed:', error.message);
  allPackagesFound = false;
}

// Test other critical packages
const criticalTests = [
  { name: 'bcryptjs', test: () => require('bcryptjs').hashSync('test', 10) },
  { name: 'jsonwebtoken', test: () => require('jsonwebtoken').sign({test: true}, 'secret') },
  { name: 'passport', test: () => require('passport') },
  { name: 'dotenv', test: () => require('dotenv') }
];

for (const { name, test } of criticalTests) {
  try {
    test();
    console.log(`✅ ${name} functionality - Success`);
  } catch (error) {
    console.error(`❌ ${name} functionality failed:`, error.message);
    allPackagesFound = false;
  }
}

if (allPackagesFound) {
  console.log('🎉 All dependencies verified successfully!');
  process.exit(0);
} else {
  console.error('💥 Some dependencies are missing!');
  process.exit(1);
}
