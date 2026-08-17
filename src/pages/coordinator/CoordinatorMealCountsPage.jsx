// CoordinatorMealCountsPage.jsx — Meal count verification queue for coordinators.
// Shows pending (unverified) meal counts submitted by sites and kitchens.
// Coordinator can verify counts or flag them for review.
// Slip photos are shown when available so coordinators can cross-check.
//
// GET  /api/meal-counts          — list counts (filtered by coordinator's program)
// PATCH /api/meal-counts/:id/verify — verify a count

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, CheckCircle, AlertTriangle, Camera,
  Calendar, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

// ─── Date helpers ─────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  const clean = String(iso).slice(0, 10);
  const d = new Date(clean + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Month picker ─────────────────────────────────────────────────────────────
function monthStr(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

// ─── Meal count row ───────────────────────────────────────────────────────────
function CountRow({ count, onVerify, verifying }) {
  const [expanded, setExpanded] = useState(false);

  const meals = [
    { label: 'B', value: count.breakfast ?? 0 },
    { label: 'L', value: count.lunch     ?? 0 },
    { label: 'S', value: count.supper    ?? 0 },
    { label: 'Snk', value: count.snack   ?? 0 },
  ];

  const total = meals.reduce((sum, m) => sum + m.value, 0);
  const isVerified = !!count.verified_at;

  return (
    <div className={`border-b border-gray-100 last:border-0 ${isVerified ? 'bg-green-50/30' : ''}`}>
      {/* Main row */}
      <div className="px-6 py-4 flex items-center gap-4">
        {/* Date */}
        <div className="flex-shrink-0 w-24">
          <p className="text-sm font-semibold text-gray-900">{fmtDate(count.date)}</p>
          <p className="text-xs text-gray-400 truncate">{count.site_name ?? count.organization_name ?? count.org_name ?? '—'}</p>
        </div>

        {/* Meal breakdown */}
        <div className="flex gap-3 flex-1">
          {meals.map((m) => (
            <div key={m.label} className="text-center min-w-[36px]">
              <p className="text-[10px] text-gray-400 font-medium">{m.label}</p>
              <p className="text-sm font-bold text-gray-900">{m.value}</p>
            </div>
          ))}
          <div className="text-center min-w-[48px]">
            <p className="text-[10px] text-gray-400 font-medium">Total</p>
            <p className="text-sm font-bold text-gray-900">{total}</p>
          </div>
        </div>

        {/* Status + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {count.image_data && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <Camera className="w-3.5 h-3.5" />
              Slip
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {isVerified ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> Verified
            </span>
          ) : (
            <button
              disabled={verifying === count.id}
              onClick={() => onVerify(count.id)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {verifying === count.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Verify
            </button>
          )}
        </div>
      </div>

      {/* Expanded slip photo */}
      {expanded && count.image_data && (
        <div className="px-6 pb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 inline-block">
            <p className="text-xs text-gray-400 mb-2">Original delivery slip</p>
            <img
              src={count.image_data}
              alt="Delivery slip"
              className="max-w-sm max-h-64 rounded-lg object-contain border border-gray-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CoordinatorMealCountsPage() {
  const [counts, setCounts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [month, setMonth]       = useState(monthStr(0));
  const [filter, setFilter]     = useState('unverified'); // 'all' | 'unverified' | 'verified'

  const fetchCounts = useCallback(() => {
    setLoading(true);
    api.get(`/meal-counts?month=${month}&limit=200`)
      .then(({ data }) => setCounts(data.meal_counts ?? data.counts ?? []))
      .catch(() => setCounts([]))
      .finally(() => setLoading(false));
  }, [month]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleVerify = async (id) => {
    setVerifying(id);
    try {
      await api.patch(`/meal-counts/${id}/verify`);
      setCounts((prev) =>
        prev.map((c) => c.id === id ? { ...c, verified_at: new Date().toISOString() } : c)
      );
    } catch {
      // silently fail — coordinator can retry
    } finally {
      setVerifying(null);
    }
  };

  const filtered = counts.filter((c) => {
    if (filter === 'unverified') return !c.verified_at;
    if (filter === 'verified')   return !!c.verified_at;
    return true;
  });

  const unverifiedCount = counts.filter((c) => !c.verified_at).length;
  const verifiedCount   = counts.filter((c) => !!c.verified_at).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meal Count Verification</h1>
        <p className="text-gray-500 mt-1">Review and verify meal counts submitted by sites and kitchens.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Submitted</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{counts.length}</p>
        </div>
        <div className={`border rounded-2xl p-4 ${unverifiedCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Needs Verification</p>
          <p className={`text-2xl font-bold mt-1 ${unverifiedCount > 0 ? 'text-yellow-700' : 'text-gray-900'}`}>{unverifiedCount}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Verified</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{verifiedCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Month picker */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-sm text-gray-700 focus:outline-none"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5">
          {[
            { key: 'unverified', label: `Pending (${unverifiedCount})` },
            { key: 'verified',   label: `Verified (${verifiedCount})` },
            { key: 'all',        label: 'All' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchCounts}
          className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* All-clear banner */}
      {!loading && unverifiedCount === 0 && counts.length > 0 && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-800">All counts verified — you're up to date for {month}.</p>
        </div>
      )}

      {/* Pending warning banner */}
      {!loading && unverifiedCount > 0 && filter !== 'verified' && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-yellow-800">
            {unverifiedCount} count{unverifiedCount > 1 ? 's' : ''} still need your verification.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Column headers */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-[6rem_1fr_auto] gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Date / Site</p>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Meal Breakdown</p>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading counts…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {filter === 'unverified' ? 'No pending counts — all verified.' : 'No counts found for this period.'}
            </p>
          </div>
        ) : (
          filtered.map((count) => (
            <CountRow
              key={count.id}
              count={count}
              onVerify={handleVerify}
              verifying={verifying}
            />
          ))
        )}
      </div>
    </div>
  );
}
