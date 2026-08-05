// MealOrdersPage.jsx — Deliveries (Task #161)
// Tab 1 — Today's Deliveries: auto-generated daily checklist from delivery schedules
//   • Mark delivered (checkbox)
//   • Change today's quantity (without touching the schedule)
//   • Skip today's delivery
//   • Print delivery slip
//   • Send to kitchen
// Tab 2 — Delivery Schedules: set up recurring templates once, CACFPLink does the rest

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Circle, X, Plus, Layers, Edit2, Trash2,
  PauseCircle, PlayCircle, Printer, Bell, ChevronLeft, ChevronRight,
  Truck, Repeat, Search, Check, SkipForward, RotateCcw,
} from 'lucide-react';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_KEYS = ['breakfast', 'lunch', 'snack', 'supper'];

const MEAL_META = {
  breakfast: { label: 'Breakfast', chip: 'bg-orange-100 text-orange-700 border-orange-200' },
  lunch:     { label: 'Lunch',     chip: 'bg-blue-100 text-blue-700 border-blue-200' },
  snack:     { label: 'Snack',     chip: 'bg-green-100 text-green-700 border-green-200' },
  supper:    { label: 'Supper',    chip: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const DAYS = [
  { key: 'monday',    short: 'Mon' },
  { key: 'tuesday',   short: 'Tue' },
  { key: 'wednesday', short: 'Wed' },
  { key: 'thursday',  short: 'Thu' },
  { key: 'friday',    short: 'Fri' },
  { key: 'saturday',  short: 'Sat' },
  { key: 'sunday',    short: 'Sun' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0];
}

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

function formatDateLong(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function effectiveMeals(d) {
  return MEAL_KEYS.map((k) => ({ key: k, count: d[k] ?? 0 })).filter((m) => m.count > 0);
}

function planMeals(d) {
  // meal types the plan originally schedules (non-zero in plan counts)
  return MEAL_KEYS.map((k) => ({ key: k, plan: d[`plan_${k}`] ?? 0, eff: d[k] ?? 0 }))
    .filter((m) => m.plan > 0);
}

function totalMeals(d) {
  return MEAL_KEYS.reduce((s, k) => s + (d[k] ?? 0), 0);
}

function mealSummaryText(d) {
  return effectiveMeals(d).map((m) => `${MEAL_META[m.key].label} · ${m.count}`).join('  ·  ');
}

// ─── Print Slip ───────────────────────────────────────────────────────────────

function doPrintSlips(deliveries, dateLabel) {
  const byKitchen = {};
  for (const d of deliveries) {
    const key = d.kitchen_name ?? 'No Kitchen Assigned';
    if (!byKitchen[key]) byKitchen[key] = [];
    byKitchen[key].push(d);
  }

  const rows = Object.entries(byKitchen).map(([kitchen, items]) => `
    <div style="page-break-after: always; padding: 32px;">
      <h1 style="font-size:20px;margin:0 0 4px">${kitchen}</h1>
      <p style="color:#666;margin:0 0 24px">${dateLabel}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="border:1px solid #ddd;padding:8px;text-align:left">Site</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left">Meal</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left">Count</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left">Time</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left">Delivered ✓</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((d) => effectiveMeals(d).map((m) => `
            <tr>
              <td style="border:1px solid #ddd;padding:8px">${d.site_name}</td>
              <td style="border:1px solid #ddd;padding:8px">${MEAL_META[m.key].label}</td>
              <td style="border:1px solid #ddd;padding:8px">${m.count}</td>
              <td style="border:1px solid #ddd;padding:8px">${fmt12((d[m.key + '_time'] || d.arrival_time)?.slice(0,5))}</td>
              <td style="border:1px solid #ddd;padding:8px">□</td>
            </tr>
          `).join('')).join('')}
        </tbody>
      </table>
    </div>
  `).join('');

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head>
    <title>Delivery Slips — ${dateLabel}</title>
    <style>body{font-family:Arial,sans-serif;margin:0}@media print{.no-print{display:none}}</style>
  </head><body>
    <div class="no-print" style="padding:16px;background:#f0f0f0">
      <button onclick="window.print()" style="padding:8px 16px;cursor:pointer;font-size:14px">🖨 Print</button>
    </div>
    ${rows}
  </body></html>`);
  w.document.close();
}

// ─── Delivery Row ─────────────────────────────────────────────────────────────

function DeliveryRow({ delivery, onUpdate }) {
  const [editing, setEditing]   = useState(false);
  const [qty, setQty]           = useState({});
  const [saving, setSaving]     = useState(false);
  const [notifying, setNotifying] = useState(false);

  const status       = delivery.status;
  const delivered    = status === 'delivered';
  const skipped      = status === 'skipped';
  const meals        = effectiveMeals(delivery);
  const planMealsArr = planMeals(delivery);

  // per-meal time: use breakfast_time / lunch_time / etc, fallback to arrival_time
  const mealTime = (key) => fmt12((delivery[`${key}_time`] || delivery.arrival_time)?.slice(0, 5));

  const patch = async (body) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/delivery-plans/instances/${delivery.instance_id}`, body);
      onUpdate(delivery.instance_id, data.instance);
    } finally {
      setSaving(false);
    }
  };

  const toggleDelivered = () => {
    patch({ status: delivered ? 'scheduled' : 'delivered' });
  };

  const handleSkip = () => patch({ status: 'skipped' });
  const handleUndoSkip = () => patch({ status: 'scheduled' });

  const startEdit = () => {
    const initial = {};
    planMealsArr.forEach(({ key, eff }) => { initial[key] = eff; });
    setQty(initial);
    setEditing(true);
  };

  const saveQty = async () => {
    setSaving(true);
    try {
      const overrides = {};
      planMealsArr.forEach(({ key, plan }) => {
        const newVal = parseInt(qty[key]) || 0;
        // If user set it back to plan value, clear override (null); otherwise set override
        overrides[`${key}_override`] = newVal === plan ? null : newVal;
      });
      const { data } = await api.patch(`/delivery-plans/instances/${delivery.instance_id}`, overrides);
      onUpdate(delivery.instance_id, { ...delivery, ...rebuildEffective(delivery, overrides) });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Rebuild effective counts from patch response
  function rebuildEffective(d, overrides) {
    const result = {};
    MEAL_KEYS.forEach((k) => {
      const ov = overrides[`${k}_override`];
      result[k] = ov === null ? d[`plan_${k}`] ?? 0 : ov ?? d[k];
    });
    return result;
  }

  if (skipped) {
    return (
      <div className="flex items-center gap-4 py-3 px-4 text-gray-400 border-b border-gray-50 last:border-0">
        <SkipForward className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm line-through truncate">{delivery.site_name}</p>
          <p className="text-xs truncate">{mealSummaryText(delivery)}{delivery.kitchen_name ? `  ·  ${delivery.kitchen_name}` : ''}</p>
        </div>
        <button onClick={handleUndoSkip} className="flex items-center gap-1 text-xs text-brand-600 hover:underline flex-shrink-0">
          <RotateCcw className="w-3 h-3" /> Undo
        </button>
      </div>
    );
  }

  return (
    <div className={`border-b border-gray-50 last:border-0 transition-colors ${delivered ? 'bg-green-50/40' : ''}`}>
      <div className="flex items-start gap-3 py-3.5 px-4">
        {/* Checkbox */}
        <button onClick={toggleDelivered} disabled={saving}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
            delivered ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-brand-400'
          }`}>
          {delivered && <Check className="w-3.5 h-3.5 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${delivered ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {delivery.site_name}
          </p>
          {!editing ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {meals.map((m) => {
                const t = mealTime(m.key);
                return (
                  <span key={m.key} className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${MEAL_META[m.key].chip}`}>
                    {MEAL_META[m.key].label} · {m.count}{t ? `  ·  ${t}` : ''}
                  </span>
                );
              })}
              {delivery.kitchen_name && (
                <span className="text-xs text-gray-400 self-center">from {delivery.kitchen_name}</span>
              )}
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's quantities</p>
              <div className="flex flex-wrap gap-3">
                {planMealsArr.map(({ key }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-gray-600">{MEAL_META[key].label}</label>
                    <input type="number" min="0" value={qty[key] ?? 0}
                      onChange={(e) => setQty((q) => ({ ...q, [key]: e.target.value }))}
                      className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center font-bold focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={saveQty} disabled={saving}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {delivered && (
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-lg">Delivered</span>
          )}
          {!delivered && !editing && (
            <div className="flex gap-1">
              <button onClick={startEdit} title="Change today's quantity"
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Edit quantity">
                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button onClick={handleSkip} disabled={saving} title="Skip today's delivery"
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" aria-label="Skip">
                <SkipForward className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Today's Deliveries Tab ───────────────────────────────────────────────────

function TodayDeliveriesTab({ date, onDateChange }) {
  const [deliveries, setDeliveries]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [notifyingAll, setNotifyingAll] = useState(false);
  const [notifyDone, setNotifyDone]   = useState(false);
  const [nextDate, setNextDate]       = useState(null); // nearest future delivery date

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/delivery-plans/today?date=${date}`)
      .then(({ data }) => setDeliveries(data.deliveries ?? []))
      .catch(() => setDeliveries([]))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { load(); }, [load]);

  // When no deliveries today, find the next date that has a scheduled delivery
  useEffect(() => {
    if (loading || deliveries.length > 0) { setNextDate(null); return; }
    api.get('/delivery-plans').then(({ data }) => {
      const plans = (data.plans ?? []).filter((p) => p.active);
      if (!plans.length) { setNextDate(null); return; }

      const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const cur = new Date(date + 'T00:00:00');

      // Search up to 60 days ahead for the nearest match
      for (let i = 1; i <= 60; i++) {
        const d = new Date(cur); d.setDate(d.getDate() + i);
        const dayName = DAY_KEYS[d.getDay()];
        const iso = d.toISOString().split('T')[0];
        const hit = plans.find((p) => {
          const start = p.start_date?.slice(0,10) ?? '0000-00-00';
          const end   = p.end_date?.slice(0,10)   ?? '9999-12-31';
          return iso >= start && iso <= end && (p.days_of_week ?? []).includes(dayName);
        });
        if (hit) { setNextDate(iso); return; }
      }
      setNextDate(null);
    }).catch(() => setNextDate(null));
  }, [loading, deliveries.length, date]);

  const handleUpdate = (instanceId, updated) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.instance_id === instanceId ? { ...d, ...updated, status: updated?.status ?? d.status } : d
      )
    );
  };

  const notifyAllKitchens = async () => {
    const kitchenIds = [...new Set(deliveries.filter((d) => d.kitchen_id && d.status !== 'skipped').map((d) => d.kitchen_id))];
    if (!kitchenIds.length) return;
    setNotifyingAll(true);
    try {
      await Promise.all(kitchenIds.map((kid) => api.post('/delivery-plans/notify-kitchen', { kitchen_id: kid, date })));
      setNotifyDone(true);
      setTimeout(() => setNotifyDone(false), 3000);
    } finally {
      setNotifyingAll(false);
    }
  };

  const active  = deliveries.filter((d) => d.status !== 'skipped');
  const skipped = deliveries.filter((d) => d.status === 'skipped');
  const done    = active.filter((d) => d.status === 'delivered').length;
  const total   = deliveries.length;
  const totalM  = active.reduce((s, d) => s + totalMeals(d), 0);
  const todayStr = today();
  const isToday  = date === todayStr;

  if (loading) {
    return <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (deliveries.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-brand-300" />
        </div>
        <p className="font-bold text-gray-700 mb-1">
          {isToday ? 'No deliveries scheduled for today' : `No deliveries on ${formatDateLong(date)}`}
        </p>
        {nextDate ? (
          <div className="mt-3">
            <p className="text-sm text-gray-500 mb-3">
              Your next scheduled delivery is <span className="font-semibold text-gray-700">{formatDateLong(nextDate)}</span>.
            </p>
            <button onClick={() => onDateChange(nextDate)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Jump to {formatDateLong(nextDate)} →
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
            Deliveries are generated automatically from your delivery schedules. Set one up to get started.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Summary + actions bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {done}/{total} delivered · {totalM} total meals
          </p>
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(done / total) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-400">{Math.round((done / total) * 100)}%</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => doPrintSlips(active, formatDateLong(date))}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print Slips
          </button>
          <button onClick={notifyAllKitchens} disabled={notifyingAll}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
              notifyDone
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <Bell className="w-3.5 h-3.5" />
            {notifyDone ? 'Sent ✓' : notifyingAll ? 'Sending…' : 'Notify Kitchens'}
          </button>
        </div>
      </div>

      {/* Delivery checklist */}
      <div className="card overflow-hidden divide-y divide-gray-50">
        {active.map((d) => (
          <DeliveryRow key={d.instance_id} delivery={d} onUpdate={handleUpdate} />
        ))}
      </div>

      {/* Skipped */}
      {skipped.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skipped ({skipped.length})</p>
          <div className="card overflow-hidden">
            {skipped.map((d) => (
              <DeliveryRow key={d.instance_id} delivery={d} onUpdate={handleUpdate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Delivery Schedules: Plan Modal ───────────────────────────────────────────

function PlanModal({ onClose, onSaved, editPlan }) {
  const [sites,    setSites]    = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [form, setForm] = useState({
    site_id:        editPlan?.site_id             ?? '',
    kitchen_id:     editPlan?.kitchen_id          ?? '',
    name:           editPlan?.name                ?? '',
    days_of_week:   editPlan?.days_of_week        ?? [],
    breakfast:      editPlan?.breakfast           ?? 0,
    lunch:          editPlan?.lunch               ?? 0,
    snack:          editPlan?.snack               ?? 0,
    supper:         editPlan?.supper              ?? 0,
    breakfast_time: editPlan?.breakfast_time?.slice(0,5) ?? '',
    lunch_time:     editPlan?.lunch_time?.slice(0,5)     ?? '',
    snack_time:     editPlan?.snack_time?.slice(0,5)     ?? '',
    supper_time:    editPlan?.supper_time?.slice(0,5)    ?? '',
    start_date:     editPlan?.start_date          ?? new Date().toISOString().split('T')[0],
    end_date:       editPlan?.end_date            ?? '',
    auto_notify:    editPlan?.auto_notify         ?? true,
  });

  useEffect(() => {
    Promise.all([
      api.get('/organizations?type=site&limit=200'),
      api.get('/organizations?type=kitchen&limit=200'),
    ]).then(([sRes, kRes]) => {
      setSites(sRes.data?.organizations ?? []);
      setKitchens(kRes.data?.organizations ?? []);
    }).catch(() => {});
  }, []);

  const toggleDay = (day) => setForm((f) => ({
    ...f,
    days_of_week: f.days_of_week.includes(day)
      ? f.days_of_week.filter((d) => d !== day)
      : [...f.days_of_week, day],
  }));

  const totalMealsForm = Number(form.breakfast) + Number(form.lunch) + Number(form.snack) + Number(form.supper);

  const handleSave = async () => {
    if (!form.site_id)             return setError('Select a site.');
    if (!form.days_of_week.length) return setError('Select at least one day.');
    if (totalMealsForm === 0)      return setError('Add at least one meal count.');
    setError(''); setSaving(true);
    try {
      if (editPlan) {
        await api.patch(`/delivery-plans/${editPlan.id}`, form);
      } else {
        await api.post('/delivery-plans', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to save schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-bold text-gray-900">{editPlan ? 'Edit Schedule' : 'New Delivery Schedule'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Site</label>
            <select value={form.site_id} onChange={(e) => setForm((f) => ({ ...f, site_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent">
              <option value="">Select a site…</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kitchen (optional)</label>
            <select value={form.kitchen_id} onChange={(e) => setForm((f) => ({ ...f, kitchen_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent">
              <option value="">No kitchen assigned</option>
              {kitchens.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Schedule Name (optional)</label>
            <input type="text" placeholder="e.g. Weekday Lunch" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Delivery Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(({ key, short }) => (
                <button key={key} type="button" onClick={() => toggleDay(key)}
                  className={`w-12 h-10 rounded-xl text-xs font-bold transition-colors ${
                    form.days_of_week.includes(key) ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>{short}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Meals Per Delivery</label>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 font-semibold">
                    <th className="text-left px-3 py-2">Meal</th>
                    <th className="text-left px-3 py-2">Count</th>
                    <th className="text-left px-3 py-2">Arrival Time</th>
                  </tr>
                </thead>
                <tbody>
                  {MEAL_KEYS.map((key, i) => (
                    <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-2 font-medium text-gray-700">
                        {MEAL_META[key].label}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={form[key]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="time" value={form[`${key}_time`] || ''}
                          onChange={(e) => setForm((f) => ({ ...f, [`${key}_time`]: e.target.value }))}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalMealsForm > 0 && <p className="text-xs text-brand-600 font-semibold mt-2">{totalMealsForm} meals per delivery</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date (optional)</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.auto_notify}
              onChange={(e) => setForm((f) => ({ ...f, auto_notify: e.target.checked }))}
              className="w-4 h-4 accent-brand-600" />
            <div>
              <p className="text-sm font-medium text-gray-800">Notify site &amp; kitchen automatically each morning</p>
            </div>
          </label>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
              {saving ? 'Saving…' : editPlan ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delivery Schedules: Bulk Wizard ──────────────────────────────────────────

function BulkWizardModal({ onClose, onSaved }) {
  const [sites, setSites]       = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [search, setSearch]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm] = useState({
    kitchen_id: '', selected_sites: [], days_of_week: [],
    breakfast: 0, lunch: 0, snack: 0, supper: 0,
    breakfast_time: '', lunch_time: '', snack_time: '', supper_time: '',
    start_date: new Date().toISOString().split('T')[0], end_date: '', auto_notify: true,
  });

  useEffect(() => {
    Promise.all([
      api.get('/organizations?type=site&limit=200'),
      api.get('/organizations?type=kitchen&limit=200'),
    ]).then(([sRes, kRes]) => {
      setSites(sRes.data?.organizations ?? []);
      setKitchens(kRes.data?.organizations ?? []);
    }).catch(() => {});
  }, []);

  const filteredSites = sites.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const toggleDay  = (day) => setForm((f) => ({ ...f, days_of_week: f.days_of_week.includes(day) ? f.days_of_week.filter((d) => d !== day) : [...f.days_of_week, day] }));
  const toggleSite = (id)  => setForm((f) => ({ ...f, selected_sites: f.selected_sites.includes(id) ? f.selected_sites.filter((s) => s !== id) : [...f.selected_sites, id] }));
  const selectAll  = ()    => setForm((f) => ({ ...f, selected_sites: filteredSites.map((s) => s.id) }));
  const clearAll   = ()    => setForm((f) => ({ ...f, selected_sites: [] }));
  const totalMealsForm = MEAL_KEYS.reduce((s, k) => s + Number(form[k]), 0);
  const n = form.selected_sites.length;

  const handleSave = async () => {
    if (!n)                        return setError('Select at least one site.');
    if (!form.days_of_week.length) return setError('Select at least one day.');
    if (totalMealsForm === 0)      return setError('Add at least one meal count.');
    setError(''); setSaving(true);
    try {
      await api.post('/delivery-plans/bulk', {
        site_ids: form.selected_sites, kitchen_id: form.kitchen_id || undefined,
        days_of_week: form.days_of_week,
        breakfast: Number(form.breakfast), lunch: Number(form.lunch),
        snack: Number(form.snack), supper: Number(form.supper),
        breakfast_time: form.breakfast_time || undefined,
        lunch_time:     form.lunch_time     || undefined,
        snack_time:     form.snack_time     || undefined,
        supper_time:    form.supper_time    || undefined,
        start_date: form.start_date, end_date: form.end_date || undefined,
        auto_notify: form.auto_notify,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create schedules.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Layers className="w-4 h-4 text-brand-600" /> Bulk Create Schedules</h2>
            <p className="text-xs text-gray-400 mt-0.5">Set up once — applies to all selected sites</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">1 — Kitchen (optional)</label>
            <select value={form.kitchen_id} onChange={(e) => setForm((f) => ({ ...f, kitchen_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent">
              <option value="">No kitchen assigned</option>
              {kitchens.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">2 — Sites ({n} selected)</label>
              <div className="flex gap-2 text-xs">
                <button onClick={selectAll} className="text-brand-600 hover:underline font-semibold">Select all</button>
                <span className="text-gray-300">·</span>
                <button onClick={clearAll} className="text-gray-400 hover:underline">Clear</button>
              </div>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input type="text" placeholder="Search sites…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
            </div>
            <div className="border border-gray-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-gray-50">
              {filteredSites.map((s) => {
                const checked = form.selected_sites.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={() => toggleSite(s.id)} className="w-4 h-4 accent-brand-600" />
                    <span className="text-sm text-gray-800">{s.name}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-brand-500 ml-auto" />}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">3 — Delivery Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(({ key, short }) => (
                <button key={key} type="button" onClick={() => toggleDay(key)}
                  className={`w-12 h-10 rounded-xl text-xs font-bold transition-colors ${form.days_of_week.includes(key) ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {short}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Start Date</label>
            <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">4 — Meals Per Delivery (per site)</label>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 font-semibold">
                    <th className="text-left px-3 py-2">Meal</th>
                    <th className="text-left px-3 py-2">Count</th>
                    <th className="text-left px-3 py-2">Arrival Time</th>
                  </tr>
                </thead>
                <tbody>
                  {MEAL_KEYS.map((key, i) => (
                    <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-2 font-medium text-gray-700">
                        {MEAL_META[key].label}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={form[key]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="time" value={form[`${key}_time`] || ''}
                          onChange={(e) => setForm((f) => ({ ...f, [`${key}_time`]: e.target.value }))}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
            {saving ? 'Creating…' : n > 0 ? `Create ${n} Schedule${n !== 1 ? 's' : ''}` : 'Create Schedules'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delivery Schedules: Plan Card ────────────────────────────────────────────

function DayBadges({ days }) {
  return (
    <div className="flex gap-1">
      {DAYS.map(({ key, short }) => (
        <span key={key} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
          days.includes(key) ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-300'
        }`}>{short}</span>
      ))}
    </div>
  );
}

function PlanCard({ plan, onEdit, onToggle, onDelete, deleting }) {
  const totalM = MEAL_KEYS.reduce((s, k) => s + (plan[k] ?? 0), 0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className={`card px-5 py-4 ${!plan.active ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-bold text-gray-900">{plan.site_name}</p>
            {plan.name && <span className="text-xs text-gray-400">· {plan.name}</span>}
            {!plan.active && <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Paused</span>}
          </div>
          {plan.kitchen_name && <p className="text-xs text-gray-500 mb-2">From {plan.kitchen_name}</p>}
          <DayBadges days={plan.days_of_week} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-2">
            {MEAL_KEYS.filter((k) => plan[k] > 0).map((k) => {
              const t = fmt12(plan[`${k}_time`]?.slice(0, 5));
              return (
                <span key={k}>
                  {MEAL_META[k].label[0]}:{plan[k]}{t ? ` · ${t}` : ''}
                </span>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {String(plan.start_date).slice(0,10)}{plan.end_date ? ` → ${String(plan.end_date).slice(0,10)}` : ' · ongoing'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-400" /></button>
          <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-lg">
            {plan.active ? <PauseCircle className="w-4 h-4 text-yellow-500" /> : <PlayCircle className="w-4 h-4 text-green-500" />}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-600 font-semibold">Delete schedule?</span>
              <button onClick={() => { setConfirmDelete(false); onDelete(); }} disabled={deleting}
                className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg">
                {deleting ? '…' : 'Yes'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="p-2 hover:bg-red-50 rounded-lg" title="Delete schedule">
              <Trash2 className={`w-4 h-4 ${deleting ? 'text-gray-300' : 'text-red-400'}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Delivery Schedules Tab ───────────────────────────────────────────────────

function DeliverySchedulesTab() {
  const [plans,     setPlans]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulk,  setShowBulk]  = useState(false);
  const [editPlan,  setEditPlan]  = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/delivery-plans')
      .then(({ data }) => setPlans(data.plans ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleToggle = async (plan) => {
    await api.patch(`/delivery-plans/${plan.id}`, { active: !plan.active });
    load();
  };
  const handleDelete = async (plan) => {
    setDeleting(plan.id);
    await api.delete(`/delivery-plans/${plan.id}`);
    setDeleting(null);
    load();
  };

  const active   = plans.filter((p) => p.active);
  const paused   = plans.filter((p) => !p.active);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">Each schedule auto-generates a daily checklist. Set it once — done.</p>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 px-3 py-2 border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-semibold rounded-xl">
            <Layers className="w-4 h-4" /> Bulk Create
          </button>
          <button onClick={() => { setEditPlan(null); setShowModal(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl">
            <Plus className="w-4 h-4" /> New Schedule
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : plans.length === 0 ? (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl px-6 py-8 text-center">
          <Repeat className="w-8 h-8 text-brand-400 mx-auto mb-3" />
          <p className="font-semibold text-brand-900 mb-1">No schedules yet</p>
          <p className="text-sm text-brand-700 mb-4">Set up a schedule once and CACFPLink generates your daily checklist automatically.</p>
          <button onClick={() => { setEditPlan(null); setShowModal(true); }}
            className="text-sm font-bold text-brand-700 hover:underline">Create your first schedule →</button>
        </div>
      ) : (
        <>
          {active.length > 0 && <div className="space-y-3 mb-6">{active.map((plan) => (
            <PlanCard key={plan.id} plan={plan}
              onEdit={() => { setEditPlan(plan); setShowModal(true); }}
              onToggle={() => handleToggle(plan)}
              onDelete={() => handleDelete(plan)}
              deleting={deleting === plan.id} />
          ))}</div>}
          {paused.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Paused</p>
              <div className="space-y-3">{paused.map((plan) => (
                <PlanCard key={plan.id} plan={plan}
                  onEdit={() => { setEditPlan(plan); setShowModal(true); }}
                  onToggle={() => handleToggle(plan)}
                  onDelete={() => handleDelete(plan)}
                  deleting={deleting === plan.id} />
              ))}</div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <PlanModal editPlan={editPlan}
          onClose={() => { setShowModal(false); setEditPlan(null); }}
          onSaved={() => { setShowModal(false); setEditPlan(null); load(); }} />
      )}
      {showBulk && (
        <BulkWizardModal onClose={() => setShowBulk(false)} onSaved={() => { setShowBulk(false); load(); }} />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MealOrdersPage() {
  const [activeTab, setActiveTab] = useState('today');   // 'today' | 'schedules'
  const [date, setDate]           = useState(today());

  const prevDay = () => setDate((d) => addDays(d, -1));
  const nextDay = () => setDate((d) => addDays(d, 1));
  const goToday = () => setDate(today());

  const isToday = date === today();
  const dateLabel = formatDateLong(date);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeTab === 'today'
                ? 'Check off deliveries as they go out.'
                : 'Recurring schedules auto-generate your daily checklist.'}
            </p>
          </div>
          {activeTab === 'schedules' && (
            <button
              onClick={() => setActiveTab('schedules')}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Schedule
            </button>
          )}
        </div>

        {/* Date nav — only visible on Today's Deliveries tab */}
        {activeTab === 'today' && (
          <div className="flex items-center gap-3">
            <button onClick={prevDay} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold ${isToday ? 'text-brand-700' : 'text-gray-800'}`}>
                {isToday ? 'Today — ' : ''}{dateLabel}
              </span>
              {!isToday && (
                <button onClick={goToday} className="text-xs text-brand-600 hover:underline font-semibold">Back to today</button>
              )}
            </div>
            <button onClick={nextDay} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'today',     label: "Today's Deliveries", icon: CheckCircle },
          { key: 'schedules', label: 'Delivery Schedules', icon: Repeat },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'today'
        ? <TodayDeliveriesTab date={date} onDateChange={setDate} />
        : <DeliverySchedulesTab />
      }
    </div>
  );
}
