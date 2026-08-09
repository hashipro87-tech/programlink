// routes/attendance.js — Daily attendance records (Task #170)
const express    = require('express');
const router     = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listAttendance,
  upsertAttendance,
  deleteAttendance,
  compareAttendanceMeals,
} = require('../controllers/attendanceController');

router.use(authenticate);

router.get('/compare', authorizeRoles('sponsor', 'coordinator', 'site', 'admin'), compareAttendanceMeals);
router.get('/',        authorizeRoles('sponsor', 'coordinator', 'site', 'admin'), listAttendance);
router.post('/',       authorizeRoles('sponsor', 'site', 'admin'), upsertAttendance);
router.delete('/:id',  authorizeRoles('sponsor', 'site', 'admin'), deleteAttendance);

module.exports = router;
