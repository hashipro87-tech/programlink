// SponsorProductionRecordsPage.jsx — Audit view of all kitchen production records
// Sponsors can see which kitchens are keeping complete USDA-required production logs.

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, FileText, Plus, X, Trash2 } from 'lucide-react';
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

// ─── Log Record Modal ─────────────────────────────────────────────────────────

const MEAL_OPTIONS  = ['breakfast', 'lunch', 'snack', 'supper'];
const COMPONENTS    = ['grain', 'protein', 'fruit', 'vegetable', 'dairy', 'other'];

function emptyItem() {
  return { food_name: '', component: 'other', quantity_planned: '', quantity_actual: '' };
}

function LogRecordModal({ kitchens, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0];
  const [kitchenId,  setKitchenId]  = useState(kitchens[0]?.id || '');
  const [date,       setDate]       = useState(today);
  const [mealType,   setMealType]   = useState('lunch');
  const [servings,   setServings]   = useState('');
  const [notes,      setNotes]      = useState('');
  const [items,      setItems]      = useState([emptyItem()]);
  const [markDone,   setMarkDone]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const updateItem = (i, field, val) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!kitchenId) { setError('Select a kitchen.'); return; }
    if (!date)      { setError('Select a date.'); return; }
    const filledItems = items.filter(it => it.food_name.trim());
    setSaving(true); setError('');
    try {
      // 1. Create/update the record
      const { data } = await api.post('/production-records', {
        org_id:            kitchenId,
        date,
        meal_type:         mealType,
        servings_planned:  parseInt(servings) || 0,
        servings_prepared: parseInt(servings) || 0,
        notes:             notes || null,
        status:            markDone ? 'complete' : 'draft',
      });
      const recordId = data.record?.id;

      // 2. Add food items
      if (recordId) {
        for (const it of filledItems) {
          await api.post(`/production-records/${recordId}/items`, {
            food_name:        it.food_name.trim(),
            component:        it.component,
            quantity_planned: it.quantity_planned || null,
            quantity_actual:  it.quantity_actual  || null,
          });
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save — please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Log Production Record</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Kitchen + Date + Meal type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Kitchen</label>
              <select
                value={kitchenId}
                onChange={e => setKitchenId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {kitchens.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date</label>
              <input
                type="date" value={date} max={today}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Meal</label>
              <div className="flex gap-1.5 flex-wrap">
                {MEAL_OPTIONS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMealType(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                      mealType === m
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >{m}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Servings prepared</label>
              <input
                type="number" min="0" value={servings}
                onChange={e => setServings(e.target.value)}
                placeholder="e.g. 80"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Food items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">What was made</label>
              <button onClick={addItem} className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:text-brand-700">
                <Plus className="w-3 h-3" /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text" value={it.food_name} placeholder="Food name (e.g. Chicken breast)"
                    onChange={e => updateItem(i, 'food_name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <select
                    value={it.component}
                    onChange={e => updateItem(i, 'component', e.target.value)}
                    className="px-2 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white capitalize"
                  >
                    {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="text" value={it.quantity_actual} placeholder="Qty"
                    onChange={e => updateItem(i, 'quantity_actual', e.target.value)}
                    className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Notes (optional)</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Any substitutions, issues, or notes from the kitchen…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mr-auto">
            <input
              type="checkbox" checked={markDone} onChange={e => setMarkDone(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Mark as complete
          </label>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SponsorProductionRecordsPage() {
  const { month, name } = monthRange();

  const [kitchens,   setKitchens]   = useState([]);
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showLog,    setShowLog]    = useState(false);

  const loadData = () => {
    setLoading(true);
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
  };

  useEffect(() => { loadData(); }, [month]);

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Records</h1>
          <p className="text-sm text-gray-500 mt-1">{name} — USDA-required kitchen production logs</p>
        </div>
        {kitchens.length > 0 && (
          <button
            onClick={() => setShowLog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Log for Kitchen
          </button>
        )}
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
          USDA 7 CFR Part 226 requires production records for every meal service. Records must be retained for 3 years and made available during state agency reviews. Kitchens can log their own records, or use <strong>Log for Kitchen</strong> above to enter records on their behalf.
        </p>
      </div>

      {/* Log record modal */}
      {showLog && (
        <LogRecordModal
          kitchens={kitchens}
          onClose={() => setShowLog(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
