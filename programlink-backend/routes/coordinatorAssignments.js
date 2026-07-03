// routes/coordinatorAssignments.js
// Manages which sites/kitchens each coordinator is assigned to.
//
// GET    /coordinator-assignments?coordinator_id=:id  — list a coordinator's assigned orgs
// POST   /coordinator-assignments                     — assign coordinator to an org (sponsor only)
// DELETE /coordinator-assignments/:coordinator_id/:org_id — remove assignment (sponsor only)

const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.use(authenticate);

// ── GET /coordinator-assignments ──────────────────────────────────────────────
// Sponsor: pass ?coordinator_id=<uuid>
// Coordinator: always returns their own assignments (id from JWT)
router.get('/', async (req, res) => {
  try {
    const coordinatorId = req.user.role === 'coordinator'
      ? req.user.id
      : req.query.coordinator_id;

    if (!coordinatorId) {
      return res.status(400).json({ error: 'coordinator_id is required.' });
    }

    const { rows } = await pool.query(
      `SELECT ca.id, ca.coordinator_id, ca.org_id, ca.created_at,
              o.name   AS org_name,
              o.type   AS org_type,
              o.status AS org_status
       FROM coordinator_assignments ca
       JOIN organizations o ON o.id = ca.org_id
       WHERE ca.coordinator_id = $1
       ORDER BY o.type, o.name`,
      [coordinatorId]
    );

    res.json({ assignments: rows });
  } catch (err) {
    console.error('listAssignments error:', err);
    res.status(500).json({ error: 'Failed to fetch assignments.' });
  }
});

// ── POST /coordinator-assignments ─────────────────────────────────────────────
// Body: { coordinator_id, org_id }
router.post('/', authorizeRoles('sponsor', 'admin'), async (req, res) => {
  try {
    const { coordinator_id, org_id } = req.body;
    if (!coordinator_id || !org_id) {
      return res.status(400).json({ error: 'coordinator_id and org_id are required.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO coordinator_assignments (coordinator_id, org_id)
       VALUES ($1, $2)
       ON CONFLICT (coordinator_id, org_id) DO NOTHING
       RETURNING *`,
      [coordinator_id, org_id]
    );

    res.status(201).json({ assignment: rows[0] ?? null, message: 'Assignment saved.' });
  } catch (err) {
    console.error('createAssignment error:', err);
    res.status(500).json({ error: 'Failed to create assignment.' });
  }
});

// ── DELETE /coordinator-assignments/:coordinator_id/:org_id ───────────────────
router.delete('/:coordinator_id/:org_id', authorizeRoles('sponsor', 'admin'), async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM coordinator_assignments WHERE coordinator_id = $1 AND org_id = $2',
      [req.params.coordinator_id, req.params.org_id]
    );
    res.json({ message: 'Assignment removed.' });
  } catch (err) {
    console.error('deleteAssignment error:', err);
    res.status(500).json({ error: 'Failed to remove assignment.' });
  }
});

module.exports = router;
