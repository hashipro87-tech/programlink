// routes/activity.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { listActivity }  = require('../controllers/activityController');

router.get('/', authenticate, listActivity);

module.exports = router;
