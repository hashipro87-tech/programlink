// productionRecordsController.js — CACFP meal production records
// USDA requires production records for every meal service, retained 3 years.
// Kitchens log what was prepared; records can auto-fill from the week's menu.
const pool = require('../config/database');

// Helper: given a JS Date, return day_of_week integer (1=Mon … 7=Sun)
function toDayOfWeek(date) {
  return ((date.getUTCDay() + 6) % 7) + 1;
}

// Helper: given a date string (YYYY-MM-DD), return the Monday of that week
function getMondayOf(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00Z');
  const dow = toDayOfWeek(d);                      // 1=Mon
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (dow - 1));
  return monday.toISOString().split('T')[0];
}

// ── GET /production-records ────────────────────────────────────────────────────
// List records for a month (or week). Returns one row per record with item count.
async function listRecords(req, res) {
  try {
    const { organizationId, role } = req.user;
    const { org_id, month, week_of } = req.query;  // month = YYYY-MM, week_of = YYYY-MM-DD

    let orgFilter, params;

    if (role === 'sponsor' || role === 'admin' || role === 'coordinator') {
      // Sponsor/coordinator sees all their sites' and kitchens' records
      const scopeId = org_id || organizationId;
      orgFilter = `pr.org_id IN (
        SELECT id FROM organizations WHERE sponsor_id = $1
        UNION SELECT $1
      )`;
      params = [scopeId];
    } else {
      orgFilter = `pr.org_id = $1`;
      params    = [organizationId];
    }

    let dateFilter = '';
    if (month) {
      const start = `${month}-01`;
      const [y, m] = month.split('-').map(Number);
      const end = new Date(y, m, 1).toISOString().split('T')[0];
      params.push(start, end);
      dateFilter = `AND pr.date >= $${params.length - 1} AND pr.date < $${params.length}`;
    } else if (week_of) {
      const monday = getMondayOf(week_of);
      const sunday = new Date(monday + 'T00:00:00Z');
      sunday.setUTCDate(sunday.getUTCDate() + 6);
      params.push(monday, sunday.toISOString().split('T')[0]);
      dateFilter = `AND pr.date >= $${params.length - 1} AND pr.date <= $${params.length}`;
    }

    const { rows } = await pool.query(`
      SELECT
        pr.*,
        o.name AS org_name,
        o.type AS org_type,
        (SELECT COUNT(*) FROM production_record_items WHERE record_id = pr.id) AS item_count,
        (SELECT string_agg(food_name, ', ' ORDER BY sort_order, created_at)
         FROM production_record_items WHERE record_id = pr.id) AS food_items_summary
      FROM production_records pr
      JOIN organizations o ON o.id = pr.org_id
      WHERE ${orgFilter} ${dateFilter}
      ORDER BY pr.date DESC, pr.meal_type
    `, params);

    res.json({ records: rows });
  } catch (err) {
    console.error('listRecords error:', err);
    res.status(500).json({ error: 'Failed to load production records' });
  }
}

// ── GET /production-records/:id ────────────────────────────────────────────────
// Single record with all items.
async function getRecord(req, res) {
  try {
    const { id } = req.params;
    const { organizationId, role } = req.user;

    const { rows } = await pool.query(
      `SELECT pr.*, o.name AS org_name
       FROM production_records pr
       JOIN organizations o ON o.id = pr.org_id
       WHERE pr.id = $1`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Record not found' });

    // Access check
    const rec = rows[0];
    if (role !== 'sponsor' && role !== 'admin' && rec.org_id !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const itemsRes = await pool.query(
      `SELECT * FROM production_record_items WHERE record_id = $1 ORDER BY sort_order, created_at`,
      [id]
    );

    res.json({ ...rec, items: itemsRes.rows });
  } catch (err) {
    console.error('getRecord error:', err);
    res.status(500).json({ error: 'Failed to load record' });
  }
}

// ── POST /production-records ───────────────────────────────────────────────────
// Create or update a record (upsert on org_id + date + meal_type).
async function upsertRecord(req, res) {
  try {
    const { organizationId, id: userId, role } = req.user;
    const { org_id, date, meal_type, servings_planned = 0, servings_prepared = 0, notes, status } = req.body;

    if (!date || !meal_type) return res.status(400).json({ error: 'date and meal_type are required' });

    const targetOrg = (role === 'sponsor' || role === 'admin') && org_id ? org_id : organizationId;

    const { rows } = await pool.query(`
      INSERT INTO production_records (org_id, date, meal_type, servings_planned, servings_prepared, notes, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (org_id, date, meal_type)
      DO UPDATE SET
        servings_planned  = EXCLUDED.servings_planned,
        servings_prepared = EXCLUDED.servings_prepared,
        notes             = COALESCE(EXCLUDED.notes, production_records.notes),
        status            = COALESCE(EXCLUDED.status, production_records.status),
        updated_at        = NOW()
      RETURNING *
    `, [targetOrg, date, meal_type, servings_planned, servings_prepared, notes || null, status || 'draft', userId]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('upsertRecord error:', err);
    res.status(500).json({ error: 'Failed to save record' });
  }
}

// ── PUT /production-records/:id ────────────────────────────────────────────────
// Partial update — servings, notes, status.
async function updateRecord(req, res) {
  try {
    const { id } = req.params;
    const { organizationId, role } = req.user;
    const { date, meal_type, servings_planned, servings_prepared, notes, status } = req.body;

    // Ownership check
    const own = await pool.query(`SELECT org_id FROM production_records WHERE id = $1`, [id]);
    if (!own.rows.length) return res.status(404).json({ error: 'Record not found' });
    if (role !== 'sponsor' && role !== 'admin' && own.rows[0].org_id !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      UPDATE production_records
      SET
        date              = COALESCE($1, date),
        meal_type         = COALESCE($2, meal_type),
        servings_planned  = COALESCE($3, servings_planned),
        servings_prepared = COALESCE($4, servings_prepared),
        notes             = COALESCE($5, notes),
        status            = COALESCE($6, status),
        updated_at        = NOW()
      WHERE id = $7
      RETURNING *
    `, [date ?? null, meal_type ?? null, servings_planned ?? null, servings_prepared ?? null, notes ?? null, status ?? null, id]);

    res.json(rows[0]);
  } catch (err) {
    console.error('updateRecord error:', err);
    res.status(500).json({ error: 'Failed to update record' });
  }
}

// ── POST /production-records/auto-fill ────────────────────────────────────────
// Pull items from this week's menu and insert into a record.
// Creates the record first if it doesn't exist.
async function autoFill(req, res) {
  try {
    const { organizationId, id: userId, role } = req.user;
    const { org_id, date, meal_type } = req.body;

    if (!date || !meal_type) return res.status(400).json({ error: 'date and meal_type are required' });

    const targetOrg = (role === 'sponsor' || role === 'admin') && org_id ? org_id : organizationId;
    const monday    = getMondayOf(date);
    const dayNum    = toDayOfWeek(new Date(date + 'T00:00:00Z'));

    // 1. Find the menu for this org + week
    const menuRes = await pool.query(
      `SELECT id FROM menus WHERE org_id = $1 AND week_start = $2 ORDER BY created_at DESC LIMIT 1`,
      [targetOrg, monday]
    );
    if (!menuRes.rows.length) {
      return res.status(404).json({ error: 'No menu found for this week. Build a menu first.' });
    }
    const menuId = menuRes.rows[0].id;

    // 2. Pull matching items
    const itemsRes = await pool.query(
      `SELECT food_item, component, is_whole_grain, quantity
       FROM menu_items
       WHERE menu_id = $1 AND day_of_week = $2 AND meal_type = $3
       ORDER BY component, food_item`,
      [menuId, dayNum, meal_type]
    );
    if (!itemsRes.rows.length) {
      return res.status(404).json({ error: 'No menu items found for this meal. Add items to the menu first.' });
    }

    // 3. Get or create the production record
    const { rows: recRows } = await pool.query(`
      INSERT INTO production_records (org_id, date, meal_type, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (org_id, date, meal_type) DO UPDATE SET updated_at = NOW()
      RETURNING *
    `, [targetOrg, date, meal_type, userId]);
    const record = recRows[0];

    // 4. Delete existing auto-filled items to replace them
    await pool.query(`DELETE FROM production_record_items WHERE record_id = $1`, [record.id]);

    // 5. Insert items from menu
    const inserted = [];
    for (let i = 0; i < itemsRes.rows.length; i++) {
      const mi = itemsRes.rows[i];
      const { rows: itemRows } = await pool.query(`
        INSERT INTO production_record_items
          (record_id, food_name, component, quantity_planned, is_wgr, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `, [record.id, mi.food_item, mi.component, mi.quantity || null, mi.is_whole_grain || false, i]);
      inserted.push(itemRows[0]);
    }

    res.json({ record, items: inserted, filled: inserted.length });
  } catch (err) {
    console.error('autoFill error:', err);
    res.status(500).json({ error: 'Failed to auto-fill production record' });
  }
}

// ── POST /production-records/:id/items ────────────────────────────────────────
// Add or update a food item on a record.
async function upsertItem(req, res) {
  try {
    const { id: recordId } = req.params;
    const { organizationId, role } = req.user;
    const { food_name, component, quantity_planned, quantity_actual, is_wgr = false } = req.body;

    if (!food_name) return res.status(400).json({ error: 'food_name is required' });

    const own = await pool.query(`SELECT org_id FROM production_records WHERE id = $1`, [recordId]);
    if (!own.rows.length) return res.status(404).json({ error: 'Record not found' });
    if (role !== 'sponsor' && role !== 'admin' && own.rows[0].org_id !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      INSERT INTO production_record_items
        (record_id, food_name, component, quantity_planned, quantity_actual, is_wgr)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [recordId, food_name.trim(), component || 'other', quantity_planned || null, quantity_actual || null, is_wgr]);

    await pool.query(`UPDATE production_records SET updated_at = NOW() WHERE id = $1`, [recordId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('upsertItem error:', err);
    res.status(500).json({ error: 'Failed to save item' });
  }
}

// ── DELETE /production-records/items/:item_id ─────────────────────────────────
async function deleteItem(req, res) {
  try {
    const { item_id } = req.params;
    const { organizationId, role } = req.user;

    const { rows } = await pool.query(`
      SELECT pr.org_id FROM production_record_items pri
      JOIN production_records pr ON pr.id = pri.record_id
      WHERE pri.id = $1
    `, [item_id]);
    if (!rows.length) return res.status(404).json({ error: 'Item not found' });
    if (role !== 'sponsor' && role !== 'admin' && rows[0].org_id !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query(`DELETE FROM production_record_items WHERE id = $1`, [item_id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error('deleteItem error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
}

// ── GET /production-records/summary ───────────────────────────────────────────
// Month summary: total records, complete count, draft count — used by sponsor.
async function getSummary(req, res) {
  try {
    const { organizationId, role } = req.user;
    const { month } = req.query; // YYYY-MM

    if (!month) return res.status(400).json({ error: 'month is required' });

    const [y, m] = month.split('-').map(Number);
    const start  = `${month}-01`;
    const end    = new Date(y, m, 1).toISOString().split('T')[0];

    let orgFilter, params;
    if (role === 'sponsor' || role === 'admin' || role === 'coordinator') {
      orgFilter = `org_id IN (SELECT id FROM organizations WHERE sponsor_id = $1 UNION SELECT $1)`;
      params    = [organizationId, start, end];
    } else {
      orgFilter = `org_id = $1`;
      params    = [organizationId, start, end];
    }

    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                           AS total,
        COUNT(*) FILTER (WHERE status = 'complete')       AS complete,
        COUNT(*) FILTER (WHERE status = 'draft')          AS draft
      FROM production_records
      WHERE ${orgFilter} AND date >= $2 AND date < $3
    `, params);

    res.json(rows[0]);
  } catch (err) {
    console.error('getSummary error:', err);
    res.status(500).json({ error: 'Failed to load summary' });
  }
}

async function deleteRecord(req, res) {
  try {
    const { id } = req.params;
    const { organizationId, role } = req.user;
    const own = await pool.query(`SELECT org_id FROM production_records WHERE id = $1`, [id]);
    if (!own.rows.length) return res.status(404).json({ error: 'Record not found' });
    if (role !== 'sponsor' && role !== 'admin' && own.rows[0].org_id !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    // Cascade deletes items automatically (FK ON DELETE CASCADE in schema)
    await pool.query(`DELETE FROM production_records WHERE id = $1`, [id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error('deleteRecord error:', err);
    res.status(500).json({ error: 'Failed to delete record' });
  }
}

// ── GET /production-records/prefill ───────────────────────────────────────────
// Returns a PREVIEW of what the production record would look like if auto-filled
// from the menu. Does NOT save anything. Frontend uses this to pre-populate the form.
// Also returns enrollment count so the attendance banner can show "32 children".
async function prefillPreview(req, res) {
  try {
    const { organizationId, role } = req.user;
    const { date, org_id, meal_type } = req.query;

    if (!date) return res.status(400).json({ error: 'date is required' });

    const targetOrg = (role === 'sponsor' || role === 'admin') && org_id ? org_id : organizationId;
    const monday    = getMondayOf(date);
    const dayNum    = toDayOfWeek(new Date(date + 'T00:00:00Z'));

    // 1. Find the menu — try active cycle schedule first, then fall back to direct week lookup
    let menuId   = null;
    let menuName = null;
    let cycleInfo = null; // { cycle_name, week_number, week_label }

    try {
      const { _resolveMenu } = require('./menuCyclesController');
      const resolved = await _resolveMenu(targetOrg, date);
      if (resolved.found) {
        menuId    = resolved.menu_id;
        menuName  = resolved.menu_name;
        cycleInfo = { cycle_name: resolved.cycle_name, week_number: resolved.week_number, week_label: resolved.week_label };
      }
    } catch (_) { /* menuCyclesController may not be deployed yet */ }

    // Fall back to direct menu for this week if no cycle match
    if (!menuId) {
      const menuRes = await pool.query(
        `SELECT id, week_start, name FROM menus WHERE org_id = $1 AND week_start = $2 ORDER BY created_at DESC LIMIT 1`,
        [targetOrg, monday]
      );
      menuId   = menuRes.rows[0]?.id   ?? null;
      menuName = menuRes.rows[0]?.name ?? null;
    }

    // 2. Pull menu items for this day (all meal types, or specific one)
    let items = [];
    if (menuId) {
      const params = [menuId, dayNum];
      const mealFilter = meal_type ? `AND meal_type = $3` : '';
      if (meal_type) params.push(meal_type);

      const itemsRes = await pool.query(
        `SELECT food_item, component, meal_type, is_whole_grain, quantity
         FROM menu_items
         WHERE menu_id = $1 AND day_of_week = $2 ${mealFilter}
         ORDER BY meal_type, component, food_item`,
        params
      );
      items = itemsRes.rows;
    }

    // 3. Get enrollment count (children with approved/draft status)
    const enrollRes = await pool.query(
      `SELECT COUNT(*) AS count FROM children WHERE org_id = $1 AND form_status IN ('approved', 'draft')`,
      [targetOrg]
    );
    const enrollmentCount = parseInt(enrollRes.rows[0]?.count ?? 0);

    // 4. Check if a production record already exists for this date+meal
    const existingParams = [targetOrg, date];
    const existingFilter = meal_type ? `AND meal_type = $3` : '';
    if (meal_type) existingParams.push(meal_type);
    const existingRes = await pool.query(
      `SELECT id, meal_type, status, servings_prepared FROM production_records
       WHERE org_id = $1 AND date = $2 ${existingFilter}`,
      existingParams
    );

    res.json({
      date,
      org_id:          targetOrg,
      menu_found:      !!menuId,
      menu_name:       menuName,
      cycle_info:      cycleInfo,    // { cycle_name, week_number, week_label } if from a cycle
      week_start:      monday,
      enrollment_count: enrollmentCount,
      items,                         // pre-filled food items from menu
      existing_records: existingRes.rows, // any already-saved records for this date
    });
  } catch (err) {
    console.error('prefillPreview error:', err);
    res.status(500).json({ error: 'Failed to load prefill data' });
  }
}

module.exports = {
  listRecords, getRecord, upsertRecord, updateRecord, deleteRecord,
  autoFill, upsertItem, deleteItem, getSummary, prefillPreview,
};
