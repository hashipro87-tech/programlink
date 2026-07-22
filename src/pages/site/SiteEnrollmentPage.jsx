// SiteEnrollmentPage.jsx — Site staff manage their child enrollment forms
// Structured data entry with validation — prevents submission if required fields missing
import { useState, useEffect } from 'react';
import { Users2, Plus, CheckCircle, AlertTriangle, AlertCircle, X, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import api from '../../services/api';
import ImportEnrollmentModal from '../../components/enrollment/ImportEnrollmentModal';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const MEALS = ['Breakfast', 'Lunch', 'Snack', 'Supper'];

const FORM_STATUS_META = {
  draft:     { label: 'Draft',           bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-200'   },
  submitted: { label: 'Pending Review',  bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-100'   },
  approved:  { label: 'Approved',        bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-100'  },
  rejected:  { label: 'Needs Correction',bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-100'    },
  expired:   { label: 'Expired',         bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-100' },
};

const REQUIRED_LABELS = {
  first_name:    'First name',
  last_name:     'Last name',
  birthdate:     'Date of birth',
  parent_name:   'Parent/guardian name',
  parent_phone:  'Parent/guardian phone',
  days_enrolled: 'Attendance days',
  meal_types:    'Meal types',
  income_tier:   'Income tier',
};

function getMissing(child) {
  return Object.keys(REQUIRED_LABELS).filter(f => !child[f] || String(child[f]).trim() === '');
}

const BLANK_FORM = {
  first_name: '', last_name: '', birthdate: '',
  parent_name: '', parent_phone: '', parent_email: '',
  days_enrolled: '', meal_types: '',
  income_tier: 'tier1',
  income_cert_date: '', income_cert_expires: '',
  enrollment_date: '', enrollment_expires: '',
  signature_obtained: false,
  notes: '',
};

export default function SiteEnrollmentPage() {
  const [children, setChildren]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [editChild, setEditChild]   = useState(null);
  const [form, setForm]             = useState(BLANK_FORM);
  const [saving, setSaving]         = useState(false);
  const [expanded, setExpanded]     = useState({});
  const [submitting, setSubmitting] = useState({});
  const [toast, setToast]           = useState(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/children?limit=200');
      setChildren(res.data.children ?? []);
    } catch { setError('Failed to load children'); }
    finally { setLoading(false); }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function openAdd() {
    setEditChild(null);
    setForm(BLANK_FORM);
    setShowForm(true);
  }

  function openEdit(child) {
    setEditChild(child);
    setForm({
      first_name:          child.first_name || '',
      last_name:           child.last_name || '',
      birthdate:           child.birthdate?.split('T')[0] || '',
      parent_name:         child.parent_name || '',
      parent_phone:        child.parent_phone || '',
      parent_email:        child.parent_email || '',
      days_enrolled:       child.days_enrolled || '',
      meal_types:          child.meal_types || '',
      income_tier:         child.income_tier || 'tier1',
      income_cert_date:    child.income_cert_date?.split('T')[0] || '',
      income_cert_expires: child.income_cert_expires?.split('T')[0] || '',
      enrollment_date:     child.enrollment_date?.split('T')[0] || '',
      enrollment_expires:  child.enrollment_expires?.split('T')[0] || '',
      signature_obtained:  child.signature_obtained || false,
      notes:               child.notes || '',
    });
    setShowForm(true);
  }

  function toggleDay(day) {
    const current = form.days_enrolled ? form.days_enrolled.split(',').filter(Boolean) : [];
    const lower   = day.toLowerCase();
    const next    = current.includes(lower) ? current.filter(d => d !== lower) : [...current, lower];
    setForm(f => ({ ...f, days_enrolled: next.join(',') }));
  }

  function toggleMeal(meal) {
    const current = form.meal_types ? form.meal_types.split(',').filter(Boolean) : [];
    const lower   = meal.toLowerCase();
    const next    = current.includes(lower) ? current.filter(m => m !== lower) : [...current, lower];
    setForm(f => ({ ...f, meal_types: next.join(',') }));
  }

  async function save() {
    if (!form.first_name || !form.last_name) {
      showToast('First and last name are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editChild) {
        const res = await api.put(`/children/${editChild.id}`, form);
        setChildren(c => c.map(x => x.id === editChild.id ? res.data : x));
      } else {
        const res = await api.post('/children', form);
        setChildren(c => [...c, res.data]);
      }
      setShowForm(false);
      showToast(editChild ? 'Child record updated' : 'Child added');
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to save', 'error');
    } finally { setSaving(false); }
  }

  async function submitForm(childId) {
    setSubmitting(s => ({ ...s, [childId]: true }));
    try {
      const res = await api.post(`/children/${childId}/submit`);
      setChildren(c => c.map(x => x.id === childId ? res.data : x));
      showToast('Enrollment form submitted for review');
    } catch (e) {
      const missing = e.response?.data?.missing_fields;
      if (missing?.length) {
        showToast(`Missing: ${missing.map(f => REQUIRED_LABELS[f] || f).join(', ')}`, 'error');
      } else {
        showToast(e.response?.data?.error || 'Submission failed', 'error');
      }
    } finally { setSubmitting(s => ({ ...s, [childId]: false })); }
  }

  async function deleteChild(id) {
    if (!window.confirm('Remove this child from your roster?')) return;
    try {
      await api.delete(`/children/${id}`);
      setChildren(c => c.filter(x => x.id !== id));
      showToast('Child removed');
    } catch { showToast('Failed to remove child', 'error'); }
  }

  // Compliance summary
  const total     = children.length;
  const approved  = children.filter(c => c.form_status === 'approved').length;
  const pending   = children.filter(c => c.form_status === 'submitted').length;
  const incomplete = children.filter(c => ['draft','rejected'].includes(c.form_status)).length;
  const pct       = total > 0 ? Math.round((approved / total) * 100) : 100;

  if (loading) return <div className="p-8 text-center text-gray-400">Loading enrollment records…</div>;
  if (error)   return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Child Enrollment</h1>
          <p className="text-gray-500 mt-1 text-sm">{total} children · Complete all required fields before submitting</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-brand-300 text-brand-700 bg-brand-50 text-sm font-semibold rounded-xl hover:bg-brand-100 transition-colors">
            <Upload className="w-4 h-4" /> Import Children
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Child
          </button>
        </div>
      </div>

      {/* Compliance Summary */}
      {total > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Enrollment Status</h2>
            <span className={`text-sm font-bold ${pct === 100 ? 'text-green-600' : pct >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
              {pct}% Audit-Ready
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 75 ? 'bg-yellow-400' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Approved', value: approved, bg: 'bg-green-50', text: 'text-green-700' },
              { label: 'Pending Review', value: pending, bg: 'bg-blue-50', text: 'text-blue-700' },
              { label: 'Incomplete', value: incomplete, bg: 'bg-red-50', text: 'text-red-700' },
            ].map(({ label, value, bg, text }) => (
              <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold ${text}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Child list */}
      {children.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <Users2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No children added yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Add children enrolled in your program to get started.</p>
          <button onClick={openAdd} className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl">Add First Child</button>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map(child => {
            const sm     = FORM_STATUS_META[child.form_status] ?? FORM_STATUS_META.draft;
            const missing = getMissing(child);
            const isOpen  = expanded[child.id];
            const days    = child.days_enrolled?.split(',').filter(Boolean) ?? [];
            const meals   = child.meal_types?.split(',').filter(Boolean) ?? [];

            return (
              <div key={child.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${sm.border}`}>
                {/* Row header */}
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-600">{child.first_name?.[0]}{child.last_name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{child.first_name} {child.last_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {child.birthdate ? new Date(child.birthdate).toLocaleDateString() : 'No DOB'}
                      {child.parent_name ? ` · ${child.parent_name}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${sm.bg} ${sm.text}`}>{sm.label}</span>
                  <button onClick={() => setExpanded(e => ({ ...e, [child.id]: !e[child.id] }))} className="p-1 text-gray-400 hover:text-gray-600">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Missing fields warning */}
                {missing.length > 0 && (
                  <div className="px-5 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700 font-medium">
                      Missing: {missing.map(f => REQUIRED_LABELS[f]).join(', ')}
                    </p>
                  </div>
                )}

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-5 pb-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-4 text-sm">
                      <div><span className="text-xs font-semibold text-gray-400">Days</span><p className="text-gray-800 mt-0.5">{days.length ? days.map(d => d[0].toUpperCase() + d.slice(1)).join(', ') : '—'}</p></div>
                      <div><span className="text-xs font-semibold text-gray-400">Meals</span><p className="text-gray-800 mt-0.5">{meals.length ? meals.map(m => m[0].toUpperCase() + m.slice(1)).join(', ') : '—'}</p></div>
                      <div><span className="text-xs font-semibold text-gray-400">Parent Phone</span><p className="text-gray-800 mt-0.5">{child.parent_phone || '—'}</p></div>
                      <div><span className="text-xs font-semibold text-gray-400">Income Tier</span><p className="text-gray-800 mt-0.5">{child.income_tier === 'tier1' ? 'Tier 1 (Free)' : child.income_tier === 'tier2' ? 'Tier 2 (Reduced)' : 'Tier 3 (Paid)'}</p></div>
                      <div><span className="text-xs font-semibold text-gray-400">Signature</span><p className={`mt-0.5 font-semibold text-xs ${child.signature_obtained ? 'text-green-600' : 'text-red-500'}`}>{child.signature_obtained ? '✓ Obtained' : '✗ Missing'}</p></div>
                      <div><span className="text-xs font-semibold text-gray-400">Enrollment Expires</span><p className="text-gray-800 mt-0.5">{child.enrollment_expires ? new Date(child.enrollment_expires).toLocaleDateString() : '—'}</p></div>
                    </div>

                    {/* Rejection note */}
                    {child.form_status === 'rejected' && child.notes && (
                      <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-xs font-bold text-red-700 mb-1">Rejection reason</p>
                        <p className="text-xs text-red-600">{child.notes.split('Rejection:').pop()?.trim()}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <button onClick={() => openEdit(child)}
                        className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        Edit
                      </button>
                      {['draft', 'rejected'].includes(child.form_status) && missing.length === 0 && child.signature_obtained && (
                        <button onClick={() => submitForm(child.id)} disabled={submitting[child.id]}
                          className="px-3 py-1.5 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors">
                          {submitting[child.id] ? 'Submitting…' : 'Submit for Review'}
                        </button>
                      )}
                      {['draft', 'rejected'].includes(child.form_status) && (missing.length > 0 || !child.signature_obtained) && (
                        <span className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                          Complete form to submit
                        </span>
                      )}
                      <button onClick={() => deleteChild(child.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors ml-auto">
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editChild ? 'Edit Child' : 'Add Child'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" value={form.birthdate} onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
              </div>

              {/* Parent / Guardian */}
              <div className="pt-1 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Parent / Guardian</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                    <input value={form.parent_name} onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phone <span className="text-red-500">*</span></label>
                    <input value={form.parent_phone} onChange={e => setForm(f => ({ ...f, parent_phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="(555) 000-0000" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input value={form.parent_email} onChange={e => setForm(f => ({ ...f, parent_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="parent@email.com" />
                </div>
              </div>

              {/* Attendance */}
              <div className="pt-1 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Attendance Schedule <span className="text-red-500">*</span></p>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map(day => {
                    const active = form.days_enrolled?.split(',').includes(day.toLowerCase());
                    return (
                      <button key={day} type="button" onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-colors ${active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meals */}
              <div className="pt-1 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Meal Types <span className="text-red-500">*</span></p>
                <div className="flex gap-2 flex-wrap">
                  {MEALS.map(meal => {
                    const active = form.meal_types?.split(',').includes(meal.toLowerCase());
                    return (
                      <button key={meal} type="button" onClick={() => toggleMeal(meal)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-colors ${active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {meal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Income eligibility */}
              <div className="pt-1 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Income Eligibility <span className="text-red-500">*</span></p>
                <select value={form.income_tier} onChange={e => setForm(f => ({ ...f, income_tier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm mb-3">
                  <option value="tier1">Tier 1 — Free (income at or below 130% FPL)</option>
                  <option value="tier2">Tier 2 — Reduced (130–185% FPL)</option>
                  <option value="tier3">Tier 3 — Paid (above 185% FPL)</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cert Date</label>
                    <input type="date" value={form.income_cert_date} onChange={e => setForm(f => ({ ...f, income_cert_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cert Expires</label>
                    <input type="date" value={form.income_cert_expires} onChange={e => setForm(f => ({ ...f, income_cert_expires: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                  </div>
                </div>
              </div>

              {/* Enrollment dates */}
              <div className="pt-1 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Enrollment Dates</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Enrollment Date</label>
                    <input type="date" value={form.enrollment_date} onChange={e => setForm(f => ({ ...f, enrollment_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Expires</label>
                    <input type="date" value={form.enrollment_expires} onChange={e => setForm(f => ({ ...f, enrollment_expires: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="pt-1 border-t border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.signature_obtained}
                    onChange={e => setForm(f => ({ ...f, signature_obtained: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 cursor-pointer" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Parent/guardian signature obtained</p>
                    <p className="text-xs text-gray-500 mt-0.5">Required before the enrollment form can be submitted for review.</p>
                  </div>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none" />
              </div>

            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Saving…' : editChild ? 'Save Changes' : 'Add Child'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <ImportEnrollmentModal
          onClose={() => setShowImport(false)}
          onImported={(count) => { load(); showToast(`${count} children imported`); setShowImport(false); }}
        />
      )}
    </div>
  );
}
