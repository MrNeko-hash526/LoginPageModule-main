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
const { authenticateJWT, requireAdmin, canManageUser } = require('./manageuser.middleware');

// Get all users (admin only)
router.get('/users', authenticateJWT, requireAdmin, getUsers);

// Toggle user active/inactive status (admin only, cannot manage self)
router.patch('/users/:id/status', authenticateJWT, requireAdmin, canManageUser, updateUserStatus);

// Soft delete a user (admin only, cannot manage self)
router.delete('/users/:id', authenticateJWT, requireAdmin, canManageUser, softDeleteUser);

// Restore a soft-deleted user (admin only)
router.patch('/users/:id/restore', authenticateJWT, requireAdmin, restoreUser);

// Hard delete a user (admin only, cannot manage self)
router.delete('/users/:id/hard', authenticateJWT, requireAdmin, canManageUser, hardDeleteUser);

// Get all roles for a specific user (admin only)
router.get('/users/:id/roles', authenticateJWT, requireAdmin, getUserRoles);

// Assign a role to a user (admin only)
router.post('/users/:id/roles', authenticateJWT, requireAdmin, assignUserRole);

// Remove a role from a user (admin only)
router.delete('/users/:id/roles/:roleId', authenticateJWT, requireAdmin, removeUserRole);

module.exports = router;