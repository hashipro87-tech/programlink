// MealCountsPage.jsx — Sponsor view of all meal count submissions.
// Shows per-meal-type counts, scanned slip photo, verification status.
// Sponsors can click a slip photo to view it full-size, and verify counts in one click.

import { useState, useEffect } from 'react';
import {
  UtensilsCrossed, CheckCircle, Clock, Camera,
  ZoomIn, X, AlertTriangle, Filter, RefreshCw,
  PenLine, Eye, Plus, Minus,
} from 'lucide-react';
import api from '../../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MealPill({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value ?? '—'}</p>
    </div>
  );
}

// ─── Slip Photo Thumbnail ─────────────────────────────────────────────────────

function SlipPhoto({ imageData, onExpand }) {
  if (!imageData) return (
    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
      <Camera className="w-4 h-4 text-gray-300" />
    </div>
  );

  return (
    <button
      onClick={onExpand}
      className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 group hover:shadow-md transition-shadow"
      title="View delivery slip"
    >
      <img src={imageData} alt="Delivery slip" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <ZoomIn className="w-4 h-4 text-white" />
      </div>
    </button>
  );
}

// ─── Image Lightbox ───────────────────────────────────────────────────────────

function Lightbox({ entry, onClose }) {
  if (!entry) return null;
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">Delivery Slip — {fmtDate(entry.date)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{entry.site_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slip image */}
        <div className="p-4 bg-gray-50">
          <img
            src={entry.scan_image_data}
            alt="Delivery slip"
            className="w-full rounded-xl shadow"
          />
        </div>

        {/* Counts extracted */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Counts extracted by OCR
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Breakfast', value: entry.breakfast_count },
              { label: 'Lunch',     value: entry.lunch_count },
              { label: 'Supper',    value: entry.supper_count },
              { label: 'Snack',     value: entry.snack_count },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                <p className="text-xl font-bold text-gray-900">{m.value ?? '—'}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Total submitted: <span className="font-semibold text-gray-600">{entry.count_submitted}</span> meals
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Single Row ───────────────────────────────────────────────────────────────

function CountRow({ entry, onExpand, onVerify, verifying }) {
  const isVerified   = entry.count_verified != null;
  const wasScanned   = entry.scanned_by_ai;
  const hasPhoto     = !!entry.scan_image_data;

  return (
    <div className={`px-5 py-4 flex flex-wrap sm:flex-nowrap items-center gap-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${
      isVerified ? '' : 'bg-white'
    }`}>

      {/* Slip photo */}
      <SlipPhoto imageData={entry.scan_image_data} onExpand={() => onExpand(entry)} />

      {/* Site + date */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{entry.site_name ?? '—'}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-xs text-gray-500">{fmtDate(entry.date)}</p>
          {wasScanned && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">
              <Camera className="w-2.5 h-2.5" /> OCR scanned
            </span>
          )}
          {entry.submitted_by_name && (
            <span className="text-[10px] text-gray-400">by {entry.submitted_by_name}</span>
          )}
        </div>
      </div>

      {/* Meal type breakdown */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <MealPill label="BK"  value={entry.breakfast_count} />
        <MealPill label="LN"  value={entry.lunch_count} />
        <MealPill label="SP"  value={entry.supper_count} />
        <MealPill label="SNK" value={entry.snack_count} />
        <div className="w-px h-8 bg-gray-100" />
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-sm font-bold text-gray-900">{entry.count_submitted ?? '—'}</p>
        </div>
      </div>

      {/* Verify button / verified badge */}
      <div className="flex-shrink-0">
        {isVerified ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            Verified
            {entry.count_verified !== entry.count_submitted && (
              <span className="text-[10px] text-green-500 font-normal ml-1">
                (adjusted to {entry.count_verified})
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={() => onVerify(entry)}
            disabled={verifying}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Meal Entry Form (self-managed sites) ────────────────────────────────────

const MEAL_ROWS = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🥣', color: 'bg-orange-50 border-orange-200' },
  { key: 'lunch',     label: 'Lunch',     emoji: '🥗', color: 'bg-green-50 border-green-200'  },
  { key: 'snack',     label: 'Snack',     emoji: '🍎', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'supper',    label: 'Supper',    emoji: '🍽️', color: 'bg-purple-50 border-purple-200' },
];

function MealEntryPanel({ site, onSaved }) {
  const today = new Date().toISOString().split('T')[0];
  const [date,    setDate]    = useState(today);
  const [counts,  setCounts]  = useState({ breakfast: 0, lunch: 0, snack: 0, supper: 0 });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  const adjust = (meal, delta) =>
    setCounts(c => ({ ...c, [meal]: Math.max(0, (c[meal] || 0) + delta) }));

  const total = Object.values(counts).reduce((s, v) => s + (v || 0), 0);

  const handleSave = async () => {
    if (!date) { setError('Please select a date.'); return; }
    if (total === 0) { setError('Please enter at least one meal count.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/meal-counts', {
        site_id:          site.id,
        date,
        breakfast_count:  counts.breakfast,
        lunch_count:      counts.lunch,
        snack_count:      counts.snack,
        supper_count:     counts.supper,
        count_submitted:  total,
      });
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <PenLine className="w-4 h-4 text-brand-600" />
        <p className="text-sm font-bold text-gray-700">Enter Meal Counts — {site.name}</p>
        <span className="ml-auto text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-semibold">Self-Managed</span>
      </div>

      {/* Date picker */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Date</label>
        <input
          type="date"
          value={date}
          max={today}
          onChange={e => { setDate(e.target.value); setSaved(false); }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Meal count grid */}
      <div className="mb-5 space-y-3">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Meal Counts</label>
        {MEAL_ROWS.map(({ key, label, emoji, color }) => (
          <div key={key} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${color}`}>
            <span className="text-lg">{emoji}</span>
            <span className="text-sm font-semibold text-gray-700 w-20">{label}</span>
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={() => adjust(key, -1)}
                className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={counts[key] === 0 ? '0' : String(counts[key])}
                onChange={e => {
                  const n = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                  setCounts(c => ({ ...c, [key]: n }));
                }}
                className="w-16 text-center text-lg font-bold text-gray-900 border border-gray-200 rounded-xl py-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={() => adjust(key, 1)}
                className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total row */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 mb-5">
        <span className="text-sm font-bold text-gray-700">Total Meals</span>
        <span className="text-2xl font-bold text-brand-600">{total}</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-xl border border-green-100">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 font-semibold">Meal counts saved for {date}.</p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || total === 0}
        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors disabled:opacity-40 text-sm"
      >
        {saving ? 'Saving…' : `Save ${total > 0 ? total + ' Meals' : 'Counts'}`}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MealCountsPage() {
  const [sites,      setSites]      = useState([]);
  const [siteId,     setSiteId]     = useState('all'); // 'all' | org uuid
  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lightbox,   setLightbox]   = useState(null);
  const [verifying,  setVerifying]  = useState({});
  const [filter,     setFilter]     = useState('all');

  const today = new Date();
  const [month, setMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  );

  // Load sites once
  useEffect(() => {
    api.get('/organizations?type=site&limit=200')
      .then(({ data }) => setSites(data.organizations ?? []))
      .catch(() => {});
  }, []);

  // Selected site object — null when 'all'
  const selectedSite = sites.find(s => s.id === siteId) ?? null;

  // A site is self-managed when it has NO connected site users
  const isEntryMode = selectedSite && !selectedSite.has_site_users;

  const fetchEntries = () => {
    setLoading(true);
    const start = `${month}-01`;
    const end   = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                    .toISOString().split('T')[0];
    const siteParam = siteId !== 'all' ? `&site_id=${siteId}` : '';
    api.get(`/meal-counts?start_date=${start}&end_date=${end}${siteParam}`)
      .then(({ data }) => setEntries(data.meal_counts ?? (Array.isArray(data) ? data : [])))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); }, [month, siteId]);

  const handleVerify = async (entry) => {
    setVerifying((v) => ({ ...v, [entry.id]: true }));
    try {
      await api.patch(`/meal-counts/${entry.id}/verify`, { count_verified: entry.count_submitted });
      setEntries((prev) =>
        prev.map((e) => e.id === entry.id ? { ...e, count_verified: entry.count_submitted } : e)
      );
    } catch {
      alert('Failed to verify — please try again.');
    } finally {
      setVerifying((v) => ({ ...v, [entry.id]: false }));
    }
  };

  const total      = entries.length;
  const unverified = entries.filter((e) => e.count_verified == null).length;
  const scanned    = entries.filter((e) => e.scanned_by_ai).length;

  const visible = entries.filter((e) => {
    if (filter === 'unverified') return e.count_verified == null;
    if (filter === 'scanned')    return e.scanned_by_ai;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Meal Counts</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Enter counts for self-managed sites, or review submissions from connected sites.
        </p>
      </div>

      {/* Site picker tabs */}
      {sites.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <button
            onClick={() => setSiteId('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              siteId === 'all'
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            All Sites
          </button>
          {sites.map(s => (
            <button
              key={s.id}
              onClick={() => setSiteId(s.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                siteId === s.id
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s.name}
              {!s.has_site_users
                ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${siteId === s.id ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600'}`}>ENTER</span>
                : <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${siteId === s.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>REVIEW</span>
              }
            </button>
          ))}
        </div>
      )}

      {/* Mode banner */}
      {selectedSite && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium ${
          isEntryMode
            ? 'bg-brand-50 border border-brand-200 text-brand-700'
            : 'bg-gray-50 border border-gray-200 text-gray-600'
        }`}>
          {isEntryMode
            ? <><PenLine className="w-4 h-4 flex-shrink-0" /> You manage this site — enter meal counts directly below.</>
            : <><Eye className="w-4 h-4 flex-shrink-0" /> This site submits their own counts — review and verify below.</>
          }
        </div>
      )}

      {/* Entry mode — self-managed site */}
      {isEntryMode && (
        <MealEntryPanel site={selectedSite} onSaved={fetchEntries} />
      )}

      {/* Review section header */}
      {(!isEntryMode || entries.length > 0) && (
        <div className="mb-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {isEntryMode ? 'Previous Submissions' : 'Submissions This Month'}
          </p>
        </div>
      )}

      {/* Summary stat bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total submissions', value: total,      color: 'text-gray-900' },
          { label: 'Awaiting verification', value: unverified, color: unverified > 0 ? 'text-yellow-600' : 'text-gray-900' },
          { label: 'OCR scanned', value: scanned, color: 'text-brand-600' },
        ].map((s) => (
          <div key={s.label} className="card px-5 py-4">
            <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + month picker */}
      <div className="card mb-4">
        <div className="px-5 py-3 flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

          {/* Month selector */}
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {/* Status filter chips */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all',        label: 'All' },
              { id: 'unverified', label: `Unverified (${unverified})` },
              { id: 'scanned',    label: `OCR Scanned (${scanned})` },
            ].map((f) => (
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

          <button
            onClick={fetchEntries}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Count entries */}
      <div className="card">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading submissions…</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <UtensilsCrossed className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              {filter === 'all' ? 'No submissions this month.' : `No ${filter} submissions.`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isEntryMode
                ? 'No counts saved yet for this site this month.'
                : 'Counts submitted by site staff will appear here.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div className="px-5 py-2 border-b border-gray-100 hidden sm:flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <div className="w-12 flex-shrink-0">Slip</div>
              <div className="flex-1">Site / Date</div>
              <div className="flex gap-4 flex-shrink-0 mr-4">
                <span className="w-8 text-center">BK</span>
                <span className="w-8 text-center">LN</span>
                <span className="w-8 text-center">SP</span>
                <span className="w-8 text-center">SNK</span>
                <span className="w-px" />
                <span className="w-10 text-center">Total</span>
              </div>
              <div className="w-24 flex-shrink-0 text-right">Status</div>
            </div>

            {visible.map((entry) => (
              <CountRow
                key={entry.id}
                entry={entry}
                onExpand={setLightbox}
                onVerify={handleVerify}
                verifying={verifying[entry.id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox entry={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
