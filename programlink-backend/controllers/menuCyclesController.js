// menuCyclesController.js — reusable rotating menu cycles (v2)
// Sponsors build a cycle (Fall Cycle = 4 weeks of menus), then schedule it
// against real calendar dates. Production Records + Claims resolve menus from cycles.
const pool = require('../config/database');

// ── GET /menu-cycles/current ──────────────────────────────────────────────────
// Return today's active cycle week + menu for a given org.
async function getCurrentCycle(req, res) {
  try {
    const { organizationId } = req.user;
    const { org_id } = req.query;
    const scopeId = org_id || organizationId;
    const today   = new Date().toISOString().split('T')[0];
    const result  = await _resolveMenu(scopeId, today);
    res.json(result);
  } catch (err) {
    console.error('getCurrentCycle error:', err);
    res.status(500).json({ error: 'Failed to get current cycle' });
  }
}

// ── GET /menu-cycles ──────────────────────────────────────────────────────────
// List all cycles for the org, with their weeks and active schedule.
async function listCycles(req, res) {
  try {
    const { organizationId } = req.user;

    const { rows } = await pool.query(`
      SELECT
        mc.*,
        (
          SELECT json_agg(cw ORDER BY cw.week_number)
          FROM (
            SELECT cw.id, cw.week_number, cw.label, cw.menu_id, m.name AS menu_name, m.week_start,
                   (SELECT COUNT(*)::int FROM menu_items mi WHERE mi.menu_id = cw.menu_id) AS item_count
            FROM cycle_weeks cw
            LEFT JOIN menus m ON m.id = cw.menu_id
            WHERE cw.cycle_id = mc.id
            ORDER BY cw.week_number
          ) cw
        ) AS weeks,
        (
          SELECT json_agg(cs ORDER BY cs.start_date)
          FROM cycle_schedules cs
          WHERE cs.cycle_id = mc.id
        ) AS schedules
      FROM menu_cycles mc
      WHERE mc.org_id = $1
      ORDER BY mc.created_at DESC
    `, [organizationId]);

    res.json({ cycles: rows });
  } catch (err) {
    console.error('listCycles error:', err);
    res.status(500).json({ error: 'Failed to load menu cycles' });
  }
}

// ── POST /menu-cycles ─────────────────────────────────────────────────────────
// Create a new cycle with empty week slots.
async function createCycle(req, res) {
  try {
    const { organizationId } = req.user;
    const { name, description, week_count = 4 } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    const wc = Math.min(52, Math.max(1, parseInt(week_count) || 4));
    const { start_date } = req.body; // optional — if provided, auto-activates cycle

    const { rows: [cycle] } = await pool.query(
      `INSERT INTO menu_cycles (org_id, name, description, week_count)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [organizationId, name.trim(), description || null, wc]
    );

    // Pre-create empty week slots
    for (let w = 1; w <= wc; w++) {
      await pool.query(
        `INSERT INTO cycle_weeks (cycle_id, week_number, label) VALUES ($1,$2,$3)`,
        [cycle.id, w, `Week ${w}`]
      );
    }

    // If start_date provided, auto-create a long-running active schedule (runs until 2099)
    if (start_date) {
      await pool.query(
        `INSERT INTO cycle_schedules (cycle_id, org_id, start_date, end_date, notes, is_active)
         VALUES ($1,$2,$3,'2099-12-31','Auto-activated',TRUE)`,
        [cycle.id, organizationId, start_date]
      );
    }

    res.status(201).json(cycle);
  } catch (err) {
    console.error('createCycle error:', err);
    res.status(500).json({ error: 'Failed to create cycle' });
  }
}

// ── PUT /menu-cycles/:id ──────────────────────────────────────────────────────
async function updateCycle(req, res) {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { name, description, for_org_id } = req.body;

    const { rows } = await pool.query(
      `UPDATE menu_cycles SET name=$1, description=$2, for_org_id=$3, updated_at=NOW()
       WHERE id=$4 AND org_id=$5 RETURNING *`,
      [name, description || null, for_org_id || null, id, organizationId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cycle not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('updateCycle error:', err);
    res.status(500).json({ error: 'Failed to update cycle' });
  }
}

// ── DELETE /menu-cycles/:id ───────────────────────────────────────────────────
async function deleteCycle(req, res) {
  try {
    const { organizationId } = req.user;
    await pool.query(
      `DELETE FROM menu_cycles WHERE id=$1 AND org_id=$2`,
      [req.params.id, organizationId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('deleteCycle error:', err);
    res.status(500).json({ error: 'Failed to delete cycle' });
  }
}

// ── PUT /menu-cycles/:id/weeks/:week_number ───────────────────────────────────
// Assign (or unassign) a menu to a specific week slot.
async function assignWeekMenu(req, res) {
  try {
    const { organizationId } = req.user;
    const { id: cycleId, week_number } = req.params;
    const { menu_id, label } = req.body; // menu_id can be null to unassign

    // Verify cycle ownership
    const check = await pool.query(
      `SELECT id FROM menu_cycles WHERE id=$1 AND org_id=$2`,
      [cycleId, organizationId]
    );
    if (!check.rows.length) return res.status(403).json({ error: 'Access denied' });

    const { rows } = await pool.query(
      `UPDATE cycle_weeks SET menu_id=$1, label=COALESCE($2, label)
       WHERE cycle_id=$3 AND week_number=$4 RETURNING *`,
      [menu_id || null, label || null, cycleId, parseInt(week_number)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Week not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('assignWeekMenu error:', err);
    res.status(500).json({ error: 'Failed to assign menu to week' });
  }
}

// ── GET /menu-cycles/schedules ────────────────────────────────────────────────
// List active cycle schedules for the org.
async function listSchedules(req, res) {
  try {
    const { organizationId } = req.user;
    const { rows } = await pool.query(`
      SELECT cs.*, mc.name AS cycle_name, mc.week_count
      FROM cycle_schedules cs
      JOIN menu_cycles mc ON mc.id = cs.cycle_id
      WHERE cs.org_id = $1
      ORDER BY cs.start_date DESC
    `, [organizationId]);
    res.json({ schedules: rows });
  } catch (err) {
    console.error('listSchedules error:', err);
    res.status(500).json({ error: 'Failed to load schedules' });
  }
}

// ── POST /menu-cycles/:id/schedules ──────────────────────────────────────────
// Apply a cycle to a date range on the real calendar.
async function applySchedule(req, res) {
  try {
    const { organizationId } = req.user;
    const { id: cycleId } = req.params;
    const { start_date, end_date, notes } = req.body;

    if (!start_date || !end_date) return res.status(400).json({ error: 'start_date and end_date are required' });

    // Verify cycle ownership
    const check = await pool.query(
      `SELECT id FROM menu_cycles WHERE id=$1 AND org_id=$2`,
      [cycleId, organizationId]
    );
    if (!check.rows.length) return res.status(403).json({ error: 'Access denied' });

    const { rows: [schedule] } = await pool.query(
      `INSERT INTO cycle_schedules (cycle_id, org_id, start_date, end_date, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [cycleId, organizationId, start_date, end_date, notes || null]
    );
    res.status(201).json(schedule);
  } catch (err) {
    console.error('applySchedule error:', err);
    res.status(500).json({ error: 'Failed to apply schedule' });
  }
}

// ── DELETE /menu-cycles/schedules/:schedule_id ────────────────────────────────
async function removeSchedule(req, res) {
  try {
    const { organizationId } = req.user;
    await pool.query(
      `DELETE FROM cycle_schedules WHERE id=$1 AND org_id=$2`,
      [req.params.schedule_id, organizationId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('removeSchedule error:', err);
    res.status(500).json({ error: 'Failed to remove schedule' });
  }
}

// ── GET /menu-cycles/resolve?date=YYYY-MM-DD ─────────────────────────────────
// Resolve which menu applies to a given date based on active cycle schedules.
// Used by Production Records and Claims to find the right menu automatically.
async function resolveMenuForDate(req, res) {
  try {
    const { organizationId } = req.user;
    const { date, org_id } = req.query;
    if (!date) return res.status(400).json({ error: 'date is required' });

    const targetOrg = org_id || organizationId;
    const result = await _resolveMenu(targetOrg, date);
    res.json(result);
  } catch (err) {
    console.error('resolveMenuForDate error:', err);
    res.status(500).json({ error: 'Failed to resolve menu' });
  }
}

// Internal helper — also called by productionRecordsController prefillPreview
async function _resolveMenu(orgId, date) {
  // Find active schedule that covers this date.
  // Also check the sponsor's cycles when orgId is a kitchen/site (sub-org).
  const schedRes = await pool.query(`
    SELECT cs.*, mc.week_count, mc.name AS cycle_name
    FROM cycle_schedules cs
    JOIN menu_cycles mc ON mc.id = cs.cycle_id
    WHERE cs.org_id IN (
      $1,
      -- sponsor org (if orgId is a kitchen/site, look up its sponsor)
      (SELECT COALESCE(sponsor_id, $1) FROM organizations WHERE id = $1 LIMIT 1)
    )
      AND cs.is_active = TRUE
      AND cs.start_date <= $2::date
      AND (cs.end_date IS NULL OR cs.end_date >= $2::date)
    ORDER BY cs.start_date DESC
    LIMIT 1
  `, [orgId, date]);

  if (!schedRes.rows.length) return { found: false, cycle: null, week_number: null, menu: null };

  const sched = schedRes.rows[0];

  // Calculate which week number this date falls on within the schedule
  const startMonday = getMonday(sched.start_date);
  const thisMonday  = getMonday(date);
  const weeksSince  = Math.floor((thisMonday - startMonday) / (7 * 24 * 60 * 60 * 1000));
  const weekNumber  = (weeksSince % sched.week_count) + 1; // 1-indexed, wraps

  // Get the menu assigned to that week
  const weekRes = await pool.query(`
    SELECT cw.*, m.id AS menu_id, m.name AS menu_name, m.week_start
    FROM cycle_weeks cw
    LEFT JOIN menus m ON m.id = cw.menu_id
    WHERE cw.cycle_id = $1 AND cw.week_number = $2
  `, [sched.cycle_id, weekNumber]);

  // Calculate actual calendar dates for this cycle week
  const weekStartDate = new Date(thisMonday);
  const weekEndDate   = new Date(thisMonday);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 4); // Friday

  const week = weekRes.rows[0];
  return {
    found:            !!week?.menu_id,
    cycle_id:         sched.cycle_id,
    cycle_name:       sched.cycle_name,
    week_number:      weekNumber,
    week_count:       sched.week_count,
    week_label:       week?.label || `Week ${weekNumber}`,
    menu_id:          week?.menu_id || null,
    menu_name:        week?.menu_name || null,
    week_start_date:  weekStartDate.toISOString().split('T')[0],
    week_end_date:    weekEndDate.toISOString().split('T')[0],
  };
}

function getMonday(dateStr) {
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00Z' : ''));
  const day = d.getUTCDay(); // 0=Sun, 1=Mon…
  const diff = (day === 0) ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

module.exports = {
  getCurrentCycle,
  listCycles, createCycle, updateCycle, deleteCycle,
  assignWeekMenu,
  listSchedules, applySchedule, removeSchedule,
  resolveMenuForDate, _resolveMenu,
};
