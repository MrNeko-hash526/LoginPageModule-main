const express = require('express');
const router = express.Router();
const { 
  validateLogin, 
  handleLogin, 
  handleRoleSelection, 
  getProfile,
  getUserRoles,
  assignUserRole,
  removeUserRole,
  getCompaniesForEmail,
  getUsersList  // Add this import
} = require('./auth.controller');
const { authenticateJWT } = require('./auth.middleware');

router.post('/login', validateLogin, handleLogin);
router.get('/companies-for-email', getCompaniesForEmail);
// Updated: Remove authenticateJWT from select-role since no token is available yet
router.post('/select-role', handleRoleSelection);
router.get('/me', authenticateJWT, getProfile);

// New: Users listing route with role-based access
router.get('/users', authenticateJWT, async (req, res) => {
  try {
    const authUser = req.user;
    
    console.log('🔧 User accessing /users:', authUser.email, 'Roles:', authUser.userTypes);
    
    // Check if user has Admin or Manager role
    if (!authUser.userTypes || 
        (!authUser.userTypes.includes('Admin') && !authUser.userTypes.includes('Manager'))) {
      console.log('🔧 Access denied for user:', authUser.email);
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or Manager role required.' 
      });
    }

    console.log('🔧 Fetching users with params:', req.query);
    const result = await getUsersList(req.query);
    console.log('🔧 Users fetched successfully:', result.users?.length || 0);
    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: error.message || 'Failed to get users' 
    });
  }
});

// Existing CRUD routes for user_roles...
router.get('/users/:id/roles', authenticateJWT, getUserRoles);
router.post('/users/:id/roles', authenticateJWT, assignUserRole);
router.delete('/users/:id/roles/:roleId', authenticateJWT, removeUserRole);

// Get roles for specific company (for the authenticated user)
router.get('/companies/:companyId/roles', authenticateJWT, async (req, res) => {
  const authUser = req.user;
  const { companyId } = req.params;

  if (!authUser) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  // Validate companyId as a number
  if (!companyId || isNaN(companyId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid company ID' 
    });
  }

  try {
    const { getRolesForCompany } = require('./auth.service');
    const result = await getRolesForCompany(authUser.id, parseInt(companyId, 10));
    return res.json(result);
  } catch (err) {
    console.error('Get company roles error:', err);
    return res.status(err.status || 500).json({ 
      success: false, 
      message: err.message || 'Failed to get company roles' 
    });
  }
});

// Add this route for password creation
router.post('/set-password', async (req, res) => {
  try {
    const addService = require('../adduser/add.service');
    const result = await addService.setPassword(req.body.email, req.body.token, req.body.newPassword);
    res.json(result);
  } catch (error) {
    console.error('Error setting password:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update user status (Admin only)
router.patch('/users/:id/status', authenticateJWT, async (req, res) => {
  try {
    const authUser = req.user;
    const { id } = req.params;
    const { status } = req.body; // 0 for inactive, 1 for active
    
    // Check if user has Admin role (only Admin can change status)
    if (!authUser.userTypes || !authUser.userTypes.includes('Admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required to change user status.' 
      });
    }

    // Validate status
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Use 0 for inactive, 1 for active.' 
      });
    }

    console.log('🔧 Updating user status:', { userId: id, status, updatedBy: authUser.email });
    const result = await updateUserStatus(id, status);
    res.json(result);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: error.message || 'Failed to update user status' 
    });
  }
});

module.exports = router;