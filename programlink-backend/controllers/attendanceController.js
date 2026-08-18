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
    } else if (role === 'coordinator') {
      where  = `WHERE a.org_id IN (SELECT id FROM organizations WHERE sponsor_id = $1)`;
      params = [req.user.sponsorId];
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
        `SELECT date::date AS date,
                breakfast, lunch, snack, supper,
                (breakfast + lunch + snack + supper) AS total
         FROM meal_counts
         WHERE site_id = $1 AND date >= $2 AND date <= $3
         ORDER BY date`,
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

// ─── GET /attendance/roster?org_id=&date= ────────────────────────────────────
// Returns the child roster for a site + their attendance record for that date.
// If no record exists yet, attendance fields are null (first time opening the day).
async function getRosterForDate(req, res) {
  try {
    const { organizationId, role } = req.user;
    const { org_id, date } = req.query;

    if (!date) return res.status(400).json({ error: 'date is required.' });

    // Determine which site to load
    let targetOrg = org_id || organizationId;

    // Sponsors must own the requested org
    if ((role === 'sponsor' || role === 'admin') && org_id) {
      const { rows: check } = await pool.query(
        `SELECT id FROM organizations WHERE id = $1 AND (sponsor_id = $2 OR id = $2)`,
        [org_id, organizationId]
      );
      if (!check.length) return res.status(403).json({ error: 'Not authorized.' });
    }

    // Load children + existing attendance for the day in one query
    const { rows } = await pool.query(
      `SELECT
         c.id,
         c.first_name,
         c.last_name,
         c.first_name || ' ' || c.last_name AS name,
         c.age_group,
         c.birthdate,
         COALESCE(ca.is_present,    false) AS is_present,
         COALESCE(ca.had_breakfast, false) AS had_breakfast,
         COALESCE(ca.had_lunch,     false) AS had_lunch,
         COALESCE(ca.had_snack,     false) AS had_snack,
         COALESCE(ca.had_supper,    false) AS had_supper,
         (ca.id IS NOT NULL) AS has_record
       FROM children c
       LEFT JOIN child_attendance ca ON ca.child_id = c.id AND ca.date = $2
       WHERE c.org_id = $1
         AND c.form_status IN ('approved', 'active')
       ORDER BY c.last_name ASC, c.first_name ASC`,
      [targetOrg, date]
    );

    // Compute daily summary from existing records
    const present   = rows.filter(r => r.is_present).length;
    const breakfast = rows.filter(r => r.had_breakfast).length;
    const lunch     = rows.filter(r => r.had_lunch).length;
    const snack     = rows.filter(r => r.had_snack).length;
    const supper    = rows.filter(r => r.had_supper).length;
    const hasRecord = rows.some(r => r.has_record);

    res.json({
      org_id:   targetOrg,
      date,
      children: rows,
      summary:  { total: rows.length, present, breakfast, lunch, snack, supper },
      has_record: hasRecord,
    });
  } catch (err) {
    console.error('getRosterForDate error:', err);
    res.status(500).json({ error: 'Failed to load attendance roster.' });
  }
}

// ─── POST /attendance/roster ──────────────────────────────────────────────────
// Bulk-upserts child attendance records, then auto-writes meal_counts from totals.
// Body: { org_id, date, records: [{ child_id, is_present, had_breakfast, ... }] }
async function saveRosterAttendance(req, res) {
  try {
    const { organizationId, role, id: userId } = req.user;
    const { org_id, date, records } = req.body;

    if (!date)                        return res.status(400).json({ error: 'date is required.' });
    if (!Array.isArray(records) || !records.length) {
      return res.status(400).json({ error: 'records array is required.' });
    }

    let targetOrg = org_id || organizationId;

    // Auth check
    if (role !== 'sponsor' && role !== 'admin' && targetOrg !== organizationId) {
      return res.status(403).json({ error: 'Cannot save attendance for another organization.' });
    }
    if ((role === 'sponsor' || role === 'admin') && org_id) {
      const { rows: check } = await pool.query(
        `SELECT id FROM organizations WHERE id = $1 AND (sponsor_id = $2 OR id = $2)`,
        [org_id, organizationId]
      );
      if (!check.length) return res.status(403).json({ error: 'Not authorized.' });
    }

    // Upsert each child's attendance record
    for (const r of records) {
      const present   = !!r.is_present;
      // Clear meals when marking absent
      const breakfast = present && !!r.had_breakfast;
      const lunch     = present && !!r.had_lunch;
      const snack     = present && !!r.had_snack;
      const supper    = present && !!r.had_supper;

      await pool.query(
        `INSERT INTO child_attendance
           (org_id, child_id, date, is_present, had_breakfast, had_lunch, had_snack, had_supper)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (child_id, date) DO UPDATE
           SET is_present    = $4,
               had_breakfast = $5,
               had_lunch     = $6,
               had_snack     = $7,
               had_supper    = $8,
               updated_at    = NOW()`,
        [targetOrg, r.child_id, date, present, breakfast, lunch, snack, supper]
      );
    }

    // Recalculate totals from the saved records
    const { rows: totals } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE is_present)    AS present,
         COUNT(*) FILTER (WHERE had_breakfast) AS breakfast,
         COUNT(*) FILTER (WHERE had_lunch)     AS lunch,
         COUNT(*) FILTER (WHERE had_snack)     AS snack,
         COUNT(*) FILTER (WHERE had_supper)    AS supper
       FROM child_attendance
       WHERE org_id = $1 AND date = $2`,
      [targetOrg, date]
    );
    const t = totals[0];
    const bk = parseInt(t.breakfast || 0);
    const ln = parseInt(t.lunch     || 0);
    const sk = parseInt(t.snack     || 0);
    const su = parseInt(t.supper    || 0);
    const total = bk + ln + sk + su;

    // Auto-write meal_counts — attendance IS the meal count entry
    const autoVerify = role === 'sponsor' || role === 'admin';
    await pool.query(
      `INSERT INTO meal_counts
         (site_id, date, breakfast, lunch, snack, supper,
          count_submitted, count_verified, submitted_by, verified_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (site_id, date) DO UPDATE
         SET breakfast       = $3,
             lunch           = $4,
             snack           = $5,
             supper          = $6,
             count_submitted = $7,
             count_verified  = $8,
             submitted_by    = $9,
             verified_by     = $10`,
      [
        targetOrg, date,
        bk, ln, sk, su, total,
        autoVerify ? total : null,
        userId,
        autoVerify ? userId : null,
        null,
      ]
    );

    // Also keep attendance_records summary in sync (for backward compat)
    await pool.query(
      `INSERT INTO attendance_records (org_id, date, count)
       VALUES ($1, $2, $3)
       ON CONFLICT (org_id, date) DO UPDATE SET count = $3, updated_at = NOW()`,
      [targetOrg, date, parseInt(t.present || 0)]
    );

    res.json({
      success: true,
      summary: {
        present:   parseInt(t.present   || 0),
        breakfast: bk, lunch: ln, snack: sk, supper: su,
        total,
      },
    });
  } catch (err) {
    console.error('saveRosterAttendance error:', err);
    res.status(500).json({ error: 'Failed to save attendance.' });
  }
}

module.exports = { listAttendance, upsertAttendance, deleteAttendance, compareAttendanceMeals, getRosterForDate, saveRosterAttendance };
