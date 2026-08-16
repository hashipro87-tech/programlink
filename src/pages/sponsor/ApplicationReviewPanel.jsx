// ApplicationReviewPanel.jsx — Slide-in detail panel for reviewing an application
// Shows the applicant's info, documents, and action buttons.
// Role-aware: coordinators can move to review or send back; sponsors can approve/reject.

import { useState } from 'react';
import { X, CheckCircle, XCircle, RotateCcw, Eye, FileText, AlertCircle } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';

// Which actions each role can take on each current status
// NORMAL FLOW: flag bad docs with ✕ → "Send Back for Revisions" → site re-uploads → Approve
// PERMANENT REJECT: only use when the applicant is fully disqualified (rare)
const ALLOWED_ACTIONS = {
  coordinator: {
    submitted:    ['under_review', 'draft'],
    under_review: ['draft'],
  },
  sponsor: {
    submitted:    ['draft', 'approved', 'rejected'],   // Send Back first — it's the normal path
    under_review: ['draft', 'approved', 'rejected'],
    rejected:     ['submitted'],                        // Allow reopening an accidental rejection
  },
};

// sponsorLabel = final authority action (sponsor only)
// coordinatorLabel = review-stage action (coordinator)
// label = fallback
const ACTION_CONFIG = {
  under_review: {
    label:            'Move to Review',
    coordinatorLabel: 'Accept — Forward to Sponsor',
    icon:  Eye,
    style: 'bg-brand-600 hover:bg-brand-700 text-white',
    requiresNote: false,
    warning: null,
    coordinatorNote: 'This marks the application as reviewed and forwards it to the sponsor for final approval.',
  },
  approved: {
    label:       'Approve Application',
    sponsorNote: 'You have final authority. Approving will notify the site and unlock their account.',
    icon:  CheckCircle,
    style: 'bg-green-600 hover:bg-green-700 text-white',
    requiresNote: false,
    warning: null,
  },
  rejected: {
    label:            'Permanently Reject',
    coordinatorLabel: 'Reject — Send Back',
    icon:  XCircle,
    style: 'bg-red-600 hover:bg-red-700 text-white',
    requiresNote: true,
    warning: '⚠️ This permanently denies the whole application. Only use this if the applicant is not qualified. To ask them to fix a document, use "Request Changes" instead.',
    coordinatorWarning: '⚠️ This sends the application back to the site as rejected. Use "Request Changes" if you just need them to re-upload a document.',
  },
  draft: {
    label:            'Send Back for Revisions',
    coordinatorLabel: 'Request Changes',
    icon:  RotateCcw,
    style: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    requiresNote: true,
    warning: null,
  },
  submitted: {
    label: 'Reopen Application',
    icon:  RotateCcw,
    style: 'border border-gray-400 text-gray-700 hover:bg-gray-50',
    requiresNote: false,
    warning: null,
  },
};

export default function ApplicationReviewPanel({
  application,
  reviewerRole = 'coordinator',
  onClose,
  onStatusChange,
}) {
  const [actionTarget,  setActionTarget]  = useState(null); // the status we're moving to
  const [note,          setNote]          = useState('');
  const [internalNote,  setInternalNote]  = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [documents,     setDocuments]     = useState(null);
  const [docsLoading,   setDocsLoading]   = useState(false);
  const [docActioning,  setDocActioning]  = useState(null); // doc id being approved/rejected
  const [rejectingDocId, setRejectingDocId] = useState(null); // doc awaiting rejection note
  const [rejectingNote,  setRejectingNote]  = useState('');

  // Open a document through the backend API (handles auth + R2/local fallback)
  const handleViewDoc = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/file`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      alert('Could not load document. The file may no longer be stored on the server. Please ask the applicant to re-upload.');
    }
  };

  const allowedActions = ALLOWED_ACTIONS[reviewerRole]?.[application.status] || [];

  // Lazy-load documents for this org when the panel opens
  const loadDocuments = async () => {
    if (documents !== null) return;
    setDocsLoading(true);
    try {
      const res = await api.get(`/documents?org_id=${application.org_id}`);
      // API returns { documents: [...] } not a plain array
      setDocuments(res.data.documents ?? res.data ?? []);
    } catch {
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  // Approve or reject an individual document
  const handleDocStatus = async (docId, newStatus, rejectionNote = '') => {
    setDocActioning(docId);
    try {
      await api.patch(`/documents/${docId}/status`, { status: newStatus, rejection_note: rejectionNote || null });
      setDocuments((prev) =>
        prev.map((d) => d.id === docId ? { ...d, status: newStatus, rejection_note: rejectionNote || null } : d)
      );
      setRejectingDocId(null);
      setRejectingNote('');
    } catch {
      alert('Failed to update document status. Please try again.');
    } finally {
      setDocActioning(null);
    }
  };

  // Call on panel mount
  useState(() => { loadDocuments(); });

  const handleAction = async () => {
    if (!actionTarget) return;
    const config = ACTION_CONFIG[actionTarget];
    if (config.requiresNote && !note.trim()) {
      setError('Please add a note explaining the decision before continuing.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onStatusChange(application.id, actionTarget, note.trim(), internalNote.trim());
      setActionTarget(null);
      setNote('');
      setInternalNote('');
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card flex flex-col h-full max-h-[calc(100vh-8rem)] sticky top-4 overflow-hidden">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900">{application.org_name}</p>
          <p className="text-xs text-gray-500 capitalize">{application.org_type} application</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={application.status} />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Timeline */}
        <div className="space-y-1 text-xs text-gray-500">
          {application.created_at && (
            <p>Started: {new Date(application.created_at).toLocaleString()}</p>
          )}
          {application.submitted_at && (
            <p>Submitted: {new Date(application.submitted_at).toLocaleString()}</p>
          )}
          {application.reviewed_at && (
            <p>
              Last reviewed: {new Date(application.reviewed_at).toLocaleString()}
              {application.reviewed_by_name && ` by ${application.reviewed_by_name}`}
            </p>
          )}
        </div>

        {/* Existing reviewer notes */}
        {application.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-yellow-800 mb-1">Previous Notes</p>
            <p className="text-sm text-yellow-900 whitespace-pre-wrap">{application.notes}</p>
          </div>
        )}

        {/* Documents section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Documents
          </h3>
          {docsLoading ? (
            <p className="text-sm text-gray-400">Loading documents…</p>
          ) : !documents?.length ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <AlertCircle className="w-4 h-4" />
              No documents uploaded yet
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{doc.label || doc.doc_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <StatusBadge status={doc.status} />
                      {doc.file_url && (
                        <button
                          onClick={() => handleViewDoc(doc)}
                          className="text-xs text-brand-600 hover:underline px-1"
                        >
                          View
                        </button>
                      )}
                      {/* ✓ approve — sponsor + coordinator */}
                      {doc.status !== 'valid' && (
                        <button
                          onClick={() => handleDocStatus(doc.id, 'valid')}
                          disabled={docActioning === doc.id}
                          title="Approve this document"
                          className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                        >
                          ✓
                        </button>
                      )}
                      {/* ✕ reject — opens inline note */}
                      {doc.status !== 'rejected' && (
                        <button
                          onClick={() => {
                            setRejectingDocId(rejectingDocId === doc.id ? null : doc.id);
                            setRejectingNote('');
                          }}
                          disabled={docActioning === doc.id}
                          title="Reject this document"
                          className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Existing rejection note */}
                  {doc.status === 'rejected' && doc.rejection_note && (
                    <p className="text-xs text-red-600 pl-6 italic">
                      Reason: {doc.rejection_note}
                    </p>
                  )}

                  {/* Inline rejection note form */}
                  {rejectingDocId === doc.id && (
                    <div className="pl-6 space-y-1.5">
                      <textarea
                        autoFocus
                        value={rejectingNote}
                        onChange={(e) => setRejectingNote(e.target.value)}
                        rows={2}
                        placeholder="Reason for rejection (required)…"
                        className="w-full px-2 py-1.5 border border-red-300 rounded text-xs
                                   focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!rejectingNote.trim()) { alert('Please enter a reason for rejection.'); return; }
                            handleDocStatus(doc.id, 'rejected', rejectingNote.trim());
                          }}
                          disabled={docActioning === doc.id}
                          className="px-2.5 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => { setRejectingDocId(null); setRejectingNote(''); }}
                          className="px-2.5 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {allowedActions.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              {allowedActions.map((target) => {
                const cfg = ACTION_CONFIG[target];
                const Icon = cfg.icon;
                const btnLabel = reviewerRole === 'coordinator'
                  ? (cfg.coordinatorLabel ?? cfg.label)
                  : (cfg.sponsorLabel ?? cfg.label);
                return (
                  <button
                    key={target}
                    onClick={() => setActionTarget(actionTarget === target ? null : target)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg
                                transition-colors ${cfg.style}
                                ${actionTarget === target ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    {btnLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Note form — shown when an action is selected */}
        {actionTarget && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            {/* Role-aware warning / note */}
            {(() => {
              const cfg = ACTION_CONFIG[actionTarget];
              const msg = reviewerRole === 'coordinator'
                ? (cfg.coordinatorWarning ?? cfg.warning ?? cfg.coordinatorNote)
                : (cfg.sponsorNote ?? cfg.warning);
              if (!msg) return null;
              const isWarning = msg.startsWith('⚠️') || cfg.warning;
              return (
                <div className={`border rounded-lg px-3 py-2 ${isWarning ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                  <p className={`text-xs ${isWarning ? 'text-red-700' : 'text-blue-700'}`}>{msg}</p>
                </div>
              );
            })()}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note to applicant
                {ACTION_CONFIG[actionTarget].requiresNote && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={
                  actionTarget === 'rejected'  ? 'Explain why this application is being rejected…' :
                  actionTarget === 'draft'      ? 'Explain what needs to be corrected before resubmitting…' :
                  actionTarget === 'approved'   ? 'Optional: add a congratulatory note or next steps…' :
                                                  'Optional note for the applicant…'
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {/* Internal note — only visible to coordinators/sponsors, never shown to applicant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal note
                <span className="ml-1 text-xs font-normal text-gray-400">(not visible to applicant)</span>
              </label>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={2}
                placeholder="Internal notes for your team…"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAction}
                disabled={submitting}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors
                            disabled:opacity-60 ${ACTION_CONFIG[actionTarget].style}`}
              >
                {submitting ? 'Saving…' : `Confirm: ${reviewerRole === 'coordinator' ? (ACTION_CONFIG[actionTarget].coordinatorLabel ?? ACTION_CONFIG[actionTarget].label) : (ACTION_CONFIG[actionTarget].label)}`}
              </button>
              <button
                onClick={() => { setActionTarget(null); setNote(''); setError(''); }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* No actions available */}
        {allowedActions.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            {application.status === 'approved'
              ? 'This application has been approved.'
              : 'No actions available for your role at this stage.'}
          </p>
        )}
      </div>
    </div>
  );
}
