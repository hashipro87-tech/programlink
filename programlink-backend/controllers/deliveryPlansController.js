// deliveryPlansController.js — Recurring Delivery Plans
// Sponsors create plans once; CACFPLink auto-generates daily delivery instances.

const pool = require('../config/database');
const { createNotification } = require('../services/notificationService');

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

// ─── List plans (sponsor) ──────────────────────────────────────────────────────
exports.listPlans = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    const { rows } = await pool.query(`
      SELECT
        dp.*,
        s.name  AS site_name,
        k.name  AS kitchen_name
      FROM delivery_plans dp
      JOIN organizations s ON s.id = dp.site_id
      LEFT JOIN organizations k ON k.id = dp.kitchen_id
      WHERE dp.sponsor_id = $1
      ORDER BY dp.created_at DESC
    `, [sponsorId]);
    res.json({ plans: rows });
  } catch (err) {
    console.error('listPlans error:', err);
    res.status(500).json({ error: 'Failed to fetch delivery plans.' });
  }
};

// ─── Create plan (sponsor) ────────────────────────────────────────────────────
exports.createPlan = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    const {
      site_id, kitchen_id, name,
      days_of_week, arrival_time,
      breakfast = 0, lunch = 0, snack = 0, supper = 0,
      start_date, end_date, auto_notify = true,
    } = req.body;

    if (!site_id || !days_of_week?.length || !arrival_time || !start_date) {
      return res.status(400).json({ error: 'site_id, days_of_week, arrival_time, and start_date are required.' });
    }

    const { rows } = await pool.query(`
      INSERT INTO delivery_plans
        (sponsor_id, site_id, kitchen_id, name, days_of_week, arrival_time,
         breakfast, lunch, snack, supper, start_date, end_date, auto_notify)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [sponsorId, site_id, kitchen_id || null, name || null,
        days_of_week, arrival_time,
        breakfast, lunch, snack, supper,
        start_date, end_date || null, auto_notify]);

    // Generate instances for the next 60 days immediately
    await generateInstancesForPlan(rows[0]);

    res.status(201).json({ plan: rows[0] });
  } catch (err) {
    console.error('createPlan error:', err);
    res.status(500).json({ error: 'Failed to create delivery plan.' });
  }
};

// ─── Update plan ───────────────────────────────────────────────────────────────
exports.updatePlan = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    const {
      site_id, kitchen_id, name,
      days_of_week, arrival_time,
      breakfast, lunch, snack, supper,
      start_date, end_date, auto_notify, active,
    } = req.body;

    const { rows } = await pool.query(`
      UPDATE delivery_plans
      SET
        site_id      = COALESCE($1, site_id),
        kitchen_id   = COALESCE($2, kitchen_id),
        name         = COALESCE($3, name),
        days_of_week = COALESCE($4, days_of_week),
        arrival_time = COALESCE($5, arrival_time),
        breakfast    = COALESCE($6, breakfast),
        lunch        = COALESCE($7, lunch),
        snack        = COALESCE($8, snack),
        supper       = COALESCE($9, supper),
        start_date   = COALESCE($10, start_date),
        end_date     = COALESCE($11, end_date),
        auto_notify  = COALESCE($12, auto_notify),
        active       = COALESCE($13, active),
        updated_at   = NOW()
      WHERE id = $14 AND sponsor_id = $15
      RETURNING *
    `, [site_id, kitchen_id, name, days_of_week, arrival_time,
        breakfast, lunch, snack, supper, start_date, end_date,
        auto_notify, active, req.params.id, sponsorId]);

    if (!rows.length) return res.status(404).json({ error: 'Plan not found.' });
    res.json({ plan: rows[0] });
  } catch (err) {
    console.error('updatePlan error:', err);
    res.status(500).json({ error: 'Failed to update plan.' });
  }
};

// ─── Delete (deactivate) plan ─────────────────────────────────────────────────
exports.deletePlan = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    await pool.query(
      `UPDATE delivery_plans SET active = FALSE, updated_at = NOW() WHERE id = $1 AND sponsor_id = $2`,
      [req.params.id, sponsorId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('deletePlan error:', err);
    res.status(500).json({ error: 'Failed to delete plan.' });
  }
};

// ─── Get schedule for a site (site role) ─────────────────────────────────────
// Returns upcoming delivery instances for the authenticated site's org,
// shaped like route objects so the site delivery page works without changes.
exports.getSiteSchedule = async (req, res) => {
  try {
    const siteId = req.user.organizationId;
    const days   = Math.min(parseInt(req.query.days ?? 30, 10), 90);
    const from   = req.query.from ?? new Date().toISOString().split('T')[0];

    const { rows } = await pool.query(`
      SELECT
        di.id,
        di.plan_id,
        di.date,
        di.status,
        di.notes,
        dp.arrival_time,
        dp.breakfast,
        dp.lunch,
        dp.snack,
        dp.supper,
        dp.auto_notify,
        s.name  AS site_name,
        k.name  AS kitchen_name
      FROM delivery_instances di
      JOIN delivery_plans dp ON dp.id = di.plan_id
      JOIN organizations  s  ON s.id  = dp.site_id
      LEFT JOIN organizations k ON k.id = dp.kitchen_id
      WHERE dp.site_id = $1
        AND di.date >= $2
        AND di.date <= $2::date + $3 * INTERVAL '1 day'
        AND di.status != 'skipped'
      ORDER BY di.date ASC
    `, [siteId, from, days]);

    // Shape to match route objects expected by SiteDashboard
    const deliveries = rows.map((r) => {
      const stops = [];
      const time  = r.arrival_time?.slice(0, 5); // HH:MM
      if (r.breakfast > 0) stops.push({ meal_type: 'breakfast', meal_count: r.breakfast, pickup_time: time });
      if (r.lunch     > 0) stops.push({ meal_type: 'lunch',     meal_count: r.lunch,     pickup_time: time });
      if (r.snack     > 0) stops.push({ meal_type: 'snack',     meal_count: r.snack,     pickup_time: time });
      if (r.supper    > 0) stops.push({ meal_type: 'supper',    meal_count: r.supper,    pickup_time: time });
      return {
        id:           r.id,
        plan_id:      r.plan_id,
        date:         r.date,
        status:       r.status,
        kitchen_name: r.kitchen_name,
        site_name:    r.site_name,
        stops,
      };
    });

    res.json({ deliveries });
  } catch (err) {
    console.error('getSiteSchedule error:', err);
    res.status(500).json({ error: 'Failed to fetch delivery schedule.' });
  }
};

// ─── Skip / update a single instance ─────────────────────────────────────────
exports.updateInstance = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { rows } = await pool.query(`
      UPDATE delivery_instances
      SET status = COALESCE($1, status), notes = COALESCE($2, notes)
      WHERE id = $3
      RETURNING *
    `, [status, notes, req.params.instanceId]);
    if (!rows.length) return res.status(404).json({ error: 'Instance not found.' });
    res.json({ instance: rows[0] });
  } catch (err) {
    console.error('updateInstance error:', err);
    res.status(500).json({ error: 'Failed to update instance.' });
  }
};

// ─── Internal: generate instances for one plan ────────────────────────────────
async function generateInstancesForPlan(plan, daysAhead = 60) {
  if (!plan.active) return;
  const today = new Date();
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso     = d.toISOString().split('T')[0];
    const dayName = DAY_NAMES[d.getDay()];

    if (!plan.days_of_week.includes(dayName)) continue;
    if (iso < plan.start_date) continue;
    if (plan.end_date && iso > plan.end_date) continue;

    // Upsert — don't overwrite existing instances
    await pool.query(`
      INSERT INTO delivery_instances (plan_id, date)
      VALUES ($1, $2)
      ON CONFLICT (plan_id, date) DO NOTHING
    `, [plan.id, iso]);
  }
}

// ─── Scheduled job: generate today's instances + notify ──────────────────────
// Called by scheduledJobs.js at 6 AM UTC daily
exports.generateTodayDeliveries = async () => {
  const today   = new Date().toISOString().split('T')[0];
  const dayName = DAY_NAMES[new Date().getDay()];
  console.log(`[cron] Generating delivery instances for ${today} (${dayName})…`);

  try {
    // All active plans that run today
    const { rows: plans } = await pool.query(`
      SELECT
        dp.*,
        s.name  AS site_name,
        k.name  AS kitchen_name
      FROM delivery_plans dp
      JOIN organizations s ON s.id = dp.site_id
      LEFT JOIN organizations k ON k.id = dp.kitchen_id
      WHERE dp.active = TRUE
        AND $1 = ANY(dp.days_of_week)
        AND dp.start_date <= $2
        AND (dp.end_date IS NULL OR dp.end_date >= $2)
    `, [dayName, today]);

    if (!plans.length) {
      console.log('[cron] No delivery plans active today.');
      return;
    }

    for (const plan of plans) {
      // Create instance (ignore if already exists)
      await pool.query(`
        INSERT INTO delivery_instances (plan_id, date)
        VALUES ($1, $2)
        ON CONFLICT (plan_id, date) DO NOTHING
      `, [plan.id, today]);

      if (!plan.auto_notify) continue;

      // Build meal summary
      const meals = [];
      if (plan.breakfast > 0) meals.push(`Breakfast ×${plan.breakfast}`);
      if (plan.lunch     > 0) meals.push(`Lunch ×${plan.lunch}`);
      if (plan.snack     > 0) meals.push(`Snack ×${plan.snack}`);
      if (plan.supper    > 0) meals.push(`Supper ×${plan.supper}`);
      const mealSummary = meals.join(' · ');
      const arrivalTime = plan.arrival_time?.slice(0,5) ?? '';
      const kitchenStr  = plan.kitchen_name ? `${plan.kitchen_name} ` : '';
      const etaStr      = arrivalTime ? ` · ETA ${formatTime(arrivalTime)}` : '';

      // Notify site users
      const siteUsers = await pool.query(
        `SELECT id FROM users WHERE org_id = $1 AND is_active = TRUE`,
        [plan.site_id]
      );
      if (siteUsers.rows.length) {
        await createNotification(siteUsers.rows.map((u) => ({
          userId:    u.id,
          type:      'general',
          title:     `📦 Delivery scheduled today`,
          body:      `${kitchenStr}will deliver: ${mealSummary}${etaStr}`,
          actionUrl: '/dashboard/site/deliveries',
        })));
      }

      // Notify kitchen users
      if (plan.kitchen_id) {
        const kitchenUsers = await pool.query(
          `SELECT id FROM users WHERE org_id = $1 AND is_active = TRUE`,
          [plan.kitchen_id]
        );
        if (kitchenUsers.rows.length) {
          await createNotification(kitchenUsers.rows.map((u) => ({
            userId:    u.id,
            type:      'general',
            title:     `🚚 Delivery to ${plan.site_name} today`,
            body:      `${mealSummary}${etaStr}`,
            actionUrl: '/dashboard/kitchen/deliveries',
          })));
        }
      }
    }

    console.log(`[cron] Generated deliveries and sent notifications for ${plans.length} plans.`);
  } catch (err) {
    console.error('[cron] generateTodayDeliveries failed:', err.message);
  }
};

// Helper: "14:30" → "2:30 PM"
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

module.exports = { ...exports, generateInstancesForPlan };
