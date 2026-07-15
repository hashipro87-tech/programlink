/**
 * Audit Controller
 *
 * POST /claims/audit-token   — sponsor creates a 30-day read-only audit link
 * GET  /audit/:token         — public (no auth), returns claim snapshot
 */

const pool   = require('../config/database');
const engine = require('../services/claimsEngine');

// ─── POST /claims/audit-token ─────────────────────────────────────────────────
// Creates an audit token with a snapshot of the current claim.
// Returns: { token, url, org_name, claim_month, expires_at }

exports.createAuditToken = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    const month     = req.body.month || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    const claimDate = `${month}-01`;

    // 1. Sponsor org name + state
    const orgRes = await pool.query(
      `SELECT name, region FROM organizations WHERE id = $1`,
      [sponsorId]
    );
    const org       = orgRes.rows[0] || {};
    const stateCode = (org.region || '').toUpperCase();
    const orgName   = org.name || 'Organization';

    if (!stateCode) {
      return res.status(400).json({ error: 'No state configured. Set your state in Settings first.' });
    }

    let stateConfig;
    try { stateConfig = engine.loadStateConfig(stateCode); }
    catch { return res.status(400).json({ error: `State "${stateCode}" is not yet supported.` }); }

    // 2. Sites
    const sitesRes = await pool.query(
      `SELECT id, name FROM organizations WHERE sponsor_id = $1 AND type = 'site' AND status = 'active'`,
      [sponsorId]
    );
    const sites   = sitesRes.rows;
    const siteIds = sites.map(s => s.id);

    // 3. Meal counts
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

    // 4. Docs
    const docsRes = await pool.query(
      `SELECT org_id,
              array_agg(doc_type) FILTER (WHERE status IN ('valid','pending_review')) AS valid_docs,
              array_agg(json_build_object('type', doc_type, 'label', label, 'status', status, 'expires_at', expires_at))
                FILTER (WHERE doc_type IS NOT NULL) AS doc_list
       FROM documents WHERE org_id = ANY($1) GROUP BY org_id`,
      [siteIds]
    );
    const docsBySite = Object.fromEntries(docsRes.rows.map(r => [r.org_id, r]));

    // 5. Build site data + run engine
    const siteDataArray = sites.map(site => {
      const meals     = mealsBySite[site.id] || {};
      const docs      = docsBySite[site.id]  || {};
      const validDocs  = docs.valid_docs || [];
      const missingDocs = stateConfig.requiredDocuments.filter(d => !validDocs.includes(d));
      const total      = parseInt(meals.submitted || 0);
      const hasPerType = (meals.total_breakfast||0)+(meals.total_lunch||0)+(meals.total_snack||0)+(meals.total_supper||0) > 0;
      const mealTotals = {};
      for (const mt of stateConfig.allowedMealTypes) {
        const raw = hasPerType ? (parseInt(meals[`total_${mt}`] || 0)) : Math.floor(total / stateConfig.allowedMealTypes.length);
        mealTotals[mt] = { tier1: Math.round(raw * 0.7), tier2: raw - Math.round(raw * 0.7) };
      }
      return {
        id: site.id, name: site.name,
        hasMealCounts: total > 0, hasAttendance: total > 0,
        hasEnrollment: false, hasIncomeEligibility: false,
        hasDocuments: missingDocs.length === 0, hasMenus: false,
        missingDocs, enrollment: 0, attendance: total, mealTotals,
        docs: docs.doc_list || []
      };
    });

    const claim = engine.calculateClaim(siteDataArray, stateConfig, month);

    // Enrich snapshot with doc lists per site
    const snapshot = {
      ...claim,
      orgName,
      generatedAt: new Date().toISOString(),
      items: claim.items.map((item, i) => ({
        ...item,
        docs: siteDataArray[i]?.docs || []
      }))
    };

    // 6. Upsert audit token (one per sponsor+month — refreshes snapshot on re-generate)
    const { rows } = await pool.query(
      `INSERT INTO audit_tokens (sponsor_id, claim_month, org_name, state_code, snapshot, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
       ON CONFLICT DO NOTHING
       RETURNING token, expires_at`,
      [sponsorId, claimDate, orgName, stateCode, JSON.stringify(snapshot)]
    );

    // If token already exists, just fetch it
    let tokenRow = rows[0];
    if (!tokenRow) {
      // Token exists — refresh snapshot + expiry
      const upd = await pool.query(
        `UPDATE audit_tokens
         SET snapshot = $3, expires_at = NOW() + INTERVAL '30 days', view_count = 0
         WHERE sponsor_id = $1 AND claim_month = $2
         RETURNING token, expires_at`,
        [sponsorId, claimDate, JSON.stringify(snapshot)]
      );
      tokenRow = upd.rows[0];
    }

    if (!tokenRow) {
      return res.status(500).json({ error: 'Failed to create audit token.' });
    }

    res.json({
      token:       tokenRow.token,
      url:         `${req.headers.origin || 'https://cacfplink.com'}/audit/${tokenRow.token}`,
      org_name:    orgName,
      claim_month: month,
      expires_at:  tokenRow.expires_at,
    });

  } catch (err) {
    console.error('createAuditToken error:', err);
    res.status(500).json({ error: 'Failed to create audit link.' });
  }
};

// ─── GET /audit/:token ────────────────────────────────────────────────────────
// Public — no auth. Returns claim snapshot or 404/410.

exports.getAuditData = async (req, res) => {
  try {
    const { token } = req.params;

    const { rows } = await pool.query(
      `UPDATE audit_tokens
       SET view_count = view_count + 1
       WHERE token = $1
       RETURNING snapshot, org_name, state_code, claim_month, expires_at, view_count`,
      [token]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Audit link not found.' });
    }

    const row = rows[0];
    if (new Date(row.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This audit link has expired.' });
    }

    res.json({
      ...row.snapshot,
      org_name:    row.org_name,
      state_code:  row.state_code,
      claim_month: row.claim_month?.slice(0, 7),
      expires_at:  row.expires_at,
      view_count:  row.view_count,
    });

  } catch (err) {
    console.error('getAuditData error:', err);
    res.status(500).json({ error: 'Failed to load audit data.' });
  }
};
