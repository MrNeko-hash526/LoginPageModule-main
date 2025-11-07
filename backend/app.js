// central router mounted by backend/index.js -> app.use('/api', routes)
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth/auth.routes');

router.use('/auth', authRoutes);

module.exports = router;