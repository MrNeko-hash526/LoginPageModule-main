// central router mounted by backend/index.js -> app.use('/api', routes)
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth/auth.routes');
const manageuserRoutes = require('./manageuser/manageuser.route');
const adduserRoutes = require('./adduser/add.route');  // Import adduser routes

router.use('/auth', authRoutes);  // Auth routes (login, etc.)
router.use('/manageuser', manageuserRoutes);  // FIXED: Manage user routes now on /manageuser
router.use('/adduser', adduserRoutes);  // FIXED: Add user routes now on /adduser

// Global error handler for the router (catches unhandled errors)
router.use((err, req, res, next) => {
  console.error('Router error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = router;