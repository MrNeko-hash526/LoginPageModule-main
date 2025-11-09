const jwt = require('jsonwebtoken');
const { findUserById, parseUserTypes } = require('../auth/auth.service');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// JWT Authentication Middleware (similar to auth.middleware.js)
async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user data using user_id
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Set req.user with sanitized user data and parsed userTypes
    req.user = {
      id: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userTypes: await parseUserTypes(user.user_id)
    };

    next();
  } catch (err) {
    console.error('JWT middleware error in manageuser:', err);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
}

// Role-Based Access Control Middleware (e.g., require admin role)
async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const userTypes = (req.user.userTypes || []).map(t => String(t).toLowerCase());
  if (!userTypes.includes('admin')) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  next();
}

// New: allow Admin OR Manager
async function requireAdminOrManager(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const userTypes = (req.user.userTypes || []).map(t => String(t).toLowerCase());
  if (!userTypes.includes('admin') && !userTypes.includes('manager')) {
    return res.status(403).json({ success: false, message: 'Admin or Manager access required' });
  }

  next();
}

// Optional: Middleware to check if user can manage specific user (e.g., not self or higher role)
async function canManageUser(req, res, next) {
  const { id } = req.params; // User ID being managed
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Prevent self-management for sensitive actions (e.g., delete)
  if (parseInt(id) === req.user.id) {
    return res.status(403).json({ success: false, message: 'Cannot manage your own account' });
  }

  // Additional checks can be added here (e.g., role hierarchy)
  next();
}

module.exports = { authenticateJWT, requireAdmin, canManageUser, requireAdminOrManager };