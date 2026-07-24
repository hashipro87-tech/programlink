// SiteRenewalPage.jsx — Site: view and complete their annual renewal checklist
import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, RotateCcw, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ITEM_ICONS = {
  document:        '📄',
  income_certs:    '💰',
  roster_review:   '👶',
  profile_confirm: '📍',
  agreement:       '✍️',
};

// Quick-confirm types (no upload needed — just click to confirm)
const SELF_CONFIRM = new Set(['income_certs', 'roster_review', 'profile_confirm', 'agreement']);

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function daysLeft(due) {
  const diff = Math.ceil((new Date(due) - new Date()) / 86400000);
  return diff;
}

function RenewalCard({ renewal, onItemUpdate }) {
  const [updating, setUpdating] = useState(null);
  const complete = renewal.items.filter(i => i.status === 'complete').length;
  const total    = renewal.items.length;
  const days     = daysLeft(renewal.due_date);
  const pct      = Math.round((complete / total) * 100);

  const handleConfirm = async (item) => {
    setUpdating(item.id);
    try {
      await api.put(`/renewals/items/${item.id}`, { status: 'complete' });
      onItemUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className={`px-5 py-4 border-b ${days < 14 ? 'bg-red-50 border-red-100' : days < 30 ? 'bg-amber-50 border-amber-100' : 'bg-brand-50 border-brand-100'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-0.5">Annual Renewal</p>
            <h2 className="font-bold text-gray-900">{renewal.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">Due {fmtDate(renewal.due_date)}</span>
              <span className={`text-xs font-bold ${days < 14 ? 'text-red-600' : days < 30 ? 'text-amber-600' : 'text-brand-600'}`}>
                {days > 0 ? `${days} days left` : days === 0 ? 'Due today!' : `${Math.abs(days)} days overdue`}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-2xl font-black ${pct === 100 ? 'text-green-600' : 'text-gray-900'}`}>{pct}%</p>
            <p className="text-xs text-gray-400">{complete}/{total} done</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* All-clear */}
      {pct === 100 && (
        <div className="px-5 py-4 bg-green-50 border-b border-green-100 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-700">All items complete!</p>
            <p className="text-xs text-green-600">Your sponsor will review and confirm the renewal.</p>
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="divide-y divide-gray-50">
        {renewal.items.map(item => (
          <div key={item.id} className="px-5 py-3.5 flex items-center gap-3">
            {item.status === 'complete'
              ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              : item.status === 'waived'
                ? <span className="w-4 h-4 text-gray-300 text-sm flex-shrink-0 font-bold">—</span>
                : <Clock className="w-4 h-4 text-gray-300 flex-shrink-0" />
            }

            <span className="text-lg flex-shrink-0">{ITEM_ICONS[item.item_type] ?? '📋'}</span>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.status === 'complete' ? 'text-gray-400 line-through' : item.status === 'waived' ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                {item.item_label}
              </p>
              {item.status === 'complete' && item.completed_at && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Completed {new Date(item.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>

            {/* Action */}
            {item.status === 'pending' && (
              SELF_CONFIRM.has(item.item_type) ? (
                <button
                  disabled={updating === item.id}
                  onClick={() => handleConfirm(item)}
                  className="text-xs font-semibold px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  {updating === item.id ? '…' : 'Confirm ✓'}
                </button>
              ) : (
                // Document — link to documents page
                <Link
                  to="/dashboard/site/documents"
                  className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                >
                  Upload →
                </Link>
              )
            )}
            {item.status === 'waived' && (
              <span className="text-xs text-gray-400 italic flex-shrink-0">Waived by sponsor</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SiteRenewalPage() {
  const [renewals, setRenewals] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = () => {
    api.get('/renewals/site')
      .then(r => setRenewals(r.data?.renewals ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Annual Renewal</h1>
        <p className="text-sm text-gray-500 mt-1">Complete your annual CACFP program renewal checklist.</p>
      </div>

      {renewals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No active renewals</p>
          <p className="text-xs mt-1">Your sponsor will create a renewal when it's time. You'll see your checklist here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renewals.map(r => (
            <RenewalCard key={r.renewal_id} renewal={r} onItemUpdate={load} />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          Complete all items before the due date. For documents, upload them from the <Link to="/dashboard/site/documents" className="text-brand-600 hover:underline font-semibold">Documents</Link> page — your sponsor will mark those items complete. For confirmations, click the <strong>Confirm</strong> button to submit.
        </p>
      </div>
    </div>
  );
}
