// NextActionBanner.jsx — Drives the kitchen user to their single most important next action.
// This always sits at the top of the overview so staff immediately know what to do.

import { ArrowRight, CheckCircle, Clock, FileText } from 'lucide-react';

// Default matches KITCHEN_REQUIRED_DOCS in KitchenDashboard.jsx (and REQUIRED.kitchen
// in backend routes/compliance.js). This list previously held only 3 of the 5 required
// docs, so the banner said "you're all set" while Compliance still showed 2 missing.
const DEFAULT_REQUIRED_DOCS = [
  'W-9', 'Food Safety Permit', 'Insurance', 'Menu Plan', 'Health Inspection',
];

export default function NextActionBanner({
  uploadedDocs = [],
  requiredDocs = DEFAULT_REQUIRED_DOCS,
  applicationStatus = 'not_submitted',
  onAction,
}) {
  const missingDoc = requiredDocs.find((doc) => !uploadedDocs.includes(doc));

  let config = null;

  if (missingDoc) {
    config = {
      bg:       'bg-blue-50 border-blue-200',
      icon:     <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />,
      text:     `Next step: Upload your ${missingDoc}`,
      action:   'Upload Now',
      textColor:'text-blue-700',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    };
  } else if (applicationStatus === 'not_submitted') {
    config = {
      bg:       'bg-yellow-50 border-yellow-200',
      icon:     <ArrowRight className="w-5 h-5 text-yellow-600 flex-shrink-0" />,
      text:     'Next step: Submit your application for sponsor review',
      action:   'Submit Application',
      textColor:'text-yellow-700',
      btnColor: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    };
  } else if (applicationStatus === 'submitted') {
    config = {
      bg:       'bg-gray-50 border-gray-200',
      icon:     <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />,
      text:     'Waiting for sponsor approval — nothing to do right now.',
      action:   null,
      textColor:'text-gray-600',
    };
  } else if (applicationStatus === 'approved') {
    config = {
      bg:       'bg-green-50 border-green-200',
      icon:     <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />,
      text:     "You're approved — log today's meals to stay compliant.",
      action:   "Log Today's Meals",
      textColor:'text-green-700',
      btnColor: 'bg-green-600 hover:bg-green-700 text-white',
    };
  }

  if (!config) return null;

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border mb-6 ${config.bg}`}>
      {config.icon}
      <p className={`flex-1 text-sm font-semibold ${config.textColor}`}>{config.text}</p>
      {config.action && (
        <button
          onClick={onAction}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex-shrink-0 ${config.btnColor}`}
        >
          {config.action}
        </button>
      )}
    </div>
  );
}
