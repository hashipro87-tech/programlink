// routes/renewals.js — Annual renewal wizard
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listRenewals,
  getRenewal,
  createRenewal,
  updateRenewal,
  updateItem,
  getSiteRenewals,
} = require('../controllers/renewalsController');

// Site: get active renewals assigned to their site
router.get('/site', authenticate, authorizeRoles('site'), getSiteRenewals);

// Sponsor CRUD
router.get('/',    authenticate, authorizeRoles('sponsor', 'admin'), listRenewals);
router.post('/',   authenticate, authorizeRoles('sponsor', 'admin'), createRenewal);
router.get('/:id', authenticate, authorizeRoles('sponsor', 'admin'), getRenewal);
router.put('/:id', authenticate, authorizeRoles('sponsor', 'admin'), updateRenewal);

// Item completion — sponsor or site
router.put('/items/:id', authenticate, authorizeRoles('sponsor', 'admin', 'site'), updateItem);

module.exports = router;
