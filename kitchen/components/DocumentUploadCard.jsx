// DocumentUploadCard.jsx — Replaces the vague "Upload documents" checklist step with
// a clear list of exactly which 3 documents are required: W-9, Menu Plan, Insurance.
// Each shows its upload status and triggers a real file picker.
// When all 3 are done it fires onAllUploaded() to tick off the checklist.

import { useState } from 'react';
import { FileText, CheckCircle, Clock, Upload } from 'lucide-react';
import api from '../../../services/api';

const REQUIRED_DOCS = [
  { id: 'w9',        label: 'W-9 Form',               description: 'IRS tax form for your organization' },
  { id: 'menu',      label: 'Menu Plan',               description: 'Your 21-day meal cycle menu' },
  { id: 'insurance', label: 'Insurance Certificate',   description: 'Current liability insurance policy' },
];

export default function DocumentUploadCard({ onAllUploaded }) {
  const [uploaded,  setUploaded]  = useState({}); // { docId: fileName }
  const [uploading, setUploading] = useState({}); // { docId: bool }
  const [errors,    setErrors]    = useState({});  // { docId: errorMsg }

  const handleUpload = async (docId, file) => {
    if (!file) return;
    setUploading((u) => ({ ...u, [docId]: true }));
    setErrors((e) => ({ ...e, [docId]: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docId); // lets backend categorize it

      // Real endpoint: POST /api/documents (multipart)
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newUploaded = { ...uploaded, [docId]: file.name };
      setUploaded(newUploaded);

      // Notify parent to tick off the checklist step when all 3 are done
      if (Object.keys(newUploaded).length === REQUIRED_DOCS.length) {
        onAllUploaded?.();
      }
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [docId]: err.response?.data?.error ?? 'Upload failed — please try again.',
      }));
    } finally {
      setUploading((u) => ({ ...u, [docId]: false }));
    }
  };

  const uploadedCount = Object.keys(uploaded).length;
  const progressPct   = Math.round((uploadedCount / REQUIRED_DOCS.length) * 100);

  return (
    <div className="card mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Required Documents</h2>
        </div>
        <span className={`text-sm font-semibold ${uploadedCount === REQUIRED_DOCS.length ? 'text-green-600' : 'text-brand-600'}`}>
          {uploadedCount} of {REQUIRED_DOCS.length} uploaded
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4 pb-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Document rows */}
      <div className="px-6 py-4 space-y-3">
        {REQUIRED_DOCS.map((doc) => {
          const isUploaded  = !!uploaded[doc.id];
          const isUploading = uploading[doc.id];
          const error       = errors[doc.id];

          return (
            <div
              key={doc.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                isUploaded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Status icon */}
              {isUploaded
                ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                : <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
              }

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isUploaded ? 'text-green-700' : 'text-gray-800'}`}>
                  {doc.label}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {isUploaded ? `✓ ${uploaded[doc.id]}` : doc.description}
                </p>
                {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
              </div>

              {/* Upload button — uses a hidden file input so we control the styling */}
              {!isUploaded && (
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors flex-shrink-0 ${
                  isUploading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}>
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading…' : 'Upload'}
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploading}
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={(e) => e.target.files[0] && handleUpload(doc.id, e.target.files[0])}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* All done state */}
      {uploadedCount === REQUIRED_DOCS.length && (
        <div className="mx-6 mb-5 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <p className="text-sm font-semibold text-green-700">All required documents uploaded — your checklist is updated.</p>
        </div>
      )}
    </div>
  );
}
