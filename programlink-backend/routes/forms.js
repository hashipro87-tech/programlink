// routes/forms.js — Form pre-fill + PDF generation
'use strict';

const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { listTemplates, getFormData, generateFormPDF } = require('../controllers/formsController');

router.get('/templates',         authenticate, listTemplates);
router.get('/data/:orgId',       authenticate, getFormData);
router.get('/pdf/:orgId',        authenticate, generateFormPDF);

// Convenience: no orgId param (uses requester's own org)
router.get('/data',              authenticate, (req, res) => {
  req.params.orgId = req.user.organizationId;
  return getFormData(req, res);
});
router.get('/pdf',               authenticate, (req, res) => {
  req.params.orgId = req.user.organizationId;
  return generateFormPDF(req, res);
});

module.exports = router;
