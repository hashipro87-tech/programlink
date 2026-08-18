const pool = require('../config/database');

// GET /warnings
// Returns an array of proactive warnings for the sponsor's program.
// Each warning has: { type, severity, title, detail, org_id?, org_name?, link }
exports.getWarnings = async (req, res) => {
  try {
    const orgId = (req.user.role === 'coordinator') ? (req.user.sponsorId ?? req.user.organizationId) : req.user.organizationId;
    const warnings = [];

    const today      = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7) + '-01';
    const day3ago    = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    const day7ahead  = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    // ── 1. Sites missing meal counts for 3+ days ─────────────────────────────
    const { rows: staleSites } = await pool.query(`
      SELECT o.id, o.name,
             MAX(mc.date)::text AS last_count_date
      FROM organizations o
      LEFT JOIN meal_counts mc ON mc.site_id = o.id
      WHERE o.sponsor_id = $1
        AND o.type = 'site'
        AND o.status = 'active'
      GROUP BY o.id, o.name
      HAVING MAX(mc.date) < $2 OR MAX(mc.date) IS NULL
      ORDER BY MAX(mc.date) ASC NULLS FIRST
      LIMIT 10
    `, [orgId, day3ago]);

    for (const s of staleSites) {
      const daysSince = s.last_count_date
        ? Math.floor((Date.now() - new Date(s.last_count_date)) / 86400000)
        : null;
      warnings.push({
        type:     'missing_counts',
        severity: daysSince === null || daysSince >= 7 ? 'high' : 'medium',
        title:    `${s.name} hasn't submitted meal counts`,
        detail:   daysSince === null
          ? 'No meal counts ever submitted.'
          : `Last submission was ${daysSince} day${daysSince !== 1 ? 's' : ''} ago.`,
        org_id:   s.id,
        org_name: s.name,
        link:     '/dashboard/sponsor/meal-counts',
      });
    }

    // ── 2. Documents expiring within 7 days ──────────────────────────────────
    const { rows: expiringDocs } = await pool.query(`
      SELECT d.id, d.label, d.expires_at::date::text AS expires_at,
             o.id AS org_id, o.name AS org_name
      FROM documents d
      JOIN organizations o ON o.id = d.org_id
      WHERE (o.sponsor_id = $1 OR o.id = $1)
        AND d.expires_at IS NOT NULL
        AND d.expires_at BETWEEN NOW() AND $2::date + INTERVAL '1 day'
        AND d.status IN ('valid', 'expiring_soon')
      ORDER BY d.expires_at ASC
      LIMIT 10
    `, [orgId, day7ahead]);

    for (const d of expiringDocs) {
      const daysLeft = Math.ceil((new Date(d.expires_at) - new Date()) / 86400000);
      warnings.push({
        type:     'document_expiring',
        severity: daysLeft <= 3 ? 'high' : 'medium',
        title:    `"${d.label}" expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
        detail:   `${d.org_name} — expires ${d.expires_at}`,
        org_id:   d.org_id,
        org_name: d.org_name,
        link:     '/dashboard/sponsor/documents',
      });
    }

    // ── 3. Sites with zero meal counts this month ─────────────────────────────
    // Only flag if we're past the 5th of the month (enough time to have submitted)
    const dayOfMonth = new Date().getDate();
    if (dayOfMonth > 5) {
      const { rows: zeroSites } = await pool.query(`
        SELECT o.id, o.name
        FROM organizations o
        WHERE o.sponsor_id = $1
          AND o.type = 'site'
          AND o.status = 'active'
          AND o.id NOT IN (
            SELECT DISTINCT site_id FROM meal_counts
            WHERE date >= $2 AND site_id IS NOT NULL
          )
        ORDER BY o.name
        LIMIT 10
      `, [orgId, monthStart]);

      for (const s of zeroSites) {
        warnings.push({
          type:     'no_counts_this_month',
          severity: 'high',
          title:    `${s.name} has no meal counts this month`,
          detail:   'This site has not submitted any counts since the start of the month.',
          org_id:   s.id,
          org_name: s.name,
          link:     '/dashboard/sponsor/meal-counts',
        });
      }
    }

    // ── 4. Meal count anomaly — today's count is >2x the 30-day average ──────
    const { rows: anomalies } = await pool.query(`
      WITH today_counts AS (
        SELECT site_id, COALESCE(count_submitted, 0) AS total
        FROM meal_counts
        WHERE date = $2
      ),
      avg_counts AS (
        SELECT site_id,
               AVG(COALESCE(count_submitted, 0)) AS avg_total
        FROM meal_counts
        WHERE date >= NOW() - INTERVAL '30 days'
          AND date < $2
        GROUP BY site_id
        HAVING COUNT(*) >= 5
      )
      SELECT o.id, o.name,
             tc.total AS today_total,
             ROUND(ac.avg_total) AS avg_total
      FROM today_counts tc
      JOIN avg_counts ac ON ac.site_id = tc.site_id
      JOIN organizations o ON o.id = tc.site_id
      WHERE o.sponsor_id = $1
        AND tc.total > ac.avg_total * 2
        AND tc.total > 10
      ORDER BY (tc.total::float / NULLIF(ac.avg_total, 0)) DESC
      LIMIT 5
    `, [orgId, today]);

    for (const a of anomalies) {
      warnings.push({
        type:     'count_anomaly',
        severity: 'medium',
        title:    `Unusual meal count at ${a.name}`,
        detail:   `Today: ${a.today_total} meals — average is ${a.avg_total}. Please verify before submitting.`,
        org_id:   a.id,
        org_name: a.name,
        link:     '/dashboard/sponsor/meal-counts',
      });
    }

    // Sort: high severity first
    warnings.sort((a, b) => (a.severity === 'high' ? -1 : 1) - (b.severity === 'high' ? -1 : 1));

    res.json({ warnings });
  } catch (err) {
    console.error('getWarnings error:', err);
    res.status(500).json({ error: 'Failed to fetch warnings.' });
  }
};
