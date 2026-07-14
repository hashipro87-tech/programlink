// SiteDashboard.jsx — Dashboard for sites / daycare centers
// Sites submit daily meal counts, upload compliance documents,
// track their application status, and communicate with coordinators.

import { useState, useEffect } from 'react';
import { useLocation, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import {
  ClipboardList, FileText, UtensilsCrossed, MessageSquare,
  Building2, CheckCircle, Settings, AlertTriangle, ArrowRight, Truck, Bell,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

import Sidebar       from '../../components/layout/Sidebar';
import StatCard      from '../../components/common/StatCard';
import ActionCenter      from '../../components/common/ActionCenter';
import ActivityTimeline  from '../../components/common/ActivityTimeline';
import api               from '../../services/api';

// Pages
import ApplicationPage      from '../application/ApplicationPage';
import DocumentsPage        from '../documents/DocumentsPage';
import MessagesPage         from '../messages/MessagesPage';
import NotificationsPage    from '../notifications/NotificationsPage';
import KitchenDirectoryPage from '../kitchen/KitchenDirectoryPage';
import SettingsPage         from '../settings/SettingsPage';
import MealEntryForm        from '../kitchen/components/MealEntryForm';

const NAV_ITEMS = [
  { label: 'Overview',       path: '/dashboard/site',              icon: CheckCircle    },
  { label: 'Deliveries',     path: '/dashboard/site/deliveries',   icon: Truck          },
  { label: 'Meal Counts',    path: '/dashboard/site/meals',        icon: UtensilsCrossed },
  { label: 'My Application', path: '/dashboard/site/application',  icon: ClipboardList  },
  { label: 'Documents',      path: '/dashboard/site/documents',    icon: FileText       },
  { label: 'My Kitchen',     path: '/dashboard/site/kitchen',      icon: Building2      },
  { label: 'Messages',       path: '/dashboard/site/messages',       icon: MessageSquare  },
  { label: 'Notifications', path: '/dashboard/site/notifications',  icon: Bell           },
  { label: 'Settings',       path: '/dashboard/site/settings',       icon: Settings       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO()    { return new Date().toISOString().split('T')[0]; }
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
  return ({ breakfast:'Breakfast', am_snack:'AM Snack', lunch:'Lunch', pm_snack:'PM Snack', dinner:'Dinner' }[v] ?? v);
}

// ─── Incoming Deliveries Banner (site view) ───────────────────────────────────
// "Tomorrow we are receiving: 100 lunches, ETA 11:45 AM"
function IncomingDeliveriesCard({ onViewAll }) {
  const [stops,   setStops]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [label,   setLabel]   = useState('');

  useEffect(() => {
    api.get('/delivery/routes')
      .then(({ data }) => {
        const all = Array.isArray(data) ? data : (data.routes ?? []);
        const t  = todayISO();
        const tm = tomorrowISO();
        // Find nearest upcoming date with deliveries
        const upcoming = all
          .filter(r => r.status !== 'delivered' && r.status !== 'cancelled')
          .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
        if (upcoming.length === 0) { setLoading(false); return; }
        const nearest = upcoming[0];
        setLabel(dateLabel(nearest.date));
        setStops(nearest.stops ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (stops.length === 0) return null;

  const totalMeals = stops.reduce((s, st) => s + (st.meal_count || 0), 0);

  return (
    <div className="bg-brand-600 text-white rounded-2xl px-5 py-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="w-5 h-5 text-brand-200" />
        <span className="text-sm font-semibold text-brand-200 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold mb-3">We are receiving {totalMeals} meal{totalMeals!==1?'s':''}</p>
      <div className="space-y-1.5 mb-4">
        {stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2 text-brand-100 text-sm">
            <span className="font-semibold text-white">
              {stop.meal_count} {mealLabel(stop.meal_type).toLowerCase()}s
            </span>
            {stop.pickup_time && (
              <span>· ETA {fmt12(stop.pickup_time)}</span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={onViewAll}
        className="text-xs font-semibold text-brand-200 hover:text-white underline"
      >
        View all deliveries →
      </button>
    </div>
  );
}

// ─── Full Deliveries Page (site view) ────────────────────────────────────────
function SiteDeliveriesPage() {
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/delivery/routes')
      .then(({ data }) => {
        const all = Array.isArray(data) ? data : (data.routes ?? []);
        setRoutes(all.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byDate = {};
  for (const r of routes) {
    const d = r.date ?? 'unknown';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(r);
  }
  const dates = Object.keys(byDate).sort();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Incoming Deliveries</h1>
        <p className="text-sm text-gray-500 mt-1">Meals scheduled for delivery to your site.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading…</div>
      ) : dates.length === 0 ? (
        <div className="py-24 text-center">
          <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-base font-bold text-gray-600">No deliveries scheduled</p>
          <p className="text-sm text-gray-400 mt-1">Your sponsor will schedule meal deliveries here.</p>
        </div>
      ) : (
        dates.map((date) => {
          const dayRoutes = byDate[date];
          const allStops  = dayRoutes.flatMap(r => r.stops ?? []);
          const total     = allStops.reduce((s, st) => s + (st.meal_count || 0), 0);
          const isNear    = date === todayISO() || date === tomorrowISO();

          return (
            <div key={date} className="mb-8">
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className={`text-base font-bold ${isNear ? 'text-brand-700' : 'text-gray-800'}`}>
                  {dateLabel(date)}
                </h2>
                <span className="text-sm text-gray-400">{total} meal{total!==1?'s':''}</span>
              </div>
              <div className={`card divide-y divide-gray-100 ${isNear ? 'border-brand-200' : ''}`}>
                {allStops.map((stop, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {stop.meal_count} {mealLabel(stop.meal_type).toLowerCase()}s
                        </p>
                        {stop.pickup_time && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            ETA {fmt12(stop.pickup_time)}
                          </p>
                        )}
                      </div>
                      {dayRoutes[0]?.kitchen_name && (
                        <div className="text-right">
                          <p className="text-xs text-gray-400">From kitchen</p>
                          <p className="text-sm font-semibold text-gray-700">{dayRoutes[0].kitchen_name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Onboarding checklist ─────────────────────────────────────────────────────
function buildChecklist(stats) {
  const appStatus   = stats.application_status;
  const appStarted  = appStatus && appStatus !== 'not_started';
  const appApproved = appStatus === 'approved';
  const hasKitchen  = !!stats.assigned_kitchen;

  return [
    { label: 'Register your site',              done: true },
    { label: 'Start your application',          done: appStarted },
    { label: 'Application submitted for review', done: appStarted && appStatus !== 'draft' },
    { label: 'Application approved',            done: appApproved },
    { label: 'Kitchen assigned',                done: hasKitchen },
  ];
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview({ stats, loading }) {
  const navigate     = useNavigate();
  const checklist    = buildChecklist(stats);
  const appStatus    = stats.application_status;
  const isApproved   = appStatus === 'approved';

  const actionTasks = [
    {
      id: 'app',
      label: 'Start your application',
      path: '/dashboard/site/application',
      done: !!(appStatus && appStatus !== 'not_started'),
    },
    {
      id: 'meals',
      label: 'Submit today\'s meal counts',
      path: '/dashboard/site/meals',
      done: !isApproved || !!stats.counts_today,
    },
    {
      id: 'messages',
      label: `Respond to unread messages (${stats.unread_messages ?? 0})`,
      path: '/dashboard/site/messages',
      done: !(stats.unread_messages > 0),
    },
  ];
  const completed    = checklist.filter((s) => s.done).length;
  const progressPct  = Math.round((completed / checklist.length) * 100);

  // Recent meal counts
  const [recentCounts, setRecentCounts]   = useState([]);
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    api.get(`/meal-counts?month=${month}&limit=5`)
      .then(({ data }) => setRecentCounts(data.meal_counts ?? data.counts ?? []))
      .catch(() => setRecentCounts([]))
      .finally(() => setCountsLoading(false));
  }, []);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Site Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your daily meal counts, compliance, and program status.</p>
      </div>

      {/* Action Center */}
      <ActionCenter tasks={actionTasks} loading={loading} />

      {/* Incoming deliveries — what meals are coming */}
      <IncomingDeliveriesCard onViewAll={() => navigate('/dashboard/site/deliveries')} />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Application Status"
          value={appStatus
            ? appStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : '—'}
          icon={ClipboardList}
          color={isApproved ? 'green' : 'yellow'}
        />
        <StatCard
          label="Assigned Kitchen"
          value={stats.assigned_kitchen ?? 'Not assigned'}
          icon={Building2}
          color="blue"
        />
        <StatCard
          label="Meals This Month"
          value={loading ? '—' : (stats.meals_this_month ?? 0).toLocaleString()}
          icon={UtensilsCrossed}
          color="green"
        />
      </div>

      {/* Quick action — log today's counts */}
      {isApproved && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-brand-900 text-sm">Log today's meal counts</p>
            <p className="text-xs text-brand-600 mt-0.5">Breakfast, Lunch, Supper, and Snack — takes under 60 seconds.</p>
          </div>
          <Link
            to="/dashboard/site/meals"
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
          >
            Enter Counts <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Application not approved — show prompt */}
      {!isApproved && appStatus && appStatus !== 'not_started' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">Application under review</p>
            <p className="text-xs text-yellow-700 mt-0.5">You'll be able to submit meal counts once your application is approved.</p>
          </div>
          <Link to="/dashboard/site/application" className="text-xs font-bold text-yellow-700 bg-yellow-100 px-3 py-1.5 rounded-lg">
            View status
          </Link>
        </div>
      )}

      {/* Onboarding checklist */}
      <div className="bg-white border border-gray-100 rounded-2xl mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Setup Progress</h2>
          <span className="text-sm font-medium text-brand-600">{loading ? '…' : `${progressPct}% complete`}</span>
        </div>
        <div className="px-6 pt-4 pb-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="px-6 pb-5 space-y-3 mt-3">
          {checklist.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {step.done ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
              <span className={`text-sm ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {step.label}
              </span>
              {!step.done && i === 1 && (
                <button
                  onClick={() => navigate('/dashboard/site/application')}
                  className="ml-auto text-xs text-brand-600 hover:underline font-medium"
                >
                  Start →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline />

      {/* Recent meal count submissions */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Submissions</h2>
          <Link to="/dashboard/site/meals" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>

        {countsLoading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Loading…</div>
        ) : recentCounts.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <UtensilsCrossed className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No meal counts submitted yet this month.</p>
            {isApproved && (
              <Link to="/dashboard/site/meals" className="text-xs text-brand-600 hover:underline font-medium mt-1 inline-block">
                Submit your first count →
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentCounts.map((count) => {
              const total = (count.breakfast ?? 0) + (count.lunch ?? 0) + (count.supper ?? 0) + (count.snack ?? 0);
              return (
                <div key={count.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{count.date}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      B:{count.breakfast ?? 0} · L:{count.lunch ?? 0} · S:{count.supper ?? 0} · Snk:{count.snack ?? 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{total} meals</span>
                    {count.verified_at ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────
export default function SiteDashboard() {
  const location   = useLocation();
  const isOverview = location.pathname === '/dashboard/site';
  const { stats, loading } = useDashboardStats();
  const { unreadCount } = useNotifications();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar navItems={NAV_ITEMS} badgeCounts={{ '/dashboard/site/notifications': unreadCount }} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-8 sm:p-8 max-w-4xl mx-auto">
          {isOverview ? (
            <Overview stats={stats} loading={loading} />
          ) : (
            <Routes>
              <Route path="deliveries"   element={<SiteDeliveriesPage />} />
              <Route path="meals"        element={<MealEntryForm />} />
              <Route path="application"  element={<ApplicationPage />} />
              <Route path="documents"    element={<DocumentsPage />} />
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
