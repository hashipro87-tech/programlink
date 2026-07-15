const express    = require('express');
const router     = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { getClaim, getClaimHistory, getStates } = require('../controllers/claimsController');
const { exportClaim }      = require('../controllers/claimsExportController');
const { createAuditToken } = require('../controllers/auditController');

// All claim routes require sponsor auth
router.use(authenticate);
router.use(authorizeRoles('sponsor', 'admin'));

router.get('/',        getClaim);          // GET /claims?month=2026-07
router.get('/history', getClaimHistory);   // GET /claims/history
router.get('/states',  getStates);         // GET /claims/states
router.get('/export',       exportClaim);       // GET /claims/export?month=2026-07 → PDF
router.post('/audit-token', createAuditToken); // POST /claims/audit-token → { token, url }

module.exports = router;
