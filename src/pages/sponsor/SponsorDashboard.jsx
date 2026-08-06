// SponsorDashboard.jsx — Top-level overview for sponsor/admin users
// Shows a program-wide summary: all sites, kitchens, pending approvals, and compliance alerts

import { useState, useEffect } from 'react';
import { Outlet, useLocation, Routes, Route, useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import ApplicationsPage    from './ApplicationsPage';
import DocumentsPage       from '../documents/DocumentsPage';
import MessagesPage        from '../messages/MessagesPage';
import NotificationsPage   from '../notifications/NotificationsPage';
import { Users, ClipboardList, AlertTriangle, CheckCircle, Building2, Copy, Check, Settings, UtensilsCrossed, FileText, Truck, MessageSquare, DollarSign, Bell, Repeat, XCircle, Info, Baby, CheckSquare, ShieldCheck, Activity, BookOpen, RotateCcw, GraduationCap, Printer } from 'lucide-react';
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
import MenuCyclesPage              from '../menus/MenuCyclesPage';
import SponsorProductionRecordsPage from './SponsorProductionRecordsPage';
import RenewalWizardPage            from './RenewalWizardPage';
import TrainingPage                 from './TrainingPage';
import FormGeneratorPage            from '../forms/FormGeneratorPage';
import StateRuleBookPage           from './StateRuleBookPage';
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
  { label: 'Delivery Schedule',   path: '/dashboard/sponsor/meal-orders',           icon: Truck },
  { label: 'Menus',               path: '/dashboard/sponsor/menus',                icon: BookOpen },
  { label: 'Menu Cycles',         path: '/dashboard/sponsor/menu-cycles',          icon: Repeat },

  { sectionLabel: 'Finance' },
  { label: 'Claims',         path: '/dashboard/sponsor/claims',       icon: DollarSign },
  { label: 'Reports',        path: '/dashboard/sponsor/reports',      icon: ClipboardList },

  { sectionLabel: 'Compliance' },
  { label: 'State Rule Book', path: '/dashboard/sponsor/state-rules',  icon: ShieldCheck },
  { label: 'Compliance',     path: '/dashboard/sponsor/compliance',   icon: AlertTriangle },
  { label: 'Inspections',    path: '/dashboard/sponsor/inspections',  icon: ShieldCheck },
  { label: 'Documents',      path: '/dashboard/sponsor/documents',    icon: FileText },
  { label: 'Renewals',       path: '/dashboard/sponsor/renewals',     icon: RotateCcw },
  { label: 'Staff Training', path: '/dashboard/sponsor/training',     icon: GraduationCap },
  { label: 'Form Generator', path: '/dashboard/sponsor/forms',        icon: Printer },

  { sectionLabel: 'Tracking' },
  { label: 'Tasks',          path: '/dashboard/sponsor/tasks',        icon: CheckSquare },
  { label: 'Activity',       path: '/dashboard/sponsor/activity',     icon: Activity },

  { divider: true },
  { label: 'Messages',       path: '/dashboard/sponsor/messages',     icon: MessageSquare },
  { label: 'Notifications',  path: '/dashboard/sponsor/notifications', icon: Bell },
  { label: 'Settings',       path: '/dashboard/sponsor/settings',     icon: Settings },
];

// ─── useMissionData — parallel-fetches all overview data ─────────────────────
function useMissionData() {
  const [data, setData]       = useState({});
  const [loading, setLoading] = useState(true);
  const [noState, setNoState] = useState(false);
  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    Promise.all([
      api.get(`/claims/intelligence?month=${month}`).catch((e) => {
        if (e.response?.status === 400) setNoState(true);
        return null;
      }),
      api.get('/activity?limit=5').catch(() => null),
      api.get('/children/summary').catch(() => null),
      api.get('/warnings').catch(() => null),
      api.get('/children/compliance').catch(() => null),
    ]).then(([intel, activity, children, warnings, compliance]) => {
      setData({
        intel:      intel?.data      ?? null,
        activity:   activity?.data?.activity ?? [],
        children:   children?.data?.orgs    ?? [],
        warnings:   warnings?.data?.warnings ?? [],
        compliance: compliance?.data ?? null,
      });
    }).finally(() => setLoading(false));
  }, []);

  return { data, loading, noState, month };
}

// ─── MissionCard ──────────────────────────────────────────────────────────────
function MissionCard({ stats, data, navigate }) {
  const { intel, children, compliance } = data;
  const issues   = intel?.issues ?? [];
  const monthName = intel?.monthName
    ?? new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const totalChildren   = children.reduce((s, o) => s + Number(o.total || 0), 0);
  const hasCode = (fragment) => issues.some((i) => i.code?.includes(fragment));

  // Enrollment: how many children don't have an approved form
  const formsApproved   = Number(compliance?.forms_approved ?? 0);
  const enrollmentMissing = totalChildren > 0 ? totalChildren - formsApproved : 0;

  const steps = [
    { label: 'Add sites to your program',   done: (stats.total_sites    ?? 0) > 0,  path: '/dashboard/sponsor/sites' },
    { label: 'Connect a kitchen',           done: (stats.total_kitchens ?? 0) > 0,  path: '/dashboard/sponsor/kitchens' },
    { label: 'Add children to roster',      done: totalChildren > 0,                path: '/dashboard/sponsor/children' },
    {
      label:   enrollmentMissing > 0 ? `${enrollmentMissing} children missing income forms` : 'Income eligibility complete',
      done:    enrollmentMissing === 0 && totalChildren > 0,
      warning: enrollmentMissing > 0 && totalChildren > 0,
      path:    '/dashboard/sponsor/children',
    },
    { label: `Build ${monthName} menu`,     done: !hasCode('menu'),                 path: '/dashboard/sponsor/menus' },
    { label: 'Record meal counts',          done: !hasCode('no_meal_counts'),       path: '/dashboard/sponsor/meal-counts' },
    { label: 'Submit claim',               done: intel?.claimStatus === 'submitted', path: '/dashboard/sponsor/claims' },
  ];

  const completed  = steps.filter((s) => s.done).length;
  const pct        = Math.round((completed / steps.length) * 100);
  const barColor   = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';

  return (
    <div className="card mb-5 overflow-hidden">
      {/* Header row */}
      <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Mission This Month</p>
          <h2 className="text-lg font-bold text-gray-900">{monthName} Claim Readiness</h2>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-3xl font-black" style={{ color: barColor }}>{pct}%</p>
          <p className="text-xs text-gray-400">{completed}/{steps.length} complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
        {intel?.deadline && (
          <p className={`text-xs mt-1.5 font-semibold ${intel.deadline.urgent ? 'text-red-500' : 'text-gray-400'}`}>
            {intel.deadline.urgent ? '⚠ ' : ''}⏰ {intel.deadline.daysLeft} day{intel.deadline.daysLeft !== 1 ? 's' : ''} until submission deadline
          </p>
        )}
      </div>

      {/* Checklist grid */}
      <div className="border-t border-gray-100 px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => navigate(step.path)}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
              step.done
                ? 'bg-green-500 border-green-500'
                : step.warning
                  ? 'bg-amber-400 border-amber-400'
                  : 'border-gray-300 group-hover:border-brand-400'
            }`}>
              {step.done    && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              {step.warning && <span className="text-white text-[10px] font-black leading-none">!</span>}
            </div>
            <span className={`text-sm font-medium ${
              step.done
                ? 'text-gray-400 line-through'
                : step.warning
                  ? 'text-amber-700 font-semibold'
                  : 'text-gray-700 group-hover:text-brand-600'
            }`}>
              {step.label}
            </span>
            {!step.done && (
              <span className="ml-auto text-xs text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Fix →
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── BlockingIssues ───────────────────────────────────────────────────────────
function BlockingIssues({ data, navigate }) {
  const { intel, warnings } = data;
  const issues   = intel?.issues ?? [];
  const atRisk   = intel?.reimbursementAtRisk ?? 0;

  // Merge intelligence issues + proactive warnings, deduplicated
  const blockingItems = [
    ...issues.slice(0, 5).map((issue) => ({
      key: issue.code + issue.siteId,
      label: issue.siteName
        ? `${issue.siteName} — ${issue.code.replace(/_/g, ' ')}`
        : issue.code.replace(/_/g, ' '),
      amount: issue.potentialLoss > 0 ? issue.potentialLoss : null,
      path:   issue.fixPath,
      cta:    issue.fixLabel || 'Fix',
      severity: issue.severity === 'error' ? 'high' : 'medium',
    })),
    ...warnings.slice(0, 3).map((w) => ({
      key: w.type + (w.org_id ?? ''),
      label: w.title,
      amount: null,
      path:  w.link,
      cta:   'View',
      severity: w.severity ?? 'medium',
    })),
  ].filter((item, i, arr) => arr.findIndex((x) => x.key === item.key) === i).slice(0, 6);

  if (blockingItems.length === 0) {
    return (
      <div className="card mb-5 px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-green-700">Nothing is blocking your reimbursement</p>
          <p className="text-xs text-gray-400 mt-0.5">No issues found this month. Your claim is on track.</p>
        </div>
        <button onClick={() => navigate('/dashboard/sponsor/claims')} className="ml-auto text-xs font-bold text-brand-600 hover:underline whitespace-nowrap flex-shrink-0">
          View Claim →
        </button>
      </div>
    );
  }

  return (
    <div className="card mb-5 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-bold text-gray-900">What's Blocking Your Reimbursement</h2>
        </div>
        {atRisk > 0 && (
          <span className="text-sm font-bold text-red-500">${atRisk.toLocaleString()} at risk</span>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {blockingItems.map((item) => (
          <div key={item.key} className="px-6 py-3.5 flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.severity === 'high' ? 'bg-red-500' : 'bg-amber-400'}`} />
            <p className="flex-1 text-sm text-gray-700 min-w-0 truncate capitalize">{item.label}</p>
            {item.amount > 0 && (
              <span className="text-sm font-bold text-red-500 flex-shrink-0 tabular-nums">
                ${item.amount.toLocaleString()}
              </span>
            )}
            {item.path && (
              <button
                onClick={() => navigate(item.path)}
                className="text-xs font-bold text-brand-600 hover:underline whitespace-nowrap flex-shrink-0"
              >
                {item.cta} →
              </button>
            )}
          </div>
        ))}
      </div>
      {issues.length > 5 && (
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={() => navigate('/dashboard/sponsor/claims')} className="text-xs font-bold text-brand-600 hover:underline">
            See all {issues.length} issues in Claims Center →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TeamStatusCard ───────────────────────────────────────────────────────────
function TeamStatusCard({ stats, data, navigate }) {
  const { intel } = data;
  const issues       = intel?.issues ?? [];
  const totalSites   = intel?.totalSites   ?? stats.total_sites   ?? 0;
  const sitesReady   = intel?.sitesReady   ?? 0;
  const sitesWaiting = totalSites - sitesReady;
  const kitchens     = stats.total_kitchens ?? stats.active_kitchens ?? 0;
  const pendingApps  = stats.pending_approvals ?? 0;

  const rows = [
    {
      label:  'Sites',
      value:  totalSites > 0 ? `${sitesReady}/${totalSites} submitting` : 'No sites added',
      ok:     totalSites > 0 && sitesWaiting === 0,
      warn:   totalSites > 0 && sitesWaiting > 0,
      detail: sitesWaiting > 0 ? `${sitesWaiting} site${sitesWaiting !== 1 ? 's' : ''} haven't submitted counts` : 'All sites reporting',
      path:   '/dashboard/sponsor/sites',
    },
    {
      label:  'Kitchens',
      value:  kitchens > 0 ? `${kitchens} active` : 'No kitchens connected',
      ok:     kitchens > 0,
      warn:   false,
      detail: kitchens > 0 ? 'Kitchen connected' : 'Add a kitchen to start',
      path:   '/dashboard/sponsor/kitchens',
    },
    {
      label:  'Applications',
      value:  pendingApps > 0 ? `${pendingApps} pending` : 'None pending',
      ok:     pendingApps === 0,
      warn:   pendingApps > 0,
      detail: pendingApps > 0 ? `${pendingApps} application${pendingApps !== 1 ? 's' : ''} need review` : 'All reviewed',
      path:   '/dashboard/sponsor/applications',
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Team Status</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map((row) => (
          <button
            key={row.label}
            onClick={() => navigate(row.path)}
            className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 text-left"
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.ok ? 'bg-green-400' : row.warn ? 'bg-amber-400' : 'bg-gray-300'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500">{row.label}</p>
              <p className={`text-sm font-semibold ${row.warn ? 'text-amber-700' : 'text-gray-800'}`}>{row.value}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ClaimSnapshotCard ────────────────────────────────────────────────────────
function ClaimSnapshotCard({ data, navigate, noState }) {
  const { intel } = data;

  if (noState) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Claim Snapshot</h3>
        </div>
        <div className="px-5 py-6 text-center">
          <p className="text-sm font-semibold text-amber-700 mb-1">State not set</p>
          <p className="text-xs text-gray-400 mb-3">Set your CACFP state to see reimbursement estimates.</p>
          <button onClick={() => navigate('/dashboard/sponsor/settings')} className="text-xs font-bold text-brand-600 hover:underline">
            Set State in Settings →
          </button>
        </div>
      </div>
    );
  }

  if (!intel) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Claim Snapshot</h3>
        </div>
        <div className="px-5 py-6 text-center text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  const { estimatedReimbursement = 0, reimbursementAtRisk = 0, issueCount = 0, deadline, sitesReady = 0, totalSites = 0 } = intel;
  const pct = totalSites > 0 ? Math.round((sitesReady / totalSites) * 100) : 0;

  return (
    <div className="card overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/sponsor/claims')}>
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Claim Snapshot</h3>
        <span className="text-xs text-brand-500 font-semibold">View full →</span>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Estimated Reimbursement</p>
          <p className="text-2xl font-black text-gray-900">${estimatedReimbursement.toLocaleString()}</p>
        </div>
        {reimbursementAtRisk > 0 && (
          <div>
            <p className="text-xs text-red-400 mb-0.5">At Risk</p>
            <p className="text-lg font-bold text-red-500">${reimbursementAtRisk.toLocaleString()}</p>
          </div>
        )}
        {deadline && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Days Until Deadline</p>
            <p className={`text-lg font-bold ${deadline.urgent ? 'text-red-500' : 'text-gray-700'}`}>
              {deadline.daysLeft} day{deadline.daysLeft !== 1 ? 's' : ''}
            </p>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400">Sites Ready</p>
            <p className="text-xs font-bold text-gray-600">{sitesReady}/{totalSites}</p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RecentActivityFeed ───────────────────────────────────────────────────────
function RecentActivityFeed({ data, navigate }) {
  const { activity } = data;

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 2)   return 'just now';
    if (diff < 60)  return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 2880) return 'Yesterday';
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const TYPE_ICON = {
    meal_counts_submitted: '🍽',
    task_created:          '✅',
    task_completed:        '✅',
    inspection_logged:     '🔍',
    finding_resolved:      '🔍',
    application_submitted: '📋',
    application_approved:  '📋',
    application_rejected:  '📋',
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Activity</h3>
        <button onClick={() => navigate('/dashboard/sponsor/activity')} className="text-xs font-bold text-brand-500 hover:underline">
          All →
        </button>
      </div>
      {!activity || activity.length === 0 ? (
        <div className="px-5 py-6 text-center text-xs text-gray-400">No activity yet this month.</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {activity.slice(0, 5).map((item, i) => (
            <div key={i} className="px-5 py-3 flex items-start gap-3">
              <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICON[item.type] ?? '📌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                {item.org_name && (
                  <p className="text-xs text-gray-400 truncate">{item.org_name}</p>
                )}
              </div>
              <span className="text-xs text-gray-300 flex-shrink-0 whitespace-nowrap">{timeAgo(item.created_at)}</span>
            </div>
          ))}
        </div>
      )}
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

// ─── No-State Banner ──────────────────────────────────────────────────────────
function NoStateBanner({ navigate }) {
  return (
    <div className="card mb-5 border-amber-100 bg-amber-50 px-6 py-4 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-800">Set your CACFP state to unlock Claim Intelligence</p>
        <p className="text-xs text-amber-600 mt-0.5">Settings → Organization → CACFP Program State</p>
      </div>
      <button onClick={() => navigate('/dashboard/sponsor/settings')} className="text-xs font-bold text-amber-700 hover:underline whitespace-nowrap">
        Set State →
      </button>
    </div>
  );
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
    if (path === null) {
      if (onboardingKey) localStorage.setItem(onboardingKey, 'done');
      setOnboardingDone(true);
    } else {
      navigate(path);
    }
  };

  const showOnboarding = isOverview && !onboardingDone;

  // Mission data — loaded only on overview to keep non-overview routes fast
  const { data: missionData, loading: missionLoading, noState } = useMissionData();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar navItems={NAV_ITEMS} badgeCounts={{ '/dashboard/sponsor/notifications': unreadCount }} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-8 sm:p-8 max-w-5xl mx-auto">

          {showOnboarding ? (
            <OnboardingPage
              onDismiss={dismissOnboarding}
              siteCount={stats.total_sites ?? 0}
              kitchenCount={stats.total_kitchens ?? 0}
            />
          ) : isOverview ? (
            <>
              {/* Page header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.name ? `Hi, ${user.name.split(' ')[0]} 👋` : 'Dashboard'}
                </h1>
                <p className="text-gray-400 text-sm mt-1">Here's where your program stands right now.</p>
              </div>

              {/* No-state banner — only shown when state is missing */}
              {noState && <NoStateBanner navigate={navigate} />}

              {/* Mission card — claim readiness + 7-step checklist */}
              {!missionLoading && !noState && (
                <MissionCard stats={stats} data={missionData} navigate={navigate} />
              )}

              {/* Blocking issues — what's standing between sponsor and their money */}
              {!missionLoading && !noState && (
                <BlockingIssues data={missionData} navigate={navigate} />
              )}

              {/* Bottom 3-column row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TeamStatusCard stats={stats} data={missionData} navigate={navigate} />
                <ClaimSnapshotCard data={missionData} navigate={navigate} noState={noState} />
                <RecentActivityFeed data={missionData} navigate={navigate} />
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
              <Route path="menu-cycles"        element={<MenuCyclesPage />} />
              <Route path="production-records" element={<SponsorProductionRecordsPage />} />
              <Route path="state-rules"       element={<StateRuleBookPage />} />
              <Route path="renewals"          element={<RenewalWizardPage />} />
              <Route path="training"         element={<TrainingPage role="sponsor" />} />
              <Route path="forms"           element={<FormGeneratorPage />} />
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
