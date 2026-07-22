/**
 * CACFPLink Universal Claims Engine
 *
 * State-agnostic. Takes meal data + site data + stateConfig → produces a full claim.
 * The engine never knows what state it's in — it only knows what the config tells it.
 *
 * Usage:
 *   const engine = require('./claimsEngine');
 *   const result = engine.calculateClaim(sites, stateConfig);
 */

const fs   = require('fs');
const path = require('path');

// ─── State Config Loader ──────────────────────────────────────────────────────

const configCache = {};

function loadStateConfig(stateCode) {
  if (configCache[stateCode]) return configCache[stateCode];
  const filePath = path.join(__dirname, 'stateConfigs', `${stateCode.toUpperCase()}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No state config found for: ${stateCode}`);
  }
  const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  configCache[stateCode] = config;
  return config;
}

function listAvailableStates() {
  const dir = path.join(__dirname, 'stateConfigs');
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const config = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { stateCode: config.stateCode, stateName: config.stateName };
    });
}

// ─── Validation Rules ─────────────────────────────────────────────────────────
// Each rule is a function: (siteData, stateConfig) → error object or null

const VALIDATION_RULES = {

  meal_count_not_exceed_enrollment: (site) => {
    const enrollment = site.enrollment || 0;
    const totalMeals = getTotalMealsForSite(site.mealTotals);
    if (enrollment > 0 && totalMeals > enrollment * 31 * 3) {
      const excess = totalMeals - (enrollment * 31 * 3);
      return {
        code: 'MEAL_COUNT_EXCEEDS_ENROLLMENT',
        message: `Total meal count may exceed enrolled children. Check enrollment numbers.`,
        severity: 'warning',
        potentialLoss: 0  // calculated per meal type below
      };
    }
    return null;
  },

  lunch_not_exceed_attendance: (site) => {
    const lunches = getMealTotal(site.mealTotals, 'lunch');
    const attendance = site.attendance || 0;
    if (attendance > 0 && lunches > attendance) {
      const excess = lunches - attendance;
      // approximate loss: excess lunches × average lunch rate
      const potentialLoss = parseFloat((excess * 2.58).toFixed(2));
      return {
        code: 'LUNCH_EXCEEDS_ATTENDANCE',
        message: `Lunch count (${lunches}) exceeds recorded attendance (${attendance}). ${excess} lunches may be disallowed.`,
        severity: 'error',
        potentialLoss
      };
    }
    return null;
  },

  income_eligibility_current: (site, stateConfig) => {
    if (!stateConfig.requiredFields.includes('income_eligibility')) return null;
    if (!site.hasIncomeEligibility) {
      return {
        code: 'MISSING_INCOME_ELIGIBILITY',
        message: 'Income eligibility forms are missing or expired. Site cannot submit without them.',
        severity: 'error',
        potentialLoss: site.estimatedReimbursement || 0
      };
    }
    return null;
  },

  menus_meet_meal_pattern: (site, stateConfig) => {
    if (!stateConfig.requiredFields.includes('menus')) return null;
    if (!site.hasMenus) {
      return {
        code: 'MISSING_MENUS',
        message: 'Menus have not been submitted for this month. Required for claim submission.',
        severity: 'error',
        potentialLoss: site.estimatedReimbursement || 0
      };
    }
    return null;
  },

  documents_not_expired: (site, stateConfig) => {
    const missing = (site.missingDocs || []).filter(d =>
      stateConfig.requiredDocuments.includes(d)
    );
    if (missing.length > 0) {
      return {
        code: 'REQUIRED_DOCUMENTS_MISSING',
        message: `Missing required documents: ${missing.join(', ')}.`,
        severity: 'error',
        potentialLoss: site.estimatedReimbursement || 0
      };
    }
    return null;
  },

  // Universal: runs for every site regardless of stateConfig
  no_meal_counts_submitted: (site) => {
    if (!site.hasMealCounts) {
      return {
        code: 'NO_MEAL_COUNTS',
        message: 'No meal counts submitted this month. This site cannot be included in the claim.',
        severity: 'error',
        potentialLoss: site.estimatedReimbursement || 0
      };
    }
    return null;
  }

};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMealTotal(mealTotals, mealType) {
  if (!mealTotals || !mealTotals[mealType]) return 0;
  const t = mealTotals[mealType];
  return (t.tier1 || 0) + (t.tier2 || 0);
}

function getTotalMealsForSite(mealTotals) {
  if (!mealTotals) return 0;
  return Object.values(mealTotals).reduce((sum, t) => {
    return sum + (t.tier1 || 0) + (t.tier2 || 0);
  }, 0);
}

// ─── Reimbursement Calculation ────────────────────────────────────────────────

function calculateSiteReimbursement(mealTotals, stateConfig) {
  const breakdown = {};
  let total = 0;

  for (const mealType of stateConfig.allowedMealTypes) {
    if (!mealTotals || !mealTotals[mealType]) {
      breakdown[mealType] = 0;
      continue;
    }
    const counts = mealTotals[mealType];
    const rates  = stateConfig.rates[mealType];
    const amount = parseFloat((
      ((counts.tier1 || 0) * (rates.tier1 || 0)) +
      ((counts.tier2 || 0) * (rates.tier2 || 0))
    ).toFixed(2));
    breakdown[mealType] = amount;
    total += amount;
  }

  return { breakdown, total: parseFloat(total.toFixed(2)) };
}

// ─── Site Validation ──────────────────────────────────────────────────────────

// Rules that always apply regardless of state config
const UNIVERSAL_RULES = ['no_meal_counts_submitted'];

function validateSite(site, stateConfig) {
  const errors = [];

  // Universal rules first
  for (const ruleName of UNIVERSAL_RULES) {
    const ruleFn = VALIDATION_RULES[ruleName];
    if (!ruleFn) continue;
    const error = ruleFn(site, stateConfig);
    if (error) errors.push(error);
  }

  // State-configured rules (skip any that were already run universally)
  for (const ruleName of stateConfig.validationRules) {
    if (UNIVERSAL_RULES.includes(ruleName)) continue;
    const ruleFn = VALIDATION_RULES[ruleName];
    if (!ruleFn) continue;
    const error = ruleFn(site, stateConfig);
    if (error) errors.push(error);
  }

  return errors;
}

// ─── Site Readiness ───────────────────────────────────────────────────────────

function getSiteStatus(site, errors, stateConfig) {
  const hasErrors   = errors.some(e => e.severity === 'error');
  const hasWarnings = errors.some(e => e.severity === 'warning');

  // Cannot submit if missing required data or has hard errors
  const missingRequired =
    (stateConfig.requiredFields.includes('enrollment')          && !site.hasEnrollment) ||
    (stateConfig.requiredFields.includes('income_eligibility')  && !site.hasIncomeEligibility) ||
    (stateConfig.requiredFields.includes('menus')               && !site.hasMenus) ||
    !site.hasMealCounts ||
    !site.hasDocuments;

  if (hasErrors || missingRequired) return 'cannot_submit';
  if (hasWarnings)                  return 'needs_review';
  return 'ready';
}

// ─── Checklist ────────────────────────────────────────────────────────────────

function getSiteChecklist(site, stateConfig) {
  return {
    mealCounts:        site.hasMealCounts        || false,
    attendance:        site.hasAttendance        || false,
    enrollment:        stateConfig.requiredFields.includes('enrollment')         ? (site.hasEnrollment        || false) : null,
    incomeEligibility: stateConfig.requiredFields.includes('income_eligibility') ? (site.hasIncomeEligibility || false) : null,
    documents:         site.hasDocuments         || false,
    menus:             stateConfig.requiredFields.includes('menus')              ? (site.hasMenus             || false) : null
  };
}

// ─── Main Engine Entry Point ──────────────────────────────────────────────────

/**
 * calculateClaim
 *
 * @param {Array}  sites       - Array of site data objects (see shape below)
 * @param {Object} stateConfig - Loaded state config (from loadStateConfig)
 * @param {string} claimMonth  - 'YYYY-MM' e.g. '2026-07'
 *
 * Site data shape:
 * {
 *   id:                   UUID,
 *   name:                 string,
 *   hasMealCounts:        boolean,
 *   hasAttendance:        boolean,
 *   hasEnrollment:        boolean,
 *   hasIncomeEligibility: boolean,
 *   hasDocuments:         boolean,
 *   hasMenus:             boolean,
 *   missingDocs:          string[],   -- doc_type strings that are missing/expired
 *   enrollment:           number,     -- enrolled children count
 *   attendance:           number,     -- total attendance days this month
 *   mealTotals: {
 *     breakfast: { tier1: number, tier2: number },
 *     lunch:     { tier1: number, tier2: number },
 *     snack:     { tier1: number, tier2: number },
 *     supper:    { tier1: number, tier2: number }
 *   }
 * }
 *
 * @returns {Object} Full claim result
 */
function calculateClaim(sites, stateConfig, claimMonth) {
  const claimItems           = [];
  const totalBreakdown       = {};
  let   totalReimbursement   = 0;
  let   totalPotentialLoss   = 0;
  let   sitesReady           = 0;
  let   sitesNeedsReview     = 0;
  let   sitesCannotSubmit    = 0;

  // Init breakdown buckets
  for (const mealType of stateConfig.allowedMealTypes) {
    totalBreakdown[mealType] = 0;
  }

  for (const site of sites) {
    // 1. Calculate reimbursement for this site
    const { breakdown, total } = calculateSiteReimbursement(site.mealTotals, stateConfig);

    // Attach estimated reimbursement to site for validation rules
    site.estimatedReimbursement = total;

    // 2. Run validation rules
    const errors = validateSite(site, stateConfig);

    // 3. Determine status
    const status = getSiteStatus(site, errors, stateConfig);

    // 4. Calculate potential loss (sum of all error potentialLoss values)
    const potentialLoss = parseFloat(
      errors.reduce((sum, e) => sum + (e.potentialLoss || 0), 0).toFixed(2)
    );

    // 5. Checklist
    const checklist = getSiteChecklist(site, stateConfig);

    // 6. Accumulate totals
    totalReimbursement += total;
    totalPotentialLoss += potentialLoss;
    for (const mealType of stateConfig.allowedMealTypes) {
      totalBreakdown[mealType] = parseFloat(
        ((totalBreakdown[mealType] || 0) + (breakdown[mealType] || 0)).toFixed(2)
      );
    }

    // 7. Tally site statuses
    if (status === 'ready')           sitesReady++;
    else if (status === 'needs_review') sitesNeedsReview++;
    else                               sitesCannotSubmit++;

    claimItems.push({
      siteId:                 site.id,
      siteName:               site.name,
      status,
      checklist,
      mealTotals:             site.mealTotals || {},
      estimatedReimbursement: total,
      breakdown,
      errors,
      potentialLoss
    });
  }

  const totalSites    = sites.length;
  const readinessScore = totalSites > 0
    ? parseFloat(((sitesReady / totalSites) * 100).toFixed(1))
    : 0;

  const overallStatus = sitesCannotSubmit > 0 ? 'cannot_submit'
    : sitesNeedsReview > 0                    ? 'needs_review'
    : 'ready';

  return {
    claimMonth,
    stateCode:              stateConfig.stateCode,
    stateName:              stateConfig.stateName,
    readinessScore,
    overallStatus,
    totalSites,
    sitesReady,
    sitesNeedsReview,
    sitesCannotSubmit,
    estimatedReimbursement: parseFloat(totalReimbursement.toFixed(2)),
    potentialLoss:          parseFloat(totalPotentialLoss.toFixed(2)),
    breakdown:              totalBreakdown,
    submissionDeadline:     stateConfig.submissionDeadline,
    rates:                  stateConfig.rates,
    allowedMealTypes:       stateConfig.allowedMealTypes,
    items:                  claimItems
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  loadStateConfig,
  listAvailableStates,
  calculateClaim,
  calculateSiteReimbursement,
  validateSite,
  getSiteStatus
};
