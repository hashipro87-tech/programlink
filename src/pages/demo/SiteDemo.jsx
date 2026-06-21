import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ClipboardList, FileText, MessageSquare, Settings } from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',   path: '/demo/site',             icon: CheckCircle },
  { label: 'Meal Counts',path: '/demo/site/meal-counts', icon: ClipboardList },
  { label: 'Documents',  path: '/demo/site/documents',   icon: FileText },
  { label: 'Messages',   path: '/demo/site/messages',    icon: MessageSquare },
  { label: 'Settings',   path: '/demo/site/settings',    icon: Settings },
];

const HISTORY = [
  { date: 'Jun 20', breakfast: 22, lunch: 27, snack: 18, status: 'submitted' },
  { date: 'Jun 19', breakfast: 19, lunch: 25, snack: 20, status: 'submitted' },
  { date: 'Jun 18', breakfast: 21, lunch: 28, snack: 16, status: 'submitted' },
  { date: 'Jun 17', breakfast: 18, lunch: 24, snack: 14, status: 'submitted' },
];

const TASKS = [
  { text: 'Submit today\'s meal headcount', done: false, urgent: true },
  { text: 'Upload updated enrollment list', done: false, urgent: true },
  { text: 'Review June meal count report',  done: true,  urgent: false },
  { text: 'Confirm delivery window with kitchen', done: true, urgent: false },
];

export default function SiteDemo() {
  const [counts, setCounts] = useState({ breakfast: 22, lunch: 27, snack: 18 });
  const [submitted, setSubmitted] = useState(false);
  const [tasks, setTasks] = useState(TASKS);

  const toggle = (i) => setTasks(ts => ts.map((t, idx) => idx === i ? { ...t, done: !t.done } : t));

  return (
    <div className="flex h-screen bg-gray-50">
      <DemoBanner role="Site" />
      <DemoSidebar navItems={NAV} role="site" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-14 sm:p-8 max-w-3xl mx-auto">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Site Dashboard</h1>
            <p className="text-gray-500 mt-1">Happy Hearts Daycare · Demo Program</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Meals This Month', value: '1,284' },
              { label: 'Days Submitted',   value: '20/21' },
              { label: 'Avg Daily Count',  value: '61' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Today's Tasks */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Today's Tasks</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {tasks.map((task, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center gap-3">
                  <button
                    onClick={() => toggle(i)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      task.done ? 'bg-green-500 border-green-500 text-white' : task.urgent ? 'border-yellow-400' : 'border-gray-300'
                    }`}
                  >
                    {task.done && <span className="text-xs">✓</span>}
                  </button>
                  <span className={`text-sm ${task.done ? 'line-through text-gray-400' : task.urgent ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {task.text}
                  </span>
                  {task.urgent && !task.done && (
                    <span className="ml-auto text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-full">Due today</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Meal Count Submission */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Submit Today's Headcount</h2>
              <p className="text-xs text-gray-400 mt-0.5">June 21, 2026</p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { key: 'breakfast', label: '🌅 Breakfast' },
                  { key: 'lunch',     label: '☀️ Lunch' },
                  { key: 'snack',     label: '🍎 Snack' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={counts[key]}
                      onChange={(e) => { setSubmitted(false); setCounts(c => ({ ...c, [key]: +e.target.value })); }}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-center text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                ))}
              </div>
              {submitted ? (
                <div className="w-full py-2.5 bg-green-50 text-green-700 font-semibold text-sm rounded-xl text-center border border-green-100">
                  ✓ Headcount submitted!
                </div>
              ) : (
                <button
                  onClick={() => setSubmitted(true)}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Submit Headcount
                </button>
              )}
              <p className="text-center text-xs text-gray-400 mt-2">
                Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to submit real data.
              </p>
            </div>
          </div>

          {/* Reporting History */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Reporting History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-gray-500">Date</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Breakfast</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Lunch</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Snack</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {HISTORY.map((row) => (
                    <tr key={row.date}>
                      <td className="px-6 py-3 font-medium text-gray-900">{row.date}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{row.breakfast}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{row.lunch}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{row.snack}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">✓ Submitted</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-brand-600 rounded-2xl p-6 text-center text-white">
            <h3 className="text-lg font-bold mb-1">Managing a real site?</h3>
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
