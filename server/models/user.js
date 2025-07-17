import { ObjectId } from "mongodb";
import db from "../db/connection.js";
import bcrypt from "bcryptjs";

// User model class
class User {
  constructor({ 
    firstName, 
    lastName, 
    email, 
    password, 
    jobName, 
    isAdmin = false,
    microsoftId = null,
    microsoftAccessToken = null,
    microsoftRefreshToken = null,
    authProvider = "local",
    _id = null 
  }) {
    this._id = _id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.jobName = jobName;
    this.isAdmin = isAdmin;
    this.microsoftId = microsoftId;
    this.microsoftAccessToken = microsoftAccessToken;
    this.microsoftRefreshToken = microsoftRefreshToken;
    this.authProvider = authProvider;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Validate user data
  validate() {
    const errors = [];
    
    if (!this.firstName || this.firstName.trim().length < 2) {
      errors.push("First name must be at least 2 characters long");
    }
    
    if (!this.lastName || this.lastName.trim().length < 2) {
      errors.push("Last name must be at least 2 characters long");
    }
    
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push("Valid email address is required");
    }
    
    if (!this.password || this.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    
    if (!this.jobName || this.jobName.trim().length < 2) {
      errors.push("Job name must be at least 2 characters long");
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Email validation helper
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Hash password
  async hashPassword() {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  // Compare password
  async comparePassword(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
  }

  // Static method to authenticate user
  static async authenticate(email, password) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return null;
      }

      const userInstance = new User(user);
      const isMatch = await userInstance.comparePassword(password);
      
      if (isMatch) {
        return user;
      }
      return null;
    } catch (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
  }

  // Convert to plain object for database storage
  toDocument() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email.toLowerCase(),
      password: this.password,
      jobName: this.jobName,
      isAdmin: this.isAdmin,
      microsoftId: this.microsoftId,
      microsoftAccessToken: this.microsoftAccessToken,
      microsoftRefreshToken: this.microsoftRefreshToken,
      authProvider: this.authProvider,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Static methods for database operations
  static async findAll() {
    try {
      const collection = await db.collection("users");
      return await collection.find({}).toArray();
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const collection = await db.collection("users");
      const query = { _id: new ObjectId(id) };
      return await collection.findOne(query);
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const collection = await db.collection("users");
      const query = { email: email.toLowerCase() };
      return await collection.findOne(query);
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  static async findByMicrosoftId(microsoftId) {
    try {
      const collection = await db.collection("users");
      const query = { microsoftId: microsoftId };
      return await collection.findOne(query);
    } catch (error) {
      throw new Error(`Error finding user by Microsoft ID: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const user = new User(userData);
      const validation = user.validate();
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      // Check if email already exists
      const existingUser = await User.findByEmail(user.email);
      if (existingUser) {
        throw new Error("Email already exists");
      }

      // Hash password before saving
      await user.hashPassword();

      const collection = await db.collection("users");
      const result = await collection.insertOne(user.toDocument());
      
      // Return user without password
      const { password, ...userWithoutPassword } = user.toDocument();
      return {
        _id: result.insertedId,
        ...userWithoutPassword
      };
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async updateById(id, updateData) {
    try {
      const collection = await db.collection("users");
      const query = { _id: new ObjectId(id) };
      
      // Remove _id from update data if present
      const { _id, ...dataToUpdate } = updateData;
      dataToUpdate.updatedAt = new Date();
      
      const updates = { $set: dataToUpdate };
      const result = await collection.updateOne(query, updates);
      
      if (result.matchedCount === 0) {
        throw new Error("User not found");
      }
      
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  static async deleteById(id) {
    try {
      const collection = await db.collection("users");
      const query = { _id: new ObjectId(id) };
      const result = await collection.deleteOne(query);
      
      if (result.deletedCount === 0) {
        throw new Error("User not found");
      }
      
      return { message: "User deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }
}

export default User;