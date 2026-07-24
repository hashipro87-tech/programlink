// SponsorDashboard.jsx — Top-level overview for sponsor/admin users
// Shows a program-wide summary: all sites, kitchens, pending approvals, and compliance alerts

import { useState, useEffect } from 'react';
import { Outlet, useLocation, Routes, Route, useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import ApplicationsPage    from './ApplicationsPage';
import DocumentsPage       from '../documents/DocumentsPage';
import MessagesPage        from '../messages/MessagesPage';
import NotificationsPage   from '../notifications/NotificationsPage';
import { Users, ClipboardList, AlertTriangle, CheckCircle, Building2, Copy, Check, Settings, UtensilsCrossed, FileText, Truck, MessageSquare, DollarSign, Bell, Repeat, XCircle, Info, Baby, CheckSquare, ShieldCheck, Activity, BookOpen, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
import DeliveryPlansPage  from './DeliveryPlansPage';
import ActionCenter       from '../../components/common/ActionCenter';
import CompliancePage     from './CompliancePage';
import OnboardingPage     from './OnboardingPage';
import ChildRosterPage    from './ChildRosterPage';
import TasksPage          from '../tasks/TasksPage';
import InspectionsPage    from '../inspections/InspectionsPage';
import ActivityFeedPage  from '../activity/ActivityFeedPage';
import MenuBuilderPage             from '../menus/MenuBuilderPage';
import SponsorProductionRecordsPage from './SponsorProductionRecordsPage';
import RenewalWizardPage            from './RenewalWizardPage';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../services/api';

const NAV_ITEMS = [
  { label: 'Overview',       path: '/dashboard/sponsor',              icon: CheckCircle },

  { sectionLabel: 'Program' },
  { label: 'Applications',   path: '/dashboard/sponsor/applications', icon: ClipboardList },
  { label: 'Children',       path: '/dashboard/sponsor/children',     icon: Baby },
  { label: 'Sites',          path: '/dashboard/sponsor/sites',        icon: Building2 },
  { label: 'Kitchens',       path: '/dashboard/sponsor/kitchens',     icon: Building2 },
  { label: 'Coordinators',   path: '/dashboard/sponsor/coordinators', icon: Users },

  { sectionLabel: 'Operations' },
  { label: 'Meal Counts',         path: '/dashboard/sponsor/meal-counts',          icon: UtensilsCrossed },
  { label: 'Production Records',  path: '/dashboard/sponsor/production-records',   icon: ClipboardList },
  { label: 'Deliveries',          path: '/dashboard/sponsor/meal-orders',           icon: Truck },
  { label: 'Delivery Plans',      path: '/dashboard/sponsor/delivery-plans',       icon: Repeat },
  { label: 'Menus',               path: '/dashboard/sponsor/menus',                icon: BookOpen },

  { sectionLabel: 'Finance' },
  { label: 'Claims',         path: '/dashboard/sponsor/claims',       icon: DollarSign },
  { label: 'Reports',        path: '/dashboard/sponsor/reports',      icon: ClipboardList },

  { sectionLabel: 'Compliance' },
  { label: 'Compliance',     path: '/dashboard/sponsor/compliance',   icon: AlertTriangle },
  { label: 'Inspections',    path: '/dashboard/sponsor/inspections',  icon: ShieldCheck },
  { label: 'Documents',      path: '/dashboard/sponsor/documents',    icon: FileText },
  { label: 'Renewals',       path: '/dashboard/sponsor/renewals',     icon: RotateCcw },

  { sectionLabel: 'Tracking' },
  { label: 'Tasks',          path: '/dashboard/sponsor/tasks',        icon: CheckSquare },
  { label: 'Activity',       path: '/dashboard/sponsor/activity',     icon: Activity },

  { divider: true },
  { label: 'Messages',       path: '/dashboard/sponsor/messages',     icon: MessageSquare },
  { label: 'Notifications',  path: '/dashboard/sponsor/notifications', icon: Bell },
  { label: 'Settings',       path: '/dashboard/sponsor/settings',     icon: Settings },
];

// ─── Proactive Warnings Card ──────────────────────────────────────────────────
function ProactiveWarningsCard({ navigate }) {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cacfp_dismissed_warnings') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    api.get('/warnings')
      .then(({ data }) => setWarnings(data.warnings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dismiss = (idx) => {
    const key = warnings[idx].type + (warnings[idx].org_id ?? '');
    const next = [...dismissed, key];
    setDismissed(next);
    localStorage.setItem('cacfp_dismissed_warnings', JSON.stringify(next));
  };

  const visible = warnings.filter((w) => !dismissed.includes(w.type + (w.org_id ?? '')));

  if (loading) return null;
  if (visible.length === 0) return null;

  const SEVERITY = {
    high:   { bg: 'bg-red-50',    border: 'border-red-200',    icon: 'text-red-500',    dot: 'bg-red-500'    },
    medium: { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'text-amber-500',  dot: 'bg-amber-400'  },
    low:    { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-500',   dot: 'bg-blue-400'   },
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-bold text-gray-900">Program Alerts</h2>
        <span className="ml-auto text-xs text-gray-400">{visible.length} issue{visible.length !== 1 ? 's' : ''} need attention</span>
      </div>
      <div className="space-y-2">
        {visible.map((w, i) => {
          const s = SEVERITY[w.severity] ?? SEVERITY.low;
          return (
            <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${s.bg} ${s.border}`}>
              <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{w.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{w.detail}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {w.link && (
                  <button
                    onClick={() => navigate(w.link)}
                    className="text-xs font-semibold text-brand-600 hover:underline whitespace-nowrap"
                  >
                    Fix →
                  </button>
                )}
                <button onClick={() => dismiss(i)} className="text-gray-300 hover:text-gray-400">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Claim Intelligence Widget ────────────────────────────────────────────────
// The hero feature: shows estimated reimbursement, money at risk, and a
// prioritized list of issues with direct fix links. Updates on every load.
function ClaimIntelligenceWidget({ navigate }) {
  const [intel,   setIntel]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [noState, setNoState] = useState(false);

  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    api.get(`/claims/intelligence?month=${month}`)
      .then(({ data }) => setIntel(data))
      .catch((err) => {
        if (err.response?.status === 400) setNoState(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (noState) {
    return (
      <div className="card mb-6 border-amber-100 bg-amber-50">
        <div className="px-5 py-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Set your state to enable Claim Intelligence</p>
            <p className="text-xs text-amber-600 mt-0.5">Go to Settings → Organization → CACFP Program State</p>
          </div>
          <button onClick={() => navigate('/dashboard/sponsor/settings')} className="text-xs font-bold text-amber-700 hover:underline whitespace-nowrap">
            Set State →
          </button>
        </div>
      </div>
    );
  }

  if (!intel) return null;

  const {
    monthName, estimatedReimbursement, reimbursementAtRisk,
    issueCount, deadline, issues = [], sitesReady, totalSites
  } = intel;

  const allClear   = issueCount === 0;
  const topIssues  = issues.slice(0, 5);
  const moreCount  = issues.length - topIssues.length;

  return (
    <div className="mb-6 rounded-2xl overflow-hidden shadow-sm border border-brand-200">
      {/* Purple gradient header */}
      <div
        className="px-5 py-4 bg-gradient-to-r from-brand-600 to-brand-700 cursor-pointer"
        onClick={() => navigate('/dashboard/sponsor/claims')}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-brand-200 uppercase tracking-wide">Claim Intelligence</p>
            <p className="text-base font-bold text-white mt-0.5">{monthName}</p>
          </div>
          {deadline && (
            <div className={`text-right ${deadline.urgent ? 'text-red-300' : 'text-brand-200'}`}>
              <p className="text-xs font-bold">⏰ {deadline.daysLeft} day{deadline.daysLeft !== 1 ? 's' : ''} left</p>
              <p className="text-xs opacity-80">Due {deadline.label}</p>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-brand-200 mb-0.5">Estimated Reimbursement</p>
            <p className="text-2xl font-bold text-white">${(estimatedReimbursement || 0).toLocaleString()}</p>
          </div>
          {reimbursementAtRisk > 0 ? (
            <div className="text-right">
              <p className="text-xs font-bold text-red-300">Reimbursement at Risk</p>
              <p className="text-2xl font-bold text-red-300">${(reimbursementAtRisk || 0).toLocaleString()}</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-xs font-bold text-green-300">✓ $0 at risk</p>
              <p className="text-xs text-brand-200">{sitesReady}/{totalSites} sites ready</p>
            </div>
          )}
        </div>
      </div>

      {/* Issues / all-clear panel */}
      <div className="bg-white px-5 py-4">
        {allClear ? (
          <div className="flex items-center gap-3 py-1">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-bold text-green-700">
                All {totalSites} site{totalSites !== 1 ? 's' : ''} ready to submit
              </p>
              <p className="text-xs text-gray-400">No issues found — your claim is fully prepared.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Fix {issueCount} issue{issueCount !== 1 ? 's' : ''} before {deadline?.label || 'month end'} to recover ${ (reimbursementAtRisk || 0).toLocaleString()}:
            </p>
            <div className="space-y-2.5">
              {topIssues.map((issue, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      issue.severity === 'error' ? 'bg-red-500' : 'bg-amber-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">
                      <span className="font-semibold">{issue.siteName}</span>
                      {' — '}
                      <span className="text-gray-500">{issue.code.replace(/_/g, ' ').toLowerCase()}</span>
                    </p>
                  </div>
                  {issue.potentialLoss > 0 && (
                    <span className="text-xs font-bold text-red-500 flex-shrink-0 tabular-nums">
                      ${issue.potentialLoss.toLocaleString()}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(issue.fixPath); }}
                    className="text-xs font-bold text-brand-600 hover:underline whitespace-nowrap flex-shrink-0"
                  >
                    {issue.fixLabel} →
                  </button>
                </div>
              ))}
              {moreCount > 0 && (
                <p className="text-xs text-gray-400 pl-4.5">
                  +{moreCount} more issue{moreCount !== 1 ? 's' : ''} — see full Claims Center
                </p>
              )}
            </div>
          </>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => navigate('/dashboard/sponsor/claims')}
            className="text-xs font-bold text-brand-600 hover:underline"
          >
            View Full Claims Center →
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  // Onboarding — show once per user, tracked in localStorage
  const onboardingKey = user?.id ? `cacfplink_onboarding_${user.id}` : null;
  const [onboardingDone, setOnboardingDone] = useState(
    () => !onboardingKey || Boolean(localStorage.getItem(onboardingKey))
  );

  const dismissOnboarding = (path) => {
    if (onboardingKey) localStorage.setItem(onboardingKey, 'done');
    setOnboardingDone(true);
    if (path) navigate(path);
  };

  const showOnboarding = isOverview && !onboardingDone;

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
      <Sidebar navItems={NAV_ITEMS} badgeCounts={{ '/dashboard/sponsor/notifications': unreadCount }} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-8 sm:p-8 max-w-6xl mx-auto">

          {showOnboarding ? (
            <OnboardingPage onDismiss={dismissOnboarding} />
          ) : isOverview ? (
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

              {/* Claim Intelligence — always-on financial guardian for this month's claim */}
              <ClaimIntelligenceWidget navigate={navigate} />

              {/* Proactive warnings — surface issues before they become claim problems */}
              <ProactiveWarningsCard navigate={navigate} />

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

              {/* Quick links — fast access to the most-used sections */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Compliance',     path: '/dashboard/sponsor/compliance',    icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50'  },
                  { label: 'Meal Counts',    path: '/dashboard/sponsor/meal-counts',   icon: UtensilsCrossed, color: 'text-brand-600', bg: 'bg-brand-50'  },
                  { label: 'Documents',      path: '/dashboard/sponsor/documents',     icon: FileText,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
                  { label: 'Reports',        path: '/dashboard/sponsor/reports',       icon: ClipboardList, color: 'text-green-600',  bg: 'bg-green-50'  },
                ].map(({ label, path, icon: Icon, color, bg }) => (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    className="card px-4 py-4 flex flex-col items-start gap-2 hover:shadow-md transition-shadow text-left"
                  >
                    <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Routes>
              <Route path="applications"  element={<ApplicationsPage reviewerRole="sponsor" />} />
              <Route path="applications/*" element={<ApplicationsPage reviewerRole="sponsor" />} />
              <Route path="children"       element={<ChildRosterPage />} />
              <Route path="tasks"          element={<TasksPage />} />
              <Route path="inspections"   element={<InspectionsPage />} />
              <Route path="menus"               element={<MenuBuilderPage />} />
              <Route path="production-records" element={<SponsorProductionRecordsPage />} />
              <Route path="renewals"          element={<RenewalWizardPage />} />
              <Route path="activity"     element={<ActivityFeedPage />} />
              <Route path="compliance"     element={<CompliancePage />} />
              <Route path="sites"           element={<SitesPage />} />
              <Route path="kitchens"         element={<KitchensPage />} />
              <Route path="meal-orders"        element={<MealOrdersPage />} />
              <Route path="delivery-plans"   element={<DeliveryPlansPage />} />
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
