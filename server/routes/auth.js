import express from "express";
import { ObjectId } from "mongodb";
import User from "../models/user.js";
import { generateToken, authenticateToken } from "../middleware/auth.js";
import passport from "../config/passport.js";
import { getDatabase } from "../db/connection.js";

const router = express.Router();

// POST /auth/register - Register a new user
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, jobName, isAdmin } = req.body;
    
    // Basic validation for required fields
    if (!firstName || !lastName || !email || !password || !jobName) {
      return res.status(400).json({ 
        error: "All fields are required: firstName, lastName, email, password, jobName" 
      });
    }
    
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      jobName,
      isAdmin: isAdmin || false // Default to false if not provided
    });
    
    // Generate JWT token
    const token = generateToken(newUser);
    
    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token: token
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/login - Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required" 
      });
    }
    
    // Authenticate user
    const user = await User.authenticate(email, password);
    
    if (!user) {
      return res.status(401).json({ 
        error: "Invalid email or password" 
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
      token: token
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /auth/profile/photo - Get current user's profile photo
router.get("/profile/photo", authenticateToken, async (req, res) => {
  try {
    console.log('Profile photo request from user:', req.user.id);
    const database = await getDatabase();
    if (!database) {
      return res.status(500).json({ error: "Database connection not available" });
    }

    const usersCollection = database.collection("users");
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ error: "User not found" });
    }

    console.log('User found:', { 
      id: user._id, 
      authProvider: user.authProvider, 
      hasAccessToken: !!user.microsoftAccessToken 
    });

    // If user has Microsoft access token, fetch their profile photo
    if (user.authProvider === "microsoft" && user.microsoftAccessToken) {
      try {
        console.log('Attempting to fetch Microsoft profile photo...');
        // First check if the token is still valid by making a test request
        const testResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: {
            Authorization: `Bearer ${user.microsoftAccessToken}`
          }
        });

        if (!testResponse.ok) {
          console.log('Microsoft token test failed:', testResponse.status, testResponse.statusText);
          // Token might be expired, return null
          return res.json({ profilePhotoUrl: null });
        }

        console.log('Microsoft token is valid, fetching photo...');
        // Fetch the profile photo
        const photoResponse = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
          headers: {
            Authorization: `Bearer ${user.microsoftAccessToken}`
          }
        });

        if (photoResponse.ok) {
          console.log('Profile photo fetched successfully');
          // Get the photo as a blob and convert to base64
          const photoBuffer = await photoResponse.arrayBuffer();
          const base64Photo = Buffer.from(photoBuffer).toString('base64');
          const contentType = photoResponse.headers.get('Content-Type') || 'image/jpeg';
          
          const profilePhotoUrl = `data:${contentType};base64,${base64Photo}`;
          return res.json({ profilePhotoUrl });
        } else {
          console.log('No profile photo available or access denied:', photoResponse.status, photoResponse.statusText);
          // No profile photo available or access denied
          return res.json({ profilePhotoUrl: null });
        }
      } catch (error) {
        console.error("Error fetching Microsoft profile photo:", error);
        return res.json({ profilePhotoUrl: null });
      }
    } else {
      console.log('User is not a Microsoft OAuth user or doesn\'t have a token');
      // User is not a Microsoft OAuth user or doesn't have a token
      return res.json({ profilePhotoUrl: null });
    }
  } catch (error) {
    console.error("Error fetching profile photo:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /auth/profile - Get current user profile (protected route)
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /auth/profile - Update current user profile (protected route)
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, jobName } = req.body;
    
    // Build update object with only provided fields
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (jobName) updateData.jobName = jobName;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: "At least one field must be provided for update" 
      });
    }
    
    const updatedUser = await User.updateById(req.user.id, updateData);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json({
      message: "Profile updated successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/change-password - Change user password (protected route)
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: "Current password and new password are required" 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: "New password must be at least 6 characters long" 
      });
    }
    
    // Get current user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if user is using Microsoft OAuth
    if (user.authProvider === "microsoft") {
      return res.status(400).json({ 
        error: "Cannot change password for Microsoft OAuth users" 
      });
    }
    
    // Verify current password
    const userInstance = new User(user);
    const isCurrentPasswordValid = await userInstance.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    
    // Hash new password and update
    const newUserInstance = new User({ ...user, password: newPassword });
    await newUserInstance.hashPassword();
    
    await User.updateById(req.user.id, { password: newUserInstance.password });
    
    res.status(200).json({
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /auth/microsoft - Initiate Microsoft OAuth login
router.get("/microsoft", passport.authenticate("microsoft", {
  scope: ["user.read"]
}));

// GET /auth/microsoft/callback - Handle Microsoft OAuth callback
router.get("/microsoft/callback", 
  passport.authenticate("microsoft", { failureRedirect: "/login?error=oauth_failed" }),
  async (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = generateToken(req.user);
      
      // Remove sensitive fields from response
      const { password, microsoftAccessToken, microsoftRefreshToken, ...userWithoutSecrets } = req.user;
      
      // Set the JWT token as an HTTP-only cookie for security
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Set user data in a separate cookie for frontend access (without sensitive data)
      res.cookie('userData', JSON.stringify(userWithoutSecrets), {
        httpOnly: false, // Allow frontend access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Create a temporary page that sets localStorage and redirects
      const redirectScript = `
        <html>
          <head>
            <title>Redirecting...</title>
          </head>
          <body>
            <div style="text-align: center; margin-top: 50px;">
              <h2>🔄 Completing login...</h2>
              <p>You will be redirected to the dashboard shortly.</p>
            </div>
            <script>
              // Set localStorage for React app compatibility
              localStorage.setItem('authToken', '${token}');
              localStorage.setItem('userData', '${JSON.stringify(userWithoutSecrets).replace(/'/g, "\\'")}');
              
              // Redirect to dashboard after setting localStorage
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1000);
            </script>
          </body>
        </html>
      `;
      
      res.send(redirectScript);
    } catch (error) {
      console.error("Error in Microsoft OAuth callback:", error);
      res.redirect('/login?error=oauth_processing_failed');
    }
  }
);

// POST /auth/microsoft/token - Exchange Microsoft access token for JWT (for mobile/SPA)
router.post("/microsoft/token", async (req, res) => {
  try {
    const { microsoftAccessToken } = req.body;
    
    if (!microsoftAccessToken) {
      return res.status(400).json({ error: "Microsoft access token required" });
    }
    
    // Verify Microsoft token by making a request to Microsoft Graph API
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${microsoftAccessToken}`
      }
    });
    
    if (!response.ok) {
      return res.status(401).json({ error: "Invalid Microsoft access token" });
    }
    
    const microsoftUser = await response.json();
    
    // Find or create user
    let user = await User.findByEmail(microsoftUser.mail || microsoftUser.userPrincipalName);
    
    if (!user) {
      // Create new user
      user = await User.create({
        microsoftId: microsoftUser.id,
        firstName: microsoftUser.givenName || microsoftUser.displayName.split(" ")[0] || "Unknown",
        lastName: microsoftUser.surname || microsoftUser.displayName.split(" ")[1] || "User",
        email: microsoftUser.mail || microsoftUser.userPrincipalName,
        password: "microsoft-oauth-" + Math.random().toString(36).substring(7),
        jobName: "Microsoft User",
        microsoftAccessToken: microsoftAccessToken,
        authProvider: "microsoft"
      });
    } else {
      // Update existing user with Microsoft info
      await User.updateById(user._id, {
        microsoftId: microsoftUser.id,
        microsoftAccessToken: microsoftAccessToken,
        authProvider: "microsoft"
      });
      user = await User.findById(user._id);
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Remove sensitive fields from response
    const { password, microsoftAccessToken: _, microsoftRefreshToken, ...userWithoutSecrets } = user;
    
    res.json({
      message: "Microsoft token exchange successful",
      user: userWithoutSecrets,
      token: token
    });
  } catch (error) {
    console.error("Error in Microsoft token exchange:", error);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

// GET /auth/me - Get current user info (for testing authentication)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Remove sensitive fields
    const { password, microsoftAccessToken: _, microsoftRefreshToken, ...userWithoutSecrets } = user;
    
    res.json({
      success: true,
      user: userWithoutSecrets
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

router.get("/check-role", authenticateToken, async (req, res) => {
    try {
        // Get fresh user data to ensure we have the latest role
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isAdmin: user.isAdmin
            },
            tokenUser: req.user
        });
    } catch (error) {
        console.error("Error checking role:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Temporary endpoint to set up admin user - REMOVE IN PRODUCTION
router.post("/setup-admin", async (req, res) => {
    try {
        const { email, makeAdmin } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        
        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.status(404).json({ error: "User not found with email: " + email });
        }
        
        // Update user role using the User model's update method
        const updateData = {
            role: makeAdmin ? 'admin' : 'user',
            isAdmin: makeAdmin || false
        };
        
        // Use the database directly since User model might not have findByIdAndUpdate
        const database = await getDatabase();
        const usersCollection = database.collection("users");
        
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: updateData }
        );
        
        res.json({
            success: true,
            message: `User ${email} ${makeAdmin ? 'promoted to admin' : 'set to regular user'}`,
            user: {
                email: user.email,
                role: updateData.role,
                isAdmin: updateData.isAdmin
            }
        });
        
    } catch (error) {
        console.error("Error setting up admin:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
});

export default router;
