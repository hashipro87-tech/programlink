// CoordinatorEnrollmentPage.jsx — Coordinator enrollment work queue
// Shows only children with form_status = 'submitted' across assigned sites.
// Coordinator can verify (→ coordinator_verified) or send back (→ draft + comment).
// Once actioned, the child disappears from this queue.
// Sponsor handles final confirmation on their end.

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, MessageSquare, Users, ChevronDown,
  ChevronRight, RefreshCw, AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  const clean = String(iso).slice(0, 10);
  return new Date(clean + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const AGE_LABELS = {
  infant_0_5:  'Infant (0–5 mo)',
  infant_6_11: 'Infant (6–11 mo)',
  toddler:     'Toddler (1–2 yr)',
  preschool:   'Preschool (3–5 yr)',
  school_age:  'School Age (6–12 yr)',
};

const TIER_META = {
  tier1: { label: 'Tier I',  badge: 'bg-green-100 text-green-700'  },
  tier2: { label: 'Tier II', badge: 'bg-yellow-100 text-yellow-700' },
  tier3: { label: 'Tier III',badge: 'bg-gray-100 text-gray-600'    },
};

// ── Child Row ─────────────────────────────────────────────────────────────────

function ChildRow({ child, onVerify, onSendBack }) {
  const [expanded,  setExpanded]  = useState(false);
  const [comment,   setComment]   = useState('');
  const [showInput, setShowInput] = useState(false); // show comment input for send-back
  const [acting,    setActing]    = useState(null);  // 'verify' | 'sendback' | null

  const age    = AGE_LABELS[child.age_group] ?? child.age_group ?? '—';
  const tier   = TIER_META[child.income_tier] ?? TIER_META.tier1;
  const site   = child.org_name ?? '—';

  const handleVerify = async () => {
    setActing('verify');
    await onVerify(child.id, comment || null);
    setActing(null);
  };

  const handleSendBack = async () => {
    if (!showInput) { setShowInput(true); return; } // first click reveals input
    setActing('sendback');
    await onSendBack(child.id, comment || null);
    setActing(null);
  };

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
        {/* Avatar */}
        <div className="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-brand-600" />
        </div>

        {/* Name + submitted time */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {child.first_name} {child.last_name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Submitted {timeAgo(child.updated_at)}
          </p>
        </div>

        {/* Age */}
        <div className="hidden sm:block w-28 flex-shrink-0">
          <p className="text-xs text-gray-500 font-medium">{age}</p>
        </div>

        {/* Income tier */}
        <div className="hidden sm:block flex-shrink-0">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${tier.badge}`}>
            {tier.label}
          </span>
        </div>

        {/* Site */}
        <div className="hidden md:block w-36 flex-shrink-0">
          <p className="text-xs text-gray-600 truncate font-medium">{site}</p>
        </div>

        {/* Enrollment date */}
        <div className="hidden lg:block w-24 flex-shrink-0">
          <p className="text-xs text-gray-500">{fmtDate(child.enrollment_date)}</p>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => { setExpanded(v => !v); setShowInput(false); }}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold flex-shrink-0"
        >
          {expanded ? 'Less' : 'Review'}
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="mx-5 mb-4 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
          {/* Detail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 px-5 py-4 text-xs">
            {[
              { label: 'Site',             value: site },
              { label: 'Age group',        value: age },
              { label: 'Income tier',      value: tier.label },
              { label: 'Date of birth',    value: fmtDate(child.birthdate) },
              { label: 'Enrollment date',  value: fmtDate(child.enrollment_date) },
              { label: 'Enrollment expires',value: fmtDate(child.enrollment_expires) },
              { label: 'Parent/Guardian',  value: child.parent_name },
              { label: 'Parent phone',     value: child.parent_phone },
              { label: 'Attendance days',  value: child.days_enrolled },
              { label: 'Meals',            value: child.meal_types },
              { label: 'Income cert date', value: fmtDate(child.income_cert_date) },
              { label: 'Signature',        value: child.signature_obtained ? 'Obtained ✓' : 'Not yet' },
            ].map(({ label, value }) => value && (
              <div key={label}>
                <p className="font-semibold text-gray-400 uppercase tracking-wide text-[10px] mb-0.5">{label}</p>
                <p className="text-gray-800 font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* Comment / reason field — shared for both verify note and send-back reason */}
          <div className="px-5 pb-4">
            {(showInput || comment) && (
              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  {showInput ? 'Reason for sending back (required)' : 'Comment (optional)'}
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={2}
                  placeholder={showInput ? 'Tell the site what needs to be corrected…' : 'Add a note for the sponsor (optional)…'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>
            )}

            {/* Toggle comment for verify */}
            {!showInput && !comment && (
              <button
                onClick={() => setComment(' ')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-600 mb-3 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Add a comment
              </button>
            )}
            {!showInput && comment.trim() === '' && comment !== '' && (
              <div className="mb-3" />
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleVerify}
                disabled={acting !== null}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors disabled:opacity-50"
              >
                {acting === 'verify'
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />
                }
                Verify
              </button>
              <button
                onClick={handleSendBack}
                disabled={acting !== null || (showInput && !comment.trim())}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
              >
                {acting === 'sendback'
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-4 h-4" />
                }
                {showInput ? 'Send Back' : 'Send Back ↩'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoordinatorEnrollmentPage() {
  const [children, setChildren] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load only the items in the coordinator's work queue
      const res = await api.get('/children?form_status=submitted&limit=200');
      setChildren(res.data?.children ?? []);
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to load enrollment forms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (childId, comment) => {
    try {
      await api.patch(`/children/${childId}/coordinator-verify`, { comment });
      // Remove from queue — coordinator's job is done
      setChildren(prev => prev.filter(c => c.id !== childId));
    } catch {
      alert('Failed to verify — please try again.');
    }
  };

  const handleSendBack = async (childId, reason) => {
    try {
      await api.patch(`/children/${childId}/coordinator-reject`, { reason });
      // Remove from queue — sent back to site to fix
      setChildren(prev => prev.filter(c => c.id !== childId));
    } catch {
      alert('Failed to send back — please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-100 rounded-2xl px-6 py-10 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={load} className="mt-4 text-sm text-brand-600 hover:underline">Try again</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Review</h1>
          <p className="text-sm text-gray-500 mt-1">
            {children.length > 0
              ? `${children.length} enrollment${children.length !== 1 ? 's' : ''} waiting for your review`
              : 'Your review queue is empty.'}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {children.length === 0 ? (
        /* ── All caught up empty state ── */
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-20 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <p className="text-base font-bold text-gray-900">You're all caught up</p>
          <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
            No enrollment forms are currently waiting for your review. New submissions from sites will appear here.
          </p>
        </div>
      ) : (
        /* ── Work queue ── */
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[2.25rem_1fr_7rem_6rem_9rem_6rem_5rem] gap-4 items-center px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Child</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Age</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tier</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Site</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Enrolled</p>
            <div />
          </div>

          {children.map(child => (
            <ChildRow
              key={child.id}
              child={child}
              onVerify={handleVerify}
              onSendBack={handleSendBack}
            />
          ))}
        </div>
      )}

      {/* Note */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Once you verify an enrollment, the sponsor receives a notification to give final confirmation.
      </p>
    </div>
  );
}
