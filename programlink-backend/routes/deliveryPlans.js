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
  getKitchenProduction,
  bulkCreatePlans,
  getTodayDeliveries,
  notifyKitchen,
} = require('../controllers/deliveryPlansController');

router.use(authenticate);

// Sponsor + Coordinator: manage/view plans
router.get('/',           authorizeRoles('sponsor', 'coordinator', 'admin'),          listPlans);
router.post('/',          authorizeRoles('sponsor', 'admin'),                         createPlan);
router.post('/bulk',      authorizeRoles('sponsor', 'admin'),                         bulkCreatePlans);
router.patch('/:id',      authorizeRoles('sponsor', 'admin'),                         updatePlan);
router.delete('/:id',     authorizeRoles('sponsor', 'admin'),                         deletePlan);

// Sponsor + Coordinator: today's (or any date's) delivery checklist
router.get('/today',      authorizeRoles('sponsor', 'coordinator', 'admin'),          getTodayDeliveries);

// Sponsor + Coordinator: manually send today's list to a kitchen
router.post('/notify-kitchen', authorizeRoles('sponsor', 'coordinator', 'admin'),    notifyKitchen);

// Site: view upcoming delivery schedule from plans
router.get('/schedule',   authorizeRoles('site', 'coordinator', 'sponsor'),           getSiteSchedule);

// Kitchen: today's production list
router.get('/production', authorizeRoles('kitchen', 'coordinator', 'sponsor'),        getKitchenProduction);

// Update a single instance (skip, deliver, qty override, etc.)
router.patch('/instances/:instanceId', updateInstance);

module.exports = router;
