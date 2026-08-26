// ProductionRecordShared.jsx — shared building blocks for production-record
// entry, extracted so the sponsor's "log for a self-managed kitchen" flow and
// a kitchen's own "log my own records" flow render the exact same UI instead
// of drifting into two different designs over time.
//
// Originally this all lived only inside SponsorProductionRecordsPage.jsx.
// Consumers: SponsorProductionRecordsPage.jsx, KitchenProductionRecordsPage.jsx.

import { useState, useEffect } from 'react';
import {
  CheckCircle, Clock, FileText,
  Plus, Trash2, PenLine, Edit2, Copy, Users, Printer,
} from 'lucide-react';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🥣' },
  { key: 'am_snack',  label: 'AM Snack',  emoji: '🍌' },
  { key: 'lunch',     label: 'Lunch',     emoji: '🥗' },
  { key: 'pm_snack',  label: 'PM Snack',  emoji: '🍎' },
  { key: 'supper',    label: 'Supper',    emoji: '🍽️' },
];

export const COMPONENTS = ['grain', 'meat/alt', 'fruit', 'vegetable', 'dairy', 'other'];
export const COMPONENT_LABEL = {
  'grain':     'Grain',
  'meat/alt':  'Meat/Alt',
  'fruit':     'Fruit',
  'vegetable': 'Vegetable',
  'dairy':     'Dairy',
  'other':     'Other',
};

export const MEAL_COLOR = {
  breakfast: 'bg-orange-100 text-orange-700 border-orange-200',
  am_snack:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  lunch:     'bg-green-100 text-green-700 border-green-200',
  pm_snack:  'bg-sky-100 text-sky-700 border-sky-200',
  supper:    'bg-violet-100 text-violet-700 border-violet-200',
};

export function mealLabel(key) { return MEAL_TYPES.find(m => m.key === key)?.label ?? key; }
export function mealEmoji(key) { return MEAL_TYPES.find(m => m.key === key)?.emoji ?? ''; }
export function todayISO()     { return new Date().toISOString().split('T')[0]; }
export function emptyItem()    { return { food_name: '', component: 'other', quantity_actual: '' }; }

export function fmtDate(d) {
  if (!d) return '—';
  const s = String(d).slice(0, 10);
  return new Date(s + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

// ─── Previous Record Sidebar ──────────────────────────────────────────────────

export function PreviousRecordPanel({ prevRecord, loading, meal, onCopyItem, onCopyAll,
                               yesterdayCount, onCopyYesterday, copyingYesterday, copiedYesterday }) {
  if (loading) return (
    <div className="card p-5 sticky top-6">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Previous Record</p>
      <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
    </div>
  );

  if (!prevRecord) return (
    <div className="card p-5 sticky top-6 text-center py-10">
      <Copy className="w-6 h-6 text-gray-200 mx-auto mb-2" />
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Previous Record</p>
      <p className="text-xs text-gray-400 mt-1">No previous {mealLabel(meal)} record found.</p>
      <p className="text-xs text-gray-300 mt-1">Log one to enable copying next time.</p>
    </div>
  );

  return (
    <div className="card p-5 sticky top-6 space-y-4">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Previous Record</p>
        <p className="text-sm font-semibold text-gray-700">
          {mealEmoji(prevRecord.meal_type)} {mealLabel(prevRecord.meal_type)} — {fmtDate(prevRecord.date)}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
          <span>Planned {prevRecord.servings_planned}</span>
          <span>·</span>
          <span>Actual {prevRecord.servings_prepared}</span>
        </div>
      </div>

      {/* Copy entire meal (this meal type only) */}
      {prevRecord.items?.length > 0 && (
        <button
          onClick={() => onCopyAll(prevRecord.items)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors">
          <Copy className="w-3.5 h-3.5" /> Copy Entire Meal
        </button>
      )}

      {/* Copy Yesterday — copies ALL meals from yesterday as today's drafts */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        {copiedYesterday && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-xl border border-green-100">
            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <p className="text-xs text-green-700 font-semibold">Yesterday's records copied as drafts.</p>
          </div>
        )}
        {yesterdayCount > 0 ? (
          <>
            <p className="text-xs text-gray-400">
              Yesterday had <strong className="text-gray-600">{yesterdayCount} meal record{yesterdayCount !== 1 ? 's' : ''}</strong> — copy all as today's drafts.
            </p>
            <button
              onClick={onCopyYesterday}
              disabled={copyingYesterday}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-brand-300 text-brand-700 bg-brand-50 hover:bg-brand-100 text-xs font-bold rounded-xl transition-colors disabled:opacity-40">
              📅 {copyingYesterday ? 'Copying…' : 'Copy Yesterday'}
            </button>
          </>
        ) : (
          <p className="text-xs text-gray-300 text-center">No records from yesterday to copy.</p>
        )}
      </div>

      {/* Individual items */}
      {prevRecord.items?.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Items</p>
          {prevRecord.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{item.food_name}</p>
                <p className="text-xs text-gray-400">{COMPONENT_LABEL[item.component] || item.component}</p>
              </div>
              <button
                onClick={() => onCopyItem(item)}
                className="flex-shrink-0 text-xs text-brand-600 font-semibold hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50">
                Copy
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No food items were logged for this record.</p>
      )}

      {prevRecord.notes && (
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Notes</p>
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-2.5">{prevRecord.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Smart Production Form (auto-fills from menu, shows compliance warnings) ──

export function SmartProductionForm({ kitchen, date, setDate, meal, setMeal, items, setItems, onSaved }) {
  const today = todayISO();

  // Local form state
  const [planned, setPlanned] = useState('');
  const [actual,  setActual]  = useState('');
  const [notes,   setNotes]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  // Prefill state
  const [prefill,       setPrefill]       = useState(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [menuImported,  setMenuImported]  = useState(false);

  // Fetch prefill whenever kitchen / date / meal changes
  useEffect(() => {
    if (!kitchen?.id || !date) return;
    setPrefillLoading(true);
    setMenuImported(false);
    api.get('/production-records/prefill', {
      params: { date, org_id: kitchen.id, meal_type: meal },
    })
      .then(({ data }) => {
        setPrefill(data);
        if (data.menu_found && data.items?.length) {
          setItems(data.items.map(i => ({
            food_name:       i.food_item,
            component:       i.component || 'other',
            quantity_actual: i.quantity   || '',
          })));
          setMenuImported(true);
        } else if (!data.menu_found) {
          // No menu — keep whatever's in the form (user might have typed already)
          if (items.length === 1 && !items[0].food_name.trim()) {
            setItems([emptyItem()]);
          }
        }
        // Pre-fill planned servings from enrollment count (only if field is empty)
        if (data.enrollment_count > 0) {
          setPlanned(p => p || String(data.enrollment_count));
        }
      })
      .catch(() => setPrefill(null))
      .finally(() => setPrefillLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitchen?.id, date, meal]);

  const enrollmentCount  = prefill?.enrollment_count || 0;
  const servingsPlanned  = parseInt(planned) || 0;
  const showWarning      = servingsPlanned > 0 && enrollmentCount > 0 && servingsPlanned < enrollmentCount;

  const updateItem = (i, field, val) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const handlePrint = () => {
    const mealName  = mealLabel(meal);
    const itemsHtml = items
      .filter(i => i.food_name.trim())
      .map(i => `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd">${i.food_name}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${COMPONENT_LABEL[i.component] || i.component}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${i.quantity_actual || '—'}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Kitchen Sheet</title>
      <style>body{font-family:sans-serif;padding:24px;color:#111}
        h2{margin:0 0 4px}p{margin:0 0 16px;color:#555;font-size:14px}
        table{width:100%;border-collapse:collapse}
        th{background:#f3f4f6;text-align:left;padding:6px 10px;border:1px solid #ddd;font-size:13px}
        td{font-size:13px}</style></head><body>
      <h2>${kitchen.name} — ${mealEmoji(meal)} ${mealName} Production Sheet</h2>
      <p>Date: ${fmtDate(date)} &nbsp;|&nbsp; Planned: ${planned || '—'} servings</p>
      <table><thead><tr><th>Food Item</th><th>Component</th><th>Qty Prepared</th></tr></thead>
      <tbody>${itemsHtml}</tbody></table>
      <p style="margin-top:24px">Notes: ${notes || '—'}</p>
      <p>Prepared by: _______________________ &nbsp;&nbsp; Date/Time: _________________</p>
    </body></html>`);
    win.document.close();
    win.print();
  };

  const handleSave = async (status = 'draft') => {
    setError(''); setSaving(true); setSaved(false);
    try {
      const { data } = await api.post('/production-records', {
        org_id:            kitchen.id,
        date,
        meal_type:         meal,
        servings_planned:  parseInt(planned)  || 0,
        servings_prepared: parseInt(actual)   || 0,
        notes:             notes || null,
        status,
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
      // Reset
      setPlanned(''); setActual(''); setNotes('');
      setItems([emptyItem()]);
      setPrefill(null); setMenuImported(false);
      setSaved(true);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-brand-600" />
          <p className="text-sm font-bold text-gray-700">New Production Record — {kitchen.name}</p>
        </div>
        {prefillLoading && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-3 h-3 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
            Loading menu…
          </div>
        )}
      </div>

      {/* Smart banners */}
      {prefill && (
        <div className="flex flex-wrap gap-2 mb-4">
          {prefill.menu_found && menuImported && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl text-xs font-semibold text-green-700">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {prefill.cycle_info
                ? `${prefill.cycle_info.cycle_name} · Week ${prefill.cycle_info.week_number}`
                : `Menu Imported — ${prefill.menu_name || 'This Week'}`}
            </div>
          )}
          {enrollmentCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-700">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              {enrollmentCount} Children Enrolled
            </div>
          )}
          {!prefill.menu_found && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-700">
              ⚠ No menu for this week — enter items manually.
              <span className="ml-1 text-amber-500 underline cursor-pointer"
                onClick={() => window.open('/dashboard/sponsor/menus', '_blank')}>
                Build menu →
              </span>
            </div>
          )}
        </div>
      )}

      {/* Existing record warning */}
      {prefill?.existing_records?.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-700 font-medium">
          ⚠ A {mealLabel(meal)} record for {fmtDate(date)} already exists. Saving will add a second record.
        </div>
      )}

      {/* Date + Meal Type */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date</label>
          <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Meal Type</label>
          <select value={meal} onChange={e => setMeal(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            {MEAL_TYPES.map(m => <option key={m.key} value={m.key}>{m.emoji} {m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Food Items */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Food Items
            {menuImported && (
              <span className="ml-2 text-green-600 font-normal normal-case text-xs">auto-filled from menu</span>
            )}
          </label>
          <button onClick={() => setItems(p => [...p, emptyItem()])}
            className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:text-brand-700">
            <Plus className="w-3 h-3" /> Add item
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_110px_80px_24px] gap-2 mb-1 px-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Food</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Component</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Qty / Portion</span>
          <span />
        </div>

        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_110px_80px_24px] items-center gap-2">
              <input type="text" value={it.food_name} placeholder="Food name"
                onChange={e => updateItem(i, 'food_name', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <select value={it.component} onChange={e => updateItem(i, 'component', e.target.value)}
                className="px-2 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none capitalize">
                {COMPONENTS.map(c => <option key={c} value={c}>{COMPONENT_LABEL[c]}</option>)}
              </select>
              <input type="text" value={it.quantity_actual} placeholder="e.g. 1 cup"
                onChange={e => updateItem(i, 'quantity_actual', e.target.value)}
                className="px-2 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {items.length > 1
                ? <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}
                    className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                : <span />}
            </div>
          ))}
        </div>
      </div>

      {/* Planned / Actual / Leftovers */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
            Planned Servings
            {enrollmentCount > 0 && !planned && (
              <span className="ml-1 font-normal text-blue-500 normal-case">({enrollmentCount} enrolled)</span>
            )}
          </label>
          <input type="number" min="0" value={planned} onChange={e => setPlanned(e.target.value)}
            placeholder={enrollmentCount > 0 ? `${enrollmentCount}` : '0'}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Actually Served</label>
          <input type="number" min="0" value={actual} onChange={e => setActual(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Leftovers</label>
          <div className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm text-gray-400 bg-gray-50">
            {planned && actual ? Math.max(0, parseInt(planned) - parseInt(actual)) : '—'}
          </div>
        </div>
      </div>

      {/* Compliance Warning */}
      {showWarning && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Planned count is below enrollment</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You have <strong>{enrollmentCount} children enrolled</strong> but only planned{' '}
              <strong>{servingsPlanned} servings</strong>. Update the count or verify today's attendance before completing.
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Notes</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Substitutions, issues, who prepared…"
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      {/* Error + Success */}
      {error && (
        <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium mb-4">{error}</div>
      )}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-semibold mb-4">
          <CheckCircle className="w-3.5 h-3.5" /> Record saved.
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <Printer className="w-3.5 h-3.5" /> Print Kitchen Sheet
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => handleSave('draft')} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave('complete')} disabled={saving}
            className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-40 transition-colors">
            {saving ? 'Saving…' : 'Complete Meal Service'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Record History ───────────────────────────────────────────────────────────

export function RecordHistory({ records, loading, onDelete, onRefresh }) {
  const [editingId,  setEditingId]  = useState(null);
  const [editData,   setEditData]   = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const startEdit = async (r) => {
    if (editingId === r.id) { setEditingId(null); return; }
    try {
      const { data } = await api.get(`/production-records/${r.id}`);
      setEditData({
        date:     String(data.date).slice(0, 10),
        meal:     data.meal_type || 'breakfast',
        planned:  String(data.servings_planned  || ''),
        actual:   String(data.servings_prepared || ''),
        notes:    data.notes || '',
        complete: data.status === 'complete',
        items:    (data.items || []).map(i => ({
          id:              i.id,
          food_name:       i.food_name || '',
          component:       i.component || 'other',
          quantity_actual: String(i.quantity_actual || ''),
        })),
      });
      setEditingId(r.id);
    } catch { /* ignore */ }
  };

  const saveEdit = async (id) => {
    setEditSaving(true);
    try {
      await api.put(`/production-records/${id}`, {
        date:              editData.date     || null,
        meal_type:         editData.meal     || null,
        servings_planned:  parseInt(editData.planned)  || 0,
        servings_prepared: parseInt(editData.actual)   || 0,
        notes:  editData.notes || null,
        status: editData.complete ? 'complete' : 'draft',
      });
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

  const byDate = {};
  for (const r of records) {
    const key = String(r.date).slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(r);
  }
  const dates = Object.keys(byDate).sort().reverse();

  if (loading) return <div className="card py-10 text-center text-sm text-gray-400">Loading records…</div>;

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
                  <div className="flex items-center gap-1.5 text-xs">
                    {r.status === 'complete'
                      ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 font-semibold">Complete</span></>
                      : <><Clock className="w-3.5 h-3.5 text-amber-400" /><span className="text-amber-600">Draft</span></>}
                  </div>
                  {r.servings_prepared > 0 && (
                    <span className="text-xs text-gray-400">{r.servings_prepared} served</span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => startEdit(r)} className="text-gray-300 hover:text-brand-500 transition-colors" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(r.id)} className="text-gray-200 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {r.food_items_summary && (
                  <p className="mt-1 text-xs text-gray-400 pl-1">{r.food_items_summary}</p>
                )}

                {editingId === r.id && editData && (
                  <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">

                    {/* Date + Meal */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Date</label>
                        <input type="date" value={editData.date}
                          onChange={e => setEditData(p => ({ ...p, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Meal</label>
                        <select value={editData.meal}
                          onChange={e => setEditData(p => ({ ...p, meal: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                          {MEAL_TYPES.map(m => <option key={m.key} value={m.key}>{m.emoji} {m.label}</option>)}
                        </select>
                      </div>
                    </div>

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
                              className="px-2 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none capitalize">
                              {COMPONENTS.map(c => <option key={c} value={c}>{COMPONENT_LABEL[c]}</option>)}
                            </select>
                            <input type="text" value={it.quantity_actual} placeholder="Qty"
                              onChange={e => updateEditItem(i, 'quantity_actual', e.target.value)}
                              className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                            <button onClick={() => removeEditItem(i)} className="text-gray-300 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {editData.items.length === 0 && (
                          <p className="text-xs text-gray-400 italic">No items — click Add item.</p>
                        )}
                      </div>
                    </div>

                    {/* Planned / Actual / Leftovers */}
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
