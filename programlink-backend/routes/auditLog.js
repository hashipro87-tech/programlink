const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const pool = require('../config/database');

// Only admins and sponsors can view the audit log
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

module.exports = router;
