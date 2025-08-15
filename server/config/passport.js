import { createRequire } from 'module';
import User from "../models/user.js";

const require = createRequire(import.meta.url);
const passport = require("passport");
const { Strategy: MicrosoftStrategy } = require("passport-microsoft");

// Microsoft OAuth configuration
const microsoftConfig = {
  clientID: process.env.MICROSOFT_CLIENT_ID || "your-microsoft-client-id",
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "your-microsoft-client-secret",
  callbackURL: process.env.NODE_ENV === 'production' 
    ? "https://constructrs.onrender.com/auth/microsoft/callback"
    : process.env.MICROSOFT_CALLBACK_URL || "http://localhost:5050/auth/microsoft/callback",
  scope: ["user.read", "user.readbasic.all"],
  tenant: "common" // Use "common" for multi-tenant, or your specific tenant ID
};

console.log('Microsoft OAuth Config:', {
  environment: process.env.NODE_ENV,
  callbackURL: microsoftConfig.callbackURL,
  hasClientId: !!microsoftConfig.clientID,
  hasClientSecret: !!microsoftConfig.clientSecret
});

// Configure Microsoft Strategy
passport.use(
  new MicrosoftStrategy(
    microsoftConfig,
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Microsoft ID
        const existingUser = await User.findByEmail(profile.emails[0].value);
        
        if (existingUser) {
          // User exists, update Microsoft info if needed
          const updatedUser = await User.updateById(existingUser._id, {
            microsoftId: profile.id,
            microsoftAccessToken: accessToken,
            microsoftRefreshToken: refreshToken,
            authProvider: "microsoft" // Mark as Microsoft OAuth user
          });
          console.log(`Existing user logged in via Microsoft: ${updatedUser.email}`);
          return done(null, updatedUser);
        } else {
          // Create new user from Microsoft profile
          const newUser = await User.create({
            microsoftId: profile.id,
            firstName: profile.name.givenName || profile.displayName.split(" ")[0] || "Unknown",
            lastName: profile.name.familyName || profile.displayName.split(" ")[1] || "User",
            email: profile.emails[0].value,
            password: "microsoft-oauth-" + Math.random().toString(36).substring(7), // Random password for OAuth users
            jobName: profile.jobTitle || "Microsoft User", // Use job title from Microsoft if available
            role: "employee", // Default role for new Microsoft users
            microsoftAccessToken: accessToken,
            microsoftRefreshToken: refreshToken,
            authProvider: "microsoft"
          });
          
          console.log(`New Microsoft user created: ${newUser.email} with role: ${newUser.role}`);
          return done(null, newUser);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Stateless: no session serialize/deserialize

export default passport;
