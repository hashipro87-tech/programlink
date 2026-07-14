// DeliveryPlansPage.jsx — Recurring Delivery Plans for sponsors
// Set it up once. CACFPLink handles it every day.

import { useState, useEffect } from 'react';
import { Truck, Plus, X, CheckCircle, Clock, Edit2, Trash2, PauseCircle, PlayCircle, Layers, Search } from 'lucide-react';
import api from '../../services/api';

const DAYS = [
  { key: 'monday',    short: 'Mon' },
  { key: 'tuesday',   short: 'Tue' },
  { key: 'wednesday', short: 'Wed' },
  { key: 'thursday',  short: 'Thu' },
  { key: 'friday',    short: 'Fri' },
  { key: 'saturday',  short: 'Sat' },
  { key: 'sunday',    short: 'Sun' },
];

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
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
    <span
      key={key}
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
        days.includes(key) ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-300'
      }`}
    >
      {short}
    </span>
  ));
}

// ─── Plan Form Modal ───────────────────────────────────────────────────────────
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

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...f.days_of_week, day],
    }));
  };

  const totalMeals = (Number(form.breakfast) + Number(form.lunch) + Number(form.snack) + Number(form.supper));

  const handleSave = async () => {
    if (!form.site_id)            return setError('Select a site.');
    if (!form.days_of_week.length) return setError('Select at least one day.');
    if (totalMeals === 0)         return setError('Add at least one meal count.');
    setError('');
    setSaving(true);
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-bold text-gray-900">{editPlan ? 'Edit Delivery Plan' : 'New Delivery Plan'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Site */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Site</label>
            <select
              value={form.site_id}
              onChange={(e) => setForm((f) => ({ ...f, site_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Select a site…</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Kitchen */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kitchen (optional)</label>
            <select
              value={form.kitchen_id}
              onChange={(e) => setForm((f) => ({ ...f, kitchen_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">No kitchen assigned</option>
              {kitchens.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>

          {/* Plan name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plan Name (optional)</label>
            <input
              type="text"
              placeholder="e.g. Weekday Lunch Plan"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Days */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Delivery Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(({ key, short }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={`w-12 h-10 rounded-xl text-xs font-bold transition-colors ${
                    form.days_of_week.includes(key)
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {short}
                </button>
              ))}
            </div>
          </div>

          {/* Arrival time */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Arrival Time</label>
            <input
              type="time"
              value={form.arrival_time}
              onChange={(e) => setForm((f) => ({ ...f, arrival_time: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Meal counts */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Meals Per Delivery</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'breakfast', label: 'Breakfast' },
                { key: 'lunch',     label: 'Lunch' },
                { key: 'snack',     label: 'Snack' },
                { key: 'supper',    label: 'Supper' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
            {totalMeals > 0 && (
              <p className="text-xs text-brand-600 font-semibold mt-2">{totalMeals} total meals per delivery</p>
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date (optional)</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Auto notify */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.auto_notify}
              onChange={(e) => setForm((f) => ({ ...f, auto_notify: e.target.checked }))}
              className="w-4 h-4 accent-brand-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Automatically notify site & kitchen</p>
              <p className="text-xs text-gray-400">Sites and kitchens receive a notification each morning deliveries are scheduled</p>
            </div>
          </label>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : editPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Wizard Modal ────────────────────────────────────────────────────────
// Create one plan per site — all sharing the same kitchen/days/meals/time.
// Lets sponsors onboard dozens of sites in minutes.
function BulkWizardModal({ onClose, onSaved }) {
  const [sites, setSites]     = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [search, setSearch]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    kitchen_id:   '',
    selected_sites: [],          // array of site UUIDs
    days_of_week: [],
    arrival_time: '09:00',
    breakfast:    0,
    lunch:        0,
    snack:        0,
    supper:       0,
    start_date:   new Date().toISOString().split('T')[0],
    end_date:     '',
    auto_notify:  true,
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

  const toggleSite = (id) => setForm((f) => ({
    ...f,
    selected_sites: f.selected_sites.includes(id)
      ? f.selected_sites.filter((s) => s !== id)
      : [...f.selected_sites, id],
  }));

  const selectAll = () => setForm((f) => ({
    ...f,
    selected_sites: filteredSites.map((s) => s.id),
  }));

  const clearAll = () => setForm((f) => ({ ...f, selected_sites: [] }));

  const filteredSites = sites.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalMeals = Number(form.breakfast) + Number(form.lunch) + Number(form.snack) + Number(form.supper);
  const n = form.selected_sites.length;

  const handleSave = async () => {
    if (!n)                       return setError('Select at least one site.');
    if (!form.days_of_week.length) return setError('Select at least one day.');
    if (totalMeals === 0)         return setError('Add at least one meal count.');
    setError('');
    setSaving(true);
    try {
      await api.post('/delivery-plans/bulk', {
        site_ids:    form.selected_sites,
        kitchen_id:  form.kitchen_id || undefined,
        days_of_week: form.days_of_week,
        arrival_time: form.arrival_time,
        breakfast:   Number(form.breakfast),
        lunch:       Number(form.lunch),
        snack:       Number(form.snack),
        supper:      Number(form.supper),
        start_date:  form.start_date,
        end_date:    form.end_date || undefined,
        auto_notify: form.auto_notify,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create plans.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" /> Bulk Create Plans
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Set up once — applies to all selected sites</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Step 1: Kitchen */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
              1 — Kitchen (optional)
            </label>
            <select
              value={form.kitchen_id}
              onChange={(e) => setForm((f) => ({ ...f, kitchen_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">No kitchen assigned</option>
              {kitchens.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>

          {/* Step 2: Sites */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                2 — Sites ({n} selected)
              </label>
              <div className="flex gap-2 text-xs">
                <button onClick={selectAll} className="text-brand-600 hover:underline font-semibold">Select all</button>
                <span className="text-gray-300">·</span>
                <button onClick={clearAll} className="text-gray-400 hover:underline">Clear</button>
              </div>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                placeholder="Search sites…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div className="border border-gray-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-gray-50">
              {filteredSites.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400 text-center">No sites found</p>
              ) : filteredSites.map((s) => {
                const checked = form.selected_sites.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSite(s.id)}
                      className="w-4 h-4 accent-brand-600"
                    />
                    <span className="text-sm text-gray-800">{s.name}</span>
                    {checked && <CheckCircle className="w-3.5 h-3.5 text-brand-500 ml-auto" />}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Step 3: Days */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
              3 — Delivery Days
            </label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(({ key, short }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={`w-12 h-10 rounded-xl text-xs font-bold transition-colors ${
                    form.days_of_week.includes(key) ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {short}
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Time + Meals */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                4 — Arrival Time
              </label>
              <input
                type="time"
                value={form.arrival_time}
                onChange={(e) => setForm((f) => ({ ...f, arrival_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                Start Date
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Meal counts */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
              5 — Meals Per Delivery (per site)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'breakfast', label: 'Breakfast' },
                { key: 'lunch',     label: 'Lunch' },
                { key: 'snack',     label: 'Snack' },
                { key: 'supper',    label: 'Supper' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Auto notify */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.auto_notify}
              onChange={(e) => setForm((f) => ({ ...f, auto_notify: e.target.checked }))}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-gray-700">Automatically notify sites and kitchen each morning</span>
          </label>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving
              ? 'Creating…'
              : n > 0
                ? `Create ${n} Delivery Plan${n !== 1 ? 's' : ''}`
                : 'Create Plans'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DeliveryPlansPage() {
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [showBulk, setShowBulk]     = useState(false);
  const [editPlan, setEditPlan]     = useState(null);
  const [deleting, setDeleting]     = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/delivery-plans')
      .then(({ data }) => setPlans(data.plans ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set up once. CACFPLink delivers every day automatically.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Layers className="w-4 h-4" />
            Bulk Create
          </button>
          <button
            onClick={() => { setEditPlan(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </button>
        </div>
      </div>

      {/* How it works banner */}
      {plans.length === 0 && !loading && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl px-6 py-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-brand-900">Set it up once. Never schedule manually again.</p>
              <p className="text-sm text-brand-700 mt-1">
                Create a plan for each site — choose the days, arrival time, and meal counts.
                Every morning at 6 AM, CACFPLink automatically creates deliveries and notifies
                your sites and kitchens.
              </p>
              <button
                onClick={() => { setEditPlan(null); setShowModal(true); }}
                className="mt-3 text-sm font-bold text-brand-700 hover:underline"
              >
                Create your first plan →
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Active plans */}
          {activePlans.length > 0 && (
            <div className="space-y-3 mb-8">
              {activePlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={() => { setEditPlan(plan); setShowModal(true); }}
                  onToggle={() => handleToggleActive(plan)}
                  onDelete={() => handleDelete(plan)}
                  deleting={deleting === plan.id}
                />
              ))}
            </div>
          )}

          {/* Paused plans */}
          {inactivePlans.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Paused Plans</p>
              <div className="space-y-3 opacity-60">
                {inactivePlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={() => { setEditPlan(plan); setShowModal(true); }}
                    onToggle={() => handleToggleActive(plan)}
                    onDelete={() => handleDelete(plan)}
                    deleting={deleting === plan.id}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Single plan modal */}
      {showModal && (
        <PlanModal
          editPlan={editPlan}
          onClose={() => { setShowModal(false); setEditPlan(null); }}
          onSaved={() => { setShowModal(false); setEditPlan(null); load(); }}
        />
      )}

      {/* Bulk wizard modal */}
      {showBulk && (
        <BulkWizardModal
          onClose={() => setShowBulk(false)}
          onSaved={() => { setShowBulk(false); load(); }}
        />
      )}
    </>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onEdit, onToggle, onDelete, deleting }) {
  const totalMeals = plan.breakfast + plan.lunch + plan.snack + plan.supper;

  return (
    <div className={`card px-5 py-4 ${!plan.active ? 'border-gray-100' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-gray-900">{plan.site_name}</p>
            {plan.name && (
              <span className="text-xs text-gray-400 font-medium">· {plan.name}</span>
            )}
            {!plan.active && (
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Paused</span>
            )}
          </div>

          {plan.kitchen_name && (
            <p className="text-xs text-gray-500 mb-2">From {plan.kitchen_name}</p>
          )}

          {/* Day badges */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {dayBadges(plan.days_of_week)}
          </div>

          {/* Meal + time info */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {fmt12(plan.arrival_time?.slice(0,5))}
            </div>
            <div className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-gray-400" />
              {totalMeals} meals · {mealSummary(plan)}
            </div>
            {plan.auto_notify && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3.5 h-3.5" />
                Auto-notify
              </div>
            )}
          </div>

          {/* Date range */}
          <p className="text-xs text-gray-400 mt-1.5">
            {plan.start_date}
            {plan.end_date ? ` → ${plan.end_date}` : ' → ongoing'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            title="Edit"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={onToggle}
            title={plan.active ? 'Pause' : 'Resume'}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {plan.active
              ? <PauseCircle className="w-4 h-4 text-yellow-500" />
              : <PlayCircle  className="w-4 h-4 text-green-500" />
            }
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            title="Delete"
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className={`w-4 h-4 ${deleting ? 'text-gray-300' : 'text-red-400'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
