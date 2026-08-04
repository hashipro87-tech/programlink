// DeliveriesPage (file kept as MealOrdersPage.jsx for routing compatibility)
// Sponsor view of all meal deliveries, grouped by date → kitchen → sites.
// Design principle: sponsors think "Sunshine needs 100 lunches tomorrow",
// so the UI starts with the site and works outward.

import { useState, useEffect } from 'react';
import {
  Plus, Truck, X, ChefHat, Building2, Calendar,
  CheckCircle, Clock, AlertTriangle, ChevronRight,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

/** Pretty date label for a YYYY-MM-DD string (or full ISO timestamp) */
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

/**
 * Group flat list of routes into:
 * { date: { kitchenId: { kitchenName, routes: [...] } } }
 * Sorted: nearest date first, then by kitchen name.
 */
function groupByDateKitchen(routes) {
  const map = {};
  for (const route of routes) {
    const d = String(route.date ?? 'unknown').slice(0, 10);
    if (!map[d]) map[d] = {};
    const kid = route.delivery_provider_id ?? 'unknown';
    if (!map[d][kid]) {
      map[d][kid] = {
        kitchenId:   kid,
        kitchenName: route.kitchen_name ?? 'Kitchen',
        routes:      [],
      };
    }
    map[d][kid].routes.push(route);
  }

  // Sort dates: today & tomorrow first, rest ascending
  const sorted = Object.keys(map).sort((a, b) => a.localeCompare(b));
  return sorted.map((date) => ({
    date,
    label:    dateLabel(date),
    kitchens: Object.values(map[date]).sort((a, b) =>
      a.kitchenName.localeCompare(b.kitchenName)
    ),
  }));
}

// ─── Stop Row ─────────────────────────────────────────────────────────────────

function StopRow({ stop, status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const isDone = status === 'delivered';

  return (
    <div className={`flex items-center gap-3 py-2.5 px-4 rounded-xl transition-colors ${
      isDone ? 'opacity-60' : 'hover:bg-gray-50'
    }`}>
      {/* Check icon */}
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
        isDone ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        <CheckCircle className={`w-3.5 h-3.5 ${isDone ? 'text-green-500' : 'text-gray-300'}`} />
      </div>

      {/* Site name */}
      <span className={`text-sm font-semibold flex-1 min-w-0 truncate ${
        isDone ? 'text-gray-400 line-through' : 'text-gray-800'
      }`}>
        {stop.site_name ?? 'Site'}
      </span>

      {/* Count + meal type */}
      <span className="text-sm text-gray-700 font-medium flex-shrink-0">
        {stop.meal_count} {mealLabel(stop.meal_type)}
        {stop.meal_count === 1 ? '' : 's'}
      </span>

      {/* Pickup time */}
      {stop.pickup_time && (
        <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">
          Pickup {fmt12(stop.pickup_time)}
        </span>
      )}

      {/* Status */}
      <span className={`text-xs font-semibold flex-shrink-0 ${cfg.color}`}>
        {cfg.label}
      </span>
    </div>
  );
}

// ─── Kitchen Card ─────────────────────────────────────────────────────────────

function KitchenCard({ kitchenName, routes }) {
  const allStops = routes.flatMap((r) => (r.stops ?? []).map((s) => ({ ...s, status: r.status })));
  const totalMeals = allStops.reduce((sum, s) => sum + (s.meal_count || 0), 0);
  const allDone = routes.every((r) => r.status === 'delivered');

  return (
    <div className={`border rounded-2xl overflow-hidden transition-opacity ${
      allDone ? 'border-gray-100 opacity-70' : 'border-gray-200'
    }`}>
      {/* Kitchen header */}
      <div className={`px-4 py-3 flex items-center gap-3 ${
        allDone ? 'bg-gray-50' : 'bg-white'
      }`}>
        <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-4 h-4 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{kitchenName}</p>
          <p className="text-xs text-gray-400">
            {allStops.length} site{allStops.length !== 1 ? 's' : ''} · {totalMeals} meals total
          </p>
        </div>
        {allDone && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            All delivered
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Stops */}
      <div className="bg-white px-2 py-1.5 space-y-0.5">
        {allStops.map((stop, i) => (
          <StopRow key={i} stop={stop} status={stop.status} />
        ))}
      </div>
    </div>
  );
}

// ─── Date Section ─────────────────────────────────────────────────────────────

function DateSection({ label, kitchens, isToday, isTomorrow }) {
  const totalMeals = kitchens.flatMap((k) =>
    k.routes.flatMap((r) => r.stops ?? [])
  ).reduce((sum, s) => sum + (s.meal_count || 0), 0);

  return (
    <div className="mb-8">
      {/* Date header */}
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className={`text-lg font-bold ${
          isToday ? 'text-brand-700' : isTomorrow ? 'text-gray-900' : 'text-gray-700'
        }`}>
          {label}
        </h2>
        <span className="text-sm text-gray-400">
          {totalMeals} meal{totalMeals !== 1 ? 's' : ''} across {kitchens.length} kitchen{kitchens.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Kitchen cards */}
      <div className="space-y-3">
        {kitchens.map((k) => (
          <KitchenCard
            key={k.kitchenId}
            kitchenName={k.kitchenName}
            routes={k.routes}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Add Delivery Modal ───────────────────────────────────────────────────────
// Site-first flow: "Who needs meals?" → how many + type → when → which kitchen

const EMPTY = {
  site_id:     '',
  meal_count:  '',
  meal_type:   'lunch',
  date:        tomorrow(),
  kitchen_id:  '',
  pickup_time: '',
};

function AddDeliveryModal({ kitchens, sites, onClose, onCreated }) {
  const [form,   setForm]   = useState(EMPTY);
  const [step,   setStep]   = useState(1);   // 1 = site+count, 2 = date+kitchen
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const selectedSite    = sites.find((s) => s.id === form.site_id);
  const selectedKitchen = kitchens.find((k) => k.id === form.kitchen_id);

  const canNext = form.site_id && form.meal_count && Number(form.meal_count) > 0;
  const canSubmit = canNext && form.kitchen_id && form.date;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError('');
    const payload = {
      delivery_provider_id: form.kitchen_id,
      date:  form.date,
      stops: [{
        order:       1,
        site_id:     form.site_id,
        site_name:   selectedSite?.name ?? 'Site',
        meal_type:   form.meal_type,
        meal_label:  mealLabel(form.meal_type),
        meal_count:  Number(form.meal_count),
        pickup_time: form.pickup_time || null,
        confirmed:   false,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">Add Delivery</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1.5 mt-3">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-brand-600' : 'bg-gray-200'
              }`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {step === 1 && (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-1">Who needs meals?</p>

              {/* Site */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Site <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={form.site_id}
                    onChange={set('site_id')}
                    autoFocus
                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
                  >
                    <option value="">Select a site…</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {sites.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No sites found — add a site first.</p>
                )}
              </div>

              {/* Count + Meal type — in natural language */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  How many meals? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={form.meal_count}
                    onChange={set('meal_count')}
                    placeholder="100"
                    className="w-28 px-3 py-3 border border-gray-300 rounded-xl text-sm text-center font-bold
                               focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <select
                    value={form.meal_type}
                    onChange={set('meal_type')}
                    className="flex-1 px-3 py-3 border border-gray-300 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {MEAL_TYPES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                {/* Natural language preview */}
                {form.site_id && form.meal_count && (
                  <p className="text-xs text-brand-600 mt-2 font-medium">
                    {selectedSite?.name} needs {form.meal_count} {(MEAL_TYPES.find(m => m.value === form.meal_type)?.plural ?? mealLabel(form.meal_type)).toLowerCase()}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={!canNext}
                onClick={() => setStep(2)}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold
                           rounded-xl transition-colors disabled:opacity-40 text-sm mt-2 flex items-center justify-center gap-2"
              >
                Next — When & Who's delivering <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Summary of step 1 */}
              <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-brand-800">
                  {selectedSite?.name} · {form.meal_count} {(MEAL_TYPES.find(m => m.value === form.meal_type)?.plural ?? mealLabel(form.meal_type)).toLowerCase()}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-brand-600 hover:underline mt-0.5"
                >
                  Change
                </button>
              </div>

              <p className="text-sm font-semibold text-gray-700">When & who's delivering?</p>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Delivery Date <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  {[
                    { label: 'Today',    value: today() },
                    { label: 'Tomorrow', value: tomorrow() },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, date: value }))}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                        form.date === value
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={form.date}
                  onChange={set('date')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Kitchen */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Kitchen <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ChefHat className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={form.kitchen_id}
                    onChange={set('kitchen_id')}
                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
                  >
                    <option value="">Which kitchen is making this?</option>
                    {kitchens.map((k) => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
                {kitchens.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No kitchens found — invite a kitchen first.</p>
                )}
              </div>

              {/* Pickup time (optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Pickup Time <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="time"
                  value={form.pickup_time}
                  onChange={set('pickup_time')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold
                             text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving || !canSubmit}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl
                             text-sm font-semibold transition-colors disabled:opacity-50"
                >
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <div className="py-24 text-center">
      <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Truck className="w-8 h-8 text-brand-400" />
      </div>
      <p className="text-base font-bold text-gray-700 mb-1">No deliveries scheduled</p>
      <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
        Start by adding a delivery — choose a site, how many meals, and which kitchen.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700
                   text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" /> Add First Delivery
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MealOrdersPage() {
  const [routes,   setRoutes]   = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [sites,    setSites]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [routesRes, kitchensRes, sitesRes] = await Promise.all([
        api.get('/delivery/routes'),
        api.get('/organizations?type=kitchen'),
        api.get('/organizations?type=site'),
      ]);

      const kList = Array.isArray(kitchensRes.data)
        ? kitchensRes.data
        : (kitchensRes.data.organizations ?? []);
      const kitchenMap = Object.fromEntries(kList.map((k) => [k.id, k.name]));

      const rawRoutes = Array.isArray(routesRes.data)
        ? routesRes.data
        : (routesRes.data.routes ?? []);

      setRoutes(rawRoutes.map((r) => ({
        ...r,
        kitchen_name: kitchenMap[r.delivery_provider_id] ?? r.kitchen_name ?? 'Kitchen',
      })));

      setKitchens(kList.filter((k) => k.status === 'active' || !k.status));
      setSites(
        (Array.isArray(sitesRes.data) ? sitesRes.data : (sitesRes.data.organizations ?? []))
          .filter((s) => s.status === 'active' || !s.status)
      );
    } catch {
      // silent fail — empty state handles it
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreated = (newRoute) => {
    setRoutes((prev) => [newRoute, ...prev]);
  };

  const grouped   = groupByDateKitchen(routes);
  const todayStr  = today();
  const tomStr    = tomorrow();

  // Summary numbers
  const totalMeals     = routes.flatMap((r) => r.stops ?? []).reduce((s, stop) => s + (stop.meal_count || 0), 0);
  const pendingRoutes  = routes.filter((r) => !r.status || r.status === 'pending').length;
  const deliveredRoutes= routes.filter((r) => r.status === 'delivered').length;

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Meal deliveries grouped by date and kitchen. Kitchens and sites see their own view automatically.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
                     text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Delivery
        </button>
      </div>

      {/* Summary strip */}
      {!loading && routes.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total meals',   value: totalMeals,      icon: Truck,         color: 'text-gray-900' },
            { label: 'Pending',       value: pendingRoutes,   icon: Clock,         color: pendingRoutes > 0 ? 'text-yellow-600' : 'text-gray-900' },
            { label: 'Delivered',     value: deliveredRoutes, icon: CheckCircle,   color: deliveredRoutes > 0 ? 'text-green-600' : 'text-gray-900' },
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

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading deliveries…</div>
      ) : grouped.length === 0 ? (
        <EmptyState onAdd={() => setShowAdd(true)} />
      ) : (
        grouped.map(({ date, label, kitchens: kGroups }) => (
          <DateSection
            key={date}
            label={label}
            kitchens={kGroups}
            isToday={date === todayStr}
            isTomorrow={date === tomStr}
          />
        ))
      )}

      {/* Add Delivery modal */}
      {showAdd && (
        <AddDeliveryModal
          kitchens={kitchens}
          sites={sites}
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
