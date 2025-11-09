const jwt = require('jsonwebtoken');
const { findUserById, parseUserTypes } = require('./auth.service');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

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
      id: user.user_id,  // Updated to match users table
      email: user.email,
      firstName: user.first_name,  // Updated column name
      lastName: user.last_name,    // Updated column name
      // Removed companyId as users are global (no company_id in users table)
      userTypes: await parseUserTypes(user.user_id),  // Fixed: Pass user_id, not user object
      // Removed userType and role as they don't exist in the new schema
    };

    // Add this debug log
    console.log('🔧 Authenticated user roles:', req.user.userTypes);
    
    next();
  } catch (err) {
    console.error('JWT middleware error:', err);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
}

module.exports = { authenticateJWT };