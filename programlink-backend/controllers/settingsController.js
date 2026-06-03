const pool   = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getSettings = async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.org_id,
              o.name AS org_name, o.type AS org_type, o.address, o.phone, o.region
       FROM users u LEFT JOIN organizations o ON o.id = u.org_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!user.rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json({ settings: user.rows[0] });
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), updated_at = NOW()
       WHERE id = $3 RETURNING id, name, email, role`,
      [name, email, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, user.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('updatePassword error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const { name, address, phone, region } = req.body;
    const { rows } = await pool.query(
      `UPDATE organizations SET
         name = COALESCE($1, name),
         address = COALESCE($2, address),
         phone = COALESCE($3, phone),
         region = COALESCE($4, region),
         updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, address, phone, region, req.user.organizationId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Organization not found.' });
    res.json({ organization: rows[0] });
  } catch (err) {
    console.error('updateOrganization error:', err);
    res.status(500).json({ error: 'Failed to update organization.' });
  }
};
