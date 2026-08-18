// activityController.js — serve the activity feed
const pool = require('../config/database');

// ── GET /activity ─────────────────────────────────────────────────────────────
async function listActivity(req, res) {
  try {
    const { organizationId, id: userId, role } = req.user;
    const { type, org_id, limit = 50, offset = 0 } = req.query;

    let where;
    let params;

    if (role === 'sponsor' || role === 'admin') {
      // Sponsor sees all activity across their orgs (sites/kitchens) + their own org
      where = `WHERE a.org_id IN (
        SELECT id FROM organizations WHERE sponsor_id = $1 UNION SELECT $1
      )`;
      params = [organizationId];
    } else if (role === 'coordinator') {
      // Coordinator sees activity from assigned orgs + their sponsor's program
      where = `WHERE a.org_id IN (
        SELECT id FROM organizations WHERE sponsor_id = $1 UNION SELECT $1
      )`;
      params = [req.user.sponsorId ?? organizationId];
    } else {
      where = `WHERE a.org_id = $1`;
      params = [organizationId];
    }

    let idx = params.length + 1;
    if (type)   { where += ` AND a.type = $${idx++}`;   params.push(type); }
    if (org_id) { where += ` AND a.org_id = $${idx++}`; params.push(org_id); }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM activity_feed a ${where}`, params
    );

    const { rows } = await pool.query(
      `SELECT a.*, o.name AS org_name, o.type AS org_type
       FROM activity_feed a
       JOIN organizations o ON o.id = a.org_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Number(limit), Number(offset)]
    );

    res.json({ activity: rows, total: Number(countRes.rows[0].count) });
  } catch (err) {
    console.error('listActivity error:', err);
    res.status(500).json({ error: 'Failed to load activity' });
  }
}

module.exports = { listActivity };
