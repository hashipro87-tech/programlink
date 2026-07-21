// ActivityFeedPage — org-wide activity feed
// Shows everything that's happened across the program in one timeline
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, ClipboardList, CheckCircle2, XCircle, FileText,
  UtensilsCrossed, CheckSquare, ShieldCheck, Baby, Users,
  DollarSign, Truck, RefreshCw, ChevronDown,
} from 'lucide-react';
import api from '../../services/api';

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_META = {
  application_submitted:        { label: 'Application',     icon: ClipboardList,  color: 'text-blue-500',   bg: 'bg-blue-50'   },
  application_approved:         { label: 'Application',     icon: CheckCircle2,   color: 'text-green-500',  bg: 'bg-green-50'  },
  application_rejected:         { label: 'Application',     icon: XCircle,        color: 'text-red-500',    bg: 'bg-red-50'    },
  application_changes_requested:{ label: 'Application',     icon: ClipboardList,  color: 'text-amber-500',  bg: 'bg-amber-50'  },
  document_uploaded:            { label: 'Document',        icon: FileText,       color: 'text-purple-500', bg: 'bg-purple-50' },
  document_expired:             { label: 'Document',        icon: FileText,       color: 'text-red-400',    bg: 'bg-red-50'    },
  document_requested:           { label: 'Document',        icon: FileText,       color: 'text-orange-500', bg: 'bg-orange-50' },
  meal_counts_submitted:        { label: 'Meal Counts',     icon: UtensilsCrossed,color: 'text-green-500',  bg: 'bg-green-50'  },
  meal_counts_verified:         { label: 'Meal Counts',     icon: UtensilsCrossed,color: 'text-brand-500',  bg: 'bg-brand-50'  },
  task_created:                 { label: 'Task',            icon: CheckSquare,    color: 'text-blue-400',   bg: 'bg-blue-50'   },
  task_completed:               { label: 'Task',            icon: CheckCircle2,   color: 'text-green-500',  bg: 'bg-green-50'  },
  inspection_logged:            { label: 'Inspection',      icon: ShieldCheck,    color: 'text-purple-500', bg: 'bg-purple-50' },
  finding_added:                { label: 'Inspection',      icon: ShieldCheck,    color: 'text-orange-500', bg: 'bg-orange-50' },
  finding_resolved:             { label: 'Inspection',      icon: ShieldCheck,    color: 'text-green-500',  bg: 'bg-green-50'  },
  child_added:                  { label: 'Children',        icon: Baby,           color: 'text-pink-500',   bg: 'bg-pink-50'   },
  member_joined:                { label: 'Team',            icon: Users,          color: 'text-blue-400',   bg: 'bg-blue-50'   },
  claim_generated:              { label: 'Claims',          icon: DollarSign,     color: 'text-brand-500',  bg: 'bg-brand-50'  },
  delivery_completed:           { label: 'Delivery',        icon: Truck,          color: 'text-gray-500',   bg: 'bg-gray-100'  },
};

const TYPE_FILTER_OPTIONS = [
  { value: '',                         label: 'All activity'  },
  { value: 'meal_counts_submitted',    label: 'Meal counts'   },
  { value: 'application_approved',     label: 'Applications'  },
  { value: 'document_uploaded',        label: 'Documents'     },
  { value: 'task_created',             label: 'Tasks'         },
  { value: 'inspection_logged',        label: 'Inspections'   },
];

const PAGE_SIZE = 30;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByDate(items) {
  const groups = {};
  items.forEach(item => {
    const d = new Date(item.created_at);
    const today    = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    const itemDay  = new Date(d); itemDay.setHours(0,0,0,0);

    let label;
    if (itemDay.getTime() === today.getTime())     label = 'Today';
    else if (itemDay.getTime() === yesterday.getTime()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });
  return groups;
}

export default function ActivityFeedPage() {
  const [items, setItems]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter]     = useState('');
  const [offset, setOffset]     = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (reset = true) => {
    const isReset = reset;
    if (isReset) { setLoading(true); setOffset(0); }
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ limit: PAGE_SIZE, offset: isReset ? 0 : offset });
      if (filter) params.set('type', filter);

      const res = await api.get(`/activity?${params}`);
      const newItems = res.data.activity || [];
      setTotal(res.data.total || 0);

      if (isReset) {
        setItems(newItems);
        setOffset(PAGE_SIZE);
      } else {
        setItems(prev => [...prev, ...newItems]);
        setOffset(o => o + PAGE_SIZE);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [filter, offset]);

  // Reset when filter changes
  useEffect(() => { load(true); }, [filter]); // eslint-disable-line

  async function refresh() {
    setRefreshing(true);
    await load(true);
  }

  const hasMore = items.length < total;
  const groups  = groupByDate(items);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
          <p className="text-sm text-gray-500 mt-0.5">Everything happening across your program</p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TYPE_FILTER_OPTIONS.map(opt => (
          <button key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === opt.value
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No activity yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Activity will appear here as your team submits meal counts, uploads documents, and more.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([day, dayItems]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{day}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-2">
                {dayItems.map(item => <ActivityItem key={item.id} item={item} />)}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-2">
              <button onClick={() => load(false)} disabled={loadingMore}
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mx-auto">
                <ChevronDown className={`w-4 h-4 ${loadingMore ? 'animate-bounce' : ''}`} />
                {loadingMore ? 'Loading…' : `Load more (${total - items.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ item }) {
  const meta = TYPE_META[item.type] || {
    label: 'Activity', icon: Activity, color: 'text-gray-400', bg: 'bg-gray-100',
  };
  const Icon = meta.icon;

  return (
    <div className="card p-3.5 flex items-start gap-3 hover:shadow-sm transition-shadow">
      {/* Icon */}
      <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${meta.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-gray-800 font-medium leading-snug">{item.title}</p>
            {item.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              {item.actor_name && <span>{item.actor_name}</span>}
              {item.actor_name && item.org_name && <span>·</span>}
              {item.org_name && <span className="truncate">{item.org_name}</span>}
            </div>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
            {timeAgo(item.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
