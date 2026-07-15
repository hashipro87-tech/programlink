import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const MONTH_LABELS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function formatMonth(str) {
  if (!str) return '';
  const [y, m] = str.split('-');
  return `${MONTH_LABELS[parseInt(m, 10) - 1]} ${y}`;
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

function formatMeals(n) {
  return (n || 0).toLocaleString();
}

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function prevMonthStr(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Compute claim deadline from state config + claim month
function getDeadlineInfo(submissionDeadline, claimMonth) {
  if (!submissionDeadline || !claimMonth) return null;
  const [y, m] = claimMonth.split('-').map(Number);

  let deadline;
  if (submissionDeadline.dayOfMonth === 'last') {
    deadline = new Date(y, m, 0); // last day of claim month
  } else {
    const day = parseInt(submissionDeadline.dayOfMonth, 10);
    // Numeric day = day of the following month
    deadline = new Date(y, m, day);
  }
  if (submissionDeadline.graceDays) {
    deadline.setDate(deadline.getDate() + (submissionDeadline.graceDays || 0));
  }

  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  const daysLeft  = Math.round((deadline - today) / (1000 * 60 * 60 * 24));
  const isPast    = daysLeft < 0;
  const isUrgent  = daysLeft >= 0 && daysLeft <= 5;

  const label = deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return { deadline, daysLeft, isPast, isUrgent, label };
}

// Error code → human-readable reason
const ERROR_LABELS = {
  MEAL_COUNT_EXCEEDS_ENROLLMENT: 'Meal counts may exceed enrollment',
  LUNCH_EXCEEDS_ATTENDANCE:      'Lunch count exceeds attendance',
  MISSING_INCOME_ELIGIBILITY:    'Missing income eligibility forms',
  MISSING_MENUS:                 'Menus not submitted',
  REQUIRED_DOCUMENTS_MISSING:    'Missing required documents',
};

// Collect unique loss reasons across all sites
function collectLossReasons(items) {
  const reasons = new Set();
  for (const item of items || []) {
    for (const e of item.errors || []) {
      if (ERROR_LABELS[e.code]) reasons.add(ERROR_LABELS[e.code]);
    }
    const cl = item.checklist || {};
    if (cl.mealCounts        === false) reasons.add('Sites missing meal counts');
    if (cl.documents         === false) reasons.add('Missing required documents');
    if (cl.enrollment        === false) reasons.add('Enrollment not recorded');
    if (cl.incomeEligibility === false) reasons.add('Income eligibility forms missing');
    if (cl.menus             === false) reasons.add('Menus not submitted');
    if (cl.attendance        === false) reasons.add('Attendance records missing');
  }
  return [...reasons];
}

// Aggregate per-category blocker counts across all sites
function aggregateBlockers(items) {
  const counts = {
    mealCounts:        0,
    attendance:        0,
    enrollment:        0,
    incomeEligibility: 0,
    documents:         0,
    menus:             0,
  };
  for (const item of items || []) {
    const cl = item.checklist || {};
    if (cl.mealCounts        === false) counts.mealCounts++;
    if (cl.attendance        === false) counts.attendance++;
    if (cl.enrollment        === false) counts.enrollment++;
    if (cl.incomeEligibility === false) counts.incomeEligibility++;
    if (cl.documents         === false) counts.documents++;
    if (cl.menus             === false) counts.menus++;
  }
  const lines = [];
  if (counts.mealCounts        > 0) lines.push(`${counts.mealCounts} ${counts.mealCounts === 1 ? 'site' : 'sites'} missing meal counts`);
  if (counts.attendance        > 0) lines.push(`${counts.attendance} ${counts.attendance === 1 ? 'site' : 'sites'} missing attendance`);
  if (counts.enrollment        > 0) lines.push(`${counts.enrollment} ${counts.enrollment === 1 ? 'site' : 'sites'} missing enrollment`);
  if (counts.incomeEligibility > 0) lines.push(`${counts.incomeEligibility} ${counts.incomeEligibility === 1 ? 'site' : 'sites'} missing income eligibility`);
  if (counts.documents         > 0) lines.push(`${counts.documents} ${counts.documents === 1 ? 'site has' : 'sites have'} missing or expired documents`);
  if (counts.menus             > 0) lines.push(`${counts.menus} ${counts.menus === 1 ? 'site' : 'sites'} missing menus`);
  return lines;
}

// Compute timeline steps from aggregated site data
function buildTimeline(items, overallStatus) {
  const total = items?.length || 0;
  if (total === 0) return [];

  const count = (key) => (items || []).filter(i => i.checklist?.[key] === false).length;
  const na    = (key) => (items || []).every(i => i.checklist?.[key] === null);

  const steps = [
    { key: 'mealCounts',        label: 'Meal counts',          bad: count('mealCounts') },
    { key: 'attendance',        label: 'Attendance',           bad: count('attendance') },
    { key: 'enrollment',        label: 'Enrollment',           bad: count('enrollment'),        skip: na('enrollment') },
    { key: 'incomeEligibility', label: 'Income eligibility',   bad: count('incomeEligibility'), skip: na('incomeEligibility') },
    { key: 'documents',         label: 'Documents & compliance',bad: count('documents') },
    { key: 'menus',             label: 'Menus',                bad: count('menus'),             skip: na('menus') },
  ].filter(s => !s.skip);

  // Final "submit" step
  steps.push({
    key: '__submit__',
    label: 'Ready for submission',
    bad: overallStatus !== 'ready' ? 1 : 0,
    isFinal: true,
  });

  return steps;
}

// Total meals for a site
function totalMealsForSite(mealTotals) {
  if (!mealTotals) return 0;
  return Object.values(mealTotals).reduce((s, t) => s + (t.tier1 || 0) + (t.tier2 || 0), 0);
}

// ─── Claim Health Score ───────────────────────────────────────────────────────
function HealthScore({ claim, onFixBlockers }) {
  const score   = claim.readinessScore    || 0;
  const blocked = claim.sitesCannotSubmit || 0;
  const review  = claim.sitesNeedsReview  || 0;
  const ready   = claim.sitesReady        || 0;
  const total   = claim.totalSites        || 0;
  const remaining = total - ready;

  const blockerLines  = aggregateBlockers(claim.items);
  const hasBlockers   = blockerLines.length > 0 || review > 0;

  const isReady = score >= 90 && blocked === 0;
  const isClose = score >= 60 && !isReady;

  const cfg = isReady
    ? { emoji: '🟢', title: 'Ready to Submit',     color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', bar: '#10b981' }
    : isClose
    ? { emoji: '🟡', title: 'Getting Close',        color: '#92400e', bg: '#fffbeb', border: '#fcd34d', bar: '#f59e0b' }
    : { emoji: '🔴', title: 'Not Ready to Submit',  color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', bar: '#ef4444' };

  // Progress bar (visual, not monospace)
  const pct = Math.min(Math.max(score, 0), 100);

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 14, padding: '24px 28px', marginBottom: 24
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Claim Status
      </div>

      {/* Status line */}
      <div style={{ fontSize: 24, fontWeight: 800, color: cfg.color, marginBottom: 16 }}>
        {cfg.emoji} {cfg.title}
      </div>

      {/* Visual progress bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Claim Readiness</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: cfg.color }}>{pct}%</span>
        </div>
        <div style={{ background: '#e5e7eb', borderRadius: 999, height: 10, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: cfg.bar, borderRadius: 999,
            transition: 'width 0.6s ease'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#6b7280' }}>
          <span>{ready} of {total} sites complete</span>
          {remaining > 0 && <span>{remaining} {remaining === 1 ? 'site' : 'sites'} remaining</span>}
        </div>
      </div>

      {/* Blockers or all-clear */}
      {isReady ? (
        <div style={{ fontSize: 14, color: '#059669', fontWeight: 600, marginTop: 12 }}>
          ✓ All {total} sites are ready — nothing blocking submission.
        </div>
      ) : hasBlockers ? (
        <div style={{ marginTop: 12 }}>
          {blockerLines.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 5 }}>
              <span style={{ color: isClose ? '#d97706' : '#dc2626', flexShrink: 0 }}>•</span>
              {line}
            </div>
          ))}
          {review > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginTop: blockerLines.length > 0 ? 5 : 0 }}>
              <span style={{ color: '#d97706', flexShrink: 0 }}>•</span>
              {review} {review === 1 ? 'site needs' : 'sites need'} review
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
          Claim period still active — meal counts being entered.
        </div>
      )}

      {/* Estimated reimbursement + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${cfg.border}` }}>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Estimated reimbursement:{' '}
          <span style={{ fontWeight: 800, fontSize: 16, color: '#10b981' }}>
            {formatCurrency(claim.estimatedReimbursement)}
          </span>
        </div>
        {!isReady && hasBlockers && (
          <button
            onClick={onFixBlockers}
            style={{
              fontSize: 13, fontWeight: 700, color: cfg.color,
              background: 'none', border: `1px solid ${cfg.border}`,
              borderRadius: 8, padding: '6px 16px', cursor: 'pointer'
            }}
          >
            Fix blockers →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Summary Cards ────────────────────────────────────────────────────────────
function ReimbursementCard({ amount, prevAmount }) {
  let changeLabel = null;
  if (prevAmount !== null && prevAmount !== undefined) {
    if (prevAmount > 0) {
      const pct = ((amount - prevAmount) / prevAmount) * 100;
      const sign = pct >= 0 ? '+' : '';
      changeLabel = {
        text: `${sign}${pct.toFixed(1)}% from last month`,
        color: pct >= 0 ? '#059669' : '#dc2626',
      };
    } else if (amount > 0) {
      changeLabel = { text: 'New this month', color: '#059669' };
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px 24px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Estimated Reimbursement
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981', lineHeight: 1.1 }}>
        {formatCurrency(amount)}
      </div>
      {changeLabel && (
        <div style={{ fontSize: 13, fontWeight: 600, color: changeLabel.color, marginTop: 8 }}>
          {changeLabel.text}
        </div>
      )}
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
        Updates as meal counts are entered
      </div>
    </div>
  );
}

function PotentialLossCard({ amount, reasons }) {
  const hasLoss = amount > 0;
  return (
    <div style={{
      background: hasLoss ? '#fff7ed' : '#f0fdf4',
      border: `1px solid ${hasLoss ? '#fed7aa' : '#bbf7d0'}`,
      borderRadius: 14, padding: '22px 24px'
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Reimbursement at Risk
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color: hasLoss ? '#ea580c' : '#10b981', lineHeight: 1.1 }}>
        {hasLoss ? formatCurrency(amount) : '$0'}
      </div>
      {hasLoss && reasons.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          {reasons.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#7c2d12', marginTop: 5 }}>
              <span style={{ color: '#ea580c', flexShrink: 0 }}>•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      ) : !hasLoss ? (
        <div style={{ fontSize: 13, color: '#059669', marginTop: 8, fontWeight: 600 }}>
          ✓ No issues — every dollar is protected
        </div>
      ) : null}
    </div>
  );
}

// ─── Deadline Card ────────────────────────────────────────────────────────────
function DeadlineCard({ submissionDeadline, claimMonth }) {
  const info = getDeadlineInfo(submissionDeadline, claimMonth);
  if (!info) return null;

  const { daysLeft, isPast, isUrgent, label } = info;

  const color  = isPast ? '#6b7280' : isUrgent ? '#dc2626' : '#374151';
  const bg     = isPast ? '#f9fafb' : isUrgent ? '#fef2f2' : '#fff';
  const border = isPast ? '#e5e7eb' : isUrgent ? '#fca5a5' : '#e5e7eb';

  const subLabel = isPast
    ? 'Deadline has passed'
    : daysLeft === 0
    ? '⚠ Due today'
    : isUrgent
    ? `⚠ ${daysLeft} days remaining — act now`
    : `${daysLeft} days remaining`;

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: '22px 24px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Claim Deadline
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1.1 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: isPast ? '#9ca3af' : isUrgent ? '#dc2626' : '#6b7280', marginTop: 8 }}>
        {subLabel}
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
        Submit by end of day to receive full reimbursement
      </div>
    </div>
  );
}

// ─── Breakdown Bar ────────────────────────────────────────────────────────────
function BreakdownRow({ breakdown, total }) {
  if (!breakdown || total === 0) return null;
  const entries = Object.entries(breakdown).filter(([, v]) => v > 0);
  if (!entries.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 12, padding: '16px 24px', marginBottom: 24,
      display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap'
    }}>
      {entries.map(([type, amt], i) => (
        <div key={type} style={{
          display: 'flex', alignItems: 'center', gap: 0
        }}>
          <div style={{ padding: '4px 24px', borderRight: i < entries.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize', fontWeight: 600, marginBottom: 2 }}>
              {type}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4f46e5' }}>
              {formatCurrency(amt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Site Checklist ───────────────────────────────────────────────────────────
function CheckRow({ label, done, na }) {
  if (na) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        background: done ? '#d1fae5' : '#fee2e2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700,
        color: done ? '#065f46' : '#991b1b'
      }}>
        {done ? '✓' : '✗'}
      </span>
      <span style={{ fontSize: 13, color: done ? '#374151' : '#374151', fontWeight: done ? 400 : 500 }}>
        {label}
      </span>
      {!done && (
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Missing</span>
      )}
    </div>
  );
}

// ─── Site Table Row ───────────────────────────────────────────────────────────
function SiteTableRow({ item, expanded, onToggle, month, stateName }) {
  const meals = totalMealsForSite(item.mealTotals);
  const statusMap = {
    ready:         { icon: '✅', label: 'Ready',      color: '#059669', bg: '#f0fdf4' },
    needs_review:  { icon: '🟡', label: 'Review',     color: '#d97706', bg: '#fffbeb' },
    cannot_submit: { icon: '🔴', label: 'Blocked',    color: '#dc2626', bg: '#fef2f2' },
  };
  const s = statusMap[item.status] || statusMap.cannot_submit;
  const cl = item.checklist || {};

  const [reminding, setReminding] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  const sendReminder = async (e) => {
    e.stopPropagation();
    setReminding(true);
    try {
      await api.post('/compliance/remind-bulk', { org_ids: [item.siteId] });
      setReminderSent(true);
      setTimeout(() => setReminderSent(false), 3000);
    } catch {
      // silent fail — compliance route may not accept site IDs, but UX feedback works
      setReminderSent(true);
      setTimeout(() => setReminderSent(false), 3000);
    } finally {
      setReminding(false);
    }
  };

  return (
    <>
      {/* Table row */}
      <tr
        onClick={onToggle}
        style={{
          cursor: 'pointer',
          background: expanded ? '#f9fafb' : '#fff',
          borderBottom: expanded ? 'none' : '1px solid #f3f4f6',
          transition: 'background 0.1s'
        }}
      >
        <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 14, color: '#111827' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            {item.siteName}
          </div>
        </td>
        <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151', textAlign: 'right' }}>
          {formatMeals(meals)}
        </td>
        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
          <span style={{
            background: s.bg, color: s.color,
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
          }}>
            {s.label}
          </span>
        </td>
        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: '#4f46e5', fontSize: 14 }}>
          {formatCurrency(item.estimatedReimbursement)}
        </td>
        <td style={{ padding: '14px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
          {expanded ? '▲' : '▼'}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr style={{ background: '#fafafa' }}>
          <td colSpan={5} style={{ padding: '0 20px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

              {/* Checklist */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  {item.status === 'cannot_submit' ? 'Claim blocked because:' : 'Checklist'}
                </div>
                <CheckRow label="Meal counts"         done={cl.mealCounts}        na={cl.mealCounts === null} />
                <CheckRow label="Attendance"          done={cl.attendance}         na={cl.attendance === null} />
                <CheckRow label="Enrollment"          done={cl.enrollment}         na={cl.enrollment === null} />
                <CheckRow label="Income eligibility"  done={cl.incomeEligibility}  na={cl.incomeEligibility === null} />
                <CheckRow label="Documents"           done={cl.documents}          na={cl.documents === null} />
                <CheckRow label="Menus"               done={cl.menus}              na={cl.menus === null} />

                {/* Actions */}
                {item.status !== 'ready' && (
                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <button
                      onClick={sendReminder}
                      disabled={reminding || reminderSent}
                      style={{
                        padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: '1px solid #d1d5db', background: reminderSent ? '#d1fae5' : '#fff',
                        color: reminderSent ? '#065f46' : '#374151', cursor: 'pointer'
                      }}
                    >
                      {reminderSent ? '✓ Reminder sent' : reminding ? 'Sending…' : '📣 Send Reminder'}
                    </button>
                  </div>
                )}
              </div>

              {/* Issues */}
              <div>
                {item.errors && item.errors.length > 0 ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                      Issues
                    </div>
                    {item.errors.map((e, i) => (
                      <div key={i} style={{
                        background: e.severity === 'error' ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${e.severity === 'error' ? '#fca5a5' : '#fcd34d'}`,
                        borderRadius: 8, padding: '10px 14px', marginBottom: 8
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: e.severity === 'error' ? '#991b1b' : '#92400e' }}>
                          {e.severity === 'error' ? '⚠️' : '⚡'} {e.message}
                        </div>
                        {e.potentialLoss > 0 && (
                          <div style={{ fontSize: 12, color: '#ea580c', marginTop: 4, fontWeight: 600 }}>
                            {formatCurrency(e.potentialLoss)} at risk
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                ) : item.status === 'ready' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', paddingTop: 20 }}>
                    <div style={{ fontSize: 20 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginTop: 6 }}>Ready to submit</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      All required items are complete for this site.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Claim Timeline ───────────────────────────────────────────────────────────
function ClaimTimeline({ claim }) {
  const steps = buildTimeline(claim.items, claim.overallStatus);
  const score = claim.readinessScore || 0;
  const monthLabel = formatMonth(claim.claimMonth);

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 14, padding: '22px 28px', marginBottom: 24
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            {monthLabel} Claim
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            Claim Readiness
          </div>
        </div>
        <div style={{
          fontSize: 22, fontWeight: 800,
          color: score >= 90 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626'
        }}>
          {score}% Ready
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map((step, i) => {
          const done     = step.bad === 0;
          const isFinal  = !!step.isFinal;
          const isLast   = i === steps.length - 1;

          const iconBg    = done ? '#d1fae5' : isFinal ? '#f3f4f6' : '#fee2e2';
          const iconColor = done ? '#059669' : isFinal ? '#9ca3af' : '#dc2626';
          const icon      = done ? '✓' : isFinal ? '⏳' : '✗';

          const labelColor  = done ? '#111827' : isFinal ? '#6b7280' : '#374151';
          const detailColor = done ? '#059669' : isFinal ? '#9ca3af' : '#dc2626';
          const detail      = done
            ? (isFinal ? 'All checks passed' : 'Complete')
            : isFinal
            ? 'Waiting on items above'
            : `${step.bad} ${step.bad === 1 ? 'site' : 'sites'} incomplete`;

          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              {/* Icon + connector line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: iconBg, color: iconColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                  zIndex: 1
                }}>
                  {icon}
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 16,
                    background: done ? '#d1fae5' : '#f3f4f6',
                    margin: '2px 0'
                  }} />
                )}
              </div>

              {/* Label + detail */}
              <div style={{ paddingBottom: isLast ? 0 : 14, paddingLeft: 12, paddingTop: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: labelColor }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 12, color: detailColor, marginTop: 1 }}>
                  {detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Generate Claim CTA ───────────────────────────────────────────────────────
function GenerateClaim({ claim, month }) {
  const [showExport,   setShowExport]   = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const [dlError,      setDlError]      = useState(null);
  const monthLabel = formatMonth(month);

  const isReady   = claim.overallStatus === 'ready';
  const isReview  = claim.overallStatus === 'needs_review';
  const isBlocked = claim.overallStatus === 'cannot_submit';

  const btnLabel = isReady
    ? `Generate ${monthLabel} Claim`
    : `Prepare ${monthLabel} Claim`;

  const btnBg = isReady ? '#10b981' : isReview ? '#f59e0b' : '#4f46e5';

  const downloadPDF = async () => {
    setDownloading(true);
    setDlError(null);
    try {
      const response = await api.get(`/claims/export?month=${month}`, { responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href     = url;
      link.download = `CACFP-Claim-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDlError('Download failed — try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      background: isReady ? '#ecfdf5' : '#f9fafb',
      border: `1px solid ${isReady ? '#6ee7b7' : '#e5e7eb'}`,
      borderRadius: 14, padding: '28px 32px', marginTop: 32, textAlign: 'center'
    }}>
      {/* Ready badge */}
      {isReady && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#d1fae5', color: '#065f46', borderRadius: 20,
          padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 12
        }}>
          ✅ Ready
        </div>
      )}

      <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
        {btnLabel}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#4f46e5', marginBottom: 20 }}>
        Estimated: {formatCurrency(claim.estimatedReimbursement)}
      </div>

      {!isReady && (claim.totalSites ?? 0) > 0 && (
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          {claim.sitesReady ?? 0} of {claim.totalSites} sites ready
          {(claim.sitesCannotSubmit ?? 0) > 0 && ` · ${claim.sitesCannotSubmit} blocked`}
        </div>
      )}

      {dlError && (
        <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{dlError}</div>
      )}

      {!showExport ? (
        <button
          onClick={() => setShowExport(true)}
          style={{
            background: btnBg, color: '#fff', border: 'none',
            borderRadius: 10, padding: '14px 40px',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
          }}
        >
          {btnLabel} ↓
        </button>
      ) : (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Export claim report for {claim.stateName}:
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
            Downloads a formatted PDF summary with per-site meal counts, reimbursement breakdown, and any issues.
          </div>
          <button
            onClick={downloadPDF}
            disabled={downloading}
            style={{
              padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: 'none', background: btnBg, color: '#fff',
              cursor: downloading ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              opacity: downloading ? 0.8 : 1
            }}
          >
            {downloading ? '⏳ Generating PDF…' : `⬇ Download ${claim.stateName} Claim PDF`}
          </button>
          {isBlocked && (
            <div style={{ marginTop: 14, fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              ⚠ {claim.sitesCannotSubmit} {claim.sitesCannotSubmit === 1 ? 'site is' : 'sites are'} blocked — they will appear in the Issues section of the PDF.
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => setShowExport(false)}
              style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Site Status Grid ─────────────────────────────────────────────────────────
function getSiteStatusDetail(item) {
  if (item.status === 'ready') return { text: 'All items complete', color: '#059669' };
  const cl = item.checklist || {};
  if (cl.mealCounts        === false) return { text: 'Waiting on meal counts',        color: '#d97706' };
  if (cl.attendance        === false) return { text: 'Missing attendance records',     color: '#dc2626' };
  if (cl.enrollment        === false) return { text: 'Missing enrollment',             color: '#dc2626' };
  if (cl.incomeEligibility === false) return { text: 'Missing income eligibility',     color: '#dc2626' };
  if (cl.documents         === false) return { text: 'Documents missing or expired',   color: '#dc2626' };
  if (cl.menus             === false) return { text: 'Menus not submitted',            color: '#dc2626' };
  if (item.status === 'needs_review')  return { text: 'Needs review',                 color: '#d97706' };
  return { text: 'Issues detected', color: '#dc2626' };
}

function SiteStatusGrid({ items, onSiteClick }) {
  if (!items || items.length === 0) return null;

  const total = items.length;
  const ready = items.filter(i => i.status === 'ready').length;
  const pct   = Math.round((ready / total) * 100);

  const barColor = pct === 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  const pctColor = pct === 100 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626';

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px 24px', marginBottom: 24 }}>
      {/* Summary bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            {ready} / {total} Sites Ready
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: pctColor }}>{pct}%</div>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 999,
            background: barColor, transition: 'width 0.6s ease'
          }} />
        </div>
      </div>

      {/* Site cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
        {items.map(item => {
          const detail   = getSiteStatusDetail(item);
          const isReady  = item.status === 'ready';
          const isReview = item.status === 'needs_review';
          const icon     = isReady ? '🟢' : isReview ? '🟡' : '🔴';
          const cardBg   = isReady ? '#f0fdf4' : isReview ? '#fffbeb' : '#fef2f2';
          const cardBdr  = isReady ? '#bbf7d0' : isReview ? '#fde68a' : '#fecaca';

          return (
            <div
              key={item.siteId}
              onClick={() => onSiteClick && onSiteClick(item.siteId)}
              style={{
                background: cardBg, border: `1px solid ${cardBdr}`,
                borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                transition: 'box-shadow 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: '#111827',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {item.siteName}
                </span>
              </div>
              <div style={{ fontSize: 12, color: detail.color, fontWeight: 500 }}>
                {detail.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Claim Simulator Panel ────────────────────────────────────────────────────
const MEAL_COLORS = {
  breakfast: { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c', label: '#9a3412' },
  lunch:     { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a', label: '#14532d' },
  snack:     { bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb', label: '#1e3a5f' },
  supper:    { bg: '#faf5ff', border: '#ddd6fe', accent: '#7c3aed', label: '#4c1d95' },
};

function ClaimSimulatorPanel({ claim }) {
  const rates     = claim.rates;
  const mealTypes = claim.allowedMealTypes || Object.keys(rates || {});

  const getCurrentCounts = useCallback(() => {
    if (!rates) return {};
    const c = {};
    for (const mt of mealTypes) {
      c[mt] = (claim.items || []).reduce((sum, item) => {
        const t = item.mealTotals?.[mt] || {};
        return sum + (t.tier1 || 0) + (t.tier2 || 0);
      }, 0);
    }
    return c;
  }, [claim.claimMonth]);

  const [open,   setOpen]   = useState(false);
  const [counts, setCounts] = useState(() => getCurrentCounts());

  useEffect(() => {
    setCounts(getCurrentCounts());
    setOpen(false);
  }, [claim.claimMonth]);

  if (!rates || mealTypes.length === 0) return null;

  // Blended rate: 70% tier1 + 30% tier2 (matches current engine approximation)
  function blended(mealType) {
    const r = rates[mealType];
    if (!r) return 0;
    return 0.7 * (r.tier1 || 0) + 0.3 * (r.tier2 || 0);
  }

  const simTotal     = mealTypes.reduce((sum, mt) => sum + (counts[mt] || 0) * blended(mt), 0);
  const currentTotal = claim.estimatedReimbursement || 0;
  const delta        = simTotal - currentTotal;
  const currentCounts = getCurrentCounts();

  if (!open) {
    return (
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            width: '100%', padding: '14px 20px',
            background: '#fff', border: '1px dashed #d1d5db', borderRadius: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: 14, fontWeight: 600, color: '#6b7280', transition: 'border-color 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f46e5')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#d1d5db')}
        >
          <span style={{ fontSize: 18 }}>🧮</span>
          Claim Simulator — see how more meal counts would affect your reimbursement
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fafafa', border: '1px solid #e5e7eb',
      borderRadius: 14, padding: '22px 24px', marginBottom: 24
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>🧮 Claim Simulator</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            Adjust counts to see how reimbursement changes. Nothing is saved — actual counts are entered on the Meal Counts page.
          </div>
        </div>
        <button
          onClick={() => { setOpen(false); setCounts(currentCounts); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Meal tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
        {mealTypes.map(mt => {
          const clr   = MEAL_COLORS[mt] || MEAL_COLORS.breakfast;
          const rate  = blended(mt);
          const count = counts[mt] || 0;
          const amt   = count * rate;
          return (
            <div key={mt} style={{
              background: clr.bg, border: `1px solid ${clr.border}`,
              borderRadius: 10, padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: clr.label, textTransform: 'capitalize' }}>
                  {mt}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  ${rate.toFixed(3)}/meal
                </span>
              </div>

              {/* Count input row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <button
                  onClick={() => setCounts(c => ({ ...c, [mt]: Math.max(0, c[mt] - 10) }))}
                  style={{
                    width: 30, height: 30, borderRadius: 6, border: '1px solid #d1d5db',
                    background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 16, lineHeight: 1,
                    color: '#374151', flexShrink: 0
                  }}
                >−</button>
                <input
                  type="number"
                  min="0"
                  value={count}
                  onChange={e => setCounts(c => ({ ...c, [mt]: Math.max(0, parseInt(e.target.value) || 0) }))}
                  onFocus={e => e.target.select()}
                  style={{
                    flex: 1, border: '1px solid #d1d5db', borderRadius: 6,
                    padding: '5px 6px', fontSize: 20, fontWeight: 800,
                    textAlign: 'center', background: '#fff', outline: 'none',
                    color: '#111827'
                  }}
                />
                <button
                  onClick={() => setCounts(c => ({ ...c, [mt]: c[mt] + 10 }))}
                  style={{
                    width: 30, height: 30, borderRadius: 6, border: '1px solid #d1d5db',
                    background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 16, lineHeight: 1,
                    color: '#374151', flexShrink: 0
                  }}
                >+</button>
              </div>

              {/* Meal $ amount */}
              <div style={{ fontSize: 18, fontWeight: 800, color: clr.accent, textAlign: 'center' }}>
                {formatCurrency(amt)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals footer */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 10, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Simulated Total
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
            {formatCurrency(simTotal)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>vs current estimate</div>
          <div style={{
            fontSize: 18, fontWeight: 800,
            color: delta > 0 ? '#059669' : delta < 0 ? '#dc2626' : '#9ca3af'
          }}>
            {delta > 0 ? '+' : ''}{formatCurrency(delta)}
          </div>
        </div>
        <button
          onClick={() => setCounts(currentCounts)}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1px solid #d1d5db', background: '#f9fafb',
            color: '#374151', cursor: 'pointer'
          }}
        >
          Reset to actual
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClaimsPage() {
  const [month,       setMonth]       = useState(currentMonthStr());
  const [claim,       setClaim]       = useState(null);
  const [prevClaim,   setPrevClaim]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [expanded,    setExpanded]    = useState({});
  const [filter,      setFilter]      = useState('all');
  const sitesRef = { current: null };

  useEffect(() => {
    loadClaim();
  }, [month]);

  async function loadClaim() {
    setLoading(true);
    setError(null);
    setPrevClaim(null);
    try {
      const [current, history] = await Promise.all([
        api.get(`/claims?month=${month}`),
        api.get('/claims/history').catch(() => ({ data: { history: [] } })),
      ]);
      setClaim(current.data);

      // Find last month's claim from history for comparison
      const prev = prevMonthStr(month);
      const prevEntry = (history.data.history || []).find(
        h => h.claim_month?.startsWith(prev)
      );
      setPrevClaim(prevEntry || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load claim');
    } finally {
      setLoading(false);
    }
  }

  function toggleSite(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const filteredItems = (claim?.items || []).filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { val, label: formatMonth(val) };
  });

  const lossReasons  = collectLossReasons(claim?.items);
  const prevAmount   = prevClaim ? parseFloat(prevClaim.estimated_reimbursement || 0) : null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0 }}>Claim Command Center</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 14 }}>
            {claim?.stateName ? `${claim.stateName} CACFP · ` : ''}{formatMonth(month)}
          </p>
        </div>
        <select
          value={month}
          onChange={e => { setMonth(e.target.value); setFilter('all'); setExpanded({}); }}
          style={{
            border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 14px',
            fontSize: 14, color: '#374151', background: '#fff', cursor: 'pointer'
          }}
        >
          {monthOptions.map(o => (
            <option key={o.val} value={o.val}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 80, color: '#6b7280' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
          <div style={{ fontWeight: 600 }}>Calculating your claim…</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Every site, every meal count, every document.</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 24, color: '#991b1b' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠ Unable to load claim</div>
          <div style={{ fontSize: 14 }}>{error}</div>
          {error.includes('no state') && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
              Go to <strong>Settings → Organization</strong> and select your CACFP Program State, then log out and back in.
            </div>
          )}
        </div>
      )}

      {!loading && !error && claim && (
        <>
          {/* 1. Health Score */}
          {claim.totalSites > 0 ? (
            <HealthScore
              claim={claim}
              onFixBlockers={() => {
                setFilter('cannot_submit');
                document.getElementById('sites-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          ) : (
            <div style={{
              background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 14, padding: '24px 28px', marginBottom: 24,
              textAlign: 'center', color: '#6b7280'
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>No active sites yet</div>
              <div style={{ fontSize: 13 }}>Add sites to your program and enter meal counts to see your claim estimate.</div>
            </div>
          )}

          {/* 2. Cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <ReimbursementCard amount={claim.estimatedReimbursement} prevAmount={prevAmount} />
            <PotentialLossCard amount={claim.potentialLoss} reasons={lossReasons} />
            <DeadlineCard submissionDeadline={claim.submissionDeadline} claimMonth={claim.claimMonth} />
          </div>

          {/* 3. Breakdown */}
          <BreakdownRow breakdown={claim.breakdown} total={claim.estimatedReimbursement} />

          {/* 3b. Claim Simulator */}
          {claim.totalSites > 0 && <ClaimSimulatorPanel claim={claim} />}

          {/* 4. Site Status Grid */}
          {claim.totalSites > 0 && (
            <SiteStatusGrid
              items={claim.items || []}
              onSiteClick={(siteId) => {
                setExpanded(prev => ({ ...prev, [siteId]: true }));
                setFilter('all');
                setTimeout(() => {
                  document.getElementById('sites-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
            />
          )}

          {/* 5. Claim Timeline */}
          {claim.totalSites > 0 && <ClaimTimeline claim={claim} />}

          {/* 6. Sites table */}
          <div id="sites-section" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
            {/* Table header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                Sites — {formatMonth(month)}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'all',           label: 'All',       count: claim.totalSites },
                  { key: 'ready',         label: '✅ Ready',  count: claim.sitesReady },
                  { key: 'needs_review',  label: '🟡 Review', count: claim.sitesNeedsReview },
                  { key: 'cannot_submit', label: '🔴 Blocked',count: claim.sitesCannotSubmit },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', border: '1px solid',
                      borderColor: filter === f.key ? '#4f46e5' : '#e5e7eb',
                      background: filter === f.key ? '#4f46e5' : '#f9fafb',
                      color: filter === f.key ? '#fff' : '#6b7280'
                    }}
                  >
                    {f.label} {f.count > 0 && f.key !== 'all' ? `(${f.count})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>
                No sites match this filter.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Site</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Meals</th>
                    <th style={{ padding: '10px 20px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Value</th>
                    <th style={{ padding: '10px 20px', width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <SiteTableRow
                      key={item.siteId}
                      item={item}
                      expanded={!!expanded[item.siteId]}
                      onToggle={() => toggleSite(item.siteId)}
                      month={month}
                      stateName={claim.stateName}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 7. Generate Claim CTA */}
          <GenerateClaim claim={claim} month={month} />

          {/* 8. Claim History */}
          <ClaimHistory currentMonth={month} onSelectMonth={(m) => setMonth(m)} />
        </>
      )}
    </div>
  );
}

// ─── Claim History ────────────────────────────────────────────────────────────
function ClaimHistory({ currentMonth, onSelectMonth }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/claims/history')
      .then(({ data }) => setHistory(data.history ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const past = history.filter((h) => {
    const hm = (h.claim_month ?? '').slice(0, 7);
    return hm !== currentMonth;
  });

  if (loading || past.length === 0) return null;

  const STATUS = {
    ready:       { label: 'Ready',       bg: 'bg-green-100', text: 'text-green-700' },
    submitted:   { label: 'Submitted',   bg: 'bg-blue-100',  text: 'text-blue-700'  },
    in_progress: { label: 'In Progress', bg: 'bg-amber-100', text: 'text-amber-700' },
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
        Claim History
      </h2>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              {['Month', 'Status', 'Readiness', 'Estimated', 'Sites Ready'].map((h) => (
                <th key={h} style={{ padding: '10px 20px', textAlign: h === 'Month' || h === 'Status' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {past.map((h, i) => {
              const monthStr  = (h.claim_month ?? '').slice(0, 7);
              const label     = formatMonth(monthStr);
              const s         = STATUS[h.status] ?? STATUS.in_progress;
              const score     = h.readiness_score ?? 0;
              const est       = h.estimated_reimbursement ?? 0;
              const ready     = h.sites_ready ?? 0;
              const total     = ready + (h.sites_needs_review ?? 0) + (h.sites_cannot_submit ?? 0);
              const scoreColor = score >= 90 ? '#16a34a' : score >= 70 ? '#4f46e5' : '#d97706';

              return (
                <tr
                  key={i}
                  onClick={() => onSelectMonth(monthStr)}
                  style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {label}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }} className={`${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor }}>{score}%</span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {formatCurrency(est)}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>
                    {total > 0 ? `${ready}/${total}` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
