const express = require('express');
const router = express.Router();
const { 
  createUser,
  getUserGroups,
  getContacts,
  getCompanies
} = require('./add.controller');
const { authenticateJWT, requireAdmin } = require('./add.middleware');

// Routes for add user functionality
router.post('/users', authenticateJWT, requireAdmin, createUser);
router.get('/user-groups', authenticateJWT, requireAdmin, getUserGroups);
router.get('/contacts', authenticateJWT, requireAdmin, getContacts);
router.get('/companies', authenticateJWT, requireAdmin, getCompanies);

module.exports = router;