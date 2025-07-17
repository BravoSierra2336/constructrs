import passport from "passport";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import User from "../models/user.js";

// Microsoft OAuth configuration
const microsoftConfig = {
  clientID: process.env.MICROSOFT_CLIENT_ID || "your-microsoft-client-id",
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "your-microsoft-client-secret",
  callbackURL: process.env.MICROSOFT_CALLBACK_URL || "http://localhost:5050/auth/microsoft/callback",
  scope: ["user.read"],
  tenant: "common" // Use "common" for multi-tenant, or your specific tenant ID
};

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

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
