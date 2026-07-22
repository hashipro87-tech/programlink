// MenuBuilderPage — CACFP Weekly Menu Builder with meal pattern validation + WGR check
import { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed, Plus, X, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, AlertTriangle, Wheat, Trash2,
  FileCheck, Copy, Loader2, CopyCheck,
} from 'lucide-react';
import api from '../../services/api';

// ── CACFP Constants ───────────────────────────────────────────────────────────
const DAYS = [
  { num: 1, short: 'Mon', label: 'Monday'    },
  { num: 2, short: 'Tue', label: 'Tuesday'   },
  { num: 3, short: 'Wed', label: 'Wednesday' },
  { num: 4, short: 'Thu', label: 'Thursday'  },
  { num: 5, short: 'Fri', label: 'Friday'    },
  { num: 6, short: 'Sat', label: 'Saturday'  },
  { num: 7, short: 'Sun', label: 'Sunday'    },
];

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', color: 'amber'  },
  { key: 'lunch',     label: 'Lunch',     color: 'green'  },
  { key: 'snack',     label: 'Snack',     color: 'blue'   },
  { key: 'supper',    label: 'Supper',    color: 'purple' },
];

const COMPONENTS = [
  { key: 'milk',      label: 'Milk',           emoji: '🥛' },
  { key: 'grain',     label: 'Grain/Bread',    emoji: '🌾' },
  { key: 'protein',   label: 'Meat/Meat Alt.', emoji: '🥩' },
  { key: 'fruit',     label: 'Fruit',          emoji: '🍎' },
  { key: 'vegetable', label: 'Vegetable',      emoji: '🥦' },
  { key: 'other',     label: 'Other',          emoji: '➕' },
];

const MEAL_COLOR = {
  breakfast: { bg: 'bg-amber-50',  border: 'border-amber-200', header: 'bg-amber-100', text: 'text-amber-800' },
  lunch:     { bg: 'bg-green-50',  border: 'border-green-200', header: 'bg-green-100', text: 'text-green-800' },
  snack:     { bg: 'bg-blue-50',   border: 'border-blue-200',  header: 'bg-blue-100',  text: 'text-blue-800'  },
  supper:    { bg: 'bg-purple-50', border: 'border-purple-200',header: 'bg-purple-100',text: 'text-purple-800' },
};

// ── Validation Logic ──────────────────────────────────────────────────────────
function validateMealClient(items, mealType) {
  const has = (comp) => Array.isArray(comp)
    ? comp.some(c => items.some(i => i.component === c))
    : items.some(i => i.component === comp);

  const missing = [];
  if (mealType === 'breakfast') {
    if (!has('milk'))                 missing.push('Milk');
    if (!has('grain'))                missing.push('Grain/Bread');
    if (!has(['fruit','vegetable']))  missing.push('Fruit or Vegetable');
  } else if (mealType === 'lunch' || mealType === 'supper') {
    if (!has('milk'))      missing.push('Milk');
    if (!has('grain'))     missing.push('Grain/Bread');
    if (!has('protein'))   missing.push('Meat/Meat Alt.');
    if (!has('fruit'))     missing.push('Fruit');
    if (!has('vegetable')) missing.push('Vegetable');
  } else if (mealType === 'snack') {
    const SNACK_COMPS = ['milk','grain','protein','fruit','vegetable'];
    const present = SNACK_COMPS.filter(c => items.some(i => i.component === c)).length;
    if (present < 2) missing.push(`Need ${2 - present} more component${2 - present !== 1 ? 's' : ''}`);
  }
  return missing;
}

function getMealStatus(items, mealType) {
  if (items.length === 0) return 'empty';
  return validateMealClient(items, mealType).length === 0 ? 'complete' : 'incomplete';
}

function getDayWGROk(dayItems) {
  const grains = dayItems.filter(i => i.component === 'grain');
  if (grains.length === 0) return null;
  return grains.some(i => i.is_whole_grain);
}

// Per-day issues for the assistant panel
function getDayIssues(dayItems) {
  const issues = [];
  const wgrOk = getDayWGROk(dayItems);
  if (wgrOk === false) {
    issues.push({ severity: 'yellow', meal: 'breakfast', label: 'Missing Whole Grain Rich item' });
  }
  MEALS.forEach(m => {
    const mi = dayItems.filter(i => i.meal_type === m.key);
    if (mi.length === 0) return;
    validateMealClient(mi, m.key).forEach(miss => {
      issues.push({ severity: 'red', meal: m.key, label: `${m.label} — missing ${miss}` });
    });
  });
  return issues;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function addWeeks(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().split('T')[0];
}

function formatWeek(weekStart) {
  const start = new Date(weekStart);
  const end   = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
}

function dayDate(weekStart, dayNum) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + (dayNum - 1));
  return d.getDate();
}

// ── Day Status Panel (the assistant) ─────────────────────────────────────────
function DayStatusPanel({ items, weekStart, onOpenCell }) {
  const hasAny = items.length > 0;
  if (!hasAny) return null;

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Weekly Validation</h3>
        <p className="text-xs text-gray-500 mt-0.5">Click any issue to go directly to that meal</p>
      </div>
      <div className="divide-y divide-gray-100">
        {DAYS.map(day => {
          const dayItems = items.filter(i => i.day_of_week === day.num);
          const issues   = getDayIssues(dayItems);
          const hasItems = dayItems.length > 0;

          const statusColor = !hasItems      ? { dot: '⚪', bg: 'bg-gray-50',   text: 'text-gray-400', label: '— No meals added' }
            : issues.some(i => i.severity === 'red')    ? { dot: '🔴', bg: 'bg-red-50',    text: 'text-red-800',   label: '' }
            : issues.length > 0                          ? { dot: '🟡', bg: 'bg-amber-50',  text: 'text-amber-800', label: '' }
            :                                              { dot: '🟢', bg: 'bg-green-50',  text: 'text-green-800', label: '— Complete' };

          return (
            <div key={day.num} className={`px-5 py-3 flex items-start gap-3 ${statusColor.bg}`}>
              <span className="text-base mt-0.5 flex-shrink-0">{statusColor.dot}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${statusColor.text}`}>
                  {day.label}{statusColor.label}
                </p>
                {issues.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {issues.map((issue, i) => (
                      <button key={i} onClick={() => onOpenCell(day.num, issue.meal)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors hover:opacity-80 ${
                          issue.severity === 'red'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}>
                        → {issue.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Duplicate Day Modal ───────────────────────────────────────────────────────
function DuplicateDayModal({ fromDay, onConfirm, onClose, busy }) {
  const [targets, setTargets] = useState([]);
  const otherDays = DAYS.filter(d => d.num !== fromDay.num);

  function toggle(num) {
    setTargets(t => t.includes(num) ? t.filter(x => x !== num) : [...t, num]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Copy {fromDay.label} to…</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 space-y-2">
          {otherDays.map(d => (
            <label key={d.num} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50">
              <input type="checkbox" checked={targets.includes(d.num)} onChange={() => toggle(d.num)}
                className="w-4 h-4 rounded accent-brand-600" />
              <span className="text-sm font-medium text-gray-800">{d.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(targets)} disabled={targets.length === 0 || busy}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CopyCheck className="w-4 h-4" />}
            {busy ? 'Copying…' : `Copy to ${targets.length || ''} day${targets.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MenuBuilderPage() {
  const [weekStart, setWeekStart]   = useState(() => mondayOf(new Date()));
  const [menu, setMenu]             = useState(null);
  const [items, setItems]           = useState([]);
  const [orgs, setOrgs]             = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [copyingPrev, setCopyingPrev] = useState(false);
  const [copyMsg, setCopyMsg]       = useState('');

  // Cell editor
  const [activeCell, setActiveCell] = useState(null); // { day, meal }
  const [itemForm, setItemForm]     = useState({ food_item: '', component: 'grain', is_whole_grain: false, quantity: '' });
  const [formError, setFormError]   = useState('');

  // Duplicate day
  const [dupDay, setDupDay]         = useState(null); // day object
  const [dupBusy, setDupBusy]       = useState(false);

  // Load orgs
  useEffect(() => {
    api.get('/organizations?limit=100').catch(() => ({ data: { organizations: [] } }))
      .then(r => setOrgs(r.data.organizations || r.data || []));
  }, []);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const listRes = await api.get(`/menus?limit=50`);
      const existing = (listRes.data.menus || []).find(m => {
        const ms = m.week_start?.slice(0, 10);
        return ms === weekStart && (!selectedOrg || m.org_id === selectedOrg);
      });
      if (existing) {
        const detailRes = await api.get(`/menus/${existing.id}`);
        setMenu(detailRes.data.menu);
        setItems(detailRes.data.items || []);
      } else {
        setMenu(null);
        setItems([]);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [weekStart, selectedOrg]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  async function ensureMenu() {
    if (menu) return menu;
    const res = await api.post('/menus', {
      week_start: weekStart,
      name: `Week of ${formatWeek(weekStart)}`,
      org_id: selectedOrg || undefined,
    });
    setMenu(res.data);
    return res.data;
  }

  function openCell(day, meal) {
    setActiveCell({ day, meal });
    setItemForm({ food_item: '', component: 'grain', is_whole_grain: false, quantity: '' });
    setFormError('');
  }

  function closeCell() { setActiveCell(null); setFormError(''); }

  async function addItem() {
    if (!itemForm.food_item.trim()) { setFormError('Enter a food item name'); return; }
    setSaving(true); setFormError('');
    try {
      const m = await ensureMenu();
      await api.post(`/menus/${m.id}/items`, {
        day_of_week:    activeCell.day,
        meal_type:      activeCell.meal,
        food_item:      itemForm.food_item.trim(),
        component:      itemForm.component,
        is_whole_grain: itemForm.component === 'grain' && itemForm.is_whole_grain,
        quantity:       itemForm.quantity || undefined,
      });
      await loadMenu();
      setItemForm({ food_item: '', component: 'grain', is_whole_grain: false, quantity: '' });
    } catch (e) {
      setFormError(e.response?.data?.error || 'Failed to add item');
    } finally { setSaving(false); }
  }

  async function removeItem(itemId) {
    try {
      await api.delete(`/menus/items/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch { /* silent */ }
  }

  async function updateStatus(status) {
    if (!menu) return;
    try {
      await api.put(`/menus/${menu.id}`, { status });
      setMenu(m => ({ ...m, status }));
    } catch { /* silent */ }
  }

  // ── Copy Previous Week ────────────────────────────────────────────────────
  async function copyPreviousWeek() {
    setCopyingPrev(true);
    setCopyMsg('');
    try {
      const prevWeek = addWeeks(weekStart, -1);
      const listRes  = await api.get(`/menus?limit=50`);
      const prevMenu = (listRes.data.menus || []).find(m =>
        m.week_start?.slice(0, 10) === prevWeek && (!selectedOrg || m.org_id === selectedOrg)
      );
      if (!prevMenu) { setCopyMsg('No menu found for last week'); return; }

      const detailRes = await api.get(`/menus/${prevMenu.id}`);
      const prevItems = detailRes.data.items || [];
      if (!prevItems.length) { setCopyMsg('Last week\'s menu has no items'); return; }

      const m = await ensureMenu();
      await Promise.all(prevItems.map(item =>
        api.post(`/menus/${m.id}/items`, {
          day_of_week:    item.day_of_week,
          meal_type:      item.meal_type,
          food_item:      item.food_item,
          component:      item.component,
          is_whole_grain: item.is_whole_grain,
          quantity:       item.quantity,
        })
      ));
      await loadMenu();
      setCopyMsg(`Copied ${prevItems.length} items from last week`);
      setTimeout(() => setCopyMsg(''), 3000);
    } catch {
      setCopyMsg('Copy failed — try again');
    } finally {
      setCopyingPrev(false);
    }
  }

  // ── Duplicate Day ─────────────────────────────────────────────────────────
  async function duplicateDay(targetDays) {
    if (!dupDay || !targetDays.length) return;
    setDupBusy(true);
    try {
      const fromItems = items.filter(i => i.day_of_week === dupDay.num);
      if (!fromItems.length) { setDupDay(null); return; }
      const m = await ensureMenu();
      await Promise.all(
        targetDays.flatMap(toDay =>
          fromItems.map(item =>
            api.post(`/menus/${m.id}/items`, {
              day_of_week:    toDay,
              meal_type:      item.meal_type,
              food_item:      item.food_item,
              component:      item.component,
              is_whole_grain: item.is_whole_grain,
              quantity:       item.quantity,
            })
          )
        )
      );
      await loadMenu();
      setDupDay(null);
    } catch { /* silent */ }
    finally { setDupBusy(false); }
  }

  // Helpers
  const cellItems   = (day, meal) => items.filter(i => i.day_of_week === day && i.meal_type === meal);
  const totalIssues = (() => {
    let count = 0;
    DAYS.forEach(d => {
      const dayItems = items.filter(i => i.day_of_week === d.num);
      if (getDayWGROk(dayItems) === false) count++;
      MEALS.forEach(m => count += validateMealClient(dayItems.filter(i => i.meal_type === m.key), m.key).length);
    });
    return count;
  })();

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan weekly menus and validate CACFP meal patterns</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Copy previous week */}
          <button onClick={copyPreviousWeek} disabled={copyingPrev}
            className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {copyingPrev ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Copy Previous Week
          </button>

          {menu && menu.status === 'draft' && totalIssues === 0 && (
            <button onClick={() => updateStatus('approved')}
              className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
              <FileCheck className="w-4 h-4" /> Approve Menu
            </button>
          )}
          {menu && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              menu.status === 'approved' ? 'bg-green-100 text-green-700' :
              menu.status === 'submitted' ? 'bg-brand-100 text-brand-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {menu.status.charAt(0).toUpperCase() + menu.status.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Copy message toast */}
      {copyMsg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
          copyMsg.includes('Copied') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {copyMsg.includes('Copied') ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {copyMsg}
        </div>
      )}

      {/* Week nav + org picker */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setWeekStart(w => addWeeks(w, -1))}
            className="p-2 hover:bg-gray-50 text-gray-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm font-medium text-gray-700 whitespace-nowrap min-w-[200px] text-center">
            {formatWeek(weekStart)}
          </span>
          <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
            className="p-2 hover:bg-gray-50 text-gray-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {orgs.length > 0 && (
          <select className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-brand-400"
            value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
            <option value="">My Organization</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}

        <button onClick={() => setWeekStart(mondayOf(new Date()))}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2">
          This week
        </button>
      </div>

      {/* Validation summary bar */}
      {items.length > 0 && (
        <div className={`rounded-xl px-4 py-3 mb-4 flex items-center gap-3 ${
          totalIssues === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          {totalIssues === 0
            ? <><CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-sm font-medium text-green-700">All meal patterns complete — menu is ready to approve</span></>
            : <><AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" /><span className="text-sm font-medium text-amber-700">{totalIssues} issue{totalIssues !== 1 ? 's' : ''} — see the Weekly Validation panel below</span></>
          }
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading menu…</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 1160 }}>
              <thead>
                <tr>
                  <th className="w-24 p-2" />
                  {DAYS.map(d => {
                    const dayHasItems = items.some(i => i.day_of_week === d.num);
                    return (
                      <th key={d.num} className="p-2 text-center">
                        <div className="font-semibold text-gray-700 text-sm">{d.short}</div>
                        <div className="text-xs text-gray-400 mb-1">{dayDate(weekStart, d.num)}</div>
                        {/* Duplicate day button */}
                        {dayHasItems && (
                          <button onClick={() => setDupDay(d)}
                            title={`Copy ${d.label} to another day`}
                            className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-1 mx-auto transition-colors">
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {MEALS.map(meal => (
                  <tr key={meal.key}>
                    <td className="p-2 align-top">
                      <div className={`text-xs font-bold uppercase tracking-wide ${MEAL_COLOR[meal.key].text} text-right pr-2`}>
                        {meal.label}
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const ci      = cellItems(day.num, meal.key);
                      const missing = validateMealClient(ci, meal.key);
                      const status  = getMealStatus(ci, meal.key);
                      const dayItems = items.filter(i => i.day_of_week === day.num);
                      const wgrOk    = getDayWGROk(dayItems);
                      const showWGR  = meal.key === 'breakfast' && wgrOk === false && ci.length > 0;

                      return (
                        <td key={day.num} className="p-1.5 align-top">
                          <div
                            className={`rounded-xl border-2 min-h-[110px] p-2 cursor-pointer transition-all
                              ${status === 'complete'   ? 'border-green-200 bg-green-50'
                              : status === 'incomplete' ? 'border-red-200 bg-red-50'
                              : 'border-gray-100 bg-gray-50 hover:border-brand-200 hover:bg-brand-50'}`}
                            onClick={() => openCell(day.num, meal.key)}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1">
                                {status === 'complete'   && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                {status === 'incomplete' && <AlertCircle  className="w-3.5 h-3.5 text-red-400"   />}
                                {showWGR && <span title="No Whole Grain Rich item this day"><Wheat className="w-3.5 h-3.5 text-amber-500" /></span>}
                              </div>
                              <Plus className="w-3.5 h-3.5 text-gray-300" />
                            </div>
                            <div className="space-y-1">
                              {ci.map(item => <FoodChip key={item.id} item={item} onRemove={removeItem} />)}
                            </div>
                            {status === 'incomplete' && ci.length > 0 && (
                              <div className="mt-1.5 text-xs text-red-400 leading-tight">
                                Missing: {missing.join(', ')}
                              </div>
                            )}
                            {status === 'empty' && (
                              <div className="text-xs text-gray-300 text-center pt-3">Click to add</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Complete</span>
            <span className="flex items-center gap-1"><AlertCircle  className="w-3.5 h-3.5 text-red-400"   /> Missing components</span>
            <span className="flex items-center gap-1"><Wheat        className="w-3.5 h-3.5 text-amber-500" /> No Whole Grain Rich item</span>
            <span className="flex items-center gap-1 ml-2 font-medium">WGR = at least one grain must be ≥51% whole grain per day</span>
          </div>

          {/* ── Per-day validation assistant ── */}
          <DayStatusPanel items={items} weekStart={weekStart} onOpenCell={openCell} />
        </>
      )}

      {/* Add Item Drawer */}
      {activeCell && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">
                  {MEALS.find(m => m.key === activeCell.meal)?.label} — {DAYS.find(d => d.num === activeCell.day)?.label}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeCell.meal === 'breakfast' && 'Required: Milk · Grain/Bread · Fruit or Vegetable'}
                  {(activeCell.meal === 'lunch' || activeCell.meal === 'supper') && 'Required: Milk · Grain · Meat/Alt · Fruit · Vegetable'}
                  {activeCell.meal === 'snack' && 'Required: Any 2 of — Milk, Grain, Protein, Fruit/Vegetable'}
                </p>
              </div>
              <button onClick={closeCell} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {cellItems(activeCell.day, activeCell.meal).length > 0 && (
              <div className="px-5 pt-3 pb-2">
                <p className="text-xs font-semibold text-gray-500 mb-2">On this menu:</p>
                <div className="flex flex-wrap gap-2">
                  {cellItems(activeCell.day, activeCell.meal).map(item => (
                    <FoodChip key={item.id} item={item} onRemove={async (id) => { await removeItem(id); }} large />
                  ))}
                </div>
              </div>
            )}

            <div className="px-5 py-4 space-y-3">
              {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</p>}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Food Item</label>
                <input autoFocus className="input w-full" placeholder="e.g. Whole wheat bread, 2% milk, Apple slices…"
                  value={itemForm.food_item}
                  onChange={e => setItemForm(f => ({ ...f, food_item: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addItem()} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Component</label>
                  <select className="input w-full" value={itemForm.component}
                    onChange={e => setItemForm(f => ({ ...f, component: e.target.value, is_whole_grain: false }))}>
                    {COMPONENTS.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity (optional)</label>
                  <input className="input w-full" placeholder="e.g. 1 cup, 2 oz"
                    value={itemForm.quantity}
                    onChange={e => setItemForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>
              {itemForm.component === 'grain' && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={itemForm.is_whole_grain}
                    onChange={e => setItemForm(f => ({ ...f, is_whole_grain: e.target.checked }))}
                    className="w-4 h-4 rounded accent-brand-600" />
                  <span className="text-sm text-gray-700">
                    <Wheat className="inline w-3.5 h-3.5 text-amber-500 mr-1" />
                    This is a <strong>Whole Grain Rich</strong> item (≥51% whole grain)
                  </span>
                </label>
              )}
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button onClick={closeCell} className="btn-secondary flex-1">Done</button>
              <button onClick={addItem} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> {saving ? 'Adding…' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Day Modal */}
      {dupDay && (
        <DuplicateDayModal
          fromDay={dupDay}
          onConfirm={duplicateDay}
          onClose={() => setDupDay(null)}
          busy={dupBusy}
        />
      )}
    </div>
  );
}

// ── Food Chip ─────────────────────────────────────────────────────────────────
function FoodChip({ item, onRemove, large = false }) {
  const comp = COMPONENTS.find(c => c.key === item.component) || COMPONENTS[5];
  return (
    <div className={`group flex items-center gap-1 rounded-full border bg-white ${
      large ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-xs'
    } border-gray-200 max-w-full`}>
      <span>{comp.emoji}</span>
      <span className="truncate text-gray-700">{item.food_item}</span>
      {item.is_whole_grain && <Wheat className="w-3 h-3 text-amber-500 flex-shrink-0" />}
      <button
        onClick={e => { e.stopPropagation(); onRemove(item.id); }}
        className="ml-0.5 text-gray-300 hover:text-red-500 flex-shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
