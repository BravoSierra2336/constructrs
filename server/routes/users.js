import express from "express";
import User from "../models/user.js";
import { authenticateToken, requireAdmin, requireAdminOrSelf } from "../middleware/auth.js";

const router = express.Router();

// GET /users - Get all users (admin only)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    
    // Remove passwords from all users
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /users/email/:email - Get user by email (admin only) - Must come before /:id
router.get("/email/:email", requireAdmin, async (req, res) => {
  try {
    const user = await User.findByEmail(req.params.email);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /users/:id - Get a single user by ID (admin or self)
router.get("/:id", requireAdminOrSelf, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /users - Create a new user (admin only)
router.post("/", requireAdmin, async (req, res) => {
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
    
    res.status(201).json({
      message: "User created successfully",
      user: newUser
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ error: error.message });
  }
});

// PATCH /users/:id - Update a user by ID (admin or self, but only admin can change isAdmin)
router.patch("/:id", requireAdminOrSelf, async (req, res) => {
  try {
    const { firstName, lastName, email, password, jobName, isAdmin } = req.body;
    
    // Check if user is trying to change admin status
    if (isAdmin !== undefined && !req.user.isAdmin) {
      return res.status(403).json({ 
        error: "Only admins can change admin status" 
      });
    }
    
    // Build update object with only provided fields
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (password) {
      // If password is being updated, hash it
      const userInstance = new User({ password });
      await userInstance.hashPassword();
      updateData.password = userInstance.password;
    }
    if (jobName) updateData.jobName = jobName;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: "At least one field must be provided for update" 
      });
    }
    
    const updatedUser = await User.updateById(req.params.id, updateData);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json({
      message: "User updated successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /users/:id - Delete a user by ID (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const result = await User.deleteById(req.params.id);
    
    res.status(200).json({
      message: "User deleted successfully",
      result: result
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
