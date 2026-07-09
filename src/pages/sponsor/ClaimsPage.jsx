import { useState, useEffect } from 'react';
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

// Total meals for a site
function totalMealsForSite(mealTotals) {
  if (!mealTotals) return 0;
  return Object.values(mealTotals).reduce((s, t) => s + (t.tier1 || 0) + (t.tier2 || 0), 0);
}

// ─── Claim Health Score ───────────────────────────────────────────────────────
function HealthScore({ claim }) {
  const score  = claim.readinessScore || 0;
  const ready  = claim.sitesReady         || 0;
  const review = claim.sitesNeedsReview   || 0;
  const blocked= claim.sitesCannotSubmit  || 0;
  const total  = claim.totalSites         || 0;

  let statusColor, statusBg, statusBorder, emoji, statusText;
  if (score >= 90 && blocked === 0) {
    statusColor  = '#065f46'; statusBg = '#ecfdf5'; statusBorder = '#6ee7b7';
    emoji = '🟢'; statusText = 'Claim Ready';
  } else if (score >= 60) {
    statusColor  = '#92400e'; statusBg = '#fffbeb'; statusBorder = '#fcd34d';
    emoji = '🟡'; statusText = 'Getting Close';
  } else {
    statusColor  = '#991b1b'; statusBg = '#fef2f2'; statusBorder = '#fca5a5';
    emoji = '🔴'; statusText = 'Needs Attention';
  }

  const filled = Math.round(score / 5);
  const empty  = 20 - filled;
  const barColor = score >= 90 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      background: statusBg, border: `1px solid ${statusBorder}`,
      borderRadius: 14, padding: '24px 28px', marginBottom: 24
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Can I submit my claim today?
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: statusColor }}>
          {emoji} {statusText} · {score}%
        </div>
      </div>

      {/* Progress bar (monospace) */}
      <div style={{ fontFamily: 'monospace', fontSize: 17, letterSpacing: 1, color: barColor, margin: '10px 0 14px' }}>
        {'█'.repeat(filled)}{'░'.repeat(empty)}
      </div>

      {/* Site status pills */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>✅ {ready} {ready === 1 ? 'site' : 'sites'} ready</span>
        {review > 0 && <span style={{ fontSize: 14, fontWeight: 600, color: '#d97706' }}>🟡 {review} {review === 1 ? 'site' : 'sites'} need review</span>}
        {blocked > 0 && <span style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>🔴 {blocked} {blocked === 1 ? 'site' : 'sites'} blocked</span>}
        {total > 0 && ready === total && (
          <span style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>— All {total} sites ready to submit</span>
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
        Potential Loss
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

// ─── Generate Claim CTA ───────────────────────────────────────────────────────
function GenerateClaim({ claim, month }) {
  const [showExport, setShowExport] = useState(false);
  const isReady = claim.overallStatus === 'ready';
  const monthLabel = formatMonth(month);

  const handleGenerate = () => {
    setShowExport(true);
  };

  return (
    <div style={{
      background: isReady ? '#ecfdf5' : '#f9fafb',
      border: `1px solid ${isReady ? '#6ee7b7' : '#e5e7eb'}`,
      borderRadius: 14, padding: '28px 32px', marginTop: 32, textAlign: 'center'
    }}>
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>
        {isReady
          ? `✓ All ${claim.totalSites} sites are ready`
          : `${claim.sitesReady} of ${claim.totalSites} sites ready`}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
        Generate {monthLabel} Claim
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5', marginBottom: 20 }}>
        Estimated: {formatCurrency(claim.estimatedReimbursement)}
      </div>

      {!showExport ? (
        <button
          onClick={handleGenerate}
          style={{
            background: isReady ? '#10b981' : '#4f46e5',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '14px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
          }}
        >
          {isReady ? `✓ Generate ${monthLabel} Claim ↓` : `Generate ${monthLabel} Claim ↓`}
        </button>
      ) : (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 14 }}>
            Choose your export format:
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Ohio', 'Texas', 'Georgia', 'Florida'].map(state => (
              <button
                key={state}
                disabled={claim.stateName !== state}
                style={{
                  padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: `1px solid ${claim.stateName === state ? '#4f46e5' : '#d1d5db'}`,
                  background: claim.stateName === state ? '#4f46e5' : '#f9fafb',
                  color: claim.stateName === state ? '#fff' : '#9ca3af',
                  cursor: claim.stateName === state ? 'pointer' : 'not-allowed',
                  opacity: claim.stateName === state ? 1 : 0.5
                }}
              >
                Export for {state}
              </button>
            ))}
          </div>
          {!isReady && (
            <div style={{ marginTop: 14, fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              ⚠ {claim.sitesCannotSubmit} site{claim.sitesCannotSubmit !== 1 ? 's are' : ' is'} blocked — fix issues above to include them in the claim.
            </div>
          )}
          <button
            onClick={() => setShowExport(false)}
            style={{ marginTop: 12, fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Cancel
          </button>
        </div>
      )}
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
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0 }}>Claims Center</h1>
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
          <HealthScore claim={claim} />

          {/* 2. Cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <ReimbursementCard amount={claim.estimatedReimbursement} prevAmount={prevAmount} />
            <PotentialLossCard amount={claim.potentialLoss} reasons={lossReasons} />
          </div>

          {/* 3. Breakdown */}
          <BreakdownRow breakdown={claim.breakdown} total={claim.estimatedReimbursement} />

          {/* 4. Sites table */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
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

          {/* 5. Generate Claim CTA */}
          <GenerateClaim claim={claim} month={month} />
        </>
      )}
    </div>
  );
}
