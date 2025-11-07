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
  getCompaniesForEmail  // Added
} = require('./auth.controller');
const { authenticateJWT } = require('./auth.middleware');

router.post('/login', validateLogin, handleLogin);
router.get('/companies-for-email', getCompaniesForEmail);  // Added
router.post('/select-role', authenticateJWT, handleRoleSelection);
router.get('/me', authenticateJWT, getProfile);

// New: CRUD routes for user_roles
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

module.exports = router;