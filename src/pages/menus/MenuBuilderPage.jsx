// MenuBuilderPage — CACFP Weekly Menu Builder
// Features: meal templates, USDA food library, AI generate, infant validation,
//           daily reimbursement estimate, per-cell comments
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UtensilsCrossed, Plus, X, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, AlertTriangle, Wheat, Copy,
  FileCheck, Loader2, CopyCheck, Sparkles, Star, MessageSquare,
  Trash2, BookOpen, Baby, DollarSign, Search,
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

const INFANT_COMPONENTS = [
  { key: 'formula',       label: 'Breast Milk / Formula', emoji: '🍼' },
  { key: 'infant_cereal', label: 'Infant Cereal',         emoji: '🥣' },
  { key: 'pureed_fruit',  label: 'Pureed Fruit',          emoji: '🍑' },
  { key: 'pureed_veg',    label: 'Pureed Vegetable',      emoji: '🥕' },
  { key: 'soft_protein',  label: 'Soft Protein',          emoji: '🥚' },
  { key: 'finger_food',   label: 'Finger Food',           emoji: '🫐' },
];

const ALL_COMPONENTS = [...COMPONENTS, ...INFANT_COMPONENTS];

const MEAL_COLOR = {
  breakfast: { bg: 'bg-amber-50',  border: 'border-amber-200', header: 'bg-amber-100',  text: 'text-amber-800'  },
  lunch:     { bg: 'bg-green-50',  border: 'border-green-200', header: 'bg-green-100',  text: 'text-green-800'  },
  snack:     { bg: 'bg-blue-50',   border: 'border-blue-200',  header: 'bg-blue-100',   text: 'text-blue-800'   },
  supper:    { bg: 'bg-purple-50', border: 'border-purple-200',header: 'bg-purple-100', text: 'text-purple-800' },
  infant:    { bg: 'bg-pink-50',   border: 'border-pink-200',  header: 'bg-pink-100',   text: 'text-pink-800'   },
};

// ── USDA Curated Food Library ──────────────────────────────────────────────────
const CACFP_FOODS = [
  // Milk
  { name: '1% low-fat milk',          component: 'milk',      wgr: false },
  { name: '2% reduced-fat milk',      component: 'milk',      wgr: false },
  { name: 'Skim milk',                component: 'milk',      wgr: false },
  { name: 'Whole milk',               component: 'milk',      wgr: false },
  { name: 'Low-fat chocolate milk',   component: 'milk',      wgr: false },
  // Grains — WGR
  { name: 'Whole wheat bread',        component: 'grain',     wgr: true  },
  { name: 'Whole grain tortilla',     component: 'grain',     wgr: true  },
  { name: 'Whole wheat English muffin', component: 'grain',   wgr: true  },
  { name: 'Oatmeal (rolled oats)',    component: 'grain',     wgr: true  },
  { name: 'Whole grain cereal',       component: 'grain',     wgr: true  },
  { name: 'Whole wheat pancakes',     component: 'grain',     wgr: true  },
  { name: 'Whole wheat waffles',      component: 'grain',     wgr: true  },
  { name: 'Brown rice',               component: 'grain',     wgr: true  },
  { name: 'Whole wheat pasta',        component: 'grain',     wgr: true  },
  { name: 'Whole grain crackers',     component: 'grain',     wgr: true  },
  // Grains — non-WGR
  { name: 'White bread',              component: 'grain',     wgr: false },
  { name: 'White rice',               component: 'grain',     wgr: false },
  { name: 'Cornbread',                component: 'grain',     wgr: false },
  { name: 'Biscuit',                  component: 'grain',     wgr: false },
  { name: 'Saltine crackers',         component: 'grain',     wgr: false },
  { name: 'Dinner roll',              component: 'grain',     wgr: false },
  // Protein
  { name: 'Scrambled eggs',           component: 'protein',   wgr: false },
  { name: 'Hard-boiled egg',          component: 'protein',   wgr: false },
  { name: 'Chicken (cooked)',         component: 'protein',   wgr: false },
  { name: 'Ground turkey (cooked)',   component: 'protein',   wgr: false },
  { name: 'Ground beef (cooked)',     component: 'protein',   wgr: false },
  { name: 'Fish (baked)',             component: 'protein',   wgr: false },
  { name: 'Tuna (canned)',            component: 'protein',   wgr: false },
  { name: 'Peanut butter',            component: 'protein',   wgr: false },
  { name: 'Black beans',              component: 'protein',   wgr: false },
  { name: 'Kidney beans',             component: 'protein',   wgr: false },
  { name: 'Cheese (sliced)',          component: 'protein',   wgr: false },
  { name: 'Cottage cheese',           component: 'protein',   wgr: false },
  { name: 'Yogurt (plain)',           component: 'protein',   wgr: false },
  { name: 'Hummus',                   component: 'protein',   wgr: false },
  { name: 'Tofu (soft)',              component: 'protein',   wgr: false },
  // Fruit
  { name: 'Apple slices',             component: 'fruit',     wgr: false },
  { name: 'Banana',                   component: 'fruit',     wgr: false },
  { name: 'Orange sections',          component: 'fruit',     wgr: false },
  { name: 'Grapes (halved)',          component: 'fruit',     wgr: false },
  { name: 'Strawberries',             component: 'fruit',     wgr: false },
  { name: 'Blueberries',             component: 'fruit',     wgr: false },
  { name: 'Peach slices',             component: 'fruit',     wgr: false },
  { name: 'Pear slices',              component: 'fruit',     wgr: false },
  { name: 'Pineapple chunks',         component: 'fruit',     wgr: false },
  { name: 'Watermelon cubes',         component: 'fruit',     wgr: false },
  { name: 'Mixed fruit cup',          component: 'fruit',     wgr: false },
  { name: 'Applesauce (unsweetened)', component: 'fruit',     wgr: false },
  { name: '100% orange juice',        component: 'fruit',     wgr: false },
  { name: '100% apple juice',         component: 'fruit',     wgr: false },
  // Vegetables
  { name: 'Broccoli (steamed)',       component: 'vegetable', wgr: false },
  { name: 'Carrots (cooked)',         component: 'vegetable', wgr: false },
  { name: 'Baby carrots',             component: 'vegetable', wgr: false },
  { name: 'Green beans',              component: 'vegetable', wgr: false },
  { name: 'Peas',                     component: 'vegetable', wgr: false },
  { name: 'Corn',                     component: 'vegetable', wgr: false },
  { name: 'Sweet potato (mashed)',    component: 'vegetable', wgr: false },
  { name: 'Cucumber slices',          component: 'vegetable', wgr: false },
  { name: 'Celery sticks',            component: 'vegetable', wgr: false },
  { name: 'Cherry tomatoes (halved)', component: 'vegetable', wgr: false },
  { name: 'Mixed salad greens',       component: 'vegetable', wgr: false },
  { name: 'Spinach (cooked)',         component: 'vegetable', wgr: false },
  { name: 'Bell pepper strips',       component: 'vegetable', wgr: false },
  { name: 'Squash (cooked)',          component: 'vegetable', wgr: false },
  { name: 'Mashed potatoes',          component: 'vegetable', wgr: false },
];

// ── Validation ────────────────────────────────────────────────────────────────
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
    const present = ['milk','grain','protein','fruit','vegetable'].filter(c => items.some(i => i.component === c)).length;
    if (present < 2) missing.push(`Need ${2 - present} more component${2 - present !== 1 ? 's' : ''}`);
  } else if (mealType === 'infant') {
    if (!has('formula')) missing.push('Breast Milk / Formula');
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

function getDayIssues(dayItems) {
  const issues = [];
  if (getDayWGROk(dayItems) === false)
    issues.push({ severity: 'yellow', meal: 'breakfast', label: 'Missing Whole Grain Rich item' });
  [...MEALS, { key: 'infant' }].forEach(m => {
    const mi = dayItems.filter(i => i.meal_type === m.key);
    if (mi.length === 0) return;
    validateMealClient(mi, m.key).forEach(miss =>
      issues.push({ severity: 'red', meal: m.key, label: `${m.label || 'Infant'} — missing ${miss}` })
    );
  });
  return issues;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
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
function fmtMoney(n) { return n < 1 ? `${(n*100).toFixed(0)}¢` : `$${n.toFixed(2)}`; }

// ── Sub-components ────────────────────────────────────────────────────────────
function FoodChip({ item, onRemove, large = false }) {
  const comp = ALL_COMPONENTS.find(c => c.key === item.component) || COMPONENTS[5];
  return (
    <div className={`group flex items-center gap-1 rounded-full border bg-white ${
      large ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-xs'
    } border-gray-200 max-w-full`}>
      <span>{comp.emoji}</span>
      <span className="truncate text-gray-700">{item.food_item}</span>
      {item.is_whole_grain && <Wheat className="w-3 h-3 text-amber-500 flex-shrink-0" />}
      <button onClick={e => { e.stopPropagation(); onRemove(item.id); }}
        className="ml-0.5 text-gray-300 hover:text-red-500 flex-shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function DayStatusPanel({ items, weekStart, onOpenCell }) {
  if (!items.length) return null;
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
          const sc = !hasItems                                   ? { dot: '⚪', bg: 'bg-gray-50',   text: 'text-gray-400',   label: '— No meals added' }
            : issues.some(i => i.severity === 'red')             ? { dot: '🔴', bg: 'bg-red-50',    text: 'text-red-800',    label: '' }
            : issues.length > 0                                  ? { dot: '🟡', bg: 'bg-amber-50',  text: 'text-amber-800',  label: '' }
            :                                                      { dot: '🟢', bg: 'bg-green-50',  text: 'text-green-800',  label: '— Complete' };
          return (
            <div key={day.num} className={`px-5 py-3 flex items-start gap-3 ${sc.bg}`}>
              <span className="text-base mt-0.5 flex-shrink-0">{sc.dot}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${sc.text}`}>{day.label}{sc.label}</p>
                {issues.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {issues.map((issue, i) => (
                      <button key={i} onClick={() => onOpenCell(day.num, issue.meal)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors hover:opacity-80 ${
                          issue.severity === 'red' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
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

function DuplicateDayModal({ fromDay, onConfirm, onClose, busy }) {
  const [targets, setTargets] = useState([]);
  const toggle = (num) => setTargets(t => t.includes(num) ? t.filter(x => x !== num) : [...t, num]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Copy {fromDay.label} to…</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 space-y-2">
          {DAYS.filter(d => d.num !== fromDay.num).map(d => (
            <label key={d.num} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50">
              <input type="checkbox" checked={targets.includes(d.num)} onChange={() => toggle(d.num)} className="w-4 h-4 rounded accent-brand-600" />
              <span className="text-sm font-medium text-gray-800">{d.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onConfirm(targets)} disabled={!targets.length || busy}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CopyCheck className="w-4 h-4" />}
            {busy ? 'Copying…' : `Copy to ${targets.length || ''} day${targets.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function GenerateMenuModal({ onConfirm, onClose, busy }) {
  const [prefs, setPrefs] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-gray-900">AI Generate Menu</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-600">Claude will generate a complete compliant 7-day menu. <strong>Existing items will be replaced.</strong></p>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Preferences (optional)</label>
            <input className="input w-full" placeholder="e.g. No peanuts, more fish, vegetarian Fridays…"
              value={prefs} onChange={e => setPrefs(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onConfirm(prefs)} disabled={busy}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MenuBuilderPage() {
  const [weekStart, setWeekStart]       = useState(() => mondayOf(new Date()));
  const [menu, setMenu]                 = useState(null);
  const [items, setItems]               = useState([]);
  const [orgs, setOrgs]                 = useState([]);
  const [selectedOrg, setSelectedOrg]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [copyingPrev, setCopyingPrev]   = useState(false);
  const [copyMsg, setCopyMsg]           = useState('');

  // Infant track
  const [hasInfant, setHasInfant]       = useState(false);

  // Reimbursement estimate
  const [rates, setRates]               = useState(null);
  const [estCount, setEstCount]         = useState('');

  // Templates
  const [templates, setTemplates]       = useState([]);

  // Comments
  const [comments, setComments]         = useState([]);

  // Cell editor
  const [activeCell, setActiveCell]     = useState(null); // { day, meal }
  const [drawerTab, setDrawerTab]       = useState('add'); // 'add' | 'library' | 'templates' | 'comments'
  const [itemForm, setItemForm]         = useState({ food_item: '', component: 'grain', is_whole_grain: false, quantity: '' });
  const [formError, setFormError]       = useState('');
  const [foodSearch, setFoodSearch]     = useState('');
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [newComment, setNewComment]     = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Duplicate day
  const [dupDay, setDupDay]             = useState(null);
  const [dupBusy, setDupBusy]           = useState(false);

  // AI generate
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating]     = useState(false);

  // Load orgs + rates + templates on mount
  useEffect(() => {
    api.get('/organizations?limit=100').catch(() => ({ data: { organizations: [] } }))
      .then(r => setOrgs(r.data.organizations || r.data || []));
    api.get('/menus/rates').then(r => setRates(r.data.rates)).catch(() => {});
    api.get('/menus/templates').then(r => setTemplates(r.data.templates || [])).catch(() => {});
  }, []);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const listRes = await api.get('/menus?limit=50');
      const existing = (listRes.data.menus || []).find(m => {
        const ms = m.week_start?.slice(0, 10);
        return ms === weekStart && (!selectedOrg || m.org_id === selectedOrg);
      });
      if (existing) {
        const detailRes = await api.get(`/menus/${existing.id}`);
        setMenu(detailRes.data.menu);
        setItems(detailRes.data.items || []);
        setHasInfant(detailRes.data.menu?.has_infant || false);
        // Load comments
        api.get(`/menus/${existing.id}/comments`).then(r => setComments(r.data.comments || [])).catch(() => {});
      } else {
        setMenu(null); setItems([]); setHasInfant(false); setComments([]);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [weekStart, selectedOrg]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  async function ensureMenu(infantOverride) {
    if (menu) return menu;
    const res = await api.post('/menus', {
      week_start: weekStart,
      name: `Week of ${formatWeek(weekStart)}`,
      org_id: selectedOrg || undefined,
      has_infant: infantOverride ?? hasInfant,
    });
    setMenu(res.data);
    return res.data;
  }

  // Toggle infant track (persists to DB)
  async function toggleInfant() {
    const next = !hasInfant;
    setHasInfant(next);
    try {
      const m = await ensureMenu(next);
      await api.put(`/menus/${m.id}`, { has_infant: next });
    } catch { /* silent */ }
  }

  function openCell(day, meal) {
    setActiveCell({ day, meal });
    setDrawerTab('add');
    setItemForm({ food_item: '', component: meal === 'infant' ? 'formula' : 'grain', is_whole_grain: false, quantity: '' });
    setFormError(''); setFoodSearch(''); setNewComment('');
  }
  function closeCell() { setActiveCell(null); setFormError(''); }

  async function addItem(overrides = {}) {
    const form = { ...itemForm, ...overrides };
    if (!form.food_item?.trim()) { setFormError('Enter a food item name'); return; }
    setSaving(true); setFormError('');
    try {
      const m = await ensureMenu();
      await api.post(`/menus/${m.id}/items`, {
        day_of_week:    activeCell.day,
        meal_type:      activeCell.meal,
        food_item:      form.food_item.trim(),
        component:      form.component,
        is_whole_grain: form.component === 'grain' && form.is_whole_grain,
        quantity:       form.quantity || undefined,
      });
      await loadMenu();
      setItemForm({ food_item: '', component: activeCell.meal === 'infant' ? 'formula' : 'grain', is_whole_grain: false, quantity: '' });
    } catch (e) {
      setFormError(e.response?.data?.error || 'Failed to add item');
    } finally { setSaving(false); }
  }

  async function quickAddFood(food) {
    if (!activeCell) return;
    setSaving(true);
    try {
      const m = await ensureMenu();
      await api.post(`/menus/${m.id}/items`, {
        day_of_week: activeCell.day, meal_type: activeCell.meal,
        food_item: food.name, component: food.component,
        is_whole_grain: food.wgr, quantity: undefined,
      });
      await loadMenu();
    } catch { /* silent */ }
    finally { setSaving(false); }
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

  // ── Template actions ────────────────────────────────────────────────────────
  async function handleSaveTemplate() {
    if (!templateName.trim() || !activeCell) return;
    const cellItems = items.filter(i => i.day_of_week === activeCell.day && i.meal_type === activeCell.meal);
    if (!cellItems.length) return;
    setSavingTemplate(true);
    try {
      const res = await api.post('/menus/templates', {
        name: templateName.trim(), meal_type: activeCell.meal,
        items: cellItems.map(({ food_item, component, is_whole_grain, quantity }) => ({ food_item, component, is_whole_grain, quantity })),
      });
      setTemplates(t => [res.data, ...t]);
      setTemplateName('');
    } catch { /* silent */ }
    finally { setSavingTemplate(false); }
  }

  async function applyTemplate(template) {
    if (!activeCell || !menu) return;
    setSaving(true);
    try {
      const m = await ensureMenu();
      await Promise.all((template.items || []).map(item =>
        api.post(`/menus/${m.id}/items`, {
          day_of_week: activeCell.day, meal_type: activeCell.meal,
          food_item: item.food_item, component: item.component,
          is_whole_grain: item.is_whole_grain, quantity: item.quantity,
        })
      ));
      await loadMenu();
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  async function deleteTemplate(id) {
    try {
      await api.delete(`/menus/templates/${id}`);
      setTemplates(t => t.filter(tp => tp.id !== id));
    } catch { /* silent */ }
  }

  // ── Comment actions ──────────────────────────────────────────────────────────
  async function handleAddComment() {
    if (!newComment.trim() || !menu) return;
    setAddingComment(true);
    try {
      const res = await api.post(`/menus/${menu.id}/comments`, {
        day_of_week: activeCell?.day, meal_type: activeCell?.meal,
        comment: newComment.trim(),
      });
      setComments(c => [...c, res.data]);
      setNewComment('');
    } catch { /* silent */ }
    finally { setAddingComment(false); }
  }

  async function handleDeleteComment(commentId) {
    try {
      await api.delete(`/menus/${menu.id}/comments/${commentId}`);
      setComments(c => c.filter(cm => cm.id !== commentId));
    } catch { /* silent */ }
  }

  // ── Copy previous week ───────────────────────────────────────────────────────
  async function copyPreviousWeek() {
    setCopyingPrev(true); setCopyMsg('');
    try {
      const prevWeek = addWeeks(weekStart, -1);
      const listRes  = await api.get('/menus?limit=50');
      const prevMenu = (listRes.data.menus || []).find(m =>
        m.week_start?.slice(0, 10) === prevWeek && (!selectedOrg || m.org_id === selectedOrg)
      );
      if (!prevMenu) { setCopyMsg('No menu found for last week'); return; }
      const detailRes = await api.get(`/menus/${prevMenu.id}`);
      const prevItems = detailRes.data.items || [];
      if (!prevItems.length) { setCopyMsg("Last week's menu has no items"); return; }
      const m = await ensureMenu();
      await Promise.all(prevItems.map(item =>
        api.post(`/menus/${m.id}/items`, {
          day_of_week: item.day_of_week, meal_type: item.meal_type,
          food_item: item.food_item, component: item.component,
          is_whole_grain: item.is_whole_grain, quantity: item.quantity,
        })
      ));
      await loadMenu();
      setCopyMsg(`Copied ${prevItems.length} items from last week`);
      setTimeout(() => setCopyMsg(''), 3000);
    } catch { setCopyMsg('Copy failed — try again'); }
    finally { setCopyingPrev(false); }
  }

  // ── Duplicate day ────────────────────────────────────────────────────────────
  async function duplicateDay(targetDays) {
    if (!dupDay || !targetDays.length) return;
    setDupBusy(true);
    try {
      const fromItems = items.filter(i => i.day_of_week === dupDay.num);
      if (!fromItems.length) { setDupDay(null); return; }
      const m = await ensureMenu();
      await Promise.all(targetDays.flatMap(toDay =>
        fromItems.map(item =>
          api.post(`/menus/${m.id}/items`, {
            day_of_week: toDay, meal_type: item.meal_type,
            food_item: item.food_item, component: item.component,
            is_whole_grain: item.is_whole_grain, quantity: item.quantity,
          })
        )
      ));
      await loadMenu(); setDupDay(null);
    } catch { /* silent */ }
    finally { setDupBusy(false); }
  }

  // ── AI Generate ──────────────────────────────────────────────────────────────
  async function handleGenerate(prefs) {
    setGenerating(true);
    try {
      const m = await ensureMenu();
      const res = await api.post(`/menus/${m.id}/generate`, { preferences: prefs });
      await loadMenu();
      setCopyMsg(`Generated ${res.data.count} menu items`);
      setTimeout(() => setCopyMsg(''), 4000);
      setShowGenerate(false);
    } catch (e) {
      setCopyMsg(e.response?.data?.error || 'Generation failed — try again');
    } finally { setGenerating(false); }
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const cellItems   = (day, meal) => items.filter(i => i.day_of_week === day && i.meal_type === meal);
  const totalIssues = (() => {
    let count = 0;
    const activeMeals = [...MEALS.map(m => m.key), ...(hasInfant ? ['infant'] : [])];
    DAYS.forEach(d => {
      const dayItems = items.filter(i => i.day_of_week === d.num);
      if (getDayWGROk(dayItems) === false) count++;
      activeMeals.forEach(m => count += validateMealClient(dayItems.filter(i => i.meal_type === m), m).length);
    });
    return count;
  })();

  // Reimbursement estimate per day
  const dayEstimate = (dayNum) => {
    if (!rates || !estCount) return null;
    const count = Number(estCount);
    if (!count || isNaN(count)) return null;
    const activeMealKeys = MEALS.map(m => m.key);
    const total = activeMealKeys.reduce((sum, mealKey) => {
      const hasMeal = items.some(i => i.day_of_week === dayNum && i.meal_type === mealKey);
      return sum + (hasMeal ? (rates[mealKey] || 0) : 0);
    }, 0);
    return total * count;
  };

  // Filtered food library for current cell
  const libraryFoods = (() => {
    const search = foodSearch.trim().toLowerCase();
    if (!activeCell) return [];
    const mealComponents = {
      breakfast: ['milk','grain','fruit','vegetable'],
      lunch:     ['milk','grain','protein','fruit','vegetable'],
      supper:    ['milk','grain','protein','fruit','vegetable'],
      snack:     ['milk','grain','protein','fruit','vegetable'],
      infant:    [],
    };
    let foods = CACFP_FOODS;
    if (!search && activeCell) {
      const allowed = mealComponents[activeCell.meal] || [];
      foods = allowed.length ? foods.filter(f => allowed.includes(f.component)) : foods;
    }
    return search ? foods.filter(f => f.name.toLowerCase().includes(search)) : foods.slice(0, 20);
  })();

  // Comments for current cell
  const cellComments = activeCell
    ? comments.filter(c => c.day_of_week === activeCell.day && c.meal_type === activeCell.meal)
    : [];

  // ── Render ───────────────────────────────────────────────────────────────────
  const allMealsToRender = [...MEALS, ...(hasInfant ? [{ key: 'infant', label: 'Infant', color: 'pink' }] : [])];

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan weekly menus · Validate CACFP meal patterns</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Infant toggle */}
          <button onClick={toggleInfant}
            className={`flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-lg transition-colors ${
              hasInfant ? 'border-pink-300 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <Baby className="w-4 h-4" /> Infant Track {hasInfant ? 'On' : 'Off'}
          </button>

          {/* Copy previous week */}
          <button onClick={copyPreviousWeek} disabled={copyingPrev}
            className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {copyingPrev ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Copy Prev Week
          </button>

          {/* AI Generate */}
          <button onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1.5 text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700">
            <Sparkles className="w-4 h-4" /> AI Generate
          </button>

          {menu && menu.status === 'draft' && totalIssues === 0 && (
            <button onClick={() => updateStatus('approved')}
              className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
              <FileCheck className="w-4 h-4" /> Approve
            </button>
          )}
          {menu && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              menu.status === 'approved' ? 'bg-green-100 text-green-700' :
              menu.status === 'submitted' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
            }`}>{menu.status?.charAt(0).toUpperCase() + menu.status?.slice(1)}</span>
          )}
        </div>
      </div>

      {/* Toast */}
      {copyMsg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
          copyMsg.toLowerCase().includes('fail') || copyMsg.includes('No menu')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {copyMsg.toLowerCase().includes('fail') || copyMsg.includes('No menu')
            ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {copyMsg}
        </div>
      )}

      {/* Week nav + org picker + estimate count */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setWeekStart(w => addWeeks(w, -1))} className="p-2 hover:bg-gray-50 text-gray-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm font-medium text-gray-700 whitespace-nowrap min-w-[210px] text-center">
            {formatWeek(weekStart)}
          </span>
          <button onClick={() => setWeekStart(w => addWeeks(w, 1))} className="p-2 hover:bg-gray-50 text-gray-500">
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

        {/* Reimbursement estimate input */}
        {rates && (
          <div className="flex items-center gap-2 ml-auto">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-500 whitespace-nowrap">Est. children/meal:</span>
            <input type="number" min="0" max="9999" placeholder="0"
              value={estCount} onChange={e => setEstCount(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-2 py-1.5 w-20 focus:outline-none focus:border-brand-400 text-center" />
          </div>
        )}
      </div>

      {/* Validation summary */}
      {items.length > 0 && (
        <div className={`rounded-xl px-4 py-3 mb-4 flex items-center gap-3 ${
          totalIssues === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          {totalIssues === 0
            ? <><CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-sm font-medium text-green-700">All meal patterns complete — ready to approve</span></>
            : <><AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" /><span className="text-sm font-medium text-amber-700">{totalIssues} issue{totalIssues !== 1 ? 's' : ''} — see Weekly Validation panel below</span></>
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
                    const est = dayEstimate(d.num);
                    return (
                      <th key={d.num} className="p-2 text-center">
                        <div className="font-semibold text-gray-700 text-sm">{d.short}</div>
                        <div className="text-xs text-gray-400">{dayDate(weekStart, d.num)}</div>
                        {est !== null && (
                          <div className="text-xs font-semibold text-green-600 mt-0.5">{fmtMoney(est)}</div>
                        )}
                        {dayHasItems && (
                          <button onClick={() => setDupDay(d)} title={`Copy ${d.label}`}
                            className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-1 mx-auto mt-0.5 transition-colors">
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {allMealsToRender.map(meal => (
                  <tr key={meal.key}>
                    <td className="p-2 align-top">
                      <div className={`text-xs font-bold uppercase tracking-wide ${MEAL_COLOR[meal.key]?.text || 'text-pink-800'} text-right pr-2`}>
                        {meal.label}
                        {meal.key === 'infant' && <Baby className="inline w-3 h-3 ml-1" />}
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const ci       = cellItems(day.num, meal.key);
                      const missing  = validateMealClient(ci, meal.key);
                      const status   = getMealStatus(ci, meal.key);
                      const dayAllItems = items.filter(i => i.day_of_week === day.num);
                      const showWGR  = meal.key === 'breakfast' && getDayWGROk(dayAllItems) === false && ci.length > 0;
                      const cellCmts = comments.filter(c => c.day_of_week === day.num && c.meal_type === meal.key);
                      return (
                        <td key={day.num} className="p-1.5 align-top">
                          <div
                            className={`rounded-xl border-2 min-h-[100px] p-2 cursor-pointer transition-all
                              ${status === 'complete'   ? 'border-green-200 bg-green-50'
                              : status === 'incomplete' ? 'border-red-200 bg-red-50'
                              : 'border-gray-100 bg-gray-50 hover:border-brand-200 hover:bg-brand-50'}`}
                            onClick={() => openCell(day.num, meal.key)}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1">
                                {status === 'complete'   && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                {status === 'incomplete' && <AlertCircle  className="w-3.5 h-3.5 text-red-400"   />}
                                {showWGR && <Wheat className="w-3.5 h-3.5 text-amber-500" />}
                                {cellCmts.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-xs text-blue-400">
                                    <MessageSquare className="w-3 h-3" />{cellCmts.length}
                                  </span>
                                )}
                              </div>
                              <Plus className="w-3.5 h-3.5 text-gray-300" />
                            </div>
                            <div className="space-y-1">
                              {ci.map(item => <FoodChip key={item.id} item={item} onRemove={removeItem} />)}
                            </div>
                            {status === 'incomplete' && ci.length > 0 && (
                              <div className="mt-1.5 text-xs text-red-400 leading-tight">Missing: {missing.join(', ')}</div>
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
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Has notes</span>
            {rates && estCount && <span className="flex items-center gap-1 text-green-600 font-medium"><DollarSign className="w-3.5 h-3.5" /> Daily estimate (Tier 1)</span>}
            <span className="flex items-center gap-1 ml-2 font-medium">WGR = ≥51% whole grain per day</span>
          </div>

          <DayStatusPanel items={items} weekStart={weekStart} onOpenCell={openCell} />
        </>
      )}

      {/* ── Add Item / Library / Templates / Comments Drawer ── */}
      {activeCell && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900">
                  {allMealsToRender.find(m => m.key === activeCell.meal)?.label} — {DAYS.find(d => d.num === activeCell.day)?.label}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeCell.meal === 'breakfast' && 'Required: Milk · Grain · Fruit or Vegetable'}
                  {(activeCell.meal === 'lunch' || activeCell.meal === 'supper') && 'Required: Milk · Grain · Protein · Fruit · Vegetable'}
                  {activeCell.meal === 'snack' && 'Required: Any 2 of — Milk, Grain, Protein, Fruit/Vegetable'}
                  {activeCell.meal === 'infant' && 'Required: Breast Milk / Formula'}
                </p>
              </div>
              <button onClick={closeCell} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Current items */}
            {cellItems(activeCell.day, activeCell.meal).length > 0 && (
              <div className="px-5 pt-3 pb-2 border-b border-gray-100 flex-shrink-0">
                <p className="text-xs font-semibold text-gray-500 mb-2">On this menu:</p>
                <div className="flex flex-wrap gap-2">
                  {cellItems(activeCell.day, activeCell.meal).map(item => (
                    <FoodChip key={item.id} item={item} onRemove={removeItem} large />
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
              {[
                { id: 'add',       label: 'Add Food',  icon: Plus          },
                { id: 'library',   label: 'Library',   icon: BookOpen      },
                { id: 'templates', label: 'Templates', icon: Star          },
                { id: 'comments',  label: `Notes${cellComments.length ? ` (${cellComments.length})` : ''}`, icon: MessageSquare },
              ].map(tab => (
                <button key={tab.id} onClick={() => setDrawerTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                    drawerTab === tab.id
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <tab.icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {/* ── Add Food tab ── */}
              {drawerTab === 'add' && (
                <div className="px-5 py-4 space-y-3">
                  {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</p>}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Food Item</label>
                    <input autoFocus className="input w-full" placeholder="e.g. Whole wheat bread, Apple slices…"
                      value={itemForm.food_item}
                      onChange={e => setItemForm(f => ({ ...f, food_item: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addItem()} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Component</label>
                      <select className="input w-full" value={itemForm.component}
                        onChange={e => setItemForm(f => ({ ...f, component: e.target.value, is_whole_grain: false }))}>
                        {(activeCell.meal === 'infant' ? INFANT_COMPONENTS : COMPONENTS).map(c => (
                          <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                        ))}
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
              )}

              {/* ── Library tab ── */}
              {drawerTab === 'library' && (
                <div className="px-5 py-4">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input autoFocus className="input w-full pl-9" placeholder="Search foods…"
                      value={foodSearch} onChange={e => setFoodSearch(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    {libraryFoods.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No foods found</p>
                    )}
                    {libraryFoods.map((food, i) => {
                      const comp = ALL_COMPONENTS.find(c => c.key === food.component) || COMPONENTS[5];
                      return (
                        <button key={i} onClick={() => quickAddFood(food)} disabled={saving}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-left transition-colors group">
                          <span className="text-base">{comp.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{food.name}</p>
                            <p className="text-xs text-gray-400">{comp.label}{food.wgr ? ' · 🌾 WGR' : ''}</p>
                          </div>
                          <Plus className="w-4 h-4 text-gray-300 group-hover:text-brand-600 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                  {!foodSearch && libraryFoods.length === 20 && (
                    <p className="text-xs text-gray-400 text-center mt-3">Showing top 20 · Search to find more</p>
                  )}
                </div>
              )}

              {/* ── Templates tab ── */}
              {drawerTab === 'templates' && (
                <div className="px-5 py-4 space-y-4">
                  {/* Save current as template */}
                  {cellItems(activeCell.day, activeCell.meal).length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-600">Save current items as template</p>
                      <div className="flex gap-2">
                        <input className="input flex-1" placeholder="Template name…"
                          value={templateName} onChange={e => setTemplateName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()} />
                        <button onClick={handleSaveTemplate} disabled={!templateName.trim() || savingTemplate}
                          className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 flex items-center gap-1">
                          {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Template list */}
                  {templates.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No templates yet.<br/>Add items to a cell, then save them as a template.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500">Your templates</p>
                      {templates.map(t => (
                        <div key={t.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                            <p className="text-xs text-gray-400">{(t.items || []).length} items{t.meal_type ? ` · ${t.meal_type}` : ''}</p>
                          </div>
                          <button onClick={() => applyTemplate(t)} disabled={saving}
                            className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded-lg font-semibold hover:bg-brand-100">
                            Apply
                          </button>
                          <button onClick={() => deleteTemplate(t.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Comments tab ── */}
              {drawerTab === 'comments' && (
                <div className="px-5 py-4 space-y-3">
                  {cellComments.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No notes for this meal yet</p>
                  ) : (
                    <div className="space-y-2">
                      {cellComments.map(c => (
                        <div key={c.id} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{c.comment}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {c.author_name || 'You'} · {new Date(c.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button onClick={() => handleDeleteComment(c.id)}
                            className="text-gray-300 hover:text-red-500 flex-shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Add a note…"
                      value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
                    <button onClick={handleAddComment} disabled={!newComment.trim() || addingComment}
                      className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-40">
                      {addingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer footer */}
            {drawerTab === 'add' && (
              <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-gray-100 flex-shrink-0">
                <button onClick={closeCell} className="btn-secondary flex-1">Done</button>
                <button onClick={() => addItem()} disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" /> {saving ? 'Adding…' : 'Add Item'}
                </button>
              </div>
            )}
            {drawerTab !== 'add' && (
              <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex-shrink-0">
                <button onClick={closeCell} className="btn-secondary w-full">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Day Modal */}
      {dupDay && (
        <DuplicateDayModal fromDay={dupDay} onConfirm={duplicateDay} onClose={() => setDupDay(null)} busy={dupBusy} />
      )}

      {/* AI Generate Modal */}
      {showGenerate && (
        <GenerateMenuModal onConfirm={handleGenerate} onClose={() => setShowGenerate(false)} busy={generating} />
      )}
    </div>
  );
}
