// ChildRosterPage — Sponsor view of all children across sites/kitchens
import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Plus, X, ChevronDown, Baby, Edit2, Trash2, AlertCircle, Clock, CheckCircle2, ShieldCheck, Upload } from 'lucide-react';
import api from '../../services/api';
import ImportEnrollmentModal from '../../components/enrollment/ImportEnrollmentModal';

const STATUS_META = {
  enrolled:  { label: 'Enrolled',  bg: 'bg-green-100',  text: 'text-green-700'  },
  pending:   { label: 'Pending',   bg: 'bg-amber-100',  text: 'text-amber-700'  },
  inactive:  { label: 'Inactive',  bg: 'bg-gray-100',   text: 'text-gray-600'   },
  withdrawn: { label: 'Withdrawn', bg: 'bg-red-100',    text: 'text-red-700'    },
};

const AGE_META = {
  infant_0_5:  { label: 'Infant (0–5 mo)',   color: 'text-pink-600'   },
  infant_6_11: { label: 'Infant (6–11 mo)',  color: 'text-pink-500'   },
  toddler:     { label: 'Toddler (1–2)',     color: 'text-violet-600' },
  preschool:   { label: 'Preschool (3–5)',   color: 'text-blue-600'   },
  school_age:  { label: 'School Age (6+)',   color: 'text-teal-600'   },
};

const TIER_META = {
  tier1: { label: 'Tier I',  bg: 'bg-brand-50', text: 'text-brand-700' },
  tier2: { label: 'Tier II', bg: 'bg-amber-50', text: 'text-amber-700' },
  paid:  { label: 'Paid',    bg: 'bg-gray-100', text: 'text-gray-600'  },
};

// Fields that must be filled for a complete enrollment form
const REQUIRED_FIELDS = [
  'first_name', 'last_name', 'birthdate', 'parent_name',
  'parent_phone', 'days_enrolled', 'meal_types', 'income_tier',
];
function getMissingCount(child) {
  return REQUIRED_FIELDS.filter(f => !child[f] || String(child[f]).trim() === '').length;
}

const EMPTY_FORM = {
  first_name: '', last_name: '', birthdate: '', enrollment_status: 'enrolled',
  income_tier: 'tier1', age_group: '', enrollment_date: '', parent_name: '',
  parent_phone: '', notes: '', org_id: '',
};

export default function ChildRosterPage() {
  const [children, setChildren]   = useState([]);
  const [orgs, setOrgs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setStatus] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [compliance, setCompliance]     = useState(null);
  const [showImport, setShowImport]     = useState(false);
  const [importOrg, setImportOrg]       = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 200 });
      if (search)       params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterOrg)    params.set('org_id', filterOrg);
      if (filterAge)    params.set('age_group', filterAge);

      const [childRes, orgRes, compRes] = await Promise.all([
        api.get(`/children?${params}`),
        api.get('/organizations?limit=200'),
        api.get('/children/compliance').catch(() => ({ data: null })),
      ]);

      setChildren(childRes.data.children || []);
      setTotal(childRes.data.total || 0);
      setOrgs(orgRes.data.organizations || []);
      if (compRes.data) setCompliance(compRes.data);
    } catch {
      setError('Failed to load roster');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterOrg, filterAge]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(child) {
    setEditing(child);
    setForm({
      first_name:        child.first_name || '',
      last_name:         child.last_name  || '',
      birthdate:         child.birthdate  ? child.birthdate.slice(0, 10) : '',
      enrollment_status: child.enrollment_status || 'enrolled',
      income_tier:       child.income_tier || 'tier1',
      age_group:         child.age_group  || '',
      enrollment_date:   child.enrollment_date ? child.enrollment_date.slice(0, 10) : '',
      parent_name:       child.parent_name  || '',
      parent_phone:      child.parent_phone || '',
      notes:             child.notes || '',
      org_id:            child.org_id || '',
    });
    setShowModal(true);
  }

  async function save() {
    if (!form.first_name || !form.last_name) {
      setError('First and last name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/children/${editing.id}`, form);
      } else {
        await api.post('/children', form);
      }
      setShowModal(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/children/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch {
      setError('Failed to delete');
    }
  }

  // Summary counts
  const enrolledCount  = children.filter(c => c.enrollment_status === 'enrolled').length;
  const pendingCount   = children.filter(c => c.enrollment_status === 'pending').length;
  const infantCount    = children.filter(c => c.age_group?.startsWith('infant')).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Child Roster</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage enrolled children across all your sites and kitchens</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-brand-300 text-brand-700 bg-brand-50 text-sm font-semibold rounded-xl hover:bg-brand-100 transition-colors">
            <Upload className="w-4 h-4" /> Import Children
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Child
          </button>
        </div>
      </div>

      {/* Enrollment Compliance Panel */}
      {compliance && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <h2 className="font-bold text-gray-900">Enrollment Status</h2>
              </div>
              <p className="text-sm ml-7">
                <span className="font-semibold text-green-700">{Number(compliance.forms_approved || 0)} audit ready</span>
                <span className="text-gray-300 mx-1.5">·</span>
                <span className="font-semibold text-red-600">
                  {Math.max(0, Number(compliance.total || 0) - Number(compliance.forms_approved || 0))} need attention
                </span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-3">
              <Users className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-gray-800">{Number(compliance.total || 0)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total children</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-green-700">{compliance.forms_approved}</p>
                <p className="text-xs text-gray-500 mt-0.5">Complete enrollments</p>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-red-700">{compliance.forms_incomplete}</p>
                <p className="text-xs text-gray-500 mt-0.5">Missing income forms</p>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-amber-700">{compliance.expiring_soon}</p>
                <p className="text-xs text-gray-500 mt-0.5">Expiring enrollments</p>
              </div>
            </div>
          </div>
          {/* Most common missing fields */}
          {compliance.field_gaps?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Most Common Missing Fields</p>
              <div className="flex flex-wrap gap-2">
                {compliance.field_gaps.slice(0, 5).map(({ field, label, count }) => (
                  <span key={field} className="inline-flex items-center gap-1.5 text-xs font-medium bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
                    <span className="font-bold">{count}</span>
                    <span>missing {label.toLowerCase()}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {compliance.forms_submitted > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-900 mb-2">Pending Review</p>
              <div className="space-y-1">
                {(compliance.pending_review || []).map(c => (
                  <div key={c.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-gray-800 font-medium">{c.first_name} {c.last_name}</span>
                    <span className="text-xs text-gray-400">{c.org_name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => api.post(`/children/${c.id}/review`, { decision: 'approved' }).then(load)}
                        className="text-xs font-semibold text-green-700 hover:text-green-800 px-2 py-1 bg-green-50 rounded-lg">
                        Approve
                      </button>
                      <button onClick={() => {
                        const reason = prompt('Reason for rejection (optional):') ?? '';
                        api.post(`/children/${c.id}/review`, { decision: 'rejected', rejection_reason: reason }).then(load);
                      }}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 bg-red-50 rounded-lg">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Children', value: total,         color: 'text-gray-900' },
          { label: 'Enrolled',       value: enrolledCount, color: 'text-green-700' },
          { label: 'Pending',        value: pendingCount,  color: 'text-amber-700' },
          { label: 'Infants',        value: infantCount,   color: 'text-pink-600'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
            placeholder="Search by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-brand-400"
          value={filterStatus} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-brand-400"
          value={filterAge} onChange={e => setFilterAge(e.target.value)}>
          <option value="">All ages</option>
          {Object.entries(AGE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-brand-400"
          value={filterOrg} onChange={e => setFilterOrg(e.target.value)}>
          <option value="">All sites</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        {(filterStatus || filterOrg || filterAge || search) && (
          <button onClick={() => { setStatus(''); setFilterOrg(''); setFilterAge(''); setSearch(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading roster…</div>
      ) : children.length === 0 ? (
        <div className="card p-12 text-center">
          <Baby className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No children found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first child or adjust your filters</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Age Group</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Income Tier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Site / Kitchen</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Enrolled</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Parent</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {children.map(child => {
                const sm      = STATUS_META[child.enrollment_status] || STATUS_META.enrolled;
                const am      = AGE_META[child.age_group];
                const tm      = TIER_META[child.income_tier] || TIER_META.tier1;
                const missing = getMissingCount(child);
                return (
                  <tr key={child.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {child.last_name}, {child.first_name}
                      {child.birthdate && (
                        <div className="text-xs text-gray-400">{new Date(child.birthdate).toLocaleDateString()}</div>
                      )}
                      {missing > 0 && (
                        <div className="text-[10px] font-bold text-orange-600 mt-0.5">
                          {missing} field{missing !== 1 ? 's' : ''} missing
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {am ? (
                        <span className={`text-xs font-medium ${am.color}`}>{am.label}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${sm.bg} ${sm.text}`}>
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${tm.bg} ${tm.text}`}>
                        {tm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{child.org_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {child.enrollment_date ? new Date(child.enrollment_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {child.parent_name || '—'}
                      {child.parent_phone && <div className="text-gray-400">{child.parent_phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(child)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(child)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {children.length} of {total} children
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Child' : 'Add Child'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
                  <input className="input w-full" value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
                  <input className="input w-full" value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
                  <input type="date" className="input w-full" value={form.birthdate}
                    onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Enrollment Date</label>
                  <input type="date" className="input w-full" value={form.enrollment_date}
                    onChange={e => setForm(f => ({ ...f, enrollment_date: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select className="input w-full" value={form.enrollment_status}
                    onChange={e => setForm(f => ({ ...f, enrollment_status: e.target.value }))}>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Income Tier</label>
                  <select className="input w-full" value={form.income_tier}
                    onChange={e => setForm(f => ({ ...f, income_tier: e.target.value }))}>
                    <option value="tier1">Tier I</option>
                    <option value="tier2">Tier II</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Age Group</label>
                  <select className="input w-full" value={form.age_group}
                    onChange={e => setForm(f => ({ ...f, age_group: e.target.value }))}>
                    <option value="">Auto (from birthdate)</option>
                    {Object.entries(AGE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Site / Kitchen</label>
                  <select className="input w-full" value={form.org_id}
                    onChange={e => setForm(f => ({ ...f, org_id: e.target.value }))}>
                    <option value="">Select site…</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Parent / Guardian Name</label>
                  <input className="input w-full" value={form.parent_name}
                    onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Parent Phone</label>
                  <input className="input w-full" value={form.parent_phone} placeholder="(555) 000-0000"
                    onChange={e => setForm(f => ({ ...f, parent_phone: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea className="input w-full h-20 resize-none" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Child'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-2">Remove child?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> from the roster.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <ImportEnrollmentModal
          orgId={importOrg || filterOrg || undefined}
          onClose={() => setShowImport(false)}
          onImported={(count) => { load(); setShowImport(false); }}
        />
      )}
    </div>
  );
}
