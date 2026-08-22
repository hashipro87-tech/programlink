// StepDocuments.jsx — Step 3: Document upload checklist
// Shows a list of required documents per role with upload slots.
// Each slot shows current upload status and lets the user upload a new file.
// Required docs are defined per role — missing required docs block submission.

import { useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { useDocuments } from '../../../hooks/useDocuments';
import { REQUIRED_DOCUMENTS, isDocFulfilled } from '../../../constants/requiredDocuments';

// Required documents per role. kitchen/site come from REQUIRED_DOCUMENTS — the
// single list shared with DocumentsPage.jsx, KitchenDashboard.jsx, and the
// backend's compliance.js REQUIRED constant.
//
// This used to be its own hardcoded list with entirely different, invented
// doc_type values (health_permit, food_handler_cert, business_license,
// state_license, enrollment_records, director_info, fire_inspection — none of
// which matched a real document anywhere else in the product). A kitchen with
// every real compliance document approved on /documents still saw "0 of 3
// required documents uploaded" here and could never submit their application
// through this step, because getDoc() matches by exact doc_type and none of
// these types existed anywhere else. See requiredDocuments.js for the full story.
const DOC_REQUIREMENTS = {
  kitchen: REQUIRED_DOCUMENTS.kitchen.map((d) => ({ type: d.doc_type, label: d.label, required: true, hasExpiry: true })),
  site:    REQUIRED_DOCUMENTS.site.map((d)    => ({ type: d.doc_type, label: d.label, required: true, hasExpiry: true })),
  // Delivery has no entry in the shared list — nothing else in the product
  // (Compliance page, Claims engine) tracks required documents for delivery
  // orgs yet, so this stays a locally-scoped list for now. See the NOTE in
  // requiredDocuments.js.
  delivery: [
    { type: 'vehicle_registration',label: 'Vehicle Registration(s)',      required: true,  hasExpiry: true },
    { type: 'liability_insurance', label: 'Commercial Auto Insurance',    required: true,  hasExpiry: true },
    { type: 'driver_license',      label: "Driver's License(s)",          required: true,  hasExpiry: true },
    { type: 'dot_certificate',     label: 'DOT Safety Certificate',       required: false, hasExpiry: true },
    { type: 'food_transport_cert', label: 'Food Transport Certification', required: false, hasExpiry: true },
  ],
};

// Status icon shown next to each doc slot
function DocStatusIcon({ status }) {
  if (status === 'valid' || status === 'pending_review') {
    return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
  }
  if (status === 'expiring_soon') {
    return <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
  }
  if (status === 'expired' || status === 'rejected') {
    return <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
  }
  return <FileText className="w-5 h-5 text-gray-300 flex-shrink-0" />;
}

// Single document upload row
function DocRow({ docDef, existingDoc, onUpload, uploading }) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file, docDef.type, docDef.label);
    // Reset input so the same file can be re-uploaded if needed
    e.target.value = '';
  };

  const uploaded = !!existingDoc;
  const statusColor = uploaded
    ? existingDoc.status === 'rejected' ? 'border-red-200 bg-red-50'
    : 'border-green-200 bg-green-50'
    : 'border-gray-200 bg-white';

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-4 transition-colors ${statusColor}`}>
      <DocStatusIcon status={existingDoc?.status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900">{docDef.label}</p>
          {docDef.required && (
            <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
              Required
            </span>
          )}
        </div>

        {uploaded ? (
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-gray-500 truncate">
              {existingDoc.file_name} · {new Date(existingDoc.uploaded_at).toLocaleDateString()}
            </p>
            {existingDoc.status === 'rejected' && existingDoc.rejection_note && (
              <p className="text-xs text-red-600">
                Rejected: {existingDoc.rejection_note}
              </p>
            )}
            {existingDoc.expires_at && (
              <p className="text-xs text-gray-400">
                Expires {new Date(existingDoc.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">No file uploaded yet</p>
        )}
      </div>

      {/* Upload button */}
      <div className="flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                     border border-brand-300 text-brand-700 hover:bg-brand-50
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploaded ? 'Replace' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

export default function StepDocuments({ role }) {
  const { documents, uploading, uploadDocument, getDoc } = useDocuments();
  const requiredDocs = DOC_REQUIREMENTS[role] || [];

  // isDocFulfilled excludes 'rejected' and 'requested' (a sponsor-side
  // placeholder with no real file) — a rejected doc existing in the row
  // shouldn't count as satisfying the requirement, or a sponsor could never
  // force a re-upload before submission.
  const uploaded    = requiredDocs.filter((d) => d.required && isDocFulfilled(getDoc(d.type))).length;
  const totalReq    = requiredDocs.filter((d) => d.required).length;
  const allRequired = uploaded === totalReq;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Required Documents</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload the documents below. All required items must be uploaded before you can submit.
          Accepted formats: PDF, JPG, PNG (max 10 MB each).
        </p>
      </div>

      {/* Progress summary */}
      <div className={`rounded-lg p-4 flex items-center gap-3 ${
        allRequired ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          allRequired ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
        }`}>
          {allRequired
            ? <CheckCircle className="w-5 h-5" />
            : <AlertCircle className="w-5 h-5" />
          }
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {uploaded} of {totalReq} required documents uploaded
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {allRequired
              ? 'All required documents are in place. You can proceed to review.'
              : `${totalReq - uploaded} more required document${totalReq - uploaded !== 1 ? 's' : ''} needed.`}
          </p>
        </div>
      </div>

      {/* Document rows — required first, then optional */}
      <div className="space-y-3">
        {[...requiredDocs.filter(d => d.required), ...requiredDocs.filter(d => !d.required)]
          .map((docDef) => (
            <DocRow
              key={docDef.type}
              docDef={docDef}
              existingDoc={getDoc(docDef.type)}
              onUpload={uploadDocument}
              uploading={uploading}
            />
          ))}
      </div>

      {uploading && (
        <p className="text-sm text-brand-600 text-center animate-pulse">Uploading file…</p>
      )}
    </div>
  );
}

// Export the helper so ApplicationFlow can check if all required docs are uploaded
export { DOC_REQUIREMENTS };
