import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, UtensilsCrossed, FileText, MessageSquare, Settings } from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',   path: '/demo/kitchen',            icon: CheckCircle },
  { label: 'Meal Counts',path: '/demo/kitchen/meal-counts',icon: UtensilsCrossed },
  { label: 'Documents',  path: '/demo/kitchen/documents',  icon: FileText },
  { label: 'Messages',   path: '/demo/kitchen/messages',   icon: MessageSquare },
  { label: 'Settings',   path: '/demo/kitchen/settings',   icon: Settings },
];

const MEALS = [
  { type: 'Breakfast', emoji: '🌅', count: 48,  max: 65 },
  { type: 'Lunch',     emoji: '☀️', count: 62,  max: 65 },
  { type: 'Supper',    emoji: '🌤', count: 31,  max: 65 },
  { type: 'Snack',     emoji: '🍎', count: 20,  max: 65 },
];

const DOCS = [
  { name: 'Site License',        status: 'current',     due: 'Dec 2026' },
  { name: 'Health Inspection',   status: 'current',     due: 'Jun 2027' },
  { name: 'CACFP Renewal',       status: 'expiring',    due: '7 days' },
  { name: 'Food Handler Certs',  status: 'in-progress', due: '3 of 4 uploaded' },
];

const DOC_STYLES = {
  current:     { badge: 'bg-green-50 text-green-700 border-green-100',  label: '✓ Current' },
  expiring:    { badge: 'bg-yellow-50 text-yellow-700 border-yellow-100', label: '⚠ Due Soon' },
  'in-progress': { badge: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'In Progress' },
};

export default function KitchenDemo() {
  const [counts, setCounts] = useState({ Breakfast: 48, Lunch: 62, Supper: 31, Snack: 20 });
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <DemoBanner role="Kitchen" />
      <DemoSidebar navItems={NAV} role="kitchen" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-14 sm:p-8 max-w-3xl mx-auto">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
            <p className="text-gray-500 mt-1">Sunshine Kitchen · Demo Program</p>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Meals This Month', value: '1,842' },
              { label: 'Days Submitted',   value: '18/21' },
              { label: 'Compliance',       value: '92%' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Meal Count Entry */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Today's Meal Counts</h2>
                <p className="text-xs text-gray-400 mt-0.5">June 21, 2026 — Draft</p>
              </div>
              {submitted && (
                <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full">
                  ✓ Submitted
                </span>
              )}
            </div>
            <div className="px-6 py-4 space-y-4">
              {MEALS.map(({ type, emoji, max }) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">{emoji} {type}</label>
                    <span className="text-lg font-bold text-brand-600">{counts[type]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={max}
                    value={counts[type]}
                    onChange={(e) => setSubmitted(false) || setCounts(c => ({ ...c, [type]: +e.target.value }))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>0</span><span>{max} max</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              {submitted ? (
                <div className="w-full py-2.5 bg-green-50 text-green-700 font-semibold text-sm rounded-xl text-center border border-green-100">
                  ✓ Counts submitted — great work!
                </div>
              ) : (
                <button
                  onClick={() => setSubmitted(true)}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Submit Meal Counts
                </button>
              )}
              <p className="text-center text-xs text-gray-400 mt-2">
                This is a demo.{' '}
                <Link to="/register" className="text-brand-600 hover:underline">Sign up</Link>
                {' '}to submit real counts.
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Compliance Documents</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {DOCS.map((doc) => (
                <div key={doc.name} className="px-6 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.due}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${DOC_STYLES[doc.status].badge}`}>
                    {DOC_STYLES[doc.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-brand-600 rounded-2xl p-6 text-center text-white">
            <h3 className="text-lg font-bold mb-1">Ready to use this for your kitchen?</h3>
            <p className="text-brand-200 text-sm mb-4">Ask your program sponsor for their Sponsor ID, then sign up free.</p>
            <Link to="/register" className="inline-block bg-white text-brand-700 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              Get Started Free →
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
