// CoordinatorKitchensPage.jsx — Kitchens visible to this coordinator.
// Shows all kitchens in the program with their connected sites count,
// compliance status, and meal count activity this month.
// Clicking a kitchen opens a detail panel.

import { useState, useEffect } from 'react';
import {
  UtensilsCrossed, ChevronRight, X, AlertTriangle,
  CheckCircle, Search, Building2,
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import ErrorState from '../../components/common/ErrorState';

// ─── Health dot ───────────────────────────────────────────────────────────────
function HealthDot({ kitchen }) {
  if (kitchen.status === 'suspended') return <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />;
  if ((kitchen.doc_alerts ?? 0) > 0) return <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />;
  if ((kitchen.pending_applications ?? 0) > 0) return <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />;
}

// ─── Kitchen row ──────────────────────────────────────────────────────────────
function KitchenRow({ kitchen, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(kitchen)}
      className={`w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${selected ? 'bg-brand-50' : ''}`}
    >
      <HealthDot kitchen={kitchen} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{kitchen.name}</p>
        <p className="text-xs text-gray-400 truncate">{kitchen.address ?? 'No address on file'}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {(kitchen.doc_alerts ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> {kitchen.doc_alerts}
          </span>
        )}
        <StatusBadge status={kitchen.status} />
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ kitchen, onClose }) {
  const [sites, setSites]     = useState([]);
  const [counts, setCounts]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kitchen) return;
    setLoading(true);
    const month = new Date().toISOString().slice(0, 7);

    Promise.all([
      api.get('/organizations?type=site&limit=100').catch(() => ({ data: { organizations: [] } })),
      api.get(`/meal-counts/summary?month=${month}`).catch(() => ({ data: {} })),
    ]).then(([sitesRes, countsRes]) => {
      const allSites = sitesRes.data?.organizations ?? sitesRes.data ?? [];
      setSites(Array.isArray(allSites) ? allSites : []);
      const rows = countsRes.data?.sites ?? [];
      const row  = rows.find((r) => r.org_id === kitchen.id || r.kitchen_id === kitchen.id);
      setCounts(row ?? null);
    }).finally(() => setLoading(false));
  }, [kitchen]);

  if (!kitchen) return null;

  return (
    <div className="fixed inset-0 z-50 sm:relative sm:inset-auto sm:w-80 sm:flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{kitchen.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{kitchen.address ?? 'No address'}</p>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</p>
        <StatusBadge status={kitchen.status} />
      </div>

      {/* Contact */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact</p>
        <div className="space-y-1.5 text-sm text-gray-600">
          <p>{kitchen.contact_name  ?? '—'}</p>
          <p>{kitchen.contact_email ?? '—'}</p>
          <p>{kitchen.contact_phone ?? '—'}</p>
        </div>
      </div>

      {/* Compliance */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Compliance</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Doc Alerts</p>
            <p className={`text-lg font-bold mt-0.5 ${(kitchen.doc_alerts ?? 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {kitchen.doc_alerts ?? 0}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Pending Apps</p>
            <p className={`text-lg font-bold mt-0.5 ${(kitchen.pending_applications ?? 0) > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
              {kitchen.pending_applications ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Connected sites */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Connected Sites {!loading && `(${sites.length})`}
        </p>
        {loading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : sites.length === 0 ? (
          <p className="text-xs text-gray-400">No sites connected.</p>
        ) : (
          <div className="space-y-2">
            {sites.map((s) => (
              <div key={s.site_id ?? s.id} className="flex items-center gap-2 text-sm">
                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 truncate">{s.site_name ?? s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* This month's counts */}
      <div className="px-5 py-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          This Month's Counts
        </p>
        {loading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : counts ? (
          <div className="space-y-2">
            {[
              { label: 'Days Reported', value: counts.days_reported ?? 0 },
              { label: 'Verified Days', value: counts.verified_days ?? 0 },
              { label: 'Breakfast',     value: counts.breakfast ?? 0 },
              { label: 'Lunch',         value: counts.lunch ?? 0 },
              { label: 'Supper',        value: counts.supper ?? 0 },
              { label: 'Snack',         value: counts.snack ?? 0 },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No counts recorded this month.</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CoordinatorKitchensPage() {
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [selected, setSelected] = useState(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get('/organizations?type=kitchen&limit=100')
      .then(({ data }) => setKitchens(data.organizations ?? data ?? []))
      .catch(() => setError('Failed to load. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_FILTERS = ['all', 'active', 'pending', 'suspended', 'inactive'];

  const filtered = kitchens.filter((k) => {
    const matchSearch = k.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'all' || k.status === filter;
    return matchSearch && matchStatus;
  });

  const activeCount   = kitchens.filter((k) => k.status === 'active').length;
  const docAlertCount = kitchens.filter((k) => (k.doc_alerts ?? 0) > 0).length;
  const pendingCount  = kitchens.filter((k) => (k.pending_applications ?? 0) > 0).length;

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Kitchens</h1>
          <p className="text-gray-500 mt-1">Kitchens operating within your program area.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Active Kitchens</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Doc Alerts</p>
            <p className={`text-2xl font-bold mt-1 ${docAlertCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{docAlertCount}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pending Apps</p>
            <p className={`text-2xl font-bold mt-1 ${pendingCount > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{pendingCount}</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search kitchens…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  filter === f
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {error && <ErrorState message={error} onRetry={() => { setError(''); setLoading(true); api.get('/organizations?type=site&limit=100').then(({data}) => setSites(data.organizations ?? [])).catch(() => setError('Failed to load.')).finally(() => setLoading(false)); }} compact />}

        {/* List */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Loading kitchens…</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <UtensilsCrossed className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No kitchens found.</p>
            </div>
          ) : (
            filtered.map((kitchen) => (
              <KitchenRow
                key={kitchen.id}
                kitchen={kitchen}
                selected={selected?.id === kitchen.id}
                onSelect={(k) => setSelected((prev) => prev?.id === k.id ? null : k)}
              />
            ))
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel kitchen={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
