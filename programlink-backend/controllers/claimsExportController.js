/**
 * Claims Export Controller
 * GET /claims/export?month=YYYY-MM
 * Generates a formatted CACFP claim summary PDF using pdfkit.
 */

const PDFDocument = require('pdfkit');
const pool        = require('../config/database');
const engine      = require('../services/claimsEngine');

// ─── Colors ──────────────────────────────────────────────────────────────────
const BRAND   = '#4f46e5';
const GREEN   = '#059669';
const AMBER   = '#d97706';
const RED     = '#dc2626';
const GRAY    = '#6b7280';
const DARK    = '#111827';
const LIGHT   = '#f9fafb';
const BORDER  = '#e5e7eb';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt$(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

function fmtNum(n) {
  return (n || 0).toLocaleString('en-US');
}

function fmtMonth(str) {
  if (!str) return '';
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const [y, m] = str.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

function statusLabel(s) {
  if (s === 'ready')         return { text: 'Ready',   color: GREEN };
  if (s === 'needs_review')  return { text: 'Review',  color: AMBER };
  return                            { text: 'Blocked', color: RED   };
}

function mealTypesTotal(mealTotals) {
  if (!mealTotals) return 0;
  return Object.values(mealTotals).reduce((s, t) => s + (t.tier1 || 0) + (t.tier2 || 0), 0);
}

// Draw a horizontal rule
function hr(doc, y, color = BORDER) {
  doc.strokeColor(color).lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
}

// Draw a filled rectangle
function rect(doc, x, y, w, h, fill) {
  doc.rect(x, y, w, h).fill(fill);
}

// ─── Main Export Function ─────────────────────────────────────────────────────

exports.exportClaim = async (req, res) => {
  try {
    const sponsorId = req.user.organizationId;
    const month     = req.query.month || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

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

    // 4. Docs
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
        missingDocs, enrollment: 0, attendance: totalCount, mealTotals
      };
    });

    const claim = engine.calculateClaim(siteDataArray, stateConfig, month);

    // ── Build PDF ─────────────────────────────────────────────────────────────
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, info: {
      Title: `CACFP Claim Report — ${fmtMonth(month)}`,
      Author: 'CACFPLink',
      Subject: `${stateConfig.stateName} CACFP Monthly Claim`,
    }});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CACFP-Claim-${month}.pdf"`);
    doc.pipe(res);

    const PAGE_W = 595;
    const MARGIN = 50;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    // ── Header bar ────────────────────────────────────────────────────────────
    rect(doc, 0, 0, PAGE_W, 72, BRAND);
    doc.fillColor('#fff')
       .fontSize(18).font('Helvetica-Bold')
       .text('CACFPLink', MARGIN, 20);
    doc.fontSize(10).font('Helvetica')
       .text('CACFP Monthly Claim Summary', MARGIN, 42);
    doc.fontSize(10).font('Helvetica')
       .text(`${stateConfig.stateName} · ${fmtMonth(month)}`, PAGE_W - MARGIN - 160, 42, { align: 'right', width: 160 });

    // ── Sponsor info row ──────────────────────────────────────────────────────
    let y2 = 90;
    doc.fillColor(DARK).fontSize(16).font('Helvetica-Bold')
       .text(orgName, MARGIN, y2);
    y2 += 20;
    doc.fillColor(GRAY).fontSize(10).font('Helvetica')
       .text(`Claim Period: ${fmtMonth(month)}   ·   State: ${stateConfig.stateName}   ·   Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, MARGIN, y2);
    y2 += 24;
    hr(doc, y2);
    y2 += 16;

    // ── Summary cards (3-up) ──────────────────────────────────────────────────
    const cardW = (CONTENT_W - 16) / 3;
    const cards = [
      { label: 'Estimated Reimbursement', value: fmt$(claim.estimatedReimbursement), color: GREEN },
      { label: 'Sites Ready',             value: `${claim.sitesReady} / ${claim.totalSites}`,  color: BRAND },
      { label: 'Claim Readiness',         value: `${claim.readinessScore}%`,                   color: claim.readinessScore >= 90 ? GREEN : claim.readinessScore >= 60 ? AMBER : RED },
    ];
    cards.forEach((card, i) => {
      const cx = MARGIN + i * (cardW + 8);
      rect(doc, cx, y2, cardW, 58, LIGHT);
      doc.rect(cx, y2, cardW, 58).stroke(BORDER);
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
         .text(card.label.toUpperCase(), cx + 10, y2 + 10, { width: cardW - 20 });
      doc.fillColor(card.color).fontSize(18).font('Helvetica-Bold')
         .text(card.value, cx + 10, y2 + 26, { width: cardW - 20 });
    });
    y2 += 74;

    // ── Meal Breakdown table ──────────────────────────────────────────────────
    doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text('Meal Breakdown', MARGIN, y2);
    y2 += 18;

    // Table header
    rect(doc, MARGIN, y2, CONTENT_W, 22, BRAND);
    doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold');
    const cols = [
      { label: 'Meal Type', x: MARGIN + 10,  w: 140 },
      { label: 'Meals Served', x: MARGIN + 160, w: 100, align: 'right' },
      { label: 'Tier 1 Rate', x: MARGIN + 270, w: 80,  align: 'right' },
      { label: 'Tier 2 Rate', x: MARGIN + 360, w: 80,  align: 'right' },
      { label: 'Est. Amount', x: MARGIN + 450, w: 95,  align: 'right' },
    ];
    cols.forEach(col => {
      doc.text(col.label, col.x, y2 + 6, { width: col.w, align: col.align || 'left' });
    });
    y2 += 22;

    // Rows
    let breakdownTotal = 0;
    stateConfig.allowedMealTypes.forEach((mt, idx) => {
      const bg = idx % 2 === 0 ? '#fff' : LIGHT;
      rect(doc, MARGIN, y2, CONTENT_W, 20, bg);
      const counts = claim.items.reduce((sum, item) => {
        const t = item.mealTotals?.[mt] || {};
        return sum + (t.tier1 || 0) + (t.tier2 || 0);
      }, 0);
      const amt    = claim.breakdown?.[mt] || 0;
      const rates  = stateConfig.rates[mt] || {};
      breakdownTotal += amt;

      doc.fillColor(DARK).fontSize(9).font('Helvetica');
      doc.text(mt.charAt(0).toUpperCase() + mt.slice(1), MARGIN + 10,  y2 + 5, { width: 140 });
      doc.text(fmtNum(counts),  MARGIN + 160, y2 + 5, { width: 100, align: 'right' });
      doc.text(fmt$(rates.tier1 || 0), MARGIN + 270, y2 + 5, { width: 80, align: 'right' });
      doc.text(fmt$(rates.tier2 || 0), MARGIN + 360, y2 + 5, { width: 80, align: 'right' });
      doc.fillColor(BRAND).font('Helvetica-Bold')
         .text(fmt$(amt), MARGIN + 450, y2 + 5, { width: 95, align: 'right' });
      y2 += 20;
    });

    // Total row
    rect(doc, MARGIN, y2, CONTENT_W, 22, '#ede9fe');
    doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
       .text('Total Estimated Reimbursement', MARGIN + 10, y2 + 6, { width: 430 });
    doc.fillColor(BRAND).fontSize(11).font('Helvetica-Bold')
       .text(fmt$(claim.estimatedReimbursement), MARGIN + 450, y2 + 5, { width: 95, align: 'right' });
    y2 += 30;

    // ── Site Status table ─────────────────────────────────────────────────────
    y2 += 8;
    doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text('Site Details', MARGIN, y2);
    y2 += 18;

    // Header
    rect(doc, MARGIN, y2, CONTENT_W, 22, BRAND);
    doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold');
    const siteCols = [
      { label: 'Site Name',   x: MARGIN + 10,  w: 180 },
      { label: 'Meals',       x: MARGIN + 200,  w: 60,  align: 'right' },
      { label: 'Est. Value',  x: MARGIN + 275,  w: 90,  align: 'right' },
      { label: 'Status',      x: MARGIN + 375,  w: 70,  align: 'center' },
      { label: 'Blockers',    x: MARGIN + 455,  w: 90  },
    ];
    siteCols.forEach(col => {
      doc.text(col.label, col.x, y2 + 6, { width: col.w, align: col.align || 'left' });
    });
    y2 += 22;

    claim.items.forEach((item, idx) => {
      // Handle page break
      if (y2 > 680) {
        doc.addPage();
        y2 = 60;
      }
      const bg     = idx % 2 === 0 ? '#fff' : LIGHT;
      const rowH   = 20;
      rect(doc, MARGIN, y2, CONTENT_W, rowH, bg);

      const meals  = mealTypesTotal(item.mealTotals);
      const sl     = statusLabel(item.status);
      const blocker = item.errors?.[0]?.message || (item.checklist?.documents === false ? 'Missing docs' : '') || '—';
      const blockerShort = blocker.length > 28 ? blocker.slice(0, 26) + '…' : blocker;

      doc.fillColor(DARK).fontSize(9).font('Helvetica')
         .text(item.siteName, MARGIN + 10, y2 + 5, { width: 180, ellipsis: true });
      doc.text(fmtNum(meals), MARGIN + 200, y2 + 5, { width: 60, align: 'right' });
      doc.fillColor(BRAND).font('Helvetica-Bold')
         .text(fmt$(item.estimatedReimbursement), MARGIN + 275, y2 + 5, { width: 90, align: 'right' });
      doc.fillColor(sl.color).font('Helvetica-Bold')
         .text(sl.text, MARGIN + 375, y2 + 5, { width: 70, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8)
         .text(blockerShort, MARGIN + 455, y2 + 6, { width: 90 });
      y2 += rowH;
    });

    y2 += 16;

    // ── Notes / Issues section ────────────────────────────────────────────────
    const issues = claim.items.filter(i => i.status !== 'ready');
    if (issues.length > 0) {
      if (y2 > 640) { doc.addPage(); y2 = 60; }
      hr(doc, y2);
      y2 += 12;
      doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('Issues Requiring Attention', MARGIN, y2);
      y2 += 16;

      issues.forEach(item => {
        if (y2 > 700) { doc.addPage(); y2 = 60; }
        doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(`• ${item.siteName}`, MARGIN, y2);
        y2 += 12;
        (item.errors || []).forEach(err => {
          if (y2 > 700) { doc.addPage(); y2 = 60; }
          doc.fillColor(RED).fontSize(8).font('Helvetica').text(`  — ${err.message}`, MARGIN + 10, y2);
          y2 += 11;
        });
        const cl = item.checklist || {};
        if (cl.mealCounts === false)        { doc.fillColor(AMBER).fontSize(8).text('  — Meal counts not submitted', MARGIN + 10, y2); y2 += 11; }
        if (cl.documents  === false)        { doc.fillColor(AMBER).fontSize(8).text('  — Required documents missing', MARGIN + 10, y2); y2 += 11; }
        if (cl.enrollment === false)        { doc.fillColor(AMBER).fontSize(8).text('  — Enrollment not recorded', MARGIN + 10, y2); y2 += 11; }
        if (cl.incomeEligibility === false) { doc.fillColor(AMBER).fontSize(8).text('  — Income eligibility forms missing', MARGIN + 10, y2); y2 += 11; }
      });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = 745;
    hr(doc, footerY);
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
       .text(
         `Generated by CACFPLink · cacfplink.com · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
         MARGIN, footerY + 6, { width: CONTENT_W, align: 'center' }
       );
    doc.text('This document is an estimate. Actual reimbursement may vary based on state agency review.', MARGIN, footerY + 18, { width: CONTENT_W, align: 'center' });

    doc.end();

  } catch (err) {
    console.error('exportClaim error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate export.' });
    }
  }
};
