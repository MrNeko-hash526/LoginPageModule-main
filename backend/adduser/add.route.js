const express = require('express');
const router = express.Router();
const { createUser, getUserGroups, getUsers, getCompanies, getRoles, updateUser } = require('./add.controller');
const { authenticateJWT } = require('../auth/auth.middleware'); // Use global JWT middleware
const { checkRole } = require('../middleware/checkRole'); // New role-checking middleware

// All these routes require Admin, Executive, or Manager roles
const adminOrManagerOnly = checkRole(['Admin', 'Executive', 'Manager']);

router.post('/create-user', authenticateJWT, adminOrManagerOnly, createUser);
router.put('/users/:id/update', authenticateJWT, adminOrManagerOnly, updateUser);
router.get('/user-groups', authenticateJWT, adminOrManagerOnly, getUserGroups);
router.get('/users', authenticateJWT, adminOrManagerOnly, getUsers);
router.get('/companies', authenticateJWT, adminOrManagerOnly, getCompanies);
router.get('/roles', authenticateJWT, adminOrManagerOnly, getRoles);

// Debug route (optional - remove in production)
router.get('/debug/auth', authenticateJWT, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;