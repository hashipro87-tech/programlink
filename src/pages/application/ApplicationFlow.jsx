// ApplicationFlow.jsx — Multi-step application form
// Orchestrates the 4-step flow: Basic Info → Org Details → Documents → Review & Submit
//
// Auto-save: form data is saved to localStorage on every change so users
// never lose progress if they close the tab or step away.
//
// After submission the parent component detects the status change and
// switches to the ApplicationStatus tracker view.

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../hooks/useApplication';
import StepBasicInfo  from './steps/StepBasicInfo';
import StepOrgDetails from './steps/StepOrgDetails';
import StepDocuments  from './steps/StepDocuments';
import StepReview     from './steps/StepReview';

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 'basic',     label: 'Basic Info'   },
  { id: 'details',   label: 'Details'      },
  { id: 'documents', label: 'Documents'    },
  { id: 'review',    label: 'Review'       },
];

// ─── Validation ───────────────────────────────────────────────────────────────
function validateStep(stepId, formData, role) {
  const errors = {};

  if (stepId === 'basic') {
    if (!formData.orgName?.trim())     errors.orgName     = 'Organization name is required';
    if (!formData.contactName?.trim()) errors.contactName = 'Contact name is required';
    if (!formData.phone?.trim())       errors.phone       = 'Phone number is required';
    if (!formData.email?.trim())       errors.email       = 'Email address is required';
    if (!formData.address?.trim())     errors.address     = 'Address is required';
  }

  if (stepId === 'details') {
    if (role === 'kitchen') {
      if (!formData.mealCapacity) errors.mealCapacity = 'Capacity is required';
      if (!formData.kitchenType)  errors.kitchenType  = 'Kitchen type is required';
    }
    if (role === 'site') {
      if (!formData.siteType)   errors.siteType   = 'Site type is required';
      if (!formData.enrollment) errors.enrollment = 'Enrollment count is required';
    }
    if (role === 'delivery') {
      if (!formData.vehicleCount) errors.vehicleCount = 'Vehicle count is required';
      if (!formData.vehicleType)  errors.vehicleType  = 'Vehicle type is required';
    }
  }

  return errors;
}

// ─── Step progress indicator ──────────────────────────────────────────────────
function StepIndicator({ steps, currentIndex }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => {
        const done    = i < currentIndex;
        const active  = i === currentIndex;
        const isLast  = i === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                done   ? 'bg-brand-600 border-brand-600 text-white' :
                active ? 'bg-white border-brand-600 text-brand-600' :
                         'bg-white border-gray-300 text-gray-400'
              }`}>
                {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[11px] mt-1 font-medium whitespace-nowrap ${
                active ? 'text-brand-600' : done ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${
                i < currentIndex ? 'bg-brand-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ApplicationFlow({ onSubmitted }) {
  const { user } = useAuth();
  const { application, loading, saving, createApplication, submitApplication } = useApplication();

  const STORAGE_KEY = `pl_app_draft_${user?.id}`;

  // Load saved form data from localStorage (auto-save restore)
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Auto-save: persist form data to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData, STORAGE_KEY]);

  const handleChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field as the user types
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const goNext = async () => {
    const stepId  = STEPS[currentStep].id;
    const newErrs = validateStep(stepId, formData, user?.role);

    if (Object.keys(newErrs).length) {
      setErrors(newErrs);
      return;
    }

    setErrors({});

    // Create the application record on first "Next" click if it doesn't exist yet
    if (currentStep === 0 && !application) {
      try {
        await createApplication();
      } catch (err) {
        setSubmitError(err.response?.data?.error || 'Could not start application');
        return;
      }
    }

    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      await submitApplication();
      // Clear the local draft — no longer needed after submission
      localStorage.removeItem(STORAGE_KEY);
      onSubmitted?.(); // tell parent to switch to the status view
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progressPct = Math.round(((currentStep) / STEPS.length) * 100);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-900">Program Application</h1>
          <span className="text-sm text-brand-600 font-medium">{progressPct}% complete</span>
        </div>
        {/* Thin overall progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
          <div
            className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Step indicator */}
        <StepIndicator steps={STEPS} currentIndex={currentStep} />
      </div>

      {/* Auto-save notice */}
      <div className="text-xs text-gray-400 text-right mb-4 -mt-2">
        ✓ Progress saved automatically
      </div>

      {/* Step content card */}
      <div className="card p-6 mb-6">
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {submitError}
          </div>
        )}

        {currentStep === 0 && (
          <StepBasicInfo formData={formData} onChange={handleChange} errors={errors} />
        )}
        {currentStep === 1 && (
          <StepOrgDetails role={user?.role} formData={formData} onChange={handleChange} errors={errors} />
        )}
        {currentStep === 2 && (
          <StepDocuments role={user?.role} />
        )}
        {currentStep === 3 && (
          <StepReview
            role={user?.role}
            formData={formData}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>

      {/* Navigation buttons — hidden on the review step (it has its own submit button) */}
      {currentStep < 3 && (
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium
                       rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors"
          >
            Back
          </button>

          <button
            onClick={goNext}
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium
                       rounded-lg disabled:opacity-60 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
