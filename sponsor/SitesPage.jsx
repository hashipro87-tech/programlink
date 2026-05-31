// SitesPage.jsx — Sponsor view of all sites in their program.
// Shows compliance health, document alerts, pending applications, and status.
// Sponsors can search, filter by status, and click a site to see a detail panel.

import { useState, useEffect, useRef } from 'react';
import {
  Building2, Search, CheckCircle, AlertTriangle, Clock,
  XCircle, ChevronRight, X, Phone, MapPin, RefreshCw,
  FileWarning, ClipboardList, UtensilsCrossed, ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Status display config
const STATUS_CONFIG = {
  active:    { label: 'Active',    color: 'text-green-700 bg-green-50 border-green-200' },
  pending:   { label: 'Pending',   color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  suspended: { label: 'Suspended', color: 'text-red-700 bg-red-50 border-red-200' },
  inactive:  { label: 'Inactive',  color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// Compliance health: green / yellow / red derived from doc_alerts + pending_applications
function healthScore(site) {
  if (site.status === 'suspended') return 'red';
  if (site.doc_alerts > 0) return 'red';
  if (site.pending_applications > 0) return 'yellow';
  return 'green';
}

const HEALTH_CONFIG = {
  green:  { icon: ShieldCheck,    color: 'text-green-500',  label: 'Compliant' },
  yellow: { icon: Clock,          color: 'text-yellow-500', label: 'Needs attention' },
  red:    { icon: AlertTriangle,  color: 'text-red-500',    label: 'Action required' },
};

function HealthDot({ site }) {
  const h = healthScore(site);
  const { icon: Icon, color, label } = HEALTH_CONFIG[h];
  return (
    <div className="flex items-center gap-1" title={label}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
  );
}

// ─── Site Detail Panel ────────────────────────────────────────────────────────

function DetailPanel({ site, onClose, onStatusChange }) {
  const [saving, setSaving]   = useState(false);
  const [status, setStatus]   = useState(site.status);
  const [detail, setDetail]   = useState(null); // richer site data
  const [loadingDetail, setLoadingDetail] = useState(true);

  // Fetch full org detail (includes more fields)
  useEffect(() => {
    setLoadingDetail(true);
    api.get(`/organizations/${site.id}`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetail(site))
      .finally(() => setLoadingDetail(false));
  }, [site.id]);

  const handleStatusSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/organizations/${site.id}`, { status });
      onStatusChange(site.id, status);
    } catch {
      alert('Failed to update status — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const org = detail ?? site;
  const h   = healthScore({ ...site, status });

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Site</p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{org.name}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusPill status={status} />
              <span className={`text-xs font-medium ${HEALTH_CONFIG[h].color}`}>
                {HEALTH_CONFIG[h].label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Contact info */}
          <div className="px-6 py-5 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact</p>
            <div className="space-y-2">
              {org.address && (
                <div className="flex items-start gap-2.5 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{org.address}</span>
                </div>
              )}
              {org.phone && (
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{org.phone}</span>
                </div>
              )}
              {org.region && (
                <div className="flex items-center gap-2.5 text-sm text-gray-500">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{org.region}</span>
                </div>
              )}
              {!org.address && !org.phone && !org.region && (
                <p className="text-sm text-gray-400 italic">No contact info on file.</p>
              )}
            </div>
          </div>

          {/* Compliance summary */}
          <div className="px-6 py-5 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Compliance</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <FileWarning className={`w-5 h-5 mx-auto mb-1 ${site.doc_alerts > 0 ? 'text-red-500' : 'text-gray-300'}`} />
                <p className="text-lg font-bold text-gray-900">{site.doc_alerts ?? 0}</p>
                <p className="text-[10px] text-gray-500 font-medium">Doc alerts</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <ClipboardList className={`w-5 h-5 mx-auto mb-1 ${site.pending_applications > 0 ? 'text-yellow-500' : 'text-gray-300'}`} />
                <p className="text-lg font-bold text-gray-900">{site.pending_applications ?? 0}</p>
                <p className="text-[10px] text-gray-500 font-medium">Pending apps</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <UtensilsCrossed className="w-5 h-5 mx-auto mb-1 text-brand-400" />
                <p className="text-lg font-bold text-gray-900">—</p>
                <p className="text-[10px] text-gray-500 font-medium">Meal counts</p>
              </div>
            </div>
          </div>

          {/* Joined */}
          <div className="px-6 py-5 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Program info</p>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Joined</span>
                <span className="font-medium">{fmtDate(org.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className="font-medium capitalize">{org.type ?? 'Site'}</span>
              </div>
            </div>
          </div>

          {/* Status management */}
          <div className="px-6 py-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Manage status</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {['active', 'pending', 'suspended', 'inactive'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${
                    status === s
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={handleStatusSave}
              disabled={saving || status === site.status}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Site Row ─────────────────────────────────────────────────────────────────

function SiteRow({ site, onClick }) {
  const hasDocAlerts = site.doc_alerts > 0;
  const hasPendingApps = site.pending_applications > 0;

  return (
    <button
      onClick={onClick}
      className="w-full px-5 py-4 flex items-center gap-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors text-left group"
    >
      {/* Health indicator */}
      <HealthDot site={site} />

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand-700 transition-colors">
          {site.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {site.address && (
            <p className="text-xs text-gray-400 truncate max-w-[220px]">{site.address}</p>
          )}
          {!site.address && site.region && (
            <p className="text-xs text-gray-400">{site.region}</p>
          )}
        </div>
      </div>

      {/* Alerts */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {hasDocAlerts && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
            <FileWarning className="w-3 h-3" />
            {site.doc_alerts} doc{site.doc_alerts !== 1 ? 's' : ''}
          </span>
        )}
        {hasPendingApps && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-full">
            <ClipboardList className="w-3 h-3" />
            {site.pending_applications} pending
          </span>
        )}
      </div>

      {/* Status pill */}
      <div className="flex-shrink-0">
        <StatusPill status={site.status} />
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-brand-500 transition-colors" />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'active',    label: 'Active' },
  { id: 'pending',   label: 'Pending' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'inactive',  label: 'Inactive' },
];

export default function SitesPage() {
  const [sites,     setSites]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [selected,  setSelected]  = useState(null); // site for detail panel
  const searchRef = useRef(null);

  const fetchSites = () => {
    setLoading(true);
    api.get('/organizations?type=site')
      .then(({ data }) => setSites(Array.isArray(data) ? data : []))
      .catch(() => setSites([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSites(); }, []);

  // Live filter — search + status chip
  const visible = sites.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Summary counts
  const totalActive    = sites.filter((s) => s.status === 'active').length;
  const totalAlerts    = sites.filter((s) => s.doc_alerts > 0).length;
  const totalPending   = sites.filter((s) => s.pending_applications > 0).length;

  // When sponsor changes a site's status in the panel, update local state
  const handleStatusChange = (siteId, newStatus) => {
    setSites((prev) =>
      prev.map((s) => s.id === siteId ? { ...s, status: newStatus } : s)
    );
    setSelected((prev) => prev?.id === siteId ? { ...prev, status: newStatus } : prev);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
        <p className="text-gray-500 mt-1 text-sm">
          All meal sites in your program — monitor compliance, document status, and activity.
        </p>
      </div>

      {/* Summary stat bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active sites',       value: totalActive,  icon: CheckCircle,  color: 'text-green-600' },
          { label: 'Document alerts',    value: totalAlerts,  icon: FileWarning,  color: totalAlerts  > 0 ? 'text-red-600'    : 'text-gray-900' },
          { label: 'Pending approvals',  value: totalPending, icon: ClipboardList, color: totalPending > 0 ? 'text-yellow-600' : 'text-gray-900' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card px-5 py-4 flex items-center gap-4">
            <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
            <div>
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="card mb-4">
        <div className="px-5 py-3 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sites…"
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status chips */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filter === f.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchSites}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Sites list */}
      <div className="card">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading sites…</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              {search ? `No sites matching "${search}"` : 'No sites found.'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Sites appear here once they register and join your program.
            </p>
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div className="px-5 py-2 border-b border-gray-100 hidden sm:flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <div className="w-4 flex-shrink-0" />
              <div className="flex-1">Site name</div>
              <div className="flex-shrink-0 w-40 text-right">Alerts</div>
              <div className="flex-shrink-0 w-20 text-right">Status</div>
              <div className="w-4 flex-shrink-0" />
            </div>

            {visible.map((site) => (
              <SiteRow
                key={site.id}
                site={site}
                onClick={() => setSelected(site)}
              />
            ))}

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400 text-right">
              Showing {visible.length} of {sites.length} site{sites.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          site={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
