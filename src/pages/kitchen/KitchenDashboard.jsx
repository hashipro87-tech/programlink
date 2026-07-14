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
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

import Sidebar           from '../../components/layout/Sidebar';
import StatCard          from '../../components/common/StatCard';
import ApplicationPage   from '../application/ApplicationPage';
import DocumentsPage     from '../documents/DocumentsPage';
import MessagesPage      from '../messages/MessagesPage';
import NotificationsPage from '../notifications/NotificationsPage';
import KitchenDirectoryPage from './KitchenDirectoryPage';
import SettingsPage      from '../settings/SettingsPage';
import api               from '../../services/api';

// New kitchen-specific components
import NextActionBanner    from './components/NextActionBanner';
import MealReminderBanner  from './components/MealReminderBanner';
import MealEntryForm       from './components/MealEntryForm';
import DocumentUploadCard  from './components/DocumentUploadCard';
import SponsorMessaging    from './components/SponsorMessaging';
import AlertsCenter        from './components/AlertsCenter';
import ActionCenter        from '../../components/common/ActionCenter';
import ActivityTimeline    from '../../components/common/ActivityTimeline';

const NAV_ITEMS = [
  { label: 'Overview',        path: '/dashboard/kitchen',              icon: CheckCircle,    end: true },
  { label: 'Deliveries',      path: '/dashboard/kitchen/deliveries',   icon: Truck },
  { label: 'Meal Counts',     path: '/dashboard/kitchen/meals',        icon: UtensilsCrossed },
  { label: 'My Application',  path: '/dashboard/kitchen/application',  icon: ClipboardList },
  { label: 'Documents',       path: '/dashboard/kitchen/documents',    icon: FileText },
  { label: 'Connected Sites', path: '/dashboard/kitchen/sites',        icon: Building2 },
  { label: 'Messages',        path: '/dashboard/kitchen/messages',       icon: MessageSquare },
  { label: 'Notifications',   path: '/dashboard/kitchen/notifications',  icon: Bell },
  { label: 'Settings',        path: '/dashboard/kitchen/settings',       icon: Settings },
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

// ─── Upcoming Deliveries Panel (kitchen view) ─────────────────────────────────
function UpcomingDeliveriesPanel({ onViewAll }) {
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/delivery/routes')
      .then(({ data }) => {
        const all = Array.isArray(data) ? data : (data.routes ?? []);
        // Show only upcoming (not delivered, not cancelled), sort by date asc
        const upcoming = all
          .filter(r => r.status !== 'delivered' && r.status !== 'cancelled')
          .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
          .slice(0, 5);
        setRoutes(upcoming);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const t = todayISO();
  const tm = tomorrowISO();
  const highlighted = routes.filter(r => r.date === t || r.date === tm);

  return (
    <div className="card mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand-600" />
          <h2 className="font-semibold text-gray-900">Upcoming Deliveries</h2>
        </div>
        <button onClick={onViewAll} className="text-sm text-brand-600 hover:underline">View all</button>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">Loading…</div>
      ) : routes.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Truck className="w-7 h-7 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No upcoming deliveries scheduled.</p>
          <p className="text-xs text-gray-400 mt-1">Your sponsor will assign deliveries here.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {routes.map((route) => {
            const stops = route.stops ?? [];
            const totalMeals = stops.reduce((s, st) => s + (st.meal_count || 0), 0);
            const isNear = route.date === t || route.date === tm;
            return (
              <div key={route.id} className={`px-6 py-4 ${isNear ? 'bg-brand-50/40' : ''}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-sm font-bold ${isNear ? 'text-brand-800' : 'text-gray-800'}`}>
                    {dateLabel(route.date)}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {totalMeals} meal{totalMeals !== 1 ? 's' : ''} · {stops.length} site{stops.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1">
                  {stops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="flex-1 truncate">{stop.site_name ?? 'Site'}</span>
                      <span className="text-gray-500 flex-shrink-0">{stop.meal_count} {mealLabel(stop.meal_type).toLowerCase()}s</span>
                      {stop.pickup_time && (
                        <span className="text-gray-400 flex-shrink-0 text-xs">ETA {fmt12(stop.pickup_time)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Full Deliveries Page (kitchen) ──────────────────────────────────────────
function KitchenDeliveriesPage() {
  const [routes,  setRoutes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/delivery/routes')
      .then(({ data }) => {
        const all = Array.isArray(data) ? data : (data.routes ?? []);
        setRoutes(all.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by date
  const byDate = {};
  for (const r of routes) {
    const d = r.date ?? 'unknown';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(r);
  }
  const dates = Object.keys(byDate).sort();

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
      ) : dates.length === 0 ? (
        <div className="py-24 text-center">
          <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-base font-bold text-gray-600">No deliveries yet</p>
          <p className="text-sm text-gray-400 mt-1">Your sponsor assigns deliveries from their dashboard.</p>
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
                <span className="text-sm text-gray-400">{total} meals · {allStops.length} sites</span>
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
                        {stop.meal_count} {mealLabel(stop.meal_type).toLowerCase()}s
                      </p>
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

// Derive onboarding checklist steps from real API stats
function buildChecklist(stats) {
  const appStatus   = stats.application_status;
  const docsUploaded = stats.docs_uploaded ?? 0;
  const appSubmitted = appStatus && appStatus !== 'not_started';
  const appApproved  = appStatus === 'approved';

  return [
    { label: 'Register your kitchen',          done: true },
    { label: 'Upload at least one document',   done: docsUploaded >= 1 },
    { label: 'Upload 3 required documents',    done: docsUploaded >= 3 },
    { label: 'Submit application for review',  done: appSubmitted },
    { label: 'Application approved by sponsor',done: appApproved },
  ];
}

// Derive the application status string for NextActionBanner
// The banner uses: not_submitted | submitted | approved
function getBannerStatus(statsStatus) {
  if (!statsStatus || statsStatus === 'not_started') return 'not_submitted';
  if (statsStatus === 'approved') return 'approved';
  return 'submitted';
}

export default function KitchenDashboard() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const isOverview = location.pathname === '/dashboard/kitchen';
  const { stats, loading } = useDashboardStats();
  const { unreadCount } = useNotifications();

  const checklist   = buildChecklist(stats);
  const completed   = checklist.filter((s) => s.done).length;
  const progressPct = Math.round((completed / checklist.length) * 100);

  // Derive uploaded docs list for NextActionBanner
  // In a real build this would come from the documents API; for now we derive from stats
  const uploadedDocs = [];
  if ((stats.docs_uploaded ?? 0) >= 1) uploadedDocs.push('W-9');
  if ((stats.docs_uploaded ?? 0) >= 2) uploadedDocs.push('Menu Plan');
  if ((stats.docs_uploaded ?? 0) >= 3) uploadedDocs.push('Insurance Certificate');

  const bannerStatus = getBannerStatus(stats.application_status);

  // Build Action Center tasks from real stats
  const actionTasks = [
    {
      id: 'docs',
      label: `Upload required documents (${stats.docs_uploaded ?? 0}/3 uploaded)`,
      path: '/dashboard/kitchen/documents',
      done: (stats.docs_uploaded ?? 0) >= 3,
    },
    {
      id: 'app',
      label: 'Submit your application for review',
      path: '/dashboard/kitchen/application',
      done: bannerStatus !== 'not_submitted',
    },
    {
      id: 'meals',
      label: 'Submit today\'s meal counts',
      path: '/dashboard/kitchen/meals',
      done: bannerStatus !== 'approved' || !!stats.counts_today,
    },
    {
      id: 'messages',
      label: `Respond to unread messages (${stats.unread_messages ?? 0})`,
      path: '/dashboard/kitchen/messages',
      done: !(stats.unread_messages > 0),
    },
  ];

  // Navigate to the right sub-page when a banner action is clicked
  const handleBannerAction = () => {
    if (uploadedDocs.length < 3) {
      navigate('/dashboard/kitchen/documents');
    } else if (bannerStatus === 'not_submitted') {
      navigate('/dashboard/kitchen/application');
    } else {
      navigate('/dashboard/kitchen/meals');
    }
  };

  // AlertsCenter navigation helper
  const handleAlertNav = (path) => {
    navigate(`/dashboard/kitchen/${path}`);
  };

  // When all 3 docs are uploaded via DocumentUploadCard, refresh stats
  // (useDashboardStats will re-fetch on next render cycle)
  const handleAllUploaded = () => {
    navigate('/dashboard/kitchen/application');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar navItems={NAV_ITEMS} badgeCounts={{ '/dashboard/kitchen/notifications': unreadCount }} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          {isOverview ? (
            <>
              {/* Page heading */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  Manage your daily operations, documents, and deliveries.
                </p>
              </div>

              {/* ── Action Center ── */}
              <ActionCenter tasks={actionTasks} loading={loading} />

              {/* ── Next Action Banner — always tells the kitchen what to do next ── */}
              <NextActionBanner
                uploadedDocs={uploadedDocs}
                applicationStatus={bannerStatus}
                onAction={handleBannerAction}
              />

              {/* ── Meal Reminder — warns if recent entries are missing ── */}
              <MealReminderBanner onLogNow={() => navigate('/dashboard/kitchen/meals')} />

              {/* ── Upcoming Deliveries — what meals to prep ── */}
              <UpcomingDeliveriesPanel onViewAll={() => navigate('/dashboard/kitchen/deliveries')} />

              {/* ── Alerts — derived from real stats ── */}
              <AlertsCenter stats={stats} onNavigate={handleAlertNav} />

              {/* ── Stat cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                  label="Application Status"
                  value={
                    stats.application_status
                      ? stats.application_status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                      : 'Not Started'
                  }
                  icon={ClipboardList}
                  color="yellow"
                />
                <StatCard
                  label="Connected Sites"
                  value={stats.connected_sites ?? '—'}
                  icon={Building2}
                  color="blue"
                />
                <StatCard
                  label="Docs Uploaded"
                  value={`${stats.docs_uploaded ?? 0} / 3`}
                  icon={FileText}
                  color="green"
                />
              </div>

              {/* ── Onboarding Checklist ── */}
              <div className="card mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Onboarding Checklist</h2>
                  <span className="text-sm font-semibold text-brand-600">
                    {loading ? '…' : `${progressPct}% complete`}
                  </span>
                </div>

                <div className="px-6 pt-4 pb-2">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="px-6 pb-5 mt-3 space-y-3">
                  {checklist.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.done ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-[10px] font-bold">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm flex-1 ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {step.label}
                      </span>
                      {/* Quick-action links on incomplete steps */}
                      {!step.done && i === 1 && (
                        <button
                          onClick={() => navigate('/dashboard/kitchen/documents')}
                          className="text-xs text-brand-600 hover:underline font-semibold"
                        >
                          Upload
                        </button>
                      )}
                      {!step.done && i === 3 && (
                        <button
                          onClick={() => navigate('/dashboard/kitchen/application')}
                          className="text-xs text-brand-600 hover:underline font-semibold"
                        >
                          Go to Application
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Activity Timeline ── */}
              <ActivityTimeline />

              {/* ── Required Document Upload Card ── */}
              <DocumentUploadCard onAllUploaded={handleAllUploaded} />

              {/* ── Daily Meal Count Entry Form ── */}
              <MealEntryForm />

              {/* ── Sponsor Messaging ── */}
              <SponsorMessaging />
            </>
          ) : (
            <Routes>
              <Route path="deliveries"    element={<KitchenDeliveriesPage />} />
              <Route path="meals"         element={<MealEntryForm />} />
              <Route path="application"   element={<ApplicationPage />} />
              <Route path="documents"     element={<DocumentsPage />} />
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
