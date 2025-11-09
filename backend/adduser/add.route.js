const express = require('express');
const router = express.Router();
const { 
  createUser,
  getUserGroups,
  getUsers,
  getCompanies,
  getRoles
} = require('./add.controller');
const { authenticateJWT, requireAdmin } = require('./add.middleware');

// Routes for add user functionality
router.post('/users', authenticateJWT, requireAdmin, createUser);
router.get('/user-groups', authenticateJWT, requireAdmin, getUserGroups);
router.get('/users', authenticateJWT, requireAdmin, getUsers);
router.get('/companies', authenticateJWT, requireAdmin, getCompanies);
router.get('/roles', authenticateJWT, requireAdmin, getRoles);

module.exports = router;