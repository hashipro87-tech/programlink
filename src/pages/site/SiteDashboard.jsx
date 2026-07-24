// SiteDashboard.jsx — Daily assistant for site directors
// Redesigned around 4 questions: What's coming? What do I need to do? Am I compliant? Did I submit?

import { useState, useEffect } from 'react';
import { useLocation, Routes, Route, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList, FileText, UtensilsCrossed, MessageSquare,
  Building2, CheckCircle, Settings, AlertTriangle, ArrowRight,
  Truck, Bell, CheckSquare, Square, Phone, Mail, Clock,
  Package, TrendingUp, ShieldCheck, Calendar, Activity, Users2, DollarSign, RotateCcw,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import Sidebar   from '../../components/layout/Sidebar';
import api       from '../../services/api';

// Pages
import ApplicationPage      from '../application/ApplicationPage';
import DocumentsPage        from '../documents/DocumentsPage';
import MessagesPage         from '../messages/MessagesPage';
import NotificationsPage    from '../notifications/NotificationsPage';
import KitchenDirectoryPage from '../kitchen/KitchenDirectoryPage';
import SettingsPage         from '../settings/SettingsPage';
import SiteMealCountPage    from './SiteMealCountPage';
import SiteEnrollmentPage  from './SiteEnrollmentPage';
import SiteIncomePage      from './SiteIncomePage';
import SiteRenewalPage     from './SiteRenewalPage';
import TasksPage            from '../tasks/TasksPage';
import ActivityFeedPage    from '../activity/ActivityFeedPage';

const NAV_ITEMS = [
  { label: 'Overview',       path: '/dashboard/site',              icon: CheckCircle    },

  { sectionLabel: 'Daily Ops' },
  { label: 'Deliveries',     path: '/dashboard/site/deliveries',   icon: Truck          },
  { label: 'Meal Counts',    path: '/dashboard/site/meals',        icon: UtensilsCrossed },
  { label: 'Enrollment',     path: '/dashboard/site/enrollment',   icon: Users2         },
  { label: 'Income Certs',  path: '/dashboard/site/income',       icon: DollarSign     },
  { label: 'Renewals',      path: '/dashboard/site/renewal',      icon: RotateCcw      },

  { sectionLabel: 'Admin' },
  { label: 'My Application', path: '/dashboard/site/application',  icon: ClipboardList  },
  { label: 'Documents',      path: '/dashboard/site/documents',    icon: FileText       },
  { label: 'Tasks',          path: '/dashboard/site/tasks',        icon: CheckSquare    },
  { label: 'Activity',       path: '/dashboard/site/activity',     icon: Activity       },
  { label: 'My Kitchen',     path: '/dashboard/site/kitchen',      icon: Building2      },

  { divider: true },
  { label: 'Messages',       path: '/dashboard/site/messages',     icon: MessageSquare  },
  { label: 'Notifications',  path: '/dashboard/site/notifications', icon: Bell          },
  { label: 'Settings',       path: '/dashboard/site/settings',     icon: Settings       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO()    { return new Date().toISOString().split('T')[0]; }
function tomorrowISO() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function dateLabel(iso) {
  if (!iso) return '';
  const t  = todayISO();
  const tm = tomorrowISO();
  if (iso === t)  return 'Today';
  if (iso === tm) return 'Tomorrow';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function greetingTime() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function todayFormatted() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Data hook — fetch everything the site overview needs ──────────────────────
function useSiteData() {
  const [data, setData]       = useState({ mealToday: null, delivery: null, recentCounts: [], docs: [], app: null, sponsorOrg: null, notifications: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    const today = todayISO();

    Promise.allSettled([
      api.get('/auth/me'),
      api.get(`/meal-counts?month=${month}&limit=50`),
      api.get('/delivery/routes'),
      api.get('/applications?limit=1'),
      api.get('/documents?limit=100'),
      api.get('/notifications?limit=5'),
      api.get('/delivery-plans/schedule?days=14'),
    ]).then(async ([meRes, mcRes, drRes, appRes, docRes, notifRes, dpRes]) => {
      // User / sponsor info
      const me          = meRes.status === 'fulfilled' ? meRes.value.data?.user ?? meRes.value.data : null;
      const sponsorId   = me?.sponsor_id;
      let sponsorOrg    = null;
      if (sponsorId) {
        try { sponsorOrg = (await api.get(`/organizations/${sponsorId}`)).data?.organization; } catch {}
      }

      // Today's meal count
      const allCounts   = mcRes.status === 'fulfilled'
        ? (mcRes.value.data?.meal_counts ?? mcRes.value.data?.counts ?? [])
        : [];
      const mealToday   = allCounts.find((c) => c.date === today) ?? null;
      const recentCounts = allCounts.filter((c) => c.date !== today).slice(0, 5);

      // Today's delivery — merge one-off routes + recurring plan instances
      const allRoutes   = drRes.status === 'fulfilled'
        ? (Array.isArray(drRes.value.data) ? drRes.value.data : drRes.value.data?.routes ?? [])
        : [];
      const planDeliveries = dpRes.status === 'fulfilled'
        ? (dpRes.value.data?.deliveries ?? [])
        : [];
      // Merge: plan deliveries are shaped like routes (stops[], date, etc.)
      const mergedRoutes = [...allRoutes, ...planDeliveries];
      const todayRoutes = mergedRoutes.filter((r) => r.date === today && r.status !== 'cancelled');
      const delivery    = todayRoutes[0] ?? null;

      // Application
      const apps        = appRes.status === 'fulfilled'
        ? (appRes.value.data?.applications ?? [])
        : [];
      const app         = apps[0] ?? null;

      // Documents
      const docs        = docRes.status === 'fulfilled'
        ? (docRes.value.data?.documents ?? [])
        : [];

      // Notifications
      const notifications = notifRes.status === 'fulfilled'
        ? (notifRes.value.data?.notifications ?? [])
        : [];

      setData({ me, mealToday, delivery, recentCounts, docs, app, sponsorOrg, allRoutes: mergedRoutes, allCounts, notifications });
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

// ─── Good Morning Banner ───────────────────────────────────────────────────────
function GoodMorningBanner({ me, delivery, mealToday, docs }) {
  const orgName     = me?.org_name ?? 'Your Site';
  const allSubmitted = mealToday && (
    (mealToday.breakfast ?? 0) + (mealToday.lunch ?? 0) +
    (mealToday.supper ?? 0) + (mealToday.snack ?? 0)
  ) > 0;
  const expiringDocs = docs.filter((d) => d.status === 'expiring_soon').length;
  const hasDelivery  = !!delivery;

  const chips = [];
  if (hasDelivery) {
    const eta = delivery.stops?.[0]?.pickup_time;
    chips.push({ icon: Truck, text: `Delivery ${eta ? `at ${fmt12(eta)}` : 'today'}`, color: 'text-brand-200' });
  }
  if (!allSubmitted) chips.push({ icon: UtensilsCrossed, text: 'Meal counts due', color: 'text-yellow-300' });
  if (allSubmitted)  chips.push({ icon: CheckCircle,     text: 'Meal counts submitted', color: 'text-green-300' });
  if (expiringDocs > 0) chips.push({ icon: AlertTriangle, text: `${expiringDocs} doc${expiringDocs > 1 ? 's' : ''} expiring soon`, color: 'text-yellow-300' });
  if (expiringDocs === 0 && docs.length > 0) chips.push({ icon: ShieldCheck, text: 'All documents current', color: 'text-green-300' });

  return (
    <div className="bg-brand-600 text-white rounded-2xl px-6 py-5 mb-6">
      <p className="text-brand-200 text-xs font-semibold uppercase tracking-wide mb-1">{todayFormatted()}</p>
      <h1 className="text-xl font-bold mb-3">{greetingTime()}, {orgName}</h1>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {chips.map(({ icon: Icon, text, color }, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className={`text-xs font-medium ${color}`}>{text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Today's Checklist ─────────────────────────────────────────────────────────
function TodayChecklist({ mealToday, delivery, docs, app, unreadCount, navigate }) {
  const isApproved    = app?.status === 'approved';
  const bSubmitted    = isApproved && (mealToday?.breakfast ?? 0) > 0;
  const lSubmitted    = isApproved && (mealToday?.lunch    ?? 0) > 0;
  const sSubmitted    = isApproved && (mealToday?.snack    ?? 0) > 0;
  const expiringDocs  = docs.filter((d) => d.status === 'expiring_soon' || d.status === 'expired').length;
  const docsOk        = docs.length > 0 && expiringDocs === 0;
  const deliveryDone  = delivery?.status === 'delivered';
  const deliveryEta   = delivery?.stops?.[0]?.pickup_time;

  const items = [
    ...(isApproved ? [
      { label: 'Submit breakfast count', done: bSubmitted, path: '/dashboard/site/meals', urgent: !bSubmitted },
      { label: 'Submit lunch count',     done: lSubmitted, path: '/dashboard/site/meals', urgent: !lSubmitted },
      { label: 'Submit snack count',     done: sSubmitted, path: '/dashboard/site/meals', urgent: !sSubmitted },
    ] : [
      { label: 'Application approved', done: app?.status === 'approved', path: '/dashboard/site/application', urgent: !app },
    ]),
    { label: docsOk ? 'Documents current' : `${expiringDocs} document${expiringDocs !== 1 ? 's' : ''} need attention`, done: docsOk, path: '/dashboard/site/documents', urgent: !docsOk },
    ...(delivery ? [{ label: deliveryDone ? 'Delivery received' : `Delivery arriving${deliveryEta ? ` at ${fmt12(deliveryEta)}` : ''}`, done: deliveryDone, path: '/dashboard/site/deliveries', urgent: false }] : []),
    ...(unreadCount > 0 ? [{ label: `${unreadCount} new message${unreadCount > 1 ? 's' : ''}`, done: false, path: '/dashboard/site/messages', urgent: false }] : []),
  ];

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Today's Checklist</h2>
        <span className="text-xs font-semibold text-gray-400">{doneCount}/{items.length} done</span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
          >
            {item.done
              ? <CheckSquare className="w-4.5 h-4.5 text-green-500 flex-shrink-0 w-5 h-5" />
              : <Square className={`w-5 h-5 flex-shrink-0 ${item.urgent ? 'text-orange-400' : 'text-gray-300'}`} />
            }
            <span className={`text-sm flex-1 ${item.done ? 'text-gray-400 line-through' : item.urgent ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
              {item.label}
            </span>
            {!item.done && <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Summary Cards ─────────────────────────────────────────────────────────────
function SummaryCards({ mealToday, delivery, allCounts }) {
  const totalToday = mealToday
    ? (mealToday.breakfast ?? 0) + (mealToday.lunch ?? 0) + (mealToday.supper ?? 0) + (mealToday.snack ?? 0)
    : 0;

  const deliveryMeals = delivery?.stops?.reduce((s, st) => s + (st.meal_count || 0), 0) ?? 0;
  const deliveryEta   = delivery?.stops?.[0]?.pickup_time;
  const deliveryStatus = delivery?.status ?? null;

  // This week meals
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStr   = weekStart.toISOString().split('T')[0];
  const weekMeals = allCounts
    .filter((c) => c.date >= weekStr)
    .reduce((s, c) => s + (c.breakfast ?? 0) + (c.lunch ?? 0) + (c.supper ?? 0) + (c.snack ?? 0), 0);

  const statusLabel = !delivery ? 'None today'
    : deliveryStatus === 'delivered' ? 'Delivered ✓'
    : deliveryStatus === 'in_transit' ? 'On the way'
    : 'Scheduled';
  const statusColor = !delivery ? 'text-gray-400'
    : deliveryStatus === 'delivered' ? 'text-green-600'
    : deliveryStatus === 'in_transit' ? 'text-brand-600'
    : 'text-yellow-600';

  const cards = [
    { label: 'Meals Submitted', value: totalToday > 0 ? totalToday : '—', icon: UtensilsCrossed, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Next Delivery',   value: deliveryEta ? fmt12(deliveryEta) : (delivery ? 'Today' : 'None'), icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'This Week',       value: weekMeals > 0 ? `${weekMeals} meals` : '—', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Delivery Status', value: statusLabel, icon: Package, color: statusColor, bg: 'bg-gray-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="card px-4 py-4">
          <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-3`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <p className={`text-lg font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Meal Count Status ─────────────────────────────────────────────────────────
function MealCountStatus({ mealToday, app, navigate }) {
  const isApproved = app?.status === 'approved';

  const meals = [
    { label: 'Breakfast', count: mealToday?.breakfast ?? 0 },
    { label: 'Lunch',     count: mealToday?.lunch     ?? 0 },
    { label: 'Snack',     count: mealToday?.snack     ?? 0 },
    { label: 'Supper',    count: mealToday?.supper    ?? 0 },
  ];

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Today's Meal Counts</h2>
        {isApproved && (
          <button
            onClick={() => navigate('/dashboard/site/meals')}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            {mealToday ? 'Update' : 'Submit →'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 divide-x divide-gray-100">
        {meals.map(({ label, count }) => {
          const submitted = count > 0;
          return (
            <div key={label} className="px-4 py-5 text-center">
              <p className={`text-xl font-bold ${submitted ? 'text-gray-900' : 'text-gray-200'}`}>
                {submitted ? count : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
              <div className={`mt-2 mx-auto w-1.5 h-1.5 rounded-full ${submitted ? 'bg-green-500' : 'bg-gray-200'}`} />
            </div>
          );
        })}
      </div>
      {!isApproved && (
        <div className="px-5 py-3 bg-yellow-50 border-t border-yellow-100">
          <p className="text-xs text-yellow-700">Meal counts unlock after your application is approved.</p>
        </div>
      )}
    </div>
  );
}

// ─── Week Delivery Schedule ────────────────────────────────────────────────────
// Shows today + 6 days so the site can see their full week at a glance.
// allRoutes = merged manual routes + recurring plan instances
function WeekDeliverySchedule({ allRoutes, mealToday, navigate }) {
  const today = todayISO();

  // Build a 7-day window starting today
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  // Index routes by date (merge multiple routes on same day)
  const byDate = {};
  for (const r of (allRoutes ?? [])) {
    if (!r.date || r.status === 'cancelled') continue;
    if (!byDate[r.date]) byDate[r.date] = { stops: [], kitchen_name: r.kitchen_name, status: r.status };
    byDate[r.date].stops.push(...(r.stops ?? []));
    // Use the most "advanced" status
    const rank = { scheduled: 0, in_transit: 1, delivered: 2 };
    if ((rank[r.status] ?? 0) > (rank[byDate[r.date].status] ?? 0)) {
      byDate[r.date].status = r.status;
    }
  }

  const mealCountToday = mealToday
    ? (mealToday.breakfast ?? 0) + (mealToday.lunch ?? 0) + (mealToday.supper ?? 0) + (mealToday.snack ?? 0)
    : 0;

  const hasAnyDelivery = days.some((d) => byDate[d]);

  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const statusDot = {
    scheduled:  'bg-yellow-400',
    in_transit: 'bg-brand-500 animate-pulse',
    delivered:  'bg-green-500',
  };

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">This Week's Deliveries</h2>
        <button
          onClick={() => navigate('/dashboard/site/deliveries')}
          className="text-xs font-semibold text-brand-600 hover:underline"
        >
          Full schedule →
        </button>
      </div>

      {!hasAnyDelivery ? (
        <div className="px-5 py-8 text-center">
          <Truck className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No deliveries scheduled this week</p>
          <p className="text-xs text-gray-400 mt-1">Your sponsor will set up deliveries here.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {days.map((iso) => {
            const isToday = iso === today;
            const d       = byDate[iso];
            const dayName = DAY_NAMES[new Date(iso + 'T12:00:00').getDay()];
            const dateNum = new Date(iso + 'T12:00:00').getDate();

            return (
              <div
                key={iso}
                onClick={() => navigate('/dashboard/site/deliveries')}
                className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                  isToday ? 'bg-brand-50 hover:bg-brand-100' : 'hover:bg-gray-50'
                }`}
              >
                {/* Day label */}
                <div className={`w-10 text-center flex-shrink-0 ${isToday ? 'text-brand-700' : 'text-gray-400'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wide`}>{dayName}</p>
                  <p className={`text-lg font-bold leading-tight ${isToday ? 'text-brand-700' : 'text-gray-700'}`}>{dateNum}</p>
                  {isToday && <p className="text-[9px] font-bold text-brand-500 uppercase">Today</p>}
                </div>

                {d ? (
                  <>
                    {/* Status dot */}
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[d.status] ?? 'bg-yellow-400'}`} />

                    {/* Delivery details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-0.5">
                        {d.stops.map((st, i) => (
                          <span key={i} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isToday ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {st.meal_type ? st.meal_type.charAt(0).toUpperCase() + st.meal_type.slice(1) : 'Meal'}: {st.meal_count}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {d.kitchen_name && <span>{d.kitchen_name}</span>}
                        {d.stops[0]?.pickup_time && (
                          <>
                            {d.kitchen_name && <span>·</span>}
                            <span>{fmt12(d.stops[0].pickup_time)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Today: meal count match indicator */}
                    {isToday && mealCountToday > 0 && (() => {
                      const total = d.stops.reduce((s, st) => s + (st.meal_count || 0), 0);
                      const diff  = total - mealCountToday;
                      return (
                        <span className={`text-xs font-semibold flex-shrink-0 ${diff < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {diff === 0 ? '✓ Match' : diff > 0 ? `+${diff} extra` : `${diff} short`}
                        </span>
                      );
                    })()}

                    {d.status === 'delivered' && (
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-300 italic">No delivery</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── My Sponsor ────────────────────────────────────────────────────────────────
function MySponsorCard({ sponsorOrg, navigate }) {
  if (!sponsorOrg) return null;
  return (
    <div className="card px-5 py-4 mb-6">
      <h2 className="font-semibold text-gray-900 mb-3">Your Sponsor</h2>
      <p className="text-sm font-semibold text-gray-800 mb-1">{sponsorOrg.name}</p>
      {sponsorOrg.phone && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <Phone className="w-3.5 h-3.5" /> {sponsorOrg.phone}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => navigate('/dashboard/site/messages')}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Message
        </button>
      </div>
    </div>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActions({ navigate, app }) {
  const isApproved = app?.status === 'approved';
  const actions = [
    { label: 'Submit Meal Counts',  icon: UtensilsCrossed, path: '/dashboard/site/meals',      show: isApproved },
    { label: 'Upload Document',     icon: FileText,        path: '/dashboard/site/documents',   show: true },
    { label: 'Message Sponsor',     icon: MessageSquare,   path: '/dashboard/site/messages',    show: true },
    { label: 'View Deliveries',     icon: Truck,           path: '/dashboard/site/deliveries',  show: true },
  ].filter((a) => a.show);

  return (
    <div className="card px-5 py-4 mb-6">
      <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex items-center gap-2.5 px-3 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
          >
            <Icon className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-700">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Document Progress ─────────────────────────────────────────────────────────
function DocProgress({ docs, navigate }) {
  const total    = docs.length;
  if (total === 0) return null;
  const valid    = docs.filter((d) => d.status === 'valid').length;
  const expiring = docs.filter((d) => d.status === 'expiring_soon').length;
  const expired  = docs.filter((d) => d.status === 'expired').length;
  const pct      = Math.round((valid / total) * 100);

  return (
    <div className="card px-5 py-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">Documents</h2>
        <button onClick={() => navigate('/dashboard/site/documents')} className="text-xs text-brand-600 hover:underline font-semibold">
          View all
        </button>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{valid} of {total} current</span>
        <span className={`text-xs font-semibold ${pct === 100 ? 'text-green-600' : 'text-orange-600'}`}>{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {(expiring > 0 || expired > 0) && (
        <div className="space-y-1">
          {expired  > 0 && <p className="text-xs text-red-600 font-medium">⚠ {expired} expired</p>}
          {expiring > 0 && <p className="text-xs text-yellow-600 font-medium">⚡ {expiring} expiring soon</p>}
        </div>
      )}
    </div>
  );
}

// ─── Recent Activity ───────────────────────────────────────────────────────────
function RecentActivity({ notifications, navigate }) {
  if (notifications.length === 0) return null;
  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Recent Activity</h2>
        <button onClick={() => navigate('/dashboard/site/notifications')} className="text-xs text-brand-600 hover:underline font-semibold">
          View all
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {notifications.map((n) => (
          <div key={n.id} className="px-5 py-3 flex items-start gap-3">
            <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${n.read_at ? 'bg-gray-200' : 'bg-brand-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{n.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview() {
  const navigate = useNavigate();
  const { data, loading } = useSiteData();
  const { unreadCount }   = useNotifications();
  const { me, mealToday, delivery, recentCounts, docs, app, sponsorOrg, allRoutes, allCounts, notifications } = data;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <GoodMorningBanner me={me} delivery={delivery} mealToday={mealToday} docs={docs} />
      <TodayChecklist mealToday={mealToday} delivery={delivery} docs={docs} app={app} unreadCount={unreadCount} navigate={navigate} />
      <SummaryCards mealToday={mealToday} delivery={delivery} allCounts={allCounts ?? []} />
      <MealCountStatus mealToday={mealToday} app={app} navigate={navigate} />
      <WeekDeliverySchedule allRoutes={allRoutes} mealToday={mealToday} navigate={navigate} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-0">
        <div>
          <QuickActions navigate={navigate} app={app} />
          <MySponsorCard sponsorOrg={sponsorOrg} navigate={navigate} />
        </div>
        <div>
          <DocProgress docs={docs} navigate={navigate} />
          <RecentActivity notifications={notifications} navigate={navigate} />
        </div>
      </div>
    </>
  );
}

// ─── Deliveries Page ──────────────────────────────────────────────────────────
function SiteDeliveriesPage() {
  const navigate   = useNavigate();
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [mealToday, setMealToday] = useState(null);

  useEffect(() => {
    const today = todayISO();
    const month = new Date().toISOString().slice(0, 7);
    Promise.allSettled([
      api.get('/delivery/routes'),
      api.get(`/meal-counts?month=${month}&limit=50`),
      api.get('/delivery-plans/schedule?days=60'),
    ]).then(([routesRes, mcRes, planRes]) => {
      const manual = routesRes.status === 'fulfilled'
        ? (Array.isArray(routesRes.value.data) ? routesRes.value.data : routesRes.value.data?.routes ?? [])
        : [];
      const planned = planRes.status === 'fulfilled'
        ? (planRes.value.data?.deliveries ?? [])
        : [];
      const all = [...manual, ...planned].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
      setRoutes(all);

      const counts = mcRes.status === 'fulfilled'
        ? (mcRes.value.data?.meal_counts ?? mcRes.value.data?.counts ?? [])
        : [];
      setMealToday(counts.find((c) => c.date === today) ?? null);
      setLoading(false);
    });
  }, []);

  const today      = todayISO();
  const tomorrow   = tomorrowISO();
  const todayRoutes = routes.filter((r) => r.date === today && r.status !== 'cancelled');
  const upcoming   = routes.filter((r) => r.date > today && r.status !== 'cancelled');
  const past       = routes.filter((r) => r.date < today || r.status === 'delivered').slice(0, 5);

  const todayDelivery = todayRoutes[0] ?? null;
  const todayStops    = todayRoutes.flatMap((r) => r.stops ?? []);
  const todayMeals    = todayStops.reduce((s, st) => s + (st.meal_count || 0), 0);
  const nextEta       = todayStops[0]?.pickup_time;
  const mealCountToday = mealToday
    ? (mealToday.breakfast ?? 0) + (mealToday.lunch ?? 0) + (mealToday.supper ?? 0) + (mealToday.snack ?? 0)
    : 0;

  // This week total
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStr   = weekStart.toISOString().split('T')[0];
  const weekMeals = routes
    .filter((r) => r.date >= weekStr)
    .flatMap((r) => r.stops ?? [])
    .reduce((s, st) => s + (st.meal_count || 0), 0);

  const statusMeta = {
    scheduled:  { label: 'Scheduled',  color: 'text-yellow-700 bg-yellow-50',  dot: 'bg-yellow-400' },
    preparing:  { label: 'Preparing',  color: 'text-orange-700 bg-orange-50',  dot: 'bg-orange-400' },
    in_transit: { label: 'On the way', color: 'text-brand-700 bg-brand-50',    dot: 'bg-brand-500 animate-pulse' },
    delivered:  { label: 'Delivered',  color: 'text-green-700 bg-green-50',    dot: 'bg-green-500' },
    default:    { label: 'Scheduled',  color: 'text-gray-600 bg-gray-100',     dot: 'bg-gray-400' },
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Incoming Deliveries</h1>
        <p className="text-sm text-gray-500 mt-0.5">Meals scheduled for your site.</p>
      </div>

      {/* No deliveries at all */}
      {routes.length === 0 && (
        <div className="card py-20 text-center">
          <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-base font-bold text-gray-600">No deliveries scheduled yet</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Your sponsor will schedule meal deliveries once your program is active.</p>
          <button onClick={() => navigate('/dashboard/site/messages')} className="mt-4 text-sm text-brand-600 hover:underline font-semibold">
            Message your sponsor →
          </button>
        </div>
      )}

      {/* Today hero */}
      {todayDelivery ? (
        <div className="bg-brand-600 text-white rounded-2xl px-6 py-5 mb-5">
          <div className="flex items-center gap-2 mb-1">
            {(() => {
              const s = todayDelivery.status ?? 'scheduled';
              const m = statusMeta[s] ?? statusMeta.default;
              return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full">
                  <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> {m.label}
                </span>
              );
            })()}
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-4xl font-bold">{todayMeals}</p>
              <p className="text-brand-200 text-sm">meals arriving today</p>
            </div>
            {nextEta && (
              <div className="text-right">
                <p className="text-2xl font-bold">{fmt12(nextEta)}</p>
                <p className="text-brand-200 text-sm">estimated arrival</p>
              </div>
            )}
          </div>
          {todayDelivery.kitchen_name && (
            <p className="text-brand-200 text-sm mt-3">From {todayDelivery.kitchen_name}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => navigate('/dashboard/site/messages')} className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-xl transition-colors">
              <MessageSquare className="w-4 h-4" /> Message Kitchen
            </button>
          </div>
        </div>
      ) : routes.length > 0 && (
        <div className="card px-5 py-5 mb-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">No delivery scheduled today</p>
              {upcoming[0] && (
                <>
                  <p className="text-xs text-gray-400 mt-0.5">Your next delivery is:</p>
                  <p className="text-sm font-bold text-brand-700 mt-1">
                    {dateLabel(upcoming[0].date)} — {upcoming[0].stops?.reduce((s, st) => s + (st.meal_count || 0), 0) ?? 0} meals
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {routes.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Meals Today',     value: todayMeals > 0 ? todayMeals : '—', color: 'text-brand-600' },
            { label: 'ETA',             value: nextEta ? fmt12(nextEta) : '—',    color: 'text-blue-600' },
            { label: 'This Week',       value: weekMeals > 0 ? weekMeals : '—',   color: 'text-green-600' },
            { label: 'Total Deliveries', value: routes.length,                     color: 'text-gray-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card px-4 py-4">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Meal count vs delivery integration */}
      {todayMeals > 0 && mealCountToday > 0 && (() => {
        const diff = todayMeals - mealCountToday;
        return (
          <div className={`rounded-2xl px-5 py-4 mb-5 flex items-center gap-4 ${diff < 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${diff < 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              {diff < 0
                ? <AlertTriangle className="w-5 h-5 text-red-600" />
                : <CheckCircle   className="w-5 h-5 text-green-600" />
              }
            </div>
            <div>
              {diff >= 0 ? (
                <>
                  <p className="text-sm font-bold text-green-800">{diff === 0 ? 'Delivery matches meal count exactly' : `${diff} extra meal${diff !== 1 ? 's' : ''} available`}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{mealCountToday} children enrolled · {todayMeals} meals ordered</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-red-800">Meal count exceeds delivery by {Math.abs(diff)}</p>
                  <p className="text-xs text-red-600 mt-0.5">{mealCountToday} children · only {todayMeals} meals ordered — contact your sponsor immediately</p>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Delivery timeline */}
      {routes.filter(r => r.date >= todayISO()).map((route) => {
        const stops     = route.stops ?? [];
        const total     = stops.reduce((s, st) => s + (st.meal_count || 0), 0);
        const isToday   = route.date === today;
        const isTomorrow = route.date === tomorrow;
        const s         = route.status ?? 'scheduled';
        const meta      = statusMeta[s] ?? statusMeta.default;

        return (
          <div key={route.id} className="mb-6">
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className={`text-sm font-bold ${isToday ? 'text-brand-700' : 'text-gray-700'}`}>
                {dateLabel(route.date)}
              </h2>
              <span className="text-xs text-gray-400">{total} meal{total !== 1 ? 's' : ''}</span>
              <span className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />{meta.label}
              </span>
            </div>
            <div className="card divide-y divide-gray-100">
              {stops.map((stop, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-base font-bold text-gray-900">
                      {stop.meal_count} {stop.meal_type ? `${stop.meal_type.charAt(0).toUpperCase() + stop.meal_type.slice(1)}s` : 'meals'}
                    </p>
                    {stop.pickup_time && (
                      <p className="text-sm font-semibold text-gray-600">{fmt12(stop.pickup_time)}</p>
                    )}
                  </div>
                  {route.kitchen_name && (
                    <p className="text-xs text-gray-400">From {route.kitchen_name}</p>
                  )}
                  {s === 'delivered' && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-green-700 font-semibold">Delivered</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Delivery history */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Recent Deliveries</h2>
          <div className="card divide-y divide-gray-100">
            {past.map((route) => {
              const total = (route.stops ?? []).reduce((s, st) => s + (st.meal_count || 0), 0);
              return (
                <div key={route.id} className="px-5 py-3.5 flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{dateLabel(route.date)}</p>
                  </div>
                  <span className="text-sm text-gray-500">{total} meals</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────
export default function SiteDashboard() {
  const location   = useLocation();
  const isOverview = location.pathname === '/dashboard/site';
  const { unreadCount } = useNotifications();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar navItems={NAV_ITEMS} badgeCounts={{ '/dashboard/site/notifications': unreadCount }} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-8 sm:p-8 max-w-4xl mx-auto">
          {isOverview ? (
            <Overview />
          ) : (
            <Routes>
              <Route path="deliveries"   element={<SiteDeliveriesPage />} />
              <Route path="meals"        element={<SiteMealCountPage />} />
              <Route path="enrollment"   element={<SiteEnrollmentPage />} />
              <Route path="income"      element={<SiteIncomePage />} />
              <Route path="renewal"    element={<SiteRenewalPage />} />
              <Route path="application"  element={<ApplicationPage />} />
              <Route path="documents"    element={<DocumentsPage />} />
              <Route path="tasks"        element={<TasksPage />} />
              <Route path="activity"    element={<ActivityFeedPage />} />
              <Route path="messages"     element={<MessagesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="kitchen"      element={<KitchenDirectoryPage />} />
              <Route path="settings"     element={<SettingsPage />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
}
