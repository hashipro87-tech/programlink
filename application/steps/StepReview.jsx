// StepReview.jsx — Step 4: Review all answers and submit
// Shows a read-only summary of everything entered so the applicant can
// catch mistakes before submitting. Once submitted they can't edit.

import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useDocuments } from '../../../hooks/useDocuments';
import { DOC_REQUIREMENTS } from './StepDocuments';

// Small helper to render a labelled value row
function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

export default function StepReview({ role, formData, onSubmit, submitting }) {
  const { documents } = useDocuments();
  const [agreed, setAgreed] = useState(false);

  const requiredDocs = (DOC_REQUIREMENTS[role] || []).filter((d) => d.required);
  const missingDocs  = requiredDocs.filter(
    (d) => !documents.find((doc) => doc.doc_type === d.type)
  );
  const canSubmit = agreed && missingDocs.length === 0;

  // Collect meal/need checkboxes into a readable string
  const getMealTypes = (prefix) =>
    ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Halal', 'Vegetarian', 'AM Snack', 'PM Snack']
      .filter((m) => formData[`${prefix}${m.replace(/\s/g, '_').toLowerCase()}`])
      .join(', ') || '—';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
        <p className="text-sm text-gray-500 mt-1">
          Please review everything below before submitting. Your coordinator will be notified
          and will review your application within a few business days.
        </p>
      </div>

      {/* Missing docs warning */}
      {missingDocs.length > 0 && (
        <div className="rounded-lg p-4 bg-red-50 border border-red-200 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Missing required documents</p>
            <p className="text-xs text-red-600 mt-0.5">
              Go back to Step 3 and upload: {missingDocs.map((d) => d.label).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Basic info summary */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Contact Information
        </h3>
        <ReviewRow label="Organization"    value={formData.orgName} />
        <ReviewRow label="Contact name"    value={formData.contactName} />
        <ReviewRow label="Title"           value={formData.contactTitle} />
        <ReviewRow label="Phone"           value={formData.phone} />
        <ReviewRow label="Email"           value={formData.email} />
        <ReviewRow label="Address"         value={[formData.address, formData.city, formData.state, formData.zip].filter(Boolean).join(', ')} />
      </div>

      {/* Role-specific details */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          {role === 'kitchen' ? 'Kitchen Details' : role === 'site' ? 'Site Details' : 'Provider Details'}
        </h3>

        {role === 'kitchen' && (
          <>
            <ReviewRow label="Kitchen type"    value={formData.kitchenType} />
            <ReviewRow label="Meal capacity"   value={formData.mealCapacity ? `${formData.mealCapacity} meals/day` : null} />
            <ReviewRow label="Meal types"      value={getMealTypes('mealType_')} />
            <ReviewRow label="Hours"           value={formData.operatingHours} />
            <ReviewRow label="Notes"           value={formData.kitchenNotes} />
          </>
        )}

        {role === 'site' && (
          <>
            <ReviewRow label="Site type"       value={formData.siteType} />
            <ReviewRow label="Enrollment"      value={formData.enrollment ? `${formData.enrollment} children` : null} />
            <ReviewRow label="Age range"       value={formData.ageRange} />
            <ReviewRow label="Program hours"   value={formData.programHours} />
            <ReviewRow label="Meals needed"    value={getMealTypes('needsMeal_')} />
            <ReviewRow label="License #"       value={formData.licenseNumber} />
          </>
        )}

        {role === 'delivery' && (
          <>
            <ReviewRow label="Vehicle count"   value={formData.vehicleCount} />
            <ReviewRow label="Vehicle type"    value={formData.vehicleType} />
            <ReviewRow label="Max stops"       value={formData.maxStops} />
            <ReviewRow label="Service area"    value={formData.serviceArea} />
            <ReviewRow label="DOT #"           value={formData.dotNumber} />
          </>
        )}
      </div>

      {/* Document checklist summary */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Documents
        </h3>
        <div className="space-y-2">
          {(DOC_REQUIREMENTS[role] || []).map((docDef) => {
            const uploaded = documents.find((d) => d.doc_type === docDef.type);
            return (
              <div key={docDef.type} className="flex items-center gap-2 text-sm">
                {uploaded
                  ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <AlertCircle className={`w-4 h-4 flex-shrink-0 ${docDef.required ? 'text-red-400' : 'text-gray-300'}`} />
                }
                <span className={uploaded ? 'text-gray-700' : docDef.required ? 'text-red-600 font-medium' : 'text-gray-400'}>
                  {docDef.label}
                  {!uploaded && docDef.required && ' (missing)'}
                  {!uploaded && !docDef.required && ' (optional)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certification checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-gray-700">
          I certify that the information provided in this application is accurate and complete
          to the best of my knowledge, and that all uploaded documents are current and valid.
        </span>
      </label>

      {/* Submit button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300
                   disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm
                   transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>

      {!agreed && (
        <p className="text-xs text-center text-gray-400">
          Check the certification box above to enable submission.
        </p>
      )}
    </div>
  );
}
