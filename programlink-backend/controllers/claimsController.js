/**
 * Claims Controller
 * Builds site data from DB, runs the Universal Claims Engine, persists results.
 */

const pool         = require('../config/database');
const engine       = require('../services/claimsEngine');

// ─── GET /claims?month=2026-07 ────────────────────────────────────────────────
// Returns the full claim for the sponsor's current month, computed live.

async function getClaim(req, res) {
  try {
    const sponsorId = req.user.organizationId;
    const month     = req.query.month || formatMonth(new Date());  // 'YYYY-MM'
    const claimDate = `${month}-01`;

    // 1. Get sponsor's state code
    const stateRes = await pool.query(
      `SELECT region FROM organizations WHERE id = $1`,
      [sponsorId]
    );
    const stateCode = stateRes.rows[0]?.region?.toUpperCase() || null;
    if (!stateCode) {
      return res.status(400).json({ error: 'Sponsor has no state configured. Please update your profile.' });
    }

    let stateConfig;
    try {
      stateConfig = engine.loadStateConfig(stateCode);
    } catch {
      return res.status(400).json({ error: `State "${stateCode}" is not yet supported.` });
    }

    // 2. Get all active sites for this sponsor
    const sitesRes = await pool.query(
      `SELECT id, name FROM organizations
       WHERE sponsor_id = $1 AND type = 'site' AND status = 'active'`,
      [sponsorId]
    );
    const sites = sitesRes.rows;

    if (sites.length === 0) {
      return res.json({ message: 'No active sites found.', items: [], estimatedReimbursement: 0 });
    }

    const siteIds   = sites.map(s => s.id);
    const [year, mo] = month.split('-').map(Number);
    const monthStart = new Date(year, mo - 1, 1);
    const monthEnd   = new Date(year, mo, 0);   // last day of month

    // 3. Meal counts for the month (all sites) — with per-type totals
    const mealsRes = await pool.query(
      `SELECT site_id,
              COALESCE(SUM(breakfast), 0)::int      AS total_breakfast,
              COALESCE(SUM(lunch),     0)::int      AS total_lunch,
              COALESCE(SUM(snack),     0)::int      AS total_snack,
              COALESCE(SUM(supper),    0)::int      AS total_supper,
              COALESCE(SUM(count_submitted), 0)::int AS submitted,
              SUM(count_verified) FILTER (WHERE count_verified IS NOT NULL)::int AS verified,
              COUNT(*)::int AS days_with_entries
       FROM meal_counts
       WHERE site_id = ANY($1)
         AND date >= $2 AND date <= $3
       GROUP BY site_id`,
      [siteIds, monthStart, monthEnd]
    );
    const mealsBysite = Object.fromEntries(mealsRes.rows.map(r => [r.site_id, r]));

    // 4. Documents — which required docs are present and valid?
    const docsRes = await pool.query(
      `SELECT org_id, array_agg(doc_type) FILTER (WHERE status IN ('valid','pending_review')) AS valid_docs,
              array_agg(doc_type) AS all_docs
       FROM documents
       WHERE org_id = ANY($1)
       GROUP BY org_id`,
      [siteIds]
    );
    const docsBySite = Object.fromEntries(docsRes.rows.map(r => [r.org_id, r]));

    // 5. Build site data objects for the engine
    const siteDataArray = sites.map(site => {
      const meals    = mealsBysite[site.id] || {};
      const docs     = docsBySite[site.id]  || {};
      const validDocs = docs.valid_docs || [];
      const missingDocs = stateConfig.requiredDocuments.filter(d => !validDocs.includes(d));

      // Use real per-meal-type counts from DB.
      // Tier split is still approximated 70/30 until income eligibility data exists.
      const totalCount = parseInt(meals.submitted || 0);

      const perTypeRaw = {
        breakfast: parseInt(meals.total_breakfast || 0),
        lunch:     parseInt(meals.total_lunch     || 0),
        snack:     parseInt(meals.total_snack     || 0),
        supper:    parseInt(meals.total_supper    || 0),
      };

      // If per-type data is missing (legacy rows) fall back to even distribution
      const hasPerType = perTypeRaw.breakfast + perTypeRaw.lunch + perTypeRaw.snack + perTypeRaw.supper > 0;

      const mealTotals = {};
      for (const mealType of stateConfig.allowedMealTypes) {
        const raw = hasPerType
          ? (perTypeRaw[mealType] || 0)
          : Math.floor(totalCount / stateConfig.allowedMealTypes.length);
        mealTotals[mealType] = {
          tier1: Math.round(raw * 0.7),
          tier2: raw - Math.round(raw * 0.7)
        };
      }

      return {
        id:                   site.id,
        name:                 site.name,
        hasMealCounts:        totalCount > 0,
        hasAttendance:        totalCount > 0,   // using meal count as proxy until attendance table exists
        hasEnrollment:        false,             // not yet captured — will be false until enrollment feature built
        hasIncomeEligibility: false,             // not yet captured
        hasDocuments:         missingDocs.length === 0,
        hasMenus:             false,             // not yet captured
        missingDocs,
        enrollment:           0,
        attendance:           totalCount,
        mealTotals
      };
    });

    // 6. Run the engine
    const claim = engine.calculateClaim(siteDataArray, stateConfig, month);

    // 7. Upsert claim record in DB
    await pool.query(
      `INSERT INTO claims
         (sponsor_id, claim_month, state_code, status, readiness_score,
          sites_ready, sites_needs_review, sites_cannot_submit,
          estimated_reimbursement, potential_loss, breakdown, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
       ON CONFLICT (sponsor_id, claim_month)
       DO UPDATE SET
         status = EXCLUDED.status,
         readiness_score = EXCLUDED.readiness_score,
         sites_ready = EXCLUDED.sites_ready,
         sites_needs_review = EXCLUDED.sites_needs_review,
         sites_cannot_submit = EXCLUDED.sites_cannot_submit,
         estimated_reimbursement = EXCLUDED.estimated_reimbursement,
         potential_loss = EXCLUDED.potential_loss,
         breakdown = EXCLUDED.breakdown,
         updated_at = NOW()
       RETURNING id`,
      [
        sponsorId, claimDate, claim.stateCode,
        claim.overallStatus === 'ready' ? 'ready' : 'in_progress',
        claim.readinessScore,
        claim.sitesReady, claim.sitesNeedsReview, claim.sitesCannotSubmit,
        claim.estimatedReimbursement, claim.potentialLoss,
        JSON.stringify(claim.breakdown)
      ]
    );

    res.json(claim);
  } catch (err) {
    console.error('getClaim error:', err);
    res.status(500).json({ error: 'Failed to calculate claim' });
  }
}

// ─── GET /claims/history ──────────────────────────────────────────────────────
// Returns past 6 months of claim summaries

async function getClaimHistory(req, res) {
  try {
    const sponsorId = req.user.organizationId;
    const { rows } = await pool.query(
      `SELECT claim_month, status, readiness_score,
              estimated_reimbursement, potential_loss, breakdown,
              sites_ready, sites_needs_review, sites_cannot_submit
       FROM claims
       WHERE sponsor_id = $1
       ORDER BY claim_month DESC
       LIMIT 6`,
      [sponsorId]
    );
    res.json({ history: rows });
  } catch (err) {
    console.error('getClaimHistory error:', err);
    res.status(500).json({ error: 'Failed to load claim history' });
  }
}

// ─── GET /claims/states ───────────────────────────────────────────────────────
// Returns list of supported states

function getStates(req, res) {
  try {
    const states = engine.listAvailableStates();
    res.json({ states });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load states' });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonth(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

module.exports = { getClaim, getClaimHistory, getStates };
