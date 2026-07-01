// routes/auth.js
const express = require('express');
const router = express.Router();
const { login, register, getMe, forgotPassword, resetPassword, verifyEmail, resendVerification, acceptInvite } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login',                login);
router.post('/register',             register);
router.post('/forgot-password',      forgotPassword);
router.post('/reset-password',       resetPassword);
router.get('/verify-email',          verifyEmail);
router.post('/resend-verification',  resendVerification);
router.post('/accept-invite',        acceptInvite);

router.get('/me', authenticate, getMe);

module.exports = router;
