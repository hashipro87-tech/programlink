// SponsorProductionRecordsPage.jsx — Audit view of all kitchen production records
// Sponsors can see which kitchens are keeping complete USDA-required production logs.

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import api from '../../services/api';

const MEALS   = ['breakfast', 'lunch', 'snack', 'supper'];
const MEAL_COLORS = {
  breakfast: 'bg-orange-100 text-orange-700',
  lunch:     'bg-green-100 text-green-700',
  snack:     'bg-sky-100 text-sky-700',
  supper:    'bg-violet-100 text-violet-700',
};

function todayISO() { return new Date().toISOString().split('T')[0]; }

function monthRange() {
  const now   = new Date();
  const y     = now.getFullYear();
  const m     = now.getMonth() + 1;
  const month = `${y}-${String(m).padStart(2, '0')}`;
  const start = `${month}-01`;
  const end   = new Date(y, m, 1).toISOString().split('T')[0];
  const name  = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return { month, start, end, name };
}

// ─── Kitchen row ──────────────────────────────────────────────────────────────
function KitchenRow({ kitchen, records }) {
  const [open, setOpen] = useState(false);

  const complete = records.filter(r => r.status === 'complete').length;
  const draft    = records.filter(r => r.status === 'draft').length;
  const total    = records.length;
  const pct      = total > 0 ? Math.round((complete / total) * 100) : 0;

  const statusColor = pct === 100
    ? 'text-green-700 bg-green-50 border-green-200'
    : pct >= 50
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-red-700 bg-red-50 border-red-200';

  // Group records by date
  const byDate = {};
  for (const r of records) {
    if (!byDate[r.date]) byDate[r.date] = {};
    byDate[r.date][r.meal_type] = r;
  }
  const dates = Object.keys(byDate).sort().reverse();

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Kitchen name */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{kitchen.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{total} records this month</p>
        </div>

        {/* Completion bar */}
        <div className="w-32 hidden sm:block">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">{complete}/{total} complete</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Badge */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor} flex-shrink-0`}>
          {pct}%
        </span>

        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          {dates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No production records logged yet this month.</p>
          ) : (
            <div className="space-y-2">
              {dates.map(date => {
                const d    = new Date(date + 'T00:00:00Z');
                const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
                return (
                  <div key={date} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {MEALS.map(m => {
                        const rec = byDate[date][m];
                        if (!rec) return null;
                        return (
                          <span
                            key={m}
                            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              rec.status === 'complete'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {rec.status === 'complete'
                              ? <CheckCircle className="w-2.5 h-2.5" />
                              : <Clock className="w-2.5 h-2.5" />}
                            {m}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {draft > 0 && (
            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {draft} record{draft !== 1 ? 's' : ''} in draft — kitchen needs to mark {draft === 1 ? 'it' : 'them'} complete.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SponsorProductionRecordsPage() {
  const { month, name } = monthRange();

  const [kitchens,  setKitchens]  = useState([]);
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/organizations', { params: { type: 'kitchen', limit: 200 } }),
      api.get('/production-records', { params: { month } }),
    ]).then(([kRes, rRes]) => {
      const k = kRes.status === 'fulfilled'
        ? (kRes.value.data?.organizations ?? kRes.value.data ?? [])
        : [];
      const r = rRes.status === 'fulfilled'
        ? (rRes.value.data?.records ?? [])
        : [];
      setKitchens(k);
      setRecords(r);
    }).finally(() => setLoading(false));
  }, [month]);

  // Group records by kitchen org_id
  const byKitchen = {};
  for (const r of records) {
    if (!byKitchen[r.org_id]) byKitchen[r.org_id] = [];
    byKitchen[r.org_id].push(r);
  }

  const totalComplete = records.filter(r => r.status === 'complete').length;
  const totalDraft    = records.filter(r => r.status === 'draft').length;
  const totalRecords  = records.length;
  const kitchensOnTrack = kitchens.filter(k => (byKitchen[k.id] ?? []).some(r => r.status === 'complete')).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Production Records</h1>
        <p className="text-sm text-gray-500 mt-1">{name} — USDA-required kitchen production logs</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Kitchens Logging',  value: `${kitchensOnTrack}/${kitchens.length}`, sub: 'have records this month' },
          { label: 'Records Complete',  value: totalComplete, sub: 'fully logged meals' },
          { label: 'In Draft',          value: totalDraft,    sub: 'need to be completed' },
          { label: 'Total Records',     value: totalRecords,  sub: 'across all kitchens' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-1">{label}</p>
            <p className="text-[11px] text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Kitchen list */}
      {kitchens.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No kitchens yet</p>
          <p className="text-xs mt-1">Add kitchens to your program to track their production records.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {kitchens.map(k => (
            <KitchenRow
              key={k.id}
              kitchen={k}
              records={byKitchen[k.id] ?? []}
            />
          ))}
        </div>
      )}

      {/* USDA note */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          USDA 7 CFR Part 226 requires production records for every meal service. Records must be retained for 3 years and made available during state agency reviews. Kitchens log records from their <strong>Daily Ops → Production Records</strong> page.
        </p>
      </div>
    </div>
  );
}
