// ActivityTimeline.jsx — Chronological activity feed for an org
// Pulls from /audit-log/my-activity and renders a vertical timeline.

import { useState, useEffect } from 'react';
import {
  FileText, ClipboardList, UtensilsCrossed, CheckCircle,
  XCircle, Upload, MessageSquare, Settings, Activity,
} from 'lucide-react';
import api from '../../services/api';

// Map audit action strings to an icon + color
function getEventStyle(action = '') {
  const a = action.toLowerCase();
  if (a.includes('submit') || a.includes('create'))  return { Icon: ClipboardList, color: 'bg-blue-100 text-blue-600' };
  if (a.includes('approv') || a.includes('verif'))   return { Icon: CheckCircle,   color: 'bg-green-100 text-green-600' };
  if (a.includes('reject') || a.includes('deny'))    return { Icon: XCircle,        color: 'bg-red-100 text-red-500' };
  if (a.includes('upload') || a.includes('document'))return { Icon: Upload,         color: 'bg-purple-100 text-purple-600' };
  if (a.includes('meal')   || a.includes('count'))   return { Icon: UtensilsCrossed,color: 'bg-orange-100 text-orange-500' };
  if (a.includes('message'))                         return { Icon: MessageSquare,  color: 'bg-teal-100 text-teal-600' };
  if (a.includes('setting') || a.includes('update')) return { Icon: Settings,       color: 'bg-gray-100 text-gray-500' };
  return { Icon: Activity, color: 'bg-gray-100 text-gray-400' };
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Group entries by date label
function groupByDate(entries) {
  const groups = [];
  let currentDate = null;
  for (const entry of entries) {
    const label = formatDate(entry.created_at);
    if (label !== currentDate) {
      groups.push({ date: label, entries: [] });
      currentDate = label;
    }
    groups[groups.length - 1].entries.push(entry);
  }
  return groups;
}

export default function ActivityTimeline({ limit = 15 }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/audit-log/my-activity?limit=${limit}`)
      .then(({ data }) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [limit]);

  const groups = groupByDate(entries);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-gray-400" />
        <h2 className="font-semibold text-gray-900 text-sm">Activity Timeline</h2>
      </div>

      {loading ? (
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Activity className="w-7 h-7 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="px-5 py-4">
          {groups.map((group, gi) => (
            <div key={gi} className="mb-4 last:mb-0">
              {/* Date header */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                {group.date}
              </p>

              {/* Entries */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-100" />

                <div className="space-y-3">
                  {group.entries.map((entry, i) => {
                    const { Icon, color } = getEventStyle(entry.action);
                    return (
                      <div key={entry.id ?? i} className="flex gap-3 relative">
                        {/* Icon dot */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-0.5 pb-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium leading-snug">
                            {entry.entity_name
                              ? <><span className="text-gray-500">{entry.action}</span> · {entry.entity_name}</>
                              : entry.action}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {entry.actor_name && (
                              <span className="text-xs text-gray-400">{entry.actor_name}</span>
                            )}
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{formatTime(entry.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
