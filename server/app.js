import { createRequire } from 'module';
import passport from "./config/passport.js";
import reports from "./routes/reports.js";
import users from "./routes/users.js";
import auth from "./routes/auth.js";
import ai from "./routes/ai.js";
import projects from "./routes/projects.js";
import admin from "./routes/admin.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from './db/connection.js';

const require = createRequire(import.meta.url);
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve static files from public directory

// Serve React build files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.ATLAS_URI,
    dbName: 'Construction',
    collectionName: 'sessions',
    touchAfter: 24 * 3600, // Lazy session update (24 hours)
    autoRemove: 'native', // Default
    autoRemoveInterval: 10 // In minutes
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/reports", reports);
app.use("/users", users);
app.use("/auth", auth);
app.use("/ai", ai);
app.use("/projects", projects);
app.use("/admin", admin);

// Serve React app for non-API routes (must be after API routes)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;