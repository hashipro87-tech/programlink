// MealOrdersPage.jsx — Sponsor creates meal delivery orders.
// Sponsor picks a kitchen, a site, a date, meal type, and count.
// The kitchen then sees these orders on their Delivery Status Board.

import { useState, useEffect } from 'react';
import {
  Plus, Truck, X, ChefHat, Building2, Calendar,
  UtensilsCrossed, RefreshCw, CheckCircle, Clock, AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

const MEAL_TYPES = [
  { value: 'breakfast',  label: 'Breakfast' },
  { value: 'am_snack',   label: 'AM Snack' },
  { value: 'lunch',      label: 'Lunch' },
  { value: 'pm_snack',   label: 'PM Snack' },
  { value: 'dinner',     label: 'Dinner' },
];

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   icon: Clock,         cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  prepping:  { label: 'Prepping',  icon: ChefHat,       cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  ready:     { label: 'Ready',     icon: CheckCircle,   cls: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  picked_up: { label: 'Picked Up', icon: Truck,         cls: 'text-purple-700 bg-purple-50 border-purple-200' },
  delivered: { label: 'Delivered', icon: CheckCircle,   cls: 'text-green-700 bg-green-50 border-green-200' },
  cancelled: { label: 'Cancelled', icon: AlertTriangle, cls: 'text-gray-600 bg-gray-50 border-gray-200' },
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="py-20 text-center">
      <Truck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-500">No meal orders yet</p>
      <p className="text-xs text-gray-400 mt-1 mb-5">
        Create an order to assign a kitchen to deliver meals to a site.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700
                   text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" /> Create First Order
      </button>
    </div>
  );
}

// ─── Order Row ────────────────────────────────────────────────────────────────
function OrderRow({ order }) {
  const stops = order.stops ?? [];

  return (
    <div className="px-5 py-4 border-b border-gray-50 last:border-0">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ChefHat className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-900 truncate">
            {order.kitchen_name ?? 'Kitchen'}
          </span>
          <span className="text-gray-300">→</span>
          <span className="text-sm text-gray-600 truncate">
            {stops.length === 1 ? stops[0].site_name : `${stops.length} sites`}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">{fmtDate(order.date)}</span>
          <StatusPill status={order.status ?? 'pending'} />
        </div>
      </div>

      {/* Stops detail */}
      {stops.length > 0 && (
        <div className="mt-3 space-y-1.5 pl-6">
          {stops.map((stop, i) => (
            <div key={i} className="flex items-center gap-3 text-xs text-gray-600">
              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium">{stop.site_name ?? 'Site'}</span>
              <span className="text-gray-400">·</span>
              <UtensilsCrossed className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="capitalize">{(stop.meal_type ?? '').replace('_', ' ')}</span>
              <span className="text-gray-400">·</span>
              <span className="font-semibold text-gray-900">{stop.meal_count} meals</span>
              {stop.pickup_time && (
                <>
                  <span className="text-gray-400">·</span>
                  <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>Pickup {stop.pickup_time}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Order Modal ───────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];

const EMPTY = {
  kitchen_id:  '',
  site_id:     '',
  date:        today,
  meal_type:   'lunch',
  meal_count:  '',
  pickup_time: '',
  notes:       '',
};

function CreateOrderModal({ kitchens, sites, onClose, onCreated }) {
  const [form,   setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.kitchen_id) { setError('Please select a kitchen.'); return; }
    if (!form.site_id)    { setError('Please select a site.'); return; }
    if (!form.meal_count || isNaN(form.meal_count) || Number(form.meal_count) < 1) {
      setError('Please enter a valid meal count.'); return;
    }
    setSaving(true);
    setError('');

    const kitchen  = kitchens.find((k) => k.id === form.kitchen_id);
    const site     = sites.find((s) => s.id === form.site_id);
    const mealLabel = MEAL_TYPES.find((m) => m.value === form.meal_type)?.label ?? form.meal_type;

    const payload = {
      delivery_provider_id: form.kitchen_id,
      date:  form.date,
      notes: form.notes || null,
      stops: [
        {
          order:        1,
          site_id:      form.site_id,
          site_name:    site?.name ?? 'Site',
          meal_type:    form.meal_type,
          meal_label:   mealLabel,
          meal_count:   Number(form.meal_count),
          pickup_time:  form.pickup_time || null,
          confirmed:    false,
        },
      ],
      // Extra metadata so the list can display it without extra queries
      _kitchen_name: kitchen?.name ?? 'Kitchen',
    };

    try {
      const { data } = await api.post('/delivery/routes', payload);
      onCreated({
        ...data.route,
        kitchen_name: kitchen?.name ?? 'Kitchen',
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Meal Order</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Assign a kitchen to deliver meals to a site.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Delivery Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={form.date}
                onChange={set('date')}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Kitchen */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Kitchen <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <ChefHat className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={form.kitchen_id}
                onChange={set('kitchen_id')}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
                <option value="">Select a kitchen…</option>
                {kitchens.map((k) => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>
            {kitchens.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No active kitchens found. Add a kitchen first.</p>
            )}
          </div>

          {/* Site */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Deliver To (Site) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={form.site_id}
                onChange={set('site_id')}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
                <option value="">Select a site…</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {sites.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No sites found. Add a site first.</p>
            )}
          </div>

          {/* Meal type + count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Meal Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.meal_type}
                onChange={set('meal_type')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {MEAL_TYPES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Meal Count <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.meal_count}
                onChange={set('meal_count')}
                placeholder="e.g. 45"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Pickup time */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Kitchen Pickup Time <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="time"
              value={form.pickup_time}
              onChange={set('pickup_time')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              When the driver should pick up from the kitchen.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Any special instructions for the kitchen…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold
                         text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl
                         text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MealOrdersPage() {
  const [orders,   setOrders]   = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [sites,    setSites]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ordersRes, kitchensRes, sitesRes] = await Promise.all([
        api.get('/delivery/routes'),
        api.get('/organizations?type=kitchen'),
        api.get('/organizations?type=site'),
      ]);

      // Enrich orders with kitchen names
      const kitchenMap = {};
      const kList = Array.isArray(kitchensRes.data)
        ? kitchensRes.data
        : (kitchensRes.data.organizations ?? []);
      kList.forEach((k) => { kitchenMap[k.id] = k.name; });

      const rawOrders = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : (ordersRes.data.routes ?? []);

      setOrders(rawOrders.map((o) => ({
        ...o,
        kitchen_name: kitchenMap[o.delivery_provider_id] ?? o.kitchen_name ?? 'Kitchen',
      })));

      setKitchens(kList.filter((k) => k.status === 'active' || !k.status));
      setSites(
        (Array.isArray(sitesRes.data) ? sitesRes.data : (sitesRes.data.organizations ?? []))
          .filter((s) => s.status === 'active' || !s.status)
      );
    } catch {
      // Silent fail — empty states handle it
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreated = (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const visible = dateFilter
    ? orders.filter((o) => o.date === dateFilter)
    : orders;

  const totalDelivered = orders.filter((o) => o.status === 'delivered').length;
  const totalPending   = orders.filter((o) => !o.status || o.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Orders</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Assign kitchens to deliver meals to sites — kitchens see these orders on their dashboard.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
                     text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total orders',  value: orders.length,  icon: Truck,        color: 'text-gray-900' },
          { label: 'Pending',       value: totalPending,   icon: Clock,        color: totalPending > 0 ? 'text-yellow-600' : 'text-gray-900' },
          { label: 'Delivered',     value: totalDelivered, icon: CheckCircle,  color: totalDelivered > 0 ? 'text-green-600' : 'text-gray-900' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card px-5 py-4 flex items-center gap-4">
            <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
            <div>
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card mb-4">
        <div className="px-5 py-3 flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Clear filter
            </button>
          )}
          <button
            onClick={fetchAll}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-500
                       hover:text-gray-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Orders list */}
      <div className="card">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading orders…</div>
        ) : visible.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          <div>
            <div className="px-5 py-2 border-b border-gray-100 hidden sm:flex items-center
                            text-[10px] font-bold text-gray-400 uppercase tracking-wider gap-4">
              <div className="flex-1">Kitchen → Site</div>
              <div className="w-28 text-right">Date</div>
              <div className="w-24 text-right">Status</div>
            </div>
            {visible.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
            <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400 text-right">
              {visible.length} order{visible.length !== 1 ? 's' : ''}
              {dateFilter ? ` on ${fmtDate(dateFilter)}` : ' total'}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showAdd && (
        <CreateOrderModal
          kitchens={kitchens}
          sites={sites}
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
