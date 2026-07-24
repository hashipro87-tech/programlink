// RenewalWizardPage.jsx — Sponsor: create and track annual CACFP renewals
import { useState, useEffect } from 'react';
import {
  RotateCcw, Plus, ChevronDown, ChevronUp, CheckCircle,
  Clock, AlertCircle, X, Search, Calendar,
} from 'lucide-react';
import api from '../../services/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_META = {
  active:    { label: 'Active',    dot: 'bg-blue-500',   text: 'text-blue-700',  bg: 'bg-blue-50'  },
  completed: { label: 'Completed', dot: 'bg-green-500',  text: 'text-green-700', bg: 'bg-green-50' },
  cancelled: { label: 'Cancelled', dot: 'bg-gray-400',   text: 'text-gray-500',  bg: 'bg-gray-100' },
};

const ITEM_TYPES = [
  { key: 'document',        label: 'Site License / Permit'              },
  { key: 'document',        label: 'Insurance Certificate'              },
  { key: 'document',        label: 'Health Inspection Report'           },
  { key: 'document',        label: 'Enrollment Packet'                  },
  { key: 'income_certs',    label: 'Income Eligibility Certifications'  },
  { key: 'roster_review',   label: 'Child Roster Review'               },
  { key: 'profile_confirm', label: 'Site Profile Confirmation'         },
  { key: 'agreement',       label: 'Sponsor Agreement / Acknowledgment' },
];

function pct(complete, total) {
  if (!total) return 0;
  return Math.round((complete / total) * 100);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function daysLeft(due) {
  if (!due) return null;
  const diff = Math.ceil((new Date(due) - new Date()) / 86400000);
  return diff;
}

// ── Create Renewal Modal (3-step wizard) ──────────────────────────────────────
function CreateModal({ sites, onClose, onCreate }) {
  const [step, setStep]     = useState(1);
  const [title, setTitle]   = useState('Annual Renewal ' + new Date().getFullYear());
  const [dueDate, setDueDate] = useState('');
  const [selectedSites, setSelectedSites] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState(ITEM_TYPES.map((_, i) => i)); // all checked by default
  const [saving, setSaving] = useState(false);

  const filteredSites = sites.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSite = (id) => setSelectedSites(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  );

  const toggleItem = (i) => setSelectedItems(prev =>
    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
  );

  const handleCreate = async () => {
    if (!dueDate || !selectedSites.length || !selectedItems.length) return;
    setSaving(true);
    try {
      const required_items = [...new Set(selectedItems.map(i => ITEM_TYPES[i].key))];
      await onCreate({ title, due_date: dueDate, site_ids: selectedSites, required_items });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Start New Renewal</h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex px-6 pt-4 gap-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-brand-600' : 'bg-gray-100'}`}
            />
          ))}
        </div>

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Renewal Title</label>
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Due Date</label>
              <input
                type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
        )}

        {/* Step 2 — Select sites */}
        {step === 2 && (
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-600">Select Sites</label>
              <button
                onClick={() => setSelectedSites(
                  selectedSites.length === sites.length ? [] : sites.map(s => s.id)
                )}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                {selectedSites.length === sites.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Search sites…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredSites.map(s => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox" checked={selectedSites.includes(s.id)}
                    onChange={() => toggleSite(s.id)}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  <span className="text-sm text-gray-800">{s.name}</span>
                </label>
              ))}
              {filteredSites.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No sites found</p>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">{selectedSites.length} of {sites.length} selected</p>
          </div>
        )}

        {/* Step 3 — Required items */}
        {step === 3 && (
          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-gray-600 mb-3">Required Checklist Items</p>
            <div className="space-y-1">
              {ITEM_TYPES.map((item, i) => (
                <label key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox" checked={selectedItems.includes(i)}
                    onChange={() => toggleItem(i)}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  <span className="text-sm text-gray-800">{item.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Each selected site will get a checklist with these {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          {step > 1
            ? <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-semibold">Back</button>
            : <div />
          }
          {step < 3
            ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 ? !dueDate : step === 2 ? !selectedSites.length : false}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={saving || !selectedItems.length}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {saving ? 'Creating…' : `Create Renewal for ${selectedSites.length} Site${selectedSites.length !== 1 ? 's' : ''}`}
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
}

// ── Renewal Detail — per-site accordion ───────────────────────────────────────
function RenewalDetail({ renewal, onClose }) {
  const [sites, setSites]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSite, setOpenSite] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get(`/renewals/${renewal.id}`).then(r => {
      setSites(r.data.sites ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [renewal.id]);

  const handleItem = async (itemId, status) => {
    setUpdating(itemId);
    try {
      await api.put(`/renewals/items/${itemId}`, { status });
      // Refresh
      const r = await api.get(`/renewals/${renewal.id}`);
      setSites(r.data.sites ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const total    = sites.reduce((n, s) => n + s.total, 0);
  const complete = sites.reduce((n, s) => n + s.complete, 0);
  const days     = daysLeft(renewal.due_date);
  const pctDone  = pct(complete, total);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{renewal.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">Due {fmtDate(renewal.due_date)}</span>
              {days !== null && (
                <span className={`text-xs font-semibold ${days < 14 ? 'text-red-600' : days < 30 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {days > 0 ? `${days} days left` : days === 0 ? 'Due today' : `${Math.abs(days)} days overdue`}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-gray-50 bg-gray-50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-600">{complete}/{total} items complete</span>
            <span className="text-xs font-bold text-brand-600">{pctDone}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${pctDone}%` }}
            />
          </div>
        </div>

        {/* Site list */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
            </div>
          )}
          {!loading && sites.map(site => {
            const isOpen  = openSite === site.site_id;
            const sitePct = pct(site.complete + site.waived, site.total);
            return (
              <div key={site.site_id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenSite(isOpen ? null : site.site_id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{site.site_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {site.complete} done · {site.pending} pending{site.waived ? ` · ${site.waived} waived` : ''}
                    </p>
                  </div>
                  <div className="w-20 hidden sm:block">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${sitePct === 100 ? 'bg-green-500' : sitePct >= 50 ? 'bg-amber-400' : 'bg-brand-400'}`}
                        style={{ width: `${sitePct}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    sitePct === 100 ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'
                  }`}>{sitePct}%</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50 bg-gray-50">
                    {site.items.map(item => (
                      <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                        {item.status === 'complete' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : item.status === 'waived' ? (
                          <span className="w-4 h-4 flex-shrink-0 text-gray-400 text-xs font-bold">—</span>
                        ) : (
                          <Clock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={`text-sm flex-1 ${item.status === 'complete' ? 'text-gray-400 line-through' : item.status === 'waived' ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {item.item_label}
                        </span>
                        {item.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <button
                              disabled={updating === item.id}
                              onClick={() => handleItem(item.id, 'complete')}
                              className="text-xs px-2.5 py-1 bg-green-100 text-green-700 hover:bg-green-200 font-semibold rounded-lg transition-colors disabled:opacity-40"
                            >
                              Complete
                            </button>
                            <button
                              disabled={updating === item.id}
                              onClick={() => handleItem(item.id, 'waived')}
                              className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 hover:bg-gray-200 font-semibold rounded-lg transition-colors disabled:opacity-40"
                            >
                              Waive
                            </button>
                          </div>
                        )}
                        {item.status !== 'pending' && (
                          <button
                            disabled={updating === item.id}
                            onClick={() => handleItem(item.id, 'pending')}
                            className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40"
                            title="Mark as pending"
                          >Undo</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RenewalWizardPage() {
  const [renewals, setRenewals]   = useState([]);
  const [sites,    setSites]      = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeRenewal, setActiveRenewal] = useState(null);
  const [tab, setTab] = useState('active');

  const load = async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        api.get('/renewals'),
        api.get('/organizations', { params: { type: 'site', limit: 500 } }),
      ]);
      setRenewals(rRes.data?.renewals ?? []);
      setSites(sRes.data?.organizations ?? sRes.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data) => {
    await api.post('/renewals', data);
    load();
  };

  const handleStatusChange = async (id, status) => {
    await api.put(`/renewals/${id}`, { status });
    load();
  };

  const visible = renewals.filter(r => tab === 'all' ? true : r.status === tab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showCreate && (
        <CreateModal
          sites={sites}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
      {activeRenewal && (
        <RenewalDetail
          renewal={activeRenewal}
          onClose={() => setActiveRenewal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renewal Wizard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage annual CACFP paperwork renewals for all sites.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Start Renewal
        </button>
      </div>

      {/* Summary cards */}
      {renewals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active',     value: renewals.filter(r => r.status === 'active').length,    color: 'text-blue-600'  },
            { label: 'Completed',  value: renewals.filter(r => r.status === 'completed').length, color: 'text-green-600' },
            { label: 'Total Sites Enrolled', value: [...new Set(renewals.flatMap(r => r.total_sites ? [r.id] : []))].length || '—', color: 'text-gray-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[['active','Active'],['completed','Completed'],['all','All']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Renewal cards */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">
            {tab === 'active' ? 'No active renewals' : 'No renewals yet'}
          </p>
          <p className="text-xs mt-1">Click "Start Renewal" to create an annual renewal checklist for your sites.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map(r => {
            const done  = Number(r.complete_items) + Number(r.waived_items);
            const total = Number(r.total_items);
            const p     = pct(done, total);
            const sm    = STATUS_META[r.status] ?? STATUS_META.active;
            const days  = daysLeft(r.due_date);

            return (
              <div
                key={r.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-brand-200 hover:shadow-sm transition-all"
              >
                <div className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                          {sm.label}
                        </span>
                        <span className="text-xs text-gray-400">{r.year}</span>
                      </div>
                      <h3 className="font-bold text-gray-900">{r.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {fmtDate(r.due_date)}</span>
                        {days !== null && r.status === 'active' && (
                          <span className={`font-semibold ${days < 14 ? 'text-red-600' : days < 30 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {days > 0 ? `${days}d left` : days === 0 ? 'Due today' : `${Math.abs(days)}d overdue`}
                          </span>
                        )}
                        <span>{r.total_sites} sites</span>
                      </div>
                    </div>

                    {/* Progress ring area */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-black text-gray-900">{p}%</p>
                      <p className="text-xs text-gray-400">{done}/{total} items</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${p === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {r.sites_complete} of {r.total_sites} sites fully complete
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setActiveRenewal(r)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      View per-site status →
                    </button>
                    {r.status === 'active' && (
                      <>
                        <span className="text-gray-200">·</span>
                        <button
                          onClick={() => handleStatusChange(r.id, 'completed')}
                          className="text-xs font-semibold text-gray-400 hover:text-green-600"
                        >
                          Mark complete
                        </button>
                        <span className="text-gray-200">·</span>
                        <button
                          onClick={() => handleStatusChange(r.id, 'cancelled')}
                          className="text-xs font-semibold text-gray-400 hover:text-red-500"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <RotateCcw className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          Annual renewals prompt each site to re-submit required documents, confirm their child roster, update income eligibility certifications, and sign the sponsor agreement — all from one checklist. Sites are notified automatically when a renewal is created.
        </p>
      </div>
    </div>
  );
}
