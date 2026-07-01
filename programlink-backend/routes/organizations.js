// routes/organizations.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  inviteKitchen,
  inviteSite,
  inviteCoordinator,
} = require('../controllers/organizationsController');

// All org routes require a valid login
router.use(authenticate);

router.get('/',    listOrganizations);
router.get('/:id', getOrganization);

// Only sponsors and coordinators can create/update orgs
router.post('/',                   authorizeRoles('sponsor', 'coordinator', 'admin'), createOrganization);
router.post('/invite-kitchen',     authorizeRoles('sponsor', 'coordinator', 'admin'), inviteKitchen);
router.post('/invite-site',        authorizeRoles('sponsor', 'coordinator', 'admin'), inviteSite);
router.post('/invite-coordinator', authorizeRoles('sponsor', 'admin'),                inviteCoordinator);
router.patch('/:id',               authorizeRoles('sponsor', 'coordinator', 'admin'), updateOrganization);
router.delete('/:id',              authorizeRoles('sponsor', 'admin'),                deleteOrganization);

module.exports = router;
