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
      breakfast_time, lunch_time, snack_time, supper_time,
      start_date, end_date, auto_notify = true,
    } = req.body;

    if (!site_id || !days_of_week?.length || !start_date) {
      return res.status(400).json({ error: 'site_id, days_of_week, and start_date are required.' });
    }

    // arrival_time: use explicit value, or derive from earliest per-meal time, or default to 09:00
    const effectiveArrivalTime = arrival_time
      || [breakfast_time, lunch_time, snack_time, supper_time].filter(Boolean).sort()[0]
      || '09:00';

    const { rows } = await pool.query(`
      INSERT INTO delivery_plans
        (sponsor_id, site_id, kitchen_id, name, days_of_week, arrival_time,
         breakfast, lunch, snack, supper,
         breakfast_time, lunch_time, snack_time, supper_time,
         start_date, end_date, auto_notify)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
    `, [sponsorId, site_id, kitchen_id || null, name || null,
        days_of_week, effectiveArrivalTime,
        breakfast, lunch, snack, supper,
        breakfast_time || null, lunch_time || null, snack_time || null, supper_time || null,
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
      breakfast_time, lunch_time, snack_time, supper_time,
      start_date, end_date, auto_notify, active,
    } = req.body;

    const { rows } = await pool.query(`
      UPDATE delivery_plans
      SET
        site_id        = COALESCE($1, site_id),
        kitchen_id     = COALESCE($2, kitchen_id),
        name           = COALESCE($3, name),
        days_of_week   = COALESCE($4, days_of_week),
        arrival_time   = COALESCE($5, arrival_time),
        breakfast      = COALESCE($6, breakfast),
        lunch          = COALESCE($7, lunch),
        snack          = COALESCE($8, snack),
        supper         = COALESCE($9, supper),
        breakfast_time = COALESCE($10, breakfast_time),
        lunch_time     = COALESCE($11, lunch_time),
        snack_time     = COALESCE($12, snack_time),
        supper_time    = COALESCE($13, supper_time),
        start_date     = COALESCE($14, start_date),
        end_date       = COALESCE($15, end_date),
        auto_notify    = COALESCE($16, auto_notify),
        active         = COALESCE($17, active),
        updated_at     = NOW()
      WHERE id = $18 AND sponsor_id = $19
      RETURNING *
    `, [site_id, kitchen_id, name, days_of_week, arrival_time,
        breakfast, lunch, snack, supper,
        breakfast_time || null, lunch_time || null, snack_time || null, supper_time || null,
        start_date, end_date, auto_notify, active,
        req.params.id, sponsorId]);

    if (!rows.length) return res.status(404).json({ error: 'Plan not found.' });
    res.json({ plan: rows[0] });
  } catch (err) {
    console.error('updatePlan error:', err);
    res.status(500).json({ error: 'Failed to update plan.' });
  }
};

// ─── Delete plan ──────────────────────────────────────────────────────────────
// Hard-deletes the plan + all future (non-delivered) instances.
// Delivered instances are kept for records.
exports.deletePlan = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    const planId = req.params.id;

    // Verify ownership
    const { rows } = await pool.query(
      `SELECT id FROM delivery_plans WHERE id = $1 AND sponsor_id = $2`,
      [planId, sponsorId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Plan not found.' });

    // Delete future instances (keep delivered ones for audit trail)
    await pool.query(
      `DELETE FROM delivery_instances WHERE plan_id = $1 AND status NOT IN ('delivered')`,
      [planId]
    );

    // Delete the plan itself
    await pool.query(`DELETE FROM delivery_plans WHERE id = $1`, [planId]);

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
        di.date::text AS date,
        di.status,
        di.notes,
        dp.arrival_time,
        COALESCE(dp.breakfast_time, dp.arrival_time) AS breakfast_time,
        COALESCE(dp.lunch_time,     dp.arrival_time) AS lunch_time,
        COALESCE(dp.snack_time,     dp.arrival_time) AS snack_time,
        COALESCE(dp.supper_time,    dp.arrival_time) AS supper_time,
        COALESCE(di.breakfast_override, dp.breakfast) AS breakfast,
        COALESCE(di.lunch_override,     dp.lunch)     AS lunch,
        COALESCE(di.snack_override,     dp.snack)     AS snack,
        COALESCE(di.supper_override,    dp.supper)    AS supper,
        dp.auto_notify,
        s.name  AS site_name,
        k.name  AS kitchen_name
      FROM delivery_instances di
      JOIN delivery_plans dp ON dp.id = di.plan_id
      JOIN organizations  s  ON s.id  = dp.site_id
      LEFT JOIN organizations k ON k.id = dp.kitchen_id
      WHERE dp.site_id = $1
        AND di.date >= $2
        AND di.date >= dp.start_date
        AND (dp.end_date IS NULL OR di.date <= dp.end_date)
        AND di.date <= $2::date + $3 * INTERVAL '1 day'
        AND di.status != 'skipped'
      ORDER BY di.date ASC
    `, [siteId, from, days]);

    // Shape to match route objects expected by SiteDashboard
    const deliveries = rows.map((r) => {
      const stops = [];
      if (r.breakfast > 0) stops.push({ meal_type: 'breakfast', meal_count: r.breakfast, pickup_time: r.breakfast_time?.slice(0, 5) });
      if (r.lunch     > 0) stops.push({ meal_type: 'lunch',     meal_count: r.lunch,     pickup_time: r.lunch_time?.slice(0, 5) });
      if (r.snack     > 0) stops.push({ meal_type: 'snack',     meal_count: r.snack,     pickup_time: r.snack_time?.slice(0, 5) });
      if (r.supper    > 0) stops.push({ meal_type: 'supper',    meal_count: r.supper,    pickup_time: r.supper_time?.slice(0, 5) });
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

// ─── Get today's deliveries (sponsor) ────────────────────────────────────────
// Returns all delivery instances for a given date for this sponsor's plans.
// Applies qty overrides so the frontend always sees the effective counts.
exports.getTodayDeliveries = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    const date = req.query.date ?? new Date().toISOString().split('T')[0];

    const { rows } = await pool.query(`
      SELECT
        di.id                                                  AS instance_id,
        di.plan_id,
        di.date::text                                          AS date,
        di.status,
        di.notes,
        COALESCE(di.breakfast_override, dp.breakfast)          AS breakfast,
        COALESCE(di.lunch_override,     dp.lunch)              AS lunch,
        COALESCE(di.snack_override,     dp.snack)              AS snack,
        COALESCE(di.supper_override,    dp.supper)             AS supper,
        dp.breakfast                                           AS plan_breakfast,
        dp.lunch                                               AS plan_lunch,
        dp.snack                                               AS plan_snack,
        dp.supper                                              AS plan_supper,
        dp.arrival_time,
        COALESCE(dp.breakfast_time, dp.arrival_time)           AS breakfast_time,
        COALESCE(dp.lunch_time,     dp.arrival_time)           AS lunch_time,
        COALESCE(dp.snack_time,     dp.arrival_time)           AS snack_time,
        COALESCE(dp.supper_time,    dp.arrival_time)           AS supper_time,
        dp.kitchen_id,
        s.name                                                 AS site_name,
        k.name                                                 AS kitchen_name
      FROM delivery_instances di
      JOIN delivery_plans  dp ON dp.id  = di.plan_id
      JOIN organizations   s  ON s.id   = dp.site_id
      LEFT JOIN organizations k ON k.id = dp.kitchen_id
      WHERE dp.sponsor_id = $1
        AND di.date = $2
        AND di.date >= dp.start_date
        AND (dp.end_date IS NULL OR di.date <= dp.end_date)
      ORDER BY dp.arrival_time ASC NULLS LAST, s.name ASC
    `, [sponsorId, date]);

    res.json({ date, deliveries: rows });
  } catch (err) {
    console.error('getTodayDeliveries error:', err);
    res.status(500).json({ error: 'Failed to fetch deliveries.' });
  }
};

// ─── Skip / update a single instance ─────────────────────────────────────────
// Supports: status, notes, breakfast_override, lunch_override, snack_override, supper_override
// Only updates fields that are explicitly present in the request body.
// Send null for an override to clear it (revert to plan value).
exports.updateInstance = async (req, res) => {
  try {
    const { status, notes, breakfast_override, lunch_override, snack_override, supper_override } = req.body;

    const setClauses = [];
    const values     = [];
    let   i          = 1;

    if (status             !== undefined) { setClauses.push(`status = $${i++}`);             values.push(status); }
    if (notes              !== undefined) { setClauses.push(`notes = $${i++}`);              values.push(notes); }
    if (breakfast_override !== undefined) { setClauses.push(`breakfast_override = $${i++}`); values.push(breakfast_override === null ? null : parseInt(breakfast_override)); }
    if (lunch_override     !== undefined) { setClauses.push(`lunch_override = $${i++}`);     values.push(lunch_override     === null ? null : parseInt(lunch_override)); }
    if (snack_override     !== undefined) { setClauses.push(`snack_override = $${i++}`);     values.push(snack_override     === null ? null : parseInt(snack_override)); }
    if (supper_override    !== undefined) { setClauses.push(`supper_override = $${i++}`);    values.push(supper_override    === null ? null : parseInt(supper_override)); }

    if (!setClauses.length) {
      const { rows } = await pool.query(`SELECT * FROM delivery_instances WHERE id = $1`, [req.params.instanceId]);
      return res.json({ instance: rows[0] ?? null });
    }

    values.push(req.params.instanceId);
    const { rows } = await pool.query(
      `UPDATE delivery_instances SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Instance not found.' });
    res.json({ instance: rows[0] });
  } catch (err) {
    console.error('updateInstance error:', err);
    res.status(500).json({ error: 'Failed to update instance.' });
  }
};

// ─── Notify kitchen for a date ────────────────────────────────────────────────
// Sponsor sends today's delivery list to a kitchen manually (not the auto cron).
exports.notifyKitchen = async (req, res) => {
  try {
    const { kitchen_id, date } = req.body;
    if (!kitchen_id || !date) return res.status(400).json({ error: 'kitchen_id and date are required.' });

    const { rows } = await pool.query(`
      SELECT
        s.name                                          AS site_name,
        dp.arrival_time,
        COALESCE(di.breakfast_override, dp.breakfast)  AS eff_breakfast,
        COALESCE(di.lunch_override,     dp.lunch)      AS eff_lunch,
        COALESCE(di.snack_override,     dp.snack)      AS eff_snack,
        COALESCE(di.supper_override,    dp.supper)     AS eff_supper
      FROM delivery_instances di
      JOIN delivery_plans dp ON dp.id = di.plan_id
      JOIN organizations  s  ON s.id  = dp.site_id
      WHERE dp.kitchen_id = $1
        AND di.date = $2
        AND di.status NOT IN ('skipped','cancelled')
      ORDER BY dp.arrival_time ASC NULLS LAST, s.name ASC
    `, [kitchen_id, date]);

    if (!rows.length) return res.json({ notified: false, message: 'No deliveries for this kitchen on that date.' });

    const lines = rows.map((r) => {
      const meals = [];
      if (r.eff_breakfast > 0) meals.push(`Breakfast ×${r.eff_breakfast}`);
      if (r.eff_lunch     > 0) meals.push(`Lunch ×${r.eff_lunch}`);
      if (r.eff_snack     > 0) meals.push(`Snack ×${r.eff_snack}`);
      if (r.eff_supper    > 0) meals.push(`Supper ×${r.eff_supper}`);
      const time = r.arrival_time ? ` at ${formatTime(r.arrival_time.slice(0, 5))}` : '';
      return `• ${r.site_name}: ${meals.join(', ')}${time}`;
    });

    const kitchenUsers = await pool.query(
      `SELECT id FROM users WHERE org_id = $1 AND is_active = TRUE`,
      [kitchen_id]
    );

    if (kitchenUsers.rows.length) {
      await createNotification(kitchenUsers.rows.map((u) => ({
        userId:    u.id,
        type:      'general',
        title:     `🚚 Today's delivery schedule`,
        body:      lines.join('\n'),
        actionUrl: '/dashboard/kitchen/deliveries',
      })));
    }

    res.json({ notified: true, kitchenUserCount: kitchenUsers.rows.length });
  } catch (err) {
    console.error('notifyKitchen error:', err);
    res.status(500).json({ error: 'Failed to notify kitchen.' });
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

// ─── Kitchen: get today's production list ─────────────────────────────────────
// Returns all delivery instances for today where this kitchen is assigned,
// grouped by site with per-meal totals. Gives kitchens their auto-generated
// production schedule — no guessing what to cook.
exports.getKitchenProduction = async (req, res) => {
  try {
    const kitchenId = req.user.organizationId;
    const date      = req.query.date ?? new Date().toISOString().split('T')[0];

    const { rows } = await pool.query(`
      SELECT
        di.id            AS instance_id,
        di.status,
        dp.arrival_time,
        dp.breakfast,
        dp.lunch,
        dp.snack,
        dp.supper,
        s.name           AS site_name,
        s.id             AS site_id,
        -- Did this site already submit meal counts for this date?
        CASE WHEN mc.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_submitted,
        mc.breakfast     AS submitted_breakfast,
        mc.lunch         AS submitted_lunch,
        mc.snack         AS submitted_snack,
        mc.supper        AS submitted_supper
      FROM delivery_instances di
      JOIN delivery_plans  dp ON dp.id  = di.plan_id
      JOIN organizations   s  ON s.id   = dp.site_id
      LEFT JOIN meal_counts mc ON mc.org_id = s.id AND mc.date = $2
      WHERE dp.kitchen_id = $1
        AND di.date       = $2
        AND di.status    != 'cancelled'
      ORDER BY dp.arrival_time ASC, s.name ASC
    `, [kitchenId, date]);

    // Compute totals across all sites
    const totals = { breakfast: 0, lunch: 0, snack: 0, supper: 0 };
    const nextDelivery = rows.length > 0 ? rows[0].arrival_time?.slice(0,5) : null;
    for (const r of rows) {
      totals.breakfast += r.breakfast ?? 0;
      totals.lunch     += r.lunch     ?? 0;
      totals.snack     += r.snack     ?? 0;
      totals.supper    += r.supper    ?? 0;
    }

    const submittedCount = rows.filter((r) => r.has_submitted).length;
    const pendingCount   = rows.length - submittedCount;

    res.json({ date, sites: rows, totals, nextDelivery, submittedCount, pendingCount });
  } catch (err) {
    console.error('getKitchenProduction error:', err);
    res.status(500).json({ error: 'Failed to fetch production schedule.' });
  }
};

// ─── Bulk create plans (sponsor) ──────────────────────────────────────────────
// Creates one plan per site_id in the array — same kitchen/days/meals for all.
// Lets sponsors onboard dozens of sites in minutes.
exports.bulkCreatePlans = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    const {
      site_ids,
      kitchen_id,
      days_of_week,
      breakfast = 0, lunch = 0, snack = 0, supper = 0,
      breakfast_time, lunch_time, snack_time, supper_time,
      start_date,
      end_date,
      auto_notify = true,
      name_prefix,
    } = req.body;

    if (!site_ids?.length)     return res.status(400).json({ error: 'site_ids is required.' });
    if (!days_of_week?.length) return res.status(400).json({ error: 'days_of_week is required.' });
    if (!start_date)           return res.status(400).json({ error: 'start_date is required.' });

    const effectiveArrivalTime = [breakfast_time, lunch_time, snack_time, supper_time].filter(Boolean).sort()[0] || '09:00';

    const created = [];

    for (const siteId of site_ids) {
      // Get site name for optional plan name
      const siteRes = await pool.query(`SELECT name FROM organizations WHERE id = $1`, [siteId]);
      const siteName = siteRes.rows[0]?.name ?? '';
      const planName = name_prefix ? `${name_prefix} — ${siteName}` : null;

      const { rows } = await pool.query(`
        INSERT INTO delivery_plans
          (sponsor_id, site_id, kitchen_id, name, days_of_week, arrival_time,
           breakfast, lunch, snack, supper,
           breakfast_time, lunch_time, snack_time, supper_time,
           start_date, end_date, auto_notify)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        RETURNING *
      `, [sponsorId, siteId, kitchen_id || null, planName,
          days_of_week, effectiveArrivalTime,
          breakfast, lunch, snack, supper,
          breakfast_time || null, lunch_time || null, snack_time || null, supper_time || null,
          start_date, end_date || null, auto_notify]);

      if (rows[0]) {
        await generateInstancesForPlan(rows[0]);
        created.push(rows[0]);
      }
    }

    res.status(201).json({ created: created.length, plans: created });
  } catch (err) {
    console.error('bulkCreatePlans error:', err);
    res.status(500).json({ error: 'Failed to bulk create plans.' });
  }
};

// Helper: "14:30" → "2:30 PM"
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

module.exports = { ...exports, generateInstancesForPlan };
