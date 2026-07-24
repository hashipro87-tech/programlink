/**
 * Claims Export Controller
 * GET /claims/export?month=YYYY-MM&format=pdf|excel|csv
 *
 * Data fetching lives here. Format rendering is delegated to exportEngine.
 * To add a new export format: add an adapter file, register it in exportEngine.js.
 */
'use strict';

const pool         = require('../config/database');
const engine       = require('../services/claimsEngine');
const exportEngine = require('../services/exportEngine');

exports.exportClaim = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    const month     = req.query.month || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    const format = req.query.format || 'pdf';

    // 1. Fetch sponsor org name + state
    const orgRes = await pool.query(
      `SELECT name, region FROM organizations WHERE id = $1`,
      [sponsorId]
    );
    const org       = orgRes.rows[0] || {};
    const stateCode = (org.region || '').toUpperCase();
    const orgName   = org.name || 'Unknown Organization';

    if (!stateCode) {
      return res.status(400).json({ error: 'No state configured. Set your state in Settings.' });
    }

    let stateConfig;
    try {
      stateConfig = engine.loadStateConfig(stateCode);
    } catch {
      return res.status(400).json({ error: `State "${stateCode}" is not yet supported.` });
    }

    // 2. Sites
    const sitesRes = await pool.query(
      `SELECT id, name FROM organizations WHERE sponsor_id = $1 AND type = 'site' AND status = 'active'`,
      [sponsorId]
    );
    const sites   = sitesRes.rows;
    const siteIds = sites.map(s => s.id);

    // 3. Meal counts (per-type)
    const [y, mo] = month.split('-').map(Number);
    const monthStart = new Date(y, mo - 1, 1);
    const monthEnd   = new Date(y, mo, 0);

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
    const mealsBySite = Object.fromEntries(mealsRes.rows.map(r => [r.site_id, r]));

    // 4. Documents
    const docsRes = await pool.query(
      `SELECT org_id, array_agg(doc_type) FILTER (WHERE status IN ('valid','pending_review')) AS valid_docs
       FROM documents WHERE org_id = ANY($1) GROUP BY org_id`,
      [siteIds]
    );
    const docsBySite = Object.fromEntries(docsRes.rows.map(r => [r.org_id, r]));

    // 5. Build site data → run engine
    const siteDataArray = sites.map(site => {
      const meals    = mealsBySite[site.id] || {};
      const docs     = docsBySite[site.id]  || {};
      const validDocs   = docs.valid_docs   || [];
      const missingDocs = stateConfig.requiredDocuments.filter(d => !validDocs.includes(d));
      const totalCount  = parseInt(meals.submitted || 0);
      const hasPerType  = (meals.total_breakfast || 0) + (meals.total_lunch || 0) +
                          (meals.total_snack || 0) + (meals.total_supper || 0) > 0;
      const perType = {
        breakfast: parseInt(meals.total_breakfast || 0),
        lunch:     parseInt(meals.total_lunch     || 0),
        snack:     parseInt(meals.total_snack     || 0),
        supper:    parseInt(meals.total_supper    || 0),
      };
      const mealTotals = {};
      for (const mt of stateConfig.allowedMealTypes) {
        const raw = hasPerType ? (perType[mt] || 0) : Math.floor(totalCount / stateConfig.allowedMealTypes.length);
        mealTotals[mt] = { tier1: Math.round(raw * 0.7), tier2: raw - Math.round(raw * 0.7) };
      }
      return {
        id: site.id, name: site.name,
        hasMealCounts: totalCount > 0, hasAttendance: totalCount > 0,
        hasEnrollment: false, hasIncomeEligibility: false,
        hasDocuments: missingDocs.length === 0, hasMenus: false,
        missingDocs, enrollment: 0, attendance: totalCount, mealTotals,
      };
    });

    const claim = engine.calculateClaim(siteDataArray, stateConfig, month);

    // 6. Delegate to format adapter
    const claimData = { claim, stateConfig, orgName, month, mealsBySite };
    await exportEngine.run(format, claimData, res);

  } catch (err) {
    console.error('exportClaim error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate export.' });
    }
  }
};
