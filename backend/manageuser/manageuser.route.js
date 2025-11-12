const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  updateUserStatus, 
  softDeleteUser, 
  restoreUser, 
  hardDeleteUser,
  getUserRoles,
  assignUserRole,
  removeUserRole
} = require('./manageuser.controller');
const { authenticateJWT } = require('../auth/auth.middleware'); // Your existing JWT middleware
const { checkRole } = require('../middleware/checkRole'); // New role-checking middleware

// Define role checks
const adminOrManagerOnly = checkRole(['Admin', 'Executive', 'Manager']);
const adminOnly = checkRole(['Admin']);

// Get all users (Admin, Executive, or Manager)
router.get('/users', authenticateJWT, adminOrManagerOnly, getUsers);

// Toggle user status (Admin, Executive, or Manager)
router.patch('/users/:id/status', authenticateJWT, adminOrManagerOnly, updateUserStatus);

// Admin-only routes
router.delete('/users/:id', authenticateJWT, adminOnly, softDeleteUser);
router.patch('/users/:id/restore', authenticateJWT, adminOnly, restoreUser);
router.delete('/users/:id/hard', authenticateJWT, adminOnly, hardDeleteUser);
router.get('/users/:id/roles', authenticateJWT, adminOnly, getUserRoles);
router.post('/users/:id/roles', authenticateJWT, adminOnly, assignUserRole);
router.delete('/users/:id/roles/:roleId', authenticateJWT, adminOnly, removeUserRole);

module.exports = router;