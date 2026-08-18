const pool = require('../config/database');
const { logActivity, TYPES } = require('../services/activityService');

exports.listMealCounts = async (req, res) => {
  try {
    const { site_id, kitchen_id, start_date, end_date } = req.query;
    let query = `SELECT mc.*, o.name AS site_name
                 FROM meal_counts mc
                 LEFT JOIN organizations o ON o.id = mc.site_id
                 WHERE 1=1`;
    const params = [];
    if (site_id)    { params.push(site_id);    query += ` AND mc.site_id = $${params.length}`; }
    if (kitchen_id) { params.push(kitchen_id); query += ` AND mc.kitchen_id = $${params.length}`; }
    if (start_date) { params.push(start_date); query += ` AND mc.date >= $${params.length}`; }
    if (end_date)   { params.push(end_date);   query += ` AND mc.date <= $${params.length}`; }
    if (req.user.role === 'site' || req.user.role === 'kitchen') {
      params.push(req.user.organizationId);
      query += ` AND (mc.site_id = $${params.length} OR mc.kitchen_id = $${params.length})`;
    } else if (req.user.role === 'sponsor' || req.user.role === 'admin') {
      // Scope to sites/kitchens owned by this sponsor
      params.push(req.user.organizationId);
      query += ` AND o.sponsor_id = $${params.length}`;
    } else if (req.user.role === 'coordinator') {
      // Scope to sites/kitchens under the coordinator's sponsor
      params.push(req.user.sponsorId ?? req.user.organizationId);
      query += ` AND o.sponsor_id = $${params.length}`;
    }
    query += ' ORDER BY mc.date DESC';
    const { rows } = await pool.query(query, params);
    res.json({ meal_counts: rows });
  } catch (err) {
    console.error('listMealCounts error:', err);
    res.status(500).json({ error: 'Failed to fetch meal counts.' });
  }
};

exports.submitMealCount = async (req, res) => {
  try {
    const {
      site_id, kitchen_id, date, notes,
      // Accept both naming conventions: breakfast_count (UI) and breakfast (API/seed)
      breakfast_count, lunch_count, snack_count, supper_count,
      count_submitted
    } = req.body;

    const breakfast = parseInt(breakfast_count ?? req.body.breakfast) || 0;
    const lunch     = parseInt(lunch_count     ?? req.body.lunch)     || 0;
    const snack     = parseInt(snack_count     ?? req.body.snack)     || 0;
    const supper    = parseInt(supper_count    ?? req.body.supper)    || 0;
    const total = parseInt(count_submitted) || (breakfast + lunch + snack + supper);

    // Sponsor/admin entering counts themselves — auto-verify immediately
    const role = req.user.role;
    const autoVerify = role === 'sponsor' || role === 'admin';

    const { rows } = await pool.query(
      `INSERT INTO meal_counts
         (site_id, kitchen_id, date, breakfast, lunch, snack, supper,
          count_submitted, count_verified, submitted_by, verified_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (site_id, date) DO UPDATE
         SET breakfast       = $4,
             lunch           = $5,
             snack           = $6,
             supper          = $7,
             count_submitted = $8,
             count_verified  = $9,
             submitted_by    = $10,
             verified_by     = $11,
             notes           = $12
       RETURNING *`,
      [
        site_id || req.user.organizationId,
        kitchen_id || null,
        date,
        breakfast, lunch, snack, supper,
        total,
        autoVerify ? total : null,   // count_verified
        req.user.id,
        autoVerify ? req.user.id : null,  // verified_by
        notes || null
      ]
    );
    await logActivity({
      org_id: site_id || req.user.organizationId,
      actor_id: req.user.id,
      type: TYPES.MEAL_COUNTS_SUBMITTED,
      title: `Meal counts submitted for ${date}`,
      description: `${total} total meals (B:${breakfast} L:${lunch} S:${snack} Su:${supper})`,
      link: '/dashboard/site/meals',
    });

    res.status(201).json({ meal_count: rows[0] });
  } catch (err) {
    console.error('submitMealCount error:', err);
    res.status(500).json({ error: 'Failed to submit meal count.' });
  }
};

exports.updateMealCount = async (req, res) => {
  try {
    const breakfast = parseInt(req.body.breakfast_count ?? req.body.breakfast) || 0;
    const lunch     = parseInt(req.body.lunch_count     ?? req.body.lunch)     || 0;
    const snack     = parseInt(req.body.snack_count     ?? req.body.snack)     || 0;
    const supper    = parseInt(req.body.supper_count    ?? req.body.supper)    || 0;
    const total     = breakfast + lunch + snack + supper;
    const { rows } = await pool.query(
      `UPDATE meal_counts
          SET breakfast = $1, lunch = $2, snack = $3, supper = $4,
              count_submitted = $5, count_verified = $5, verified_by = $6,
              notes = $7
        WHERE id = $8 RETURNING *`,
      [breakfast, lunch, snack, supper, total, req.user.id, req.body.notes || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json({ meal_count: rows[0] });
  } catch (err) {
    console.error('updateMealCount error:', err);
    res.status(500).json({ error: 'Failed to update meal count.' });
  }
};

exports.deleteMealCount = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM meal_counts WHERE id = $1 RETURNING id`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('deleteMealCount error:', err);
    res.status(500).json({ error: 'Failed to delete meal count.' });
  }
};

exports.verifyMealCount = async (req, res) => {
  try {
    const { count_verified } = req.body;
    // If no count_verified provided (e.g. coordinator just clicks Verify), default to count_submitted
    const { rows } = await pool.query(
      `UPDATE meal_counts
       SET count_verified = COALESCE($1::int, count_submitted),
           verified_by    = $2
       WHERE id = $3
       RETURNING *`,
      [count_verified ?? null, req.user.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Meal count not found.' });
    res.json({ meal_count: rows[0] });
  } catch (err) {
    console.error('verifyMealCount error:', err);
    res.status(500).json({ error: 'Failed to verify meal count.' });
  }
};

// GET /meal-counts/trend — last 6 months of program-wide totals for the trend chart
exports.getTrend = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId ?? req.user.sponsorId;

    // Pull monthly totals for the last 6 months (including current month)
    const { rows } = await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', mc.date), 'YYYY-MM')  AS month,
         TO_CHAR(DATE_TRUNC('month', mc.date), 'Mon YYYY') AS label,
         COALESCE(SUM(mc.count_submitted), 0)::int          AS total_submitted,
         COALESCE(SUM(mc.count_verified),  0)::int          AS total_verified,
         COUNT(DISTINCT mc.date)::int                       AS days_with_counts
       FROM meal_counts mc
       JOIN organizations o ON o.id = mc.site_id
       WHERE o.sponsor_id = $1
         AND mc.date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
       GROUP BY DATE_TRUNC('month', mc.date)
       ORDER BY DATE_TRUNC('month', mc.date)`,
      [sponsorId]
    );

    // Fill in any months that had zero counts so the chart always shows 6 bars
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const found = rows.find((r) => r.month === key);
      months.push(found ?? { month: key, label, total_submitted: 0, total_verified: 0, days_with_counts: 0 });
    }

    res.json({ trend: months });
  } catch (err) {
    console.error('getTrend error:', err);
    res.status(500).json({ error: 'Failed to fetch trend data.' });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    // Accept month as 'YYYY-MM' (sent by frontend) or separate month/year params
    let y, m;
    if (req.query.month && req.query.month.includes('-')) {
      [y, m] = req.query.month.split('-').map(Number);
    } else {
      m = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
      y = parseInt(req.query.year,  10) || new Date().getFullYear();
    }

    const sponsorId = req.user.organizationId ?? req.user.sponsorId;

    const { rows } = await pool.query(
      `SELECT
         mc.site_id,
         o.name                                                          AS site_name,
         COUNT(mc.id)::int                                               AS days_reported,
         COUNT(mc.id) FILTER (WHERE mc.count_verified IS NULL)::int      AS days_unverified,
         COALESCE(SUM(mc.count_submitted), 0)::int                       AS total_submitted,
         COALESCE(SUM(mc.count_verified),  0)::int                       AS total_verified
       FROM meal_counts mc
       JOIN organizations o ON o.id = mc.site_id
       WHERE EXTRACT(MONTH FROM mc.date) = $1
         AND EXTRACT(YEAR  FROM mc.date) = $2
         AND o.sponsor_id = $3
       GROUP BY mc.site_id, o.name
       ORDER BY o.name`,
      [m, y, sponsorId]
    );
    res.json({ sites: rows });
  } catch (err) {
    console.error('getMonthlySummary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary.' });
  }
};
