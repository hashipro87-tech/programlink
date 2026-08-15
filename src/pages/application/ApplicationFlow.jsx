// ApplicationFlow.jsx — Multi-step application form
//
// Features:
//   • "How it works" intro card (dismissible, stored in localStorage)
//   • "Step X of 4 • ~Y min" progress label
//   • "Last saved X seconds ago" live timestamp
//   • Desktop checklist sidebar showing field completion in real time
//   • Auto-save to localStorage on every keystroke
//   • Validation per step before advancing

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, Clock, FileText, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../hooks/useApplication';
import StepBasicInfo  from './steps/StepBasicInfo';
import StepOrgDetails from './steps/StepOrgDetails';
import StepDocuments  from './steps/StepDocuments';
import StepReview     from './steps/StepReview';

// ─── Step metadata ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'basic',     label: 'Basic Info', time: 3 },
  { id: 'details',   label: 'Details',    time: 2 },
  { id: 'documents', label: 'Documents',  time: 3 },
  { id: 'review',    label: 'Review',     time: 1 },
];

// Checklist items per step (used in the sidebar)
const BASIC_ITEMS = [
  { key: 'orgName',     label: 'Organization name' },
  { key: 'orgType',     label: 'Organization type' },
  { key: 'contactName', label: 'Contact name' },
  { key: 'phone',       label: 'Phone number' },
  { key: 'email',       label: 'Email address' },
  { key: 'address',     label: 'Street address' },
];
const DETAIL_ITEMS = {
  kitchen:  [{ key: 'kitchenType', label: 'Kitchen type' }, { key: 'mealCapacity', label: 'Meal capacity' }],
  site:     [{ key: 'siteType',    label: 'Site type'    }, { key: 'enrollment',   label: 'Enrollment'   }],
  delivery: [{ key: 'vehicleType', label: 'Vehicle type' }, { key: 'vehicleCount', label: 'Vehicle count'}],
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validateStep(stepId, formData, role) {
  const errors = {};
  if (stepId === 'basic') {
    if (!formData.orgName?.trim())     errors.orgName     = 'Organization name is required';
    if (!formData.orgType)             errors.orgType     = 'Organization type is required';
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

// ─── How it works card ────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  { icon: FileText, color: 'text-brand-600 bg-brand-50', title: 'Complete application',   desc: 'Fill in your organization details and contact info.' },
  { icon: Shield,   color: 'text-purple-600 bg-purple-50', title: 'Upload documents',      desc: 'W-9, permits, insurance, and other required files.' },
  { icon: Clock,    color: 'text-yellow-600 bg-yellow-50', title: 'Sponsor reviews',       desc: 'Your coordinator reviews within 2–3 business days.' },
  { icon: CheckCircle, color: 'text-green-600 bg-green-50', title: 'Receive approval',     desc: 'Get notified and start participating in the program.' },
];

function HowItWorksCard({ onDismiss }) {
  return (
    <div className="card mb-6 border-brand-100 bg-brand-50/30">
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 mb-3">How the application works</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-col items-start gap-1.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">{i + 1}. {step.title}</p>
                  <p className="text-xs text-gray-500 leading-snug">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5 underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Step progress indicator ──────────────────────────────────────────────────
function StepIndicator({ steps, currentIndex }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((step, i) => {
        const done   = i < currentIndex;
        const active = i === currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
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

// ─── Checklist sidebar ────────────────────────────────────────────────────────
function ChecklistSidebar({ formData, role, currentStep }) {
  const detailItems = DETAIL_ITEMS[role] ?? [];

  const isDone = (key) => !!formData[key]?.toString().trim();

  const sections = [
    {
      label: '1. Basic Info',
      items: BASIC_ITEMS,
      stepIndex: 0,
    },
    {
      label: '2. Details',
      items: detailItems,
      stepIndex: 1,
    },
    {
      label: '3. Documents',
      items: [{ key: '__docs__', label: 'Upload required documents' }],
      stepIndex: 2,
    },
    {
      label: '4. Review & Submit',
      items: [{ key: '__review__', label: 'Submit application' }],
      stepIndex: 3,
    },
  ];

  return (
    <div className="card p-4 sticky top-4">
      <p className="text-sm font-bold text-gray-900 mb-4">Your Checklist</p>
      <div className="space-y-4">
        {sections.map((section) => {
          const done  = section.items.filter((i) => isDone(i.key)).length;
          const total = section.items.length;
          const isPast   = currentStep > section.stepIndex;
          const isCurrent = currentStep === section.stepIndex;

          return (
            <div key={section.label}>
              <div className="flex items-center justify-between mb-1.5">
                <p className={`text-xs font-semibold ${
                  isCurrent ? 'text-brand-700' :
                  isPast    ? 'text-green-700' :
                              'text-gray-400'
                }`}>
                  {section.label}
                </p>
                <span className="text-[10px] text-gray-400">{done}/{total}</span>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const checked = isPast || isDone(item.key);
                  return (
                    <div key={item.key} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {checked
                          ? <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                          : <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        }
                      </div>
                      <span className={`text-xs transition-colors ${
                        checked ? 'text-gray-400 line-through' : 'text-gray-600'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Connector dot */}
              {section.stepIndex < 3 && (
                <div className="ml-2 mt-2 w-px h-3 bg-gray-200" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ApplicationFlow({ onSubmitted }) {
  const { user } = useAuth();
  const { application, loading, saving, createApplication, submitApplication } = useApplication();

  const STORAGE_KEY      = `pl_app_draft_${user?.id}`;
  const HOW_DISMISSED_KEY = `pl_how_${user?.id}`;

  // Restore form from localStorage
  const [formData, setFormData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  });

  const [currentStep,  setCurrentStep]  = useState(0);
  const [errors,       setErrors]       = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState('');
  const [showHowTo,    setShowHowTo]    = useState(
    () => !localStorage.getItem(HOW_DISMISSED_KEY)
  );

  // "Last saved X ago" tracking
  const [lastSavedAt,  setLastSavedAt]  = useState(null);
  const [saveLabel,    setSaveLabel]    = useState('');

  // Auto-save on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    setLastSavedAt(Date.now());
  }, [formData, STORAGE_KEY]);

  // Update relative save time label every 5 seconds
  useEffect(() => {
    if (!lastSavedAt) return;
    const update = () => {
      const sec = Math.floor((Date.now() - lastSavedAt) / 1000);
      if (sec < 5)        setSaveLabel('Saved just now');
      else if (sec < 60)  setSaveLabel(`Saved ${sec}s ago`);
      else                setSaveLabel(`Saved ${Math.floor(sec / 60)}m ago`);
    };
    update();
    const iv = setInterval(update, 5000);
    return () => clearInterval(iv);
  }, [lastSavedAt]);

  const handleChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev }; delete next[name]; return next;
    });
  }, []);

  const goNext = async () => {
    const stepId  = STEPS[currentStep].id;
    const newErrs = validateStep(stepId, formData, user?.role);
    if (Object.keys(newErrs).length) { setErrors(newErrs); return; }
    setErrors({});
    setSubmitError('');
    if (currentStep === 0 && !application) {
      try { await createApplication(); }
      catch (err) { setSubmitError(err.response?.data?.error || 'Could not start application'); return; }
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
      await submitApplication(formData);
      localStorage.removeItem(STORAGE_KEY);
      onSubmitted?.();
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const dismissHowTo = () => {
    localStorage.setItem(HOW_DISMISSED_KEY, '1');
    setShowHowTo(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const remainingMin = STEPS.slice(currentStep).reduce((s, st) => s + st.time, 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* How it works — shown once, dismissible */}
      {showHowTo && <HowItWorksCard onDismiss={dismissHowTo} />}

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Program Application</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Step {currentStep + 1} of {STEPS.length}
              <span className="mx-1.5 text-gray-300">·</span>
              <Clock className="inline w-3.5 h-3.5 text-gray-400 -mt-0.5" />
              <span className="ml-1">~{remainingMin} min remaining</span>
            </p>
          </div>
          <span className="text-xs text-gray-400">
            {saveLabel || '✓ Auto-saving…'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
          <div
            className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>

        <StepIndicator steps={STEPS} currentIndex={currentStep} />
      </div>

      {/* Two-column layout: form + sidebar */}
      <div className="flex gap-6 items-start">
        {/* ── Form column ── */}
        <div className="flex-1 min-w-0">
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
            {currentStep === 2 && <StepDocuments role={user?.role} />}
            {currentStep === 3 && (
              <StepReview role={user?.role} formData={formData} onSubmit={handleSubmit} submitting={submitting} />
            )}
          </div>

          {/* Navigation buttons */}
          {currentStep < 3 && (
            <div className="flex items-center justify-between">
              <button
                onClick={goBack}
                disabled={currentStep === 0}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium
                           rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              <button
                onClick={goNext}
                disabled={saving}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold
                           rounded-xl disabled:opacity-60 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                {saving ? 'Saving…' : `Continue to ${STEPS[currentStep + 1]?.label ?? 'Review'} →`}
              </button>
            </div>
          )}
        </div>

        {/* ── Checklist sidebar (desktop only) ── */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <ChecklistSidebar
            formData={formData}
            role={user?.role}
            currentStep={currentStep}
          />
        </div>
      </div>
    </div>
  );
}
