// routes/documents.js
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  uploadMiddleware,
  listDocuments,
  uploadDocument,
  updateDocumentStatus,
  getExpiringDocuments,
} = require('../controllers/documentsController');

router.use(authenticate);

router.get('/',          listDocuments);
router.get('/expiring',  getExpiringDocuments);

// uploadMiddleware runs multer before the controller — parses the file from the form
router.post('/', uploadMiddleware, uploadDocument);

// Only coordinators and sponsors can approve/reject documents
router.patch('/:id/status', authorizeRoles('coordinator', 'sponsor'), updateDocumentStatus);

module.exports = router;
