// routes/compliance.js — Sponsor-only compliance overview
// GET /compliance — returns per-org compliance status across documents + applications

const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const pool = require('../config/database');

router.get('/', authenticate, authorizeRoles('sponsor', 'admin'), async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;

    // Pull all orgs under this sponsor with their doc + application stats
    const { rows: orgs } = await pool.query(
      `SELECT
         o.id,
         o.name,
         o.type,
         o.status AS org_status,

         -- Application compliance
         (SELECT status FROM applications WHERE org_id = o.id ORDER BY created_at DESC LIMIT 1) AS app_status,

         -- Document counts
         COUNT(d.id) FILTER (WHERE d.status = 'valid')          AS docs_valid,
         COUNT(d.id) FILTER (WHERE d.status = 'expired')        AS docs_expired,
         COUNT(d.id) FILTER (WHERE d.status = 'expiring_soon'
           OR (d.expires_at IS NOT NULL
               AND d.expires_at > NOW()
               AND d.expires_at <= NOW() + INTERVAL '30 days'
               AND d.status = 'valid'))                          AS docs_expiring,
         COUNT(d.id) FILTER (WHERE d.status = 'rejected')       AS docs_rejected,
         COUNT(d.id) FILTER (WHERE d.status = 'pending_review') AS docs_pending,

         -- Soonest expiry date
         MIN(d.expires_at) FILTER (
           WHERE d.expires_at IS NOT NULL AND d.expires_at > NOW()
         ) AS next_expiry

       FROM organizations o
       LEFT JOIN documents d ON d.org_id = o.id
       WHERE o.sponsor_id = $1 AND o.type IN ('site', 'kitchen')
       GROUP BY o.id
       ORDER BY o.name`,
      [sponsorId]
    );

    // Compute a simple compliance score per org (0–100)
    const withScores = orgs.map((org) => {
      let score = 100;
      if (org.app_status !== 'approved')  score -= 30;
      if (org.docs_expired   > 0)         score -= (org.docs_expired   * 20);
      if (org.docs_rejected  > 0)         score -= (org.docs_rejected  * 10);
      if (org.docs_expiring  > 0)         score -= (org.docs_expiring  *  5);
      score = Math.max(0, score);

      let tier = 'compliant';
      if (score < 50)  tier = 'critical';
      else if (score < 80) tier = 'at_risk';

      return { ...org, score, tier };
    });

    // Summary counts
    const summary = {
      total:      withScores.length,
      compliant:  withScores.filter((o) => o.tier === 'compliant').length,
      at_risk:    withScores.filter((o) => o.tier === 'at_risk').length,
      critical:   withScores.filter((o) => o.tier === 'critical').length,
      docs_expiring_soon: withScores.reduce((s, o) => s + Number(o.docs_expiring  ?? 0), 0),
      docs_expired:       withScores.reduce((s, o) => s + Number(o.docs_expired   ?? 0), 0),
    };

    res.json({ summary, organizations: withScores });
  } catch (err) {
    console.error('compliance error:', err);
    res.status(500).json({ error: 'Failed to fetch compliance data.' });
  }
});

module.exports = router;
