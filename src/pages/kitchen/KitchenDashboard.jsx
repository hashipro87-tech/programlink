// KitchenDashboard.jsx — Enhanced kitchen operations dashboard.
// Features: next-action banner, meal reminder, meal count entry, document upload,
// delivery status board, sponsor messaging, and an alert center.
// All components are independent and pull from real API endpoints.

import { useState, useEffect } from 'react';
import { useLocation, Outlet, Routes, Route, useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import {
  ClipboardList, FileText, Building2, MessageSquare,
  UtensilsCrossed, CheckCircle, Settings, Truck, Bell,
  CheckSquare, Square, AlertCircle, Clock, Activity, BookOpen, GraduationCap,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

import Sidebar           from '../../components/layout/Sidebar';
import ApplicationPage   from '../application/ApplicationPage';
import DocumentsPage     from '../documents/DocumentsPage';
import MessagesPage      from '../messages/MessagesPage';
import NotificationsPage from '../notifications/NotificationsPage';
import KitchenDirectoryPage from './KitchenDirectoryPage';
import SettingsPage      from '../settings/SettingsPage';
import TasksPage         from '../tasks/TasksPage';
import ActivityFeedPage from '../activity/ActivityFeedPage';
import MenuBuilderPage        from '../menus/MenuBuilderPage';
import ProductionRecordsPage  from './ProductionRecordsPage';
import TrainingPage           from '../sponsor/TrainingPage';
import api                    from '../../services/api';

// Kitchen-specific components.
// NextActionBanner / MealReminderBanner / DocumentUploadCard / SponsorMessaging /
// AlertsCenter / ActionCenter / ActivityTimeline were imported here but never
// rendered after the Task #97 redesign — imports removed. The component files
// still exist if we want to bring any of them back.
import MealEntryForm       from './components/MealEntryForm';

const NAV_ITEMS = [
  { label: 'Overview',        path: '/dashboard/kitchen',              icon: CheckCircle,    end: true },

  { sectionLabel: 'Daily Ops' },
  { label: 'Deliveries',         path: '/dashboard/kitchen/deliveries',          icon: Truck },
  { label: 'Meal Counts',        path: '/dashboard/kitchen/meals',               icon: UtensilsCrossed },
  { label: 'Production Records', path: '/dashboard/kitchen/production-records',  icon: ClipboardList },
  { label: 'Menus',              path: '/dashboard/kitchen/menus',               icon: BookOpen },

  { sectionLabel: 'Admin' },
  { label: 'My Application',  path: '/dashboard/kitchen/application',  icon: ClipboardList },
  { label: 'Documents',       path: '/dashboard/kitchen/documents',    icon: FileText },
  { label: 'Staff Training',  path: '/dashboard/kitchen/training',     icon: GraduationCap },
  { label: 'Tasks',           path: '/dashboard/kitchen/tasks',        icon: CheckSquare },
  { label: 'Activity',        path: '/dashboard/kitchen/activity',     icon: Activity },
  { label: 'Connected Sites', path: '/dashboard/kitchen/sites',        icon: Building2 },

  { divider: true },
  { label: 'Messages',        path: '/dashboard/kitchen/messages',     icon: MessageSquare },
  { label: 'Notifications',   path: '/dashboard/kitchen/notifications', icon: Bell },
  { label: 'Settings',        path: '/dashboard/kitchen/settings',     icon: Settings },
];

// ─── Required kitchen documents ───────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH — must match REQUIRED.kitchen in backend routes/compliance.js
// (previously this list was duplicated in 3 places with 3 different answers: the
//  compliance card said 5 docs, NextActionBanner said 3, the summary card said "/3")
export const KITCHEN_REQUIRED_DOCS = [
  { type: 'w9',          label: 'W-9' },
  { type: 'food_permit', label: 'Food Safety Permit' },
  { type: 'insurance',   label: 'Insurance' },
  { type: 'menu_plan',   label: 'Menu Plan' },
  { type: 'health_cert', label: 'Health Inspection' },
];

// Count how many required docs are actually on file, from the real documents API.
// A doc counts as "on file" if it exists and isn't rejected/requested.
function countUploadedDocs(docs = []) {
  const ON_FILE = ['valid', 'expiring_soon', 'pending_review', 'expired'];
  return KITCHEN_REQUIRED_DOCS.filter(({ type }) =>
    docs.some((d) => d.type === type && ON_FILE.includes(d.status))
  ).length;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO()    { return new Date().toISOString().split('T')[0]; }

// Normalize an API date to 'YYYY-MM-DD'. Postgres DATE columns arrive as JS
// Date objects via node-postgres and serialize to full ISO timestamps, so
// comparing them directly against a 'YYYY-MM-DD' string silently never matches.
function dayKey(d) { return String(d ?? '').slice(0, 10); }
function tomorrowISO() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }
function dateLabel(iso) {
  if (iso === todayISO())    return 'Today';
  if (iso === tomorrowISO()) return 'Tomorrow';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
}
function fmt12(t) {
  if (!t) return '';
  const [h,m] = t.split(':').map(Number);
  return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
}
function mealLabel(v) {
  // NOTE: CACFP and the meal_counts CHECK constraint use 'supper', not 'dinner'.
  // 'supper' was missing here, so it fell through and rendered lowercase.
  return ({
    breakfast: 'Breakfast', am_snack: 'AM Snack', lunch: 'Lunch',
    pm_snack: 'PM Snack', snack: 'Snack', supper: 'Supper', dinner: 'Supper',
  }[v] ?? v);
}

// Pluralize a meal noun for display: "1 lunch" / "30 lunches".
// Naive label+'s' produced "30 lunchs" — sibilant endings need -es.
function mealNoun(type, count) {
  const base = mealLabel(type).toLowerCase();
  if (count === 1) return base;
  return /(ch|sh|s|x|z)$/.test(base) ? `${base}es` : `${base}s`;
}

// ─── Today's Production Schedule ──────────────────────────────────────────────
// Auto-generated from recurring delivery plans.
// Kitchens see exactly what to cook for each site — no guessing, no phone calls.
function TodayProductionSchedule({ onViewAll }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/delivery-plans/production')
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const sites  = data?.sites  ?? [];
  const totals = data?.totals ?? {};
  const grandTotal = (totals.breakfast ?? 0) + (totals.lunch ?? 0) + (totals.snack ?? 0) + (totals.supper ?? 0);

  const MEAL_COLORS = {
    breakfast: 'bg-orange-50 text-orange-700',
    lunch:     'bg-green-50 text-green-700',
    snack:     'bg-blue-50 text-blue-700',
    supper:    'bg-purple-50 text-purple-700',
  };

  return (
    <div className="card mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Today's Production Schedule</h2>
          {!loading && grandTotal > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{grandTotal} total meals to prepare</p>
          )}
        </div>
        <button onClick={onViewAll} className="text-sm text-brand-600 hover:underline font-semibold">
          Full schedule →
        </button>
      </div>

      {loading ? (
        <div className="px-6 py-8 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sites.length === 0 ? (() => {
        const dow = new Date().getDay(); // 0=Sun, 6=Sat
        const isWeekend = dow === 0 || dow === 6;
        return (
          <div className="px-6 py-10 text-center">
            <Truck className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">
              {isWeekend ? 'No meals scheduled this weekend' : 'No deliveries scheduled today'}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {isWeekend
                ? 'Most programs run Monday–Friday. Your next scheduled service will show up here.'
                : 'If you expected meals today, check with your sponsor — they set up the delivery schedule.'}
            </p>
          </div>
        );
      })() : (
        <>
          {/* Per-site breakdown */}
          <div className="divide-y divide-gray-50">
            {sites.map((site, i) => {
              const siteMeals = [];
              if (site.breakfast > 0) siteMeals.push({ type: 'breakfast', count: site.breakfast });
              if (site.lunch     > 0) siteMeals.push({ type: 'lunch',     count: site.lunch });
              if (site.snack     > 0) siteMeals.push({ type: 'snack',     count: site.snack });
              if (site.supper    > 0) siteMeals.push({ type: 'supper',    count: site.supper });
              const siteTotal = siteMeals.reduce((s, m) => s + m.count, 0);

              return (
                <div key={i} className="px-6 py-4 flex items-start gap-4">
                  <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-bold text-gray-900">{site.site_name}</p>
                      {site.arrival_time && (
                        <span className="text-xs text-gray-400">· {fmt12(site.arrival_time.slice(0,5))}</span>
                      )}
                      <span className="ml-auto text-xs font-semibold text-gray-500">{siteTotal} meals</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {siteMeals.map(({ type, count }) => (
                        <span key={type} className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${MEAL_COLORS[type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {count} {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Total to Prepare</p>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'breakfast', label: 'Breakfast' },
                { key: 'lunch',     label: 'Lunch' },
                { key: 'snack',     label: 'Snack' },
                { key: 'supper',    label: 'Supper' },
              ].filter(({ key }) => (totals[key] ?? 0) > 0).map(({ key, label }) => (
                <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${MEAL_COLORS[key] ?? 'bg-gray-100'}`}>
                  <span className="text-lg font-bold">{totals[key]}</span>
                  <span className="text-xs font-semibold opacity-80">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Data hook — fetch everything the kitchen overview needs ─────────────────
function useKitchenData() {
  const [data, setData]       = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today    = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const month    = today.slice(0, 7);

    Promise.allSettled([
      api.get('/delivery-plans/production'),
      api.get(`/delivery-plans/production?date=${tomorrow}`),
      api.get('/delivery/routes'),
      api.get(`/meal-counts?month=${month}&limit=50`),
      api.get('/documents?limit=100'),
      api.get('/notifications?limit=5'),
      api.get('/applications'), // scoped to this kitchen's own org — returns its application, if any
    ]).then(([todayRes, tmrRes, routesRes, mcRes, docRes, notifRes, appRes]) => {
      const todayProd    = todayRes.status === 'fulfilled'  ? todayRes.value.data  : null;
      const tomorrowProd = tmrRes.status   === 'fulfilled'  ? tmrRes.value.data    : null;
      const allRoutes    = routesRes.status === 'fulfilled'
        ? (Array.isArray(routesRes.value.data) ? routesRes.value.data : routesRes.value.data?.routes ?? [])
        : [];
      const mealCounts   = mcRes.status  === 'fulfilled' ? (mcRes.value.data?.meal_counts ?? mcRes.value.data?.counts ?? []) : [];
      const docs         = docRes.status === 'fulfilled' ? (docRes.value.data?.documents ?? []) : [];
      const notifications = notifRes.status === 'fulfilled' ? (notifRes.value.data?.notifications ?? []) : [];
      const applications = appRes.status === 'fulfilled' ? (appRes.value.data?.applications ?? []) : [];
      // Most recent application for this org, if one was ever started
      const application  = applications[0] ?? null;
      // dayKey() on both: DATE columns come back from node-postgres as JS Dates
      // and serialize to full ISO timestamps, so raw === against 'YYYY-MM-DD'
      // never matched. todayCount was therefore always null, which meant the
      // "Submit end-of-day counts" checklist item could never be ticked off
      // even right after the kitchen submitted them.
      const todayRoutes  = allRoutes.filter((r) => dayKey(r.date) === today && r.status !== 'cancelled');
      const todayCount   = mealCounts.find((c) => dayKey(c.date) === today) ?? null;

      setData({ todayProd, tomorrowProd, todayRoutes, mealCounts, docs, notifications, todayCount, application });
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

// ─── Get Started Checklist — for kitchens that aren't fully onboarded yet ────
// Built from real data (documents API + this org's own application), not the
// fabricated stats.docs_uploaded / stats.application_status fields the old
// removed onboarding block relied on, which /stats never actually returned.
// Hides itself once documents are on file and the application is approved —
// a kitchen that's up and running shouldn't see a permanent to-do list.
function KitchenGetStarted({ docs, application, navigate }) {
  const docCount = countUploadedDocs(docs);
  const docTotal = KITCHEN_REQUIRED_DOCS.length;
  const docsDone = docCount >= docTotal;

  // applications.status CHECK constraint: draft | submitted | under_review | approved | rejected
  const appStatus    = application?.status ?? null;
  const appStarted   = appStatus === 'submitted' || appStatus === 'under_review' || appStatus === 'approved';
  const appApproved  = appStatus === 'approved';
  const appRejected  = appStatus === 'rejected';

  const fullyDone = docsDone && appApproved;
  if (fullyDone) return null;

  const steps = [
    {
      label: docsDone ? 'Required documents uploaded' : `Upload required documents (${docCount}/${docTotal})`,
      done: docsDone,
      action: () => navigate('/dashboard/kitchen/documents'),
      cta: 'Upload',
    },
    {
      label: appRejected ? 'Application needs changes' : appApproved ? 'Application approved' : appStarted ? 'Application submitted — awaiting review' : 'Submit your application',
      done: appStarted && !appRejected,
      warn: appRejected,
      action: () => navigate('/dashboard/kitchen/application'),
      cta: appRejected ? 'Review' : appStarted ? 'View' : 'Start',
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="card mb-6 border-brand-100">
      <div className="px-5 py-3.5 border-b border-brand-100 bg-brand-50 rounded-t-2xl">
        <h2 className="text-sm font-bold text-brand-900">Get Started</h2>
        <p className="text-xs text-brand-600 mt-0.5">
          {doneCount}/{steps.length} steps done — finish these so your sponsor can approve your kitchen.
        </p>
      </div>
      <div className="divide-y divide-gray-50">
        {steps.map((s, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-3">
            {s.done
              ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              : s.warn
                ? <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                : <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
            }
            <span className={`text-sm flex-1 ${s.done ? 'text-gray-500' : s.warn ? 'text-red-700 font-medium' : 'text-gray-800 font-medium'}`}>
              {s.label}
            </span>
            {!s.done || s.warn ? (
              <button onClick={s.action} className="text-xs font-semibold text-brand-600 hover:underline flex-shrink-0">
                {s.cta} →
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Daily Checklist Banner ───────────────────────────────────────────────────
function KitchenDailyChecklist({ todayProd, todayRoutes, todayCount }) {
  const totalMeals   = (todayProd?.totals?.breakfast ?? 0) + (todayProd?.totals?.lunch ?? 0) +
                       (todayProd?.totals?.snack ?? 0)     + (todayProd?.totals?.supper ?? 0);
  const hasProduction  = totalMeals > 0;
  const hasDeliveries  = todayRoutes.length > 0;
  const hasSites       = (todayProd?.sites?.length ?? 0) > 0;
  const deliveriesDone = hasDeliveries && todayRoutes.every((r) => r.status === 'delivered');
  const allSubmitted   = todayProd?.pendingCount === 0 && hasSites;
  const ownSubmitted   = !!todayCount && ((todayCount.breakfast ?? 0) + (todayCount.lunch ?? 0) +
                          (todayCount.snack ?? 0) + (todayCount.supper ?? 0)) > 0;

  // Only show tasks that actually apply today. A kitchen with no production
  // scheduled shouldn't be staring at "0/5 done" — there's nothing to do.
  const tasks = [
    hasProduction && { label: 'Review today\'s production', done: true },
    hasProduction && {
      label: `Prepare ${totalMeals} meal${totalMeals === 1 ? '' : 's'}`,
      // Considered prepared once every site's counts are in
      done: allSubmitted,
    },
    hasDeliveries && { label: 'Complete all deliveries',   done: deliveriesDone },
    hasSites      && { label: 'Verify all site meal counts', done: allSubmitted },
    { label: 'Submit end-of-day counts', done: ownSubmitted },
  ].filter(Boolean);

  const doneCount = tasks.filter((t) => t.done).length;
  const allDone   = doneCount === tasks.length;

  // Nothing scheduled and nothing submitted — quiet day, say so plainly.
  const quietDay = !hasProduction && !hasDeliveries && !hasSites;

  return (
    <div className={`card mb-6 ${allDone ? 'border-green-100' : 'border-brand-100'}`}>
      <div className={`px-5 py-3.5 border-b flex items-center justify-between rounded-t-2xl ${
        allDone ? 'border-green-100 bg-green-50' : 'border-brand-100 bg-brand-50'
      }`}>
        <h2 className={`text-sm font-bold ${allDone ? 'text-green-900' : 'text-brand-900'}`}>
          Today's Checklist
        </h2>
        <span className={`text-xs font-bold ${allDone ? 'text-green-600' : 'text-brand-600'}`}>
          {allDone ? '✓ All done' : `${doneCount}/${tasks.length} done`}
        </span>
      </div>
      {quietDay && (
        <div className="px-5 pt-3 pb-1">
          <p className="text-xs text-gray-500">
            No meals scheduled today. Just submit your end-of-day counts when service is over.
          </p>
        </div>
      )}
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
  );
}

// ─── Today's Production Card ──────────────────────────────────────────────────
function TodayProductionCard({ todayProd }) {
  const totals = todayProd?.totals ?? {};
  const sites  = todayProd?.sites  ?? [];
  const next   = todayProd?.nextDelivery;
  const grand  = (totals.breakfast ?? 0) + (totals.lunch ?? 0) + (totals.snack ?? 0) + (totals.supper ?? 0);

  const MEALS = [
    { key: 'breakfast', label: 'Breakfast', bg: 'bg-orange-50', text: 'text-orange-600' },
    { key: 'lunch',     label: 'Lunch',     bg: 'bg-green-50',  text: 'text-green-600' },
    { key: 'snack',     label: 'Snack',     bg: 'bg-blue-50',   text: 'text-blue-600' },
    { key: 'supper',    label: 'Supper',    bg: 'bg-purple-50', text: 'text-purple-600' },
  ].filter((m) => (totals[m.key] ?? 0) > 0);

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">Today's Production</h2>
          {grand > 0 && <p className="text-xs text-gray-400 mt-0.5">{grand} total meals to prepare</p>}
        </div>
        {next && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3" /> Next delivery {fmt12(next)}
          </span>
        )}
      </div>

      {grand === 0 ? (
        <div className="px-5 py-10 text-center">
          <UtensilsCrossed className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No deliveries scheduled today</p>
          <p className="text-xs text-gray-400 mt-1">Your sponsor will set up recurring delivery plans.</p>
        </div>
      ) : (
        <div className="px-5 py-4">
          {/* Meal type totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {MEALS.map(({ key, label, bg, text }) => (
              <div key={key} className={`rounded-xl px-4 py-3 ${bg}`}>
                <p className={`text-2xl font-bold ${text}`}>{totals[key]}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Sites being served */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Serving today</p>
            <div className="space-y-2">
              {sites.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-800 flex-1">{s.site_name}</span>
                  {s.arrival_time && (
                    <span className="text-xs text-gray-400 tabular-nums">{fmt12(s.arrival_time.slice(0,5))}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Today's Deliveries Timeline ──────────────────────────────────────────────
function TodayDeliveriesTimeline({ todayProd, todayRoutes, navigate }) {
  const planSites = todayProd?.sites ?? [];

  // Build unified timeline: plan instances first, then any manual routes for today
  const entries = planSites.length > 0
    ? planSites.map((s) => ({
        time:   s.arrival_time?.slice(0, 5),
        site:   s.site_name,
        status: s.status,
        meals:  [
          ...(s.breakfast > 0 ? [{ label: 'Breakfast', count: s.breakfast }] : []),
          ...(s.lunch     > 0 ? [{ label: 'Lunch',     count: s.lunch     }] : []),
          ...(s.snack     > 0 ? [{ label: 'Snack',     count: s.snack     }] : []),
          ...(s.supper    > 0 ? [{ label: 'Supper',    count: s.supper    }] : []),
        ],
      })).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
    : todayRoutes.flatMap((r) =>
        (r.stops ?? []).map((st) => ({
          time:   st.pickup_time,
          site:   st.site_name ?? r.site_name,
          status: r.status,
          meals:  [{ label: st.meal_type ?? 'Meal', count: st.meal_count }],
        }))
      );

  if (!entries.length) return null;

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Today's Deliveries</h2>
        <button onClick={() => navigate('/dashboard/kitchen/deliveries')} className="text-xs text-brand-600 hover:underline font-semibold">
          Full schedule →
        </button>
      </div>
      <div className="px-5 py-2">
        {entries.map((d, i) => {
          const done = d.status === 'delivered';
          return (
            <div key={i} className="flex gap-4 py-3">
              {/* Time */}
              <div className="w-16 flex-shrink-0 pt-0.5">
                <p className="text-sm font-bold text-gray-900 tabular-nums">{d.time ? fmt12(d.time) : '—'}</p>
              </div>
              {/* Timeline dot + connector */}
              <div className="flex flex-col items-center gap-0 flex-shrink-0">
                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${done ? 'bg-green-400' : 'bg-brand-500 ring-2 ring-brand-100'}`} />
                {i < entries.length - 1 && <div className="w-px flex-1 min-h-[20px] bg-gray-100 mt-1" />}
              </div>
              {/* Site + meals */}
              <div className="flex-1 pb-1">
                <p className={`text-sm font-bold mb-1.5 ${done ? 'text-gray-400' : 'text-gray-900'}`}>{d.site ?? '—'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.meals.map((m, j) => (
                    <span key={j} className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      done ? 'bg-gray-50 text-gray-400' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {m.label} {m.count}
                    </span>
                  ))}
                </div>
                {done && <p className="text-xs text-green-600 font-semibold mt-1.5">✓ Delivered</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Site Meal Count Status ───────────────────────────────────────────────────
function SiteStatusCard({ todayProd }) {
  const sites   = todayProd?.sites ?? [];
  if (!sites.length) return null;

  const submitted = sites.filter((s) => s.has_submitted);
  const pending   = sites.filter((s) => !s.has_submitted);

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Site Meal Counts</h2>
        <p className="text-xs text-gray-400 mt-0.5">Have sites entered today's counts?</p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-100 mb-1">
        <div className="px-5 py-4 text-center">
          <p className="text-3xl font-bold text-green-600">{submitted.length}</p>
          <p className="text-xs text-gray-500 mt-1">Submitted</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className={`text-3xl font-bold ${pending.length > 0 ? 'text-orange-500' : 'text-gray-200'}`}>
            {pending.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Still pending</p>
        </div>
      </div>

      <div className="px-5 pb-4 space-y-1.5 border-t border-gray-50 pt-3">
        {pending.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-orange-700">
            <AlertCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            {s.site_name}
          </div>
        ))}
        {submitted.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            {s.site_name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Document Compliance Card (inline) ───────────────────────────────────────
function DocComplianceCard({ docs, navigate }) {
  const rows = KITCHEN_REQUIRED_DOCS.map(({ type, label }) => {
    const doc      = docs.find((d) => d.type === type);
    const status   = doc?.status ?? 'missing';
    const daysLeft = doc?.expires_at
      ? Math.ceil((new Date(doc.expires_at) - Date.now()) / 86400000)
      : null;
    return { label, status, daysLeft, doc };
  });

  const hasIssues = rows.some((r) => r.status !== 'valid');

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Kitchen Documents</h2>
        <button onClick={() => navigate('/dashboard/kitchen/documents')} className="text-xs text-brand-600 hover:underline font-semibold">
          Manage →
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map(({ label, status, daysLeft }) => (
          <div key={label} className="px-5 py-3 flex items-center gap-3">
            {status === 'valid' ? (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : status === 'expiring_soon' ? (
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span className={`text-sm flex-1 ${status === 'valid' ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
              {label}
            </span>
            {daysLeft !== null && daysLeft <= 30 && (
              <span className={`text-xs font-semibold ${daysLeft <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                Expires in {daysLeft}d
              </span>
            )}
            {status === 'missing' && (
              <span className="text-xs text-gray-400">Not uploaded</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Monthly Summary Card ─────────────────────────────────────────────────────
function KitchenSummaryCard({ mealCounts, stats, docs = [] }) {
  const month = new Date().toLocaleString('en-US', { month: 'long' });
  const monthTotal = mealCounts.reduce(
    (s, c) => s + (c.breakfast ?? 0) + (c.lunch ?? 0) + (c.snack ?? 0) + (c.supper ?? 0), 0
  );

  // Derived from the real documents API — stats.docs_uploaded does not exist on
  // the /stats endpoint (only on /compliance), so this always read as 0 before.
  const docCount = countUploadedDocs(docs);
  const docTotal = KITCHEN_REQUIRED_DOCS.length;

  const items = [
    { label: 'Meals Prepared',  value: monthTotal > 0 ? monthTotal.toLocaleString() : '—', color: 'text-brand-600' },
    { label: 'Sites Served',    value: stats.connected_sites ?? '—',                        color: 'text-blue-600' },
    { label: 'Docs on File',    value: `${docCount}/${docTotal}`,
      color: docCount === docTotal ? 'text-green-600' : 'text-gray-700' },
  ];

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">This Month</h2>
        <p className="text-xs text-gray-400 mt-0.5">{month}</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        {items.map(({ label, value, color }) => (
          <div key={label} className="px-4 py-5 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tomorrow's Production Preview ───────────────────────────────────────────
function TomorrowProductionCard({ tomorrowProd }) {
  const totals = tomorrowProd?.totals ?? {};
  const sites  = tomorrowProd?.sites  ?? [];
  const grand  = (totals.breakfast ?? 0) + (totals.lunch ?? 0) + (totals.snack ?? 0) + (totals.supper ?? 0);
  if (grand === 0) return null;

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Tomorrow</h2>
          <p className="text-xs text-gray-400 mt-0.5">Plan ahead — already scheduled</p>
        </div>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          {grand} meals
        </span>
      </div>
      <div className="px-5 py-4">
        <div className="flex gap-6 mb-4">
          {[
            { key: 'breakfast', label: 'Breakfast', color: 'text-orange-500' },
            { key: 'lunch',     label: 'Lunch',     color: 'text-green-600' },
            { key: 'snack',     label: 'Snack',     color: 'text-blue-600' },
            { key: 'supper',    label: 'Supper',    color: 'text-purple-600' },
          ].filter((m) => (totals[m.key] ?? 0) > 0).map(({ key, label, color }) => (
            <div key={key}>
              <p className={`text-2xl font-bold ${color}`}>{totals[key]}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sites.map((s, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
              {s.site_name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Full Deliveries Page (kitchen) ──────────────────────────────────────────
function KitchenDeliveriesPage() {
  const [routes,  setRoutes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Manual one-off routes + today's recurring-plan production.
    // NOTE: /delivery-plans/production is a single-day endpoint (defaults to
    // today). The old comment here claimed "next 60 days", which it never did —
    // recurring deliveries beyond today only appear once their date arrives.
    Promise.allSettled([
      api.get('/delivery/routes'),
      api.get('/delivery-plans/production'),
    ]).then(([routesRes, prodRes]) => {
      const manual = routesRes.status === 'fulfilled'
        ? (Array.isArray(routesRes.value.data) ? routesRes.value.data : routesRes.value.data?.routes ?? [])
        : [];
      // Convert today's production into route-like objects for display
      const today   = new Date().toISOString().split('T')[0];
      const prodSites = prodRes.status === 'fulfilled' ? (prodRes.value.data?.sites ?? []) : [];
      const planRoutes = prodSites.map((s) => ({
        id:           `plan-${s.instance_id}`,
        date:         today,
        kitchen_name: null,
        status:       s.status,
        stops: [
          ...(s.breakfast > 0 ? [{ meal_type:'breakfast', meal_count: s.breakfast, pickup_time: s.arrival_time, site_name: s.site_name }] : []),
          ...(s.lunch     > 0 ? [{ meal_type:'lunch',     meal_count: s.lunch,     pickup_time: s.arrival_time, site_name: s.site_name }] : []),
          ...(s.snack     > 0 ? [{ meal_type:'snack',     meal_count: s.snack,     pickup_time: s.arrival_time, site_name: s.site_name }] : []),
          ...(s.supper    > 0 ? [{ meal_type:'supper',    meal_count: s.supper,    pickup_time: s.arrival_time, site_name: s.site_name }] : []),
        ],
      }));
      const all = [...manual, ...planRoutes].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
      setRoutes(all);
      setLoading(false);
    });
  }, []);

  // Group by date, then split upcoming from past. Everything used to render in
  // one ascending list, so a kitchen opening this page saw last month's
  // deliveries first and had to scroll past them to find today's.
  const byDate = {};
  for (const r of routes) {
    // dayKey() — manual routes come from a DATE column and arrive as full ISO
    // timestamps. Grouping on the raw value split one day into several buckets
    // and made dateLabel() miss its "Today"/"Tomorrow" comparison entirely.
    const d = r.date ? dayKey(r.date) : 'unknown';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(r);
  }
  const allDates    = Object.keys(byDate).sort();
  const today       = todayISO();
  const dates       = allDates.filter((d) => d === 'unknown' || d >= today);
  const pastDates   = allDates.filter((d) => d !== 'unknown' && d <  today).reverse();
  const [showPast, setShowPast] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
          <p className="text-sm text-gray-500 mt-1">All meal deliveries assigned to your kitchen.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading…</div>
      ) : dates.length === 0 && pastDates.length === 0 ? (
        <div className="py-24 text-center">
          <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-base font-bold text-gray-600">No deliveries yet</p>
          <p className="text-sm text-gray-400 mt-1">Your sponsor assigns deliveries from their dashboard.</p>
        </div>
      ) : (
        <>
          {dates.length === 0 ? (
            <div className="card px-5 py-8 text-center mb-6">
              <Truck className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">Nothing upcoming</p>
              <p className="text-xs text-gray-400 mt-1">
                Past deliveries are below. New ones appear as your sponsor schedules them.
              </p>
            </div>
          ) : (
            dates.map((date) => (
              <DeliveryDay key={date} date={date} routes={byDate[date]} />
            ))
          )}

          {pastDates.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowPast((v) => !v)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
              >
                {showPast ? 'Hide' : 'Show'} past deliveries ({pastDates.length} day{pastDates.length === 1 ? '' : 's'})
              </button>
              {showPast && (
                <div className="mt-4 opacity-70">
                  {pastDates.map((date) => (
                    <DeliveryDay key={date} date={date} routes={byDate[date]} past />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// One day's deliveries — shared by the upcoming list and the collapsed past list.
function DeliveryDay({ date, routes, past = false }) {
  const allStops = routes.flatMap((r) => r.stops ?? []);
  const total    = allStops.reduce((s, st) => s + (st.meal_count || 0), 0);
  const isNear   = date === todayISO() || date === tomorrowISO();
  const siteCount = new Set(allStops.map((s) => s.site_name ?? 'Site')).size;

  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className={`text-base font-bold ${
          past ? 'text-gray-500' : isNear ? 'text-brand-700' : 'text-gray-800'
        }`}>
          {dateLabel(date)}
        </h2>
        <span className="text-sm text-gray-400">
          {total} meal{total === 1 ? '' : 's'} · {siteCount} site{siteCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="card divide-y divide-gray-100">
        {allStops.map((stop, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{stop.site_name ?? 'Site'}</p>
              {stop.pickup_time && (
                <p className="text-xs text-gray-400">Pickup by {fmt12(stop.pickup_time)}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-gray-900">
                {stop.meal_count} {mealNoun(stop.meal_type, stop.meal_count)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Kitchen Overview — 9-section layout ─────────────────────────────────────
function KitchenOverview({ stats, loading, navigate }) {
  const { data, loading: dataLoading } = useKitchenData();
  const { todayProd, tomorrowProd, todayRoutes, mealCounts, docs, todayCount, application } = data;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-0.5">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900">Good morning, Kitchen</h1>
        <p className="text-gray-500 mt-1 text-sm">Here's everything you need to run today's service.</p>
      </div>

      {/* 0. Get Started — only shows for kitchens still onboarding.
          This is what a brand-new kitchen needs first: what's missing before
          their sponsor can approve them. Placed above production because for
          an unapproved kitchen, that's the actual next action — not "no
          deliveries scheduled today." */}
      {!dataLoading && (
        <KitchenGetStarted docs={docs ?? []} application={application} navigate={navigate} />
      )}

      {/* 1. Today's Production — primary job, above the fold */}
      <TodayProductionCard todayProd={todayProd} />

      {/* 2. Daily Checklist — compact strip below production */}
      <KitchenDailyChecklist
        todayProd={todayProd}
        todayRoutes={todayRoutes ?? []}
        todayCount={todayCount}
      />

      {/* 3. Today's Deliveries Timeline */}
      <TodayDeliveriesTimeline
        todayProd={todayProd}
        todayRoutes={todayRoutes ?? []}
        navigate={navigate}
      />

      {/* 4. Site Meal Count Status — have sites submitted? */}
      <SiteStatusCard todayProd={todayProd} />

      {/* 5. Meal Count Entry — kitchen's own counts */}
      <div className="card mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Submit Meal Counts</h2>
            <p className="text-xs text-gray-400 mt-0.5">Enter today's counts for this kitchen</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/kitchen/meals')}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            Open full form →
          </button>
        </div>
        <div className="px-5 py-4">
          <MealEntryForm compact />
        </div>
      </div>

      {/* 6. Document Compliance */}
      <DocComplianceCard docs={docs ?? []} navigate={navigate} />

      {/* 7. Monthly Summary */}
      <KitchenSummaryCard mealCounts={mealCounts ?? []} stats={stats} docs={docs ?? []} />

      {/* 8. Tomorrow's Production preview */}
      <TomorrowProductionCard tomorrowProd={tomorrowProd} />

      {/* 9. Messages shortcut */}
      <div className="card mb-6">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Messages</p>
              <p className="text-xs text-gray-400">Communicate with your sponsor</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/kitchen/messages')}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            Open →
          </button>
        </div>
      </div>
    </>
  );
}

export default function KitchenDashboard() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const isOverview = location.pathname === '/dashboard/kitchen';
  const { stats, loading } = useDashboardStats();
  const { unreadCount } = useNotifications();

  // NOTE: the old onboarding checklist / action-center / next-action-banner block
  // that used to live here was removed. Those components stopped being rendered in
  // the Task #97 redesign, but ~65 lines kept computing values for them on every
  // render — including document counts derived from stats.docs_uploaded, a field
  // the /stats endpoint never returns. Dead code that computes wrong numbers is
  // worse than no code: it looks maintained. KitchenOverview owns this screen now.

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar navItems={NAV_ITEMS} badgeCounts={{ '/dashboard/kitchen/notifications': unreadCount }} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          {isOverview ? (
            <KitchenOverview stats={stats} loading={loading} navigate={navigate} />
          ) : (
            <Routes>
              <Route path="deliveries"    element={<KitchenDeliveriesPage />} />
              <Route path="meals"         element={<MealEntryForm />} />
              <Route path="application"   element={<ApplicationPage />} />
              <Route path="documents"     element={<DocumentsPage />} />
              <Route path="tasks"         element={<TasksPage />} />
              <Route path="menus"               element={<MenuBuilderPage />} />
              <Route path="production-records" element={<ProductionRecordsPage />} />
              <Route path="training"    element={<TrainingPage role="kitchen" />} />
              <Route path="activity"    element={<ActivityFeedPage />} />
              <Route path="messages"      element={<MessagesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="sites"         element={<KitchenDirectoryPage />} />
              <Route path="settings"      element={<SettingsPage />} />
              <Route path="*"             element={<Outlet />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
}
