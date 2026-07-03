// routes/messages.js
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { listThreads, getThread, createThread, replyToThread, broadcastMessage } = require('../controllers/messagesController');

router.use(authenticate);

router.get('/threads',                        listThreads);
router.get('/threads/:threadId',              getThread);
router.post('/threads',                       createThread);
router.post('/threads/:threadId/reply',       replyToThread);
router.post('/broadcast', authorizeRoles('sponsor', 'coordinator', 'admin'), broadcastMessage);

module.exports = router;
