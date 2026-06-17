// ActionCenter.jsx — "Tasks Requiring Attention" widget
// Pass a `tasks` array; each item: { id, label, path, urgent? }
// Tasks with no `path` are informational only.

import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, ArrowRight, Inbox } from 'lucide-react';

export default function ActionCenter({ tasks = [], loading = false }) {
  const navigate = useNavigate();
  const pending  = tasks.filter((t) => !t.done);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          pending.length > 0 ? 'bg-amber-400' : 'bg-green-400'
        }`} />
        <h2 className="font-semibold text-gray-900 text-sm">Tasks Requiring Attention</h2>
        {pending.length > 0 && (
          <span className="ml-auto text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="px-5 py-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm font-semibold text-gray-700">You're all caught up!</p>
          <p className="text-xs text-gray-400 mt-0.5">No tasks require attention right now.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {pending.map((task) => (
            <li key={task.id}>
              <button
                onClick={() => task.path && navigate(task.path)}
                disabled={!task.path}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                  task.path
                    ? 'hover:bg-gray-50 cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                {/* Icon */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  task.urgent
                    ? 'bg-red-50 text-red-500'
                    : 'bg-amber-50 text-amber-500'
                }`}>
                  {task.urgent
                    ? <AlertTriangle className="w-3.5 h-3.5" />
                    : <Inbox className="w-3.5 h-3.5" />
                  }
                </div>

                {/* Label */}
                <span className="flex-1 text-sm text-gray-700 font-medium leading-snug">
                  {task.label}
                </span>

                {/* Arrow */}
                {task.path && (
                  <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
