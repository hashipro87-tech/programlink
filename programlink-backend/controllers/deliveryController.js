const pool = require('../config/database');

exports.listRoutes = async (req, res) => {
  try {
    const { date } = req.query;
    let query = 'SELECT * FROM routes WHERE 1=1';
    const params = [];
    // Delivery providers and kitchens only see their own routes
    if (req.user.role === 'delivery' || req.user.role === 'kitchen') {
      params.push(req.user.organizationId);
      query += ` AND delivery_provider_id = $${params.length}`;
    }
    if (date) { params.push(date); query += ` AND date = $${params.length}`; }
    query += ' ORDER BY date DESC';
    const { rows } = await pool.query(query, params);
    res.json({ routes: rows });
  } catch (err) {
    console.error('listRoutes error:', err);
    res.status(500).json({ error: 'Failed to fetch routes.' });
  }
};

exports.getRoute = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM routes WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Route not found.' });
    res.json({ route: rows[0] });
  } catch (err) {
    console.error('getRoute error:', err);
    res.status(500).json({ error: 'Failed to fetch route.' });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const { delivery_provider_id, date, stops, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO routes (delivery_provider_id, date, stops, notes)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [delivery_provider_id, date, JSON.stringify(stops || []), notes || null]
    );
    res.status(201).json({ route: rows[0] });
  } catch (err) {
    console.error('createRoute error:', err);
    res.status(500).json({ error: 'Failed to create route.' });
  }
};

exports.updateRouteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query(
      `UPDATE routes SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Route not found.' });
    res.json({ route: rows[0] });
  } catch (err) {
    console.error('updateRouteStatus error:', err);
    res.status(500).json({ error: 'Failed to update route status.' });
  }
};

exports.confirmStop = async (req, res) => {
  try {
    const { stopOrder } = req.params;
    const route = await pool.query('SELECT * FROM routes WHERE id = $1', [req.params.id]);
    if (!route.rows.length) return res.status(404).json({ error: 'Route not found.' });
    const stops = route.rows[0].stops || [];
    const idx = stops.findIndex((s) => String(s.order) === String(stopOrder));
    if (idx === -1) return res.status(404).json({ error: 'Stop not found.' });
    stops[idx].confirmed = true;
    stops[idx].confirmed_at = new Date().toISOString();
    const { rows } = await pool.query(
      'UPDATE routes SET stops = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(stops), req.params.id]
    );
    res.json({ route: rows[0] });
  } catch (err) {
    console.error('confirmStop error:', err);
    res.status(500).json({ error: 'Failed to confirm stop.' });
  }
};

exports.reportStopIssue = async (req, res) => {
  try {
    const { stopOrder } = req.params;
    const { issue } = req.body;
    const route = await pool.query('SELECT * FROM routes WHERE id = $1', [req.params.id]);
    if (!route.rows.length) return res.status(404).json({ error: 'Route not found.' });
    const stops = route.rows[0].stops || [];
    const idx = stops.findIndex((s) => String(s.order) === String(stopOrder));
    if (idx === -1) return res.status(404).json({ error: 'Stop not found.' });
    stops[idx].issue = issue;
    stops[idx].issue_reported_at = new Date().toISOString();
    const { rows } = await pool.query(
      'UPDATE routes SET stops = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(stops), req.params.id]
    );
    res.json({ route: rows[0] });
  } catch (err) {
    console.error('reportStopIssue error:', err);
    res.status(500).json({ error: 'Failed to report issue.' });
  }
};
