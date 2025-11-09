const express = require('express');
const router = express.Router();
const { 
  createUser,
  getUserGroups,
  getUsers,  // Changed from getContacts
  getCompanies
} = require('./add.controller');
const { authenticateJWT, requireAdmin } = require('./add.middleware');

// Routes for add user functionality
router.post('/users', authenticateJWT, requireAdmin, createUser);
router.get('/user-groups', authenticateJWT, requireAdmin, getUserGroups);
router.get('/users', authenticateJWT, requireAdmin, getUsers);  // Changed from /contacts and getContacts
router.get('/companies', authenticateJWT, requireAdmin, getCompanies);

module.exports = router;