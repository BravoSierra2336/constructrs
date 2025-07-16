import express from "express";
import User from "../models/user.js";
import { generateToken, authenticateToken } from "../middleware/auth.js";
import passport from "../config/passport.js";

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
  passport.authenticate("microsoft", { failureRedirect: "/auth/login?error=oauth_failed" }),
  async (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = generateToken(req.user);
      
      // Remove sensitive fields from response
      const { password, microsoftAccessToken, microsoftRefreshToken, ...userWithoutSecrets } = req.user;
      
      // In production, you might want to redirect to your frontend with the token
      // For now, we'll return JSON response
      res.json({
        message: "Microsoft OAuth login successful",
        user: userWithoutSecrets,
        token: token
      });
    } catch (error) {
      console.error("Error in Microsoft OAuth callback:", error);
      res.status(500).json({ error: "OAuth authentication failed" });
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

export default router;
