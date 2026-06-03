const pool = require('../config/database');

exports.listOrganizations = async (req, res) => {
  try {
    const { type, sponsor_id } = req.query;
    let query = 'SELECT * FROM organizations WHERE 1=1';
    const params = [];
    if (type) { params.push(type); query += ` AND type = $${params.length}`; }
    if (sponsor_id) { params.push(sponsor_id); query += ` AND sponsor_id = $${params.length}`; }
    // Non-sponsors only see orgs within their sponsor's program
    if (req.user.role !== 'sponsor' && req.user.role !== 'admin') {
      params.push(req.user.sponsorId);
      query += ` AND (sponsor_id = $${params.length} OR id = $${params.length})`;
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ organizations: rows });
  } catch (err) {
    console.error('listOrganizations error:', err);
    res.status(500).json({ error: 'Failed to fetch organizations.' });
  }
};

exports.getOrganization = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM organizations WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Organization not found.' });
    res.json({ organization: rows[0] });
  } catch (err) {
    console.error('getOrganization error:', err);
    res.status(500).json({ error: 'Failed to fetch organization.' });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const { name, type, region, address, phone, sponsor_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO organizations (name, type, region, address, phone, sponsor_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, type, region, address, phone, sponsor_id || req.user.sponsorId]
    );
    res.status(201).json({ organization: rows[0] });
  } catch (err) {
    console.error('createOrganization error:', err);
    res.status(500).json({ error: 'Failed to create organization.' });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const { name, status, region, address, phone } = req.body;
    const { rows } = await pool.query(
      `UPDATE organizations SET
         name = COALESCE($1, name),
         status = COALESCE($2, status),
         region = COALESCE($3, region),
         address = COALESCE($4, address),
         phone = COALESCE($5, phone),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, status, region, address, phone, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Organization not found.' });
    res.json({ organization: rows[0] });
  } catch (err) {
    console.error('updateOrganization error:', err);
    res.status(500).json({ error: 'Failed to update organization.' });
  }
};
