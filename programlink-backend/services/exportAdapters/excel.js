// exportAdapters/excel.js — Excel (.xlsx) adapter for claim export
// Uses exceljs for styled workbook output.
'use strict';

const ExcelJS = require('exceljs');

function fmt$(n)   { return (n || 0).toFixed(2); }
function fmtMonth(str) {
  if (!str) return '';
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [y, m] = str.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

// Brand colors (ARGB — Excel requires full 8-char hex with alpha)
const C = {
  brand:  'FF4F46E5',
  white:  'FFFFFFFF',
  green:  'FF059669',
  amber:  'FFD97706',
  red:    'FFDC2626',
  gray:   'FF6B7280',
  lgray:  'FFF3F4F6',
  purple: 'FFEDE9FE',
  dark:   'FF111827',
};

function brandFill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function headerRow(sheet, cols, rowNum) {
  const row = sheet.getRow(rowNum);
  cols.forEach((col, i) => {
    const cell = row.getCell(i + 1);
    cell.value = col.label;
    cell.font  = { bold: true, color: { argb: C.white }, size: 10 };
    cell.fill  = brandFill(C.brand);
    cell.alignment = { vertical: 'middle', horizontal: col.align || 'left' };
    cell.border = { bottom: { style: 'thin', color: { argb: C.brand } } };
  });
  row.height = 22;
  return row;
}

/**
 * render(claimData, res)
 * claimData: { claim, stateConfig, orgName, month }
 */
async function render(claimData, res) {
  const { claim, stateConfig, orgName, month } = claimData;

  const wb    = new ExcelJS.Workbook();
  wb.creator  = 'CACFPLink';
  wb.created  = new Date();
  wb.subject  = `${stateConfig.stateName} CACFP Claim — ${fmtMonth(month)}`;

  // ── Sheet 1: Summary ────────────────────────────────────────────────────────
  const summary = wb.addWorksheet('Summary', { views: [{ showGridLines: false }] });
  summary.columns = [
    { width: 30 }, { width: 20 }, { width: 20 }, { width: 20 },
  ];

  // Title band
  summary.mergeCells('A1:D1');
  const titleCell = summary.getCell('A1');
  titleCell.value     = `CACFPLink — CACFP Monthly Claim Summary`;
  titleCell.font      = { bold: true, size: 16, color: { argb: C.white } };
  titleCell.fill      = brandFill(C.brand);
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  summary.getRow(1).height = 32;

  // Sub-header
  summary.mergeCells('A2:D2');
  const sub = summary.getCell('A2');
  sub.value     = `${orgName} · ${stateConfig.stateName} · ${fmtMonth(month)} · Generated ${new Date().toLocaleDateString('en-US')}`;
  sub.font      = { size: 9, color: { argb: C.gray } };
  sub.fill      = brandFill(C.lgray);
  sub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  summary.getRow(2).height = 18;

  summary.addRow([]); // spacer

  // KPI row
  const kpiLabels = ['Estimated Reimbursement', 'Sites Ready', 'Claim Readiness'];
  const kpiValues = [
    `$${parseFloat(claim.estimatedReimbursement || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `${claim.sitesReady} / ${claim.totalSites}`,
    `${claim.readinessScore}%`,
  ];
  const kpiColors = [C.green, C.brand, claim.readinessScore >= 90 ? C.green : claim.readinessScore >= 60 ? C.amber : C.red];

  const labelRow = summary.getRow(4);
  const valueRow = summary.getRow(5);
  ['A', 'B', 'C'].forEach((col, i) => {
    const lc = summary.getCell(`${col}4`);
    lc.value     = kpiLabels[i];
    lc.font      = { size: 8, color: { argb: C.gray }, bold: true };
    lc.alignment = { horizontal: 'center' };

    const vc = summary.getCell(`${col}5`);
    vc.value     = kpiValues[i];
    vc.font      = { size: 16, bold: true, color: { argb: kpiColors[i] } };
    vc.alignment = { horizontal: 'center', vertical: 'middle' };
    vc.fill      = brandFill(C.lgray);
  });
  labelRow.height = 16;
  valueRow.height = 32;

  summary.addRow([]);  // spacer

  // Meal Breakdown section
  summary.addRow(['Meal Breakdown']).getCell(1).font = { bold: true, size: 12 };
  const mealCols = [
    { label: 'Meal Type',    align: 'left'  },
    { label: 'Meals Served', align: 'right' },
    { label: 'Tier 1 Rate',  align: 'right' },
    { label: 'Tier 2 Rate',  align: 'right' },
  ];
  headerRow(summary, mealCols, summary.lastRow.number + 1);

  stateConfig.allowedMealTypes.forEach((mt, idx) => {
    const counts = claim.items.reduce((sum, item) => {
      const t = item.mealTotals?.[mt] || {};
      return sum + (t.tier1 || 0) + (t.tier2 || 0);
    }, 0);
    const rates  = stateConfig.rates[mt] || {};
    const row    = summary.addRow([
      mt.charAt(0).toUpperCase() + mt.slice(1),
      counts,
      parseFloat(rates.tier1 || 0),
      parseFloat(rates.tier2 || 0),
    ]);
    row.fill = brandFill(idx % 2 === 0 ? C.white : C.lgray);
    row.getCell(2).numFmt = '#,##0';
    row.getCell(3).numFmt = '$#,##0.00';
    row.getCell(4).numFmt = '$#,##0.00';
    row.getCell(2).alignment = { horizontal: 'right' };
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(4).alignment = { horizontal: 'right' };
  });

  // Total row
  const totalRow = summary.addRow(['Total Estimated Reimbursement', '', '', parseFloat(claim.estimatedReimbursement || 0)]);
  totalRow.fill = brandFill(C.purple);
  totalRow.font = { bold: true };
  totalRow.getCell(4).numFmt  = '$#,##0.00';
  totalRow.getCell(4).font    = { bold: true, color: { argb: C.brand } };
  totalRow.getCell(4).alignment = { horizontal: 'right' };

  summary.addRow([]);

  // Site details
  summary.addRow(['Site Details']).getCell(1).font = { bold: true, size: 12 };
  const siteCols2 = [
    { label: 'Site Name',   align: 'left'   },
    { label: 'Meals',       align: 'right'  },
    { label: 'Est. Value',  align: 'right'  },
    { label: 'Status',      align: 'center' },
  ];
  headerRow(summary, siteCols2, summary.lastRow.number + 1);

  claim.items.forEach((item, idx) => {
    const meals  = Object.values(item.mealTotals || {}).reduce((s, t) => s + (t.tier1 || 0) + (t.tier2 || 0), 0);
    const status = item.status === 'ready' ? 'Ready' : item.status === 'needs_review' ? 'Review' : 'Blocked';
    const row    = summary.addRow([item.siteName, meals, parseFloat(item.estimatedReimbursement || 0), status]);
    row.fill = brandFill(idx % 2 === 0 ? C.white : C.lgray);
    row.getCell(2).numFmt    = '#,##0';
    row.getCell(3).numFmt    = '$#,##0.00';
    row.getCell(2).alignment = { horizontal: 'right' };
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(4).alignment = { horizontal: 'center' };
    const statusColor = item.status === 'ready' ? C.green : item.status === 'needs_review' ? C.amber : C.red;
    row.getCell(4).font = { bold: true, color: { argb: statusColor } };
  });

  // ── Sheet 2: Per-Site Detail ─────────────────────────────────────────────────
  const detail = wb.addWorksheet('Per-Site Detail', { views: [{ showGridLines: false }] });
  detail.columns = [
    { width: 28 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 20 },
  ];

  detail.mergeCells('A1:G1');
  const dt = detail.getCell('A1');
  dt.value     = `Per-Site Meal Counts — ${fmtMonth(month)}`;
  dt.font      = { bold: true, size: 13, color: { argb: C.white } };
  dt.fill      = brandFill(C.brand);
  dt.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  detail.getRow(1).height = 28;

  const detailCols = [
    { label: 'Site Name',   align: 'left'  },
    { label: 'Breakfast',   align: 'right' },
    { label: 'Lunch',       align: 'right' },
    { label: 'Snack',       align: 'right' },
    { label: 'Supper',      align: 'right' },
    { label: 'Total Meals', align: 'right' },
    { label: 'Est. Reimbursement', align: 'right' },
  ];
  headerRow(detail, detailCols, 2);

  claim.items.forEach((item, idx) => {
    const mt = item.mealTotals || {};
    const get = (type) => (mt[type]?.tier1 || 0) + (mt[type]?.tier2 || 0);
    const total = get('breakfast') + get('lunch') + get('snack') + get('supper');
    const row   = detail.addRow([
      item.siteName, get('breakfast'), get('lunch'), get('snack'), get('supper'),
      total, parseFloat(item.estimatedReimbursement || 0),
    ]);
    row.fill = brandFill(idx % 2 === 0 ? C.white : C.lgray);
    [2,3,4,5,6].forEach(c => { row.getCell(c).numFmt = '#,##0'; row.getCell(c).alignment = { horizontal: 'right' }; });
    row.getCell(7).numFmt    = '$#,##0.00';
    row.getCell(7).alignment = { horizontal: 'right' };
    row.getCell(7).font      = { color: { argb: C.brand } };
  });

  // Totals row
  const totals = claim.items.reduce((acc, item) => {
    const mt = item.mealTotals || {};
    const get = (t) => (mt[t]?.tier1 || 0) + (mt[t]?.tier2 || 0);
    acc.b += get('breakfast'); acc.l += get('lunch');
    acc.s += get('snack');     acc.su += get('supper');
    acc.total += get('breakfast') + get('lunch') + get('snack') + get('supper');
    acc.est += parseFloat(item.estimatedReimbursement || 0);
    return acc;
  }, { b: 0, l: 0, s: 0, su: 0, total: 0, est: 0 });

  const totRow = detail.addRow(['TOTAL', totals.b, totals.l, totals.s, totals.su, totals.total, totals.est]);
  totRow.font = { bold: true };
  totRow.fill = brandFill(C.purple);
  [2,3,4,5,6].forEach(c => { totRow.getCell(c).numFmt = '#,##0'; totRow.getCell(c).alignment = { horizontal: 'right' }; });
  totRow.getCell(7).numFmt    = '$#,##0.00';
  totRow.getCell(7).alignment = { horizontal: 'right' };
  totRow.getCell(7).font      = { bold: true, color: { argb: C.brand } };

  // Send
  const filename = `CACFP-Claim-${month}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

module.exports = { render };
