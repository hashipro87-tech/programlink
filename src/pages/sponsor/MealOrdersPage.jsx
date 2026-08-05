// MealOrdersPage.jsx — Unified Deliveries page (Task #160)
// One nav item. Two tabs: Scheduled Routes (recurring) + One-Time Deliveries.
// "Add Delivery" asks "How often?" and routes to the right flow.

import { useState, useEffect } from 'react';
import {
  Plus, Truck, X, ChefHat, Building2, Calendar,
  CheckCircle, Clock, AlertTriangle, ChevronRight,
  Edit2, Trash2, PauseCircle, PlayCircle, Layers, Search, Repeat,
} from 'lucide-react';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', plural: 'Breakfasts' },
  { value: 'am_snack',  label: 'AM Snack',  plural: 'AM Snacks' },
  { value: 'lunch',     label: 'Lunch',     plural: 'Lunches' },
  { value: 'pm_snack',  label: 'PM Snack',  plural: 'PM Snacks' },
  { value: 'dinner',    label: 'Dinner',    plural: 'Dinners' },
];

const STATUS_CFG = {
  pending:   { label: 'Pending',   color: 'text-yellow-600' },
  prepping:  { label: 'Prepping',  color: 'text-blue-600' },
  ready:     { label: 'Ready',     color: 'text-indigo-600' },
  picked_up: { label: 'Picked up', color: 'text-purple-600' },
  delivered: { label: 'Delivered', color: 'text-green-600' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400' },
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

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function dateLabel(iso) {
  if (!iso) return '—';
  const s = String(iso).slice(0, 10);
  const t = today();
  const tm = tomorrow();
  if (s === t)  return 'Today';
  if (s === tm) return 'Tomorrow';
  return new Date(s + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

function fmt12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function mealLabel(value) {
  return MEAL_TYPES.find((m) => m.value === value)?.label ?? value;
}

function mealPlural(value) {
  return MEAL_TYPES.find((m) => m.value === value)?.plural ?? (mealLabel(value) + 's');
}

function mealSummary(plan) {
  const parts = [];
  if (plan.breakfast > 0) parts.push(`B:${plan.breakfast}`);
  if (plan.lunch     > 0) parts.push(`L:${plan.lunch}`);
  if (plan.snack     > 0) parts.push(`Snk:${plan.snack}`);
  if (plan.supper    > 0) parts.push(`S:${plan.supper}`);
  return parts.join(' · ') || '—';
}

function dayBadges(days) {
  return DAYS.map(({ key, short }) => (
    <span key={key} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
      days.includes(key) ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-300'
    }`}>
      {short}
    </span>
  ));
}

function groupByDateKitchen(routes) {
  const map = {};
  for (const route of routes) {
    const d = String(route.date ?? 'unknown').slice(0, 10);
    if (!map[d]) map[d] = {};
    const kid = route.delivery_provider_id ?? 'unknown';
    if (!map[d][kid]) {
      map[d][kid] = { kitchenId: kid, kitchenName: route.kitchen_name ?? 'Kitchen', routes: [] };
    }
    map[d][kid].routes.push(route);
  }
  const sorted = Object.keys(map).sort((a, b) => a.localeCompare(b));
  return sorted.map((date) => ({
    date,
    label:    dateLabel(date),
    kitchens: Object.values(map[date]).sort((a, b) => a.kitchenName.localeCompare(b.kitchenName)),
  }));
}

// ─── One-Time: Stop Row ────────────────────────────────────────────────────────

function StopRow({ stop, status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const isDone = status === 'delivered';
  return (
    <div className={`flex items-center gap-3 py-2.5 px-4 rounded-xl transition-colors ${isDone ? 'opacity-60' : 'hover:bg-gray-50'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-green-100' : 'bg-gray-100'}`}>
        <CheckCircle className={`w-3.5 h-3.5 ${isDone ? 'text-green-500' : 'text-gray-300'}`} />
      </div>
      <span className={`text-sm font-semibold flex-1 min-w-0 truncate ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
        {stop.site_name ?? 'Site'}
      </span>
      <span className="text-sm text-gray-700 font-medium flex-shrink-0">
        {stop.meal_count} {stop.meal_count === 1 ? mealLabel(stop.meal_type) : mealPlural(stop.meal_type)}
      </span>
      {stop.pickup_time && (
        <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">
          Pickup {fmt12(stop.pickup_time)}
        </span>
      )}
      <span className={`text-xs font-semibold flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
}

function KitchenCard({ kitchenName, routes }) {
  const allStops = routes.flatMap((r) => (r.stops ?? []).map((s) => ({ ...s, status: r.status })));
  const totalMeals = allStops.reduce((sum, s) => sum + (s.meal_count || 0), 0);
  const allDone = routes.every((r) => r.status === 'delivered');
  return (
    <div className={`border rounded-2xl overflow-hidden transition-opacity ${allDone ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}>
      <div className={`px-4 py-3 flex items-center gap-3 ${allDone ? 'bg-gray-50' : 'bg-white'}`}>
        <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-4 h-4 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{kitchenName}</p>
          <p className="text-xs text-gray-400">{allStops.length} site{allStops.length !== 1 ? 's' : ''} · {totalMeals} meals total</p>
        </div>
        {allDone && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">All delivered</span>
        )}
      </div>
      <div className="border-t border-gray-100" />
      <div className="bg-white px-2 py-1.5 space-y-0.5">
        {allStops.map((stop, i) => <StopRow key={i} stop={stop} status={stop.status} />)}
      </div>
    </div>
  );
}

function DateSection({ label, kitchens, isToday, isTomorrow }) {
  const totalMeals = kitchens.flatMap((k) => k.routes.flatMap((r) => r.stops ?? []))
    .reduce((sum, s) => sum + (s.meal_count || 0), 0);
  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className={`text-lg font-bold ${isToday ? 'text-brand-700' : isTomorrow ? 'text-gray-900' : 'text-gray-700'}`}>
          {label}
        </h2>
        <span className="text-sm text-gray-400">
          {totalMeals} meal{totalMeals !== 1 ? 's' : ''} across {kitchens.length} kitchen{kitchens.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {kitchens.map((k) => <KitchenCard key={k.kitchenId} kitchenName={k.kitchenName} routes={k.routes} />)}
      </div>
    </div>
  );
}

// ─── Scheduled Routes: Plan Modal ─────────────────────────────────────────────

function PlanModal({ onClose, onSaved, editPlan }) {
  const [sites, setSites]     = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm] = useState({
    site_id:      editPlan?.site_id      ?? '',
    kitchen_id:   editPlan?.kitchen_id   ?? '',
    name:         editPlan?.name         ?? '',
    days_of_week: editPlan?.days_of_week ?? [],
    arrival_time: editPlan?.arrival_time?.slice(0,5) ?? '09:00',
    breakfast:    editPlan?.breakfast    ?? 0,
    lunch:        editPlan?.lunch        ?? 0,
    snack:        editPlan?.snack        ?? 0,
    supper:       editPlan?.supper       ?? 0,
    start_date:   editPlan?.start_date   ?? new Date().toISOString().split('T')[0],
    end_date:     editPlan?.end_date     ?? '',
    auto_notify:  editPlan?.auto_notify  ?? true,
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

  const totalMeals = Number(form.breakfast) + Number(form.lunch) + Number(form.snack) + Number(form.supper);

  const handleSave = async () => {
    if (!form.site_id)             return setError('Select a site.');
    if (!form.days_of_week.length) return setError('Select at least one day.');
    if (totalMeals === 0)          return setError('Add at least one meal count.');
    setError(''); setSaving(true);
    try {
      if (editPlan) {
        await api.patch(`/delivery-plans/${editPlan.id}`, form);
      } else {
        await api.post('/delivery-plans', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to save plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-bold text-gray-900">{editPlan ? 'Edit Scheduled Route' : 'New Scheduled Route'}</h2>
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
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Route Name (optional)</label>
            <input type="text" placeholder="e.g. Weekday Lunch Route" value={form.name}
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
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Arrival Time</label>
            <input type="time" value={form.arrival_time}
              onChange={(e) => setForm((f) => ({ ...f, arrival_time: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Meals Per Delivery</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ key: 'breakfast', label: 'Breakfast' }, { key: 'lunch', label: 'Lunch' }, { key: 'snack', label: 'Snack' }, { key: 'supper', label: 'Supper' }].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input type="number" min="0" value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                </div>
              ))}
            </div>
            {totalMeals > 0 && <p className="text-xs text-brand-600 font-semibold mt-2">{totalMeals} total meals per delivery</p>}
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
              <p className="text-sm font-medium text-gray-800">Automatically notify site & kitchen</p>
              <p className="text-xs text-gray-400">Sites and kitchens receive a notification each morning deliveries are scheduled</p>
            </div>
          </label>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : editPlan ? 'Save Changes' : 'Create Route'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scheduled Routes: Bulk Wizard ────────────────────────────────────────────

function BulkWizardModal({ onClose, onSaved }) {
  const [sites, setSites]       = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [search, setSearch]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm] = useState({
    kitchen_id: '', selected_sites: [], days_of_week: [],
    arrival_time: '09:00', breakfast: 0, lunch: 0, snack: 0, supper: 0,
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
  const totalMeals = Number(form.breakfast) + Number(form.lunch) + Number(form.snack) + Number(form.supper);
  const n = form.selected_sites.length;

  const handleSave = async () => {
    if (!n)                        return setError('Select at least one site.');
    if (!form.days_of_week.length) return setError('Select at least one day.');
    if (totalMeals === 0)          return setError('Add at least one meal count.');
    setError(''); setSaving(true);
    try {
      await api.post('/delivery-plans/bulk', {
        site_ids: form.selected_sites, kitchen_id: form.kitchen_id || undefined,
        days_of_week: form.days_of_week, arrival_time: form.arrival_time,
        breakfast: Number(form.breakfast), lunch: Number(form.lunch),
        snack: Number(form.snack), supper: Number(form.supper),
        start_date: form.start_date, end_date: form.end_date || undefined,
        auto_notify: form.auto_notify,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create routes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" /> Bulk Create Routes
            </h2>
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
              {filteredSites.length === 0
                ? <p className="px-4 py-3 text-xs text-gray-400 text-center">No sites found</p>
                : filteredSites.map((s) => {
                  const checked = form.selected_sites.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => toggleSite(s.id)} className="w-4 h-4 accent-brand-600" />
                      <span className="text-sm text-gray-800">{s.name}</span>
                      {checked && <CheckCircle className="w-3.5 h-3.5 text-brand-500 ml-auto" />}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">4 — Arrival Time</label>
              <input type="time" value={form.arrival_time} onChange={(e) => setForm((f) => ({ ...f, arrival_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">5 — Meals Per Delivery (per site)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{ key: 'breakfast', label: 'Breakfast' }, { key: 'lunch', label: 'Lunch' }, { key: 'snack', label: 'Snack' }, { key: 'supper', label: 'Supper' }].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input type="number" min="0" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                </div>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.auto_notify} onChange={(e) => setForm((f) => ({ ...f, auto_notify: e.target.checked }))} className="w-4 h-4 accent-brand-600" />
            <span className="text-sm text-gray-700">Automatically notify sites and kitchen each morning</span>
          </label>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {saving ? 'Creating…' : n > 0 ? `Create ${n} Scheduled Route${n !== 1 ? 's' : ''}` : 'Create Routes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Scheduled Routes: Plan Card ──────────────────────────────────────────────

function PlanCard({ plan, onEdit, onToggle, onDelete, deleting }) {
  const totalMeals = plan.breakfast + plan.lunch + plan.snack + plan.supper;
  return (
    <div className={`card px-5 py-4 ${!plan.active ? 'border-gray-100' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-gray-900">{plan.site_name}</p>
            {plan.name && <span className="text-xs text-gray-400 font-medium">· {plan.name}</span>}
            {!plan.active && <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Paused</span>}
          </div>
          {plan.kitchen_name && <p className="text-xs text-gray-500 mb-2">From {plan.kitchen_name}</p>}
          <div className="flex gap-1 mb-3 flex-wrap">{dayBadges(plan.days_of_week)}</div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" />{fmt12(plan.arrival_time?.slice(0,5))}</div>
            <div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-gray-400" />{totalMeals} meals · {mealSummary(plan)}</div>
            {plan.auto_notify && <div className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3.5 h-3.5" />Auto-notify</div>}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {String(plan.start_date).slice(0,10)}{plan.end_date ? ` → ${String(plan.end_date).slice(0,10)}` : ' → ongoing'}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} title="Edit" className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-gray-400" /></button>
          <button onClick={onToggle} title={plan.active ? 'Pause' : 'Resume'} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {plan.active ? <PauseCircle className="w-4 h-4 text-yellow-500" /> : <PlayCircle className="w-4 h-4 text-green-500" />}
          </button>
          <button onClick={onDelete} disabled={deleting} title="Delete" className="p-2 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className={`w-4 h-4 ${deleting ? 'text-gray-300' : 'text-red-400'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Delivery Modal — with "How often?" step 0 ────────────────────────────

const EMPTY_ROUTE = {
  site_id: '', meal_count: '', meal_type: 'lunch',
  date: tomorrow(), kitchen_id: '', pickup_time: '',
};

function AddDeliveryModal({ kitchens, sites, onClose, onCreated, onSwitchToScheduled }) {
  const [mode,   setMode]   = useState('');        // '' | 'once' | 'recurring'
  const [form,   setForm]   = useState(EMPTY_ROUTE);
  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const selectedSite    = sites.find((s) => s.id === form.site_id);
  const selectedKitchen = kitchens.find((k) => k.id === form.kitchen_id);
  const canNext   = form.site_id && form.meal_count && Number(form.meal_count) > 0;
  const canSubmit = canNext && form.kitchen_id && form.date;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true); setError('');
    const payload = {
      delivery_provider_id: form.kitchen_id,
      date: form.date,
      stops: [{
        order: 1, site_id: form.site_id,
        site_name: selectedSite?.name ?? 'Site',
        meal_type: form.meal_type,
        meal_label: mealLabel(form.meal_type),
        meal_count: Number(form.meal_count),
        pickup_time: form.pickup_time || null,
        confirmed: false,
      }],
      _kitchen_name: selectedKitchen?.name ?? 'Kitchen',
    };
    try {
      const { data } = await api.post('/delivery/routes', payload);
      onCreated({ ...data.route, kitchen_name: selectedKitchen?.name ?? 'Kitchen' });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Step 0 — How often?
  if (!mode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Add Delivery</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">How often?</p>
            <div className="space-y-3">
              <button
                onClick={() => setMode('once')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-brand-400 hover:bg-brand-50 rounded-2xl transition-colors text-left group"
              >
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-gray-500 group-hover:text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">One time</p>
                  <p className="text-xs text-gray-400 mt-0.5">A single delivery on a specific date</p>
                </div>
              </button>
              <button
                onClick={() => { onClose(); onSwitchToScheduled(); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-brand-400 hover:bg-brand-50 rounded-2xl transition-colors text-left group"
              >
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Repeat className="w-5 h-5 text-gray-500 group-hover:text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Recurring schedule</p>
                  <p className="text-xs text-gray-400 mt-0.5">Repeats automatically — Mon–Fri, weekly, etc.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Steps 1 & 2 — one-time flow
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">One-Time Delivery</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex gap-1.5 mt-3">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-brand-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-1">Who needs meals?</p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Site <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={form.site_id} onChange={set('site_id')} autoFocus
                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none">
                    <option value="">Select a site…</option>
                    {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">How many meals? <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input type="number" min="1" value={form.meal_count} onChange={set('meal_count')} placeholder="100"
                    className="w-28 px-3 py-3 border border-gray-300 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <select value={form.meal_type} onChange={set('meal_type')}
                    className="flex-1 px-3 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                    {MEAL_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                {form.site_id && form.meal_count && (
                  <p className="text-xs text-brand-600 mt-2 font-medium">
                    {selectedSite?.name} needs {form.meal_count} {mealPlural(form.meal_type).toLowerCase()}
                  </p>
                )}
              </div>
              <button type="button" disabled={!canNext} onClick={() => setStep(2)}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-40 text-sm mt-2 flex items-center justify-center gap-2">
                Next — When & Who's delivering <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-brand-800">
                  {selectedSite?.name} · {form.meal_count} {mealPlural(form.meal_type).toLowerCase()}
                </p>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-brand-600 hover:underline mt-0.5">Change</button>
              </div>
              <p className="text-sm font-semibold text-gray-700">When & who's delivering?</p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Delivery Date <span className="text-red-500">*</span></label>
                <div className="flex gap-2 mb-2">
                  {[{ label: 'Today', value: today() }, { label: 'Tomorrow', value: tomorrow() }].map(({ label, value }) => (
                    <button key={value} type="button" onClick={() => setForm((f) => ({ ...f, date: value }))}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                        form.date === value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}>{label}</button>
                  ))}
                </div>
                <input type="date" value={form.date} onChange={set('date')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Kitchen <span className="text-red-500">*</span></label>
                <div className="relative">
                  <ChefHat className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={form.kitchen_id} onChange={set('kitchen_id')}
                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none">
                    <option value="">Which kitchen is making this?</option>
                    {kitchens.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Pickup Time <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input type="time" value={form.pickup_time} onChange={set('pickup_time')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Back</button>
                <button type="submit" disabled={saving || !canSubmit}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add Delivery'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Scheduled Routes Tab ─────────────────────────────────────────────────────

function ScheduledRoutesTab({ openPlanModal }) {
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
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

  // openPlanModal prop lets the parent (Add Delivery → Recurring) trigger new plan modal
  useEffect(() => {
    if (openPlanModal) { setEditPlan(null); setShowModal(true); }
  }, [openPlanModal]);

  const handleToggleActive = async (plan) => {
    await api.patch(`/delivery-plans/${plan.id}`, { active: !plan.active });
    load();
  };

  const handleDelete = async (plan) => {
    setDeleting(plan.id);
    await api.delete(`/delivery-plans/${plan.id}`);
    setDeleting(null);
    load();
  };

  const activePlans   = plans.filter((p) => p.active);
  const inactivePlans = plans.filter((p) => !p.active);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">Repeating deliveries CACFPLink handles automatically every day.</p>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 px-3 py-2 border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-semibold rounded-xl transition-colors">
            <Layers className="w-4 h-4" /> Bulk Create
          </button>
          <button onClick={() => { setEditPlan(null); setShowModal(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Route
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl px-6 py-6 text-center">
          <Repeat className="w-8 h-8 text-brand-400 mx-auto mb-3" />
          <p className="font-semibold text-brand-900 mb-1">No scheduled routes yet</p>
          <p className="text-sm text-brand-700 mb-4">Set up a route once and CACFPLink delivers every day automatically.</p>
          <button onClick={() => { setEditPlan(null); setShowModal(true); }}
            className="text-sm font-bold text-brand-700 hover:underline">Create your first route →</button>
        </div>
      ) : (
        <>
          {activePlans.length > 0 && (
            <div className="space-y-3 mb-8">
              {activePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan}
                  onEdit={() => { setEditPlan(plan); setShowModal(true); }}
                  onToggle={() => handleToggleActive(plan)}
                  onDelete={() => handleDelete(plan)}
                  deleting={deleting === plan.id} />
              ))}
            </div>
          )}
          {inactivePlans.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Paused Routes</p>
              <div className="space-y-3 opacity-60">
                {inactivePlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan}
                    onEdit={() => { setEditPlan(plan); setShowModal(true); }}
                    onToggle={() => handleToggleActive(plan)}
                    onDelete={() => handleDelete(plan)}
                    deleting={deleting === plan.id} />
                ))}
              </div>
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
        <BulkWizardModal
          onClose={() => setShowBulk(false)}
          onSaved={() => { setShowBulk(false); load(); }} />
      )}
    </>
  );
}

// ─── One-Time Deliveries Tab ──────────────────────────────────────────────────

function OneTimeDeliveriesTab({ routes, loading, onAdd }) {
  const grouped  = groupByDateKitchen(routes);
  const todayStr = today();
  const tomStr   = tomorrow();

  if (loading) return <div className="py-20 text-center text-sm text-gray-400">Loading deliveries…</div>;

  if (grouped.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-brand-400" />
        </div>
        <p className="text-base font-bold text-gray-700 mb-1">No one-time deliveries</p>
        <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
          For exceptions and special dates outside your recurring schedule.
        </p>
        <button onClick={onAdd}
          className="inline-flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add One-Time Delivery
        </button>
      </div>
    );
  }

  return (
    <>
      {grouped.map(({ date, label, kitchens }) => (
        <DateSection key={date} label={label} kitchens={kitchens}
          isToday={date === todayStr} isTomorrow={date === tomStr} />
      ))}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MealOrdersPage() {
  const [activeTab, setActiveTab] = useState('one-time'); // 'one-time' | 'scheduled'
  const [routes,    setRoutes]    = useState([]);
  const [kitchens,  setKitchens]  = useState([]);
  const [sites,     setSites]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [triggerNewRoute, setTriggerNewRoute] = useState(0); // bumped to open plan modal from tab

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [routesRes, kitchensRes, sitesRes] = await Promise.all([
        api.get('/delivery/routes'),
        api.get('/organizations?type=kitchen'),
        api.get('/organizations?type=site'),
      ]);
      const kList = Array.isArray(kitchensRes.data) ? kitchensRes.data : (kitchensRes.data.organizations ?? []);
      const kitchenMap = Object.fromEntries(kList.map((k) => [k.id, k.name]));
      const rawRoutes = Array.isArray(routesRes.data) ? routesRes.data : (routesRes.data.routes ?? []);
      setRoutes(rawRoutes.map((r) => ({ ...r, kitchen_name: kitchenMap[r.delivery_provider_id] ?? r.kitchen_name ?? 'Kitchen' })));
      setKitchens(kList.filter((k) => k.status === 'active' || !k.status));
      setSites((Array.isArray(sitesRes.data) ? sitesRes.data : (sitesRes.data.organizations ?? [])).filter((s) => s.status === 'active' || !s.status));
    } catch { /* silent fail */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreated = (newRoute) => setRoutes((prev) => [newRoute, ...prev]);

  // Summary numbers
  const totalMeals      = routes.flatMap((r) => r.stops ?? []).reduce((s, stop) => s + (stop.meal_count || 0), 0);
  const pendingRoutes   = routes.filter((r) => !r.status || r.status === 'pending').length;
  const deliveredRoutes = routes.filter((r) => r.status === 'delivered').length;

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Scheduled routes run automatically. One-time deliveries are for exceptions.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Delivery
        </button>
      </div>

      {/* Summary strip — one-time only */}
      {!loading && routes.length > 0 && activeTab === 'one-time' && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total meals',  value: totalMeals,      icon: Truck,       color: 'text-gray-900' },
            { label: 'Pending',      value: pendingRoutes,   icon: Clock,       color: pendingRoutes > 0 ? 'text-yellow-600' : 'text-gray-900' },
            { label: 'Delivered',    value: deliveredRoutes, icon: CheckCircle, color: deliveredRoutes > 0 ? 'text-green-600' : 'text-gray-900' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card px-4 py-3 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
              <div>
                <p className="text-xs font-medium text-gray-400">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'scheduled', label: 'Scheduled Routes', icon: Repeat },
          { key: 'one-time',  label: 'One-Time Deliveries', icon: Truck },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'scheduled' ? (
        <ScheduledRoutesTab openPlanModal={triggerNewRoute} />
      ) : (
        <OneTimeDeliveriesTab
          routes={routes}
          loading={loading}
          onAdd={() => setShowAdd(true)}
        />
      )}

      {/* Add Delivery modal */}
      {showAdd && (
        <AddDeliveryModal
          kitchens={kitchens}
          sites={sites}
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
          onSwitchToScheduled={() => {
            setActiveTab('scheduled');
            setTriggerNewRoute((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
