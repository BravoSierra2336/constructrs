import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const dotenv = require('dotenv');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (server/.env)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const IS_PROD = process.env.NODE_ENV === 'production';

// Minimal, safe log in development only
if (!IS_PROD) {
  console.log('Environment configuration loaded');
}

export default {
  ATLAS_URI: process.env.ATLAS_URI,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  MICROSOFT_CALLBACK_URL: process.env.MICROSOFT_CALLBACK_URL,
  FRONTEND_URL: process.env.FRONTEND_URL
};
