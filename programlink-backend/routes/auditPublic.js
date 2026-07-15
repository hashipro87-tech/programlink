// routes/auditPublic.js — Public audit endpoint (no auth required)
const express = require('express');
const router  = express.Router();
const { getAuditData } = require('../controllers/auditController');

router.get('/:token', getAuditData);  // GET /audit/:token

module.exports = router;
