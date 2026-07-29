// CoordinatorEnrollmentPage.jsx — Coordinator enrollment form review
// Lists children with form_status = 'submitted' across all assigned sites.
// Coordinator can Approve or Reject each form inline.

import { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const STATUS_META = {
  approved:      { label: 'Approved',       badge: 'bg-green-100 text-green-700'  },
  rejected:      { label: 'Rejected',       badge: 'bg-red-100 text-red-700'      },
  submitted:     { label: 'Awaiting Review',badge: 'bg-blue-100 text-blue-700'    },
  draft:         { label: 'Draft',          badge: 'bg-gray-100 text-gray-600'    },
};

const AGE_LABELS = {
  infant:      'Infant (0–11 mo)',
  toddler:     'Toddler (1–2 yr)',
  preschool:   'Preschool (3–5 yr)',
  school_age:  'School Age (6–12 yr)',
};

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

export default function CoordinatorEnrollmentPage() {
  const [children, setChildren]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [actionState, setActionState] = useState({}); // { [childId]: 'loading'|'approved'|'rejected' }
  const [rejectionNotes, setRejectionNotes] = useState({}); // { [childId]: string }
  const [expanded, setExpanded]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/children?form_status=submitted&limit=200');
      setChildren(res.data?.children ?? res.data ?? []);
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to load enrollment forms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (childId, status) => {
    setActionState((s) => ({ ...s, [childId]: 'loading' }));
    try {
      const notes = rejectionNotes[childId] ?? '';
      await api.post(`/children/${childId}/review`, { status, notes });
      setActionState((s) => ({ ...s, [childId]: status }));
      // Update local list
      setChildren((prev) =>
        prev.map((c) => c.id === childId ? { ...c, form_status: status } : c)
      );
    } catch (e) {
      setActionState((s) => ({ ...s, [childId]: null }));
    }
  };

  const pending   = children.filter((c) => c.form_status === 'submitted');
  const processed = children.filter((c) => c.form_status !== 'submitted');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card px-6 py-10 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={load} className="mt-4 text-sm text-brand-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Review</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pending.length > 0
              ? `${pending.length} form${pending.length !== 1 ? 's' : ''} awaiting your review`
              : 'No pending enrollment forms — all caught up.'}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Awaiting Review', value: pending.length,   color: 'text-blue-600',  bg: 'bg-blue-50',  icon: Clock        },
          { label: 'Approved',        value: children.filter((c) => c.form_status === 'approved').length,  color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle  },
          { label: 'Rejected',        value: children.filter((c) => c.form_status === 'rejected').length,  color: 'text-red-600',   bg: 'bg-red-50',   icon: XCircle      },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`card px-5 py-4 flex items-center gap-3 ${bg}`}>
            <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending forms */}
      {pending.length > 0 && (
        <div className="card mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Awaiting Review</h2>
            <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {pending.length}
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {pending.map((child) => {
              const state    = actionState[child.id];
              const isExpanded = expanded === child.id;
              const age      = AGE_LABELS[child.age_group] ?? child.age_group ?? '—';
              const site     = child.organization_name ?? child.org_name ?? 'Unknown site';

              return (
                <div key={child.id} className="px-5 py-4">
                  {/* Child header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Users className="w-4 h-4 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {child.first_name} {child.last_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {age} · {site}
                        </p>
                        {child.updated_at && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Submitted {timeAgo(child.updated_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : child.id)}
                      className="text-xs text-brand-600 hover:underline font-semibold flex-shrink-0"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mb-3 bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-600 space-y-1.5">
                      {child.birthdate && (
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-500 w-28">Date of birth</span>
                          <span>{new Date(child.birthdate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {child.parent_guardian && (
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-500 w-28">Parent/Guardian</span>
                          <span>{child.parent_guardian}</span>
                        </div>
                      )}
                      {child.parent_phone && (
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-500 w-28">Phone</span>
                          <span>{child.parent_phone}</span>
                        </div>
                      )}
                      {child.income_tier && (
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-500 w-28">Income tier</span>
                          <span>{child.income_tier}</span>
                        </div>
                      )}
                      {child.income_cert_date && (
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-500 w-28">Income cert date</span>
                          <span>{new Date(child.income_cert_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {child.attendance_days && (
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-500 w-28">Attendance days</span>
                          <span>{child.attendance_days}</span>
                        </div>
                      )}
                      {child.meal_types && (
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-500 w-28">Meals</span>
                          <span>{child.meal_types}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons or result */}
                  {state === 'approved' ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Approved
                    </div>
                  ) : state === 'rejected' ? (
                    <div className="flex items-center gap-2 text-sm text-red-500 font-semibold">
                      <XCircle className="w-4 h-4" />
                      Rejected
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Optional rejection note */}
                      {isExpanded && (
                        <input
                          type="text"
                          placeholder="Rejection reason (optional)"
                          value={rejectionNotes[child.id] ?? ''}
                          onChange={(e) =>
                            setRejectionNotes((n) => ({ ...n, [child.id]: e.target.value }))
                          }
                          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                        />
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(child.id, 'approved')}
                          disabled={state === 'loading'}
                          className="flex-1 py-2 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {state === 'loading' ? '…' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(child.id, 'rejected')}
                          disabled={state === 'loading'}
                          className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty pending state */}
      {pending.length === 0 && (
        <div className="card px-6 py-16 text-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-4" />
          <p className="text-sm text-gray-700 font-semibold">All enrollment forms reviewed</p>
          <p className="text-xs text-gray-400 mt-1">
            New forms submitted by sites will appear here.
          </p>
        </div>
      )}

      {/* Recently processed */}
      {processed.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recently Processed</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {processed.slice(0, 10).map((child) => {
              const meta = STATUS_META[child.form_status] ?? STATUS_META.draft;
              return (
                <div key={child.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {child.first_name} {child.last_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {child.organization_name ?? child.org_name ?? '—'}
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
