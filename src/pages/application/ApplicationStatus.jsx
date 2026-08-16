// ApplicationStatus.jsx — Post-submission status tracker
// Shown after the user submits their application (status != 'draft').
// Displays the pipeline, reviewer notes, and current document statuses.

import { CheckCircle, Clock, XCircle, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { useApplication } from '../../hooks/useApplication';
import { useDocuments } from '../../hooks/useDocuments';
import StatusBadge from '../../components/common/StatusBadge';

// ─── Pipeline step definitions ─────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { id: 'draft',        label: 'Draft',        description: 'Application started' },
  { id: 'submitted',    label: 'Submitted',     description: 'Waiting for sponsor or coordinator review' },
  { id: 'under_review', label: 'Under Review',  description: 'Being reviewed by your sponsor' },
  { id: 'approved',     label: 'Decision',      description: 'Final decision made' },
];

const FINAL_STATUSES = ['approved', 'rejected'];

// Returns which pipeline step index is "active" for a given status
// 'submitted' and 'under_review' both map to step 2 (Under Review) from the site's perspective
function getActiveStep(status) {
  if (status === 'rejected') return 3;
  if (status === 'submitted') return 2; // show as "Under Review" once submitted
  return PIPELINE_STEPS.findIndex((s) => s.id === status);
}

function PipelineStep({ step, index, activeIndex, status }) {
  const isApproved = status === 'approved' && index === 3;
  const isRejected = status === 'rejected' && index === 3;
  const isDone     = index < activeIndex || isApproved;
  const isActive   = index === activeIndex && !FINAL_STATUSES.includes(status);
  const isLast     = index === PIPELINE_STEPS.length - 1;

  let Icon = Clock;
  let circleClass = 'bg-gray-100 border-gray-200 text-gray-400';

  if (isApproved) { Icon = CheckCircle; circleClass = 'bg-green-100 border-green-300 text-green-600'; }
  else if (isRejected) { Icon = XCircle;  circleClass = 'bg-red-100 border-red-300 text-red-600'; }
  else if (isDone) { Icon = CheckCircle; circleClass = 'bg-brand-100 border-brand-300 text-brand-600'; }
  else if (isActive) { circleClass = 'bg-white border-brand-500 text-brand-600 animate-pulse'; }

  return (
    <div className="flex items-start gap-4">
      {/* Icon + connector line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${circleClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && (
          <div className={`w-0.5 h-10 mt-1 ${isDone ? 'bg-brand-300' : 'bg-gray-200'}`} />
        )}
      </div>

      {/* Text */}
      <div className="pb-8">
        <p className={`text-sm font-semibold ${
          isActive || isDone || isApproved ? 'text-gray-900' : 'text-gray-400'
        }`}>
          {isLast && isRejected ? 'Application Rejected' : step.label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {isLast && isApproved ? 'Congratulations! Your application has been approved.' :
           isLast && isRejected ? 'See the reviewer notes below.' :
           step.description}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ApplicationStatus({ onStartNew }) {
  const { application, loading, reload } = useApplication();
  const { documents } = useDocuments();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-4">You haven't started an application yet.</p>
        <button
          onClick={onStartNew}
          className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
        >
          Start Application
        </button>
      </div>
    );
  }

  const { status, notes, reviewed_at, submitted_at } = application;
  const activeIndex = getActiveStep(status);

  const docsWithIssues = documents.filter((d) =>
    ['expired', 'expiring_soon', 'rejected'].includes(d.status)
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Application Status</h1>
          {submitted_at && (
            <p className="text-sm text-gray-500 mt-1">
              Submitted {new Date(submitted_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <button
            onClick={reload}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pipeline tracker */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
          Application Progress
        </h2>
        <div>
          {PIPELINE_STEPS.map((step, i) => (
            <PipelineStep
              key={step.id}
              step={step}
              index={i}
              activeIndex={activeIndex}
              status={status}
            />
          ))}
        </div>
      </div>

      {/* Reviewer notes — shown when there's feedback from the coordinator */}
      {notes && (
        <div className={`card p-5 border-l-4 ${
          status === 'approved' ? 'border-l-green-500' :
          status === 'rejected' ? 'border-l-red-500'  : 'border-l-brand-500'
        }`}>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Reviewer Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
          {reviewed_at && (
            <p className="text-xs text-gray-400 mt-2">
              {new Date(reviewed_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
              })}
            </p>
          )}
        </div>
      )}

      {/* Document status alerts */}
      {docsWithIssues.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            Documents Needing Attention
          </h2>
          <div className="space-y-2">
            {docsWithIssues.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{doc.label || doc.doc_type}</span>
                <StatusBadge status={doc.status} />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Go to the Documents tab to upload updated versions.
          </p>
        </div>
      )}

      {/* Rejected — option to start fresh */}
      {status === 'rejected' && (
        <div className="card p-5 bg-red-50 border border-red-200">
          <h2 className="text-sm font-semibold text-red-800 mb-1">Application Not Approved</h2>
          <p className="text-sm text-red-700 mb-4">
            Please review the coordinator's notes above, address any issues, and contact your
            coordinator if you have questions before re-applying.
          </p>
          <button
            onClick={onStartNew}
            className="px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium
                       rounded-lg hover:bg-red-50 transition-colors"
          >
            Start a New Application
          </button>
        </div>
      )}

      {/* Approved — next steps */}
      {status === 'approved' && (
        <div className="card p-5 bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-sm font-semibold text-green-800">You're approved!</h2>
          </div>
          <p className="text-sm text-green-700">
            Your coordinator will be in touch about next steps. You can now access all features
            of the platform from your dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
