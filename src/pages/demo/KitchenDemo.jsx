// KitchenDemo.jsx — Production Center preview
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  CheckCircle, UtensilsCrossed, FileText, MessageSquare,
  Settings, Truck, CheckSquare, Square, AlertCircle, Clock,
  Building2, BookOpen, Activity, Plus,
} from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',            path: '/demo/kitchen',                      icon: CheckCircle    },
  { label: 'Deliveries',          path: '/demo/kitchen/deliveries',           icon: Truck          },
  { label: 'Meal Counts',         path: '/demo/kitchen/meal-counts',          icon: UtensilsCrossed },
  { label: 'Production Records',  path: '/demo/kitchen/production-records',   icon: FileText       },
  { label: 'Menus',               path: '/demo/kitchen/menus',                icon: BookOpen       },
  { label: 'Tasks',               path: '/demo/kitchen/tasks',                icon: CheckSquare    },
  { label: 'Documents',           path: '/demo/kitchen/documents',            icon: FileText       },
  { label: 'Messages',            path: '/demo/kitchen/messages',             icon: MessageSquare  },
  { label: 'Activity',            path: '/demo/kitchen/activity',             icon: Activity       },
  { label: 'Settings',            path: '/demo/kitchen/settings',             icon: Settings       },
];

const TODAY_PROD = {
  totals: { breakfast: 45, lunch: 62, snack: 28 },
  nextDelivery: '7:30',
  sites: [
    { name: 'Little Learners',   arrival: '7:30', breakfast: 18, lunch: 22, snack: 10, submitted: true  },
    { name: 'Happy Kids Center', arrival: '8:00', breakfast: 15, lunch: 20, snack: 10, submitted: false },
    { name: 'Sunshine Academy',  arrival: '8:30', breakfast: 12, lunch: 20, snack: 8,  submitted: false },
  ],
};

const TOMORROW_PROD = {
  totals: { breakfast: 45, lunch: 62, snack: 28 },
  sites: ['Little Learners', 'Happy Kids Center', 'Sunshine Academy'],
};

const DOCS = [
  { label: 'Food Safety Permit', status: 'valid'        },
  { label: 'Health Inspection',  status: 'expiring_soon', daysLeft: 12 },
  { label: 'Insurance',          status: 'valid'        },
  { label: 'Menu Plan',          status: 'valid'        },
  { label: 'W-9',                status: 'missing'      },
];

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function OverviewSection() {
  const [counts, setCounts] = useState({ Breakfast: 45, Lunch: 62, Snack: 28 });
  const [submitted, setSubmitted] = useState(false);

  const tasks = [
    { label: 'Review today\'s production',     done: true  },
    { label: 'Prepare 135 meals',              done: false },
    { label: 'Complete all deliveries',        done: false },
    { label: 'Verify all site meal counts',    done: false },
    { label: 'Submit end-of-day counts',       done: submitted },
  ];
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-0.5">Monday, July 14, 2026</p>
        <h1 className="text-2xl font-bold text-gray-900">Good morning, Sunshine Kitchen</h1>
        <p className="text-sm text-gray-500 mt-1">Here's everything you need to run today's service.</p>
      </div>

      {/* 1. Today's Production */}
      <div className="card mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Today's Production</h2>
            <p className="text-xs text-gray-400 mt-0.5">135 total meals to prepare</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3" /> Next delivery {fmt12(TODAY_PROD.nextDelivery)}
          </span>
        </div>
        <div className="px-5 py-4">
          {/* Meal totals */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl px-4 py-3 bg-orange-50">
              <p className="text-2xl font-bold text-orange-600">45</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">Breakfast</p>
            </div>
            <div className="rounded-xl px-4 py-3 bg-green-50">
              <p className="text-2xl font-bold text-green-600">62</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">Lunch</p>
            </div>
            <div className="rounded-xl px-4 py-3 bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">28</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">Snack</p>
            </div>
          </div>
          {/* Sites */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Serving today</p>
          <div className="space-y-2">
            {TODAY_PROD.sites.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-800 flex-1">{s.name}</span>
                <span className="text-xs text-gray-400 tabular-nums">{fmt12(s.arrival)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Daily Checklist */}
      <div className="card mb-6 border-brand-100">
        <div className="px-5 py-3.5 border-b border-brand-100 flex items-center justify-between bg-brand-50 rounded-t-2xl">
          <h2 className="text-sm font-bold text-brand-900">Today's Checklist</h2>
          <span className="text-xs font-bold text-brand-600">{doneCount}/{tasks.length} done</span>
        </div>
        <div className="px-5 py-2 flex flex-wrap gap-x-4 gap-y-1.5">
          {tasks.map((t, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {t.done
                ? <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" />
                : <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
              }
              <span className={`text-xs font-medium ${t.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Today's Deliveries Timeline */}
      <div className="card mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Today's Deliveries</h2>
          <Link to="/demo/kitchen/deliveries" className="text-xs text-brand-600 hover:underline font-semibold">Full schedule →</Link>
        </div>
        <div className="px-5 py-2">
          {TODAY_PROD.sites.map((s, i) => (
            <div key={i} className="flex gap-4 py-3">
              <div className="w-16 flex-shrink-0 pt-0.5">
                <p className="text-sm font-bold text-gray-900 tabular-nums">{fmt12(s.arrival)}</p>
              </div>
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-3 h-3 rounded-full mt-1 bg-brand-500 ring-2 ring-brand-100" />
                {i < TODAY_PROD.sites.length - 1 && <div className="w-px flex-1 min-h-[20px] bg-gray-100 mt-1" />}
              </div>
              <div className="flex-1 pb-1">
                <p className="text-sm font-bold text-gray-900 mb-1.5">{s.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.breakfast > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">Breakfast {s.breakfast}</span>}
                  {s.lunch     > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">Lunch {s.lunch}</span>}
                  {s.snack     > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">Snack {s.snack}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Site Meal Count Status */}
      <div className="card mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Site Meal Counts</h2>
          <p className="text-xs text-gray-400 mt-0.5">Have sites entered today's counts?</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100 mb-1">
          <div className="px-5 py-4 text-center">
            <p className="text-3xl font-bold text-green-600">1</p>
            <p className="text-xs text-gray-500 mt-1">Submitted</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-3xl font-bold text-orange-500">2</p>
            <p className="text-xs text-gray-500 mt-1">Still pending</p>
          </div>
        </div>
        <div className="px-5 pb-4 space-y-1.5 border-t border-gray-50 pt-3">
          {TODAY_PROD.sites.map((s, i) => (
            <div key={i} className={`flex items-center gap-2 text-sm ${s.submitted ? 'text-gray-400' : 'text-orange-700'}`}>
              {s.submitted
                ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              }
              {s.name}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Meal Count Entry */}
      <div className="card mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Submit Meal Counts</h2>
            <p className="text-xs text-gray-400 mt-0.5">Enter today's counts for this kitchen</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          {[
            { type: 'Breakfast', emoji: '🌅', max: 65 },
            { type: 'Lunch',     emoji: '☀️', max: 80 },
            { type: 'Snack',     emoji: '🍎', max: 40 },
          ].map(({ type, emoji, max }) => (
            <div key={type}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">{emoji} {type}</label>
                <span className="text-lg font-bold text-brand-600">{counts[type]}</span>
              </div>
              <input
                type="range" min={0} max={max} value={counts[type]}
                onChange={(e) => { setSubmitted(false); setCounts((c) => ({ ...c, [type]: +e.target.value })); }}
                className="w-full accent-indigo-600"
              />
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          {submitted ? (
            <div className="w-full py-2.5 bg-green-50 text-green-700 font-semibold text-sm rounded-xl text-center border border-green-100">
              ✓ Counts submitted — great work!
            </div>
          ) : (
            <button onClick={() => setSubmitted(true)} className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Submit Meal Counts
            </button>
          )}
          <p className="text-center text-xs text-gray-400 mt-2">
            Demo only.{' '}
            <Link to="/register" className="text-brand-600 hover:underline">Sign up</Link>
            {' '}to submit real counts.
          </p>
        </div>
      </div>

      {/* 6. Kitchen Documents */}
      <div className="card mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Kitchen Documents</h2>
          <Link to="/demo/kitchen/documents" className="text-xs text-brand-600 hover:underline font-semibold">Manage →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {DOCS.map(({ label, status, daysLeft }) => (
            <div key={label} className="px-5 py-3 flex items-center gap-3">
              {status === 'valid' ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className={`w-4 h-4 flex-shrink-0 ${status === 'expiring_soon' ? 'text-yellow-500' : 'text-red-400'}`} />
              )}
              <span className={`text-sm flex-1 ${status === 'valid' ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{label}</span>
              {status === 'expiring_soon' && <span className="text-xs font-semibold text-yellow-600">Expires in {daysLeft}d</span>}
              {status === 'missing'       && <span className="text-xs text-gray-400">Not uploaded</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 7. Monthly Summary */}
      <div className="card mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">This Month</h2>
          <p className="text-xs text-gray-400 mt-0.5">July 2026</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: 'Meals Prepared',  value: '1,842',  color: 'text-brand-600' },
            { label: 'Sites Served',    value: '3',      color: 'text-blue-600'  },
            { label: 'Docs Uploaded',   value: '4/5',    color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-4 py-5 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Tomorrow's Production */}
      <div className="card mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Tomorrow</h2>
            <p className="text-xs text-gray-400 mt-0.5">Plan ahead — already scheduled</p>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">135 meals</span>
        </div>
        <div className="px-5 py-4">
          <div className="flex gap-6 mb-4">
            <div><p className="text-2xl font-bold text-orange-500">45</p><p className="text-xs text-gray-400 mt-0.5">Breakfast</p></div>
            <div><p className="text-2xl font-bold text-green-600">62</p><p className="text-xs text-gray-400 mt-0.5">Lunch</p></div>
            <div><p className="text-2xl font-bold text-blue-600">28</p><p className="text-xs text-gray-400 mt-0.5">Snack</p></div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOMORROW_PROD.sites.map((s, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-brand-600 rounded-2xl p-6 text-center text-white">
        <h3 className="text-lg font-bold mb-1">Running a CACFP kitchen?</h3>
        <p className="text-brand-200 text-sm mb-4">Ask your program sponsor for their Sponsor ID, then sign up free.</p>
        <Link to="/register" className="inline-block bg-white text-brand-700 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          Get Started Free →
        </Link>
      </div>
    </>
  );
}

function DeliveriesSection() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Deliveries</h1>
      <div className="mb-6">
        <h2 className="text-base font-bold text-brand-700 mb-3">Today — Monday Jul 14</h2>
        <div className="card divide-y divide-gray-100">
          {TODAY_PROD.sites.map((s, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400">Arrival by {fmt12(s.arrival)}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {s.breakfast + s.lunch + s.snack} meals
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-700 mb-3">Tomorrow — Tuesday Jul 15</h2>
        <div className="card divide-y divide-gray-100">
          {TODAY_PROD.sites.map((s, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <Building2 className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600">{s.name}</p>
                <p className="text-xs text-gray-400">Arrival by {fmt12(s.arrival)}</p>
              </div>
              <p className="text-sm font-bold text-gray-500">{s.breakfast + s.lunch + s.snack} meals</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-sm text-gray-400">
        Delivery plans are created automatically by your sponsor.{' '}
        <Link to="/register" className="text-brand-600 hover:underline">Sign up to learn more →</Link>
      </p>
    </div>
  );
}

export default function KitchenDemo() {
  const location = useLocation();
  const section  = location.pathname.split('/')[3];

  const renderSection = () => {
    switch (section) {
      case 'deliveries':  return <DeliveriesSection />;
      case 'meal-counts': return <OverviewSection />;
      case 'documents':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Kitchen Documents</h1>
            <div className="card divide-y divide-gray-50">
              {DOCS.map(({ label, status, daysLeft }) => (
                <div key={label} className="px-5 py-4 flex items-center gap-3">
                  {status === 'valid'
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <AlertCircle className={`w-4 h-4 ${status === 'expiring_soon' ? 'text-yellow-500' : 'text-red-400'}`} />
                  }
                  <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
                  {status === 'expiring_soon' && <span className="text-xs font-semibold text-yellow-600">Expires in {daysLeft}d</span>}
                  {status === 'missing' && <Link to="/register" className="text-xs font-semibold text-brand-600 hover:underline">Upload →</Link>}
                </div>
              ))}
            </div>
          </div>
        );
      case 'menus': {
        const KITCHEN_MENU = [
          { day:'Mon', breakfast:['WG Toast','Milk','OJ'],           breakfastOk:true,  lunch:['Turkey','WG Bread','Milk','Apple','Carrots'],   lunchOk:true,  snack:['Graham Crackers','Juice'], snackOk:true  },
          { day:'Tue', breakfast:['Oatmeal','Milk','Banana'],        breakfastOk:true,  lunch:['Chicken','Brown Rice','Milk','Peach'],           lunchOk:false, snack:['Yogurt'],                   snackOk:false },
          { day:'Wed', breakfast:['Pancakes','Milk'],                breakfastOk:false, lunch:['Bean Burrito','Tortilla','Milk','Pineapple','Corn'], lunchOk:true, snack:['Cheese','Crackers'],      snackOk:true  },
          { day:'Thu', breakfast:['WG Cereal','Milk','Strawberries'],breakfastOk:true,  lunch:['Tuna','WG Bread','Milk','Grapes','Broccoli'],   lunchOk:true,  snack:['Apple','PB'],               snackOk:true  },
          { day:'Fri', breakfast:['French Toast','Milk','OJ'],       breakfastOk:true,  lunch:['Salmon','Brown Rice','Milk','Mandarin','Green Beans'], lunchOk:true, snack:['Crackers','Hummus'], snackOk:true  },
        ];
        const issues = KITCHEN_MENU.reduce((n, d) => n + (!d.breakfastOk ? 1 : 0) + (!d.lunchOk ? 1 : 0) + (!d.snackOk ? 1 : 0), 0);
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Weekly Menu</h1>
              <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700"><Plus className="w-4 h-4" /> Add Item</Link>
            </div>
            {issues > 0
              ? <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-3 mb-5 text-sm font-semibold text-red-700">{issues} meals missing CACFP components</div>
              : <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 mb-5 text-sm font-semibold text-green-700">All meals meet CACFP requirements ✓</div>
            }
            <div className="space-y-3">
              {KITCHEN_MENU.map(d => (
                <div key={d.day} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="font-bold text-gray-900">{d.day}</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { label:'Breakfast', items:d.breakfast, ok:d.breakfastOk },
                      { label:'Lunch',     items:d.lunch,     ok:d.lunchOk     },
                      { label:'Snack',     items:d.snack,     ok:d.snackOk     },
                    ].map(m => (
                      <div key={m.label} className={`px-5 py-3 flex items-start gap-3 ${m.ok ? 'bg-green-50/30' : 'bg-red-50/30'}`}>
                        <span className="text-xs font-semibold text-gray-500 w-20 flex-shrink-0 pt-0.5">{m.label}</span>
                        <span className="text-sm text-gray-700">{m.items.join(' · ')}</span>
                        {!m.ok && <span className="ml-auto text-xs font-bold text-red-600 flex-shrink-0">Incomplete</span>}
                        {m.ok && <CheckCircle className="ml-auto w-4 h-4 text-green-500 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'tasks': {
        const KTASKS = [
          { title:'Order produce for next week',           priority:'high',   due:'Jul 22' },
          { title:'Submit July meal count summary',        priority:'urgent', due:'Jul 31' },
          { title:'Renew food handler certification',      priority:'medium', due:'Aug 5'  },
        ];
        const PCOL = { urgent:'text-red-700 bg-red-50', high:'text-orange-700 bg-orange-50', medium:'text-amber-700 bg-amber-50' };
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
              <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700"><Plus className="w-4 h-4" /> Add Task</Link>
            </div>
            <div className="card divide-y divide-gray-50">
              {KTASKS.map((t, i) => (
                <div key={i} className="px-5 py-4 flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${PCOL[t.priority]}`}>{t.priority}</span>
                      <span className="text-xs text-gray-400">Due {t.due}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'production-records': {
        const WEEK_DAYS = ['Mon Jul 14','Tue Jul 15','Wed Jul 16','Thu Jul 17','Fri Jul 18','Sat Jul 19','Sun Jul 20'];
        const MEAL_TYPES = [
          { key:'breakfast', label:'Breakfast', color:'bg-orange-100 text-orange-700' },
          { key:'lunch',     label:'Lunch',     color:'bg-green-100 text-green-700'   },
          { key:'snack',     label:'Snack',     color:'bg-sky-100 text-sky-700'       },
          { key:'supper',    label:'Supper',    color:'bg-violet-100 text-violet-700' },
        ];
        // Demo week grid: status per [day][meal]
        const GRID = {
          0: { breakfast:'complete', lunch:'complete', snack:'complete', supper:null    },
          1: { breakfast:'complete', lunch:'complete', snack:'draft',    supper:null    },
          2: { breakfast:'complete', lunch:'draft',    snack:null,       supper:null    },
          3: { breakfast:'draft',    lunch:null,       snack:null,       supper:null    },
          4: { breakfast:null,       lunch:null,       snack:null,       supper:null    },
          5: { breakfast:null,       lunch:null,       snack:null,       supper:null    },
          6: { breakfast:null,       lunch:null,       snack:null,       supper:null    },
        };
        const totalComplete = Object.values(GRID).flatMap(d => Object.values(d)).filter(s => s === 'complete').length;
        const totalDraft    = Object.values(GRID).flatMap(d => Object.values(d)).filter(s => s === 'draft').length;
        const DRAWER_ITEMS = [
          { name:'Whole Grain Toast', component:'grains', wgr:true,  qty:'45 slices'  },
          { name:'2% Milk',           component:'milk',   wgr:false, qty:'45 cups'    },
          { name:'Orange Juice',      component:'fruit',  wgr:false, qty:'45 servings'},
        ];
        const [activeCell, setActiveCell] = useState(null);
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Production Records</h1>
                <p className="text-xs text-gray-400 mt-0.5">Week of Jul 14 – Jul 20, 2026</p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-green-600">{totalComplete}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">Complete</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-amber-500">{totalDraft}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">In Draft</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-gray-400">7</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">Days in Week</p>
              </div>
            </div>

            {/* Week grid */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 520 }}>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left font-semibold text-gray-500 w-24">Meal</th>
                      {WEEK_DAYS.map((d, i) => (
                        <th key={i} className={`px-2 py-3 font-semibold text-center ${i === 0 ? 'text-brand-700 bg-brand-50' : 'text-gray-500'}`}>
                          {d.split(' ').map((p, j) => <div key={j}>{p}</div>)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MEAL_TYPES.map(({ key, label, color }) => (
                      <tr key={key} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-semibold text-gray-600">{label}</td>
                        {WEEK_DAYS.map((_, di) => {
                          const st = GRID[di][key];
                          return (
                            <td key={di} className="px-2 py-2 text-center">
                              <button
                                onClick={() => setActiveCell({ day: di, meal: key, label })}
                                className={`w-full rounded-lg px-1 py-2 font-semibold transition-all text-center ${
                                  st === 'complete' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                  st === 'draft'    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                  'bg-gray-50 text-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {st === 'complete' ? '✓' : st === 'draft' ? '…' : '+'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-gray-50 bg-gray-50 flex items-center gap-4 text-[10px] font-semibold text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Complete</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 inline-block" /> Draft</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block" /> Empty</span>
              </div>
            </div>

            {/* Drawer preview */}
            {activeCell && (
              <div className="bg-white border border-brand-200 rounded-2xl overflow-hidden mb-6 shadow-md">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-brand-50">
                  <div>
                    <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">{WEEK_DAYS[activeCell.day]}</p>
                    <h2 className="font-bold text-gray-900">{activeCell.label} Record</h2>
                  </div>
                  <button onClick={() => setActiveCell(null)} className="text-xs text-gray-400 hover:text-gray-600 font-semibold">Close ×</button>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Food Items</p>
                    <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full cursor-pointer">⚡ Auto-fill from menu</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {DRAWER_ITEMS.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.component}{item.wgr ? ' · 🌾 WGR' : ''}</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-500">{item.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Planned servings</label>
                      <div className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 bg-white">45</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Actual servings</label>
                      <div className="border border-brand-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 bg-white">43</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl">Save Draft</button>
                    <button className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl">Mark Complete</button>
                  </div>
                </div>
              </div>
            )}

            {/* USDA tip */}
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-4">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                USDA 7 CFR Part 226 requires a production record for every meal service. Records must be retained for 3 years. The <strong>Auto-fill</strong> button pre-populates food items from your approved weekly menu.
              </p>
            </div>
            <p className="text-center text-sm text-gray-400">
              <Link to="/register" className="text-brand-600 hover:underline font-semibold">Sign up free</Link> to start logging production records.
            </p>
          </div>
        );
      }
      case 'activity': {
        const KACTIVITY = [
          { icon:'🍽️', text:'Submitted breakfast counts for 3 sites',    time:'8:30 AM',   group:'Today'     },
          { icon:'🚚', text:'Delivery completed — Little Learners',       time:'7:45 AM',   group:'Today'     },
          { icon:'📄', text:'Uploaded updated menu plan',                 time:'Yesterday', group:'Yesterday' },
          { icon:'✅', text:'W-9 document approved by sponsor',           time:'Jul 19',    group:'Jul 19'    },
        ];
        const groups = [...new Set(KACTIVITY.map(a => a.group))];
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Feed</h1>
            <div className="space-y-6">
              {groups.map(g => (
                <div key={g}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{g}</p>
                  <div className="card divide-y divide-gray-50">
                    {KACTIVITY.filter(a => a.group === g).map((a, i) => (
                      <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                        <span className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center text-sm flex-shrink-0">{a.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{a.text}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DemoBanner role="Kitchen" />
      <DemoSidebar navItems={NAV} role="kitchen" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-8 sm:p-8 max-w-3xl mx-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
