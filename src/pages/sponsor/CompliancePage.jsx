// CompliancePage.jsx — Sponsor compliance dashboard
// Shows per-org compliance scores, expiring/expired documents, and application status.

import { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Shield, AlertTriangle,
  CheckCircle, Clock, Building2, FileText, RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function ScoreBadge({ score, tier }) {
  const styles = {
    compliant: 'bg-green-100 text-green-700',
    at_risk:   'bg-yellow-100 text-yellow-700',
    critical:  'bg-red-100 text-red-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${styles[tier] ?? styles.compliant}`}>
      {score}%
    </span>
  );
}

function TierIcon({ tier, size = 'w-5 h-5' }) {
  if (tier === 'compliant') return <ShieldCheck className={`${size} text-green-500`} />;
  if (tier === 'at_risk')   return <ShieldAlert  className={`${size} text-yellow-500`} />;
  return <Shield className={`${size} text-red-500`} />;
}

function formatExpiry(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((new Date(dateStr) - new Date()) / 86400000);
  if (days < 0)  return { label: `Expired ${Math.abs(days)}d ago`, cls: 'text-red-500' };
  if (days === 0) return { label: 'Expires today', cls: 'text-red-500' };
  return { label: `Next expiry in ${days}d`, cls: days < 14 ? 'text-yellow-600' : 'text-gray-400' };
}

// ── Summary cards ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ── Tier filter tabs ──────────────────────────────────────────────────────────
const TIERS = [
  { value: '',           label: 'All' },
  { value: 'critical',  label: '🔴 Critical' },
  { value: 'at_risk',   label: '🟡 At Risk' },
  { value: 'compliant', label: '🟢 Compliant' },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CompliancePage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState('');
  const [search, setSearch]   = useState('');

  const load = () => {
    setLoading(true);
    api.get('/compliance')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const orgs = (data?.organizations ?? []).filter((o) => {
    if (tierFilter && o.tier !== tierFilter) return false;
    if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const s = data?.summary ?? {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor document status and compliance across all your sites and kitchens.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Total Orgs"
          value={s.total ?? '—'}
          icon={Building2}
          colorClass="bg-blue-50 text-blue-500"
        />
        <SummaryCard
          label="Compliant"
          value={s.compliant ?? '—'}
          icon={ShieldCheck}
          colorClass="bg-green-50 text-green-500"
        />
        <SummaryCard
          label="At Risk"
          value={s.at_risk ?? '—'}
          icon={ShieldAlert}
          colorClass="bg-yellow-50 text-yellow-500"
        />
        <SummaryCard
          label="Critical"
          value={s.critical ?? '—'}
          icon={Shield}
          colorClass="bg-red-50 text-red-500"
        />
      </div>

      {/* Alert banner if expired docs exist */}
      {(s.docs_expired > 0 || s.docs_expiring_soon > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Action required</p>
            <p className="text-xs text-red-600 mt-0.5">
              {s.docs_expired > 0 && `${s.docs_expired} expired document${s.docs_expired !== 1 ? 's' : ''} across your program. `}
              {s.docs_expiring_soon > 0 && `${s.docs_expiring_soon} document${s.docs_expiring_soon !== 1 ? 's' : ''} expiring within 30 days.`}
            </p>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex gap-1">
          {TIERS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTierFilter(t.value)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                tierFilter === t.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Org table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-gray-200" />
          <p className="text-sm">No organizations match this filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {orgs.map((org) => {
              const expiry = formatExpiry(org.next_expiry);
              return (
                <div key={org.id} className="px-5 py-4 flex items-center gap-4">
                  {/* Tier icon */}
                  <TierIcon tier={org.tier} />

                  {/* Org name + type */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{org.name}</p>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                        {org.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {/* App status */}
                      <span className={`text-xs ${
                        org.app_status === 'approved' ? 'text-green-600' :
                        org.app_status === 'rejected' ? 'text-red-500' : 'text-yellow-600'
                      }`}>
                        {org.app_status === 'approved' ? '✓ Approved' :
                         org.app_status === 'rejected' ? '✗ Rejected' :
                         org.app_status ? '⏳ Pending' : '— No application'}
                      </span>

                      {/* Doc counts */}
                      <span className="text-xs text-gray-400">
                        {Number(org.docs_valid ?? 0)} valid
                        {Number(org.docs_expiring ?? 0) > 0 && (
                          <span className="text-yellow-600 font-medium"> · {org.docs_expiring} expiring</span>
                        )}
                        {Number(org.docs_expired ?? 0) > 0 && (
                          <span className="text-red-500 font-medium"> · {org.docs_expired} expired</span>
                        )}
                        {Number(org.docs_rejected ?? 0) > 0 && (
                          <span className="text-red-400 font-medium"> · {org.docs_rejected} rejected</span>
                        )}
                      </span>

                      {/* Next expiry */}
                      {expiry && (
                        <span className={`text-xs font-medium ${expiry.cls}`}>
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {expiry.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <ScoreBadge score={org.score} tier={org.tier} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
