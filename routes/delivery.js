// routes/delivery.js
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listRoutes,
  getRoute,
  createRoute,
  updateRouteStatus,
  confirmStop,
  reportStopIssue,
} = require('../controllers/deliveryController');

router.use(authenticate);

router.get('/routes',      listRoutes);
router.get('/routes/:id',  getRoute);

// Only coordinators and sponsors create routes
router.post('/routes', authorizeRoles('coordinator', 'sponsor'), createRoute);

// Delivery providers and coordinators/sponsors can update route status
router.patch('/routes/:id/status', updateRouteStatus);

// Only delivery providers confirm stops and report issues
router.patch('/routes/:id/stops/:stopOrder/confirm', authorizeRoles('delivery'), confirmStop);
router.patch('/routes/:id/stops/:stopOrder/issue',   authorizeRoles('delivery'), reportStopIssue);

module.exports = router;
