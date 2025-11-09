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
const { authenticateJWT, requireAdmin, canManageUser, requireAdminOrManager } = require('./manageuser.middleware');

// Get all users (allow Manager or Admin to view)
router.get('/users', authenticateJWT, requireAdminOrManager, getUsers);

// Toggle user active/inactive status (allow Manager or Admin)
router.patch('/users/:id/status', authenticateJWT, requireAdminOrManager, canManageUser, updateUserStatus);

// Keep other routes admin-only or adjust as needed
router.delete('/users/:id', authenticateJWT, requireAdmin, canManageUser, softDeleteUser);
router.patch('/users/:id/restore', authenticateJWT, requireAdmin, restoreUser);
router.delete('/users/:id/hard', authenticateJWT, requireAdmin, canManageUser, hardDeleteUser);
router.get('/users/:id/roles', authenticateJWT, requireAdmin, getUserRoles);
router.post('/users/:id/roles', authenticateJWT, requireAdmin, assignUserRole);
router.delete('/users/:id/roles/:roleId', authenticateJWT, requireAdmin, removeUserRole);

module.exports = router;