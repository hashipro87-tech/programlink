const pool = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const sponsorId = req.user.sponsorId || req.user.organizationId;

    const [sites, kitchens, pending, alerts] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM organizations WHERE type='site' AND (sponsor_id=$1 OR id=$1)`, [sponsorId]),
      pool.query(`SELECT COUNT(*) FROM organizations WHERE type='kitchen' AND (sponsor_id=$1 OR id=$1)`, [sponsorId]),
      pool.query(`SELECT COUNT(*) FROM applications WHERE sponsor_id=$1 AND status IN ('submitted','under_review')`, [sponsorId]),
      pool.query(
        `SELECT COUNT(*) FROM documents d
         JOIN organizations o ON o.id = d.org_id
         WHERE (o.sponsor_id=$1 OR o.id=$1)
           AND d.expires_at IS NOT NULL
           AND d.expires_at <= NOW() + INTERVAL '30 days'
           AND d.status != 'expired'`,
        [sponsorId]
      ),
    ]);

    res.json({
      total_sites:       parseInt(sites.rows[0].count),
      active_kitchens:   parseInt(kitchens.rows[0].count),
      total_kitchens:    parseInt(kitchens.rows[0].count),
      pending_approvals: parseInt(pending.rows[0].count),
      compliance_alerts: parseInt(alerts.rows[0].count),
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};
