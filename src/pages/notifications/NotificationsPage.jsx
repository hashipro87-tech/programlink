// NotificationsPage.jsx — full-page notification center
// Grouped by time period, filterable by category, with contextual action buttons

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Info, AlertTriangle, FileText, MessageSquare,
         Truck, CheckCircle, UtensilsCrossed, Users, DollarSign } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';

// ─── Type → icon, color, filter category ──────────────────────────────────────
const TYPE_META = {
  document_uploaded:   { icon: FileText,        color: 'text-blue-500',   bg: 'bg-blue-50',    category: 'compliance'   },
  document_expiring:   { icon: AlertTriangle,   color: 'text-yellow-600', bg: 'bg-yellow-50',  category: 'compliance'   },
  document_expired:    { icon: AlertTriangle,   color: 'text-red-500',    bg: 'bg-red-50',     category: 'compliance'   },
  document_rejected:   { icon: AlertTriangle,   color: 'text-red-500',    bg: 'bg-red-50',     category: 'compliance'   },
  document_missing:    { icon: FileText,        color: 'text-orange-500', bg: 'bg-orange-50',  category: 'compliance'   },
  application_status:  { icon: CheckCircle,     color: 'text-green-500',  bg: 'bg-green-50',   category: 'applications' },
  pending_approval:    { icon: CheckCircle,     color: 'text-brand-500',  bg: 'bg-brand-50',   category: 'applications' },
  status_change:       { icon: CheckCircle,     color: 'text-green-500',  bg: 'bg-green-50',   category: 'applications' },
  meal_anomaly:        { icon: UtensilsCrossed, color: 'text-orange-500', bg: 'bg-orange-50',  category: 'compliance'   },
  new_message:         { icon: MessageSquare,   color: 'text-brand-500',  bg: 'bg-brand-50',   category: 'messages'     },
  delivery_issue:      { icon: Truck,           color: 'text-red-500',    bg: 'bg-red-50',     category: 'deliveries'   },
  connection_request:  { icon: Users,           color: 'text-brand-500',  bg: 'bg-brand-50',   category: 'applications' },
  claim_submitted:     { icon: DollarSign,      color: 'text-green-500',  bg: 'bg-green-50',   category: 'claims'       },
  claim_issue:         { icon: DollarSign,      color: 'text-red-500',    bg: 'bg-red-50',     category: 'claims'       },
  general:             { icon: Info,            color: 'text-gray-400',   bg: 'bg-gray-50',    category: null           },
  default:             { icon: Info,            color: 'text-gray-400',   bg: 'bg-gray-50',    category: null           },
};

// Types that always count as "action required"
const ACTION_REQUIRED_TYPES = new Set([
  'document_expiring', 'document_expired', 'document_rejected', 'document_missing',
  'meal_anomaly', 'pending_approval', 'delivery_issue', 'connection_request',
]);

const FILTERS = [
  { id: 'all',          label: 'All' },
  { id: 'action',       label: 'Action Required' },
  { id: 'applications', label: 'Applications' },
  { id: 'compliance',   label: 'Compliance' },
  { id: 'claims',       label: 'Claims' },
  { id: 'deliveries',   label: 'Deliveries' },
  { id: 'messages',     label: 'Messages' },
];

const ROLE_BASE = {
  sponsor:     '/dashboard/sponsor',
  coordinator: '/dashboard/coordinator',
  site:        '/dashboard/site',
  kitchen:     '/dashboard/kitchen',
};

// ─── Contextual action buttons per notification type ───────────────────────────
function getActions(type, basePath, actionUrl) {
  // If the notification has a stored action URL, prefer it (role-correct destination)
  if (actionUrl) {
    const LABEL_MAP = {
      pending_approval:   'Review →',
      application_status: 'View →',
      status_change:      'View →',
      connection_request: 'Review →',
    };
    return [{ label: LABEL_MAP[type] ?? 'View →', path: actionUrl }];
  }
  switch (type) {
    case 'document_expiring':
    case 'document_expired':
    case 'document_uploaded':
    case 'document_missing':
      return [{ label: 'View Documents', path: `${basePath}/documents` }];
    case 'document_rejected':
      return [
        { label: 'Review', path: `${basePath}/documents` },
        { label: 'Request New', path: `${basePath}/compliance` },
      ];
    case 'application_status':
    case 'pending_approval':
    case 'status_change':
    case 'connection_request':
      return [{ label: 'Review', path: `${basePath}/applications` }];
    case 'meal_anomaly':
      return [{ label: 'View Meal Counts', path: `${basePath}/meal-counts` }];
    case 'new_message':
      return [{ label: 'View Message', path: `${basePath}/messages` }];
    case 'delivery_issue':
      return [{ label: 'View Deliveries', path: `${basePath}/delivery-plans` }];
    case 'claim_submitted':
    case 'claim_issue':
      return [{ label: 'View Claims', path: `${basePath}/claims` }];
    default:
      return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getGroup(iso) {
  const now = new Date();
  const d = new Date(iso);
  const todayStr = now.toDateString();
  const yestStr  = new Date(now - 86400000).toDateString();
  if (d.toDateString() === todayStr) return 'Today';
  if (d.toDateString() === yestStr)  return 'Yesterday';
  return 'Earlier';
}

function NotifIcon({ type }) {
  const meta = TYPE_META[type] ?? TYPE_META.default;
  const Icon = meta.icon;
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
      <Icon className={`w-4 h-4 ${meta.color}`} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const basePath = ROLE_BASE[user?.role] ?? '/dashboard/sponsor';

  // Filter
  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all')    return true;
    if (activeFilter === 'action') return ACTION_REQUIRED_TYPES.has(n.type);
    const meta = TYPE_META[n.type] ?? TYPE_META.default;
    return meta.category === activeFilter;
  });

  // Group by Today / Yesterday / Earlier
  const groups = filtered.reduce((acc, n) => {
    const g = getGroup(n.created_at);
    if (!acc[g]) acc[g] = [];
    acc[g].push(n);
    return acc;
  }, {});
  const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier'];

  // Badge counts for filter tabs
  const actionCount = notifications.filter((n) => !n.read_at && ACTION_REQUIRED_TYPES.has(n.type)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card px-6 py-10 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600
                       border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {f.id === 'action' && actionCount > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
                }`}>
                  {actionCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">No notifications</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeFilter === 'all'
              ? 'Activity across your program will show up here.'
              : 'Nothing in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {GROUP_ORDER.filter((g) => groups[g]?.length).map((group) => (
            <div key={group}>
              {/* Group label */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {group}
              </p>

              <div className="card divide-y divide-gray-100">
                {groups[group].map((n) => {
                  const isUnread = !n.read_at;
                  const actions  = getActions(n.type, basePath, n.action_url);
                  return (
                    <div
                      key={n.id}
                      onClick={() => { if (isUnread) markRead(n.id); }}
                      className={`px-5 py-4 flex items-start gap-4 transition-colors cursor-pointer ${
                        isUnread ? 'bg-brand-50/40 hover:bg-brand-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <NotifIcon type={n.type} />

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                          {actions.map((a) => (
                            <button
                              key={a.label}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isUnread) markRead(n.id);
                                navigate(a.path);
                              }}
                              className="text-xs font-semibold text-brand-600 hover:underline"
                            >
                              {a.label}
                            </button>
                          ))}
                          {isUnread && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>

                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
