// CoordinatorDashboard.jsx — Daily Work Management Center
// Built around the coordinator's 6 morning questions:
//  1. Which centers need my attention today?
//  2. Who hasn't submitted meal counts?
//  3. Which documents are expiring?
//  4. Who has messaged me?
//  5. Which applications need me?
//  6. What can I fix before my sponsor notices?

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import {
  Building2, MessageSquare, FileText, CheckCircle, Settings,
  ClipboardList, AlertTriangle, UtensilsCrossed, Bell,
  AlertCircle, ChevronRight, Send, CheckSquare, X,
  TrendingUp, ShieldCheck, Activity, Users,
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

// Pages
import DocumentsPage             from '../documents/DocumentsPage';
import MessagesPage              from '../messages/MessagesPage';
import NotificationsPage         from '../notifications/NotificationsPage';
import SettingsPage              from '../settings/SettingsPage';
import CoordinatorSitesPage      from './CoordinatorSitesPage';
import CoordinatorMealCountsPage from './CoordinatorMealCountsPage';
import CoordinatorKitchensPage   from './CoordinatorKitchensPage';
import CoordinatorEnrollmentPage from './CoordinatorEnrollmentPage';
import ApplicationsPage          from '../sponsor/ApplicationsPage';
import TasksPage                 from '../tasks/TasksPage';
import InspectionsPage           from '../inspections/InspectionsPage';
import ActivityFeedPage          from '../activity/ActivityFeedPage';

const NAV_ITEMS = [
  { label: 'Overview',       path: '/dashboard/coordinator',               icon: CheckCircle     },

  { sectionLabel: 'Assignments' },
  { label: 'Applications',   path: '/dashboard/coordinator/applications',  icon: ClipboardList   },
  { label: 'My Sites',       path: '/dashboard/coordinator/sites',         icon: Building2       },
  { label: 'My Kitchens',    path: '/dashboard/coordinator/kitchens',      icon: UtensilsCrossed },

  { sectionLabel: 'Program Data' },
  { label: 'Enrollment Review', path: '/dashboard/coordinator/enrollment',    icon: Users           },
  { label: 'Meal Counts',    path: '/dashboard/coordinator/meal-counts',   icon: ClipboardList   },
  { label: 'Documents',      path: '/dashboard/coordinator/documents',     icon: FileText        },

  { sectionLabel: 'Work' },
  { label: 'Tasks',          path: '/dashboard/coordinator/tasks',         icon: CheckSquare     },
  { label: 'Inspections',    path: '/dashboard/coordinator/inspections',   icon: ShieldCheck     },
  { label: 'Activity',       path: '/dashboard/coordinator/activity',      icon: Activity        },

  { divider: true },
  { label: 'Messages',       path: '/dashboard/coordinator/messages',      icon: MessageSquare   },
  { label: 'Notifications',  path: '/dashboard/coordinator/notifications', icon: Bell            },
  { label: 'Settings',       path: '/dashboard/coordinator/settings',      icon: Settings        },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIER_META = {
  overdue:   { label: 'Overdue',       dot: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-700'    },
  missing:   { label: 'Missing Docs',  dot: 'bg-red-400',    bg: 'bg-red-50',    text: 'text-red-600'    },
  expiring:  { label: 'Expiring Soon', dot: 'bg-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  pending:   { label: 'Pending',       dot: 'bg-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  compliant: { label: 'Compliant',     dot: 'bg-green-400',  bg: 'bg-green-50',  text: 'text-green-700'  },
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Data hook ────────────────────────────────────────────────────────────────
function useCoordinatorData() {
  const [data, setData]       = useState({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    const month = new Date().toISOString().slice(0, 7);

    Promise.allSettled([
      api.get('/compliance'),
      api.get(`/meal-counts?month=${month}&limit=200`),
      api.get('/applications?status=pending&limit=20'),
      api.get('/message-threads?limit=10'),
      api.get('/notifications?limit=20'),
      api.get('/documents?limit=200'),
      api.get('/children?form_status=submitted&limit=100'),
    ]).then(([compRes, mcRes, appRes, threadRes, notifRes, docRes, enrollRes]) => {
      const orgs = compRes.status === 'fulfilled'
        ? (compRes.value.data?.organizations ?? compRes.value.data ?? [])
        : [];
      const allCounts = mcRes.status === 'fulfilled'
        ? (mcRes.value.data?.meal_counts ?? mcRes.value.data?.counts ?? [])
        : [];
      const pendingCounts  = allCounts.filter((c) => !c.verified_at);
      const pendingApps    = appRes.status === 'fulfilled'
        ? (appRes.value.data?.applications ?? appRes.value.data ?? [])
        : [];
      const threads = threadRes.status === 'fulfilled'
        ? (threadRes.value.data?.threads ?? threadRes.value.data ?? [])
        : [];
      const notifications = notifRes.status === 'fulfilled'
        ? (notifRes.value.data?.notifications ?? [])
        : [];
      const docs = docRes.status === 'fulfilled'
        ? (docRes.value.data?.documents ?? [])
        : [];
      const pendingEnrollments = enrollRes.status === 'fulfilled'
        ? (enrollRes.value.data?.children ?? enrollRes.value.data ?? [])
        : [];

      const expiringDocs   = docs.filter((d) => d.status === 'expiring_soon');
      const totalMeals     = allCounts.reduce(
        (s, c) => s + (c.breakfast ?? 0) + (c.lunch ?? 0) + (c.snack ?? 0) + (c.supper ?? 0), 0
      );
      const unreadMessages = notifications.filter(
        (n) => !n.read_at && n.type === 'new_message'
      ).length;

      setData({ orgs, pendingCounts, pendingApps, threads, notifications, docs, expiringDocs, totalMeals, unreadMessages, pendingEnrollments });
      setLoading(false);
    });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, reload };
}

// ─── 1. Work Today Hero ───────────────────────────────────────────────────────
function WorkTodayCard({ data, navigate }) {
  const { pendingCounts, expiringDocs, pendingApps, unreadMessages } = data;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const tiles = [
    {
      count:  pendingCounts?.length ?? 0,
      label:  'Missing Meal Counts',
      color:  'text-red-600',
      bg:     'bg-red-50',
      path:   '/dashboard/coordinator/meal-counts',
      urgent: (pendingCounts?.length ?? 0) > 0,
      emoji:  '🔴',
    },
    {
      count:  expiringDocs?.length ?? 0,
      label:  'Docs Expire This Week',
      color:  'text-yellow-600',
      bg:     'bg-yellow-50',
      path:   '/dashboard/coordinator/documents',
      urgent: (expiringDocs?.length ?? 0) > 0,
      emoji:  '🟡',
    },
    {
      count:  pendingApps?.length ?? 0,
      label:  'Applications Waiting',
      color:  'text-brand-600',
      bg:     'bg-brand-50',
      path:   '/dashboard/coordinator/applications',
      urgent: (pendingApps?.length ?? 0) > 0,
      emoji:  '🟢',
    },
    {
      count:  unreadMessages ?? 0,
      label:  'Unread Messages',
      color:  'text-blue-600',
      bg:     'bg-blue-50',
      path:   '/dashboard/coordinator/messages',
      urgent: (unreadMessages ?? 0) > 0,
      emoji:  '🔵',
    },
  ];

  const urgentCount = tiles.filter((t) => t.urgent && t.count > 0).length;

  return (
    <div className="card mb-6">
      <div className="px-6 py-5 border-b border-gray-100">
        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-0.5">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900">Good morning</h1>
        <p className="text-sm text-gray-500 mt-1">
          {urgentCount > 0
            ? `You have ${urgentCount} item${urgentCount > 1 ? 's' : ''} that need attention. Complete these to keep your region compliant.`
            : 'Everything looks good — your region is on track today.'}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
        {tiles.map((t) => (
          <button
            key={t.label}
            onClick={() => navigate(t.path)}
            className="px-5 py-5 text-left hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-start gap-2 mb-1">
              <span className="text-sm leading-none mt-0.5">{t.emoji}</span>
              <p className={`text-3xl font-bold leading-none ${t.count === 0 ? 'text-gray-200' : t.color}`}>
                {t.count}
              </p>
            </div>
            <p className="text-xs font-semibold text-gray-500 mt-2 leading-snug">{t.label}</p>
            {t.urgent && t.count > 0 && (
              <p className={`text-[10px] font-bold mt-1 ${t.color}`}>↗ Needs attention</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 2. My Assigned Sites ─────────────────────────────────────────────────────
function AssignedSitesList({ orgs, pendingCounts, navigate, onSelect }) {
  const sites = Array.isArray(orgs)
    ? orgs.filter((o) => (o.org_type ?? o.type) === 'site')
    : [];

  const pendingForSite = (id) =>
    pendingCounts.filter((c) => c.org_id === id || c.organization_id === id).length;

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">My Assigned Sites</h2>
        <button
          onClick={() => navigate('/dashboard/coordinator/sites')}
          className="text-xs text-brand-600 hover:underline font-semibold"
        >
          Full list →
        </button>
      </div>

      {sites.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No sites assigned yet</p>
          <p className="text-xs text-gray-400 mt-1">Your sponsor assigns sites through the coordinator panel.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {sites.slice(0, 10).map((org) => {
            const tier    = org.tier ?? 'pending';
            const meta    = TIER_META[tier] ?? TIER_META.pending;
            const orgId   = org.org_id ?? org.id;
            const unverified = pendingForSite(orgId);

            return (
              <button
                key={orgId}
                onClick={() => onSelect(org)}
                className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                  {org.org_name ?? org.name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {unverified > 0 && (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      {unverified} unverified
                    </span>
                  )}
                  <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 3. Needs Attention — Priority Inbox ──────────────────────────────────────
function NeedsAttentionList({ orgs, docs, pendingEnrollments = [], navigate }) {
  const items = [];

  // Purple: pending enrollment forms awaiting review
  if (pendingEnrollments.length > 0) {
    items.push({
      priority: 'purple',
      icon: '📋',
      title: `${pendingEnrollments.length} enrollment form${pendingEnrollments.length !== 1 ? 's' : ''} awaiting review`,
      org: pendingEnrollments.map((c) => `${c.first_name} ${c.last_name}`).slice(0, 2).join(', ')
        + (pendingEnrollments.length > 2 ? ` +${pendingEnrollments.length - 2} more` : ''),
      action: () => navigate('/dashboard/coordinator/enrollment'),
    });
  }

  // Red: missing / overdue orgs
  for (const org of (Array.isArray(orgs) ? orgs : [])) {
    if (org.tier !== 'missing' && org.tier !== 'overdue') continue;
    const missing = Array.isArray(org.missing_docs) ? org.missing_docs : [];
    items.push({
      priority: 'red',
      icon: '🔴',
      title: missing.length > 0
        ? `Missing: ${missing.slice(0, 2).join(', ')}${missing.length > 2 ? ` +${missing.length - 2} more` : ''}`
        : 'Missing required documents',
      org: org.org_name ?? org.name ?? '—',
      action: () => navigate('/dashboard/coordinator/documents'),
    });
  }

  // Yellow: expiring docs
  for (const doc of docs.filter((d) => d.status === 'expiring_soon').slice(0, 5)) {
    const daysLeft = doc.expires_at
      ? Math.ceil((new Date(doc.expires_at) - Date.now()) / 86400000)
      : null;
    items.push({
      priority: 'yellow',
      icon: '🟡',
      title: `${doc.label ?? doc.type ?? 'Document'} expires${daysLeft !== null ? ` in ${daysLeft}d` : ' soon'}`,
      org: doc.org_name ?? doc.organization_name ?? '—',
      action: () => navigate('/dashboard/coordinator/documents'),
    });
  }

  if (items.length === 0) {
    return (
      <div className="card mb-6 px-5 py-5 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
        <p className="text-sm font-semibold text-gray-600">No urgent issues — your region is in good shape.</p>
      </div>
    );
  }

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Needs Attention</h2>
        <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
          {items.length} issue{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.slice(0, 7).map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className="w-full px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
          >
            <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.org}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 4. Inline Applications ───────────────────────────────────────────────────
function InlineApplications({ apps, onAction, actionState }) {
  if (!apps.length) return null;

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Pending Applications</h2>
        <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
          {apps.length} waiting
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {apps.slice(0, 5).map((app) => {
          const state = actionState[app.id];
          const name  = app.org_name ?? app.organization_name ?? 'New Applicant';
          const type  = app.org_type ?? app.type ?? 'Site';

          return (
            <div key={app.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {type} · Submitted {timeAgo(app.created_at ?? app.submitted_at)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0">
                  Pending
                </span>
              </div>

              {state === 'approved' ? (
                <p className="text-xs font-bold text-green-600">✓ Approved</p>
              ) : state === 'rejected' ? (
                <p className="text-xs font-bold text-red-500">✗ Rejected</p>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => onAction(app.id, 'approved')}
                    disabled={state === 'loading'}
                    className="flex-1 py-2 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {state === 'loading' ? '…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => onAction(app.id, 'changes_requested')}
                    disabled={state === 'loading'}
                    className="flex-1 py-2 text-xs font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => onAction(app.id, 'rejected')}
                    disabled={state === 'loading'}
                    className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 5. Message Previews ──────────────────────────────────────────────────────
function MessagePreviews({ threads, navigate }) {
  const list = Array.isArray(threads) ? threads : [];
  if (!list.length) return null;

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Messages</h2>
        <button
          onClick={() => navigate('/dashboard/coordinator/messages')}
          className="text-xs text-brand-600 hover:underline font-semibold"
        >
          Open inbox →
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {list.slice(0, 4).map((t, i) => (
          <button
            key={t.id ?? i}
            onClick={() => navigate('/dashboard/coordinator/messages')}
            className="w-full px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {t.subject ?? t.title ?? 'Message'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {t.last_message ?? t.preview ?? ''}
              </p>
            </div>
            {(t.unread_count ?? 0) > 0 && (
              <span className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 6. Region Snapshot ──────────────────────────────────────────────────────
function RegionSnapshot({ orgs, totalMeals }) {
  const sites       = (Array.isArray(orgs) ? orgs : []).filter((o) => (o.org_type ?? o.type) === 'site');
  const compliant   = sites.filter((o) => o.tier === 'compliant').length;
  const pct         = sites.length > 0 ? Math.round((compliant / sites.length) * 100) : 0;
  const needsAttn   = sites.filter((o) => ['overdue','missing','expiring'].includes(o.tier)).length;

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-brand-500" />
        <h2 className="font-semibold text-gray-900">My Region</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {[
          { label: 'Total Sites',       value: String(sites.length),              color: 'text-gray-900'  },
          { label: 'Compliance Rate',   value: `${pct}%`,                         color: pct >= 90 ? 'text-green-600' : pct >= 70 ? 'text-yellow-600' : 'text-red-600' },
          { label: 'Need Attention',    value: String(needsAttn),                 color: needsAttn > 0 ? 'text-red-600' : 'text-gray-300' },
          { label: 'Meals This Month',  value: totalMeals > 0 ? totalMeals.toLocaleString() : '—', color: 'text-brand-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-5 py-3.5 flex items-center justify-between">
            <p className="text-sm text-gray-600">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 7. Quick Actions ────────────────────────────────────────────────────────
function QuickActions({ navigate }) {
  const actions = [
    { label: 'Message All Sites',    icon: Send,         path: '/dashboard/coordinator/messages'    },
    { label: 'Request Documents',    icon: FileText,     path: '/dashboard/coordinator/documents'   },
    { label: 'Review Applications',  icon: ClipboardList,path: '/dashboard/coordinator/applications'},
    { label: 'Verify Meal Counts',   icon: CheckSquare,  path: '/dashboard/coordinator/meal-counts' },
    { label: 'View All Sites',       icon: Building2,    path: '/dashboard/coordinator/sites'       },
  ];

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Quick Actions</h2>
      </div>
      <div className="px-4 py-3 space-y-1">
        {actions.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors group text-left"
          >
            <div className="w-7 h-7 bg-gray-100 group-hover:bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
              <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-brand-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-brand-700">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 8. Recent Activity ──────────────────────────────────────────────────────
function RecentActivity({ notifications }) {
  const list = (Array.isArray(notifications) ? notifications : []).slice(0, 8);
  if (!list.length) return null;

  const ICON_MAP = {
    new_message:        '💬',
    document_uploaded:  '📄',
    document_expiring:  '⚠️',
    document_expired:   '🔴',
    application_status: '📋',
    pending_approval:   '📋',
    meal_anomaly:       '🍽️',
    general:            '🔔',
  };

  return (
    <div className="card mb-6">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Recent Activity</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {list.map((n, i) => (
          <div key={n.id ?? i} className="px-5 py-3 flex items-start gap-3">
            <span className="text-base leading-none mt-0.5 flex-shrink-0">
              {ICON_MAP[n.type] ?? '🔔'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">{n.message ?? n.title ?? 'Activity'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 9. 360° Site Detail Drawer ───────────────────────────────────────────────
function SiteDetailDrawer({ site, pendingCounts, docs, apps, navigate, onClose }) {
  const orgId = site.org_id ?? site.id;

  const siteCounts  = pendingCounts.filter((c) => c.org_id === orgId || c.organization_id === orgId);
  const siteDocs    = docs.filter((d) => d.org_id === orgId || d.organization_id === orgId);
  const siteApps    = apps.filter((a) => a.org_id === orgId || a.organization_id === orgId);

  const validDocs   = siteDocs.filter((d) => d.status === 'valid').length;
  const expiringD   = siteDocs.filter((d) => d.status === 'expiring_soon');
  const missingList = Array.isArray(site.missing_docs) ? site.missing_docs : [];

  const tier = site.tier ?? 'pending';
  const { label: tierLabel, dot, bg, text } = TIER_META[tier] ?? TIER_META.pending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Site Overview</p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{site.org_name ?? site.name}</h2>
            <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-bold ${bg} ${text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {tierLabel}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors mt-0.5">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 space-y-6">

          {/* Compliance score */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Compliance</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${site.score ?? 0}%` }} />
              </div>
              <span className="text-sm font-bold text-gray-900 w-10 text-right">{site.score ?? 0}%</span>
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Documents</p>
            <div className="space-y-2">
              {validDocs > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{validDocs} document{validDocs !== 1 ? 's' : ''} valid</span>
                </div>
              )}
              {expiringD.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                  <span className="text-gray-700">{d.label ?? d.type} — expiring soon</span>
                </div>
              ))}
              {missingList.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="text-gray-700">{doc} — missing</span>
                </div>
              ))}
              {validDocs === 0 && expiringD.length === 0 && missingList.length === 0 && (
                <p className="text-sm text-gray-400">No document data on file</p>
              )}
            </div>
          </div>

          {/* Meal counts */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Meal Counts</p>
            {siteCounts.length > 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <span className="text-gray-700">{siteCounts.length} unverified this month</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">All counts verified</span>
              </div>
            )}
          </div>

          {/* Application */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Application</p>
            {siteApps.length > 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <ClipboardList className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                <span className="text-gray-700">{siteApps.length} pending review</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                {site.application_status
                  ? `Status: ${String(site.application_status).replace(/_/g, ' ')}`
                  : 'No active application'}
              </p>
            )}
          </div>

          {/* Quick links */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => { navigate('/dashboard/coordinator/messages'); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700">Send Message</span>
              <MessageSquare className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => { navigate('/dashboard/coordinator/documents'); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700">Request Document</span>
              <FileText className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => { navigate('/dashboard/coordinator/meal-counts'); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700">Verify Meal Counts</span>
              <ClipboardList className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Overview — all 9 sections ────────────────────────────────────────────────
function Overview() {
  const navigate = useNavigate();
  const { data, loading } = useCoordinatorData();
  const [selectedSite,  setSelectedSite]  = useState(null);
  const [appActionState, setAppActionState] = useState({});

  const handleAppAction = async (appId, status) => {
    setAppActionState((s) => ({ ...s, [appId]: 'loading' }));
    try {
      await api.patch(`/applications/${appId}`, { status });
      setAppActionState((s) => ({ ...s, [appId]: status }));
    } catch {
      setAppActionState((s) => ({ ...s, [appId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const {
    orgs = [], pendingCounts = [], pendingApps = [], threads = [],
    notifications = [], docs = [], expiringDocs = [], totalMeals = 0, unreadMessages = 0,
    pendingEnrollments = [],
  } = data;

  return (
    <>
      {/* 1. Work Today Hero */}
      <WorkTodayCard
        data={{ pendingCounts, expiringDocs, pendingApps, unreadMessages }}
        navigate={navigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main work */}
        <div className="lg:col-span-2">
          {/* 2. Assigned Sites */}
          <AssignedSitesList
            orgs={orgs}
            pendingCounts={pendingCounts}
            navigate={navigate}
            onSelect={setSelectedSite}
          />

          {/* 3. Needs Attention */}
          <NeedsAttentionList orgs={orgs} docs={docs} pendingEnrollments={pendingEnrollments} navigate={navigate} />

          {/* 4. Inline Applications */}
          <InlineApplications
            apps={pendingApps}
            onAction={handleAppAction}
            actionState={appActionState}
          />

          {/* 5. Message Previews */}
          <MessagePreviews threads={threads} navigate={navigate} />

          {/* 8. Recent Activity */}
          <RecentActivity notifications={notifications} />
        </div>

        {/* Right — context */}
        <div>
          {/* 6. Region Snapshot */}
          <RegionSnapshot orgs={orgs} totalMeals={totalMeals} />

          {/* 7. Quick Actions */}
          <QuickActions navigate={navigate} />
        </div>
      </div>

      {/* 9. 360° Site Detail Drawer */}
      {selectedSite && (
        <SiteDetailDrawer
          site={selectedSite}
          pendingCounts={pendingCounts}
          docs={docs}
          apps={pendingApps}
          navigate={navigate}
          onClose={() => setSelectedSite(null)}
        />
      )}
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
              <Route path="applications"  element={<ApplicationsPage />} />
              <Route path="enrollment"    element={<CoordinatorEnrollmentPage />} />
              <Route path="sites"         element={<CoordinatorSitesPage />} />
              <Route path="kitchens"      element={<CoordinatorKitchensPage />} />
              <Route path="meal-counts"   element={<CoordinatorMealCountsPage />} />
              <Route path="documents"     element={<DocumentsPage />} />
              <Route path="tasks"         element={<TasksPage />} />
              <Route path="inspections"  element={<InspectionsPage />} />
              <Route path="activity"    element={<ActivityFeedPage />} />
              <Route path="messages"      element={<MessagesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings"      element={<SettingsPage />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
}
