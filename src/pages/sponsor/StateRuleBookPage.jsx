// StateRuleBookPage.jsx — Sponsor's plain-English CACFP state reference
// Shows state-specific rates, deadlines, required forms, agency contact, and tips.
// Pulled from the Compliance Assistant panel (Task #133) and promoted to its own page.

import { useState, useEffect } from 'react';
import { ExternalLink, Phone, Mail, Calendar, FileText, Lightbulb,
         ShieldCheck, Building2, AlertCircle, DollarSign } from 'lucide-react';
import api from '../../services/api';

// ── State data ────────────────────────────────────────────────────────────────
const STATE_RESOURCES = {
  TX: {
    name: 'Texas', flag: '🤠',
    agency: 'Texas Department of Agriculture (TDA)',
    portal: 'https://squaremeals.org',
    portalName: 'SquareMeals (squaremeals.org)',
    phone: '1-877-TEX-MEAL (1-877-839-6325)',
    email: 'cacfp@texasagriculture.gov',
    deadlines: [
      { label: 'Monthly Claim Deadline', value: '60 days after month end', note: 'e.g., July claims due by Sept 30' },
      { label: 'Annual Sponsor Renewal', value: 'May 31 each year', note: 'Sponsor agreement via SquareMeals' },
      { label: 'Site Reviews', value: 'Every 3 years minimum', note: 'TDA schedules; 10 days to respond if contacted' },
    ],
    requiredForms: [
      { name: 'CACFP Sponsor Application', note: 'Annual renewal via SquareMeals portal' },
      { name: 'Site Application', note: 'Required for each new site added to your program' },
      { name: 'Monthly Claim for Reimbursement', note: 'Submitted via SquareMeals by the 60-day deadline' },
      { name: 'Production Records', note: 'Required for each meal service — retain 3 years' },
      { name: 'Attendance / Sign-in Sheets', note: 'Daily records per site — retain 3 years' },
      { name: 'Income Eligibility Forms', note: 'Required for Tier I/II determination — retain 3 years' },
    ],
    tips: [
      'Claims are submitted via SquareMeals only — TDA does not accept paper claims.',
      'Keep all records (meal counts, menus, income certs) for at least 3 years from submission.',
      'Contact TDA before deadlines if you have a data entry issue — late claims may be denied.',
    ],
  },
  CA: {
    name: 'California', flag: '🌴',
    agency: 'California Dept. of Social Services (CDSS)',
    portal: 'https://www.cdss.ca.gov/inforesources/cdss-programs/cacfp',
    portalName: 'CDSS CACFP Portal',
    phone: 'Contact your regional CDSS office',
    email: null,
    deadlines: [
      { label: 'Monthly Claim Deadline', value: '60 days after month end', note: 'Standard USDA deadline applies' },
      { label: 'Annual Renewal', value: 'Varies by sponsor approval date', note: 'Check with your CDSS regional office' },
    ],
    requiredForms: [
      { name: 'CACFP Sponsor Application (SNAC 07)', note: 'Annual renewal with CDSS' },
      { name: 'Site Application (SNAC 02)', note: 'Required for each site' },
      { name: 'Monthly Claim (SNAC 06)', note: 'Submitted to CDSS within 60 days' },
      { name: 'Income Eligibility Statement', note: 'For Tier I/II household determination' },
    ],
    tips: [
      'CDSS has regional offices — contact your assigned office for state-specific guidance.',
      'California requires Spanish-language versions of key parent forms in many counties.',
    ],
  },
  OH: {
    name: 'Ohio', flag: '🌻',
    agency: 'Ohio Dept. of Education (ODE)',
    portal: 'https://education.ohio.gov/Topics/Other-Resources/Food-and-Nutrition/Child-and-Adult-Care-Food-Program',
    portalName: 'ODE CACFP Page',
    phone: '614-466-2945',
    email: null,
    deadlines: [
      { label: 'Monthly Claim Deadline', value: '60 days after month end', note: 'Standard USDA deadline applies' },
      { label: 'Annual Renewal', value: 'Varies', note: 'Contact your ODE representative' },
    ],
    requiredForms: [
      { name: 'Sponsor Agreement', note: 'Annual renewal with ODE' },
      { name: 'Site Information Form', note: 'Required for each participating site' },
      { name: 'Monthly Claim for Reimbursement', note: 'Submitted to ODE within 60 days' },
      { name: 'Income Eligibility Forms', note: 'For household Tier determination' },
    ],
    tips: [
      'Contact your assigned ODE representative for state-specific deadlines.',
    ],
  },
  VA: {
    name: 'Virginia', flag: '🦅',
    agency: 'Virginia Dept. of Education (VDOE)',
    portal: 'https://www.doe.virginia.gov/programs-services/child-nutrition/cacfp',
    portalName: 'VDOE CACFP Page',
    phone: '804-225-2074',
    email: null,
    deadlines: [
      { label: 'Monthly Claim Deadline', value: '60 days after month end', note: 'Standard USDA deadline applies' },
      { label: 'Annual Renewal', value: 'Varies', note: 'Contact your VDOE specialist' },
    ],
    requiredForms: [
      { name: 'Sponsor Agreement', note: 'Annual renewal with VDOE' },
      { name: 'Site Information Form', note: 'Required for each site' },
      { name: 'Monthly Claim', note: 'Submitted to VDOE within 60 days' },
      { name: 'Household Income Statement', note: 'For Tier I/II classification' },
    ],
    tips: [
      'Virginia processes claims through VDOE — contact your assigned specialist for guidance.',
    ],
  },
  CO: {
    name: 'Colorado', flag: '🏔️',
    agency: 'Colorado Dept. of Human Services (CDHS)',
    portal: 'https://cdhs.colorado.gov/cacfp',
    portalName: 'CDHS CACFP Page',
    phone: '303-866-5700',
    email: null,
    deadlines: [
      { label: 'Monthly Claim Deadline', value: '60 days after month end', note: 'Standard USDA deadline applies' },
      { label: 'Annual Renewal', value: 'Varies', note: 'Contact CDHS for your specific renewal date' },
    ],
    requiredForms: [
      { name: 'Sponsor Agreement', note: 'Annual renewal with CDHS' },
      { name: 'Site Participation Agreement', note: 'Required for each site' },
      { name: 'Monthly Claim', note: 'Submitted to CDHS within 60 days' },
      { name: 'Income Eligibility Forms', note: 'For Tier determination' },
    ],
    tips: [
      'CDHS has a state-specific online portal — check cdhs.colorado.gov for the latest updates.',
    ],
  },
};

// USDA federal meal pattern (applies in all 50 states)
const MEAL_PATTERN = [
  {
    meal: 'Breakfast', emoji: '🌅',
    components: [
      { name: 'Milk', detail: '½ cup (fluid milk; whole for 1-yr, fat-free/low-fat for 2+)' },
      { name: 'Grains/Breads', detail: '½ serving minimum; at least 1 WGR item per week' },
      { name: 'Fruit or Vegetable', detail: '¼ cup (juice counts for one serving only)' },
    ],
  },
  {
    meal: 'Lunch/Supper', emoji: '🍽️',
    components: [
      { name: 'Milk', detail: '¾ cup (fluid milk; whole for 1-yr, fat-free/low-fat for 2+)' },
      { name: 'Meat/Meat Alt.', detail: '1½ oz (meat, poultry, fish, cheese, egg, legumes, peanut butter, yogurt)' },
      { name: 'Grains/Breads', detail: '½ serving minimum; at least 1 WGR item per week' },
      { name: 'Vegetable', detail: '¼ cup' },
      { name: 'Fruit', detail: '¼ cup (in addition to vegetable)' },
    ],
  },
  {
    meal: 'Snack', emoji: '🍎',
    components: [
      { name: 'Any 2 of 4', detail: 'Milk (½ cup) · Meat/Alt. (½ oz) · Grains (½ serving) · Fruit or Vegetable (¼ cup)' },
    ],
    note: 'Must choose 2 different components — same component twice does not count.',
  },
];

const MILK_RULES = [
  { age: 'Under 1 year',  rule: 'Breast milk or iron-fortified formula only — no fluid milk' },
  { age: '1 year',        rule: 'Whole milk (3.25% fat)' },
  { age: '2–5 years',     rule: 'Fat-free (skim) or low-fat (1%) milk only' },
  { age: '6+ years',      rule: 'Fat-free (skim) or low-fat (1%) milk only' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function StateRuleBookPage() {
  const [state, setState]   = useState(null);
  const [rates, setRates]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('state'); // 'state' | 'federal'

  useEffect(() => {
    api.get('/menus/rates')
      .then((res) => {
        setState(res.data?.state ?? null);
        setRates(res.data?.rates ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resource = state ? STATE_RESOURCES[state] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">State Rule Book</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {resource
              ? `${resource.flag} ${resource.name} CACFP rules, rates, deadlines, and forms — in plain English.`
              : 'Set your state in Settings → Organization to see state-specific guidance.'}
          </p>
        </div>
      </div>

      {/* No state set */}
      {!state && (
        <div className="card px-6 py-10 text-center">
          <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <p className="text-sm text-gray-700 font-semibold">No state configured</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Go to Settings → Organization → CACFP Program State → Save to unlock this page.
          </p>
          <a
            href="/dashboard/sponsor/settings"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors"
          >
            Go to Settings
          </a>
        </div>
      )}

      {state && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1.5 mb-6">
            {[
              { id: 'state', label: `${resource?.flag ?? ''} ${resource?.name ?? state} Rules` },
              { id: 'federal', label: '🇺🇸 Federal Meal Pattern' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── State tab ───────────────────────────────────────────── */}
          {tab === 'state' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left — main content */}
              <div className="lg:col-span-2 space-y-6">

                {/* Reimbursement Rates */}
                {rates && (
                  <div className="card">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <h2 className="font-semibold text-gray-900">FY2025 Reimbursement Rates — {resource?.name ?? state}</h2>
                    </div>
                    <div className="px-5 py-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                              <th className="text-left py-2 pr-4">Meal</th>
                              <th className="text-right py-2 px-4">Tier I</th>
                              <th className="text-right py-2 px-4">Tier II</th>
                              <th className="text-left py-2 pl-4 text-gray-300 font-normal">Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {[
                              { label: 'Breakfast', key: 'breakfast', emoji: '🌅' },
                              { label: 'Lunch',     key: 'lunch',     emoji: '🍽️' },
                              { label: 'Snack',     key: 'snack',     emoji: '🍎' },
                              { label: 'Supper',    key: 'supper',    emoji: '🌙' },
                            ].map(({ label, key, emoji }) => (
                              <tr key={key}>
                                <td className="py-3 pr-4 font-medium text-gray-800">
                                  {emoji} {label}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-green-700">
                                  ${(rates[key] ?? 0).toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right text-gray-500">
                                  —
                                </td>
                                <td className="py-3 pl-4 text-xs text-gray-400">
                                  per child served
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-3">
                        Rates shown are Tier I. Tier II rates are lower and apply to non-income-eligible providers.
                        These are federal rates set annually by USDA. Your state agency applies them directly.
                      </p>
                    </div>
                  </div>
                )}

                {/* Deadlines */}
                {resource?.deadlines?.length > 0 && (
                  <div className="card">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-500" />
                      <h2 className="font-semibold text-gray-900">Key Deadlines</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {resource.deadlines.map((d, i) => (
                        <div key={i} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-semibold text-gray-900">{d.label}</p>
                            <span className="text-sm font-bold text-brand-700 flex-shrink-0">{d.value}</span>
                          </div>
                          {d.note && (
                            <p className="text-xs text-gray-400 mt-1">{d.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Forms */}
                {resource?.requiredForms?.length > 0 && (
                  <div className="card">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-500" />
                      <h2 className="font-semibold text-gray-900">Required Forms</h2>
                      <span className="ml-auto text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                        {resource.requiredForms.length} forms
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {resource.requiredForms.map((f, i) => (
                        <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                          <div className="w-5 h-5 bg-orange-50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="w-3 h-3 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{f.name}</p>
                            {f.note && (
                              <p className="text-xs text-gray-400 mt-0.5">{f.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* State Tips */}
                {resource?.tips?.length > 0 && (
                  <div className="card">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <h2 className="font-semibold text-gray-900">State-Specific Tips</h2>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      {resource.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-yellow-400 mt-0.5 flex-shrink-0">💡</span>
                          <p className="text-sm text-gray-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No rich data for this state */}
                {resource && !resource.deadlines?.length && (
                  <div className="card px-6 py-8 text-center">
                    <AlertCircle className="w-7 h-7 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Full data for {resource.name} coming soon</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Contact your state CACFP agency directly for deadlines and forms.
                    </p>
                    {resource.portal && (
                      <a
                        href={resource.portal}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-brand-600 hover:underline"
                      >
                        {resource.portalName}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Right sidebar — agency contact */}
              <div className="space-y-6">
                {/* State Agency */}
                {resource && (
                  <div className="card">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <h2 className="font-semibold text-gray-900">State CACFP Agency</h2>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Agency</p>
                        <p className="text-sm font-semibold text-gray-800">{resource.agency}</p>
                      </div>
                      {resource.portal && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Portal</p>
                          <a
                            href={resource.portal}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline font-medium"
                          >
                            {resource.portalName}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {resource.phone && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {resource.phone}
                          </div>
                        </div>
                      )}
                      {resource.email && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Email</p>
                          <a
                            href={`mailto:${resource.email}`}
                            className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {resource.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Unknown state fallback */}
                {state && !resource && (
                  <div className="card px-5 py-6">
                    <p className="text-sm font-semibold text-gray-700 mb-1">{state} — contact your state agency</p>
                    <p className="text-xs text-gray-400">
                      Detailed guidance for {state} is coming soon. For now, contact your state's CACFP lead agency directly or visit the USDA CACFP site.
                    </p>
                    <a
                      href="https://www.fns.usda.gov/cacfp/contacts"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-brand-600 hover:underline"
                    >
                      USDA State Contacts
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* USDA link */}
                <div className="card px-5 py-4 bg-gray-50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">USDA Resources</p>
                  <div className="space-y-2">
                    {[
                      { label: 'CACFP Meal Patterns', url: 'https://www.fns.usda.gov/cacfp/meals-and-snacks' },
                      { label: 'Income Eligibility Guidelines', url: 'https://www.fns.usda.gov/cn/income-eligibility-guidelines' },
                      { label: 'State Agency Contacts', url: 'https://www.fns.usda.gov/cacfp/contacts' },
                    ].map(({ label, url }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Federal Meal Pattern tab ─────────────────────────────── */}
          {tab === 'federal' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                These USDA meal pattern requirements apply in all 50 states. Meeting them is what determines
                whether each meal is reimbursable.
              </p>

              {/* Meal pattern cards */}
              {MEAL_PATTERN.map((m) => (
                <div key={m.meal} className="card">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">{m.emoji} {m.meal}</h2>
                    {m.note && <p className="text-xs text-orange-600 mt-1 font-medium">⚠️ {m.note}</p>}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {m.components.map((c, i) => (
                      <div key={i} className="px-5 py-3 flex items-start gap-3">
                        <div className="w-2 h-2 bg-brand-400 rounded-full mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Milk rules */}
              <div className="card">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">🥛 Milk Requirements by Age</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {MILK_RULES.map((r, i) => (
                    <div key={i} className="px-5 py-3 flex items-start gap-4">
                      <span className="text-xs font-bold text-gray-500 w-24 flex-shrink-0 mt-0.5">{r.age}</span>
                      <p className="text-sm text-gray-700">{r.rule}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* WGR note */}
              <div className="card px-5 py-4 bg-amber-50 border border-amber-100">
                <p className="text-sm font-bold text-amber-800 mb-1">🌾 Whole Grain-Rich (WGR) Requirement</p>
                <p className="text-sm text-amber-700">
                  At least one grain serving per day must be whole grain-rich — meaning 50% or more of the
                  grain ingredients are whole grains. Check the ingredient list: the first ingredient must say
                  "whole wheat," "whole grain," or similar. Enriched flour does not count.
                </p>
              </div>

              {/* CFR citation */}
              <p className="text-xs text-gray-400 text-center">
                Source: 7 CFR Part 226 — USDA Child and Adult Care Food Program regulations
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
