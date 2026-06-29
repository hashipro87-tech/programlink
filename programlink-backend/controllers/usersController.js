const pool = require('../config/database');
const { logAction } = require('../services/auditService');

exports.listUsers = async (req, res) => {
  try {
    let rows;

    if (req.user.role === 'admin') {
      // Admins see all users across every organization
      ({ rows } = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.is_active, u.last_login_at, u.created_at,
                o.name AS org_name
         FROM users u
         LEFT JOIN organizations o ON o.id = u.org_id
         ORDER BY u.created_at DESC`
      ));
    } else {
      // Sponsors and coordinators only see users within their program
      const sponsorId = req.user.sponsorId || req.user.organizationId;
      ({ rows } = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.is_active, u.last_login_at, u.created_at,
                o.name AS org_name
         FROM users u
         LEFT JOIN organizations o ON o.id = u.org_id
         WHERE o.sponsor_id = $1 OR u.org_id = $1
         ORDER BY u.created_at DESC`,
        [sponsorId]
      ));
    }

    res.json({ users: rows });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.last_login_at, u.created_at,
              o.name AS org_name, o.type AS org_type
       FROM users u LEFT JOIN organizations o ON o.id = u.org_id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('getUser error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, is_active`,
      [is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    logAction({
      actor:      req.user,
      action:     is_active ? 'user.activated' : 'user.deactivated',
      entityType: 'user',
      entityId:   rows[0].id,
      entityName: rows[0].name,
    });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('updateUserStatus error:', err);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
};
