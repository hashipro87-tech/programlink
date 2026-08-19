// MenuCyclesPage.jsx — reusable rotating menu cycle library
// Sponsors build cycles (Fall Cycle = 4 weeks), assign menus to each week,
// then apply cycles to the real calendar with a start + end date.
import { useState, useEffect } from 'react';
import {
  FolderOpen, Plus, Calendar, ChevronDown, ChevronRight,
  Trash2, CheckCircle2, Edit2, X, AlertTriangle, Clock,
  Link2, Unlink, ArrowRight, Upload,
} from 'lucide-react';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

function weekRange(start, end) {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end   + 'T00:00:00Z');
  const weeks = Math.ceil((e - s) / (7 * 86400000));
  return `${weeks} week${weeks !== 1 ? 's' : ''}`;
}

function isActive(schedule) {
  const today = new Date().toISOString().split('T')[0];
  const perpetual = !schedule.end_date || schedule.end_date >= '2099-01-01';
  return schedule.start_date <= today && (perpetual || schedule.end_date >= today);
}

function fmtEndDate(d) {
  if (!d || d >= '2099-01-01') return 'No end date';
  return fmtDate(d);
}

// ── Apply Schedule Modal ───────────────────────────────────────────────────────
function ApplyModal({ cycle, onClose, onApplied }) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState('');
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const handleApply = async () => {
    if (!startDate || !endDate) { setError('Start and end dates are required.'); return; }
    if (endDate < startDate)    { setError('End date must be after start date.'); return; }
    setSaving(true); setError('');
    try {
      await api.post(`/menu-cycles/${cycle.id}/schedules`, { start_date: startDate, end_date: endDate, notes });
      onApplied();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply schedule.');
    } finally {
      setSaving(false);
    }
  };

  // Preview: how many times each week repeats
  const cycleWeeks = cycle.week_count || 4;
  const totalWeeks = startDate && endDate
    ? Math.ceil((new Date(endDate + 'T00:00:00Z') - new Date(startDate + 'T00:00:00Z')) / (7 * 86400000))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Apply {cycle.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{cycleWeeks}-week cycle on the calendar</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">End Date</label>
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          {totalWeeks > 0 && (
            <div className="bg-brand-50 rounded-xl px-4 py-3 text-sm text-brand-700">
              <p className="font-semibold">{totalWeeks} weeks scheduled</p>
              <p className="text-xs text-brand-500 mt-0.5">
                Cycle repeats {Math.ceil(totalWeeks / cycleWeeks)} time{Math.ceil(totalWeeks / cycleWeeks) !== 1 ? 's' : ''}
                &nbsp;·&nbsp; {cycleWeeks} weeks per rotation
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Fall semester 2026"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {error && <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleApply} disabled={saving || !startDate || !endDate}
            className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-40">
            {saving ? 'Applying…' : 'Apply to Calendar →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function nextMonday() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 1 ? 0 : ((8 - day) % 7) || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}
function fmtShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

// ── Active Cycle Card ─────────────────────────────────────────────────────────
function ActiveCycleCard({ current }) {
  if (!current?.cycle_name) return null;
  return (
    <div className="flex items-start gap-4 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6">
      <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse block" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-green-800">
          Active Menu · {current.week_label} — {fmtShort(current.week_start_date)} – {fmtShort(current.week_end_date)}
        </p>
        <p className="text-xs text-green-600 mt-0.5">
          {current.cycle_name} &nbsp;·&nbsp;
          {current.menu_name
            ? <>Menu: <span className="font-semibold">{current.menu_name}</span></>
            : <span className="italic">No menu assigned for this week yet</span>
          }
        </p>
        <p className="text-xs text-green-500 mt-1">
          🔄 Automatically selected — Production Records and Claims use this menu
        </p>
      </div>
    </div>
  );
}

// ── Create Cycle Wizard (2-step) ───────────────────────────────────────────────
function CreateCycleWizard({ menus, sites, onClose, onCreated }) {
  const [step,       setStep]      = useState(1); // 1 = info, 2 = assign
  const [name,       setName]      = useState('');
  const [startDate,  setStartDate] = useState(nextMonday);
  const [weekCount,  setWeekCount] = useState(4);
  const [siteId,     setSiteId]    = useState('');
  const [assigned,   setAssigned]  = useState({}); // { weekNum: menuId }
  const [saving,     setSaving]    = useState(false);
  const [error,      setError]     = useState('');

  const PRESETS = [
    { name: 'Fall 4-Week Cycle',   weeks: 4 },
    { name: 'Spring 4-Week Cycle', weeks: 4 },
    { name: 'Summer 2-Week Cycle', weeks: 2 },
    { name: '6-Week Rotation',     weeks: 6 },
  ];

  // Auto-calculate date range for each week slot
  const weekSlots = Array.from({ length: weekCount }, (_, i) => {
    const n     = i + 1;
    const start = addDays(startDate, (n - 1) * 7);
    const end   = addDays(start, 4);
    return { n, start, end };
  });

  // newMenuNames: { weekNum: 'typed name' } for inline-created menus
  const [newMenuNames, setNewMenuNames] = useState({});
  const [creating,    setCreating]      = useState({}); // { weekNum: true } spinner

  const handleCreate = async () => {
    if (!name.trim()) { setError('Cycle name is required.'); return; }
    if (!startDate)   { setError('Start date is required.'); return; }
    setSaving(true); setError('');
    try {
      const siteName = sites.find(s => s.id === siteId)?.name || '';
      const { data: cycle } = await api.post('/menu-cycles', {
        name: name.trim(),
        week_count: weekCount,
        start_date: startDate,
        description: siteId ? `site:${siteId}:${siteName}` : '',
      });

      // Resolve assignments: create new menus for typed names, use existing for selected ids
      const resolvedAssigned = { ...assigned };
      for (const slot of weekSlots) {
        const newName = newMenuNames[slot.n]?.trim();
        if (newName) {
          const { data: newMenu } = await api.post('/menus/create-named', {
            name: newName,
            week_start: slot.start,
          });
          resolvedAssigned[slot.n] = newMenu.id;
        }
      }

      // Assign menus to weeks
      await Promise.all(
        Object.entries(resolvedAssigned)
          .filter(([, menuId]) => menuId)
          .map(([weekNum, menuId]) =>
            api.put(`/menu-cycles/${cycle.id}/weeks/${weekNum}`, { menu_id: menuId })
          )
      );
      onCreated(cycle);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create cycle.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {step === 1 ? 'New Menu Cycle' : `Assign Menus — ${name || 'Cycle'}`}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 gap-2 flex-shrink-0">
          {[1,2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-brand-500' : 'bg-gray-100'}`} />
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {step === 1 ? (
            <>
              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button key={p.name}
                    onClick={() => { setName(p.name); setWeekCount(p.weeks); }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      name === p.name ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {p.name}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Cycle Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Fall 4-Week Menu Cycle"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Cycle Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <p className="text-xs text-gray-400 mt-1">Should be a Monday. The system calculates all week dates from here.</p>
              </div>

              {sites.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Which Site or Kitchen? <span className="text-gray-300 font-normal">(optional)</span></label>
                  <select value={siteId} onChange={e => setSiteId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">All sites / not site-specific</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Number of Weeks</label>
                <div className="flex flex-wrap gap-2">
                  {[1,2,3,4,5,6,8,12].map(n => (
                    <button key={n} onClick={() => setWeekCount(n)}
                      className={`w-10 h-10 text-sm rounded-xl border font-semibold transition-colors ${
                        weekCount === n ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                Assign a saved menu to each week. The system will automatically rotate through them starting {fmtShort(startDate)}.
              </p>
              <div className="space-y-2">
                {weekSlots.map(({ n, start, end }) => (
                  <div key={n} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-xs font-bold text-brand-600">{n}</span>
                    </div>
                    <div className="w-24 flex-shrink-0 mt-1">
                      <p className="text-xs font-semibold text-gray-700">Week {n}</p>
                      <p className="text-xs text-gray-400">{fmtShort(start)} – {fmtShort(end)}</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {newMenuNames[n] !== undefined ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-brand-600">Type the name for this new menu:</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              autoFocus
                              placeholder={`e.g. Fall Week ${n} Menu`}
                              value={newMenuNames[n]}
                              onChange={e => setNewMenuNames(p => ({ ...p, [n]: e.target.value }))}
                              className="flex-1 text-sm border border-brand-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            />
                            <button onClick={() => setNewMenuNames(p => { const c={...p}; delete c[n]; return c; })}
                              className="text-xs text-gray-400 hover:text-gray-600 px-2">✕</button>
                          </div>
                          <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">⚠️ A blank menu will be created — add food items in Menu Builder later.</p>
                        </div>
                      ) : (
                        <select
                          value={assigned[n] || ''}
                          onChange={e => setAssigned(a => ({ ...a, [n]: e.target.value || null }))}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                          <option value="">— Select existing menu —</option>
                          {menus.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name || `Week of ${m.week_start?.slice(0,10)}`}
                            </option>
                          ))}
                        </select>
                      )}
                      {newMenuNames[n] === undefined && (
                        <button
                          onClick={() => setNewMenuNames(p => ({ ...p, [n]: '' }))}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                          + Create new menu
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {menus.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  No saved menus yet — you can assign them later from the cycle card.
                  Build menus in the Menu Builder first.
                </p>
              )}
            </>
          )}

          {error && <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}
        </div>

        <div className="flex justify-between gap-3 px-6 pb-5 flex-shrink-0">
          {step === 2
            ? <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">← Back</button>
            : <button onClick={onClose}         className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          }
          {step === 1
            ? <button onClick={() => { if (!name.trim() || !startDate) { setError('Name and start date are required.'); return; } setError(''); setStep(2); }}
                className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl">
                Next: Assign Menus →
              </button>
            : <button onClick={handleCreate} disabled={saving}
                className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-40">
                {saving ? 'Creating…' : '✓ Create & Activate'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Compliance validation (mirrors MenuBuilderPage logic) ─────────────────────
const MEAL_REQS = {
  breakfast: ['grain','milk','fruit'],
  lunch:     ['grain','milk','protein','vegetable','fruit'],
  snack:     [], // any 2 different components
  supper:    ['grain','milk','protein','vegetable','fruit'],
};
function validateMealClient(items, day, meal) {
  const mealItems = items.filter(i => i.day_of_week === day && i.meal_type === meal);
  if (!mealItems.length) return { ok: false, missing: [], empty: true };
  // Count both primary and secondary components
  const comps = new Set();
  mealItems.forEach(i => {
    if (i.component) comps.add(i.component);
    if (i.secondary_component) comps.add(i.secondary_component);
  });
  if (meal === 'snack') {
    const ok = comps.size >= 2;
    return { ok, missing: ok ? [] : ['need 2 different components'], empty: false };
  }
  const required = MEAL_REQS[meal] || [];
  const missing = required.filter(c => !comps.has(c));
  return { ok: missing.length === 0, missing, empty: false };
}

// ── Week Menu Grid (inline compliance view) ───────────────────────────────────
const GRID_DAYS  = [
  { n:1, label:'Mon' }, { n:2, label:'Tue' }, { n:3, label:'Wed' },
  { n:4, label:'Thu' }, { n:5, label:'Fri' },
];
const GRID_MEALS = ['breakfast','lunch','snack','supper'];
const COMP_COLORS = {
  grain:'bg-yellow-100 text-yellow-800', milk:'bg-blue-100 text-blue-800',
  protein:'bg-red-100 text-red-800', fruit:'bg-green-100 text-green-800',
  vegetable:'bg-emerald-100 text-emerald-800', other:'bg-gray-100 text-gray-600',
};

function WeekMenuGrid({ menuId, onOpenInBuilder }) {
  const [menuItems, setMenuItems] = useState(null);
  const [menuOrg,   setMenuOrg]   = useState(null); // org_id of this menu
  const [loading,   setLoading]   = useState(true);
  const [editCell,  setEditCell]  = useState(null); // { day, meal }
  const [newFood,   setNewFood]   = useState('');
  const [newComp,   setNewComp]   = useState('grain');
  const [newSecComp, setNewSecComp] = useState('');
  const [saving,    setSaving]    = useState(false);

  // Derive the role from the current URL and build the Menu Builder link
  const openInBuilder = () => {
    const role = window.location.pathname.includes('/coordinator/') ? 'coordinator' : 'sponsor';
    // Don't pre-select org — cycle menus belong to the sponsor root org, not a specific kitchen.
    // Let the user navigate freely once in Menu Builder.
    window.location.href = `/dashboard/${role}/menus`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/menus/${menuId}`);
      setMenuItems(data.items || []);
      setMenuOrg(data.menu?.org_id || null);
    } catch { setMenuItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [menuId]);

  const handleAddItem = async () => {
    if (!newFood.trim() || !editCell) return;
    setSaving(true);
    try {
      await api.post(`/menus/${menuId}/items`, {
        day_of_week: editCell.day, meal_type: editCell.meal,
        food_item: newFood.trim(), component: newComp,
        secondary_component: newSecComp || null,
        is_whole_grain: false,
      });
      await load();
      setNewFood(''); setNewSecComp(''); setEditCell(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    try {
      await api.delete(`/menus/items/${item.id}`);
      setMenuItems(p => p.filter(i => i.id !== item.id));
    } catch { /* ignore */ }
  };

  if (loading) return <div className="py-4 text-center text-xs text-gray-400 animate-pulse">Loading menu…</div>;

  const issues = [];
  for (const d of GRID_DAYS) {
    for (const m of GRID_MEALS) {
      const v = validateMealClient(menuItems, d.n, m);
      if (!v.ok && !v.empty) issues.push(`${d.label} ${m}: missing ${v.missing.join(', ')}`);
    }
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 p-4">
      {/* Compliance summary */}
      {issues.length > 0 ? (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">{issues.length} compliance issue{issues.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-700 mt-0.5">{issues.slice(0, 2).join(' · ')}{issues.length > 2 ? ` +${issues.length-2} more` : ''}</p>
          </div>
        </div>
      ) : menuItems.length > 0 ? (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <p className="text-xs font-bold text-green-800">All meals compliant</p>
        </div>
      ) : null}

      {/* Mon–Fri grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left pr-3 pb-2 text-gray-400 font-semibold w-20">Meal</th>
              {GRID_DAYS.map(d => (
                <th key={d.n} className="text-center pb-2 text-gray-500 font-semibold px-2">{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRID_MEALS.map(meal => (
              <tr key={meal}>
                <td className="pr-3 py-1.5 text-gray-500 font-medium capitalize align-top">{meal}</td>
                {GRID_DAYS.map(d => {
                  const v = validateMealClient(menuItems, d.n, meal);
                  const cellItems = menuItems.filter(i => i.day_of_week === d.n && i.meal_type === meal);
                  const isEditing = editCell?.day === d.n && editCell?.meal === meal;
                  const bg = v.empty ? 'bg-gray-100 border-gray-200'
                           : v.ok   ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200';
                  return (
                    <td key={d.n} className={`px-2 py-1.5 border rounded-lg align-top min-w-[100px] ${bg}`}
                      onClick={() => !isEditing && setEditCell({ day: d.n, meal })}>
                      <div className="space-y-0.5">
                        {cellItems.map(it => (
                          <div key={it.id} className="flex items-start gap-1 group">
                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                              <span className={`text-[10px] px-1 rounded font-medium ${COMP_COLORS[it.component] || COMP_COLORS.other}`}>
                                {it.component?.slice(0,4)}
                              </span>
                              {it.secondary_component && (
                                <span className={`text-[10px] px-1 rounded font-medium ${COMP_COLORS[it.secondary_component] || COMP_COLORS.other}`}>
                                  {it.secondary_component?.slice(0,4)}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-700 flex-1 leading-tight">{it.food_item}</span>
                            <button onClick={e => { e.stopPropagation(); handleDelete(it); }}
                              className="hidden group-hover:block text-red-400 hover:text-red-600 ml-auto flex-shrink-0">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                        {v.empty && <span className="text-[10px] text-gray-400 italic">empty</span>}
                        {!v.ok && !v.empty && (
                          <p className="text-[10px] text-red-500">Missing: {v.missing.join(', ')}</p>
                        )}
                      </div>
                      {isEditing && (
                        <div className="mt-1 space-y-1" onClick={e => e.stopPropagation()}>
                          <input autoFocus value={newFood} onChange={e => setNewFood(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                            placeholder="Food item…"
                            className="w-full text-[11px] border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                          <select value={newComp} onChange={e => setNewComp(e.target.value)}
                            className="w-full text-[11px] border border-gray-300 rounded px-1 py-0.5">
                            {['grain','milk','protein','fruit','vegetable'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <select value={newSecComp} onChange={e => setNewSecComp(e.target.value)}
                            className="w-full text-[11px] border border-gray-300 rounded px-1 py-0.5 text-gray-500">
                            <option value="">+ also credits as…</option>
                            {['grain','milk','protein','fruit','vegetable'].filter(c => c !== newComp).map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <div className="flex gap-1">
                            <button onClick={handleAddItem} disabled={saving || !newFood.trim()}
                              className="flex-1 text-[10px] bg-brand-600 text-white rounded py-0.5 disabled:opacity-40">
                              {saving ? '…' : '+ Add'}
                            </button>
                            <button onClick={() => { setEditCell(null); setNewFood(''); }}
                              className="text-[10px] text-gray-500 hover:text-gray-700 px-1">✕</button>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">Click any cell to add items · Hover an item to delete</p>
        <button onClick={openInBuilder}
          className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1">
          Open in Menu Builder <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Import Week Menu Modal ─────────────────────────────────────────────────────
function ImportWeekMenuModal({ week, cycleId, onClose, onRefresh }) {
  const [step,      setStep]      = useState('upload'); // upload|extracting|review|done
  const [file,      setFile]      = useState(null);
  const [menuName,  setMenuName]  = useState(`Week ${week.week_number} Menu`);
  const [items,     setItems]     = useState([]);
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);

  const handleFile = e => { if (e.target.files[0]) setFile(e.target.files[0]); };

  const handleExtract = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    setStep('extracting'); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/menus/import/extract', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const extracted = data.items || [];
      setItems(extracted.map((it, i) => ({ ...it, _id: i, _keep: true })));
      setStep('review');
    } catch (err) {
      setError(err.response?.data?.error || 'Extraction failed. Try a different file.');
      setStep('upload');
    }
  };

  const MEAL_NORM = { am_snack: 'snack', pm_snack: 'snack', morning_snack: 'snack', afternoon_snack: 'snack' };
  const COMP_NORM = { dairy: 'milk', 'meat/alt': 'protein', meat: 'protein', other: 'grain', protein_alt: 'protein' };
  const VALID_MEALS = ['breakfast','lunch','snack','supper'];
  const VALID_COMPS = ['milk','grain','protein','fruit','vegetable'];

  const handleSave = async () => {
    const kept = items.filter(it => it._keep);
    if (!kept.length) { setError('No items selected.'); return; }
    setSaving(true); setError('');
    try {
      const { data: newMenu } = await api.post('/menus/create-named', { name: menuName.trim() });
      // Normalize meal_type + component to values the DB accepts, then batch in groups of 5
      const normalized = kept.map(it => {
        const mt = MEAL_NORM[it.meal_type] || (VALID_MEALS.includes(it.meal_type) ? it.meal_type : 'snack');
        const cp = COMP_NORM[it.component] || (VALID_COMPS.includes(it.component) ? it.component : 'grain');
        return { ...it, meal_type: mt, component: cp };
      });
      const BATCH = 5;
      for (let i = 0; i < normalized.length; i += BATCH) {
        await Promise.all(normalized.slice(i, i + BATCH).map(it =>
          api.post(`/menus/${newMenu.id}/items`, {
            day_of_week:    it.day_of_week,
            meal_type:      it.meal_type,
            food_item:      it.food_item,
            component:      it.component,
            is_whole_grain: it.is_whole_grain || false,
          })
        ));
      }
      await api.put(`/menu-cycles/${cycleId}/weeks/${week.week_number}`, { menu_id: newMenu.id });
      setStep('done');
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const DAY_NAMES = ['','Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Import Menu — Week {week.week_number}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload Excel, Word, or PDF — AI extracts the menu items</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Menu Name</label>
                <input type="text" value={menuName} onChange={e => setMenuName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium mb-1">Upload your menu file</p>
                <p className="text-xs text-gray-400 mb-4">.xlsx, .xls, .docx, .pdf accepted</p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 text-sm font-semibold rounded-xl hover:bg-brand-100">
                  <Upload className="w-4 h-4" /> Choose File
                  <input type="file" accept=".xlsx,.xls,.docx,.doc,.pdf" onChange={handleFile} className="hidden" />
                </label>
                {file && <p className="text-xs text-green-600 font-medium mt-3">✓ {file.name}</p>}
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
            </div>
          )}

          {step === 'extracting' && (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-700">Extracting menu items…</p>
              <p className="text-xs text-gray-400 mt-1">AI is reading your file</p>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">{items.filter(i=>i._keep).length} of {items.length} items selected</p>
                <button onClick={() => setItems(p => p.map(i => ({...i, _keep: true})))}
                  className="text-xs text-brand-600 hover:underline">Select all</button>
              </div>
              {['breakfast','lunch','snack','supper'].map(meal => {
                const mealItems = items.filter(it => it.meal_type === meal);
                if (!mealItems.length) return null;
                return (
                  <div key={meal} className="border border-gray-100 rounded-xl overflow-hidden">
                    <p className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-widest capitalize">{meal}</p>
                    {mealItems.map(it => (
                      <label key={it._id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 border-t border-gray-50 ${!it._keep ? 'opacity-40' : ''}`}>
                        <input type="checkbox" checked={it._keep}
                          onChange={e => setItems(p => p.map(i => i._id===it._id ? {...i,_keep:e.target.checked} : i))}
                          className="rounded" />
                        <span className="text-xs font-medium text-gray-500 w-8">{DAY_NAMES[it.day_of_week]}</span>
                        <span className="text-sm text-gray-800 flex-1">{it.food_item}</span>
                        <span className="text-xs text-gray-400">{it.component}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-base font-bold text-gray-800">Menu imported and assigned!</p>
              <p className="text-xs text-gray-400 mt-1">Week {week.week_number} is ready.</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex-shrink-0 space-y-3">
          {error && (
            <p className="text-xs text-red-700 font-medium bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
              ⚠️ {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            {step === 'done'
              ? <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl">Done</button>
              : step === 'review'
              ? <>
                  <button onClick={() => { setStep('upload'); setError(''); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">← Back</button>
                  <button onClick={handleSave} disabled={saving || !items.filter(i=>i._keep).length}
                    className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-40 min-w-[180px]">
                    {saving ? 'Saving…' : `✓ Save ${items.filter(i=>i._keep).length} Items & Assign`}
                  </button>
                </>
              : step === 'upload'
              ? <>
                  <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
                  <button onClick={handleExtract} disabled={!file}
                    className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-40">
                    Extract Menu →
                  </button>
                </>
              : null
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Week Row ───────────────────────────────────────────────────────────────────
const WEEK_DAYS  = [{key:'mon',label:'Mon',n:1},{key:'tue',label:'Tue',n:2},{key:'wed',label:'Wed',n:3},{key:'thu',label:'Thu',n:4},{key:'fri',label:'Fri',n:5}];
const WEEK_MEALS = [{key:'breakfast',label:'Breakfast'},{key:'lunch',label:'Lunch'},{key:'snack',label:'Snack'},{key:'supper',label:'Supper'}];

function WeekRow({ week, menus, cycleId, onAssign, onUnassign, onRefresh }) {
  const [open,             setOpen]            = useState(false);
  const [mode,             setMode]            = useState('pick'); // 'pick' | 'build'
  const [showImport,       setShowImport]      = useState(false);
  const [showBlankConfirm, setShowBlankConfirm] = useState(false);
  const [showGrid,         setShowGrid]        = useState(false);
  const [search,           setSearch]          = useState('');
  const [menuName,         setMenuName]        = useState(`Week ${week.week_number} Menu`);
  const [cells,            setCells]           = useState({}); // { 'mon_breakfast': 'Oatmeal', ... }
  const [saving,           setSaving]          = useState(false);

  const filtered = menus.filter(m =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const setCell = (day, meal, val) => setCells(p => ({ ...p, [`${day}_${meal}`]: val }));

  const handleBuildSave = async (forceBlank = false) => {
    if (!menuName.trim()) { alert('Enter a menu name.'); return; }
    const hasItems = Object.values(cells).some(v => v?.trim());
    if (!hasItems && !forceBlank) { setShowBlankConfirm(true); return; }
    setShowBlankConfirm(false);
    setSaving(true);
    try {
      const { data: newMenu } = await api.post('/menus/create-named', { name: menuName.trim() });
      const promises = [];
      for (const d of WEEK_DAYS) {
        for (const m of WEEK_MEALS) {
          const text = (cells[`${d.key}_${m.key}`] || '').trim();
          if (text) {
            promises.push(api.post(`/menus/${newMenu.id}/items`, {
              day_of_week: d.n, meal_type: m.key, food_item: text,
              component: m.key === 'snack' ? 'fruit' : m.key === 'breakfast' ? 'grain' : 'grain',
            }));
          }
        }
      }
      await Promise.all(promises);
      await api.put(`/menu-cycles/${cycleId}/weeks/${week.week_number}`, { menu_id: newMenu.id });
      onRefresh();
      setOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save menu');
    } finally { setSaving(false); }
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-brand-600">{week.week_number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{week.label || `Week ${week.week_number}`}</p>
          {week.menu_name ? (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-green-600 font-medium">✓ {week.menu_name}</p>
              {week.item_count === 0 && (
                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Menu not built yet
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No menu assigned</p>
          )}
          {week.menu_id && week.item_count > 0 && (
            <button onClick={() => setShowGrid(g => !g)}
              className="text-xs text-brand-600 hover:underline font-medium flex items-center gap-1">
              {showGrid ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
              {showGrid ? 'Hide menu' : 'Review menu'}
            </button>
          )}
          {week.menu_id && week.item_count === 0 && (
            <a href="/dashboard/sponsor/menus"
              className="text-xs text-brand-600 hover:underline font-medium">
              Edit in Menu Builder →
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {week.menu_id && (
            <button onClick={() => onUnassign(week.week_number)}
              className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 flex items-center gap-1">
              <Unlink className="w-3 h-3" /> Unassign
            </button>
          )}
          <button onClick={() => { setOpen(o => !o); setMode('pick'); }}
            className="text-xs text-brand-600 font-semibold px-2 py-1 rounded-lg hover:bg-brand-50 flex items-center gap-1">
            <Link2 className="w-3 h-3" /> {week.menu_id ? 'Change' : 'Assign'}
          </button>
          <button onClick={() => { setOpen(true); setMode('build'); }}
            className="text-xs text-green-700 font-semibold px-2 py-1 rounded-lg hover:bg-green-50 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Build menu
          </button>
          <button onClick={() => setShowImport(true)}
            className="text-xs text-purple-700 font-semibold px-2 py-1 rounded-lg hover:bg-purple-50 flex items-center gap-1">
            <Upload className="w-3 h-3" /> Import
          </button>
        </div>
      </div>
      {week.menu_id && showGrid && (
        <WeekMenuGrid menuId={week.menu_id} />
      )}
      {showImport && (
        <ImportWeekMenuModal
          week={week}
          cycleId={cycleId}
          onClose={() => setShowImport(false)}
          onRefresh={() => { setShowImport(false); setShowGrid(true); onRefresh(); }}
        />
      )}

      {open && mode === 'pick' && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex gap-2 mb-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search existing menus…" autoFocus
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 px-2"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">No menus found — use <strong>Build menu</strong> to create one here.</p>
            )}
            {filtered.map(m => (
              <button key={m.id} onClick={() => { onAssign(week.week_number, m.id); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white transition-all ${
                  week.menu_id === m.id ? 'bg-white ring-1 ring-brand-300 text-brand-700 font-semibold' : 'text-gray-700'
                }`}>
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="flex-1 truncate">{m.name || `Week of ${m.week_start?.slice(0,10)}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && mode === 'build' && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 mr-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Menu Name</label>
              <input type="text" value={menuName} onChange={e => setMenuName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 mt-4"><X className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <td className="py-1 pr-2 font-bold text-gray-500 w-20" />
                  {WEEK_DAYS.map(d => (
                    <td key={d.key} className="py-1 px-1 font-bold text-gray-600 text-center">{d.label}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEEK_MEALS.map(m => (
                  <tr key={m.key}>
                    <td className="py-1 pr-2 font-semibold text-gray-500 whitespace-nowrap">{m.label}</td>
                    {WEEK_DAYS.map(d => (
                      <td key={d.key} className="py-0.5 px-1">
                        <input
                          type="text"
                          placeholder="—"
                          value={cells[`${d.key}_${m.key}`] || ''}
                          onChange={e => setCell(d.key, m.key, e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white min-w-[80px]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={() => handleBuildSave(false)} disabled={saving}
              className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-40">
              {saving ? 'Saving…' : '✓ Save Menu & Assign'}
            </button>
          </div>

          {showBlankConfirm && (
            <div className="mt-3 border border-amber-200 bg-amber-50 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-800 mb-1">Create blank menu?</p>
              <p className="text-xs text-amber-700 mb-3">A blank menu will be created for this week. You can add food items later in Menu Builder.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowBlankConfirm(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={() => handleBuildSave(true)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg">
                  Create Blank Menu
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Cycle Card ─────────────────────────────────────────────────────────────────
function CycleCard({ cycle, menus, onSelect, selected, onDelete, onApply, onScheduleRemove, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const assignedCount = (cycle.weeks || []).filter(w => w.menu_id).length;
  const totalWeeks    = cycle.week_count || 0;
  const pct           = totalWeeks ? Math.round((assignedCount / totalWeeks) * 100) : 0;
  const activeScheds  = (cycle.schedules || []).filter(isActive);
  const hasActive     = activeScheds.length > 0;

  const handleAssign = async (weekNum, menuId) => {
    setAssigning(true);
    try {
      await api.put(`/menu-cycles/${cycle.id}/weeks/${weekNum}`, { menu_id: menuId });
      onRefresh();
    } catch { /* silent */ } finally { setAssigning(false); }
  };

  const handleUnassign = async (weekNum) => {
    setAssigning(true);
    try {
      await api.put(`/menu-cycles/${cycle.id}/weeks/${weekNum}`, { menu_id: null });
      onRefresh();
    } catch { /* silent */ } finally { setAssigning(false); }
  };

  return (
    <div className={`card overflow-hidden transition-all ${selected ? 'ring-2 ring-brand-400' : ''}`}>
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            hasActive ? 'bg-green-50' : 'bg-brand-50'
          }`}>
            <FolderOpen className={`w-5 h-5 ${hasActive ? 'text-green-600' : 'text-brand-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-gray-900">{cycle.name}</h3>
              {hasActive && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                  Active
                </span>
              )}
            </div>
            {cycle.description && (() => {
            const m = cycle.description.match(/^site:[^:]+:(.+)$/);
            const siteName = m ? m[1] : cycle.description;
            return siteName ? <p className="text-xs text-gray-500 mt-0.5">📍 {siteName}</p> : null;
          })()}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>{totalWeeks} weeks</span>
              <span>·</span>
              <span>{assignedCount}/{totalWeeks} menus assigned</span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-brand-400'}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-900 font-bold">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {expanded ? 'Hide weeks' : 'Manage weeks'}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => onApply(cycle)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors">
              <Calendar className="w-3.5 h-3.5" /> Apply to Calendar
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Delete?</span>
                <button onClick={() => onDelete(cycle.id)} className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 px-2 py-1 rounded-lg hover:bg-gray-100">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-gray-300 hover:text-red-400 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: week list */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-2 bg-gray-50">
          {assigning && <p className="text-xs text-gray-400">Saving…</p>}
          {(cycle.weeks || []).map(w => (
            <WeekRow key={w.week_number} week={w} menus={menus}
              cycleId={cycle.id}
              onAssign={handleAssign} onUnassign={handleUnassign} onRefresh={onRefresh} />
          ))}
          {(!cycle.weeks || cycle.weeks.length === 0) && (
            <p className="text-xs text-gray-400 text-center py-4">No weeks — reload to see them.</p>
          )}
          {(cycle.weeks || []).length > 0 && (cycle.weeks || []).every(w => !w.menu_id) && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
              <strong>Next step:</strong> Go to <a href="/dashboard/sponsor/menus" className="underline font-bold">Menu Builder</a> → add food items for each day → come back here and assign those menus to each week slot.
            </div>
          )}
        </div>
      )}

      {/* Active schedules */}
      {(cycle.schedules || []).length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3 bg-white">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Scheduled</p>
          <div className="space-y-1.5">
            {cycle.schedules.map(s => (
              <div key={s.id} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
                isActive(s) ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'
              }`}>
                <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${isActive(s) ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`font-medium ${isActive(s) ? 'text-green-700' : 'text-gray-600'}`}>
                  {fmtDate(s.start_date)} → {fmtEndDate(s.end_date)}
                </span>
                {s.end_date && s.end_date < '2099-01-01' && (
                  <span className="text-gray-400">· {weekRange(s.start_date, s.end_date)}</span>
                )}
                {s.notes && <span className="text-gray-400 truncate ml-1">· {s.notes}</span>}
                <button onClick={() => onScheduleRemove(s.id)} className="ml-auto text-gray-300 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MenuCyclesPage() {
  const [cycles,       setCycles]       = useState([]);
  const [menus,        setMenus]        = useState([]);
  const [sites,        setSites]        = useState([]);
  const [currentCycle, setCurrentCycle] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showNew,      setShowNew]      = useState(false);
  const [applyTarget,  setApplyTarget]  = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cycRes, menuRes, curRes, siteRes] = await Promise.all([
        api.get('/menu-cycles'),
        api.get('/menus?limit=200'),
        api.get('/menu-cycles/current').catch(() => ({ data: {} })),
        api.get('/organizations?type=site&limit=200').catch(() => ({ data: {} })),
      ]);
      setCycles(cycRes.data.cycles || []);
      setMenus(menuRes.data.menus || []);
      setCurrentCycle(curRes.data);
      setSites(siteRes.data.organizations || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/menu-cycles/${id}`);
      setCycles(prev => prev.filter(c => c.id !== id));
    } catch { alert('Failed to delete cycle.'); }
  };

  const handleScheduleRemove = async (scheduleId) => {
    try {
      await api.delete(`/menu-cycles/schedules/${scheduleId}`);
      load();
    } catch { alert('Failed to remove schedule.'); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Cycles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Build reusable rotating menus — Fall Cycle, Winter Cycle, Summer Program.
            Apply once and the system knows what's for lunch every day.
          </p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> New Cycle
        </button>
      </div>

      {/* How it works — first visit callout */}
      {cycles.length === 0 && !loading && (
        <div className="card px-6 py-8 text-center mb-6">
          <FolderOpen className="w-10 h-10 text-brand-200 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Build your menu library</h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto mb-6">
            Instead of rebuilding menus every week, create a cycle once and schedule it for the whole semester.
            Production Records and Claims automatically know what's on the menu — no manual lookup.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6 text-left max-w-xl mx-auto">
            {[
              { step: '1', label: 'Create a cycle', desc: 'Fall Cycle · 4 weeks' },
              { step: '2', label: 'Assign menus', desc: 'Week 1 → Turkey Lunch menu' },
              { step: '3', label: 'Apply to calendar', desc: 'Aug 18 → Oct 31, repeating' },
            ].map(s => (
              <div key={s.step} className="bg-gray-50 rounded-xl p-4">
                <div className="w-6 h-6 bg-brand-600 text-white rounded-full text-xs font-bold flex items-center justify-center mb-2">{s.step}</div>
                <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl">
            <Plus className="w-4 h-4" /> Create Your First Cycle
          </button>
        </div>
      )}

      {/* Active cycle card */}
      <ActiveCycleCard current={currentCycle} />

      {/* Cycle list */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Loading cycles…</div>
      ) : (
        <div className="space-y-4">
          {cycles.map(cycle => (
            <CycleCard
              key={cycle.id}
              cycle={cycle}
              menus={menus}
              onDelete={handleDelete}
              onApply={c => setApplyTarget(c)}
              onScheduleRemove={handleScheduleRemove}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {/* USDA note */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mt-6">
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          USDA 7 CFR Part 226 — menus must be approved before the first day of service and retained for 3 years.
          Cycle menus count as pre-approved for the dates they're scheduled.
        </p>
      </div>

      {/* Modals */}
      {showNew && (
        <CreateCycleWizard
          menus={menus}
          sites={sites}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load(); }}
        />
      )}
      {applyTarget && (
        <ApplyModal
          cycle={applyTarget}
          onClose={() => setApplyTarget(null)}
          onApplied={load}
        />
      )}
    </div>
  );
}
