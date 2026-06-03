// NotificationsPage.jsx — full-page notification center
// Linked from the sidebar bell icon; shows all notifications with mark-read controls

import { Bell, CheckCheck, Info, AlertTriangle, FileText, MessageSquare, Truck, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

// Map notification type → icon + color
const TYPE_META = {
  document_uploaded:   { icon: FileText,       color: 'text-blue-500',   bg: 'bg-blue-50' },
  document_expiring:   { icon: AlertTriangle,   color: 'text-yellow-500', bg: 'bg-yellow-50' },
  document_expired:    { icon: AlertTriangle,   color: 'text-red-500',    bg: 'bg-red-50' },
  document_rejected:   { icon: AlertTriangle,   color: 'text-red-500',    bg: 'bg-red-50' },
  application_status:  { icon: CheckCircle,     color: 'text-green-500',  bg: 'bg-green-50' },
  meal_anomaly:        { icon: AlertTriangle,   color: 'text-orange-500', bg: 'bg-orange-50' },
  new_message:         { icon: MessageSquare,   color: 'text-brand-500',  bg: 'bg-brand-50' },
  delivery_issue:      { icon: Truck,           color: 'text-red-500',    bg: 'bg-red-50' },
  default:             { icon: Info,            color: 'text-gray-400',   bg: 'bg-gray-50' },
};

function NotifIcon({ type }) {
  const meta = TYPE_META[type] ?? TYPE_META.default;
  const Icon = meta.icon;
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
      <Icon className={`w-4 h-4 ${meta.color}`} />
    </div>
  );
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications();

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1 text-sm">
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

      {/* List */}
      {notifications.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Activity across your program will show up here.
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {notifications.map((n) => {
            const isUnread = !n.read_at;
            return (
              <div
                key={n.id}
                className={`px-6 py-4 flex items-start gap-4 transition-colors ${
                  isUnread ? 'bg-brand-50/40 hover:bg-brand-50' : 'hover:bg-gray-50'
                }`}
              >
                <NotifIcon type={n.type} />

                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${isUnread ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>

                {isUnread && (
                  <button
                    onClick={() => markRead(n.id)}
                    title="Mark as read"
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-brand-500 mt-1.5
                               hover:bg-brand-700 transition-colors cursor-pointer"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
