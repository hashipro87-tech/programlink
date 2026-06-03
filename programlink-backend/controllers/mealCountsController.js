const pool = require('../config/database');

exports.listMealCounts = async (req, res) => {
  try {
    const { site_id, kitchen_id, start_date, end_date } = req.query;
    let query = 'SELECT * FROM meal_counts WHERE 1=1';
    const params = [];
    if (site_id)    { params.push(site_id);    query += ` AND site_id = $${params.length}`; }
    if (kitchen_id) { params.push(kitchen_id); query += ` AND kitchen_id = $${params.length}`; }
    if (start_date) { params.push(start_date); query += ` AND date >= $${params.length}`; }
    if (end_date)   { params.push(end_date);   query += ` AND date <= $${params.length}`; }
    if (req.user.role === 'site' || req.user.role === 'kitchen') {
      params.push(req.user.organizationId);
      query += ` AND (site_id = $${params.length} OR kitchen_id = $${params.length})`;
    }
    query += ' ORDER BY date DESC';
    const { rows } = await pool.query(query, params);
    res.json({ meal_counts: rows });
  } catch (err) {
    console.error('listMealCounts error:', err);
    res.status(500).json({ error: 'Failed to fetch meal counts.' });
  }
};

exports.submitMealCount = async (req, res) => {
  try {
    const { site_id, kitchen_id, date, count_submitted, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO meal_counts (site_id, kitchen_id, date, count_submitted, submitted_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (site_id, date) DO UPDATE
         SET count_submitted = $4, submitted_by = $5, notes = $6
       RETURNING *`,
      [site_id || req.user.organizationId, kitchen_id || null, date, count_submitted, req.user.id, notes || null]
    );
    res.status(201).json({ meal_count: rows[0] });
  } catch (err) {
    console.error('submitMealCount error:', err);
    res.status(500).json({ error: 'Failed to submit meal count.' });
  }
};

exports.verifyMealCount = async (req, res) => {
  try {
    const { count_verified } = req.body;
    const { rows } = await pool.query(
      `UPDATE meal_counts SET count_verified = $1, verified_by = $2 WHERE id = $3 RETURNING *`,
      [count_verified, req.user.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Meal count not found.' });
    res.json({ meal_count: rows[0] });
  } catch (err) {
    console.error('verifyMealCount error:', err);
    res.status(500).json({ error: 'Failed to verify meal count.' });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year  || new Date().getFullYear();
    const { rows } = await pool.query(
      `SELECT site_id, SUM(count_submitted) AS total_submitted, SUM(count_verified) AS total_verified, COUNT(*) AS days
       FROM meal_counts
       WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
       GROUP BY site_id`,
      [m, y]
    );
    res.json({ summary: rows });
  } catch (err) {
    console.error('getMonthlySummary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary.' });
  }
};
