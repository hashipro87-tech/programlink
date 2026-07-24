// routes/training.js — Staff training & certification tracking
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listTrainings,
  getSummary,
  createTraining,
  updateTraining,
  deleteTraining,
} = require('../controllers/trainingController');

router.get('/summary', authenticate, getSummary);
router.get('/',        authenticate, listTrainings);
router.post('/',       authenticate, authorizeRoles('sponsor', 'admin', 'kitchen', 'site'), createTraining);
router.put('/:id',     authenticate, authorizeRoles('sponsor', 'admin', 'kitchen', 'site'), updateTraining);
router.delete('/:id',  authenticate, authorizeRoles('sponsor', 'admin'), deleteTraining);

module.exports = router;
