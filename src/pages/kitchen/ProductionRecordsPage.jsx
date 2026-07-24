// ProductionRecordsPage.jsx — USDA-required daily meal production logs
// Kitchens document what was prepared for each meal service.
// Auto-fills from the week's menu so staff don't start from scratch.

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle, Clock, Plus, X,
  Zap, FileText, Save, AlertCircle, Trash2, BookOpen,
} from 'lucide-react';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const MEALS = [
  { key: 'breakfast', label: 'Breakfast', color: 'orange' },
  { key: 'lunch',     label: 'Lunch',     color: 'green'  },
  { key: 'snack',     label: 'Snack',     color: 'sky'    },
  { key: 'supper',    label: 'Supper',    color: 'violet' },
];

const MEAL_COLORS = {
  orange: { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  green:  { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500'  },
  sky:    { bg: 'bg-sky-50',     text: 'text-sky-700',    border: 'border-sky-200',    dot: 'bg-sky-400'    },
  violet: { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400' },
};

const COMPONENTS = [
  { value: 'grain',     label: 'Grain/Bread' },
  { value: 'protein',   label: 'Meat/Protein' },
  { value: 'fruit',     label: 'Fruit' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'milk',      label: 'Milk' },
  { value: 'other',     label: 'Other' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().split('T')[0]; }

function getMondayOf(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00Z');
  const dow = ((d.getUTCDay() + 6) % 7); // 0=Mon
  const m   = new Date(d);
  m.setUTCDate(d.getUTCDate() - dow);
  return m.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

function fmtDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function fmtDayShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return {
    day:  d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
  };
}

// ─── RecordDrawer ─────────────────────────────────────────────────────────────
function RecordDrawer({ date, mealType, onClose, onSaved }) {
  const meal = MEALS.find(m => m.key === mealType);
  const c    = MEAL_COLORS[meal?.color ?? 'orange'];

  const [record,   setRecord]   = useState(null);
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [filling,  setFilling]  = useState(false);
  const [error,    setError]    = useState('');

  // Form state
  const [servings,  setServings]  = useState('');
  const [notes,     setNotes]     = useState('');
  const [newFood,   setNewFood]   = useState('');
  const [newComp,   setNewComp]   = useState('grain');
  const [newQty,    setNewQty]    = useState('');
  const [newWgr,    setNewWgr]    = useState(false);

  // Load existing record
  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/production-records', { params: { week_of: date } })
      .then(({ data }) => {
        const rec = (data.records ?? []).find(r => r.date === date && r.meal_type === mealType);
        if (rec) {
          setRecord(rec);
          setServings(rec.servings_prepared > 0 ? String(rec.servings_prepared) : '');
          setNotes(rec.notes ?? '');
          // Load full record with items
          return api.get(`/production-records/${rec.id}`).then(({ data: full }) => {
            setItems(full.items ?? []);
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date, mealType]);

  const handleAutoFill = async () => {
    setFilling(true);
    setError('');
    try {
      const { data } = await api.post('/production-records/auto-fill', { date, meal_type: mealType });
      setRecord(data.record);
      setItems(data.items ?? []);
      setServings(data.record.servings_prepared > 0 ? String(data.record.servings_prepared) : '');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Auto-fill failed. Make sure a menu exists for this week.');
    } finally {
      setFilling(false);
    }
  };

  const handleAddItem = async () => {
    if (!newFood.trim()) return;
    setError('');
    try {
      // Get or create the record first
      let recId = record?.id;
      if (!recId) {
        const { data } = await api.post('/production-records', { date, meal_type: mealType });
        setRecord(data);
        recId = data.id;
      }
      const { data } = await api.post(`/production-records/${recId}/items`, {
        food_name:  newFood.trim(),
        component:  newComp,
        quantity_planned: newQty.trim() || null,
        is_wgr:     newWgr,
      });
      setItems(prev => [...prev, data]);
      setNewFood(''); setNewQty(''); setNewComp('grain'); setNewWgr(false);
    } catch {
      setError('Failed to add item.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await api.delete(`/production-records/items/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch {
      setError('Failed to remove item.');
    }
  };

  const handleSave = async (status) => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        date, meal_type: mealType,
        servings_prepared: servings ? Number(servings) : 0,
        notes: notes || null,
        status,
      };
      const { data } = await api.post('/production-records', payload);
      setRecord(data);
      onSaved(data);
      if (status === 'complete') onClose();
    } catch {
      setError('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const isComplete = record?.status === 'complete';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className={`${c.bg} ${c.border} border-b px-5 py-4 flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide ${c.text} mb-0.5`}>{meal?.label}</p>
              <p className="text-sm font-semibold text-gray-800">{fmtDay(date)}</p>
            </div>
            <div className="flex items-center gap-2">
              {isComplete && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Complete
                </span>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Auto-fill button */}
              {items.length === 0 && !isComplete && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center">
                  <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">No food items yet</p>
                  <p className="text-xs text-gray-400 mb-3">Auto-fill from this week's menu or add items manually.</p>
                  <button
                    onClick={handleAutoFill}
                    disabled={filling}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {filling ? 'Filling from menu…' : 'Auto-fill from Menu'}
                  </button>
                </div>
              )}

              {/* Items list */}
              {items.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Food Items</p>
                    {!isComplete && (
                      <button
                        onClick={handleAutoFill}
                        disabled={filling}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold"
                      >
                        <Zap className="w-3 h-3" />
                        {filling ? 'Refreshing…' : 'Re-fill from menu'}
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {items.map(item => (
                      <div key={item.id} className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0 mt-1.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 leading-tight">
                            {item.food_name}
                            {item.is_wgr && <span className="ml-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">WGR</span>}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {COMPONENTS.find(c => c.value === item.component)?.label ?? item.component}
                            {item.quantity_planned && ` · ${item.quantity_planned}`}
                          </p>
                        </div>
                        {!isComplete && (
                          <button onClick={() => handleDeleteItem(item.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add item form */}
              {!isComplete && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Add Food Item</p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Food name (e.g. Whole wheat bread)"
                      value={newFood}
                      onChange={e => setNewFood(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newComp}
                        onChange={e => setNewComp(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
                      >
                        {COMPONENTS.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Quantity (e.g. 2 slices)"
                        value={newQty}
                        onChange={e => setNewQty(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newWgr}
                          onChange={e => setNewWgr(e.target.checked)}
                          className="rounded accent-brand-600"
                        />
                        Whole Grain Rich (WGR)
                      </label>
                      <button
                        onClick={handleAddItem}
                        disabled={!newFood.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Servings */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                  Servings Prepared
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="How many servings were prepared?"
                  value={servings}
                  onChange={e => setServings(e.target.value)}
                  disabled={isComplete}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                  Notes <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Any substitutions, issues, or notes for the record…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled={isComplete}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {!loading && !isComplete && (
          <div className="flex-shrink-0 border-t border-gray-100 p-4 flex gap-2 bg-white">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button
              onClick={() => handleSave('complete')}
              disabled={saving || items.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
            >
              <CheckCircle className="w-4 h-4" /> Mark Complete
            </button>
          </div>
        )}
        {!loading && isComplete && (
          <div className="flex-shrink-0 border-t border-gray-100 p-4 bg-green-50">
            <p className="text-xs text-center text-green-700 font-semibold">
              ✅ Record complete — retained for USDA audit compliance
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WeekGrid ─────────────────────────────────────────────────────────────────
function WeekGrid({ monday, records, onCellClick, today }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth: 640 }}>
        <thead>
          <tr>
            <th className="w-24 p-0" />
            {days.map(d => {
              const { day, date } = fmtDayShort(d);
              const isToday = d === today;
              return (
                <th key={d} className="pb-2">
                  <div className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl mx-0.5 ${isToday ? 'bg-brand-50 border border-brand-200' : ''}`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${isToday ? 'text-brand-600' : 'text-gray-400'}`}>{day}</span>
                    <span className={`text-[12px] font-semibold ${isToday ? 'text-brand-700' : 'text-gray-600'}`}>{date}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {MEALS.map(meal => {
            const c = MEAL_COLORS[meal.color];
            return (
              <tr key={meal.key} className="border-t border-gray-100">
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0`} />
                    <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{meal.label}</span>
                  </div>
                </td>
                {days.map(d => {
                  const key = `${d}-${meal.key}`;
                  const rec = records[key];
                  const isToday = d === today;

                  return (
                    <td key={d} className="py-1.5 px-0.5">
                      <button
                        onClick={() => onCellClick(d, meal.key)}
                        className={`w-full rounded-xl px-2 py-2.5 text-center transition-all border
                          ${rec?.status === 'complete'
                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                            : rec?.status === 'draft'
                              ? `${c.bg} ${c.border} hover:opacity-80`
                              : isToday
                                ? 'bg-brand-50 border-brand-200 hover:bg-brand-100'
                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                          }
                        `}
                      >
                        {rec?.status === 'complete' ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600 mx-auto mb-1" />
                            <p className="text-[10px] font-semibold text-green-700">Complete</p>
                            {rec.servings_prepared > 0 && (
                              <p className="text-[9px] text-green-500">{rec.servings_prepared} srv</p>
                            )}
                          </>
                        ) : rec?.status === 'draft' ? (
                          <>
                            <Clock className={`w-4 h-4 ${c.text} mx-auto mb-1`} />
                            <p className={`text-[10px] font-semibold ${c.text}`}>Draft</p>
                            <p className={`text-[9px] ${c.text} opacity-70`}>{rec.item_count ?? 0} items</p>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 text-gray-300 mx-auto mb-1" />
                            <p className="text-[10px] text-gray-400">Log</p>
                          </>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductionRecordsPage() {
  const today   = todayISO();
  const [monday,  setMonday]  = useState(getMondayOf(today));
  const [records, setRecords] = useState({});  // keyed "date-meal_type"
  const [loading, setLoading] = useState(true);
  const [drawer,  setDrawer]  = useState(null); // { date, mealType }

  const sunday = addDays(monday, 6);
  const weekLabel = (() => {
    const m = new Date(monday + 'T00:00:00Z');
    const s = new Date(sunday + 'T00:00:00Z');
    const opts = { month: 'short', day: 'numeric', timeZone: 'UTC' };
    return `${m.toLocaleDateString('en-US', opts)} – ${s.toLocaleDateString('en-US', opts)}`;
  })();

  const loadWeek = useCallback(() => {
    setLoading(true);
    api.get('/production-records', { params: { week_of: monday } })
      .then(({ data }) => {
        const map = {};
        for (const r of (data.records ?? [])) {
          map[`${r.date}-${r.meal_type}`] = r;
        }
        setRecords(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [monday]);

  useEffect(() => { loadWeek(); }, [loadWeek]);

  const prevWeek = () => setMonday(addDays(monday, -7));
  const nextWeek = () => setMonday(addDays(monday,  7));
  const thisWeek = () => setMonday(getMondayOf(today));

  const handleSaved = (rec) => {
    setRecords(prev => ({
      ...prev,
      [`${rec.date}-${rec.meal_type}`]: rec,
    }));
  };

  // Summary counts
  const total    = Object.keys(records).length;
  const complete = Object.values(records).filter(r => r.status === 'complete').length;
  const draft    = Object.values(records).filter(r => r.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Production Records</h1>
        <p className="text-sm text-gray-500 mt-1">
          USDA-required daily logs of meals prepared. Complete each record to stay audit-ready.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{complete}</p>
          <p className="text-xs text-gray-500 mt-1">Complete</p>
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: total ? `${(complete/total)*100}%` : '0%' }} />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{draft}</p>
          <p className="text-xs text-gray-500 mt-1">In Progress</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{28 - total}</p>
          <p className="text-xs text-gray-500 mt-1">Not Started</p>
          <p className="text-[10px] text-gray-400 mt-0.5">this week</p>
        </div>
      </div>

      {/* Week grid */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Week nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm font-semibold text-gray-800">{weekLabel}</span>
            <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={thisWeek} className="text-xs font-semibold text-brand-600 hover:text-brand-700 px-3 py-1.5 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors">
              This Week
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
            </div>
          ) : (
            <WeekGrid
              monday={monday}
              records={records}
              today={today}
              onCellClick={(date, mealType) => setDrawer({ date, mealType })}
            />
          )}
        </div>
      </div>

      {/* How it works tip */}
      <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3">
        <FileText className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-800">USDA requires production records for every meal service</p>
          <p className="text-xs text-brand-600 mt-0.5">
            Click any cell to log what was prepared. Use <strong>Auto-fill from Menu</strong> to pull items directly from your weekly menu — no re-entering food names.
            Records must be retained for 3 years.
          </p>
        </div>
      </div>

      {/* Drawer */}
      {drawer && (
        <RecordDrawer
          date={drawer.date}
          mealType={drawer.mealType}
          onClose={() => setDrawer(null)}
          onSaved={(rec) => { handleSaved(rec); }}
        />
      )}
    </div>
  );
}
