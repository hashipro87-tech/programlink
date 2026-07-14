// CoordinatorDashboard.jsx — Coordinator view
// Coordinators manage a subset of sites and kitchens within a sponsor's program.
// Key jobs: verify meal counts, track site compliance, manage documents.

import { useState, useEffect } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import {
  Building2, MessageSquare, FileText,
  CheckCircle, Settings, ClipboardList, AlertTriangle, UtensilsCrossed, ClipboardCheck, Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

// Pages
import DocumentsPage              from '../documents/DocumentsPage';
import MessagesPage               from '../messages/MessagesPage';
import NotificationsPage          from '../notifications/NotificationsPage';
import SettingsPage               from '../settings/SettingsPage';
import CoordinatorSitesPage       from './CoordinatorSitesPage';
import CoordinatorMealCountsPage  from './CoordinatorMealCountsPage';
import CoordinatorKitchensPage    from './CoordinatorKitchensPage';
import ActionCenter               from '../../components/common/ActionCenter';
import ApplicationsPage           from '../sponsor/ApplicationsPage';

const NAV_ITEMS = [
  { label: 'Overview',      path: '/dashboard/coordinator',               icon: CheckCircle    },
  { label: 'Applications',  path: '/dashboard/coordinator/applications',  icon: ClipboardList  },
  { label: 'My Sites',      path: '/dashboard/coordinator/sites',         icon: Building2      },
  { label: 'My Kitchens',   path: '/dashboard/coordinator/kitchens',      icon: UtensilsCrossed },
  { label: 'Meal Counts',   path: '/dashboard/coordinator/meal-counts',   icon: ClipboardList  },
  { label: 'Documents',     path: '/dashboard/coordinator/documents',     icon: FileText       },
  { label: 'Messages',       path: '/dashboard/coordinator/messages',       icon: MessageSquare  },
  { label: 'Notifications', path: '/dashboard/coordinator/notifications',  icon: Bell           },
  { label: 'Settings',      path: '/dashboard/coordinator/settings',       icon: Settings       },
];

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview() {
  const [sites, setSites]         = useState([]);
  const [pending, setPending]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    Promise.all([
      api.get('/organizations?type=site&limit=5'),
      api.get(`/meal-counts?month=${month}&limit=100`),
    ])
      .then(([orgsRes, countsRes]) => {
        setSites(orgsRes.data.organizations ?? []);
        const all = countsRes.data.meal_counts ?? countsRes.data.counts ?? [];
        setPending(all.filter((c) => !c.verified_at));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCount     = sites.filter((s) => s.status === 'active').length;
  const docAlertCount   = sites.filter((s) => (s.doc_alerts ?? 0) > 0).length;

  const actionTasks = [
    {
      id: 'verify',
      label: `Verify ${pending.length} pending meal count${pending.length !== 1 ? 's' : ''}`,
      path: '/dashboard/coordinator/meal-counts',
      urgent: pending.length > 5,
      done: pending.length === 0,
    },
    {
      id: 'docs',
      label: `${docAlertCount} site${docAlertCount !== 1 ? 's have' : ' has'} document alerts`,
      path: '/dashboard/coordinator/sites',
      urgent: true,
      done: docAlertCount === 0,
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your assigned sites, verify meal counts, and track compliance.</p>
      </div>

      {/* Action Center */}
      <ActionCenter tasks={actionTasks} loading={loading} />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Active Sites"          value={loading ? '—' : activeCount}        icon={Building2}     color="blue"   />
        <StatCard label="Awaiting Verification" value={loading ? '—' : pending.length}     icon={ClipboardList} color="yellow" />
        <StatCard label="Doc Alerts"            value={loading ? '—' : docAlertCount}      icon={AlertTriangle} color="red"    />
      </div>

      {/* Pending verification banner */}
      {!loading && pending.length > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-yellow-800 flex-1">
            {pending.length} meal count{pending.length > 1 ? 's' : ''} waiting for your verification.
          </p>
          <Link
            to="/dashboard/coordinator/meal-counts"
            className="text-xs font-bold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Review now →
          </Link>
        </div>
      )}

      {/* Sites overview */}
      <div className="bg-white border border-gray-100 rounded-2xl mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Sites Overview</h2>
          <Link to="/dashboard/coordinator/sites" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Loading…</div>
        ) : sites.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No sites in the program yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sites.map((site) => (
              <div key={site.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Health dot */}
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    site.status === 'suspended' || (site.doc_alerts ?? 0) > 0
                      ? 'bg-red-400'
                      : (site.pending_apps ?? 0) > 0
                      ? 'bg-yellow-400'
                      : 'bg-green-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{site.name}</p>
                    <p className="text-xs text-gray-400">{site.address ?? 'No address on file'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(site.doc_alerts ?? 0) > 0 && (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {site.doc_alerts} doc alert{site.doc_alerts > 1 ? 's' : ''}
                    </span>
                  )}
                  <StatusBadge status={site.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent meal counts */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Pending Verifications</h2>
          <Link to="/dashboard/coordinator/meal-counts" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Loading…</div>
        ) : pending.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">All counts verified. You're up to date.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pending.slice(0, 5).map((count) => {
              const total = (count.breakfast ?? 0) + (count.lunch ?? 0) + (count.supper ?? 0) + (count.snack ?? 0);
              return (
                <div key={count.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{count.date}</p>
                    <p className="text-xs text-gray-400">{count.organization_name ?? count.org_name ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-gray-900">{total.toLocaleString()} meals</p>
                    <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-full">
                      Unverified
                    </span>
                  </div>
                </div>
              );
            })}
            {pending.length > 5 && (
              <div className="px-6 py-3 text-center">
                <Link to="/dashboard/coordinator/meal-counts" className="text-xs text-brand-600 hover:underline font-medium">
                  + {pending.length - 5} more pending
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────
export default function CoordinatorDashboard() {
  const location   = useLocation();
  const isOverview = location.pathname === '/dashboard/coordinator';
  const { unreadCount } = useNotifications();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar navItems={NAV_ITEMS} badgeCounts={{ '/dashboard/coordinator/notifications': unreadCount }} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-8 sm:p-8 max-w-6xl mx-auto">
          {isOverview ? (
            <Overview />
          ) : (
            <Routes>
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="sites"        element={<CoordinatorSitesPage />} />
              <Route path="kitchens"     element={<CoordinatorKitchensPage />} />
              <Route path="meal-counts"  element={<CoordinatorMealCountsPage />} />
              <Route path="documents"    element={<DocumentsPage />} />
              <Route path="messages"     element={<MessagesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings"     element={<SettingsPage />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
}
