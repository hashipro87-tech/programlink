// routes/applications.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listApplications,
  getApplication,
  createApplication,
  updateStatus,
} = require('../controllers/applicationsController');

router.use(authenticate);

router.get('/',     listApplications);
router.get('/:id',  getApplication);

// Any logged-in applicant role can start an application
router.post('/', authorizeRoles('kitchen', 'site', 'delivery'), createApplication);

// All roles can trigger status updates (controller enforces the specific transition rules)
router.patch('/:id/status', updateStatus);

module.exports = router;
