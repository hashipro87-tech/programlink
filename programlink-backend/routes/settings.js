// routes/settings.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { getSettings, updateProfile, updatePassword, updateOrganization } = require('../controllers/settingsController');

router.use(authenticate);

router.get('/',                   getSettings);
router.patch('/profile',          updateProfile);
router.patch('/password',         updatePassword);
router.patch('/organization',     updateOrganization);

module.exports = router;
