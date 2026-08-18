// routes/menuCycles.js — reusable rotating menu cycles
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getCurrentCycle,
  listCycles, createCycle, updateCycle, deleteCycle,
  assignWeekMenu,
  listSchedules, applySchedule, removeSchedule,
  resolveMenuForDate,
} = require('../controllers/menuCyclesController');

const canWrite = authorizeRoles('sponsor', 'coordinator', 'admin');

// ── Specific routes BEFORE /:id ────────────────────────────────────────────────
router.get('/current',               authenticate, getCurrentCycle);
router.get('/schedules',             authenticate, listSchedules);
router.delete('/schedules/:schedule_id', authenticate, canWrite, removeSchedule);
router.get('/resolve',               authenticate, resolveMenuForDate);

// ── Core CRUD ─────────────────────────────────────────────────────────────────
router.get('/',      authenticate, listCycles);
router.post('/',     authenticate, canWrite, createCycle);
router.put('/:id',   authenticate, canWrite, updateCycle);
router.delete('/:id', authenticate, canWrite, deleteCycle);

// ── Week assignment ────────────────────────────────────────────────────────────
router.put('/:id/weeks/:week_number', authenticate, canWrite, assignWeekMenu);

// ── Schedule application ───────────────────────────────────────────────────────
router.post('/:id/schedules', authenticate, canWrite, applySchedule);

module.exports = router;
