// routes/children.js — Child roster CRUD
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listChildren,
  createChild,
  updateChild,
  deleteChild,
  getChildrenSummary,
} = require('../controllers/childrenController');

router.get('/summary', authenticate, authorizeRoles('sponsor', 'admin'), getChildrenSummary);
router.get('/',        authenticate, listChildren);
router.post('/',       authenticate, createChild);
router.put('/:id',     authenticate, updateChild);
router.delete('/:id',  authenticate, deleteChild);

module.exports = router;
