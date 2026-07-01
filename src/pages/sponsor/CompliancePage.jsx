// CompliancePage.jsx — Compliance Action Center
//
// Features:
//   • 4 summary cards: Kitchens, Sites, Missing-Doc orgs, Expiring Soon docs
//     (each card is clickable to toggle that filter)
//   • 5-tier status: Compliant | Pending Review | Missing Docs | Expiring Soon | Overdue
//   • Per-row: doc fraction ("8/10 · 2 missing · 1 expiring"), app status text, expiry badge
//   • Hover quick-actions: Remind, Request Document
//   • Right-side compliance drawer: score bar, checklist breakdown, inline actions
//   • "Fix Remaining Issues" CTA in drawer opens Request Document modal
//   • Search + filters: type (Kitchen/Site), status tier, missing-only, expiring-only
//   • Send Reminder without leaving page (toast feedback)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, Shield, AlertTriangle, XCircle,
  CheckCircle, Clock, Building2, FileText, RefreshCw, Users,
  Bell, Plus, Eye, X, Zap, AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_DOCS = {
  kitchen: [
    { key: 'w9',          label: 'W-9 Form' },
    { key: 'food_permit', label: 'Food Service Permit' },
    { key: 'insurance',   label: 'Insurance Certificate' },
    { key: 'menu_plan',   label: 'Menu Plan' },
    { key: 'health_cert', label: 'Health Inspection' },
  ],
  site: [
    { key: 'enrollment', label: 'Enrollment Form' },
    { key: 'license',    label: 'Operating License' },
    { key: 'insurance',  label: 'Insurance Certificate' },
    { key: 'health_cert', label: 'Health Inspection' },
  ],
};

const ALL_DOC_OPTIONS = [
  { value: 'w9',          label: 'W-9 Form' },
  { value: 'food_permit', label: 'Food Service Permit' },
  { value: 'insurance',   label: 'Insurance Certificate' },
  { value: 'menu_plan',   label: 'Menu Plan' },
  { value: 'health_cert', label: 'Health Inspection' },
  { value: 'enrollment',  label: 'Enrollment Form' },
  { value: 'license',     label: 'Operating License' },
  { value: 'general',     label: 'General Document' },
];

const TIER = {
  compliant: { label: 'Compliant',         bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  Icon: ShieldCheck,   iconCls: 'text-green-500' },
  pending:   { label: 'Pending Review',    bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   Icon: Clock,         iconCls: 'text-blue-500' },
  missing:   { label: 'Missing Documents', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', Icon: FileText,      iconCls: 'text-yellow-500' },
  expiring:  { label: 'Expiring Soon',     bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', Icon: AlertTriangle, iconCls: 'text-orange-500' },
  overdue:   { label: 'Overdue',           bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    Icon: XCircle,       iconCls: 'text-red-500' },
};

const SCORE_BAR = {
  compliant: 'bg-green-500',
  pending:   'bg-blue-500',
  missing:   'bg-yellow-500',
  expiring:  'bg-orange-500',
  overdue:   'bg-red-500',
};

const APP_LABEL = {
  approved:  { text: 'Application Approved',    cls: 'text-green-600' },
  rejected:  { text: 'Application Rejected',    cls: 'text-red-500' },
  submitted: { text: 'Pending Review',          cls: 'text-blue-600' },
  pending:   { text: 'Awaiting Submission',     cls: 'text-yellow-600' },
  draft:     { text: 'Application In Progress', cls: 'text-gray-500' },
};
const APP_NONE = { text: 'Application Not Started', cls: 'text-gray-400' };
const appLabel = (status) => APP_LABEL[status] ?? APP_NONE;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRelative(dateStr) {
  if (!dateStr) return null;
  const days = Math.round((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)   return `${days}d ago`;
  if (days < 30)  return `${Math.round(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtExpiry(dateStr) {
  if (!dateStr) return null;
  const d    = new Date(dateStr);
  const days = Math.round((d - Date.now()) / 86400000);
  const fmt  = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (days < 0)   return { label: `Expired ${Math.abs(days)}d ago`, cls: 'text-red-600 bg-red-50' };
  if (days === 0) return { label: 'Expires today',                  cls: 'text-red-600 bg-red-50' };
  if (days <= 7)  return { label: `Expires in ${days}d`,           cls: 'text-red-600 bg-red-50' };
  if (days <= 30) return { label: `Expires ${fmt}`,                cls: 'text-orange-600 bg-orange-50' };
  return { label: fmt, cls: 'text-gray-500 bg-gray-50' };
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type }) {
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                     ${type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
      {type === 'error'
        ? <XCircle    className="w-4 h-4" />
        : <CheckCircle className="w-4 h-4 text-green-400" />}
      {msg}
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, Icon, iconCls, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border rounded-2xl p-5 transition-all
                  ${active
                    ? 'border-brand-400 ring-2 ring-brand-100 shadow-sm'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconCls}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </button>
  );
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }) {
  const t = TIER[tier] ?? TIER.compliant;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${t.bg} ${t.text}`}>
      <t.Icon className="w-3 h-3" />
      {t.label}
    </span>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score, tier }) {
  const colors = {
    compliant: 'text-green-700  bg-green-50  border-green-200',
    pending:   'text-blue-700   bg-blue-50   border-blue-200',
    missing:   'text-yellow-700 bg-yellow-50 border-yellow-200',
    expiring:  'text-orange-700 bg-orange-50 border-orange-200',
    overdue:   'text-red-700    bg-red-50    border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold border ${colors[tier] ?? colors.compliant}`}>
      {score}%
    </span>
  );
}

// ─── Request Document Modal ───────────────────────────────────────────────────

function RequestDocModal({ org, prefillType, onClose, onSent }) {
  const options  = ALL_DOC_OPTIONS.filter((d) => {
    const req = REQUIRED_DOCS[org.type] ?? [];
    return req.some((r) => r.key === d.value) || d.value === 'general';
  });
  const [docType,  setDocType]  = useState(prefillType ?? '');
  const [label,    setLabel]    = useState(
    prefillType ? (options.find((o) => o.value === prefillType)?.label ?? '') : ''
  );
  const [dueDate,  setDueDate]  = useState('');
  const [message,  setMessage]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState('');

  async function send() {
    if (!docType || !label) return;
    setError('');
    setSending(true);
    try {
      await api.post('/documents/request', {
        org_id:   org.id,
        doc_type: docType,
        label,
        due_date: dueDate  || undefined,
        message:  message  || undefined,
      });
      onSent?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to send request. Please try again.';
      setError(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="font-bold text-gray-900 text-sm">Request Document — {org.name}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document type</label>
            <select
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value);
                if (!label) setLabel(options.find((o) => o.value === e.target.value)?.label ?? '');
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              <option value="">Select…</option>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 2024 Health Inspection Report"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Due date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Any specific instructions…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-1 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            {error}
          </div>
        )}
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl">Cancel</button>
          <button
            onClick={send}
            disabled={sending || !docType || !label}
            className="px-4 py-2 text-sm bg-brand-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Compliance Drawer ────────────────────────────────────────────────────────

function ComplianceDrawer({ org, onClose, onAction }) {
  const required  = REQUIRED_DOCS[org.type] ?? [];
  const uploaded  = new Set(org.uploaded_doc_types ?? []);
  const al        = appLabel(org.app_status);
  const expiry    = org.next_expiry ? fmtExpiry(org.next_expiry) : null;

  // Build full checklist: application + each required doc
  const checklist = [
    {
      label:   'Application submitted',
      done:    !!org.app_status && org.app_status !== 'rejected',
      status:  org.app_status === 'approved'  ? 'approved'  :
               org.app_status === 'rejected'  ? 'rejected'  :
               org.app_status                 ? 'pending'   : 'missing',
    },
    ...required.map((doc) => ({
      label:   doc.label,
      done:    uploaded.has(doc.key),
      status:  uploaded.has(doc.key) ? 'done' : 'missing',
      docType: doc.key,
    })),
  ];

  const doneCnt    = checklist.filter((i) => i.done).length;
  const missingItems = checklist.filter((i) => !i.done);

  function ItemIcon({ status }) {
    if (status === 'done' || status === 'approved')
      return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
    if (status === 'pending')
      return <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    if (status === 'rejected')
      return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    return <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />;
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto">

        {/* Drawer header */}
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-start justify-between gap-2 z-10">
          <div>
            <p className="font-bold text-gray-900">{org.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                {org.type}
              </span>
              <TierBadge tier={org.tier} />
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6">

          {/* Compliance score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-700">Compliance Score</p>
              <ScoreBadge score={org.score} tier={org.tier} />
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
              <div
                className={`h-2 rounded-full transition-all ${SCORE_BAR[org.tier] ?? 'bg-gray-400'}`}
                style={{ width: `${org.score}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{doneCnt}/{checklist.length} requirements complete</p>
          </div>

          {/* Requirements checklist */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Requirements</p>
            <div className="space-y-2.5">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <ItemIcon status={item.status} />
                  <span className={`text-xs flex-1 leading-snug ${item.done ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                    {item.label}
                  </span>
                  {!item.done && item.docType && (
                    <button
                      onClick={() => onAction('request', org, item.docType)}
                      className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex-shrink-0"
                    >
                      Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Documents summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Documents</p>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {org.docs_uploaded ?? 0}
              <span className="text-gray-400 font-normal">/{org.docs_required ?? 0}</span>
              <span className="text-sm font-normal text-gray-400 ml-1">required</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {Number(org.docs_valid     ?? 0) > 0 && <span className="text-green-600  font-medium">✓ {org.docs_valid} valid</span>}
              {Number(org.docs_pending   ?? 0) > 0 && <span className="text-blue-600   font-medium">⏳ {org.docs_pending} pending</span>}
              {Number(org.docs_expiring  ?? 0) > 0 && <span className="text-orange-600 font-medium">⚠ {org.docs_expiring} expiring</span>}
              {Number(org.docs_expired   ?? 0) > 0 && <span className="text-red-500    font-medium">✗ {org.docs_expired} expired</span>}
              {Number(org.docs_rejected  ?? 0) > 0 && <span className="text-red-400    font-medium">✗ {org.docs_rejected} rejected</span>}
            </div>
            {expiry && (
              <p className={`text-xs font-medium mt-2 px-2 py-1 rounded-lg inline-flex items-center gap-1 ${expiry.cls}`}>
                <Clock className="w-3 h-3" /> {expiry.label}
              </p>
            )}
          </div>

          {/* Application */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Application</p>
            <p className={`text-sm font-medium ${al.cls}`}>{al.text}</p>
            {org.last_doc_upload && (
              <p className="text-xs text-gray-400 mt-1">Last activity: {fmtRelative(org.last_doc_upload)}</p>
            )}
          </div>
        </div>

        {/* Sticky action footer */}
        <div className="sticky bottom-0 bg-white border-t px-5 py-4 space-y-2">
          {missingItems.length > 0 && (
            <button
              onClick={() => onAction('request', org)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
            >
              <Zap className="w-4 h-4" />
              Fix Remaining Issues
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAction('remind', org)}
              className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-xs font-medium text-gray-600 rounded-xl hover:bg-gray-50"
            >
              <Bell className="w-3.5 h-3.5" /> Send Reminder
            </button>
            <button
              onClick={() => onAction('view', org)}
              className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-xs font-medium text-gray-600 rounded-xl hover:bg-gray-50"
            >
              <Eye className="w-3.5 h-3.5" /> View Documents
            </button>
          </div>
          {org.app_status && org.app_status !== 'approved' && (
            <button
              onClick={() => onAction('review', org)}
              className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-xs font-medium text-gray-600 rounded-xl hover:bg-gray-50"
            >
              <FileText className="w-3.5 h-3.5" /> Review Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Org Row ──────────────────────────────────────────────────────────────────

function OrgRow({ org, onSelect, onRemind, onRequest, reminding }) {
  const t       = TIER[org.tier] ?? TIER.compliant;
  const al      = appLabel(org.app_status);
  const expiry  = org.next_expiry ? fmtExpiry(org.next_expiry) : null;
  const missing = (org.missing_docs ?? []).length;

  return (
    <div
      className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50/70 cursor-pointer transition-colors group"
      onClick={() => onSelect(org)}
    >
      {/* Tier icon */}
      <t.Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${t.iconCls}`} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{org.name}</p>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
            {org.type}
          </span>
          <TierBadge tier={org.tier} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          {/* App status */}
          <span className={`text-xs ${al.cls}`}>{al.text}</span>

          {/* Doc fraction */}
          <span className="text-xs text-gray-400">
            <span className="font-medium text-gray-700">
              {org.docs_uploaded ?? 0}/{org.docs_required ?? 0}
            </span> docs
            {missing > 0 && (
              <span className="text-yellow-600 font-medium"> · {missing} missing</span>
            )}
            {Number(org.docs_expiring ?? 0) > 0 && (
              <span className="text-orange-600 font-medium"> · {org.docs_expiring} expiring</span>
            )}
            {Number(org.docs_expired ?? 0) > 0 && (
              <span className="text-red-500 font-medium"> · {org.docs_expired} expired</span>
            )}
          </span>

          {/* Expiry badge */}
          {expiry && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 ${expiry.cls}`}>
              <Clock className="w-2.5 h-2.5" />{expiry.label}
            </span>
          )}
        </div>
      </div>

      {/* Right: score + hover actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <ScoreBadge score={org.score} tier={org.tier} />
        <div
          className="hidden group-hover:flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onRemind(org)}
            disabled={reminding === org.id}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-50"
          >
            <Bell className="w-3 h-3" />
            {reminding === org.id ? '…' : 'Remind'}
          </button>
          <button
            onClick={() => onRequest(org)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Plus className="w-3 h-3" /> Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filters ─────────────────────────────────────────────────────────────────

const TYPE_TABS = [
  { value: '',        label: 'All' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'site',    label: 'Site' },
];
const STATUS_TABS = [
  { value: '',          label: 'All' },
  { value: 'compliant', label: '🟢 Compliant' },
  { value: 'pending',   label: '🔵 Pending' },
  { value: 'missing',   label: '🟡 Missing' },
  { value: 'expiring',  label: '🟠 Expiring' },
  { value: 'overdue',   label: '🔴 Overdue' },
];

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors
                  ${active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
    >
      {children}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const navigate = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [missingOnly,  setMissingOnly]  = useState(false);
  const [expiringOnly, setExpiringOnly] = useState(false);

  // UI state
  const [drawerOrg,    setDrawerOrg]    = useState(null);
  const [requestModal, setRequestModal] = useState(null); // { org, prefillType? }
  const [toast,        setToast]        = useState(null);
  const [reminding,    setReminding]    = useState(null); // orgId

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    setLoading(true);
    api.get('/compliance')
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtered org list
  const orgs = (data?.organizations ?? []).filter((o) => {
    if (typeFilter   && o.type !== typeFilter)             return false;
    if (statusFilter && o.tier !== statusFilter)           return false;
    if (missingOnly  && !(o.missing_docs?.length > 0))    return false;
    if (expiringOnly && !(Number(o.docs_expiring) > 0))   return false;
    if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const s = data?.summary ?? {};

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleRemind(org) {
    setReminding(org.id);
    try {
      await api.post(`/compliance/${org.id}/remind`, {});
      showToast(`Reminder sent to ${org.name}`);
    } catch {
      showToast('Failed to send reminder', 'error');
    } finally {
      setReminding(null);
    }
  }

  function handleAction(type, org, docType) {
    if (type === 'view')    { navigate(`/dashboard/sponsor/documents?org_id=${org.id}`); return; }
    if (type === 'review')  { navigate('/dashboard/sponsor/applications');                return; }
    if (type === 'request') { setRequestModal({ org, prefillType: docType ?? '' });       return; }
    if (type === 'remind')  { handleRemind(org);                                          return; }
  }

  // Summary card click → toggle filter
  function cardFilter(key) {
    if (key === 'kitchens') setTypeFilter((v) => v === 'kitchen' ? '' : 'kitchen');
    if (key === 'sites')    setTypeFilter((v) => v === 'site'    ? '' : 'site');
    if (key === 'missing')  setMissingOnly((v) => !v);
    if (key === 'expiring') setExpiringOnly((v) => !v);
  }

  // Keep drawer in sync if data reloads
  useEffect(() => {
    if (drawerOrg && data) {
      const fresh = data.organizations.find((o) => o.id === drawerOrg.id);
      if (fresh) setDrawerOrg(fresh);
    }
  }, [data]); // eslint-disable-line

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {toast && <Toast {...toast} />}

      {requestModal && (
        <RequestDocModal
          org={requestModal.org}
          prefillType={requestModal.prefillType}
          onClose={() => setRequestModal(null)}
          onSent={() => { load(); showToast('Document request sent'); }}
        />
      )}

      {drawerOrg && (
        <ComplianceDrawer
          org={drawerOrg}
          onClose={() => setDrawerOrg(null)}
          onAction={handleAction}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
          <p className="text-gray-500 text-sm mt-1">Track, request, and resolve — without leaving this page.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Kitchens"
          value={s.total_kitchens}
          sub={`${s.compliant ?? 0} compliant`}
          Icon={Building2}
          iconCls="bg-indigo-50 text-indigo-500"
          active={typeFilter === 'kitchen'}
          onClick={() => cardFilter('kitchens')}
        />
        <SummaryCard
          label="Sites"
          value={s.total_sites}
          sub={`${(s.overdue ?? 0) + (s.missing ?? 0)} need attention`}
          Icon={Users}
          iconCls="bg-purple-50 text-purple-500"
          active={typeFilter === 'site'}
          onClick={() => cardFilter('sites')}
        />
        <SummaryCard
          label="Missing Documents"
          value={s.missing_docs_orgs}
          sub="orgs with gaps"
          Icon={FileText}
          iconCls="bg-yellow-50 text-yellow-500"
          active={missingOnly}
          onClick={() => cardFilter('missing')}
        />
        <SummaryCard
          label="Expiring Soon"
          value={s.docs_expiring_soon}
          sub="documents (30 days)"
          Icon={AlertTriangle}
          iconCls="bg-orange-50 text-orange-500"
          active={expiringOnly}
          onClick={() => cardFilter('expiring')}
        />
      </div>

      {/* ── Alert banner ── */}
      {(Number(s.docs_expired) > 0 || Number(s.overdue) > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Action required</p>
            <p className="text-xs text-red-600 mt-0.5">
              {Number(s.docs_expired) > 0 && `${s.docs_expired} expired document${s.docs_expired !== 1 ? 's' : ''} across your program. `}
              {Number(s.overdue) > 0      && `${s.overdue} organization${s.overdue !== 1 ? 's' : ''} are overdue.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 space-y-3">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex flex-wrap gap-2 items-center">
          {/* Type */}
          <div className="flex gap-1">
            {TYPE_TABS.map((f) => (
              <FilterBtn key={f.value} active={typeFilter === f.value} onClick={() => setTypeFilter(f.value)}>
                {f.label}
              </FilterBtn>
            ))}
          </div>
          <div className="h-5 w-px bg-gray-200" />
          {/* Status */}
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((f) => (
              <FilterBtn key={f.value} active={statusFilter === f.value} onClick={() => setStatusFilter(f.value)}>
                {f.label}
              </FilterBtn>
            ))}
          </div>
          <div className="h-5 w-px bg-gray-200" />
          {/* Quick toggles */}
          <button
            onClick={() => setMissingOnly((v) => !v)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors
                        ${missingOnly ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Missing only
          </button>
          <button
            onClick={() => setExpiringOnly((v) => !v)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors
                        ${expiringOnly ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Expiring this month
          </button>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-3 px-1">
          {orgs.length} of {data?.organizations?.length ?? 0} organizations
          {(typeFilter || statusFilter || missingOnly || expiringOnly || search) && ' (filtered)'}
          {' · Click any row to open compliance details'}
        </p>
      )}

      {/* ── Org list ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-gray-200" />
          <p className="text-sm">No organizations match this filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {orgs.map((org) => (
              <OrgRow
                key={org.id}
                org={org}
                onSelect={setDrawerOrg}
                onRemind={handleRemind}
                onRequest={(o) => setRequestModal({ org: o, prefillType: '' })}
                reminding={reminding}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
