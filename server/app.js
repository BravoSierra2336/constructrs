import { createRequire } from 'module';
import passport from "./config/passport.js";
import reports from "./routes/reports.js";
import users from "./routes/users.js";
import auth from "./routes/auth.js";
import ai from "./routes/ai.js";
import projects from "./routes/projects.js";
import admin from "./routes/admin.js";
import weather from "./routes/weather.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from './db/connection.js';

const require = createRequire(import.meta.url);
const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Sessions removed (stateless JWT)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));
const isProd = process.env.NODE_ENV === 'production';
const defaultProdOrigin = process.env.FRONTEND_URL || 'https://constructrs.onrender.com';

const corsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin or non-browser requests
    if (!origin) return callback(null, true);

    try {
      const url = new URL(origin);
      // Allow any localhost/127.0.0.1 port in development
      if (!isProd && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        return callback(null, true);
      }
    } catch (e) {
      // If origin isn't a valid URL, deny explicitly
      return callback(new Error('Not allowed by CORS'));
    }

    // In production, allow only the configured frontend URL
    if (isProd && origin === defaultProdOrigin) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
// Explicitly handle preflight
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.static("public")); // Serve static files from public directory

// Serve React build files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Basic rate limiting for auth and login-related routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(['/auth', '/login', '/register'], authLimiter);

// NOTE: Sessions are disabled to keep the app stateless with JWT. If you
// restore Microsoft OAuth sessions, re-enable this block.

// Passport middleware (stateless)
app.use(passport.initialize());

// Routes
app.use("/reports", reports);
app.use("/users", users);
app.use("/auth", auth);
app.use("/ai", ai);
app.use("/projects", projects);
app.use("/admin", admin);
app.use("/weather", weather);

// 404 for API routes
app.use(['/auth', '/users', '/reports', '/projects', '/admin', '/weather', '/ai'], (req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: 'Not found' });
  }
});

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// SPA fallback for client-side routing (only if index exists)
app.get('*', (req, res, next) => {
  const indexPath = path.join(__dirname, '../client/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;