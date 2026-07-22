// SiteIncomePage.jsx — Income eligibility certification management for site staff
// CACFP requires annual income certification for every enrolled child.
// Sites use this page to record cert dates, expiry, and income tiers.

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Search, RefreshCw } from 'lucide-react';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_OPTIONS = [
  { value: 'tier1', label: 'Tier I — Free (≤130% FPL)'  },
  { value: 'tier2', label: 'Tier II — Paid (>130% FPL)' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function certStatus(child) {
  if (!child.income_cert_date) return 'missing';
  const expires = child.income_cert_expires;
  if (!expires) return 'valid';
  const daysLeft = Math.ceil((new Date(expires) - new Date()) / 86400000);
  if (daysLeft < 0)  return 'expired';
  if (daysLeft <= 30) return 'expiring';
  return 'valid';
}

function daysUntilExpiry(child) {
  if (!child.income_cert_expires) return null;
  return Math.ceil((new Date(child.income_cert_expires) - new Date()) / 86400000);
}

const STATUS_META = {
  valid:    { label: 'Certified',     dot: 'bg-green-500', text: 'text-green-700', badge: 'bg-green-50 text-green-700 border-green-100'   },
  expiring: { label: 'Expiring Soon', dot: 'bg-amber-400', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-100'   },
  expired:  { label: 'Expired',       dot: 'bg-red-500',   text: 'text-red-600',   badge: 'bg-red-50 text-red-700 border-red-100'         },
  missing:  { label: 'Not Certified', dot: 'bg-gray-300',  text: 'text-gray-500',  badge: 'bg-gray-50 text-gray-600 border-gray-200'      },
};

const AGE_LABELS = {
  infant_0_5:  'Infant (0–5m)',
  infant_6_11: 'Infant (6–11m)',
  toddler:     'Toddler',
  preschool:   'Preschool',
  school_age:  'School Age',
};

function today12() { return new Date().toISOString().split('T')[0]; }
function oneYearFrom(d) {
  const dt = new Date(d);
  dt.setFullYear(dt.getFullYear() + 1);
  dt.setDate(dt.getDate() - 1);
  return dt.toISOString().split('T')[0];
}

// ─── Child Card ───────────────────────────────────────────────────────────────

function ChildCertCard({ child, onSaved }) {
  const status     = certStatus(child);
  const meta       = STATUS_META[status];
  const daysLeft   = daysUntilExpiry(child);
  const [open,     setOpen]    = useState(false);
  const [saving,   setSaving]  = useState(false);
  const [err,      setErr]     = useState(null);
  const [form, setForm] = useState({
    income_cert_date:    child.income_cert_date    ? child.income_cert_date.split('T')[0]    : '',
    income_cert_expires: child.income_cert_expires ? child.income_cert_expires.split('T')[0] : '',
    income_tier:         child.income_tier || 'tier1',
  });

  function handleCertDate(d) {
    setForm(f => ({ ...f, income_cert_date: d, income_cert_expires: d ? oneYearFrom(d) : '' }));
  }

  async function handleSave() {
    if (!form.income_cert_date) { setErr('Certification date is required'); return; }
    setErr(null);
    setSaving(true);
    try {
      await api.put(`/children/${child.id}`, {
        income_cert_date:    form.income_cert_date,
        income_cert_expires: form.income_cert_expires || null,
        income_tier:         form.income_tier,
      });
      onSaved({ ...child, ...form });
      setOpen(false);
    } catch {
      setErr('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-xl border bg-white mb-2 overflow-hidden transition-all ${
      status === 'expired' ? 'border-red-100' : status === 'expiring' ? 'border-amber-100' : 'border-gray-100'
    }`}>
      {/* Row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {child.first_name} {child.last_name}
          </p>
          <p className="text-xs text-gray-400">
            {AGE_LABELS[child.age_group] || child.age_group || 'Unknown age'}
            {child.income_cert_date && (
              <span className="ml-2">
                · Cert: {new Date(child.income_cert_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {status === 'expiring' && daysLeft !== null && (
            <span className="text-xs font-semibold text-amber-600">{daysLeft}d left</span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}>
            {meta.label}
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </div>
      </div>

      {/* Inline cert form */}
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 mt-3 mb-3">
            CACFP income certification is required annually. Setting the certification date auto-fills a 12-month expiry.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Certification Date *</label>
              <input
                type="date"
                value={form.income_cert_date}
                onChange={e => handleCertDate(e.target.value)}
                max={today12()}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-300 focus:border-brand-400 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date</label>
              <input
                type="date"
                value={form.income_cert_expires}
                onChange={e => setForm(f => ({ ...f, income_cert_expires: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-300 focus:border-brand-400 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Income Tier</label>
              <select
                value={form.income_tier}
                onChange={e => setForm(f => ({ ...f, income_tier: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-300 focus:border-brand-400 outline-none bg-white"
              >
                {TIER_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {err && <p className="text-xs text-red-500 mb-2">{err}</p>}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Certification'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            {form.income_cert_date && (
              <button
                onClick={() => handleCertDate(today12())}
                className="ml-auto flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Recertify today
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SiteIncomePage() {
  const [children, setChildren] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');  // all | missing | expiring | expired | valid

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/children?limit=200');
      setChildren(data.children ?? []);
    } catch {
      setError('Could not load children. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSaved(updated) {
    setChildren(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
  }

  // Summary counts
  const counts = useMemo(() => {
    const result = { valid: 0, expiring: 0, expired: 0, missing: 0 };
    for (const c of children) result[certStatus(c)]++;
    return result;
  }, [children]);

  // Filtered + searched list
  const visible = useMemo(() => {
    let list = children;
    if (filter !== 'all') list = list.filter(c => certStatus(c) === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
      );
    }
    // Sort: missing > expired > expiring > valid
    const ORDER = { missing: 0, expired: 1, expiring: 2, valid: 3 };
    return [...list].sort((a, b) => ORDER[certStatus(a)] - ORDER[certStatus(b)]);
  }, [children, filter, search]);

  const totalChildren  = children.length;
  const certifiedCount = counts.valid + counts.expiring;
  const needsAction    = counts.missing + counts.expired;

  const FILTER_TABS = [
    { key: 'all',      label: 'All',          count: totalChildren   },
    { key: 'missing',  label: 'Not Certified', count: counts.missing  },
    { key: 'expired',  label: 'Expired',       count: counts.expired  },
    { key: 'expiring', label: 'Expiring Soon', count: counts.expiring },
    { key: 'valid',    label: 'Certified',     count: counts.valid    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card px-5 py-8 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-3">{error}</p>
        <button onClick={load} className="text-xs font-bold text-brand-600 hover:underline">Try Again</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Income Eligibility</h1>
        <p className="text-gray-500 mt-1 text-sm">
          CACFP requires annual income certification for every enrolled child. Keep these current to protect your program's reimbursement.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card px-4 py-3 text-center">
          <p className="text-2xl font-bold text-green-600">{certifiedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Certified</p>
        </div>
        <div className={`card px-4 py-3 text-center ${needsAction > 0 ? 'border-red-100 bg-red-50' : ''}`}>
          <p className={`text-2xl font-bold ${needsAction > 0 ? 'text-red-600' : 'text-gray-400'}`}>{needsAction}</p>
          <p className="text-xs text-gray-500 mt-0.5">Need Action</p>
        </div>
        <div className={`card px-4 py-3 text-center ${counts.expiring > 0 ? 'border-amber-100 bg-amber-50' : ''}`}>
          <p className={`text-2xl font-bold ${counts.expiring > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{counts.expiring}</p>
          <p className="text-xs text-gray-500 mt-0.5">Expiring Soon</p>
        </div>
        <div className="card px-4 py-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{totalChildren}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Children</p>
        </div>
      </div>

      {/* Claim impact callout */}
      {needsAction > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {needsAction} child{needsAction !== 1 ? 'ren' : ''} missing income certification
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Missing certifications can put your CACFP reimbursement at risk. Certify all children before the end of the month.
            </p>
          </div>
        </div>
      )}

      {totalChildren === 0 ? (
        <div className="card px-5 py-12 text-center">
          <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500 mb-1">No children found</p>
          <p className="text-xs text-gray-400">Add children in the Enrollment section first.</p>
        </div>
      ) : (
        <>
          {/* Filter tabs + search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex gap-1 flex-wrap">
              {FILTER_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filter === t.key
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`ml-1.5 ${filter === t.key ? 'text-brand-200' : 'text-gray-400'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search children…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-52 focus:ring-2 focus:ring-brand-300 focus:border-brand-400 outline-none"
              />
            </div>
          </div>

          {/* Children list */}
          {visible.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">
              No children match this filter.
            </div>
          ) : (
            <div>
              {visible.map(child => (
                <ChildCertCard key={child.id} child={child} onSaved={handleSaved} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
