// central router mounted by backend/index.js -> app.use('/api', routes)
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth/auth.routes');
const manageuserRoutes = require('./manageuser/manageuser.route');

router.use('/auth', authRoutes);
router.use('/auth', manageuserRoutes);

// Add global error handler for the router (catches unhandled errors)
router.use((err, req, res, next) => {
  console.error('Router error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = router;