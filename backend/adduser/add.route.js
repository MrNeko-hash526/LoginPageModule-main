const express = require('express');
const router = express.Router();
const { createUser, getUserGroups, getUsers, getCompanies, getRoles, updateUser } = require('./add.controller');
const { authenticateJWT, requireAdminOrManager } = require('./add.middleware');

router.post('/create-user', authenticateJWT, requireAdminOrManager, createUser);
router.put('/users/:id/update', authenticateJWT, requireAdminOrManager, updateUser);  // Add this route
router.get('/user-groups', authenticateJWT, requireAdminOrManager, getUserGroups);
router.get('/users', authenticateJWT, requireAdminOrManager, getUsers);
router.get('/companies', authenticateJWT, requireAdminOrManager, getCompanies);
router.get('/roles', authenticateJWT, requireAdminOrManager, getRoles);

// Debug route to inspect token / roles
router.get('/debug/auth', authenticateJWT, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;