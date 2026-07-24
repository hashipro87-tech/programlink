// exportAdapters/csv.js — CSV adapter for claim export
// Pure Node.js — no dependencies.
'use strict';

function esc(v) {
  const s = String(v == null ? '' : v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
function row(...cells) { return cells.map(esc).join(',') + '\r\n'; }

function fmtMonth(str) {
  if (!str) return '';
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [y, m] = str.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

/**
 * render(claimData, res)
 * claimData: { claim, stateConfig, orgName, month }
 */
function render(claimData, res) {
  const { claim, stateConfig, orgName, month } = claimData;

  let csv = '';

  // Header
  csv += row('CACFPLink — CACFP Monthly Claim Summary');
  csv += row(`Organization: ${orgName}`, `State: ${stateConfig.stateName}`, `Period: ${fmtMonth(month)}`, `Generated: ${new Date().toLocaleDateString('en-US')}`);
  csv += row();

  // KPIs
  csv += row('Estimated Reimbursement', 'Sites Ready', 'Claim Readiness');
  csv += row(
    `$${parseFloat(claim.estimatedReimbursement || 0).toFixed(2)}`,
    `${claim.sitesReady} / ${claim.totalSites}`,
    `${claim.readinessScore}%`
  );
  csv += row();

  // Meal Breakdown
  csv += row('MEAL BREAKDOWN');
  csv += row('Meal Type', 'Meals Served', 'Tier 1 Rate', 'Tier 2 Rate', 'Est. Amount');
  stateConfig.allowedMealTypes.forEach(mt => {
    const counts = claim.items.reduce((sum, item) => {
      const t = item.mealTotals?.[mt] || {};
      return sum + (t.tier1 || 0) + (t.tier2 || 0);
    }, 0);
    const amt   = claim.breakdown?.[mt] || 0;
    const rates = stateConfig.rates[mt] || {};
    csv += row(
      mt.charAt(0).toUpperCase() + mt.slice(1),
      counts,
      `$${parseFloat(rates.tier1 || 0).toFixed(2)}`,
      `$${parseFloat(rates.tier2 || 0).toFixed(2)}`,
      `$${parseFloat(amt).toFixed(2)}`
    );
  });
  csv += row('Total', '', '', '', `$${parseFloat(claim.estimatedReimbursement || 0).toFixed(2)}`);
  csv += row();

  // Per-site detail
  csv += row('SITE DETAILS');
  csv += row('Site Name', 'Breakfast', 'Lunch', 'Snack', 'Supper', 'Total Meals', 'Est. Reimbursement', 'Status', 'Blockers');
  claim.items.forEach(item => {
    const mt    = item.mealTotals || {};
    const get   = (t) => (mt[t]?.tier1 || 0) + (mt[t]?.tier2 || 0);
    const total = get('breakfast') + get('lunch') + get('snack') + get('supper');
    const status = item.status === 'ready' ? 'Ready' : item.status === 'needs_review' ? 'Needs Review' : 'Blocked';
    const blocker = item.errors?.map(e => e.message).join('; ') || '';
    csv += row(
      item.siteName,
      get('breakfast'), get('lunch'), get('snack'), get('supper'),
      total,
      `$${parseFloat(item.estimatedReimbursement || 0).toFixed(2)}`,
      status,
      blocker
    );
  });

  const filename = `CACFP-Claim-${month}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.end('﻿' + csv); // BOM for Excel UTF-8 compatibility
}

module.exports = { render };
