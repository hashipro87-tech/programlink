// routes/deliveryPlans.js — Recurring Delivery Plans API
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getSiteSchedule,
  updateInstance,
} = require('../controllers/deliveryPlansController');

router.use(authenticate);

// Sponsor: manage plans
router.get('/',           authorizeRoles('sponsor', 'admin'),                listPlans);
router.post('/',          authorizeRoles('sponsor', 'admin'),                createPlan);
router.patch('/:id',      authorizeRoles('sponsor', 'admin'),                updatePlan);
router.delete('/:id',     authorizeRoles('sponsor', 'admin'),                deletePlan);

// Site: view upcoming delivery schedule from plans
router.get('/schedule',   authorizeRoles('site', 'coordinator', 'sponsor'),  getSiteSchedule);

// Update a single instance (skip, deliver, etc.)
router.patch('/instances/:instanceId', updateInstance);

module.exports = router;
