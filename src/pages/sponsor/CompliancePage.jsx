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
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, Shield, AlertTriangle, XCircle,
  CheckCircle, Clock, Building2, FileText, RefreshCw, Users,
  Bell, Plus, Eye, X, Zap, AlertCircle, Upload,
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

// ─── Upload Document Modal ────────────────────────────────────────────────────

function UploadDocModal({ orgs, preselectedOrg, prefilledDocType, onClose, onUploaded }) {
  const [orgId,     setOrgId]    = useState(preselectedOrg?.id ?? '');
  const [docType,   setDocType]  = useState(prefilledDocType ?? '');
  const [label,     setLabel]    = useState(
    prefilledDocType ? (ALL_DOC_OPTIONS.find((o) => o.value === prefilledDocType)?.label ?? '') : ''
  );
  const [expiresAt, setExpiresAt] = useState('');
  const [file,      setFile]     = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]    = useState('');

  const selectedOrg   = orgs.find((o) => o.id === orgId);
  const missingForOrg = new Set(selectedOrg?.missing_docs ?? []);
  const requiredKeys  = new Set((REQUIRED_DOCS[selectedOrg?.type] ?? []).map((r) => r.key));

  // All doc options for this org's type, plus general
  const docOptions = selectedOrg
    ? ALL_DOC_OPTIONS.filter((d) => requiredKeys.has(d.value) || d.value === 'general')
    : ALL_DOC_OPTIONS;

  function handleDocTypeChange(val) {
    setDocType(val);
    if (!label) setLabel(docOptions.find((o) => o.value === val)?.label ?? '');
  }

  async function upload() {
    if (!orgId || !docType || !label || !file) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file',     file);
      fd.append('doc_type', docType);
      fd.append('label',    label);
      fd.append('org_id',   orgId);
      if (expiresAt) fd.append('expires_at', expiresAt);
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  const canSubmit = orgId && docType && label && file && !uploading;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="font-bold text-gray-900 text-sm">Upload Document</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Org picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Upload for</label>
            <select
              value={orgId}
              onChange={(e) => { setOrgId(e.target.value); setDocType(''); setLabel(''); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              <option value="">Select site or kitchen…</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
              ))}
            </select>
          </div>

          {/* Doc type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document type</label>
            <select
              value={docType}
              onChange={(e) => handleDocTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              <option value="">Select…</option>
              {docOptions.map((o) => {
                const isMissing  = missingForOrg.has(o.value);
                const isRequired = requiredKeys.has(o.value);
                const suffix = isMissing ? ' — Missing (required)' : isRequired ? ' — Required' : '';
                return (
                  <option key={o.value} value={o.value}>{o.label}{suffix}</option>
                );
              })}
            </select>
            {docType && missingForOrg.has(docType) && (
              <p className="mt-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1.5 rounded-lg">
                ✓ This will satisfy a missing requirement for {selectedOrg?.name}
              </p>
            )}
            {docType && requiredKeys.has(docType) && !missingForOrg.has(docType) && (
              <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                This org already has this document — uploading will replace the current version.
              </p>
            )}
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 2024 Health Inspection"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Expiry date (optional)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          {/* File picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">File</label>
            <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm
              ${file ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 hover:border-brand-400 text-gray-500'}`}>
              <Upload className="w-4 h-4" />
              {file ? file.name : 'Click to choose a file'}
              <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
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
            onClick={upload}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Doc status config ────────────────────────────────────────────────────────

const DOC_STATUS = {
  valid:          { label: 'Valid',          cls: 'bg-green-100  text-green-700' },
  expiring_soon:  { label: 'Expiring Soon',  cls: 'bg-orange-100 text-orange-700' },
  expired:        { label: 'Expired',        cls: 'bg-red-100    text-red-700' },
  pending_review: { label: 'Pending Review', cls: 'bg-blue-100   text-blue-700' },
  requested:      { label: 'Requested',      cls: 'bg-purple-100 text-purple-700' },
  rejected:       { label: 'Rejected',       cls: 'bg-red-100    text-red-700' },
};

// ─── Compliance Drawer ────────────────────────────────────────────────────────

function ComplianceDrawer({ org, orgDocs, onClose, onAction }) {
  const required = REQUIRED_DOCS[org.type] ?? [];
  const al       = appLabel(org.app_status);

  // Build latest-version map per doc_type from actual doc records
  const docsByType = {};
  for (const d of orgDocs) {
    if (d.file_url || d.status === 'requested') {
      if (!docsByType[d.doc_type] || (d.version ?? 0) > (docsByType[d.doc_type].version ?? 0)) {
        docsByType[d.doc_type] = d;
      }
    }
  }

  const requiredTypes = new Set(required.map((r) => r.key));
  const missingCount  = required.filter((r) => {
    const doc = docsByType[r.key];
    return !doc || doc.status === 'expired' || doc.status === 'rejected';
  }).length;

  const doneCnt  = required.length - missingCount;
  const hasMissing = missingCount > 0;

  // Extra (non-required) docs uploaded for this org
  const extraDocs = orgDocs.filter(
    (d) => d.file_url && !requiredTypes.has(d.doc_type) && d.status !== 'superseded'
  );

  function DocStatusPill({ status }) {
    const cfg = DOC_STATUS[status] ?? { label: 'Missing', cls: 'bg-gray-100 text-gray-500' };
    return (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
    );
  }

  function needsAction(doc) {
    return !doc || ['expired', 'rejected', undefined].includes(doc?.status);
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
            <p className="text-xs text-gray-400">{doneCnt}/{required.length} required documents</p>
          </div>

          {/* Required documents — actual records */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Required Documents</p>
            <div className="space-y-3">
              {required.map((req) => {
                const doc     = docsByType[req.key];
                const missing = needsAction(doc);
                const expiry  = doc?.expires_at ? fmtExpiry(doc.expires_at) : null;

                return (
                  <div key={req.key} className={`rounded-xl p-3 border ${missing ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {missing
                          ? <div className="w-4 h-4 rounded-full border-2 border-red-300 flex-shrink-0" />
                          : <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        }
                        <span className={`text-xs font-semibold truncate ${missing ? 'text-red-800' : 'text-gray-800'}`}>
                          {req.label}
                        </span>
                      </div>
                      <DocStatusPill status={doc?.status ?? 'missing'} />
                    </div>

                    {doc && doc.label && (
                      <p className="text-[11px] text-gray-500 ml-5.5 truncate">{doc.label}</p>
                    )}
                    {expiry && (
                      <p className={`text-[10px] font-medium ml-5.5 mt-0.5 ${expiry.cls}`}>{expiry.label}</p>
                    )}

                    {/* Actions for missing/expired/rejected docs */}
                    {missing && (
                      <div className="flex gap-2 mt-2 ml-5.5">
                        <button
                          onClick={() => onAction('request', org, req.key)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
                        >
                          <Bell className="w-2.5 h-2.5" /> Request
                        </button>
                        <button
                          onClick={() => onAction('upload', org, req.key)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100"
                        >
                          <Upload className="w-2.5 h-2.5" /> Upload
                        </button>
                      </div>
                    )}
                    {/* Replace button for expiring docs */}
                    {!missing && doc?.status === 'expiring_soon' && (
                      <div className="mt-2 ml-5.5">
                        <button
                          onClick={() => onAction('upload', org, req.key)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100"
                        >
                          <Upload className="w-2.5 h-2.5" /> Upload new version
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extra (non-required) docs */}
          {extraDocs.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Additional Documents</p>
              <div className="space-y-2">
                {extraDocs.map((doc) => {
                  const expiry = doc.expires_at ? fmtExpiry(doc.expires_at) : null;
                  return (
                    <div key={doc.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                      <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 truncate">{doc.label || doc.doc_type}</p>
                        {expiry && <p className={`text-[10px] ${expiry.cls}`}>{expiry.label}</p>}
                      </div>
                      <DocStatusPill status={doc.status} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
          <button
            onClick={() => onAction('upload', org, '')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAction('remind', org)}
              className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-xs font-medium text-gray-600 rounded-xl hover:bg-gray-50"
            >
              <Bell className="w-3.5 h-3.5" /> Send Reminder
            </button>
            {org.app_status && org.app_status !== 'approved' && (
              <button
                onClick={() => onAction('review', org)}
                className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-xs font-medium text-gray-600 rounded-xl hover:bg-gray-50"
              >
                <FileText className="w-3.5 h-3.5" /> Review App
              </button>
            )}
          </div>
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
  const navigate               = useNavigate();
  const [searchParams]         = useSearchParams();

  const [data,    setData]    = useState(null);
  const [allDocs, setAllDocs] = useState([]);
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
  const [uploadModal,  setUploadModal]  = useState(null); // { org, prefillType? } — null means closed
  const [toast,        setToast]        = useState(null);
  const [reminding,    setReminding]    = useState(null); // orgId

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/compliance'),
      api.get('/documents?limit=500'),
    ]).then(([compRes, docsRes]) => {
      const compData = compRes.data;
      setData(compData);
      setAllDocs(docsRes.data?.documents ?? []);
      // Auto-open drawer when ?org=<uuid> is in URL
      const orgParam = searchParams.get('org');
      if (orgParam && compData?.organizations) {
        const match = compData.organizations.find((o) => o.id === orgParam);
        if (match) setDrawerOrg(match);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [searchParams]);

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

  // ── Bulk state ──────────────────────────────────────────────────────────────
  const [bulkReminding,  setBulkReminding]  = useState(false);
  const [bulkDocType,    setBulkDocType]    = useState('');
  const [bulkRequesting, setBulkRequesting] = useState(false);
  const [showBulkReq,    setShowBulkReq]   = useState(false);

  // Non-compliant visible orgs (for Remind All)
  const nonCompliantOrgs = orgs.filter((o) => o.tier !== 'compliant');

  // Orgs missing the selected bulk doc type (for Request from All)
  const orgsMissingDoc = bulkDocType
    ? orgs.filter((o) => (o.missing_docs ?? []).includes(bulkDocType))
    : [];

  async function handleBulkRemind() {
    if (!nonCompliantOrgs.length) return;
    setBulkReminding(true);
    try {
      const ids = nonCompliantOrgs.map((o) => o.id);
      const { data: r } = await api.post('/compliance/remind-bulk', { org_ids: ids });
      showToast(`Reminder sent to ${r.orgs_reached} org${r.orgs_reached !== 1 ? 's' : ''}`);
    } catch {
      showToast('Failed to send bulk reminders', 'error');
    } finally {
      setBulkReminding(false);
    }
  }

  async function handleBulkRequest() {
    if (!bulkDocType || !orgsMissingDoc.length) return;
    const docLabel = ALL_DOC_OPTIONS.find((d) => d.value === bulkDocType)?.label ?? bulkDocType;
    setBulkRequesting(true);
    try {
      const ids = orgsMissingDoc.map((o) => o.id);
      const { data: r } = await api.post('/compliance/request-bulk', {
        org_ids:  ids,
        doc_type: bulkDocType,
        label:    docLabel,
      });
      showToast(`Requested ${docLabel} from ${r.created} org${r.created !== 1 ? 's' : ''}`);
      setShowBulkReq(false);
      setBulkDocType('');
      load();
    } catch {
      showToast('Failed to send bulk requests', 'error');
    } finally {
      setBulkRequesting(false);
    }
  }

  function handleAction(type, org, docType) {
    if (type === 'view')    { navigate(`/dashboard/sponsor/documents?org_id=${org.id}`); return; }
    if (type === 'review')  { navigate('/dashboard/sponsor/applications');                return; }
    if (type === 'request') { setRequestModal({ org, prefillType: docType ?? '' });       return; }
    if (type === 'remind')  { handleRemind(org);                                          return; }
    if (type === 'upload')  { setUploadModal({ org, prefillType: docType ?? '' });       return; }
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

      {uploadModal !== null && (
        <UploadDocModal
          orgs={data?.organizations ?? []}
          preselectedOrg={uploadModal.org ?? null}
          prefilledDocType={uploadModal.prefillType ?? ''}
          onClose={() => setUploadModal(null)}
          onUploaded={() => { load(); showToast('Document uploaded successfully'); }}
        />
      )}

      {drawerOrg && (
        <ComplianceDrawer
          org={drawerOrg}
          orgDocs={allDocs.filter((d) => d.org_id === drawerOrg.id && d.status !== 'superseded')}
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUploadModal({})}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
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

      {/* ── Bulk Actions bar ── */}
      {!loading && orgs.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
            Bulk actions — {orgs.length} org{orgs.length !== 1 ? 's' : ''} visible
          </span>

          {/* Remind All Non-Compliant */}
          <button
            onClick={handleBulkRemind}
            disabled={bulkReminding || nonCompliantOrgs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-yellow-500" />
            {bulkReminding
              ? 'Sending…'
              : `Remind Non-Compliant (${nonCompliantOrgs.length})`}
          </button>

          {/* Request Doc from All Missing */}
          <div className="relative">
            <button
              onClick={() => setShowBulkReq((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-xl transition-colors
                ${showBulkReq
                  ? 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <Plus className="w-3.5 h-3.5 text-brand-500" />
              Request Doc from All Missing
            </button>

            {showBulkReq && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 w-72">
                <p className="text-xs font-bold text-gray-700 mb-2">Select document type</p>
                <select
                  value={bulkDocType}
                  onChange={(e) => setBulkDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Choose a doc type…</option>
                  {ALL_DOC_OPTIONS.filter((d) => d.value !== 'general').map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>

                {bulkDocType && (
                  <p className="text-[11px] text-gray-500 mb-3">
                    {orgsMissingDoc.length === 0
                      ? 'No visible orgs are missing this document.'
                      : `${orgsMissingDoc.length} org${orgsMissingDoc.length !== 1 ? 's' : ''} missing this — a request will be sent to each.`}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowBulkReq(false); setBulkDocType(''); }}
                    className="flex-1 py-1.5 text-xs border border-gray-200 rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkRequest}
                    disabled={bulkRequesting || !bulkDocType || orgsMissingDoc.length === 0}
                    className="flex-1 py-1.5 text-xs bg-brand-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-brand-700 transition-colors"
                  >
                    {bulkRequesting ? 'Sending…' : `Send to ${orgsMissingDoc.length}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
