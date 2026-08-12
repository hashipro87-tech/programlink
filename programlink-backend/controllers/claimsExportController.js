/**
 * Claims Export Controller
 * GET /claims/export?month=YYYY-MM&format=pdf|excel|csv
 *
 * Always runs a fresh claim calculation (same logic as the Claims page)
 * so exported status, readiness, and reimbursement are never stale.
 */
'use strict';

const pool              = require('../config/database');
const { _loadClaimData } = require('./claimsController');
const exportEngine      = require('../services/exportEngine');

exports.exportClaim = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    const month     = req.query.month || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    const format = req.query.format || 'pdf';

    // Sponsor org name (for the export header)
    const orgRes = await pool.query(
      `SELECT name FROM organizations WHERE id = $1`,
      [sponsorId]
    );
    const orgName = orgRes.rows[0]?.name || 'Unknown Organization';

    // Run the exact same fresh claim calculation the Claims page uses
    const result = await _loadClaimData(sponsorId, month);
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const { claim, stateConfig } = result;

    // Build mealsBySite lookup for the export adapters that need per-site meal counts
    const [y, mo] = month.split('-').map(Number);
    const monthStart = new Date(y, mo - 1, 1);
    const monthEnd   = new Date(y, mo, 0);

    const siteIds = claim.items.map(i => i.siteId);
    let mealsBySite = {};
    if (siteIds.length > 0) {
      const mealsRes = await pool.query(
        `SELECT site_id,
                COALESCE(SUM(breakfast), 0)::int AS total_breakfast,
                COALESCE(SUM(lunch),     0)::int AS total_lunch,
                COALESCE(SUM(snack),     0)::int AS total_snack,
                COALESCE(SUM(supper),    0)::int AS total_supper,
                COALESCE(SUM(count_submitted), 0)::int AS submitted
         FROM meal_counts
         WHERE site_id = ANY($1) AND date >= $2 AND date <= $3
         GROUP BY site_id`,
        [siteIds, monthStart, monthEnd]
      );
      mealsBySite = Object.fromEntries(mealsRes.rows.map(r => [r.site_id, r]));
    }

    // Delegate to format adapter (pdf / excel / csv)
    const claimData = { claim, stateConfig, orgName, month, mealsBySite };
    await exportEngine.run(format, claimData, res);

  } catch (err) {
    console.error('exportClaim error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate export.' });
    }
  }
};
