// routes/stats.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/statsController');

router.get('/', authenticate, getDashboardStats);

module.exports = router;
