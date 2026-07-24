// exportAdapters/pdf.js — PDF adapter for claim export
// Moved from claimsExportController.js; receives assembled claimData and renders PDF.
'use strict';

const PDFDocument = require('pdfkit');

const BRAND  = '#4f46e5';
const GREEN  = '#059669';
const AMBER  = '#d97706';
const RED    = '#dc2626';
const GRAY   = '#6b7280';
const DARK   = '#111827';
const LIGHT  = '#f9fafb';
const BORDER = '#e5e7eb';

function fmt$(n)   { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); }
function fmtNum(n) { return (n || 0).toLocaleString('en-US'); }
function fmtMonth(str) {
  if (!str) return '';
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [y, m] = str.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}
function statusLabel(s) {
  if (s === 'ready')        return { text: 'Ready',   color: GREEN };
  if (s === 'needs_review') return { text: 'Review',  color: AMBER };
  return                           { text: 'Blocked', color: RED   };
}
function mealTypesTotal(mealTotals) {
  if (!mealTotals) return 0;
  return Object.values(mealTotals).reduce((s, t) => s + (t.tier1 || 0) + (t.tier2 || 0), 0);
}
function hr(doc, y, color = BORDER) {
  doc.strokeColor(color).lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
}
function rect(doc, x, y, w, h, fill) { doc.rect(x, y, w, h).fill(fill); }

/**
 * render(claimData, res)
 * claimData: { claim, stateConfig, orgName, month, mealsBySite }
 */
function render(claimData, res) {
  const { claim, stateConfig, orgName, month } = claimData;

  const doc = new PDFDocument({ size: 'LETTER', margin: 50, info: {
    Title: `CACFP Claim Report — ${fmtMonth(month)}`,
    Author: 'CACFPLink',
    Subject: `${stateConfig.stateName} CACFP Monthly Claim`,
  }});

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="CACFP-Claim-${month}.pdf"`);
  doc.pipe(res);

  const PAGE_W   = 595;
  const MARGIN   = 50;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // Header bar
  rect(doc, 0, 0, PAGE_W, 72, BRAND);
  doc.fillColor('#fff').fontSize(18).font('Helvetica-Bold').text('CACFPLink', MARGIN, 20);
  doc.fontSize(10).font('Helvetica').text('CACFP Monthly Claim Summary', MARGIN, 42);
  doc.text(`${stateConfig.stateName} · ${fmtMonth(month)}`, PAGE_W - MARGIN - 160, 42, { align: 'right', width: 160 });

  // Sponsor info
  let y = 90;
  doc.fillColor(DARK).fontSize(16).font('Helvetica-Bold').text(orgName, MARGIN, y); y += 20;
  doc.fillColor(GRAY).fontSize(10).font('Helvetica')
     .text(`Claim Period: ${fmtMonth(month)}   ·   State: ${stateConfig.stateName}   ·   Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, MARGIN, y);
  y += 24; hr(doc, y); y += 16;

  // Summary cards
  const cardW = (CONTENT_W - 16) / 3;
  [
    { label: 'Estimated Reimbursement', value: fmt$(claim.estimatedReimbursement), color: GREEN },
    { label: 'Sites Ready', value: `${claim.sitesReady} / ${claim.totalSites}`, color: BRAND },
    { label: 'Claim Readiness', value: `${claim.readinessScore}%`, color: claim.readinessScore >= 90 ? GREEN : claim.readinessScore >= 60 ? AMBER : RED },
  ].forEach((card, i) => {
    const cx = MARGIN + i * (cardW + 8);
    rect(doc, cx, y, cardW, 58, LIGHT); doc.rect(cx, y, cardW, 58).stroke(BORDER);
    doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(card.label.toUpperCase(), cx + 10, y + 10, { width: cardW - 20 });
    doc.fillColor(card.color).fontSize(18).font('Helvetica-Bold').text(card.value, cx + 10, y + 26, { width: cardW - 20 });
  });
  y += 74;

  // Meal Breakdown
  doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text('Meal Breakdown', MARGIN, y); y += 18;
  rect(doc, MARGIN, y, CONTENT_W, 22, BRAND);
  doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold');
  const cols = [
    { label: 'Meal Type',    x: MARGIN + 10,  w: 140 },
    { label: 'Meals Served', x: MARGIN + 160, w: 100, align: 'right' },
    { label: 'Tier 1 Rate',  x: MARGIN + 270, w: 80,  align: 'right' },
    { label: 'Tier 2 Rate',  x: MARGIN + 360, w: 80,  align: 'right' },
    { label: 'Est. Amount',  x: MARGIN + 450, w: 95,  align: 'right' },
  ];
  cols.forEach(col => doc.text(col.label, col.x, y + 6, { width: col.w, align: col.align || 'left' }));
  y += 22;

  stateConfig.allowedMealTypes.forEach((mt, idx) => {
    rect(doc, MARGIN, y, CONTENT_W, 20, idx % 2 === 0 ? '#fff' : LIGHT);
    const counts = claim.items.reduce((sum, item) => {
      const t = item.mealTotals?.[mt] || {};
      return sum + (t.tier1 || 0) + (t.tier2 || 0);
    }, 0);
    const amt   = claim.breakdown?.[mt] || 0;
    const rates = stateConfig.rates[mt] || {};
    doc.fillColor(DARK).fontSize(9).font('Helvetica');
    doc.text(mt.charAt(0).toUpperCase() + mt.slice(1), MARGIN + 10, y + 5, { width: 140 });
    doc.text(fmtNum(counts), MARGIN + 160, y + 5, { width: 100, align: 'right' });
    doc.text(fmt$(rates.tier1 || 0), MARGIN + 270, y + 5, { width: 80, align: 'right' });
    doc.text(fmt$(rates.tier2 || 0), MARGIN + 360, y + 5, { width: 80, align: 'right' });
    doc.fillColor(BRAND).font('Helvetica-Bold').text(fmt$(amt), MARGIN + 450, y + 5, { width: 95, align: 'right' });
    y += 20;
  });

  rect(doc, MARGIN, y, CONTENT_W, 22, '#ede9fe');
  doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text('Total Estimated Reimbursement', MARGIN + 10, y + 6, { width: 430 });
  doc.fillColor(BRAND).fontSize(11).font('Helvetica-Bold').text(fmt$(claim.estimatedReimbursement), MARGIN + 450, y + 5, { width: 95, align: 'right' });
  y += 30;

  // Site Details
  y += 8;
  doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text('Site Details', MARGIN, y); y += 18;
  rect(doc, MARGIN, y, CONTENT_W, 22, BRAND);
  doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold');
  const siteCols = [
    { label: 'Site Name',  x: MARGIN + 10,  w: 180 },
    { label: 'Meals',      x: MARGIN + 200, w: 60,  align: 'right' },
    { label: 'Est. Value', x: MARGIN + 275, w: 90,  align: 'right' },
    { label: 'Status',     x: MARGIN + 375, w: 70,  align: 'center' },
    { label: 'Blockers',   x: MARGIN + 455, w: 90 },
  ];
  siteCols.forEach(col => doc.text(col.label, col.x, y + 6, { width: col.w, align: col.align || 'left' }));
  y += 22;

  claim.items.forEach((item, idx) => {
    if (y > 680) { doc.addPage(); y = 60; }
    rect(doc, MARGIN, y, CONTENT_W, 20, idx % 2 === 0 ? '#fff' : LIGHT);
    const meals   = mealTypesTotal(item.mealTotals);
    const sl      = statusLabel(item.status);
    const blocker = item.errors?.[0]?.message || (item.checklist?.documents === false ? 'Missing docs' : '') || '—';
    const bs      = blocker.length > 28 ? blocker.slice(0, 26) + '…' : blocker;
    doc.fillColor(DARK).fontSize(9).font('Helvetica').text(item.siteName, MARGIN + 10, y + 5, { width: 180, ellipsis: true });
    doc.text(fmtNum(meals), MARGIN + 200, y + 5, { width: 60, align: 'right' });
    doc.fillColor(BRAND).font('Helvetica-Bold').text(fmt$(item.estimatedReimbursement), MARGIN + 275, y + 5, { width: 90, align: 'right' });
    doc.fillColor(sl.color).font('Helvetica-Bold').text(sl.text, MARGIN + 375, y + 5, { width: 70, align: 'center' });
    doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(bs, MARGIN + 455, y + 6, { width: 90 });
    y += 20;
  });
  y += 16;

  // Issues
  const issues = claim.items.filter(i => i.status !== 'ready');
  if (issues.length > 0) {
    if (y > 640) { doc.addPage(); y = 60; }
    hr(doc, y); y += 12;
    doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('Issues Requiring Attention', MARGIN, y); y += 16;
    issues.forEach(item => {
      if (y > 700) { doc.addPage(); y = 60; }
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(`• ${item.siteName}`, MARGIN, y); y += 12;
      (item.errors || []).forEach(err => {
        if (y > 700) { doc.addPage(); y = 60; }
        doc.fillColor(RED).fontSize(8).font('Helvetica').text(`  — ${err.message}`, MARGIN + 10, y); y += 11;
      });
      const cl = item.checklist || {};
      if (cl.mealCounts === false)        { doc.fillColor(AMBER).fontSize(8).text('  — Meal counts not submitted',      MARGIN + 10, y); y += 11; }
      if (cl.documents === false)         { doc.fillColor(AMBER).fontSize(8).text('  — Required documents missing',     MARGIN + 10, y); y += 11; }
      if (cl.enrollment === false)        { doc.fillColor(AMBER).fontSize(8).text('  — Enrollment not recorded',        MARGIN + 10, y); y += 11; }
      if (cl.incomeEligibility === false) { doc.fillColor(AMBER).fontSize(8).text('  — Income eligibility forms missing',MARGIN + 10, y); y += 11; }
    });
  }

  // Footer
  hr(doc, 745);
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
     .text(`Generated by CACFPLink · cacfplink.com · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
       MARGIN, 751, { width: CONTENT_W, align: 'center' });
  doc.text('This document is an estimate. Actual reimbursement may vary based on state agency review.', MARGIN, 763, { width: CONTENT_W, align: 'center' });
  doc.end();
}

module.exports = { render };
