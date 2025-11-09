const jwt = require('jsonwebtoken');
const { findUserById, parseUserTypes } = require('../auth/auth.service');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success:false, message: 'Access token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);
    if (!user) return res.status(401).json({ success:false, message: 'User not found' });
    req.user = {
      id: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userTypes: (await parseUserTypes(user.user_id)) || []
    };
    console.log('AddUser auth:', req.user.email, req.user.userTypes);
    next();
  } catch (err) {
    console.error('JWT middleware error in adduser:', err);
    return res.status(401).json({ success:false, message: 'Invalid or expired token' });
  }
}

// Allow Admin OR Manager (case-insensitive)
async function requireAdminOrManager(req, res, next) {
  if (!req.user) return res.status(401).json({ success:false, message: 'Authentication required' });
  const userTypes = (req.user.userTypes || []).map(t => String(t).toLowerCase());
  if (!userTypes.includes('admin') && !userTypes.includes('manager')) {
    console.log('AddUser access denied:', req.user.email, 'roles:', req.user.userTypes);
    return res.status(403).json({ success:false, message: 'Admin or Manager access required' });
  }
  next();
}

module.exports = { authenticateJWT, requireAdminOrManager };