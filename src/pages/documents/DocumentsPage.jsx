// DocumentsPage.jsx — Compliance Management System
//
// Sponsor / Coordinator: sees all program docs grouped by org.
//   Required doc checklist per org, missing docs highlighted, approve/reject,
//   "Request Document" sends a due-dated request + notification to the org.
//
// Kitchen / Site: sees own docs + any docs sent to them by sponsor.
//   Action items (requested + rejected) shown first.
//   Direct upload from this page (no need to go through application).

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, FileText, CheckCircle, Clock, XCircle, AlertTriangle,
  Plus, Search, Eye, ChevronDown, ChevronUp, Building2, ChefHat,
  Send, Calendar, X, Bell, RefreshCw, Shield, Inbox, Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─── Required docs per org type ──────────────────────────────────────────────
const REQUIRED_DOCS = {
  kitchen: [
    { doc_type: 'w9',          label: 'W-9 Form',              hint: 'IRS W-9 for tax reporting' },
    { doc_type: 'food_permit', label: 'Food Service Permit',   hint: 'Valid food handler / sanitation permit' },
    { doc_type: 'insurance',   label: 'Liability Insurance',   hint: 'General liability certificate of insurance' },
    { doc_type: 'menu_plan',   label: 'Menu Plan',             hint: 'Approved CACFP menu cycle' },
    { doc_type: 'health_cert', label: 'Health Certificate',    hint: 'Health department inspection certificate' },
  ],
  site: [
    { doc_type: 'enrollment',  label: 'Enrollment Records',    hint: 'Current participant enrollment documentation' },
    { doc_type: 'license',     label: 'Child Care License',    hint: 'State-issued child care license' },
    { doc_type: 'insurance',   label: 'Liability Insurance',   hint: 'General liability certificate of insurance' },
    { doc_type: 'health_cert', label: 'Health Certificate',    hint: 'Health department certificate' },
  ],
};

const ALL_DOC_TYPES = [
  { value: 'w9',          label: 'W-9 Form' },
  { value: 'food_permit', label: 'Food Service Permit' },
  { value: 'insurance',   label: 'Liability Insurance' },
  { value: 'menu_plan',   label: 'Menu Plan' },
  { value: 'health_cert', label: 'Health Certificate' },
  { value: 'enrollment',  label: 'Enrollment Records' },
  { value: 'license',     label: 'Child Care License' },
  { value: 'other',       label: 'Other' },
];

const STATUS_CFG = {
  valid:          { label: 'Approved',       dot: 'bg-green-500',  pill: 'bg-green-100 text-green-800 border-green-200' },
  approved:       { label: 'Approved',       dot: 'bg-green-500',  pill: 'bg-green-100 text-green-800 border-green-200' },
  pending_review: { label: 'Pending Review', dot: 'bg-blue-400',   pill: 'bg-blue-50 text-blue-800 border-blue-200' },
  expiring_soon:  { label: 'Expiring Soon',  dot: 'bg-yellow-400', pill: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  expired:        { label: 'Expired',        dot: 'bg-red-500',    pill: 'bg-red-50 text-red-800 border-red-200' },
  rejected:       { label: 'Rejected',       dot: 'bg-red-500',    pill: 'bg-red-50 text-red-800 border-red-200' },
  requested:      { label: 'Requested',      dot: 'bg-purple-400', pill: 'bg-purple-50 text-purple-800 border-purple-200' },
  missing:        { label: 'Missing',        dot: 'bg-gray-300',   pill: 'bg-gray-100 text-gray-500 border-gray-200' },
  superseded:     { label: 'Superseded',     dot: 'bg-gray-300',   pill: 'bg-gray-100 text-gray-400 border-gray-200' },
};

const STATUS_FILTERS = [
  { label: 'All',           value: '' },
  { label: 'Approved',      value: 'valid' },
  { label: 'Pending',       value: 'pending_review' },
  { label: 'Rejected',      value: 'rejected' },
  { label: 'Expiring Soon', value: 'expiring_soon' },
  { label: 'Expired',       value: 'expired' },
  { label: 'Missing',       value: 'missing' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function isApproved(s) { return s === 'valid' || s === 'approved'; }

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.missing;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, color, onClick, active }) {
  const colorMap = {
    green:  { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  icon: 'text-green-500' },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',   icon: 'text-blue-500' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200',text: 'text-yellow-700', icon: 'text-yellow-500' },
    red:    { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    icon: 'text-red-500' },
    gray:   { bg: 'bg-gray-50',   border: 'border-gray-200',  text: 'text-gray-600',   icon: 'text-gray-400' },
  };
  const c = colorMap[color] ?? colorMap.gray;
  return (
    <button
      onClick={onClick}
      className={`card px-4 py-3 flex items-center gap-3 text-left transition-all
        ${active ? `${c.bg} ${c.border} ring-2 ring-offset-1 ring-${color}-300` : 'hover:shadow-md'}`}
    >
      <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4.5 h-4.5 ${c.icon}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      </div>
    </button>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUploaded, prefill, targetOrgId }) {
  const fileRef = useRef(null);
  const [file,      setFile]      = useState(null);
  const [docType,   setDocType]   = useState(prefill?.doc_type ?? 'other');
  const [label,     setLabel]     = useState(prefill?.label ?? '');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    if (!label.trim()) { setError('Please add a label.'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', docType);
      fd.append('label', label.trim());
      if (expiresAt) fd.append('expires_at', expiresAt);
      if (targetOrgId) fd.append('org_id', targetOrgId);
      const { data } = await api.post('/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(data.document ?? data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Upload failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!label) setLabel(f.name.replace(/\.[^/.]+$/, ''));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Upload Document</h2>
            {prefill && (
              <p className="text-xs text-purple-600 font-medium mt-0.5">
                Responding to request: {prefill.label}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${file ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
          >
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFileChange} />
            <Upload className={`w-7 h-7 mx-auto mb-2 ${file ? 'text-brand-500' : 'text-gray-300'}`} />
            {file ? (
              <>
                <p className="text-sm font-semibold text-brand-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-600">Click to select file</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG, DOCX · Max 20 MB</p>
              </>
            )}
          </div>

          {/* Doc type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Document Type</label>
            <select
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value);
                const found = ALL_DOC_TYPES.find((d) => d.value === e.target.value);
                if (found && found.value !== 'other') setLabel(found.label);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {ALL_DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Label <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. W-9 2024 or Health Permit Renewal"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Expiry date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Expiration Date <span className="text-gray-400 font-normal normal-case">(optional — set for auto-reminders)</span>
            </label>
            <input
              type="date"
              value={expiresAt}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || !file}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? 'Uploading…' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Request Document Modal (Sponsor/Coordinator) ─────────────────────────────
function RequestDocModal({ orgs, onClose, onRequested }) {
  const [orgId,    setOrgId]    = useState('');
  const [docType,  setDocType]  = useState('other');
  const [label,    setLabel]    = useState('');
  const [dueDate,  setDueDate]  = useState('');
  const [message,  setMessage]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgId || !label.trim()) { setError('Please select an organization and add a document label.'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/documents/request', {
        org_id:   orgId,
        doc_type: docType,
        label:    label.trim(),
        due_date: dueDate || null,
        message:  message.trim() || null,
      });
      onRequested(data.document);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to send request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Request Document</h2>
            <p className="text-xs text-gray-400 mt-0.5">Send a request with a due date and message</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Org picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Organization <span className="text-red-500">*</span></label>
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select organization…</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.org_type ?? 'org'})
                </option>
              ))}
            </select>
          </div>

          {/* Doc type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Document Type</label>
            <select
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value);
                const found = ALL_DOC_TYPES.find((d) => d.value === e.target.value);
                if (found && found.value !== 'other') setLabel(found.label);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {ALL_DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Document Name <span className="text-red-500">*</span></label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 2024 Health Certificate"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Due Date</label>
            <input type="date" value={dueDate} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Message <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
              placeholder="e.g. Please upload your updated health certificate for the new year."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              {saving ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ doc, onClose, onRejected }) {
  const [reason,  setReason]  = useState('');
  const [saving,  setSaving]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/documents/${doc.id}/status`, { status: 'rejected', rejection_note: reason.trim() });
      onRejected(doc.id, reason.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Reject Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500">
            Rejecting <span className="font-semibold text-gray-800">{doc.label || doc.doc_type}</span> from <span className="font-semibold text-gray-800">{doc.org_name ?? 'this org'}</span>. The uploader will be notified.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Reason <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} autoFocus
              placeholder="e.g. Document is expired. Please upload a current version."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={!reason.trim() || saving}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? 'Rejecting…' : 'Reject Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Document Row ─────────────────────────────────────────────────────────────
function DocRow({ doc, isReviewer, onApprove, onRejectClick, onUploadAgainst, versions }) {
  const [expanded, setExpanded] = useState(false);
  const isFileDoc = doc.file_url && doc.file_url !== '';
  const hasVersions = versions && versions.length > 1;

  return (
    <div className={`rounded-xl border transition-colors ${
      doc.status === 'rejected'      ? 'border-red-200 bg-red-50/30' :
      doc.status === 'expiring_soon' ? 'border-yellow-200 bg-yellow-50/20' :
      doc.status === 'requested'     ? 'border-purple-200 bg-purple-50/20' :
      isApproved(doc.status)         ? 'border-green-100 bg-white' :
      'border-gray-200 bg-white'
    }`}>
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isApproved(doc.status)         ? 'bg-green-100' :
          doc.status === 'rejected'      ? 'bg-red-100' :
          doc.status === 'pending_review'? 'bg-blue-100' :
          doc.status === 'expiring_soon' ? 'bg-yellow-100' :
          doc.status === 'requested'     ? 'bg-purple-100' :
          'bg-gray-100'
        }`}>
          <FileText className={`w-4 h-4 ${
            isApproved(doc.status)         ? 'text-green-600' :
            doc.status === 'rejected'      ? 'text-red-500' :
            doc.status === 'pending_review'? 'text-blue-500' :
            doc.status === 'expiring_soon' ? 'text-yellow-600' :
            doc.status === 'requested'     ? 'text-purple-500' :
            'text-gray-400'
          }`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">{doc.label || doc.doc_type}</p>
            <StatusPill status={doc.status} />
            {doc.version > 1 && (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                v{doc.version}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            {doc.org_name && (
              <span className="text-xs text-gray-500 font-medium">{doc.org_name}</span>
            )}
            {doc.file_name && (
              <span className="text-xs text-gray-400 truncate max-w-[160px]">{doc.file_name}</span>
            )}
            {doc.uploaded_at && (
              <span className="text-xs text-gray-400">
                {doc.status === 'requested' ? `Requested ${fmtDate(doc.uploaded_at)}` : `Uploaded ${fmtDate(doc.uploaded_at)}`}
              </span>
            )}
            {doc.expires_at && doc.status !== 'requested' && (
              <span className={`text-xs font-medium ${
                doc.days_until_expiry < 0    ? 'text-red-600' :
                doc.days_until_expiry <= 14  ? 'text-red-500' :
                doc.days_until_expiry <= 30  ? 'text-yellow-600' :
                'text-gray-400'
              }`}>
                {doc.days_until_expiry < 0
                  ? `Expired ${Math.abs(doc.days_until_expiry)}d ago`
                  : doc.days_until_expiry === 0
                  ? 'Expires today'
                  : `Expires ${fmtDate(doc.expires_at)}`}
              </span>
            )}
            {doc.status === 'requested' && doc.expires_at && (
              <span className="text-xs font-semibold text-purple-600">Due {fmtDate(doc.expires_at)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* View */}
          {isFileDoc && (
            <a href={doc.file_url} target="_blank" rel="noreferrer"
              className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View">
              <Eye className="w-4 h-4" />
            </a>
          )}

          {/* Reviewer actions */}
          {isReviewer && doc.status === 'pending_review' && isFileDoc && (
            <>
              <button onClick={() => onApprove(doc.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg">
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button onClick={() => onRejectClick(doc)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-red-300 text-red-700 hover:bg-red-50 rounded-lg">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}

          {/* Uploader — re-upload on rejected */}
          {!isReviewer && doc.status === 'rejected' && (
            <button onClick={() => onUploadAgainst(doc)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700">
              <Upload className="w-3.5 h-3.5" /> Re-upload
            </button>
          )}
          {!isReviewer && doc.status === 'requested' && (
            <button onClick={() => onUploadAgainst(doc)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Upload className="w-3.5 h-3.5" /> Upload Now
            </button>
          )}

          {/* Version history toggle */}
          {hasVersions && (
            <button onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {doc.rejection_note && doc.status !== 'requested' && (
        <div className="mx-4 mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs font-semibold text-red-700 mb-0.5">
            {doc.status === 'rejected' ? 'Rejection reason:' : 'Note:'}
          </p>
          <p className="text-xs text-red-600">{doc.rejection_note}</p>
        </div>
      )}

      {/* Request message */}
      {doc.rejection_note && doc.status === 'requested' && (
        <div className="mx-4 mb-3 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
          <p className="text-xs font-semibold text-purple-700 mb-0.5">Message from sponsor:</p>
          <p className="text-xs text-purple-600">{doc.rejection_note}</p>
        </div>
      )}

      {/* Version history */}
      {expanded && hasVersions && (
        <div className="mx-4 mb-3 border-t border-gray-100 pt-2">
          <p className="text-xs font-semibold text-gray-400 mb-1.5 px-1">Version History</p>
          {versions.map((v) => (
            <div key={v.id} className="flex items-center gap-3 py-1.5 px-1">
              <span className="text-xs text-gray-400 w-5">v{v.version}</span>
              <StatusPill status={v.status} />
              <span className="text-xs text-gray-400 flex-1">{v.file_name ?? v.label}</span>
              <span className="text-xs text-gray-400">{fmtDate(v.uploaded_at)}</span>
              {v.file_url && v.file_url !== '' && (
                <a href={v.file_url} target="_blank" rel="noreferrer"
                  className="text-xs text-brand-600 hover:underline">View</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Org compliance section (sponsor view) ────────────────────────────────────
function OrgSection({ org, docs, onApprove, onRejectClick, onRequestDoc, onUploadDoc }) {
  const [collapsed, setCollapsed] = useState(false);
  const required   = REQUIRED_DOCS[org.org_type] ?? [];

  // Latest uploaded doc per doc_type (filter out 'requested' and 'superseded' placeholders)
  const uploaded   = docs.filter((d) => d.org_id === org.id && d.file_url && d.file_url !== '');
  const latestMap  = {};
  for (const d of uploaded) {
    if (!latestMap[d.doc_type] || latestMap[d.doc_type].version < d.version) {
      latestMap[d.doc_type] = d;
    }
  }

  // All versions per doc_type for history
  const versionsMap = {};
  for (const d of uploaded) {
    if (!versionsMap[d.doc_type]) versionsMap[d.doc_type] = [];
    versionsMap[d.doc_type].push(d);
  }

  // Pending requests
  const requests   = docs.filter((d) => d.org_id === org.id && d.status === 'requested');

  // Compliance score based on required docs
  const approvedCount = required.filter((r) => isApproved(latestMap[r.doc_type]?.status)).length;
  const pct = required.length > 0 ? Math.round((approvedCount / required.length) * 100) : 100;
  const missing = required.filter((r) => !latestMap[r.doc_type]);

  // Extra (non-required) uploaded docs
  const requiredTypes = new Set(required.map((r) => r.doc_type));
  const extras = Object.values(latestMap).filter((d) => !requiredTypes.has(d.doc_type));

  const orgIcon = org.org_type === 'kitchen' ? ChefHat : Building2;
  const OrgIcon = orgIcon;

  const pillColor = pct === 100 ? 'text-green-700 bg-green-100' :
                    pct >= 60   ? 'text-yellow-700 bg-yellow-100' :
                                  'text-red-700 bg-red-100';

  return (
    <div className="card overflow-hidden mb-4">
      {/* Org header */}
      <div
        className="px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
          <OrgIcon className="w-4.5 h-4.5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900 truncate">{org.name}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pillColor}`}>
              {pct}% compliant
            </span>
            {missing.length > 0 && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                {missing.length} missing
              </span>
            )}
            {requests.length > 0 && (
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                {requests.length} requested
              </span>
            )}
          </div>
          {/* Compliance bar */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {approvedCount}/{required.length} approved
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRequestDoc(org); }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Bell className="w-3.5 h-3.5" /> Request
          </button>
          {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-gray-100 px-5 py-3 space-y-2">
          {/* Required docs */}
          {required.map((req) => {
            const latest   = latestMap[req.doc_type];
            const versions = versionsMap[req.doc_type] ?? [];
            if (latest) {
              return (
                <DocRow key={req.doc_type} doc={{ ...latest, org_name: org.name }}
                  isReviewer onApprove={onApprove} onRejectClick={onRejectClick}
                  onUploadAgainst={() => {}} versions={versions} />
              );
            }
            // Check for active request
            const pendingReq = requests.find((r) => r.doc_type === req.doc_type);
            if (pendingReq) {
              return (
                <DocRow key={req.doc_type} doc={{ ...pendingReq, org_name: org.name }}
                  isReviewer onApprove={onApprove} onRejectClick={onRejectClick}
                  onUploadAgainst={() => {}} versions={[]} />
              );
            }
            // Missing
            return (
              <div key={req.doc_type}
                className="flex items-center gap-3 py-2.5 px-4 rounded-xl border border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-500">{req.label}</p>
                  <p className="text-xs text-gray-400">{req.hint}</p>
                </div>
                <StatusPill status="missing" />
                <button
                  onClick={() => onRequestDoc(org, req)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-purple-700 border border-purple-200 hover:bg-purple-50 rounded-lg"
                >
                  <Send className="w-3 h-3" /> Request
                </button>
              </div>
            );
          })}

          {/* Extra (non-required) docs */}
          {extras.map((doc) => (
            <DocRow key={doc.id} doc={{ ...doc, org_name: org.name }}
              isReviewer onApprove={onApprove} onRejectClick={onRejectClick}
              onUploadAgainst={() => {}} versions={versionsMap[doc.doc_type] ?? []} />
          ))}

          {required.length === 0 && extras.length === 0 && requests.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No documents yet</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sponsor / Coordinator view ───────────────────────────────────────────────
function ProgramDocumentsView() {
  const [docs,     setDocs]     = useState([]);
  const [orgs,     setOrgs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('');
  const [showReq,  setShowReq]  = useState(false);
  const [prefillReq, setPrefillReq] = useState(null); // { org, docType }
  const [rejectDoc,  setRejectDoc]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, kitRes, siteRes] = await Promise.all([
        api.get('/documents'),
        api.get('/organizations?type=kitchen'),
        api.get('/organizations?type=site'),
      ]);
      const allDocs = docsRes.data.documents ?? docsRes.data;
      const kList   = kitRes.data.organizations ?? kitRes.data ?? [];
      const sList   = siteRes.data.organizations ?? siteRes.data ?? [];
      setDocs(allDocs);
      setOrgs([...kList, ...sList]);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (docId) => {
    await api.patch(`/documents/${docId}/status`, { status: 'valid' });
    setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'valid' } : d));
  };

  const handleRejected = (docId, reason) => {
    setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'rejected', rejection_note: reason } : d));
  };

  const handleRequested = (doc) => {
    setDocs((prev) => [doc, ...prev]);
  };

  // Summary counts
  const programDocs = docs.filter((d) => d.file_url && d.file_url !== '');
  const counts = {
    approved:  programDocs.filter((d) => isApproved(d.status)).length,
    pending:   programDocs.filter((d) => d.status === 'pending_review').length,
    expiring:  programDocs.filter((d) => d.status === 'expiring_soon').length,
    requested: docs.filter((d) => d.status === 'requested').length,
    missing: orgs.reduce((sum, o) => {
      const req = REQUIRED_DOCS[o.org_type] ?? [];
      const uploaded = new Set(docs.filter((d) => d.org_id === o.id && d.file_url && d.file_url !== '').map((d) => d.doc_type));
      return sum + req.filter((r) => !uploaded.has(r.doc_type)).length;
    }, 0),
  };

  // Filter orgs based on search + status filter
  let filteredOrgs = orgs;
  if (search) {
    const q = search.toLowerCase();
    filteredOrgs = orgs.filter((o) =>
      o.name.toLowerCase().includes(q) ||
      docs.some((d) => d.org_id === o.id && (d.label ?? '').toLowerCase().includes(q))
    );
  }
  if (filter) {
    if (filter === 'missing') {
      filteredOrgs = filteredOrgs.filter((o) => {
        const req = REQUIRED_DOCS[o.org_type] ?? [];
        const uploaded = new Set(docs.filter((d) => d.org_id === o.id && d.file_url && d.file_url !== '').map((d) => d.doc_type));
        return req.some((r) => !uploaded.has(r.doc_type));
      });
    } else {
      filteredOrgs = filteredOrgs.filter((o) =>
        docs.some((d) => d.org_id === o.id && d.status === filter)
      );
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-brand-600" />
            <h1 className="text-2xl font-bold text-gray-900">Compliance Center</h1>
          </div>
          <p className="text-sm text-gray-500">Review documents across all kitchens and sites in your program.</p>
        </div>
        <button
          onClick={() => { setPrefillReq(null); setShowReq(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex-shrink-0"
        >
          <Send className="w-4 h-4" /> Request Document
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <SummaryCard icon={CheckCircle} label="Approved"      value={counts.approved}  color="green"  onClick={() => setFilter(filter === 'valid'          ? '' : 'valid')}          active={filter === 'valid'} />
        <SummaryCard icon={Clock}       label="Pending"       value={counts.pending}   color="blue"   onClick={() => setFilter(filter === 'pending_review'  ? '' : 'pending_review')} active={filter === 'pending_review'} />
        <SummaryCard icon={Bell}        label="Requested"     value={counts.requested} color="gray"   onClick={() => setFilter(filter === 'requested'        ? '' : 'requested')}       active={filter === 'requested'} />
        <SummaryCard icon={AlertTriangle} label="Expiring"   value={counts.expiring}  color="yellow" onClick={() => setFilter(filter === 'expiring_soon'    ? '' : 'expiring_soon')}  active={filter === 'expiring_soon'} />
        <SummaryCard icon={XCircle}     label="Missing"      value={counts.missing}   color="red"    onClick={() => setFilter(filter === 'missing'           ? '' : 'missing')}        active={filter === 'missing'} />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by org name or document label…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Org sections */}
      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading compliance data…</div>
      ) : filteredOrgs.length === 0 ? (
        <div className="py-20 text-center">
          <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-base font-bold text-gray-500">No organizations found</p>
          <p className="text-sm text-gray-400 mt-1">Invite kitchens and sites to start tracking compliance.</p>
        </div>
      ) : (
        filteredOrgs.map((org) => (
          <OrgSection
            key={org.id}
            org={org}
            docs={docs}
            onApprove={handleApprove}
            onRejectClick={(doc) => setRejectDoc(doc)}
            onRequestDoc={(org, docType) => {
              setPrefillReq({ org, docType });
              setShowReq(true);
            }}
            onUploadDoc={() => {}}
          />
        ))
      )}

      {/* Request modal */}
      {showReq && (
        <RequestDocModal
          orgs={orgs}
          onClose={() => { setShowReq(false); setPrefillReq(null); }}
          onRequested={handleRequested}
        />
      )}

      {/* Reject modal */}
      {rejectDoc && (
        <RejectModal
          doc={rejectDoc}
          onClose={() => setRejectDoc(null)}
          onRejected={handleRejected}
        />
      )}
    </div>
  );
}

// ─── Kitchen / Site view ──────────────────────────────────────────────────────
function MyDocumentsView({ orgType }) {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');
  const [search,  setSearch]  = useState('');
  const [showUpload,     setShowUpload]     = useState(false);
  const [uploadPrefill,  setUploadPrefill]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents');
      setDocs(data.documents ?? data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUploaded = (doc) => {
    setDocs((prev) => {
      // Replace any superseded placeholders of the same doc_type
      const updated = prev.map((d) =>
        d.doc_type === doc.doc_type && d.status === 'requested' ? { ...d, status: 'superseded' } : d
      );
      return [doc, ...updated];
    });
  };

  // Action items: requested docs + rejected docs (not superseded)
  const actionItems = docs.filter((d) =>
    (d.status === 'requested' || d.status === 'rejected') && !d.superseded
  );

  // Real uploaded docs (with file), excluding superseded
  const uploaded = docs.filter((d) => d.file_url && d.file_url !== '' && d.status !== 'superseded');

  // Group by doc_type to find versions
  const versionMap = {};
  for (const d of uploaded) {
    if (!versionMap[d.doc_type]) versionMap[d.doc_type] = [];
    versionMap[d.doc_type].push(d);
  }

  // Latest per doc_type
  const latestByType = {};
  for (const [type, versions] of Object.entries(versionMap)) {
    latestByType[type] = versions.sort((a, b) => b.version - a.version)[0];
  }
  const latestDocs = Object.values(latestByType);

  // Required docs for this org type
  const required = REQUIRED_DOCS[orgType] ?? [];
  const uploadedTypes = new Set(latestDocs.map((d) => d.doc_type));
  const missingDocs = required.filter((r) => !uploadedTypes.has(r.doc_type));

  // Summary counts
  const counts = {
    approved: latestDocs.filter((d) => isApproved(d.status)).length,
    pending:  latestDocs.filter((d) => d.status === 'pending_review').length,
    expiring: latestDocs.filter((d) => d.status === 'expiring_soon').length,
    missing:  missingDocs.length,
  };

  // Apply filter + search
  let displayDocs = latestDocs;
  if (filter === 'missing') {
    displayDocs = [];
  } else if (filter) {
    displayDocs = latestDocs.filter((d) => d.status === filter);
  }
  if (search) {
    const q = search.toLowerCase();
    displayDocs = displayDocs.filter((d) =>
      (d.label ?? '').toLowerCase().includes(q) || (d.file_name ?? '').toLowerCase().includes(q)
    );
  }

  const showMissing = (filter === '' || filter === 'missing') && !search;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and manage your compliance documents.</p>
        </div>
        <button
          onClick={() => { setUploadPrefill(null); setShowUpload(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex-shrink-0"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard icon={CheckCircle}   label="Approved"   value={counts.approved} color="green"  onClick={() => setFilter(f => f === 'valid'          ? '' : 'valid')}          active={filter === 'valid'} />
        <SummaryCard icon={Clock}         label="Pending"    value={counts.pending}  color="blue"   onClick={() => setFilter(f => f === 'pending_review'  ? '' : 'pending_review')} active={filter === 'pending_review'} />
        <SummaryCard icon={AlertTriangle} label="Expiring"   value={counts.expiring} color="yellow" onClick={() => setFilter(f => f === 'expiring_soon'   ? '' : 'expiring_soon')}  active={filter === 'expiring_soon'} />
        <SummaryCard icon={XCircle}       label="Missing"    value={counts.missing}  color="red"    onClick={() => setFilter(f => f === 'missing'          ? '' : 'missing')}        active={filter === 'missing'} />
      </div>

      {/* Action required banner */}
      {actionItems.length > 0 && (
        <div className="card border-orange-200 bg-orange-50/40 mb-5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-bold text-orange-800">
              {actionItems.length} action{actionItems.length !== 1 ? 's' : ''} needed
            </p>
          </div>
          <div className="space-y-2">
            {actionItems.map((doc) => (
              <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                doc.status === 'requested'
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{doc.label || doc.doc_type}</p>
                  <p className={`text-xs ${doc.status === 'requested' ? 'text-purple-600' : 'text-red-600'}`}>
                    {doc.status === 'requested'
                      ? `Requested by sponsor${doc.expires_at ? ` · Due ${fmtDate(doc.expires_at)}` : ''}`
                      : `Rejected: ${doc.rejection_note}`}
                  </p>
                </div>
                <button
                  onClick={() => { setUploadPrefill(doc); setShowUpload(true); }}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg text-white ${
                    doc.status === 'requested' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {doc.status === 'rejected' ? 'Re-upload' : 'Upload'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {STATUS_FILTERS.slice(0, 6).map((f) => (
          <button key={f.value}
            onClick={() => setFilter((cur) => cur === f.value ? '' : f.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
              filter === f.value
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-2">
          {/* Uploaded docs (filtered) */}
          {displayDocs.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              isReviewer={false}
              onApprove={() => {}}
              onRejectClick={() => {}}
              onUploadAgainst={(d) => { setUploadPrefill(d); setShowUpload(true); }}
              versions={versionMap[doc.doc_type] ?? []}
            />
          ))}

          {/* Missing required docs (shown when no filter or filter=missing) */}
          {showMissing && missingDocs.map((req) => (
            <div key={req.doc_type}
              className="flex items-center gap-3 py-3 px-4 rounded-xl border border-dashed border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-500">{req.label}</p>
                <p className="text-xs text-gray-400">{req.hint}</p>
              </div>
              <StatusPill status="missing" />
              <button
                onClick={() => { setUploadPrefill({ doc_type: req.doc_type, label: req.label }); setShowUpload(true); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-brand-700 border border-brand-200 hover:bg-brand-50 rounded-lg"
              >
                <Upload className="w-3 h-3" /> Upload
              </button>
            </div>
          ))}

          {displayDocs.length === 0 && !showMissing && (
            <div className="py-16 text-center">
              <Inbox className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No documents match this filter.</p>
            </div>
          )}

          {displayDocs.length === 0 && missingDocs.length === 0 && (
            <div className="py-16 text-center">
              <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
              <p className="text-base font-bold text-gray-600">All documents up to date</p>
              <p className="text-sm text-gray-400 mt-1">All required documents have been uploaded and approved.</p>
            </div>
          )}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          prefill={uploadPrefill}
          onClose={() => { setShowUpload(false); setUploadPrefill(null); }}
          onUploaded={handleUploaded}
        />
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { user } = useAuth();
  const role = user?.role;

  if (['sponsor', 'coordinator', 'admin'].includes(role)) {
    return <ProgramDocumentsView />;
  }
  return <MyDocumentsView orgType={role === 'kitchen' ? 'kitchen' : 'site'} />;
}
