// routes/children.js — Child roster + enrollment compliance
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listChildren, createChild, updateChild, deleteChild,
  getChildrenSummary, getEnrollmentCompliance,
  submitEnrollmentForm, reviewEnrollmentForm,
} = require('../controllers/childrenController');

const sponsorOnly = authorizeRoles('sponsor', 'admin');

router.get('/summary',     authenticate, sponsorOnly, getChildrenSummary);
router.get('/compliance',  authenticate, sponsorOnly, getEnrollmentCompliance);
router.get('/',            authenticate,              listChildren);
router.post('/',           authenticate,              createChild);
router.put('/:id',         authenticate,              updateChild);
router.delete('/:id',      authenticate,              deleteChild);
router.post('/:id/submit', authenticate,              submitEnrollmentForm);
router.post('/:id/review', authenticate, sponsorOnly, reviewEnrollmentForm);

module.exports = router;
