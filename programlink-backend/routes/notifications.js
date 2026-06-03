// routes/notifications.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { listNotifications, markRead, markAllRead } = require('../controllers/notificationsController');

router.use(authenticate);

router.get('/',                  listNotifications);
router.patch('/read-all',        markAllRead);       // must be before /:id
router.patch('/:id/read',        markRead);

module.exports = router;
