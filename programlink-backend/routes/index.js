// routes/index.js — Master router: mounts all feature routes under /api
const express = require('express');
const router = express.Router();

router.use('/auth',          require('./auth'));
router.use('/organizations', require('./organizations'));
router.use('/applications',  require('./applications'));
router.use('/documents',     require('./documents'));
router.use('/notifications', require('./notifications'));
router.use('/messages',      require('./messages'));
router.use('/meal-counts',   require('./mealCounts'));
router.use('/delivery',           require('./delivery'));
router.use('/kitchen-directory',  require('./kitchenDirectory'));
router.use('/stats',              require('./stats'));
router.use('/settings',           require('./settings'));
router.use('/users',              require('./users'));
router.use('/audit-log',          require('./auditLog'));
router.use('/compliance',              require('./compliance'));
router.use('/coordinator-assignments', require('./coordinatorAssignments'));
router.use('/claims',                  require('./claims'));
router.use('/delivery-plans',          require('./deliveryPlans'));
router.use('/warnings',                require('./warnings'));
router.use('/audit',                   require('./auditPublic'));

module.exports = router;
