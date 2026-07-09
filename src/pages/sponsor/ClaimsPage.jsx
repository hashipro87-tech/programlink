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

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ score }) {
  const pct = Math.min(Math.max(score || 0, 0), 100);
  const color = pct >= 90 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  const filled = Math.round(pct / 5);
  const empty  = 20 - filled;
  return (
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 1, color }}>
        {'█'.repeat(filled)}{'░'.repeat(empty)} {pct}%
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    ready:          { bg: '#d1fae5', text: '#065f46', label: '🟢 Ready' },
    needs_review:   { bg: '#fef3c7', text: '#92400e', label: '🟡 Needs Review' },
    cannot_submit:  { bg: '#fee2e2', text: '#991b1b', label: '🔴 Cannot Submit' }
  };
  const s = map[status] || map.needs_review;
  return (
    <span style={{
      background: s.bg, color: s.text,
      padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
    }}>
      {s.label}
    </span>
  );
}

// ─── Checklist Item ───────────────────────────────────────────────────────────
function CheckItem({ label, done, na }) {
  if (na) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: done ? '#065f46' : '#991b1b' }}>
      <span>{done ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Site Row ─────────────────────────────────────────────────────────────────
function SiteRow({ item, expanded, onToggle }) {
  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 10, overflow: 'hidden'
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', cursor: 'pointer',
          background: expanded ? '#f9fafb' : '#fff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={item.status} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>{item.siteName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: 15 }}>
            {formatCurrency(item.estimatedReimbursement)}
          </span>
          <span style={{ color: '#6b7280', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '14px 18px', borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Checklist */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 8 }}>Checklist</div>
              <CheckItem label="Meal Counts"        done={item.checklist?.mealCounts}        na={item.checklist?.mealCounts === null} />
              <CheckItem label="Attendance"         done={item.checklist?.attendance}         na={item.checklist?.attendance === null} />
              <CheckItem label="Enrollment"         done={item.checklist?.enrollment}         na={item.checklist?.enrollment === null} />
              <CheckItem label="Income Eligibility" done={item.checklist?.incomeEligibility}  na={item.checklist?.incomeEligibility === null} />
              <CheckItem label="Documents"          done={item.checklist?.documents}          na={item.checklist?.documents === null} />
              <CheckItem label="Menus"              done={item.checklist?.menus}              na={item.checklist?.menus === null} />
            </div>

            {/* Errors / Warnings */}
            <div>
              {item.errors && item.errors.length > 0 ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 8 }}>Issues</div>
                  {item.errors.map((e, i) => (
                    <div key={i} style={{
                      background: e.severity === 'error' ? '#fee2e2' : '#fef3c7',
                      border: `1px solid ${e.severity === 'error' ? '#fca5a5' : '#fcd34d'}`,
                      borderRadius: 6, padding: '8px 12px', marginBottom: 8, fontSize: 13
                    }}>
                      <div style={{ fontWeight: 600, color: e.severity === 'error' ? '#991b1b' : '#92400e' }}>
                        {e.severity === 'error' ? '⚠ ' : '⚡ '}{e.message}
                      </div>
                      {e.potentialLoss > 0 && (
                        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                          Potential loss: {formatCurrency(e.potentialLoss)}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ color: '#10b981', fontSize: 13, fontWeight: 600, marginTop: 20 }}>
                  ✓ No issues found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClaimsPage() {
  const [month,     setMonth]     = useState(currentMonthStr());
  const [claim,     setClaim]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [expanded,  setExpanded]  = useState({});
  const [filter,    setFilter]    = useState('all');  // all | ready | needs_review | cannot_submit

  useEffect(() => {
    loadClaim();
  }, [month]);

  async function loadClaim() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/claims?month=${month}`);
      setClaim(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load claim');
    } finally {
      setLoading(false);
    }
  }

  function toggleSite(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const filteredItems = claim?.items?.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  }) || [];

  // Month picker: current month and 5 previous
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { val, label: formatMonth(val) };
  });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0 }}>Claims Center</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 14 }}>
            {claim?.stateName ? `${claim.stateName} · ` : ''}{formatMonth(month)}
          </p>
        </div>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
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

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          Calculating claim...
        </div>
      )}

      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5',
          borderRadius: 10, padding: 20, color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      {!loading && !error && claim && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>

            {/* Progress */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>
                Overall Progress
              </div>
              <ProgressBar score={claim.readinessScore} />
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13 }}>
                <span style={{ color: '#10b981' }}>🟢 {claim.sitesReady} Ready</span>
                <span style={{ color: '#f59e0b' }}>🟡 {claim.sitesNeedsReview} Review</span>
                <span style={{ color: '#ef4444' }}>🔴 {claim.sitesCannotSubmit} Blocked</span>
              </div>
            </div>

            {/* Estimated Reimbursement */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>
                Estimated Reimbursement
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>
                {formatCurrency(claim.estimatedReimbursement)}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                for {formatMonth(month)}
              </div>
            </div>

            {/* Potential Loss */}
            <div style={{
              background: claim.potentialLoss > 0 ? '#fff7ed' : '#f0fdf4',
              border: `1px solid ${claim.potentialLoss > 0 ? '#fed7aa' : '#bbf7d0'}`,
              borderRadius: 12, padding: 20
            }}>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>
                Potential Loss
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: claim.potentialLoss > 0 ? '#ea580c' : '#10b981' }}>
                {claim.potentialLoss > 0 ? formatCurrency(claim.potentialLoss) : '$0'}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                {claim.potentialLoss > 0
                  ? 'Fix issues below to recover this amount'
                  : 'No issues found — looking good!'}
              </div>
            </div>
          </div>

          {/* Reimbursement Breakdown */}
          {claim.breakdown && (
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: 20, marginBottom: 28
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 14 }}>
                Reimbursement Breakdown
              </div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {Object.entries(claim.breakdown).map(([type, amt]) => (
                  <div key={type}>
                    <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'capitalize', marginBottom: 2 }}>
                      {type}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>
                      {formatCurrency(amt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Site List */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
              Sites ({claim.totalSites})
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all','ready','needs_review','cannot_submit'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: '1px solid',
                    borderColor: filter === f ? '#4f46e5' : '#d1d5db',
                    background: filter === f ? '#4f46e5' : '#fff',
                    color: filter === f ? '#fff' : '#6b7280'
                  }}
                >
                  {f === 'all' ? 'All' : f === 'ready' ? '🟢 Ready' : f === 'needs_review' ? '🟡 Review' : '🔴 Blocked'}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              No sites match this filter.
            </div>
          ) : (
            filteredItems.map(item => (
              <SiteRow
                key={item.siteId}
                item={item}
                expanded={!!expanded[item.siteId]}
                onToggle={() => toggleSite(item.siteId)}
              />
            ))
          )}

          {/* Submit CTA */}
          {claim.overallStatus === 'ready' && (
            <div style={{
              background: '#ecfdf5', border: '1px solid #6ee7b7',
              borderRadius: 12, padding: 24, marginTop: 24, textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#065f46', marginBottom: 8 }}>
                ✓ All sites ready — {formatCurrency(claim.estimatedReimbursement)} estimated
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                Your {formatMonth(month)} claim is ready to submit to {claim.stateName}.
              </div>
              <button style={{
                background: '#10b981', color: '#fff', border: 'none',
                borderRadius: 8, padding: '12px 32px', fontSize: 15,
                fontWeight: 700, cursor: 'pointer'
              }}>
                Submit Claim to {claim.stateName}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
