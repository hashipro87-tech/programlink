// routes/organizations.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
} = require('../controllers/organizationsController');

// All org routes require a valid login
router.use(authenticate);

router.get('/',    listOrganizations);
router.get('/:id', getOrganization);

// Only sponsors and coordinators can create/update orgs
router.post('/',     authorizeRoles('sponsor', 'coordinator'), createOrganization);
router.patch('/:id', authorizeRoles('sponsor', 'coordinator'), updateOrganization);

module.exports = router;
