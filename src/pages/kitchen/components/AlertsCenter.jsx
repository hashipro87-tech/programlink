// AlertsCenter.jsx — Color-coded alert strip for the kitchen dashboard.
// Red = urgent (expiring docs, multi-day missed meals)
// Yellow = warning (missed yesterday, late pickup)
// Blue = informational (new message, status change)
// Each alert is dismissible and has an optional action button.

import { useState, useEffect } from 'react';
import { AlertTriangle, FileText, Clock, MessageSquare, X, CheckCircle } from 'lucide-react';
import api from '../../../services/api';

const ICON_MAP = {
  doc:      FileText,
  meal:     Clock,
  message:  MessageSquare,
  delivery: AlertTriangle,
  general:  CheckCircle,
};

const COLOR_MAP = {
  red:    { wrap: 'bg-red-50 border-red-200',       icon: 'text-red-500',    badge: 'bg-red-100 text-red-700 hover:bg-red-200' },
  yellow: { wrap: 'bg-yellow-50 border-yellow-200', icon: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  blue:   { wrap: 'bg-blue-50 border-blue-200',     icon: 'text-blue-500',   badge: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
};

// Builds alerts from stats returned by the /stats API
// You can extend this with more conditions as the app grows
function buildAlertsFromStats(stats) {
  const alerts = [];

  // Check document expiry (if backend returns expiry info in stats)
  if (stats.doc_expiring_soon) {
    alerts.push({
      id:         'doc-expiry',
      type:       'red',
      iconKey:    'doc',
      message:    `A required document expires soon — upload a new version to stay compliant.`,
      action:     'Upload Now',
      actionPath: 'documents',
    });
  }

  // Application still not submitted
  if (stats.application_status === 'not_started' || !stats.application_status) {
    alerts.push({
      id:         'app-not-started',
      type:       'yellow',
      iconKey:    'general',
      message:    'Your application hasn\'t been started yet.',
      action:     'Start Now',
      actionPath: 'application',
    });
  }

  // Fewer than 3 docs uploaded
  if ((stats.docs_uploaded ?? 0) < 3) {
    alerts.push({
      id:         'missing-docs',
      type:       'yellow',
      iconKey:    'doc',
      message:    `${3 - (stats.docs_uploaded ?? 0)} required document(s) still need to be uploaded.`,
      action:     'Upload',
      actionPath: 'documents',
    });
  }

  return alerts;
}

export default function AlertsCenter({ stats = {}, onNavigate }) {
  // Start with alerts derived from stats, allow dismissal
  const [alerts, setAlerts] = useState(() => buildAlertsFromStats(stats));

  // Re-derive if stats change (e.g. after an upload)
  useEffect(() => {
    setAlerts(buildAlertsFromStats(stats));
  }, [stats]);

  const dismiss = (id) => setAlerts((a) => a.filter((x) => x.id !== id));

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Alerts</p>
      <div className="space-y-2">
        {alerts.map((alert) => {
          const c    = COLOR_MAP[alert.type] ?? COLOR_MAP.yellow;
          const Icon = ICON_MAP[alert.iconKey] ?? AlertTriangle;

          return (
            <div
              key={alert.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${c.wrap}`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${c.icon}`} />
              <p className="flex-1 text-sm font-medium text-gray-700">{alert.message}</p>

              {alert.action && (
                <button
                  onClick={() => onNavigate?.(alert.actionPath)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-colors ${c.badge}`}
                >
                  {alert.action}
                </button>
              )}

              <button
                onClick={() => dismiss(alert.id)}
                className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
