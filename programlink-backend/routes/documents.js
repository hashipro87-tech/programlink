// routes/documents.js
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  uploadMiddleware,
  listDocuments,
  uploadDocument,
  requestDocument,
  updateDocumentStatus,
  getExpiringDocuments,
} = require('../controllers/documentsController');

router.use(authenticate);

router.get('/',         listDocuments);
router.get('/expiring', getExpiringDocuments);

// uploadMiddleware runs multer before the controller — parses the file from the form
router.post('/', uploadMiddleware, uploadDocument);

// Sponsors/coordinators/admins can request a document from an org
router.post('/request', authorizeRoles('sponsor', 'coordinator', 'admin'), requestDocument);

// Coordinators, sponsors, and admins can approve/reject documents
router.patch('/:id/status', authorizeRoles('coordinator', 'sponsor', 'admin'), updateDocumentStatus);

module.exports = router;
