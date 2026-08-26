const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const pool = require('../config/database');

// Admin/sponsor — full audit log with filters
router.get('/', authenticate, authorizeRoles('admin', 'sponsor'), async (req, res) => {
  try {
    const { limit = 50, offset = 0, action, entity_type } = req.query;
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    if (action)      { params.push(`%${action}%`);      query += ` AND action ILIKE $${params.length}`; }
    if (entity_type) { params.push(entity_type); query += ` AND entity_type = $${params.length}`; }
    params.push(limit, offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const { rows } = await pool.query(query, params);
    res.json({ entries: rows });
  } catch (err) {
    console.error('auditLog error:', err);
    res.status(500).json({ error: 'Failed to fetch audit log.' });
  }
});

// Any authenticated user — activity timeline scoped to their own org
router.get('/my-activity', authenticate, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const orgId = req.user.organizationId;
    if (!orgId) return res.json({ entries: [] });

    // Pull audit entries where the entity belongs to this org
    // We join on entity_id matching org applications, documents, meal counts
    const { rows } = await pool.query(
      `SELECT * FROM audit_log
       WHERE (
         (entity_type = 'organization' AND entity_id = $1::text)
         OR (entity_type = 'application'  AND entity_id IN (
               SELECT id::text FROM applications WHERE org_id = $1))
         OR (entity_type = 'document'     AND entity_id IN (
               SELECT id::text FROM documents WHERE org_id = $1))
         OR (entity_type = 'meal_count'   AND entity_id IN (
               -- meal_counts has no org_id column (site_id / kitchen_id only) —
               -- this always threw "column mc.org_id does not exist", which
               -- meant GET /my-activity 500'd for every single user, always,
               -- since Postgres errors on an unknown column at plan time even
               -- when this OR branch's condition never matches a given row.
               SELECT id::text FROM meal_counts WHERE site_id = $1 OR kitchen_id = $1))
       )
       ORDER BY created_at DESC
       LIMIT $2`,
      [orgId, limit]
    );
    res.json({ entries: rows });
  } catch (err) {
    console.error('myActivity error:', err);
    res.status(500).json({ error: 'Failed to fetch activity.' });
  }
});

module.exports = router;
