// attendanceController.js — Daily attendance records (Task #170)
const pool = require('../config/database');

// GET /attendance?month=YYYY-MM&org_id=UUID
// Sponsor sees all sites they manage; site/coordinator sees own org
async function listAttendance(req, res) {
  try {
    const { organizationId, role } = req.user;
    const { month, org_id } = req.query;

    // Build date range
    const target = month || new Date().toISOString().slice(0, 7);
    const [year, mon] = target.split('-').map(Number);
    const start = `${target}-01`;
    const end   = new Date(year, mon, 0).toISOString().slice(0, 10); // last day of month

    let where, params;
    if (role === 'sponsor' || role === 'admin') {
      where  = `WHERE a.org_id IN (SELECT id FROM organizations WHERE sponsor_id = $1 UNION SELECT $1)`;
      params = [organizationId];
    } else {
      where  = `WHERE a.org_id = $1`;
      params = [organizationId];
    }

    let idx = params.length + 1;
    where += ` AND a.date >= $${idx++} AND a.date <= $${idx++}`;
    params.push(start, end);

    if (org_id) {
      where += ` AND a.org_id = $${idx++}`;
      params.push(org_id);
    }

    const { rows } = await pool.query(
      `SELECT a.*, o.name AS org_name
       FROM attendance_records a
       JOIN organizations o ON o.id = a.org_id
       ${where}
       ORDER BY a.date DESC`,
      params
    );

    res.json({ attendance: rows });
  } catch (err) {
    console.error('listAttendance error:', err);
    res.status(500).json({ error: 'Failed to load attendance records.' });
  }
}

// POST /attendance  { org_id, date, count, notes }
// Upserts — one record per site per day
async function upsertAttendance(req, res) {
  try {
    const { organizationId, role } = req.user;
    const { org_id, date, count, notes } = req.body;

    if (!date || count === undefined || count === null) {
      return res.status(400).json({ error: 'date and count are required.' });
    }
    if (count < 0) {
      return res.status(400).json({ error: 'count must be 0 or greater.' });
    }

    // Determine which org to save for
    let targetOrg = org_id;
    if (!targetOrg) {
      // Site/kitchen logs for themselves
      targetOrg = organizationId;
    }

    // Sponsors can log for any of their sites; sites can only log for themselves
    if (role !== 'sponsor' && role !== 'admin' && targetOrg !== organizationId) {
      return res.status(403).json({ error: 'Cannot log attendance for another organization.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO attendance_records (org_id, date, count, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (org_id, date) DO UPDATE
         SET count = $3, notes = $4, updated_at = NOW()
       RETURNING *`,
      [targetOrg, date, parseInt(count), notes || null]
    );

    res.json({ attendance: rows[0] });
  } catch (err) {
    console.error('upsertAttendance error:', err);
    res.status(500).json({ error: 'Failed to save attendance record.' });
  }
}

// DELETE /attendance/:id
async function deleteAttendance(req, res) {
  try {
    const { organizationId, role } = req.user;
    const { id } = req.params;

    // Verify ownership
    const { rows } = await pool.query(
      `SELECT a.* FROM attendance_records a
       JOIN organizations o ON o.id = a.org_id
       WHERE a.id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });

    const record = rows[0];
    const isOwner = record.org_id === organizationId;
    const isSponsor = role === 'sponsor' || role === 'admin';

    if (!isOwner && !isSponsor) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await pool.query('DELETE FROM attendance_records WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteAttendance error:', err);
    res.status(500).json({ error: 'Failed to delete attendance record.' });
  }
}

// GET /attendance/compare?month=YYYY-MM&org_id=UUID
// Returns per-day comparison: attendance count vs meal counts, flags anomalies
async function compareAttendanceMeals(req, res) {
  try {
    const { organizationId, role } = req.user;
    const { month, org_id } = req.query;

    const target = month || new Date().toISOString().slice(0, 7);
    const [year, mon] = target.split('-').map(Number);
    const start = `${target}-01`;
    const end   = new Date(year, mon, 0).toISOString().slice(0, 10);

    const targetOrg = org_id || organizationId;

    // Auth check for sponsor
    if (role === 'sponsor' || role === 'admin') {
      const { rows } = await pool.query(
        `SELECT id FROM organizations WHERE id = $1 AND (sponsor_id = $2 OR id = $2)`,
        [targetOrg, organizationId]
      );
      if (!rows.length) return res.status(403).json({ error: 'Not authorized.' });
    }

    // Fetch both attendance and meal counts for the month
    const [attRows, mealRows] = await Promise.all([
      pool.query(
        `SELECT date, count FROM attendance_records
         WHERE org_id = $1 AND date >= $2 AND date <= $3
         ORDER BY date`,
        [targetOrg, start, end]
      ),
      pool.query(
        `SELECT date_served::date AS date,
                breakfast, lunch, snack, supper,
                (breakfast + lunch + snack + supper) AS total
         FROM meal_counts
         WHERE org_id = $1 AND date_served >= $2 AND date_served <= $3
         ORDER BY date_served`,
        [targetOrg, start, end]
      ),
    ]);

    // Build a map by date
    const attMap  = {};
    for (const r of attRows.rows)  attMap[r.date.toISOString().slice(0, 10)]  = r.count;
    const mealMap = {};
    for (const r of mealRows.rows) mealMap[r.date.toISOString().slice(0, 10)] = r;

    // Merge into daily comparison rows
    const allDates = [...new Set([...Object.keys(attMap), ...Object.keys(mealMap)])].sort();
    const days = allDates.map(date => {
      const att   = attMap[date]  ?? null;
      const meals = mealMap[date] ?? null;
      const anomalies = [];

      if (att !== null && meals !== null) {
        if (meals.breakfast > att) anomalies.push({ meal: 'breakfast', count: meals.breakfast, attendance: att, excess: meals.breakfast - att });
        if (meals.lunch     > att) anomalies.push({ meal: 'lunch',     count: meals.lunch,     attendance: att, excess: meals.lunch     - att });
        if (meals.snack     > att) anomalies.push({ meal: 'snack',     count: meals.snack,     attendance: att, excess: meals.snack     - att });
        if (meals.supper    > att) anomalies.push({ meal: 'supper',    count: meals.supper,    attendance: att, excess: meals.supper    - att });
      }

      return {
        date,
        attendance: att,
        meals: meals ? {
          breakfast: meals.breakfast,
          lunch:     meals.lunch,
          snack:     meals.snack,
          supper:    meals.supper,
          total:     parseInt(meals.total),
        } : null,
        anomalies,
        status: att === null   ? 'no_attendance'
               : !meals        ? 'no_meals'
               : anomalies.length > 0 ? 'anomaly'
               : 'ok',
      };
    });

    res.json({
      org_id:     targetOrg,
      month:      target,
      days,
      anomaly_count: days.filter(d => d.status === 'anomaly').length,
      missing_count: days.filter(d => d.status === 'no_attendance' && d.meals).length,
    });
  } catch (err) {
    console.error('compareAttendanceMeals error:', err);
    res.status(500).json({ error: 'Failed to compare attendance and meal counts.' });
  }
}

module.exports = { listAttendance, upsertAttendance, deleteAttendance, compareAttendanceMeals };
