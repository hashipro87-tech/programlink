// CoordinatorSitesPage.jsx — Sites managed by this coordinator
// Shows health indicators, meal count submission status, doc alerts.
// Clicking a site opens a detail panel with full context.

import { useState, useEffect } from 'react';
import {
  Building2, ChevronRight, X, AlertTriangle, CheckCircle,
  Clock, FileText, ClipboardList, Search,
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import ErrorState from '../../components/common/ErrorState';

// ─── Health dot ───────────────────────────────────────────────────────────────
function HealthDot({ site }) {
  if (site.status === 'suspended') return <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" title="Suspended" />;
  if (site.doc_alerts > 0)        return <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" title="Document alert" />;
  if (site.pending_apps > 0)      return <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0" title="Pending application" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" title="Compliant" />;
}

// ─── Site row ─────────────────────────────────────────────────────────────────
function SiteRow({ site, onSelect, selected }) {
  return (
    <button
      onClick={() => onSelect(site)}
      className={`w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${selected ? 'bg-brand-50' : ''}`}
    >
      <HealthDot site={site} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{site.name}</p>
        <p className="text-xs text-gray-400 truncate">{site.address ?? 'No address on file'}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {site.doc_alerts > 0 && (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> {site.doc_alerts} doc
          </span>
        )}
        {site.pending_apps > 0 && (
          <span className="flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> {site.pending_apps} pending
          </span>
        )}
        <StatusBadge status={site.status} />
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ site, onClose }) {
  const [counts, setCounts]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!site) return;
    setLoading(true);
    const month = new Date().toISOString().slice(0, 7);
    api.get(`/meal-counts/summary?month=${month}`)
      .then(({ data }) => {
        const row = (data.sites ?? []).find((s) => s.site_id === site.id || s.org_id === site.id);
        setCounts(row ?? null);
      })
      .catch(() => setCounts(null))
      .finally(() => setLoading(false));
  }, [site]);

  if (!site) return null;

  return (
    <div className="fixed inset-0 z-50 sm:relative sm:inset-auto sm:w-80 sm:flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{site.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{site.address ?? 'No address'}</p>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</p>
        <StatusBadge status={site.status} />
      </div>

      {/* Contact */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact</p>
        <div className="space-y-1.5 text-sm text-gray-600">
          <p>{site.contact_name  ?? '—'}</p>
          <p>{site.contact_email ?? '—'}</p>
          <p>{site.contact_phone ?? '—'}</p>
        </div>
      </div>

      {/* Compliance snapshot */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Compliance</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Doc Alerts',    value: site.doc_alerts   ?? 0, color: site.doc_alerts   > 0 ? 'text-red-600'    : 'text-gray-900' },
            { label: 'Pending Apps',  value: site.pending_apps ?? 0, color: site.pending_apps > 0 ? 'text-yellow-600' : 'text-gray-900' },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* This month's meal counts */}
      <div className="px-5 py-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          This Month's Meal Counts
        </p>
        {loading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : counts ? (
          <div className="space-y-2">
            {[
              { label: 'Days Reported', value: counts.days_reported ?? 0 },
              { label: 'Total Submitted', value: ((counts.breakfast ?? 0) + (counts.lunch ?? 0) + (counts.supper ?? 0) + (counts.snack ?? 0)).toLocaleString() },
              { label: 'Verified',       value: counts.verified_days ?? 0 },
              { label: 'Unverified',     value: (counts.days_reported ?? 0) - (counts.verified_days ?? 0) },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No counts submitted this month.</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CoordinatorSitesPage() {
  const [sites, setSites]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [selected, setSelected] = useState(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get('/organizations?type=site&limit=100')
      .then(({ data }) => setSites(data.organizations ?? []))
      .catch(() => setError('Failed to load. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_FILTERS = ['all', 'active', 'pending', 'suspended', 'inactive'];

  const filtered = sites.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'all' || s.status === filter;
    return matchSearch && matchStatus;
  });

  // Summary counts
  const docAlertCount   = sites.filter((s) => (s.doc_alerts   ?? 0) > 0).length;
  const pendingCount    = sites.filter((s) => (s.pending_apps ?? 0) > 0).length;
  const activeCount     = sites.filter((s) => s.status === 'active').length;

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Sites</h1>
          <p className="text-gray-500 mt-1">Sites assigned to your program area.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Active Sites</p>
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
              placeholder="Search sites…"
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

        {/* Sites list */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Loading sites…</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No sites found.</p>
            </div>
          ) : (
            filtered.map((site) => (
              <SiteRow
                key={site.id}
                site={site}
                selected={selected?.id === site.id}
                onSelect={(s) => setSelected((prev) => prev?.id === s.id ? null : s)}
              />
            ))
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel site={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
