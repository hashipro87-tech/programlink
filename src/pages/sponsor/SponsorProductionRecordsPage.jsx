// SponsorProductionRecordsPage.jsx
// Kitchen-first layout matching Meal Counts pattern.
// Self-managed kitchens: sponsor enters records inline.
// Connected kitchens: sponsor reviews submissions.

import { useState, useEffect } from 'react';
import {
  CheckCircle, Clock, AlertCircle, ChevronDown, FileText,
  Plus, X, Trash2, PenLine, Eye, Edit2,
} from 'lucide-react';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast',  emoji: '🥣' },
  { key: 'am_snack',  label: 'AM Snack',   emoji: '🍌' },
  { key: 'lunch',     label: 'Lunch',      emoji: '🥗' },
  { key: 'pm_snack',  label: 'PM Snack',   emoji: '🍎' },
  { key: 'supper',    label: 'Supper',     emoji: '🍽️' },
];

const COMPONENTS = ['grain', 'protein', 'fruit', 'vegetable', 'dairy', 'other'];

const MEAL_COLOR = {
  breakfast: 'bg-orange-100 text-orange-700 border-orange-200',
  am_snack:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  lunch:     'bg-green-100 text-green-700 border-green-200',
  pm_snack:  'bg-sky-100 text-sky-700 border-sky-200',
  supper:    'bg-violet-100 text-violet-700 border-violet-200',
};

function mealLabel(key) {
  return MEAL_TYPES.find(m => m.key === key)?.label ?? key;
}

function todayISO() { return new Date().toISOString().split('T')[0]; }

function fmtDate(d) {
  if (!d) return '—';
  // Postgres may return a full ISO timestamp; take only YYYY-MM-DD
  const dateStr = String(d).slice(0, 10);
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

function emptyItem() { return { food_name: '', component: 'other', quantity_actual: '' }; }

// ─── Production Record Entry Form ────────────────────────────────────────────

function RecordForm({ kitchen, onSaved }) {
  const today = todayISO();
  const [date,     setDate]     = useState(today);
  const [meal,     setMeal]     = useState('breakfast');
  const [planned,  setPlanned]  = useState('');
  const [actual,   setActual]   = useState('');
  const [prepBy,   setPrepBy]   = useState('');
  const [notes,    setNotes]    = useState('');
  const [items,    setItems]    = useState([emptyItem()]);
  const [markDone, setMarkDone] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  const leftovers = Math.max(0, (parseInt(planned) || 0) - (parseInt(actual) || 0));

  const updateItem = (i, field, val) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const handleSave = async () => {
    setError(''); setSaving(true); setSaved(false);
    try {
      const { data } = await api.post('/production-records', {
        org_id:            kitchen.id,
        date,
        meal_type:         meal,
        servings_planned:  parseInt(planned) || 0,
        servings_prepared: parseInt(actual)  || 0,
        notes: [prepBy ? `Prepared by: ${prepBy}` : '', notes].filter(Boolean).join('\n') || null,
        status: markDone ? 'complete' : 'draft',
      });
      const recordId = data.id;
      if (recordId) {
        for (const it of items.filter(i => i.food_name.trim())) {
          await api.post(`/production-records/${recordId}/items`, {
            food_name:       it.food_name.trim(),
            component:       it.component,
            quantity_actual: it.quantity_actual || null,
          });
        }
      }
      // Reset form
      setPlanned(''); setActual(''); setPrepBy(''); setNotes('');
      setItems([emptyItem()]); setMarkDone(false); setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <PenLine className="w-4 h-4 text-brand-600" />
        <p className="text-sm font-bold text-gray-700">New Production Record — {kitchen.name}</p>
      </div>

      {/* Date + Meal */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date</label>
          <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Meal</label>
          <select value={meal} onChange={e => setMeal(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            {MEAL_TYPES.map(m => (
              <option key={m.key} value={m.key}>{m.emoji} {m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Menu / food items */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Menu Items</label>
          <button onClick={() => setItems(p => [...p, emptyItem()])}
            className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:text-brand-700">
            <Plus className="w-3 h-3" /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="text" value={it.food_name} placeholder="Food name (e.g. Oatmeal)"
                onChange={e => updateItem(i, 'food_name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <select value={it.component} onChange={e => updateItem(i, 'component', e.target.value)}
                className="px-2 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize">
                {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="text" value={it.quantity_actual} placeholder="Qty"
                onChange={e => updateItem(i, 'quantity_actual', e.target.value)}
                className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {items.length > 1 && (
                <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}
                  className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Servings */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Planned</label>
          <input type="number" min="0" value={planned} onChange={e => setPlanned(e.target.value)}
            placeholder="40"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Actual</label>
          <input type="number" min="0" value={actual} onChange={e => setActual(e.target.value)}
            placeholder="38"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Leftovers</label>
          <div className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm text-gray-500 bg-gray-50">
            {planned && actual ? leftovers : '—'}
          </div>
        </div>
      </div>

      {/* Prepared by + notes */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Prepared By</label>
          <input type="text" value={prepBy} onChange={e => setPrepBy(e.target.value)}
            placeholder="Cook's name"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Notes</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Substitutions, issues…"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">{error}</p>
      )}
      {saved && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-xl border border-green-100">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-sm text-green-700 font-semibold">Record saved.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mr-auto">
          <input type="checkbox" checked={markDone} onChange={e => setMarkDone(e.target.checked)}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
          Mark as complete
        </label>
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-40">
          {saving ? 'Saving…' : markDone ? 'Submit' : 'Save Draft'}
        </button>
      </div>
    </div>
  );
}

// ─── Record History ───────────────────────────────────────────────────────────

function RecordHistory({ records, loading, onDelete, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editData,  setEditData]  = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const startEdit = async (r) => {
    if (editingId === r.id) { setEditingId(null); return; }
    try {
      const { data } = await api.get(`/production-records/${r.id}`);
      setEditData({
        planned:  String(data.servings_planned  || ''),
        actual:   String(data.servings_prepared || ''),
        notes:    data.notes || '',
        complete: data.status === 'complete',
        items:    (data.items || []).map(i => ({
          id:             i.id,
          food_name:      i.food_name || '',
          component:      i.component || 'other',
          quantity_actual: String(i.quantity_actual || ''),
        })),
      });
      setEditingId(r.id);
    } catch { /* ignore */ }
  };

  const saveEdit = async (id) => {
    setEditSaving(true);
    try {
      // 1. Update servings / notes / status
      await api.put(`/production-records/${id}`, {
        servings_planned:  parseInt(editData.planned)  || 0,
        servings_prepared: parseInt(editData.actual)   || 0,
        notes:  editData.notes || null,
        status: editData.complete ? 'complete' : 'draft',
      });
      // 2. Delete existing items then re-add (replaces them cleanly)
      for (const item of editData.items.filter(i => i.id)) {
        await api.delete(`/production-records/items/${item.id}`);
      }
      for (const item of editData.items.filter(i => i.food_name.trim())) {
        await api.post(`/production-records/${id}/items`, {
          food_name:       item.food_name.trim(),
          component:       item.component,
          quantity_actual: item.quantity_actual || null,
        });
      }
      setEditingId(null);
      onRefresh();
    } catch { alert('Failed to save changes.'); }
    finally { setEditSaving(false); }
  };

  const updateEditItem = (i, field, val) =>
    setEditData(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) }));

  const addEditItem = () =>
    setEditData(p => ({ ...p, items: [...p.items, { food_name: '', component: 'other', quantity_actual: '' }] }));

  const removeEditItem = (i) =>
    setEditData(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  // Group by date
  const byDate = {};
  for (const r of records) {
    const key = String(r.date).slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(r);
  }
  const dates = Object.keys(byDate).sort().reverse();

  if (loading) return (
    <div className="card py-10 text-center text-sm text-gray-400">Loading records…</div>
  );

  if (!records.length) return (
    <div className="card py-12 text-center">
      <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
      <p className="text-sm text-gray-500 font-medium">No production records this month.</p>
      <p className="text-xs text-gray-400 mt-1">Use the form above to log the first one.</p>
    </div>
  );

  return (
    <div className="card divide-y divide-gray-100">
      <div className="px-5 py-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Record History</p>
      </div>
      {dates.map(date => (
        <div key={date} className="px-5 py-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">{fmtDate(date)}</p>
          <div className="space-y-2">
            {byDate[date].map(r => (
              <div key={r.id}>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${MEAL_COLOR[r.meal_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {mealLabel(r.meal_type)}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {r.status === 'complete'
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      : <Clock className="w-3.5 h-3.5 text-amber-400" />}
                    <span className={r.status === 'complete' ? 'text-green-600 font-semibold' : 'text-amber-600'}>
                      {r.status === 'complete' ? 'Complete' : 'Draft'}
                    </span>
                  </div>
                  {r.servings_prepared > 0 && (
                    <span className="text-xs text-gray-400">{r.servings_prepared} served</span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => startEdit(r)}
                      className="text-gray-300 hover:text-brand-500 transition-colors"
                      title="Edit record">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(r.id)}
                      className="text-gray-200 hover:text-red-400 transition-colors"
                      title="Delete record">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Food items summary — always visible */}
                {r.food_items_summary && (
                  <p className="mt-1 text-xs text-gray-400 pl-1">{r.food_items_summary}</p>
                )}

                {/* Inline edit panel */}
                {editingId === r.id && editData && (
                  <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">

                    {/* Food items */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Menu Items</label>
                        <button onClick={addEditItem}
                          className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:text-brand-700">
                          <Plus className="w-3 h-3" /> Add item
                        </button>
                      </div>
                      <div className="space-y-2">
                        {editData.items.map((it, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input type="text" value={it.food_name} placeholder="Food name"
                              onChange={e => updateEditItem(i, 'food_name', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                            <select value={it.component} onChange={e => updateEditItem(i, 'component', e.target.value)}
                              className="px-2 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize">
                              {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="text" value={it.quantity_actual} placeholder="Qty"
                              onChange={e => updateEditItem(i, 'quantity_actual', e.target.value)}
                              className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                            <button onClick={() => removeEditItem(i)}
                              className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                        {editData.items.length === 0 && (
                          <p className="text-xs text-gray-400 italic">No items — click Add item to add one.</p>
                        )}
                      </div>
                    </div>

                    {/* Servings */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Planned</label>
                        <input type="number" min="0" value={editData.planned}
                          onChange={e => setEditData(p => ({ ...p, planned: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Actual</label>
                        <input type="number" min="0" value={editData.actual}
                          onChange={e => setEditData(p => ({ ...p, actual: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Leftovers</label>
                        <div className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm text-gray-400 bg-white">
                          {editData.planned && editData.actual
                            ? Math.max(0, parseInt(editData.planned) - parseInt(editData.actual))
                            : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Notes</label>
                      <input type="text" value={editData.notes}
                        onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Substitutions, issues…"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                    </div>

                    <p className="text-xs text-gray-400">To change the date or meal type, delete this record and create a new one.</p>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mr-auto">
                        <input type="checkbox" checked={editData.complete}
                          onChange={e => setEditData(p => ({ ...p, complete: e.target.checked }))}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                        Mark as complete
                      </label>
                      <button onClick={() => setEditingId(null)}
                        className="px-4 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-100">
                        Cancel
                      </button>
                      <button onClick={() => saveEdit(r.id)} disabled={editSaving}
                        className="px-4 py-1.5 text-sm bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl disabled:opacity-40">
                        {editSaving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SponsorProductionRecordsPage() {
  const today    = new Date();
  const [month, setMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  );

  const [kitchens,  setKitchens]  = useState([]);
  const [kitchenId, setKitchenId] = useState('');
  const [records,   setRecords]   = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load kitchens once
  useEffect(() => {
    api.get('/organizations', { params: { type: 'kitchen', limit: 200 } })
      .then(({ data }) => setKitchens(data.organizations ?? []))
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, []);

  const selectedKitchen = kitchens.find(k => k.id === kitchenId) ?? null;
  const isEntryMode     = selectedKitchen && !selectedKitchen.has_kitchen_users;

  // Load records when kitchen or month changes
  const loadRecords = () => {
    if (!kitchenId) { setRecords([]); return; }
    setRecLoading(true);
    api.get('/production-records', { params: { org_id: kitchenId, month } })
      .then(({ data }) => setRecords(data.records ?? []))
      .catch(() => setRecords([]))
      .finally(() => setRecLoading(false));
  };

  useEffect(() => { loadRecords(); }, [kitchenId, month]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this production record?')) return;
    try {
      await api.delete(`/production-records/${id}`);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Failed to delete — please try again.');
    }
  };

  if (pageLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Production Records</h1>
        <p className="text-gray-500 mt-1 text-sm">
          USDA-required logs of what each kitchen prepared for every meal service.
        </p>
      </div>

      {/* Kitchen selector */}
      <div className="card px-5 py-4 mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select a Kitchen</label>
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <select
              value={kitchenId}
              onChange={e => setKitchenId(e.target.value)}
              className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white pr-10"
            >
              <option value="">— Select a kitchen —</option>
              {kitchens.map(k => (
                <option key={k.id} value={k.id}>
                  {k.name} {!k.has_kitchen_users ? "(I'll log records)" : '(kitchen logs records)'}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Month picker */}
          <input
            type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 flex-shrink-0"
          />
        </div>
      </div>

      {/* Kitchen selected — show mode banner */}
      {selectedKitchen && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium ${
          isEntryMode
            ? 'bg-brand-50 border border-brand-200 text-brand-700'
            : 'bg-gray-50 border border-gray-200 text-gray-600'
        }`}>
          {isEntryMode
            ? <><PenLine className="w-4 h-4 flex-shrink-0" /> You manage this kitchen — log production records below.</>
            : <><Eye className="w-4 h-4 flex-shrink-0" /> This kitchen logs its own records — review submissions below.</>
          }
        </div>
      )}

      {/* Entry form — self-managed kitchens only */}
      {isEntryMode && (
        <RecordForm kitchen={selectedKitchen} onSaved={loadRecords} />
      )}

      {/* History */}
      {selectedKitchen && (
        <RecordHistory
          records={records}
          loading={recLoading}
          onDelete={handleDelete}
          onRefresh={loadRecords}
        />
      )}

      {/* No kitchen selected — prompt */}
      {!selectedKitchen && kitchens.length > 0 && (
        <div className="card py-14 text-center">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Select a kitchen to view or log production records.</p>
        </div>
      )}

      {/* No kitchens at all */}
      {kitchens.length === 0 && (
        <div className="card py-14 text-center">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">No kitchens yet.</p>
          <p className="text-xs text-gray-400 mt-1">Add kitchens to your program first.</p>
        </div>
      )}

      {/* USDA note */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mt-6">
        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          USDA 7 CFR Part 226 — production records must be kept for every meal service and retained for 3 years. They must be available for state agency review during audits.
        </p>
      </div>
    </div>
  );
}
