const jwt = require('jsonwebtoken');
const { query } = require('../config/db');  // Add this import
const { 
  login, 
  selectRole, 
  findUserById,
  getRolesForCompany,
  parseUserTypes,
  buildAvailableCompanies
} = require('./auth.service');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// Validation middleware
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid input format'
    });
  }
  
  next();
};

// Updated: Handle login with optional companyId
const handleLogin = async (req, res) => {
  try {
    const { email, password, companyId } = req.body;  // Added companyId
    
    const result = await login(email, password, companyId, req);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// Handle role selection
const handleRoleSelection = async (req, res) => {
  try {
    const authUser = req.user; // From JWT middleware
    const { roleId, companyId } = req.body;
    
    if (!roleId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'roleId and companyId are required'
      });
    }

    const result = await selectRole(authUser.id, { roleId, companyId });
    
    res.json({
      success: true,
      message: result.message,
      user: result.user
    });
  } catch (error) {
    console.error('Role selection controller error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Role selection failed'
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const authUser = req.user; // From JWT middleware
    
    const user = await findUserById(authUser.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return sanitized user data
    const { password_hash, ...safeUser } = user;  // Updated to password_hash
    safeUser.userTypes = await parseUserTypes(user.user_id);  // Fixed: Pass user_id, not user object
    safeUser.availableCompanies = await buildAvailableCompanies(user.user_id);  // Added for completeness
    
    res.json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    console.error('Get profile controller error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to get profile'
    });
  }
};

// New: Get all roles for a user
const getUserRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const roles = await require('./auth.service').getUserRoles(id);
    res.json({ success: true, roles });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// New: Assign a role to a user
const assignUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, roleId } = req.body;
    if (!companyId || !roleId) {
      return res.status(400).json({ success: false, message: 'companyId and roleId are required' });
    }
    const result = await require('./auth.service').assignRole(id, companyId, roleId);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// New: Remove a role from a user
const removeUserRole = async (req, res) => {
  try {
    const { id, roleId } = req.params;
    const { companyId } = req.body;  // Assuming companyId in body for DELETE
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'companyId is required' });
    }
    const result = await require('./auth.service').removeRole(id, companyId, roleId);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// New: Get companies for email
const getCompaniesForEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    const companies = await require('./auth.service').getCompaniesForEmail(email);
    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fix the getUsersList function
const getUsersList = async (queryParams) => {
  try {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    
    // Validate inputs to prevent SQL injection
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('Invalid pagination parameters');
    }
    
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query('SELECT COUNT(*) as total FROM users WHERE bit_deleted_flag = 0');
    const totalUsers = countResult[0].total;

    // Get users with pagination - use template literals for LIMIT/OFFSET
    const users = await query(`
      SELECT 
        user_id as _id,
        first_name,
        last_name,
        email,
        phone_no,
        active_inactive_status,
        created_at
      FROM users 
      WHERE bit_deleted_flag = 0
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);  // No parameters array needed

    return {
      success: true,
      users: users,
      totalUsers: totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit)
    };
  } catch (error) {
    console.error('Error in getUsersList:', error);
    throw error;
  }
};

// Add this function after getUsersList

// Update user status
const updateUserStatus = async (userId, status) => {
  try {
    // Check if user exists
    const userCheck = await query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
    if (userCheck.length === 0) {
      throw new Error('User not found');
    }

    // Update status
    await query('UPDATE users SET active_inactive_status = ? WHERE user_id = ?', [status, userId]);

    return {
      success: true,
      message: `User status updated to ${status === 1 ? 'active' : 'inactive'}`
    };
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Add to module.exports
module.exports = {
  validateLogin,
  handleLogin,
  handleRoleSelection,
  getProfile,
  getUserRoles,
  assignUserRole,
  removeUserRole,
  getCompaniesForEmail,
  getUsersList,
  updateUserStatus  // Add this
};