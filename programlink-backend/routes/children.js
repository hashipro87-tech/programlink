// routes/children.js — Child roster + enrollment compliance
const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listChildren, createChild, updateChild, deleteChild,
  getChildrenSummary, getEnrollmentCompliance,
  submitEnrollmentForm, reviewEnrollmentForm,
  extractEnrollment, confirmImport,
} = require('../controllers/childrenController');

const sponsorOnly = authorizeRoles('sponsor', 'admin');

// Multer: keep file in memory (no disk write), max 10 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'].includes(file.mimetype);
    cb(ok ? null : new Error('Only PDF or image files are accepted'), ok);
  },
});

router.get('/summary',            authenticate, sponsorOnly, getChildrenSummary);
router.get('/compliance',         authenticate, sponsorOnly, getEnrollmentCompliance);
router.post('/import/extract',    authenticate, upload.single('file'), extractEnrollment);
router.post('/import/confirm',    authenticate,              confirmImport);
router.get('/',                   authenticate,              listChildren);
router.post('/',                  authenticate,              createChild);
router.put('/:id',                authenticate,              updateChild);
router.delete('/:id',             authenticate,              deleteChild);
router.post('/:id/submit',        authenticate,              submitEnrollmentForm);
router.post('/:id/review',        authenticate, authorizeRoles('sponsor', 'coordinator', 'admin'), reviewEnrollmentForm);

module.exports = router;
