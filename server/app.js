import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport.js";
import reports from "./routes/reports.js";
import users from "./routes/users.js";
import auth from "./routes/auth.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve static files from public directory

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
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

// Basic route for testing
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Employee Records API" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;