const pool = require('../config/database');

exports.listKitchens = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.* FROM organizations o
       WHERE o.type = 'kitchen' AND o.status = 'active'
       ORDER BY o.name ASC`
    );
    res.json({ kitchens: rows });
  } catch (err) {
    console.error('listKitchens error:', err);
    res.status(500).json({ error: 'Failed to fetch kitchens.' });
  }
};

exports.listConnections = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ksc.*, k.name AS kitchen_name, s.name AS site_name
       FROM kitchen_site_connections ksc
       JOIN organizations k ON k.id = ksc.kitchen_id
       JOIN organizations s ON s.id = ksc.site_id
       WHERE ksc.kitchen_id = $1 OR ksc.site_id = $1`,
      [req.user.organizationId]
    );
    res.json({ connections: rows });
  } catch (err) {
    console.error('listConnections error:', err);
    res.status(500).json({ error: 'Failed to fetch connections.' });
  }
};

exports.requestConnection = async (req, res) => {
  try {
    const { kitchen_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO kitchen_site_connections (kitchen_id, site_id)
       VALUES ($1, $2)
       ON CONFLICT (kitchen_id, site_id) DO NOTHING
       RETURNING *`,
      [kitchen_id, req.user.organizationId]
    );
    res.status(201).json({ connection: rows[0] || null });
  } catch (err) {
    console.error('requestConnection error:', err);
    res.status(500).json({ error: 'Failed to request connection.' });
  }
};

exports.reviewConnection = async (req, res) => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query(
      `UPDATE kitchen_site_connections
       SET status = $1, approved_by = $2, approved_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, req.user.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Connection not found.' });
    res.json({ connection: rows[0] });
  } catch (err) {
    console.error('reviewConnection error:', err);
    res.status(500).json({ error: 'Failed to review connection.' });
  }
};
