// DocumentsPage.jsx — Full document management page for all roles.
//
// Applicant roles (kitchen/site/delivery): see their own docs, upload/re-upload.
// Reviewer roles (coordinator/sponsor): can filter by org, approve/reject documents.

import { useState, useRef } from 'react';
import {
  Upload, CheckCircle, AlertCircle, Clock, FileText,
  Eye, XCircle, RotateCcw, Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDocuments } from '../../hooks/useDocuments';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';

// Status filter options
const STATUS_FILTERS = [
  { label: 'All',            value: ''              },
  { label: 'Valid',          value: 'valid'          },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Expiring Soon',  value: 'expiring_soon'  },
  { label: 'Expired',        value: 'expired'        },
  { label: 'Rejected',       value: 'rejected'       },
];

function StatusIcon({ status }) {
  const map = {
    valid:          <CheckCircle className="w-5 h-5 text-green-500" />,
    pending_review: <Clock className="w-5 h-5 text-blue-400" />,
    expiring_soon:  <Clock className="w-5 h-5 text-yellow-500" />,
    expired:        <AlertCircle className="w-5 h-5 text-red-500" />,
    rejected:       <XCircle className="w-5 h-5 text-red-500" />,
  };
  return map[status] || <FileText className="w-5 h-5 text-gray-300" />;
}

// ── Document row ─────────────────────────────────────────────────────────────
function DocumentRow({ doc, isReviewer, onUpload, onReview }) {
  const fileInputRef  = useRef(null);
  const [reviewing,   setReviewing]  = useState(false);
  const [rejectNote,  setRejectNote] = useState('');
  const [loading,     setLoading]    = useState(false);
  const [expiresAt,   setExpiresAt]  = useState('');
  const [showExpiry,  setShowExpiry] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  const daysUntilExpiry = doc.days_until_expiry ?? (doc.expires_at
    ? Math.floor((new Date(doc.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPendingFile(file);
    setShowExpiry(true);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setLoading(true);
    try {
      await onUpload(pendingFile, doc.doc_type, doc.label, expiresAt || null);
      setPendingFile(null);
      setShowExpiry(false);
      setExpiresAt('');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try { await onReview(doc.id, 'valid', ''); }
    finally { setLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) return;
    setLoading(true);
    try {
      await onReview(doc.id, 'rejected', rejectNote.trim());
      setReviewing(false);
      setRejectNote('');
    } finally { setLoading(false); }
  };

  return (
    <div className={`card p-4 space-y-3 ${
      doc.status === 'rejected' ? 'border-red-200' :
      doc.status === 'expiring_soon' ? 'border-yellow-200' :
      doc.status === 'expired' ? 'border-red-200' : ''
    }`}>
      {/* Main row */}
      <div className="flex items-start gap-3">
        <StatusIcon status={doc.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">{doc.label || doc.doc_type}</p>
            <StatusBadge status={doc.status} />
            {doc.version > 1 && (
              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                v{doc.version}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
            {doc.file_name && <span className="truncate max-w-[200px]">{doc.file_name}</span>}
            {doc.uploaded_at && (
              <span>Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</span>
            )}
            {daysUntilExpiry !== null && (
              <span className={daysUntilExpiry < 0 ? 'text-red-500 font-medium' :
                               daysUntilExpiry < 30 ? 'text-yellow-600 font-medium' : ''}>
                {daysUntilExpiry < 0
                  ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                  : daysUntilExpiry === 0
                  ? 'Expires today'
                  : `Expires in ${daysUntilExpiry} days`}
              </span>
            )}
            {doc.uploaded_by_name && <span>by {doc.uploaded_by_name}</span>}
          </div>

          {doc.rejection_note && (
            <p className="text-xs text-red-600 mt-1">
              Rejection reason: {doc.rejection_note}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {doc.file_url && (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              title="View document"
            >
              <Eye className="w-4 h-4" />
            </a>
          )}

          {/* Upload / re-upload (applicant roles) */}
          {!isReviewer && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
                           border border-brand-300 text-brand-700 hover:bg-brand-50
                           rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {doc.status === 'rejected' ? 'Re-upload' : 'Replace'}
              </button>
            </>
          )}

          {/* Reviewer actions */}
          {isReviewer && doc.status === 'pending_review' && (
            <>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
                           bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors
                           disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={() => setReviewing(!reviewing)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
                           border border-red-300 text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expiry date picker — shown after file is selected */}
      {showExpiry && pendingFile && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-800 mb-0.5">📄 {pendingFile.name}</p>
            <p className="text-xs text-blue-600">Optional: set an expiry date so the system can alert you before it expires.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              type="date"
              value={expiresAt}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="px-2 py-1.5 border border-blue-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={confirmUpload}
              disabled={loading}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
            >
              {loading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              onClick={() => { setShowExpiry(false); setPendingFile(null); setExpiresAt(''); }}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reject note input */}
      {reviewing && (
        <div className="flex gap-2 pl-8">
          <input
            type="text"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Explain what's wrong with this document…"
            className="flex-1 px-3 py-2 border border-red-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={handleReject}
            disabled={!rejectNote.trim() || loading}
            className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg
                       hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? '…' : 'Confirm'}
          </button>
          <button
            onClick={() => { setReviewing(false); setRejectNote(''); }}
            className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { user } = useAuth();
  const { documents, loading, uploading, uploadDocument, reload } = useDocuments();
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewUpdates, setReviewUpdates] = useState({});

  const isReviewer = ['coordinator', 'sponsor'].includes(user?.role);

  // Apply the current status filter
  const filtered = documents.filter((d) =>
    !statusFilter || d.status === statusFilter
  );

  // Group docs by status for the summary bar
  const counts = documents.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  const handleReview = async (docId, status, rejectionNote) => {
    await api.patch(`/documents/${docId}/status`, { status, rejection_note: rejectionNote });
    // Optimistically update the local state
    setReviewUpdates((prev) => ({ ...prev, [docId]: status }));
    reload();
  };

  // Merge backend data with optimistic updates
  const docsWithUpdates = filtered.map((d) =>
    reviewUpdates[d.id] ? { ...d, status: reviewUpdates[d.id] } : d
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isReviewer
            ? 'Review uploaded documents and manage compliance status.'
            : 'Upload and manage your required documents. Keep them current to stay in good standing.'}
        </p>
      </div>

      {/* Summary chips */}
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {counts.valid         > 0 && <span className="badge bg-green-100 text-green-700">{counts.valid} Valid</span>}
          {counts.pending_review> 0 && <span className="badge bg-blue-100 text-blue-700">{counts.pending_review} Pending Review</span>}
          {counts.expiring_soon > 0 && <span className="badge bg-yellow-100 text-yellow-700">{counts.expiring_soon} Expiring Soon</span>}
          {counts.expired       > 0 && <span className="badge bg-red-100 text-red-700">{counts.expired} Expired</span>}
          {counts.rejected      > 0 && <span className="badge bg-red-100 text-red-700">{counts.rejected} Rejected</span>}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === f.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : docsWithUpdates.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {statusFilter ? 'No documents match this filter.' : 'No documents uploaded yet.'}
          </p>
          {!statusFilter && !isReviewer && (
            <p className="text-xs text-gray-400 mt-1">
              Go to your application to upload required documents.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {docsWithUpdates.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              isReviewer={isReviewer}
              onUpload={uploadDocument}
              onReview={handleReview}
            />
          ))}
        </div>
      )}

      {uploading && (
        <p className="text-sm text-brand-600 text-center mt-4 animate-pulse">Uploading…</p>
      )}
    </div>
  );
}
