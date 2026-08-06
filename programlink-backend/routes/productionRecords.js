// routes/productionRecords.js — CACFP meal production records
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listRecords, getRecord, upsertRecord, updateRecord, deleteRecord,
  autoFill, upsertItem, deleteItem, getSummary, prefillPreview,
} = require('../controllers/productionRecordsController');

const canWrite = authorizeRoles('sponsor', 'coordinator', 'kitchen', 'admin');

// Specific routes before /:id
router.get('/summary',    authenticate, getSummary);
router.get('/prefill',    authenticate, prefillPreview);
router.post('/auto-fill', authenticate, canWrite, autoFill);

// Core CRUD
router.get('/',    authenticate, listRecords);
router.get('/:id', authenticate, getRecord);
router.post('/',   authenticate, canWrite, upsertRecord);
router.put('/:id',    authenticate, canWrite, updateRecord);
router.delete('/:id', authenticate, canWrite, deleteRecord);

// Items
router.post('/:id/items',        authenticate, canWrite, upsertItem);
router.delete('/items/:item_id', authenticate, canWrite, deleteItem);

module.exports = router;
