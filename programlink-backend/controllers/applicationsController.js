const pool = require('../config/database');

exports.listApplications = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT a.*, o.name AS org_name, o.type AS org_type
      FROM applications a
      JOIN organizations o ON o.id = a.org_id
      WHERE 1=1`;
    const params = [];
    if (req.user.role === 'sponsor') {
      params.push(req.user.organizationId);
      query += ` AND a.sponsor_id = $${params.length}`;
    } else if (req.user.role === 'coordinator') {
      params.push(req.user.sponsorId);
      query += ` AND a.sponsor_id = $${params.length}`;
    } else {
      params.push(req.user.organizationId);
      query += ` AND a.org_id = $${params.length}`;
    }
    if (status) { params.push(status); query += ` AND a.status = $${params.length}`; }
    params.push(limit, offset);
    query += ` ORDER BY a.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const { rows } = await pool.query(query, params);
    res.json({ applications: rows });
  } catch (err) {
    console.error('listApplications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, o.name AS org_name, o.type AS org_type
       FROM applications a JOIN organizations o ON o.id = a.org_id
       WHERE a.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Application not found.' });
    res.json({ application: rows[0] });
  } catch (err) {
    console.error('getApplication error:', err);
    res.status(500).json({ error: 'Failed to fetch application.' });
  }
};

exports.createApplication = async (req, res) => {
  try {
    const { sponsor_id, form_data } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO applications (org_id, sponsor_id, form_data, status)
       VALUES ($1,$2,$3,'draft') RETURNING *`,
      [req.user.organizationId, sponsor_id, form_data ? JSON.stringify(form_data) : null]
    );
    res.status(201).json({ application: rows[0] });
  } catch (err) {
    console.error('createApplication error:', err);
    res.status(500).json({ error: 'Failed to create application.' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, notes, internal_notes, form_data } = req.body;
    const updates = [];
    const params = [];

    if (status) { params.push(status); updates.push(`status = $${params.length}`); }
    if (notes !== undefined) { params.push(notes); updates.push(`notes = $${params.length}`); }
    if (internal_notes !== undefined) { params.push(internal_notes); updates.push(`internal_notes = $${params.length}`); }
    if (form_data !== undefined) { params.push(JSON.stringify(form_data)); updates.push(`form_data = $${params.length}`); }
    if (status === 'submitted') { updates.push(`submitted_at = NOW()`); }
    if (['approved','rejected'].includes(status)) {
      params.push(req.user.id);
      updates.push(`reviewed_by = $${params.length}`, `reviewed_at = NOW()`);
    }
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE applications SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Application not found.' });
    res.json({ application: rows[0] });
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ error: 'Failed to update application.' });
  }
};
