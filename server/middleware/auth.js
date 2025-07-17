import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Secret key for JWT - in production, use environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Generate JWT token
export const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isAdmin: user.isAdmin
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

// Middleware to check if user is admin
export const requireAdmin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data from database to ensure admin status is current
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Middleware to check if user is admin OR the user themselves
export const requireAdminOrSelf = async (req, res, next) => {
  try {
    // First check if user is authenticated
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    // Check if user is admin OR accessing their own data
    const isAdmin = user.isAdmin;
    const isAccessingOwnData = req.params.id === user._id.toString();
    
    if (!isAdmin && !isAccessingOwnData) {
      return res.status(403).json({ error: "Admin access required or access your own data only" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Middleware to check if user is authenticated (optional - doesn't throw error)
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// Define role hierarchy and permissions
const ROLE_PERMISSIONS = {
  admin: ["*"], // All permissions
  project_manager: [
    "project:create",
    "project:read",
    "project:update", 
    "project:delete",
    "project:assign",
    "user:read",
    "report:read",
    "report:create"
  ],
  supervisor: [
    "project:read",
    "project:update",
    "project:assign",
    "user:read",
    "report:read",
    "report:create"
  ],
  inspector: [
    "project:read",
    "report:read",
    "report:create",
    "report:update"
  ],
  employee: [
    "project:read",
    "report:read"
  ]
};

// Check if user has specific permission
export const hasPermission = (userRole, userPermissions, requiredPermission) => {
  // Admin has all permissions
  if (userRole === "admin") {
    return true;
  }
  
  // Check role-based permissions
  const rolePerms = ROLE_PERMISSIONS[userRole] || [];
  if (rolePerms.includes(requiredPermission)) {
    return true;
  }
  
  // Check user-specific permissions
  if (userPermissions && userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  return false;
};

// Middleware to check specific permissions
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated first
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get full user data to check role and permissions
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user has the required permission
      if (!hasPermission(user.role, user.permissions, permission)) {
        return res.status(403).json({ 
          error: "Insufficient permissions",
          required: permission,
          userRole: user.role
        });
      }

      // Add user role and permissions to request for further use
      req.user.role = user.role;
      req.user.permissions = user.permissions;
      
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

// Middleware to check if user can manage projects
export const canManageProjects = requirePermission("project:create");

// Middleware to check if user can assign projects  
export const canAssignProjects = requirePermission("project:assign");

// Middleware to check if user can update projects
export const canUpdateProjects = requirePermission("project:update");

// Middleware to check if user can delete projects
export const canDeleteProjects = requirePermission("project:delete");

// Middleware to require specific roles
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated first
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get full user data to check role
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Convert single role to array for easier checking
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Check if user's role is in the allowed roles
      if (!rolesArray.includes(user.role)) {
        return res.status(403).json({ 
          error: "Insufficient role permissions",
          required: rolesArray,
          userRole: user.role
        });
      }

      // Add user role to request for further use
      req.user.role = user.role;
      req.user.permissions = user.permissions;
      
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};
