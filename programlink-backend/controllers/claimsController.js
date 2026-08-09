/**
 * Claims Controller
 * Builds site data from DB, runs the Universal Claims Engine, persists results.
 */

const pool   = require('../config/database');
const engine = require('../services/claimsEngine');

// ─── Shared: build claim data ─────────────────────────────────────────────────
// Used by getClaim and getIntelligence. Returns { claim, stateConfig, claimDate }
// or { error, status } on failure.

async function _loadClaimData(sponsorId, month) {
  const claimDate  = `${month}-01`;
  const [year, mo] = month.split('-').map(Number);
  const monthStart = new Date(year, mo - 1, 1);
  const monthEnd   = new Date(year, mo, 0);   // last day of month

  // 1. Sponsor's state code
  const stateRes = await pool.query(
    `SELECT region FROM organizations WHERE id = $1`,
    [sponsorId]
  );
  const stateCode = stateRes.rows[0]?.region?.toUpperCase() || null;
  if (!stateCode) {
    return { error: 'Sponsor has no state configured. Please update your profile.', status: 400 };
  }

  let stateConfig;
  try {
    stateConfig = engine.loadStateConfig(stateCode);
  } catch {
    return { error: `State "${stateCode}" is not yet supported.`, status: 400 };
  }

  // 2. Active sites for this sponsor
  const sitesRes = await pool.query(
    `SELECT id, name FROM organizations
     WHERE sponsor_id = $1 AND type = 'site' AND status = 'active'`,
    [sponsorId]
  );
  const sites   = sitesRes.rows;
  const siteIds = sites.map(s => s.id);

  if (sites.length === 0) {
    const emptyClaim = engine.calculateClaim([], stateConfig, month);
    return { claim: emptyClaim, stateConfig, claimDate };
  }

  // 3. Meal counts for the month (per-type totals)
  const mealsRes = await pool.query(
    `SELECT site_id,
            COALESCE(SUM(breakfast), 0)::int       AS total_breakfast,
            COALESCE(SUM(lunch),     0)::int       AS total_lunch,
            COALESCE(SUM(snack),     0)::int       AS total_snack,
            COALESCE(SUM(supper),    0)::int       AS total_supper,
            COALESCE(SUM(count_submitted), 0)::int AS submitted,
            SUM(count_verified) FILTER (WHERE count_verified IS NOT NULL)::int AS verified,
            COUNT(*)::int AS days_with_entries
     FROM meal_counts
     WHERE site_id = ANY($1) AND date >= $2 AND date <= $3
     GROUP BY site_id`,
    [siteIds, monthStart, monthEnd]
  );
  const mealsBySite = Object.fromEntries(mealsRes.rows.map(r => [r.site_id, r]));

  // 4. Documents — which required docs are valid or under review?
  const docsRes = await pool.query(
    `SELECT org_id,
            array_agg(doc_type) FILTER (WHERE status IN ('valid','pending_review')) AS valid_docs
     FROM documents
     WHERE org_id = ANY($1)
     GROUP BY org_id`,
    [siteIds]
  );
  const docsBySite = Object.fromEntries(docsRes.rows.map(r => [r.org_id, r]));

  // 5a. Attendance — has at least one record this month per site
  const attendanceRes = await pool.query(
    `SELECT org_id, COUNT(*) AS days_logged, SUM(count) AS total_count
     FROM attendance_records
     WHERE org_id = ANY($1) AND date >= $2 AND date <= $3
     GROUP BY org_id`,
    [siteIds, monthStart, monthEnd]
  );
  const attendanceBySite = Object.fromEntries(
    attendanceRes.rows.map(r => [r.org_id, { days: parseInt(r.days_logged || 0), total: parseInt(r.total_count || 0) }])
  );

  // 5. Menu existence for this claim month (sponsor-level)
  //    Any menu with week_start in the claim month counts.
  const menusExistRes = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM menus
     WHERE org_id IN (
       SELECT id FROM organizations WHERE sponsor_id = $1 OR id = $1
     )
     AND week_start >= date_trunc('month', $2::date)
     AND week_start <  (date_trunc('month', $2::date) + interval '1 month')`,
    [sponsorId, claimDate]
  );
  const hasMenusForMonth = parseInt(menusExistRes.rows[0]?.cnt || 0) > 0;

  // 6. Enrollment per site — children with an approved enrollment form
  const enrollmentRes = await pool.query(
    `SELECT org_id, COUNT(*) AS enrolled_count
     FROM children
     WHERE org_id = ANY($1) AND form_status = 'approved'
     GROUP BY org_id`,
    [siteIds]
  );
  const enrollmentBySite = Object.fromEntries(
    enrollmentRes.rows.map(r => [r.org_id, parseInt(r.enrolled_count || 0)])
  );

  // 7. Income cert per site — children with a valid (non-expired) income cert
  const incomeCertRes = await pool.query(
    `SELECT org_id, COUNT(*) AS cert_count
     FROM children
     WHERE org_id = ANY($1)
       AND income_cert_date IS NOT NULL
       AND (income_cert_expires IS NULL OR income_cert_expires > CURRENT_DATE)
     GROUP BY org_id`,
    [siteIds]
  );
  const incomeCertBySite = Object.fromEntries(
    incomeCertRes.rows.map(r => [r.org_id, parseInt(r.cert_count || 0)])
  );

  // 8. Build site data array for the engine
  const siteDataArray = sites.map(site => {
    const meals      = mealsBySite[site.id] || {};
    const docs       = docsBySite[site.id]  || {};
    const validDocs  = docs.valid_docs || [];
    const missingDocs = stateConfig.requiredDocuments.filter(d => !validDocs.includes(d));

    const totalCount = parseInt(meals.submitted || 0);
    const perTypeRaw = {
      breakfast: parseInt(meals.total_breakfast || 0),
      lunch:     parseInt(meals.total_lunch     || 0),
      snack:     parseInt(meals.total_snack     || 0),
      supper:    parseInt(meals.total_supper    || 0),
    };
    const hasPerType = Object.values(perTypeRaw).reduce((s, v) => s + v, 0) > 0;

    const mealTotals = {};
    for (const mealType of stateConfig.allowedMealTypes) {
      const raw = hasPerType
        ? (perTypeRaw[mealType] || 0)
        : Math.floor(totalCount / stateConfig.allowedMealTypes.length);
      mealTotals[mealType] = {
        tier1: Math.round(raw * 0.7),
        tier2: raw - Math.round(raw * 0.7),
      };
    }

    const enrolled = enrollmentBySite[site.id] || 0;

    return {
      id:                   site.id,
      name:                 site.name,
      hasMealCounts:        totalCount > 0,
      hasAttendance:        (attendanceBySite[site.id]?.days || 0) > 0,
      hasEnrollment:        enrolled > 0,
      hasIncomeEligibility: (incomeCertBySite[site.id] || 0) > 0,
      hasDocuments:         missingDocs.length === 0,
      hasMenus:             hasMenusForMonth,
      missingDocs,
      enrollment:           enrolled,
      attendance:           attendanceBySite[site.id]?.total || 0,
      mealTotals,
    };
  });

  // 9. Run the universal claims engine
  const claim = engine.calculateClaim(siteDataArray, stateConfig, month);
  return { claim, stateConfig, claimDate };
}

// ─── Deadline Helper ──────────────────────────────────────────────────────────

function calcDeadline(month, submissionDeadline) {
  const [year, mo] = month.split('-').map(Number);
  let deadlineDate;

  if (submissionDeadline?.dayOfMonth === 'last') {
    deadlineDate = new Date(year, mo, 0);               // last day of month
  } else if (submissionDeadline?.dayOfMonth) {
    deadlineDate = new Date(year, mo - 1, Number(submissionDeadline.dayOfMonth));
  } else {
    deadlineDate = new Date(year, mo, 0);               // fallback: last day
  }

  if (submissionDeadline?.graceDays) {
    deadlineDate.setDate(deadlineDate.getDate() + (submissionDeadline.graceDays || 0));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.ceil((deadlineDate - today) / 86400000));

  return {
    date:     deadlineDate.toISOString().split('T')[0],
    daysLeft,
    urgent:   daysLeft <= 7,
    label:    deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}

// ─── GET /claims?month=2026-07 ────────────────────────────────────────────────

async function getClaim(req, res) {
  try {
    const sponsorId = req.user.organizationId;
    const month     = req.query.month || formatMonth(new Date());

    const result = await _loadClaimData(sponsorId, month);
    if (result.error) return res.status(result.status || 400).json({ error: result.error });

    const { claim, claimDate } = result;

    // Upsert claim record
    await pool.query(
      `INSERT INTO claims
         (sponsor_id, claim_month, state_code, status, readiness_score,
          sites_ready, sites_needs_review, sites_cannot_submit,
          estimated_reimbursement, potential_loss, breakdown, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
       ON CONFLICT (sponsor_id, claim_month)
       DO UPDATE SET
         status                  = EXCLUDED.status,
         readiness_score         = EXCLUDED.readiness_score,
         sites_ready             = EXCLUDED.sites_ready,
         sites_needs_review      = EXCLUDED.sites_needs_review,
         sites_cannot_submit     = EXCLUDED.sites_cannot_submit,
         estimated_reimbursement = EXCLUDED.estimated_reimbursement,
         potential_loss          = EXCLUDED.potential_loss,
         breakdown               = EXCLUDED.breakdown,
         updated_at              = NOW()`,
      [
        sponsorId, claimDate, claim.stateCode,
        claim.overallStatus === 'ready' ? 'ready' : 'in_progress',
        claim.readinessScore,
        claim.sitesReady, claim.sitesNeedsReview, claim.sitesCannotSubmit,
        claim.estimatedReimbursement, claim.potentialLoss,
        JSON.stringify(claim.breakdown),
      ]
    );

    res.json(claim);
  } catch (err) {
    console.error('getClaim error:', err);
    res.status(500).json({ error: 'Failed to calculate claim' });
  }
}

// ─── GET /claims/intelligence?month=2026-07 ───────────────────────────────────
// Returns a flat list of issues with dollar values and fix links.
// Powers the Claim Intelligence widget on the sponsor overview.

async function getIntelligence(req, res) {
  try {
    const sponsorId = req.user.organizationId;
    const month     = req.query.month || formatMonth(new Date());

    const result = await _loadClaimData(sponsorId, month);
    if (result.error) return res.status(result.status || 400).json({ error: result.error });

    const { claim, stateConfig } = result;

    // Where to send the user to fix each issue type
    const FIX_PATHS = {
      NO_MEAL_COUNTS:                 { path: '/dashboard/sponsor/meal-counts', label: 'Enter Counts'     },
      MISSING_INCOME_ELIGIBILITY:     { path: '/dashboard/sponsor/children',    label: 'View Roster'      },
      MISSING_MENUS:                  { path: '/dashboard/sponsor/menus',       label: 'Build Menu'       },
      REQUIRED_DOCUMENTS_MISSING:     { path: '/dashboard/sponsor/compliance',  label: 'Fix Documents'    },
      LUNCH_EXCEEDS_ATTENDANCE:       { path: '/dashboard/sponsor/meal-counts', label: 'Review Counts'    },
      MEAL_COUNT_EXCEEDS_ENROLLMENT:  { path: '/dashboard/sponsor/children',    label: 'Check Enrollment' },
    };

    // Flatten all errors across all site items into a single issues list
    const allIssues = [];
    for (const item of claim.items) {
      for (const err of item.errors) {
        const fix = FIX_PATHS[err.code] || { path: '/dashboard/sponsor/claims', label: 'View Claim' };
        allIssues.push({
          code:          err.code,
          siteName:      item.siteName,
          siteId:        item.siteId,
          message:       err.message,
          severity:      err.severity,
          potentialLoss: err.potentialLoss || 0,
          fixPath:       fix.path,
          fixLabel:      fix.label,
        });
      }
    }

    // Biggest dollar amounts first
    allIssues.sort((a, b) => b.potentialLoss - a.potentialLoss);

    const deadline = calcDeadline(month, stateConfig.submissionDeadline);
    const [year, mo] = month.split('-').map(Number);
    const monthName  = new Date(year, mo - 1, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    res.json({
      month,
      monthName,
      stateCode:              claim.stateCode,
      stateName:              claim.stateName,
      readinessScore:         claim.readinessScore,
      estimatedReimbursement: claim.estimatedReimbursement,
      reimbursementAtRisk:    claim.potentialLoss,
      issueCount:             allIssues.length,
      totalSites:             claim.totalSites,
      sitesReady:             claim.sitesReady,
      deadline,
      issues:                 allIssues,
    });
  } catch (err) {
    console.error('getIntelligence error:', err);
    res.status(500).json({ error: 'Failed to load claim intelligence' });
  }
}

// ─── GET /claims/history ──────────────────────────────────────────────────────

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

module.exports = { getClaim, getIntelligence, getClaimHistory, getStates };
