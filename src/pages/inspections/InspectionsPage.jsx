// InspectionsPage — CACFP monitoring visit tracker
// Tracks state reviews, sponsor monitoring visits, findings, and corrective actions
import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck, Plus, X, ChevronDown, ChevronUp, CheckCircle2,
  AlertCircle, Clock, Calendar, Edit2, Trash2, Flag, ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const VISIT_TYPE_META = {
  sponsor_monitoring: { label: 'Sponsor Monitoring', color: 'text-brand-700',  bg: 'bg-brand-50'  },
  state_review:       { label: 'State Review',        color: 'text-purple-700', bg: 'bg-purple-50' },
  usda_review:        { label: 'USDA Review',          color: 'text-blue-700',   bg: 'bg-blue-50'   },
  self_assessment:    { label: 'Self-Assessment',      color: 'text-gray-600',   bg: 'bg-gray-100'  },
};

const SEVERITY_META = {
  critical:    { label: 'Critical',    bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  major:       { label: 'Major',       bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  minor:       { label: 'Minor',       bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  observation: { label: 'Observation', bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
};

const FINDING_STATUS_META = {
  open:        { label: 'Open',        icon: AlertCircle,  color: 'text-red-500'   },
  in_progress: { label: 'In Progress', icon: Clock,        color: 'text-blue-500'  },
  overdue:     { label: 'Overdue',     icon: AlertCircle,  color: 'text-red-600'   },
  resolved:    { label: 'Resolved',    icon: CheckCircle2, color: 'text-green-500' },
};

const INSP_STATUS_META = {
  scheduled:                  { label: 'Scheduled',           bg: 'bg-blue-100',   text: 'text-blue-700'   },
  completed:                  { label: 'Completed',           bg: 'bg-green-100',  text: 'text-green-700'  },
  findings_pending:           { label: 'Findings Pending',    bg: 'bg-amber-100',  text: 'text-amber-700'  },
  corrective_action_required: { label: 'Action Required',     bg: 'bg-red-100',    text: 'text-red-700'    },
  resolved:                   { label: 'Resolved',            bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

const EMPTY_INSP_FORM = {
  org_id: '', visit_date: '', visit_type: 'sponsor_monitoring',
  conducted_by: '', status: 'completed', notes: '', next_visit_date: '',
};

const EMPTY_FINDING_FORM = {
  finding: '', severity: 'minor', corrective_action: '', due_date: '', status: 'open',
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InspectionsPage() {
  const [inspections, setInspections] = useState([]);
  const [orgs, setOrgs]               = useState([]);
  const [summary, setSummary]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFStatus]    = useState('');
  const [filterOrg, setFOrg]          = useState('');
  const [expandedId, setExpandedId]   = useState(null);
  const [findings, setFindings]       = useState({}); // keyed by inspection id

  // Modals
  const [showInspModal, setShowInspModal]       = useState(false);
  const [editingInsp, setEditingInsp]           = useState(null);
  const [inspForm, setInspForm]                 = useState(EMPTY_INSP_FORM);
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [editingFinding, setEditingFinding]     = useState(null);
  const [activeFindingInspId, setActiveFindingInspId] = useState(null);
  const [findingForm, setFindingForm]           = useState(EMPTY_FINDING_FORM);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 100 });
      if (filterStatus) params.set('status', filterStatus);
      if (filterOrg)    params.set('org_id', filterOrg);

      const [inspRes, summaryRes, orgRes] = await Promise.all([
        api.get(`/inspections?${params}`),
        api.get('/inspections/summary'),
        api.get('/organizations?limit=200').catch(() => ({ data: { organizations: [] } })),
      ]);

      setInspections(inspRes.data.inspections || []);
      setSummary(summaryRes.data);
      setOrgs(orgRes.data.organizations || orgRes.data || []);
    } catch {
      setError('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterOrg]);

  useEffect(() => { load(); }, [load]);

  async function loadFindings(inspId) {
    if (findings[inspId]) return; // already loaded
    try {
      const res = await api.get(`/inspections/${inspId}/findings`);
      setFindings(f => ({ ...f, [inspId]: res.data.findings || [] }));
    } catch { /* silent */ }
  }

  function toggleExpand(inspId) {
    if (expandedId === inspId) {
      setExpandedId(null);
    } else {
      setExpandedId(inspId);
      loadFindings(inspId);
    }
  }

  // ── Inspection CRUD ──────────────────────────────────────────────────────────
  function openAddInsp() {
    setEditingInsp(null);
    setInspForm({ ...EMPTY_INSP_FORM, visit_date: new Date().toISOString().split('T')[0] });
    setShowInspModal(true);
    setError('');
  }

  function openEditInsp(insp) {
    setEditingInsp(insp);
    setInspForm({
      org_id:          insp.org_id || '',
      visit_date:      insp.visit_date?.slice(0, 10) || '',
      visit_type:      insp.visit_type || 'sponsor_monitoring',
      conducted_by:    insp.conducted_by || '',
      status:          insp.status || 'completed',
      notes:           insp.notes || '',
      next_visit_date: insp.next_visit_date?.slice(0, 10) || '',
    });
    setShowInspModal(true);
    setError('');
  }

  async function saveInspection() {
    if (!inspForm.visit_date) { setError('Visit date is required'); return; }
    setSaving(true); setError('');
    try {
      if (editingInsp) {
        await api.put(`/inspections/${editingInsp.id}`, inspForm);
      } else {
        await api.post('/inspections', inspForm);
      }
      setShowInspModal(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  }

  async function deleteInspection(insp) {
    if (!confirm(`Delete this ${VISIT_TYPE_META[insp.visit_type]?.label || 'inspection'} record?`)) return;
    try { await api.delete(`/inspections/${insp.id}`); load(); } catch { /* silent */ }
  }

  // ── Finding CRUD ─────────────────────────────────────────────────────────────
  function openAddFinding(inspId) {
    setActiveFindingInspId(inspId);
    setEditingFinding(null);
    setFindingForm(EMPTY_FINDING_FORM);
    setShowFindingModal(true);
    setError('');
  }

  function openEditFinding(finding) {
    setActiveFindingInspId(finding.inspection_id);
    setEditingFinding(finding);
    setFindingForm({
      finding:           finding.finding || '',
      severity:          finding.severity || 'minor',
      corrective_action: finding.corrective_action || '',
      due_date:          finding.due_date?.slice(0, 10) || '',
      status:            finding.status || 'open',
    });
    setShowFindingModal(true);
    setError('');
  }

  async function saveFinding() {
    if (!findingForm.finding.trim()) { setError('Finding description is required'); return; }
    setSaving(true); setError('');
    try {
      if (editingFinding) {
        await api.put(`/inspections/findings/${editingFinding.id}`, findingForm);
      } else {
        await api.post(`/inspections/${activeFindingInspId}/findings`, findingForm);
      }
      setShowFindingModal(false);
      // Reload findings for this inspection
      setFindings(f => { const copy = { ...f }; delete copy[activeFindingInspId]; return copy; });
      await loadFindings(activeFindingInspId);
      load(); // refresh summary counts
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save finding');
    } finally { setSaving(false); }
  }

  async function quickResolveFinding(finding) {
    try {
      await api.put(`/inspections/findings/${finding.id}`, { status: 'resolved' });
      setFindings(f => {
        const updated = (f[finding.inspection_id] || []).map(x =>
          x.id === finding.id ? { ...x, status: 'resolved' } : x
        );
        return { ...f, [finding.inspection_id]: updated };
      });
      load();
    } catch { /* silent */ }
  }

  async function deleteFinding(finding) {
    if (!confirm('Delete this finding?')) return;
    try {
      await api.delete(`/inspections/findings/${finding.id}`);
      setFindings(f => ({
        ...f,
        [finding.inspection_id]: (f[finding.inspection_id] || []).filter(x => x.id !== finding.id),
      }));
      load();
    } catch { /* silent */ }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const summaryCards = summary ? [
    { label: 'Total Visits',        value: summary.total_inspections, color: 'text-gray-900' },
    { label: 'Needs Action',        value: summary.needs_action,      color: Number(summary.needs_action) > 0 ? 'text-red-600' : 'text-gray-400' },
    { label: 'Open Findings',       value: summary.open_findings,     color: Number(summary.open_findings) > 0 ? 'text-orange-600' : 'text-gray-400' },
    { label: 'Upcoming (30 days)',  value: summary.upcoming_visits,   color: Number(summary.upcoming_visits) > 0 ? 'text-blue-600' : 'text-gray-400' },
  ] : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track monitoring visits, findings, and corrective actions</p>
        </div>
        <button onClick={openAddInsp} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Visit
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {summaryCards.map(({ label, value, color }) => (
            <div key={label} className="card p-4">
              <div className={`text-2xl font-bold ${color}`}>{value ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-brand-400"
          value={filterStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(INSP_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {orgs.length > 0 && (
          <select className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-brand-400"
            value={filterOrg} onChange={e => setFOrg(e.target.value)}>
            <option value="">All sites & kitchens</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
        {(filterStatus || filterOrg) && (
          <button onClick={() => { setFStatus(''); setFOrg(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading inspections…</div>
      ) : inspections.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No inspection records yet</p>
          <p className="text-sm text-gray-400 mt-1">Log your first monitoring visit to start tracking findings</p>
          <button onClick={openAddInsp} className="btn-primary mt-4 mx-auto">Log Visit</button>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map(insp => (
            <InspectionCard
              key={insp.id}
              insp={insp}
              expanded={expandedId === insp.id}
              findings={findings[insp.id]}
              onToggle={() => toggleExpand(insp.id)}
              onEdit={() => openEditInsp(insp)}
              onDelete={() => deleteInspection(insp)}
              onAddFinding={() => openAddFinding(insp.id)}
              onEditFinding={openEditFinding}
              onResolveFinding={quickResolveFinding}
              onDeleteFinding={deleteFinding}
            />
          ))}
        </div>
      )}

      {/* Inspection Modal */}
      {showInspModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingInsp ? 'Edit Visit' : 'Log Monitoring Visit'}</h2>
              <button onClick={() => setShowInspModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

              {orgs.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Site / Kitchen</label>
                  <select className="input w-full" value={inspForm.org_id}
                    onChange={e => setInspForm(f => ({ ...f, org_id: e.target.value }))}>
                    <option value="">My Organization</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name} ({o.type})</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Visit Date *</label>
                  <input type="date" className="input w-full"
                    value={inspForm.visit_date} onChange={e => setInspForm(f => ({ ...f, visit_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Visit Type</label>
                  <select className="input w-full" value={inspForm.visit_type}
                    onChange={e => setInspForm(f => ({ ...f, visit_type: e.target.value }))}>
                    {Object.entries(VISIT_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Conducted By</label>
                  <input className="input w-full" placeholder="Name of reviewer"
                    value={inspForm.conducted_by} onChange={e => setInspForm(f => ({ ...f, conducted_by: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select className="input w-full" value={inspForm.status}
                    onChange={e => setInspForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(INSP_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Next Visit Date</label>
                <input type="date" className="input w-full"
                  value={inspForm.next_visit_date} onChange={e => setInspForm(f => ({ ...f, next_visit_date: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea className="input w-full h-24 resize-none" placeholder="General notes from the visit…"
                  value={inspForm.notes} onChange={e => setInspForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowInspModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveInspection} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : editingInsp ? 'Save Changes' : 'Log Visit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finding Modal */}
      {showFindingModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingFinding ? 'Edit Finding' : 'Add Finding'}</h2>
              <button onClick={() => setShowFindingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Finding *</label>
                <textarea className="input w-full h-24 resize-none" placeholder="Describe what was found during the visit…"
                  value={findingForm.finding} onChange={e => setFindingForm(f => ({ ...f, finding: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Severity</label>
                  <select className="input w-full" value={findingForm.severity}
                    onChange={e => setFindingForm(f => ({ ...f, severity: e.target.value }))}>
                    {Object.entries(SEVERITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select className="input w-full" value={findingForm.status}
                    onChange={e => setFindingForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(FINDING_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Corrective Action</label>
                <textarea className="input w-full h-20 resize-none" placeholder="What needs to be done to resolve this finding…"
                  value={findingForm.corrective_action} onChange={e => setFindingForm(f => ({ ...f, corrective_action: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                <input type="date" className="input w-full"
                  value={findingForm.due_date} onChange={e => setFindingForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowFindingModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveFinding} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : editingFinding ? 'Save Changes' : 'Add Finding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inspection Card ───────────────────────────────────────────────────────────
function InspectionCard({ insp, expanded, findings, onToggle, onEdit, onDelete, onAddFinding, onEditFinding, onResolveFinding, onDeleteFinding }) {
  const vm  = VISIT_TYPE_META[insp.visit_type]  || VISIT_TYPE_META.sponsor_monitoring;
  const sm  = INSP_STATUS_META[insp.status]     || INSP_STATUS_META.completed;
  const openCount     = Number(insp.open_findings)  || 0;
  const critCount     = Number(insp.critical_open)  || 0;
  const totalFindings = Number(insp.total_findings) || 0;

  return (
    <div className={`card overflow-hidden ${critCount > 0 ? 'border-red-200' : ''}`}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}>
        <div className="mt-0.5 flex-shrink-0">
          <ShieldCheck className={`w-5 h-5 ${critCount > 0 ? 'text-red-500' : openCount > 0 ? 'text-amber-500' : 'text-green-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">
              {insp.org_name || 'My Organization'}
            </span>
            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${vm.bg} ${vm.color}`}>
              {vm.label}
            </span>
            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${sm.bg} ${sm.text}`}>
              {sm.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(insp.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {insp.conducted_by && <span>by {insp.conducted_by}</span>}
            {totalFindings > 0 && (
              <span className={openCount > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                {openCount > 0 ? `${openCount} open finding${openCount !== 1 ? 's' : ''}` : `${totalFindings} finding${totalFindings !== 1 ? 's' : ''} — all resolved`}
              </span>
            )}
            {totalFindings === 0 && <span className="text-green-600">No findings</span>}
            {insp.next_visit_date && (
              <span className="text-blue-600">
                Next: {new Date(insp.next_visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-brand-600 rounded">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
        </div>
      </div>

      {/* Expanded: findings */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 pb-4">
          {insp.notes && (
            <p className="text-xs text-gray-500 italic pt-3 pb-2">{insp.notes}</p>
          )}

          {/* Findings list */}
          <div className="pt-3 space-y-2">
            {findings === undefined ? (
              <p className="text-xs text-gray-400 text-center py-4">Loading findings…</p>
            ) : findings.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">No findings recorded for this visit</p>
            ) : (
              findings.map(f => <FindingRow key={f.id} finding={f} onEdit={onEditFinding} onResolve={onResolveFinding} onDelete={onDeleteFinding} />)
            )}
          </div>

          <button onClick={onAddFinding}
            className="mt-3 flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium">
            <Plus className="w-3.5 h-3.5" /> Add Finding
          </button>
        </div>
      )}
    </div>
  );
}

// ── Finding Row ───────────────────────────────────────────────────────────────
function FindingRow({ finding, onEdit, onResolve, onDelete }) {
  const sev  = SEVERITY_META[finding.severity]          || SEVERITY_META.minor;
  const stat = FINDING_STATUS_META[finding.status]      || FINDING_STATUS_META.open;
  const StatusIcon = stat.icon;
  const resolved   = finding.status === 'resolved';
  const overdue    = finding.status === 'overdue';

  return (
    <div className={`bg-white rounded-lg p-3 border ${overdue ? 'border-red-200' : resolved ? 'border-gray-100' : 'border-gray-200'}`}>
      <div className="flex items-start gap-2">
        <StatusIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${stat.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold ${sev.bg} ${sev.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
              {sev.label}
            </span>
            <span className={`text-xs font-medium ${stat.color}`}>{stat.label}</span>
          </div>
          <p className={`text-xs ${resolved ? 'line-through text-gray-400' : 'text-gray-700'}`}>{finding.finding}</p>
          {finding.corrective_action && (
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-medium">Action: </span>{finding.corrective_action}
            </p>
          )}
          {finding.due_date && !resolved && (
            <p className={`text-xs mt-1 ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
              Due {new Date(finding.due_date).toLocaleDateString()}
              {overdue && ' — OVERDUE'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!resolved && (
            <button onClick={() => onResolve(finding)} title="Mark resolved"
              className="p-1 text-gray-400 hover:text-green-600 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onEdit(finding)} className="p-1 text-gray-400 hover:text-brand-600 rounded">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(finding)} className="p-1 text-gray-400 hover:text-red-500 rounded">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
