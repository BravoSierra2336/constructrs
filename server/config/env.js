import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Ensure all required environment variables are set with fallbacks
process.env.ATLAS_URI = process.env.ATLAS_URI || "mongodb+srv://sdv2336jr:Tin%40Estrada2336@construction.g9i7apw.mongodb.net/?retryWrites=true&w=majority&appName=construction";
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "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";
process.env.JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "your-session-secret-change-in-production";
process.env.MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || "383a3da9-8bca-422e-8e7d-43945ae7f06e";
process.env.MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || "b0dbcd04-95c8-426d-bc93-1acb3215a29b";
process.env.MICROSOFT_CALLBACK_URL = process.env.MICROSOFT_CALLBACK_URL || "http://localhost:5050/auth/microsoft/callback";

console.log('Environment configuration loaded:', {
  ATLAS_URI: process.env.ATLAS_URI ? 'SET' : 'NOT SET',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
  JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
  SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'NOT SET',
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID ? 'SET' : 'NOT SET',
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET ? 'SET' : 'NOT SET',
  MICROSOFT_CALLBACK_URL: process.env.MICROSOFT_CALLBACK_URL ? 'SET' : 'NOT SET'
});

export default {
  ATLAS_URI: process.env.ATLAS_URI,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  MICROSOFT_CALLBACK_URL: process.env.MICROSOFT_CALLBACK_URL
};
