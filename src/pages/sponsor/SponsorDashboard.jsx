// SponsorDashboard.jsx — Top-level overview for sponsor/admin users
// Shows a program-wide summary: all sites, kitchens, pending approvals, and compliance alerts

import { useState, useEffect } from 'react';
import { Outlet, useLocation, Routes, Route, useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import ApplicationsPage    from './ApplicationsPage';
import DocumentsPage       from '../documents/DocumentsPage';
import MessagesPage        from '../messages/MessagesPage';
import NotificationsPage   from '../notifications/NotificationsPage';
import { Users, ClipboardList, AlertTriangle, CheckCircle, Building2, Copy, Check, Settings, UtensilsCrossed, FileText, Truck, MessageSquare, DollarSign } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import SettingsPage    from '../settings/SettingsPage';
import MealCountsPage  from './MealCountsPage';
import SitesPage       from './SitesPage';
import KitchensPage      from './KitchensPage';
import CoordinatorsPage  from './CoordinatorsPage';
import ReportsPage        from './ReportsPage';
import ClaimsPage         from './ClaimsPage';
import MealOrdersPage     from './MealOrdersPage';
import ActionCenter       from '../../components/common/ActionCenter';
import CompliancePage     from './CompliancePage';
import api from '../../services/api';

const NAV_ITEMS = [
  { label: 'Overview',       path: '/dashboard/sponsor',              icon: CheckCircle },
  { label: 'Applications',   path: '/dashboard/sponsor/applications', icon: ClipboardList },
  { label: 'Claims',         path: '/dashboard/sponsor/claims',       icon: DollarSign },
  { label: 'Compliance',     path: '/dashboard/sponsor/compliance',   icon: AlertTriangle },
  { label: 'Sites',          path: '/dashboard/sponsor/sites',        icon: Building2 },
  { label: 'Kitchens',       path: '/dashboard/sponsor/kitchens',     icon: Building2 },
  { label: 'Deliveries',     path: '/dashboard/sponsor/meal-orders',  icon: Truck },
  { label: 'Coordinators',   path: '/dashboard/sponsor/coordinators', icon: Users },
  { label: 'Meal Counts',    path: '/dashboard/sponsor/meal-counts',  icon: UtensilsCrossed },
  { label: 'Documents',      path: '/dashboard/sponsor/documents',    icon: FileText },
  { label: 'Reports',        path: '/dashboard/sponsor/reports',      icon: ClipboardList },
  { label: 'Messages',       path: '/dashboard/sponsor/messages',     icon: MessageSquare },
  { label: 'Settings',       path: '/dashboard/sponsor/settings',     icon: Settings },
];

// Converts a date into a human-readable label — sponsors can instantly see how recent an application is
function relativeDate(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

export default function SponsorDashboard() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const isOverview = location.pathname === '/dashboard/sponsor';
  const { stats, loading }  = useDashboardStats();

  // Fetch the 5 most recent applications from the real database
  const [recentApps, setRecentApps]   = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);

  // Sponsor ID — fetched from the user's own org so it's always accurate
  const [sponsorId, setSponsorId]   = useState('');
  const [copied, setCopied]         = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(sponsorId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!isOverview) return;
    api.get('/applications?limit=5')
      .then(({ data }) => setRecentApps(data.applications ?? []))
      .catch(() => {})
      .finally(() => setAppsLoading(false));
    // Fetch the sponsor's own org to get their ID
    api.get('/auth/me')
      .then(({ data }) => setSponsorId(data.organizationId ?? ''))
      .catch(() => {});
  }, [isOverview]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar navItems={NAV_ITEMS} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-8 sm:p-8 max-w-6xl mx-auto">

          {isOverview ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Program Overview</h1>
                <p className="text-gray-500 mt-1">Monitor all sites, kitchens, and compliance status across your program.</p>
              </div>

              {/* Action Center */}
              <ActionCenter
                loading={loading}
                tasks={[
                  {
                    id: 'approvals',
                    label: `Review ${stats.pending_approvals ?? 0} pending application${stats.pending_approvals !== 1 ? 's' : ''}`,
                    path: '/dashboard/sponsor/applications',
                    urgent: (stats.pending_approvals ?? 0) > 0,
                    done: !(stats.pending_approvals > 0),
                  },
                  {
                    id: 'compliance',
                    label: `${stats.compliance_alerts ?? 0} document${stats.compliance_alerts !== 1 ? 's' : ''} expiring within 30 days`,
                    path: '/dashboard/sponsor/documents',
                    urgent: true,
                    done: !(stats.compliance_alerts > 0),
                  },
                  {
                    id: 'messages',
                    label: `Respond to unread messages (${stats.unread_messages ?? 0})`,
                    path: '/dashboard/sponsor/messages',
                    done: !(stats.unread_messages > 0),
                  },
                ]}
              />

              {/* Stat cards — driven by real counts from the /stats API */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Sites"       value={stats.total_sites       ?? '—'} icon={Building2}    color="blue" />
                <StatCard label="Active Kitchens"   value={stats.active_kitchens   ?? '—'} icon={Building2}    color="green" />
                <StatCard label="Pending Approvals" value={stats.pending_approvals ?? '—'} icon={ClipboardList} color="yellow" />
                <StatCard label="Compliance Alerts" value={stats.compliance_alerts ?? '—'} icon={AlertTriangle} color="red" />
              </div>

              {/* Sponsor ID card — sponsors share this with kitchens/sites/delivery so they can register */}
              <div className="card mb-6 border-brand-100">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your Sponsor ID</p>
                    <p className="text-sm text-gray-400 mb-2">Share this with kitchens, sites, and delivery providers so they can join your program when registering.</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg">
                        {sponsorId || '—'}
                      </code>
                      <button
                        onClick={copyId}
                        disabled={!sponsorId}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-40"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent applications — real data from the database, not placeholders */}
              <div className="card mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Recent Applications</h2>
                  <button
                    onClick={() => navigate('/dashboard/sponsor/applications')}
                    className="text-sm text-brand-600 hover:underline"
                  >
                    View all
                  </button>
                </div>

                {appsLoading ? (
                  <div className="px-6 py-8 text-center text-sm text-gray-400">Loading…</div>
                ) : recentApps.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No applications yet.</p>
                    <p className="text-xs text-gray-400 mt-1">New applications from kitchens, sites, and delivery providers will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentApps.map((app) => (
                      <div key={app.id} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{app.org_name ?? '—'}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">
                            {app.org_type ?? '—'} · {relativeDate(app.submitted_at ?? app.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={app.status} />
                          <button
                            onClick={() => navigate('/dashboard/sponsor/applications')}
                            className="text-xs text-brand-600 hover:underline font-medium"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compliance alerts — shows a warning if documents are expiring soon */}
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Compliance Alerts</h2>
                </div>
                {stats.compliance_alerts > 0 ? (
                  <div className="px-6 py-4">
                    <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                      {stats.compliance_alerts} document{stats.compliance_alerts !== 1 ? 's are' : ' is'} expiring within 30 days. Review the Documents section.
                    </p>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No compliance alerts right now.</p>
                    <p className="text-xs text-gray-400 mt-1">Expired or missing documents will appear here.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Routes>
              <Route path="applications"   element={<ApplicationsPage reviewerRole="sponsor" />} />
              <Route path="applications/*" element={<ApplicationsPage reviewerRole="sponsor" />} />
              <Route path="compliance"     element={<CompliancePage />} />
              <Route path="sites"           element={<SitesPage />} />
              <Route path="kitchens"         element={<KitchensPage />} />
              <Route path="meal-orders"      element={<MealOrdersPage />} />
              <Route path="coordinators"     element={<CoordinatorsPage />} />
              <Route path="claims"           element={<ClaimsPage />} />
              <Route path="reports"          element={<ReportsPage />} />
              <Route path="meal-counts"    element={<MealCountsPage />} />
              <Route path="documents"      element={<DocumentsPage />} />
              <Route path="messages"       element={<MessagesPage />} />
              <Route path="notifications"  element={<NotificationsPage />} />
              <Route path="settings"       element={<SettingsPage />} />
              <Route path="*"              element={<Outlet />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
}
