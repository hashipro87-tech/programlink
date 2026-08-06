// menusController.js — CACFP weekly menu builder + meal pattern validation
const pool = require('../config/database');
const { logActivity, TYPES } = require('../services/activityService');
const fs   = require('fs');
const path = require('path');
// Anthropic, mammoth, xlsx, pdfParse are required lazily inside extractMenuFromFile
// to avoid crashing the server at startup if any of these have environment issues.

// ── CACFP Meal Pattern Rules ──────────────────────────────────────────────────
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
    const present = ['milk','grain','protein','fruit','vegetable'].filter(c => has(c)).length;
    if (present < 2) missing.push(`${2 - present} more component${2 - present !== 1 ? 's' : ''} required`);
  } else if (mealType === 'infant') {
    if (!has('formula')) missing.push('Breast Milk / Formula');
  }
  return missing;
}

function validateWGR(dayItems) {
  const grains = dayItems.filter(i => i.component === 'grain');
  if (grains.length === 0) return true;
  return grains.some(i => i.is_whole_grain);
}

// ── GET /menus ─────────────────────────────────────────────────────────────────
async function listMenus(req, res) {
  try {
    const { organizationId, role } = req.user;
    const { org_id, limit = 12, offset = 0 } = req.query;
    let where, params;
    if (role === 'sponsor' || role === 'admin') {
      where  = `WHERE m.org_id IN (SELECT id FROM organizations WHERE sponsor_id = (SELECT sponsor_id FROM organizations WHERE id = $1) UNION SELECT $1)`;
      params = [organizationId];
    } else {
      where  = `WHERE m.org_id = $1`;
      params = [organizationId];
    }
    let idx = params.length + 1;
    if (org_id) { where += ` AND m.org_id = $${idx++}`; params.push(org_id); }
    const { rows } = await pool.query(
      `SELECT m.*, o.name AS org_name,
         (SELECT COUNT(*) FROM menu_items WHERE menu_id = m.id) AS item_count
       FROM menus m JOIN organizations o ON o.id = m.org_id
       ${where} ORDER BY m.week_start DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, Number(limit), Number(offset)]
    );
    const countRes = await pool.query(`SELECT COUNT(*) FROM menus m ${where}`, params);
    res.json({ menus: rows, total: Number(countRes.rows[0].count) });
  } catch (err) {
    console.error('listMenus error:', err);
    res.status(500).json({ error: 'Failed to load menus' });
  }
}

// ── GET /menus/rates ───────────────────────────────────────────────────────────
async function getEstimateRates(req, res) {
  try {
    const { organizationId } = req.user;
    const orgRes = await pool.query('SELECT region FROM organizations WHERE id = $1', [organizationId]);
    const state  = orgRes.rows[0]?.region;
    if (!state) return res.json({ rates: null, state: null });
    const configPath = path.join(__dirname, '../services/stateConfigs', `${state}.json`);
    if (!fs.existsSync(configPath)) return res.json({ rates: null, state });
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json({
      state,
      rates: {
        breakfast: config.rates?.breakfast?.tier1 ?? 0,
        lunch:     config.rates?.lunch?.tier1     ?? 0,
        snack:     config.rates?.snack?.tier1     ?? 0,
        supper:    config.rates?.supper?.tier1    ?? 0,
      }
    });
  } catch (err) {
    console.error('getEstimateRates error:', err);
    res.json({ rates: null, state: null });
  }
}

// ── GET /menus/templates ───────────────────────────────────────────────────────
async function listTemplates(req, res) {
  try {
    const { organizationId } = req.user;
    const { rows } = await pool.query(
      `SELECT * FROM menu_templates WHERE org_id = $1 ORDER BY created_at DESC`,
      [organizationId]
    );
    res.json({ templates: rows });
  } catch (err) {
    console.error('listTemplates error:', err);
    res.status(500).json({ error: 'Failed to load templates' });
  }
}

// ── POST /menus/templates ──────────────────────────────────────────────────────
async function saveTemplate(req, res) {
  try {
    const { organizationId } = req.user;
    const { name, meal_type, items } = req.body;
    if (!name || !items) return res.status(400).json({ error: 'name and items required' });
    const { rows } = await pool.query(
      `INSERT INTO menu_templates (org_id, name, meal_type, items) VALUES ($1,$2,$3,$4) RETURNING *`,
      [organizationId, name, meal_type || null, JSON.stringify(items)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('saveTemplate error:', err);
    res.status(500).json({ error: 'Failed to save template' });
  }
}

// ── DELETE /menus/templates/:id ────────────────────────────────────────────────
async function deleteTemplate(req, res) {
  try {
    const { organizationId } = req.user;
    await pool.query(
      `DELETE FROM menu_templates WHERE id = $1 AND org_id = $2`,
      [req.params.id, organizationId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('deleteTemplate error:', err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
}

// ── GET /menus/:id ─────────────────────────────────────────────────────────────
async function getMenu(req, res) {
  try {
    const { id } = req.params;
    const menuRes = await pool.query(
      `SELECT m.*, o.name AS org_name FROM menus m
       JOIN organizations o ON o.id = m.org_id WHERE m.id = $1`, [id]
    );
    if (!menuRes.rows.length) return res.status(404).json({ error: 'Menu not found' });
    const itemsRes = await pool.query(
      `SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY day_of_week, meal_type, component`, [id]
    );
    const items = itemsRes.rows;
    const DAYS  = [1,2,3,4,5,6,7];
    const MEALS = ['breakfast','lunch','snack','supper','infant'];
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
    const { org_id, name, week_start, notes, has_infant } = req.body;
    if (!week_start) return res.status(400).json({ error: 'week_start is required' });
    const targetOrg = org_id || organizationId;
    const { rows } = await pool.query(
      `INSERT INTO menus (org_id, name, week_start, notes, has_infant, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (org_id, week_start) DO UPDATE SET name=$2, notes=$4, has_infant=$5, updated_at=NOW()
       RETURNING *`,
      [targetOrg, name || `Week of ${week_start}`, week_start, notes || null, has_infant || false, userId]
    );
    await logActivity({ org_id: targetOrg, actor_id: userId, type: 'menu_created',
      title: `Menu planned: ${rows[0].name}`, link: `/dashboard/sponsor/menus` });
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
    const { name, status, notes, has_infant } = req.body;
    const { rows } = await pool.query(
      `UPDATE menus SET
         name       = COALESCE($1, name),
         status     = COALESCE($2, status),
         notes      = COALESCE($3, notes),
         has_infant = COALESCE($4, has_infant),
         updated_at = NOW()
       WHERE id=$5 AND org_id=$6 RETURNING *`,
      [name, status, notes, has_infant, id, organizationId]
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
    await pool.query(`DELETE FROM menus WHERE id=$1 AND org_id=$2`, [id, organizationId]);
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
    const check = await pool.query(`SELECT id FROM menus WHERE id=$1 AND org_id=$2`, [menu_id, organizationId]);
    if (!check.rows.length) return res.status(403).json({ error: 'Access denied' });
    const { rows } = await pool.query(
      `INSERT INTO menu_items (menu_id, day_of_week, meal_type, food_item, component, is_whole_grain, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING *`,
      [menu_id, day_of_week, meal_type, food_item.trim(), component, is_whole_grain, quantity || null]
    );
    await pool.query(`UPDATE menus SET updated_at=NOW() WHERE id=$1`, [menu_id]);
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
    await pool.query(
      `DELETE FROM menu_items mi USING menus m
       WHERE mi.id=$1 AND mi.menu_id=m.id AND m.org_id=$2`,
      [item_id, organizationId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('deleteItem error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
}

// ── POST /menus/:id/generate ───────────────────────────────────────────────────
async function generateMenu(req, res) {
  try {
    const { id: menuId } = req.params;
    const { organizationId, id: userId } = req.user;
    const { preferences = '' } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('generateMenu: ANTHROPIC_API_KEY is not set in environment variables');
      return res.status(503).json({ error: 'AI generation is not configured. Contact support.' });
    }

    const check = await pool.query(`SELECT id FROM menus WHERE id=$1 AND org_id=$2`, [menuId, organizationId]);
    if (!check.rows.length) return res.status(403).json({ error: 'Access denied' });

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prefNote = preferences ? `\nAdditional preferences: ${preferences}` : '';
    const prompt = `You are a CACFP meal planner for a childcare center. Generate a complete, varied 7-day weekly menu (Monday through Sunday).${prefNote}

CACFP meal pattern REQUIREMENTS (must be followed exactly):
- Breakfast: Milk + Grain/Bread + (Fruit OR Vegetable)
- Lunch & Supper: Milk + Grain/Bread + Meat/Protein + Fruit + Vegetable
- Snack: any 2 of {Milk, Grain/Bread, Meat/Protein, Fruit, Vegetable}
- At least one grain per day must be Whole Grain Rich (≥51% whole grain, is_whole_grain=true)

Return ONLY a valid JSON array. No markdown, no explanation, no extra text.
Each item: { "day_of_week": number, "meal_type": string, "food_item": string, "component": string, "is_whole_grain": boolean, "quantity": string }

Rules:
- day_of_week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
- meal_type: "breakfast", "lunch", "snack", or "supper"
- component: "milk", "grain", "protein", "fruit", "vegetable", or "other"
- quantity: realistic child-sized portion (e.g., "1 cup", "2 oz", "1 slice", "1/2 cup")
- Vary foods across the week — no repeats on consecutive days for main items
- Use common, kid-friendly, easy-to-prepare foods`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    let text = response.content[0].text.trim();
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const menuItems = JSON.parse(text);

    // Clear existing items
    await pool.query(`DELETE FROM menu_items WHERE menu_id=$1`, [menuId]);

    // Bulk insert
    const inserted = [];
    for (const item of menuItems) {
      if (!item.day_of_week || !item.meal_type || !item.food_item || !item.component) continue;
      const r = await pool.query(
        `INSERT INTO menu_items (menu_id, day_of_week, meal_type, food_item, component, is_whole_grain, quantity)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING *`,
        [menuId, item.day_of_week, item.meal_type, item.food_item, item.component,
         item.is_whole_grain || false, item.quantity || null]
      );
      if (r.rows[0]) inserted.push(r.rows[0]);
    }

    await pool.query(`UPDATE menus SET updated_at=NOW() WHERE id=$1`, [menuId]);
    res.json({ items: inserted, count: inserted.length });
  } catch (err) {
    console.error('generateMenu error:', err.message, err.status ?? '', err.error ?? '');
    res.status(500).json({ error: 'AI generation failed — try again' });
  }
}

// ── GET /menus/:id/comments ────────────────────────────────────────────────────
async function listComments(req, res) {
  try {
    const { id: menuId } = req.params;
    const { rows } = await pool.query(
      `SELECT mc.*, u.name AS author_name
       FROM menu_comments mc
       LEFT JOIN users u ON u.id = mc.created_by
       WHERE mc.menu_id=$1
       ORDER BY mc.day_of_week, mc.meal_type, mc.created_at DESC`,
      [menuId]
    );
    res.json({ comments: rows });
  } catch (err) {
    console.error('listComments error:', err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
}

// ── POST /menus/:id/comments ───────────────────────────────────────────────────
async function addComment(req, res) {
  try {
    const { id: menuId } = req.params;
    const { id: userId } = req.user;
    const { day_of_week, meal_type, comment } = req.body;
    if (!comment?.trim()) return res.status(400).json({ error: 'comment is required' });
    const { rows } = await pool.query(
      `INSERT INTO menu_comments (menu_id, day_of_week, meal_type, comment, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [menuId, day_of_week || null, meal_type || null, comment.trim(), userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

// ── DELETE /menus/:id/comments/:commentId ─────────────────────────────────────
async function deleteComment(req, res) {
  try {
    const { id: userId } = req.user;
    await pool.query(
      `DELETE FROM menu_comments WHERE id=$1 AND created_by=$2`,
      [req.params.commentId, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('deleteComment error:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}

// ── POST /menus/import/extract ─────────────────────────────────────────────────
// Accepts a file upload (PDF, DOCX, XLSX, CSV), extracts text, sends to Claude,
// returns structured menu items ready for review and import.
async function extractMenuFromFile(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    // Lazy requires — keep these out of the module top-level so a missing/broken
    // package doesn't crash the server at startup.
    const Anthropic = require('@anthropic-ai/sdk');
    const mammoth   = require('mammoth');
    const xlsx      = require('xlsx');

    const { mimetype, buffer, originalname = '' } = req.file;
    const name = originalname.toLowerCase();
    let text = '';
    let pdfBuffer = null; // set for PDFs — sent directly to Claude as a document

    if (mimetype === 'application/pdf' || name.endsWith('.pdf')) {
      // Use Claude's native PDF support — no pdf-parse needed, no DOMMatrix issues
      pdfBuffer = buffer;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (
      mimetype.includes('spreadsheet') || mimetype.includes('excel') ||
      name.match(/\.(xlsx|xls)$/)
    ) {
      const wb = xlsx.read(buffer, { type: 'buffer' });
      text = wb.SheetNames.map(sName => {
        return `--- Sheet: ${sName} ---\n${xlsx.utils.sheet_to_csv(wb.Sheets[sName])}`;
      }).join('\n\n');
    } else {
      // Plain text / CSV / unknown
      text = buffer.toString('utf8');
    }

    if (!pdfBuffer && !text.trim()) {
      return res.status(400).json({ error: 'Could not read text from this file. Try Excel, Word, or CSV.' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'AI extraction is not configured.' });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const instructions = `You are a CACFP menu data extractor. Extract every food item from the weekly menu.

Return ONLY a valid JSON array — no markdown, no explanation, no code fences.

Each object:
{
  "day_of_week": 1-7 (1=Monday…7=Sunday),
  "meal_type": "breakfast"|"am_snack"|"lunch"|"pm_snack"|"snack"|"supper",
  "food_item": "food name exactly as written",
  "component": "grain"|"meat/alt"|"fruit"|"vegetable"|"dairy"|"other",
  "is_whole_grain": true|false,
  "quantity": "serving size if listed, else null"
}

Rules:
- Milk, yogurt, cheese → "dairy"
- Bread, rice, pasta, tortilla, cereal, oatmeal, grits, muffin → "grain"
- Chicken, beef, turkey, fish, eggs, beans, peanut butter, tofu → "meat/alt"
- Fruits → "fruit"; Vegetables → "vegetable"; else → "other"
- Whole wheat / whole grain / oatmeal / brown rice → is_whole_grain: true
- "Snack" without AM/PM → "snack"
- If no day listed, assign day 1 (Monday) to all items
- If no items found, return []`;

    // Build the message content — PDF uses native document support, text uses plain prompt
    let messageContent;
    if (pdfBuffer) {
      messageContent = [
        { type: 'text', text: instructions },
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBuffer.toString('base64'),
          },
        },
      ];
    } else {
      messageContent = `${instructions}\n\nDocument:\n${text.slice(0, 14000)}`;
    }

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: messageContent }],
    });

    const raw     = msg.content[0]?.text?.trim() ?? '[]';
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    let items;
    try {
      items = JSON.parse(cleaned);
    } catch {
      return res.status(422).json({ error: 'AI could not parse the menu structure. Try a cleaner file or CSV format.' });
    }

    if (!Array.isArray(items)) items = [];

    const VALID_MEALS  = ['breakfast','am_snack','lunch','pm_snack','snack','supper'];
    const VALID_COMPS  = ['grain','meat/alt','fruit','vegetable','dairy','other'];

    items = items
      .filter(it => it.food_item && typeof it.food_item === 'string' && it.food_item.trim())
      .map(it => ({
        day_of_week:    Math.min(7, Math.max(1, parseInt(it.day_of_week) || 1)),
        meal_type:      VALID_MEALS.includes(it.meal_type) ? it.meal_type : 'breakfast',
        food_item:      String(it.food_item).trim().slice(0, 200),
        component:      VALID_COMPS.includes(it.component) ? it.component : 'other',
        is_whole_grain: !!it.is_whole_grain,
        quantity:       it.quantity ? String(it.quantity).slice(0, 50) : null,
      }));

    res.json({ items, count: items.length });
  } catch (err) {
    console.error('extractMenuFromFile error:', err);
    res.status(500).json({ error: 'Failed to extract menu from file.' });
  }
}

module.exports = {
  listMenus, getMenu, createMenu, updateMenu, deleteMenu, upsertItem, deleteItem,
  getEstimateRates, listTemplates, saveTemplate, deleteTemplate,
  generateMenu, listComments, addComment, deleteComment, extractMenuFromFile,
};
