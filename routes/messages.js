// routes/messages.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { listThreads, getThread, createThread, replyToThread } = require('../controllers/messagesController');

router.use(authenticate);

router.get('/threads',                        listThreads);
router.get('/threads/:threadId',              getThread);
router.post('/threads',                       createThread);
router.post('/threads/:threadId/reply',       replyToThread);

module.exports = router;
