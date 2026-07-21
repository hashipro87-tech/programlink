// menusController.js — CACFP weekly menu builder + meal pattern validation
const pool = require('../config/database');
const { logActivity, TYPES } = require('../services/activityService');

// ── CACFP Meal Pattern Rules ──────────────────────────────────────────────────
// Returns array of missing component strings for a given meal
function validateMeal(items, mealType) {
  const has = (comp) => items.some(i => i.component === comp);
  const missing = [];

  if (mealType === 'breakfast') {
    if (!has('milk'))                      missing.push('Milk');
    if (!has('grain'))                     missing.push('Grain/Bread');
    if (!has('fruit') && !has('vegetable')) missing.push('Fruit or Vegetable');
  } else if (mealType === 'lunch' || mealType === 'supper') {
    if (!has('milk'))       missing.push('Milk');
    if (!has('grain'))      missing.push('Grain/Bread');
    if (!has('protein'))    missing.push('Meat/Meat Alternate');
    if (!has('fruit'))      missing.push('Fruit');
    if (!has('vegetable'))  missing.push('Vegetable');
  } else if (mealType === 'snack') {
    // Any 2 of 4 components
    const present = ['milk','grain','protein','fruit','vegetable']
      .filter(c => has(c)).length;
    if (present < 2) missing.push(`${2 - present} more component${2 - present !== 1 ? 's' : ''} required (need any 2 of: Milk, Grain, Protein, Fruit/Vegetable)`);
  }
  return missing;
}

// Check if a day has WGR (at least one grain must be whole grain rich)
function validateWGR(dayItems) {
  const grains = dayItems.filter(i => i.component === 'grain');
  if (grains.length === 0) return true; // no grains = skip WGR check
  return grains.some(i => i.is_whole_grain);
}

// ── GET /menus ─────────────────────────────────────────────────────────────────
async function listMenus(req, res) {
  try {
    const { organizationId, id: userId, role } = req.user;
    const { org_id, limit = 12, offset = 0 } = req.query;

    let where, params;
    if (role === 'sponsor' || role === 'admin') {
      where = `WHERE m.org_id IN (SELECT id FROM organizations WHERE sponsor_id = (SELECT sponsor_id FROM organizations WHERE id = $1) UNION SELECT $1)`;
      params = [organizationId];
    } else {
      where = `WHERE m.org_id = $1`;
      params = [organizationId];
    }

    let idx = params.length + 1;
    if (org_id) { where += ` AND m.org_id = $${idx++}`; params.push(org_id); }

    const { rows } = await pool.query(
      `SELECT m.*, o.name AS org_name,
         (SELECT COUNT(*) FROM menu_items WHERE menu_id = m.id) AS item_count
       FROM menus m
       JOIN organizations o ON o.id = m.org_id
       ${where}
       ORDER BY m.week_start DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Number(limit), Number(offset)]
    );

    const countRes = await pool.query(`SELECT COUNT(*) FROM menus m ${where}`, params);
    res.json({ menus: rows, total: Number(countRes.rows[0].count) });
  } catch (err) {
    console.error('listMenus error:', err);
    res.status(500).json({ error: 'Failed to load menus' });
  }
}

// ── GET /menus/:id ─────────────────────────────────────────────────────────────
// Returns menu + all items + validation report
async function getMenu(req, res) {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const menuRes = await pool.query(
      `SELECT m.*, o.name AS org_name FROM menus m
       JOIN organizations o ON o.id = m.org_id
       WHERE m.id = $1`,
      [id]
    );
    if (!menuRes.rows.length) return res.status(404).json({ error: 'Menu not found' });

    const itemsRes = await pool.query(
      `SELECT * FROM menu_items WHERE menu_id = $1
       ORDER BY day_of_week, meal_type, component`,
      [id]
    );
    const items = itemsRes.rows;

    // Build validation report
    const DAYS   = [1,2,3,4,5];
    const MEALS  = ['breakfast','lunch','snack','supper'];
    const report = {};
    let totalIssues = 0;

    DAYS.forEach(day => {
      const dayItems = items.filter(i => i.day_of_week === day);
      const wgrOk   = validateWGR(dayItems);
      report[day]   = { meals: {}, wgr_ok: wgrOk };
      if (!wgrOk) totalIssues++;

      MEALS.forEach(meal => {
        const mealItems = dayItems.filter(i => i.meal_type === meal);
        const missing   = validateMeal(mealItems, meal);
        report[day].meals[meal] = { missing, ok: missing.length === 0 };
        totalIssues += missing.length;
      });
    });

    res.json({ menu: menuRes.rows[0], items, validation: report, total_issues: totalIssues });
  } catch (err) {
    console.error('getMenu error:', err);
    res.status(500).json({ error: 'Failed to load menu' });
  }
}

// ── POST /menus ────────────────────────────────────────────────────────────────
async function createMenu(req, res) {
  try {
    const { organizationId, id: userId } = req.user;
    const { org_id, name, week_start, notes } = req.body;
    if (!week_start) return res.status(400).json({ error: 'week_start is required' });

    const targetOrg = org_id || organizationId;

    const { rows } = await pool.query(
      `INSERT INTO menus (org_id, name, week_start, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (org_id, week_start) DO UPDATE SET name = $2, notes = $4, updated_at = NOW()
       RETURNING *`,
      [targetOrg, name || `Week of ${week_start}`, week_start, notes || null, userId]
    );

    await logActivity({
      org_id: targetOrg, actor_id: userId,
      type: 'menu_created', title: `Menu planned: ${rows[0].name}`,
      link: `/dashboard/sponsor/menus`,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createMenu error:', err);
    res.status(500).json({ error: 'Failed to create menu' });
  }
}

// ── PUT /menus/:id ─────────────────────────────────────────────────────────────
async function updateMenu(req, res) {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    const { name, status, notes } = req.body;

    const { rows } = await pool.query(
      `UPDATE menus SET
         name       = COALESCE($1, name),
         status     = COALESCE($2, status),
         notes      = COALESCE($3, notes),
         updated_at = NOW()
       WHERE id = $4 AND org_id = $5
       RETURNING *`,
      [name, status, notes, id, organizationId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Menu not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('updateMenu error:', err);
    res.status(500).json({ error: 'Failed to update menu' });
  }
}

// ── DELETE /menus/:id ──────────────────────────────────────────────────────────
async function deleteMenu(req, res) {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    await pool.query(`DELETE FROM menus WHERE id = $1 AND org_id = $2`, [id, organizationId]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteMenu error:', err);
    res.status(500).json({ error: 'Failed to delete menu' });
  }
}

// ── POST /menus/:id/items ──────────────────────────────────────────────────────
async function upsertItem(req, res) {
  try {
    const { id: menu_id } = req.params;
    const { organizationId } = req.user;
    const { day_of_week, meal_type, food_item, component, is_whole_grain = false, quantity } = req.body;

    if (!day_of_week || !meal_type || !food_item || !component)
      return res.status(400).json({ error: 'day_of_week, meal_type, food_item, and component are required' });

    // Verify menu belongs to org
    const check = await pool.query(`SELECT id FROM menus WHERE id = $1 AND org_id = $2`, [menu_id, organizationId]);
    if (!check.rows.length) return res.status(403).json({ error: 'Access denied' });

    const { rows } = await pool.query(
      `INSERT INTO menu_items (menu_id, day_of_week, meal_type, food_item, component, is_whole_grain, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [menu_id, day_of_week, meal_type, food_item.trim(), component, is_whole_grain, quantity || null]
    );

    // Touch parent menu updated_at
    await pool.query(`UPDATE menus SET updated_at = NOW() WHERE id = $1`, [menu_id]);

    res.status(201).json(rows[0] || { menu_id, day_of_week, meal_type, food_item, component });
  } catch (err) {
    console.error('upsertItem error:', err);
    res.status(500).json({ error: 'Failed to save menu item' });
  }
}

// ── DELETE /menus/items/:item_id ───────────────────────────────────────────────
async function deleteItem(req, res) {
  try {
    const { item_id } = req.params;
    const { organizationId } = req.user;

    // Verify via join
    await pool.query(
      `DELETE FROM menu_items mi
       USING menus m
       WHERE mi.id = $1 AND mi.menu_id = m.id AND m.org_id = $2`,
      [item_id, organizationId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('deleteItem error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
}

module.exports = { listMenus, getMenu, createMenu, updateMenu, deleteMenu, upsertItem, deleteItem };
