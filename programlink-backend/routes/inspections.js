// routes/inspections.js — CACFP monitoring visit tracker
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listInspections, listFindings, createInspection, updateInspection, deleteInspection,
  createFinding, updateFinding, deleteFinding, getSummary,
} = require('../controllers/inspectionsController');

const canWrite = authorizeRoles('sponsor', 'coordinator', 'admin');

router.get('/summary',                  authenticate, getSummary);
router.get('/',                         authenticate, listInspections);
router.post('/',                        authenticate, canWrite, createInspection);
router.put('/:id',                      authenticate, canWrite, updateInspection);
router.delete('/:id',                   authenticate, canWrite, deleteInspection);
router.get('/:id/findings',             authenticate, listFindings);
router.post('/:id/findings',            authenticate, canWrite, createFinding);
router.put('/findings/:finding_id',     authenticate, canWrite, updateFinding);
router.delete('/findings/:finding_id',  authenticate, canWrite, deleteFinding);

module.exports = router;
