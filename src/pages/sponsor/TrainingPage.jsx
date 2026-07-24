// TrainingPage.jsx — Staff training & certification tracking
// Sponsors see all staff certs across all sites/kitchens.
// Sites/kitchens see only their own staff.
import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Plus, X, CheckCircle, AlertTriangle,
  Clock, Search, Pencil, Trash2,
} from 'lucide-react';
import api from '../../services/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const CERT_TYPES = [
  { value: 'food_handler',   label: 'Food Handler Certificate'           },
  { value: 'food_manager',   label: 'Food Safety Manager Certification'  },
  { value: 'cacfp_training', label: 'CACFP Program Training'             },
  { value: 'first_aid',      label: 'First Aid Certification'            },
  { value: 'cpr',            label: 'CPR Certification'                  },
  { value: 'other',          label: 'Other Training / Certification'     },
];

const STATUS_META = {
  valid:         { label: 'Valid',          icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  expiring_soon: { label: 'Expiring Soon',  icon: AlertTriangle,color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  expired:       { label: 'Expired',        icon: X,            color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200'   },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function daysUntil(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff;
}

// ── Add/Edit Modal ────────────────────────────────────────────────────────────
function TrainingModal({ orgs, editing, onClose, onSave }) {
  const isEdit = !!editing;
  const [form, setForm] = useState({
    org_id:      editing?.org_id      ?? '',
    staff_name:  editing?.staff_name  ?? '',
    cert_type:   editing?.cert_type   ?? 'food_handler',
    cert_label:  editing?.cert_label  ?? '',
    cert_date:   editing?.cert_date   ? editing.cert_date.split('T')[0] : '',
    expiry_date: editing?.expiry_date ? editing.expiry_date.split('T')[0] : '',
    notes:       editing?.notes       ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill cert_label when type changes (only if not manually edited)
  const handleTypeChange = (v) => {
    const found = CERT_TYPES.find(c => c.value === v);
    set('cert_type', v);
    if (!isEdit || form.cert_label === editing?.cert_label) {
      set('cert_label', found?.label ?? '');
    }
  };

  const handleSave = async () => {
    if (!form.staff_name.trim() || !form.expiry_date) {
      setError('Staff name and expiry date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(form, editing?.id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Certification' : 'Add Certification'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

          {/* Org picker — only shown for sponsor view with multiple orgs */}
          {orgs?.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Site or Kitchen</label>
              <select
                value={form.org_id} onChange={e => set('org_id', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                <option value="">Select…</option>
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Staff Member Name</label>
            <input
              type="text" value={form.staff_name} onChange={e => set('staff_name', e.target.value)}
              placeholder="e.g. Maria Gonzalez"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Certification Type</label>
            <select
              value={form.cert_type} onChange={e => handleTypeChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {CERT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {form.cert_type === 'other' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Certification Name</label>
              <input
                type="text" value={form.cert_label} onChange={e => set('cert_label', e.target.value)}
                placeholder="e.g. ServSafe Food Manager"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Issue Date <span className="text-gray-400">(optional)</span></label>
              <input
                type="date" value={form.cert_date} onChange={e => set('cert_date', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expiry Date <span className="text-red-400">*</span></label>
              <input
                type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Certificate number, issuing body, etc."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-semibold">Cancel</button>
          <button
            onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Certification'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrainingPage({ role = 'sponsor' }) {
  const [trainings, setTrainings] = useState([]);
  const [orgs,      setOrgs]      = useState([]);
  const [summary,   setSummary]   = useState({ total: 0, valid: 0, expiring_soon: 0, expired: 0 });
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');   // all | expired | expiring_soon | valid
  const [modal,     setModal]     = useState(null);    // null | 'add' | training-object
  const [deleting,  setDeleting]  = useState(null);

  const load = useCallback(async () => {
    try {
      const [tRes, sRes] = await Promise.allSettled([
        api.get('/staff-trainings'),
        api.get('/staff-trainings/summary'),
      ]);
      if (tRes.status === 'fulfilled') setTrainings(tRes.value.data?.trainings ?? []);
      if (sRes.status === 'fulfilled') setSummary(sRes.value.data ?? summary);

      // Load orgs for sponsor picker
      if (role === 'sponsor') {
        const oRes = await api.get('/organizations', { params: { limit: 500 } });
        setOrgs(oRes.data?.organizations ?? oRes.data ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form, id) => {
    if (id) {
      await api.put(`/staff-trainings/${id}`, form);
    } else {
      await api.post('/staff-trainings', form);
    }
    load();
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/staff-trainings/${id}`);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  // Filter + search
  const visible = trainings.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.staff_name.toLowerCase().includes(q)
          || t.cert_label.toLowerCase().includes(q)
          || (t.org_name ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {modal && (
        <TrainingModal
          orgs={role === 'sponsor' ? orgs : []}
          editing={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Training & Certifications</h1>
          <p className="text-sm text-gray-500 mt-1">Track food handler certs, CACFP training, and other staff certifications.</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Certification
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'all',          label: 'Total',         value: summary.total,         color: 'text-gray-900'  },
          { key: 'valid',        label: 'Valid',          value: summary.valid,         color: 'text-green-600' },
          { key: 'expiring_soon',label: 'Expiring Soon', value: summary.expiring_soon, color: 'text-amber-600' },
          { key: 'expired',      label: 'Expired',       value: summary.expired,       color: 'text-red-600'   },
        ].map(({ key, label, value, color }) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`bg-white border rounded-2xl px-4 py-3 text-left transition-all hover:shadow-sm ${filter === key ? 'border-brand-400 shadow-sm' : 'border-gray-200'}`}
          >
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text" placeholder="Search by staff name, certification, or org…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">{trainings.length === 0 ? 'No certifications yet' : 'No results'}</p>
          <p className="text-xs mt-1">
            {trainings.length === 0
              ? 'Add your first staff certification to start tracking expiry dates.'
              : 'Try a different search or filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(t => {
            const meta  = STATUS_META[t.status] ?? STATUS_META.valid;
            const days  = daysUntil(t.expiry_date);
            const Icon  = meta.icon;
            return (
              <div
                key={t.id}
                className={`bg-white border rounded-2xl px-5 py-4 flex items-center gap-4 ${t.status === 'expired' ? 'border-red-200' : t.status === 'expiring_soon' ? 'border-amber-200' : 'border-gray-200'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">{t.staff_name}</p>
                    {t.org_name && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{t.org_name}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{t.cert_label}</p>
                  {t.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.notes}</p>}
                </div>

                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-gray-400">
                    {t.cert_date ? `Issued ${fmtDate(t.cert_date)}` : 'No issue date'}
                  </p>
                  <p className={`text-sm font-semibold ${meta.color} mt-0.5`}>
                    {t.status === 'expired'
                      ? `Expired ${fmtDate(t.expiry_date)}`
                      : t.status === 'expiring_soon'
                        ? `Expires in ${days}d — ${fmtDate(t.expiry_date)}`
                        : `Valid until ${fmtDate(t.expiry_date)}`
                    }
                  </p>
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setModal(t)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          CACFPLink automatically sends email reminders at 30, 14, and 7 days before a certification expires. Staff names and cert dates are for internal tracking only — not shared with USDA or state agencies.
        </p>
      </div>
    </div>
  );
}
