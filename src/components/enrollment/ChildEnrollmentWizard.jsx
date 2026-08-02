// ChildEnrollmentWizard.jsx — 8-step guided child enrollment
// Replaces the flat "Add Child" modal with a step-by-step workflow.
// Works for both adding new children (starts at step 1) and
// reviewing/editing existing children (starts at audit summary, step 8).

import { useState } from 'react';
import { X, Check, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEALS = [
  { key: 'breakfast', label: 'Breakfast',  emoji: '🥣' },
  { key: 'lunch',     label: 'Lunch',      emoji: '🥗' },
  { key: 'snack',     label: 'Snack',      emoji: '🍎' },
  { key: 'supper',    label: 'Supper',     emoji: '🍽️' },
];

const STEP_LABELS = [
  'Child Info',
  'Parent',
  'Attendance',
  'Meals',
  'Income',
  'Enrollment',
  'Signature',
  'Review',
];

// The 8 things CACFPLink checks for audit readiness.
// step: which wizard step fixes this item (for "Fix →" buttons on step 8).
const AUDIT_CHECKS = [
  { label: 'Child created (name)',    done: c => !!(c.first_name && c.last_name),       step: 1 },
  { label: 'Date of birth',           done: c => !!(c.birthdate),                        step: 1 },
  { label: 'Parent added',            done: c => !!(c.parent_name && c.parent_phone),    step: 2 },
  { label: 'Attendance schedule',     done: c => !!(c.days_enrolled),                    step: 3 },
  { label: 'Approved meal types',     done: c => !!(c.meal_types),                       step: 4 },
  { label: 'Income certification',    done: c => !!(c.income_tier && c.income_cert_date), step: 5 },
  { label: 'Enrollment date',         done: c => !!(c.enrollment_date),                  step: 6 },
  { label: 'Parent signature',        done: c => !!(c.signature_obtained),               step: 7 },
];

// ─── Checkbox button used in Steps 3 and 4 ───────────────────────────────────

function CheckOption({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left w-full ${
        selected
          ? 'border-brand-500 bg-brand-50 text-brand-700'
          : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
      }`}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
      }`}>
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
      {children}
    </button>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export default function ChildEnrollmentWizard({ onClose, onSaved, initialChild, sites }) {
  // Editing opens at audit summary so sponsor sees what's missing.
  // Adding always starts at step 1.
  const [step,    setStep]    = useState(initialChild ? 8 : 1);
  const [child,   setChild]   = useState(initialChild ? normalizeDates(initialChild) : {});
  const [childId, setChildId] = useState(initialChild?.id || null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const patch = (updates) => setChild(c => ({ ...c, ...updates }));

  // Normalize dates from server (ISO timestamps → YYYY-MM-DD for <input type="date">)
  function normalizeDates(data) {
    const DATE_FIELDS = ['birthdate', 'enrollment_date', 'enrollment_expires', 'income_cert_date', 'income_cert_expires'];
    const out = { ...data };
    DATE_FIELDS.forEach(f => {
      if (out[f]) out[f] = String(out[f]).slice(0, 10);
    });
    return out;
  }

  // ── Toggles for days and meals (comma-separated strings in DB) ──
  const daysSet  = new Set((child.days_enrolled || '').split(',').map(d => d.trim()).filter(Boolean));
  const mealsSet = new Set((child.meal_types    || '').split(',').map(m => m.trim()).filter(Boolean));

  const toggleDay  = (day)  => {
    const s = new Set(daysSet);
    s.has(day)  ? s.delete(day)  : s.add(day);
    patch({ days_enrolled: [...s].join(',') });
  };
  const toggleMeal = (meal) => {
    const s = new Set(mealsSet);
    s.has(meal) ? s.delete(meal) : s.add(meal);
    patch({ meal_types: [...s].join(',') });
  };

  // ── Audit stats ──
  const auditDone  = AUDIT_CHECKS.filter(ch => ch.done(child)).length;
  const auditReady = auditDone === AUDIT_CHECKS.length;

  // ── Save current step data and advance ──
  async function saveAndNext() {
    // Step 8 = audit summary — if audit ready, auto-approve then close
    if (step === 8) {
      if (auditReady && childId) {
        try {
          await api.post(`/children/${childId}/review`, { approved: true });
        } catch {
          // Non-fatal — still close even if review call fails
        }
      }
      onSaved(child);
      onClose();
      return;
    }

    setSaving(true);
    setError('');
    try {
      let saved;
      if (!childId) {
        // Step 1 creates the record
        const { data } = await api.post('/children', child);
        setChildId(data.id);
        setChild(normalizeDates(data));
        saved = data;
      } else {
        const { data } = await api.put(`/children/${childId}`, child);
        setChild(normalizeDates(data));
        saved = data;
      }
      onSaved(saved);      // keep parent list in sync after each save
      setStep(s => s + 1);
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Validate step 1 before first save ──
  function validate() {
    if (step === 1) {
      if (!child.org_id)            { setError('Please select a site.');      return false; }
      if (!child.first_name?.trim()) { setError('First name is required.');   return false; }
      if (!child.last_name?.trim())  { setError('Last name is required.');    return false; }
      if (!child.birthdate)         { setError('Date of birth is required.'); return false; }
      if (!child.enrollment_date)   { setError('Enrollment date is required.'); return false; }
    }
    setError('');
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    saveAndNext();
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const childName = [child.first_name, child.last_name].filter(Boolean).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-lg leading-tight">
              {childId ? (childName || 'Child') : 'Add Child'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Step {step} of 8 — {STEP_LABELS[step - 1]}
              {step < 8 && <span className="text-gray-300"> · {8 - step} step{8 - step !== 1 ? 's' : ''} remaining</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step progress bar ── */}
        <div className="px-6 pt-4 pb-1 flex-shrink-0">
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((label, i) => (
              <button
                key={i}
                title={label}
                onClick={() => childId ? setStep(i + 1) : null}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i + 1 < step  ? 'bg-brand-500' :
                  i + 1 === step ? 'bg-brand-400' :
                  'bg-gray-100'
                } ${childId ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              />
            ))}
          </div>
          {/* Audit readiness mini-indicator (hidden on step 8) */}
          {step < 8 && auditDone > 0 && (
            <p className="text-[10px] text-gray-400 mt-1.5 text-right">
              {auditDone}/{AUDIT_CHECKS.length} audit items complete
            </p>
          )}
        </div>

        {/* ── Step content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ══ STEP 1: Child Identity ══ */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 leading-relaxed">
                Minimum required to create the record. All other details can be added in the next steps.
              </p>

              {/* Site */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Site <span className="text-red-500">*</span>
                </label>
                <select
                  value={child.org_id || ''}
                  onChange={e => patch({ org_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select a site…</option>
                  {(sites || []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={child.first_name || ''}
                    onChange={e => patch({ first_name: e.target.value })}
                    placeholder="First"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={child.last_name || ''}
                    onChange={e => patch({ last_name: e.target.value })}
                    placeholder="Last"
                  />
                </div>
              </div>

              {/* DOB + Enrollment Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={child.birthdate || ''}
                    onChange={e => patch({ birthdate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Enrollment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={child.enrollment_date || ''}
                    onChange={e => patch({ enrollment_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 2: Parent / Guardian ══ */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Parent or guardian contact information.</p>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Parent / Guardian Name</label>
                <input
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={child.parent_name || ''}
                  onChange={e => patch({ parent_name: e.target.value })}
                  placeholder="Full legal name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Parent Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={child.parent_phone || ''}
                  onChange={e => patch({ parent_phone: e.target.value })}
                  placeholder="(555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Parent Email{' '}
                  <span className="text-gray-400 normal-case font-normal text-[11px]">optional</span>
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={child.parent_email || ''}
                  onChange={e => patch({ parent_email: e.target.value })}
                  placeholder="parent@email.com"
                />
              </div>
            </div>
          )}

          {/* ══ STEP 3: Attendance Schedule ══ */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Which days does this child attend?</p>
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map(day => (
                  <CheckOption key={day} selected={daysSet.has(day)} onClick={() => toggleDay(day)}>
                    {day}
                  </CheckOption>
                ))}
              </div>
              {daysSet.size > 0 && (
                <p className="text-xs text-brand-600 font-medium">
                  {daysSet.size} day{daysSet.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {/* ══ STEP 4: Approved Meals ══ */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Which meals is this child approved for under CACFP?</p>
              <div className="space-y-2">
                {MEALS.map(({ key, label, emoji }) => (
                  <CheckOption key={key} selected={mealsSet.has(key)} onClick={() => toggleMeal(key)}>
                    <span className="text-base mr-1">{emoji}</span>
                    {label}
                  </CheckOption>
                ))}
              </div>
              {mealsSet.size > 0 && (
                <p className="text-xs text-brand-600 font-medium">
                  {mealsSet.size} meal{mealsSet.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {/* ══ STEP 5: Income Eligibility ══ */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Income tier sets the reimbursement rate CACFPLink uses to calculate your claim. It comes from the income form the family signed — you are recording what that form shows.
              </p>

              {/* How to determine tier */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-800 space-y-2">
                <p className="font-bold">How to determine the tier:</p>
                <div className="space-y-1">
                  <p>✅ <span className="font-semibold">Tier I</span> — Family income is at or below 185% of the Federal Poverty Level (FPL). This is the same threshold as free/reduced school lunch. If the family qualifies for WIC, SNAP, TANF, or Head Start, they are Tier I.</p>
                  <p>⬜ <span className="font-semibold">Tier II</span> — Family income is above 185% FPL and they do not qualify for any of the above programs.</p>
                  <p className="text-blue-600 mt-1">Tier I pays a higher reimbursement rate. Always collect a signed income statement from the family and keep it on file for audits.</p>
                </div>
              </div>

              {/* 2026 FPL quick reference */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600">
                <p className="font-bold text-gray-700 mb-1">2025–2026 Tier I income limits (185% FPL)</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <span>Family of 1: $27,861/yr</span><span>($2,322/mo)</span>
                  <span>Family of 2: $37,814/yr</span><span>($3,151/mo)</span>
                  <span>Family of 3: $47,767/yr</span><span>($3,981/mo)</span>
                  <span>Family of 4: $57,720/yr</span><span>($4,810/mo)</span>
                  <span>Family of 5: $67,673/yr</span><span>($5,640/mo)</span>
                  <span>Each add'l: +$9,953/yr</span><span>(+$829/mo)</span>
                </div>
              </div>

              {/* Tier picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Select Tier Based on Income Form</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'tier1', label: 'Tier I',  note: 'At or below 185% FPL — higher reimbursement' },
                    { val: 'tier2', label: 'Tier II', note: 'Above 185% FPL — standard reimbursement'     },
                  ].map(({ val, label, note }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => patch({ income_tier: val })}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                        child.income_tier === val
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className={`text-sm font-bold ${child.income_tier === val ? 'text-brand-700' : 'text-gray-800'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{note}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cert dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Certification Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={child.income_cert_date || ''}
                    onChange={e => {
                      const d = e.target.value;
                      // Auto-set expiry to +12 months
                      const expiry = d
                        ? new Date(new Date(d).setFullYear(new Date(d).getFullYear() + 1))
                            .toISOString().slice(0, 10)
                        : '';
                      patch({ income_cert_date: d, income_cert_expires: expiry });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={child.income_cert_expires || ''}
                    onChange={e => patch({ income_cert_expires: e.target.value })}
                  />
                  {child.income_cert_date && (
                    <p className="text-[11px] text-gray-400 mt-1">Auto-set to 12 months from cert date</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 6: Enrollment Period ══ */}
          {step === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Confirm the enrollment period. Some states require annual re-enrollment.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Enrollment Start
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={child.enrollment_date || ''}
                    onChange={e => patch({ enrollment_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Enrollment Expires{' '}
                    <span className="text-gray-400 normal-case font-normal text-[11px]">optional</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={child.enrollment_expires || ''}
                    onChange={e => patch({ enrollment_expires: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Leave expiration blank if your state doesn't require annual re-enrollment.
              </p>
            </div>
          )}

          {/* ══ STEP 7: Parent Signature ══ */}
          {step === 7 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Confirms the parent or guardian signed the enrollment form. Required for audit compliance.
              </p>

              {/* Large checkbox-style button */}
              <button
                type="button"
                onClick={() => patch({ signature_obtained: !child.signature_obtained })}
                className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                  child.signature_obtained
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  child.signature_obtained ? 'border-green-500 bg-green-500' : 'border-gray-300'
                }`}>
                  {child.signature_obtained && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-snug ${
                    child.signature_obtained ? 'text-green-800' : 'text-gray-700'
                  }`}>
                    Parent/guardian enrollment form has been signed
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Keep the physical form on file for audits.</p>
                </div>
              </button>

              {!child.signature_obtained && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Skip for now and come back once the form is signed. The child won't be audit-ready until this is confirmed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 8: Audit Summary ══ */}
          {step === 8 && (
            <div className="space-y-4">
              {/* Audit Ready badge */}
              <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                auditReady
                  ? 'border-green-400 bg-green-50'
                  : 'border-amber-300 bg-amber-50'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  auditReady ? 'bg-green-500' : 'bg-amber-400'
                }`}>
                  {auditReady
                    ? <Check className="w-6 h-6 text-white" strokeWidth={3} />
                    : <AlertTriangle className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <p className={`text-xl font-black tracking-tight ${
                    auditReady ? 'text-green-800' : 'text-amber-800'
                  }`}>
                    Audit Ready: {auditReady ? 'YES ✓' : 'NO'}
                  </p>
                  <p className={`text-xs mt-0.5 ${auditReady ? 'text-green-600' : 'text-amber-600'}`}>
                    {auditDone} of {AUDIT_CHECKS.length} items complete
                    {!auditReady && ` · ${AUDIT_CHECKS.length - auditDone} missing`}
                  </p>
                </div>
              </div>

              {/* Checklist */}
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {AUDIT_CHECKS.map((check, i) => {
                  const done = check.done(child);
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 ${done ? '' : 'bg-red-50/40'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        done ? 'bg-green-500' : 'bg-red-100'
                      }`}>
                        {done
                          ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          : <X className="w-3 h-3 text-red-400" strokeWidth={2.5} />}
                      </div>
                      <span className={`text-sm flex-1 ${done ? 'text-gray-700' : 'text-red-700 font-medium'}`}>
                        {check.label}
                      </span>
                      {!done && (
                        <button
                          type="button"
                          onClick={() => setStep(check.step)}
                          className="text-xs text-brand-600 hover:text-brand-800 font-semibold hover:underline flex items-center gap-0.5"
                        >
                          Fix <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {!auditReady && (
                <p className="text-xs text-gray-400 text-center">
                  Missing items won't block saving — you can complete them any time.
                </p>
              )}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
          {/* Back button (not on step 1) */}
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {/* Skip button (steps 2-7 only) */}
          {step > 1 && step < 8 && (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="px-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
          )}

          {/* Main CTA */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : step === 8 ? 'Done' : (
              <>
                Save & Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
