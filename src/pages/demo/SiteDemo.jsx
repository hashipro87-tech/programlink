import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ClipboardList, FileText, MessageSquare, Settings, Upload, AlertTriangle, Clock, Truck, CheckSquare, Activity, Plus, DollarSign, ChevronDown, ChevronUp, RotateCcw, Calendar } from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',      path: '/demo/site',               icon: CheckCircle   },
  { label: 'Deliveries',    path: '/demo/site/deliveries',    icon: Truck         },
  { label: 'Meal Counts',   path: '/demo/site/meal-counts',   icon: ClipboardList },
  { label: 'Income Certs',  path: '/demo/site/income',        icon: DollarSign    },
  { label: 'Renewals',      path: '/demo/site/renewal',       icon: RotateCcw     },
  { label: 'Tasks',         path: '/demo/site/tasks',         icon: CheckSquare   },
  { label: 'Documents',     path: '/demo/site/documents',     icon: FileText      },
  { label: 'Messages',      path: '/demo/site/messages',      icon: MessageSquare },
  { label: 'Activity',      path: '/demo/site/activity',      icon: Activity      },
  { label: 'Settings',      path: '/demo/site/settings',      icon: Settings      },
];

const HISTORY = [
  { date: 'Jul 3',  breakfast: 22, lunch: 27, snack: 18, status: 'verified' },
  { date: 'Jul 2',  breakfast: 19, lunch: 25, snack: 20, status: 'verified' },
  { date: 'Jul 1',  breakfast: 21, lunch: 28, snack: 16, status: 'submitted' },
  { date: 'Jun 30', breakfast: 18, lunch: 24, snack: 14, status: 'submitted' },
  { date: 'Jun 27', breakfast: 23, lunch: 29, snack: 17, status: 'verified' },
  { date: 'Jun 26', breakfast: 20, lunch: 26, snack: 15, status: 'verified' },
];

const TASKS = [
  { text: "Submit today's meal headcount", done: false, urgent: true },
  { text: 'Upload updated enrollment list', done: false, urgent: true },
  { text: 'Review June meal count report',  done: true,  urgent: false },
  { text: 'Confirm delivery window with kitchen', done: true, urgent: false },
];

const DOCUMENTS = [
  { name: 'Enrollment List',      type: 'enrollment', status: 'valid',       expires: 'Dec 31, 2026', uploaded: 'Jan 3, 2026' },
  { name: 'Facility License',     type: 'license',    status: 'expiring',    expires: 'Aug 15, 2026', uploaded: 'Aug 14, 2025' },
  { name: 'Liability Insurance',  type: 'insurance',  status: 'valid',       expires: 'Mar 1, 2027',  uploaded: 'Mar 1, 2026' },
  { name: 'Health Certification', type: 'health_cert',status: 'missing',     expires: null,           uploaded: null },
];

// Jul 14 is today (Monday)
const WEEK = [
  { day: 'Mon', date: 14, isToday: true,  delivery: { kitchen: 'Downtown Kitchen', eta: '8:00 AM', breakfast: 18, lunch: 22, snack: 10 } },
  { day: 'Tue', date: 15, isToday: false, delivery: { kitchen: 'Downtown Kitchen', eta: '8:00 AM', breakfast: 18, lunch: 22, snack: 10 } },
  { day: 'Wed', date: 16, isToday: false, delivery: { kitchen: 'Downtown Kitchen', eta: '8:00 AM', breakfast: 18, lunch: 22, snack: 10 } },
  { day: 'Thu', date: 17, isToday: false, delivery: { kitchen: 'Downtown Kitchen', eta: '8:00 AM', breakfast: 18, lunch: 22, snack: 10 } },
  { day: 'Fri', date: 18, isToday: false, delivery: { kitchen: 'Downtown Kitchen', eta: '8:00 AM', breakfast: 18, lunch: 22, snack: 10 } },
  { day: 'Sat', date: 19, isToday: false, delivery: null },
  { day: 'Sun', date: 20, isToday: false, delivery: null },
];

function WeekDeliverySchedule() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">This Week's Deliveries</h2>
          <p className="text-xs text-gray-400 mt-0.5">Recurring plan — set up by your sponsor</p>
        </div>
        <Link to="/demo/site/deliveries" className="text-xs text-brand-600 hover:underline font-semibold">Full schedule →</Link>
      </div>
      <div className="divide-y divide-gray-100">
        {WEEK.map(({ day, date, isToday, delivery }) => (
          <div key={day} className={`px-6 py-3.5 flex items-center gap-4 ${isToday ? 'bg-brand-50' : ''}`}>
            <div className={`w-10 text-center flex-shrink-0`}>
              <p className={`text-xs font-bold ${isToday ? 'text-brand-600' : 'text-gray-400'}`}>{day}</p>
              <p className={`text-lg font-bold leading-tight ${isToday ? 'text-brand-700' : 'text-gray-900'}`}>{date}</p>
            </div>
            {delivery ? (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1.5">{delivery.kitchen} · {delivery.eta}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {delivery.breakfast > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">Breakfast: {delivery.breakfast}</span>}
                    {delivery.lunch     > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Lunch: {delivery.lunch}</span>}
                    {delivery.snack     > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Snack: {delivery.snack}</span>}
                  </div>
                </div>
                {isToday && (
                  <span className="text-xs font-bold text-brand-600 bg-brand-100 px-2.5 py-1 rounded-full flex-shrink-0">Today</span>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-300 italic flex-1">No delivery</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const DOC_STATUS = {
  valid:    { label: 'Valid',      bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100', icon: '✓' },
  expiring: { label: 'Expiring',   bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100', icon: '⚠' },
  missing:  { label: 'Missing',    bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100',   icon: '!' },
};

const MESSAGES = [
  {
    from: 'Demo Sponsor',
    time: 'Today, 9:14 AM',
    text: "Hi Happy Hearts team — just a reminder that your facility license expires August 15. Please upload the renewed certificate when you have it. Let me know if you have questions.",
    fromSponsor: true,
  },
  {
    from: 'Happy Hearts Daycare',
    time: 'Today, 10:02 AM',
    text: "Thanks for the heads up! We're in the process of renewing — should have it uploaded by end of week.",
    fromSponsor: false,
  },
  {
    from: 'Demo Sponsor',
    time: 'Yesterday, 3:45 PM',
    text: "Great work on the meal count submissions this month — you're at 20/21 days submitted. Keep it up!",
    fromSponsor: true,
  },
];

// ─── Overview ────────────────────────────────────────────────────────────────
function OverviewPage() {
  const [counts, setCounts] = useState({ breakfast: 22, lunch: 27, snack: 18 });
  const [submitted, setSubmitted] = useState(false);
  const [tasks, setTasks] = useState(TASKS);
  const toggle = (i) => setTasks(ts => ts.map((t, idx) => idx === i ? { ...t, done: !t.done } : t));

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Site Dashboard</h1>
        <p className="text-gray-500 mt-1">Happy Hearts Daycare · Demo Program</p>
      </div>

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

      <WeekDeliverySchedule />

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Submit Today's Headcount</h2>
          <p className="text-xs text-gray-400 mt-0.5">July 14, 2026</p>
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
                  type="number" min={0} max={99} value={counts[key]}
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

      <div className="bg-brand-600 rounded-2xl p-6 text-center text-white">
        <h3 className="text-lg font-bold mb-1">Managing a real site?</h3>
        <p className="text-brand-200 text-sm mb-4">Ask your program sponsor for their Sponsor ID, then sign up free.</p>
        <Link to="/register" className="inline-block bg-white text-brand-700 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          Get Started Free →
        </Link>
      </div>
    </>
  );
}

// ─── Meal Counts ─────────────────────────────────────────────────────────────
function MealCountsPage() {
  const [counts, setCounts] = useState({ breakfast: '', lunch: '', snack: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!counts.breakfast && !counts.lunch && !counts.snack) return;
    setSubmitted(true);
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meal Counts</h1>
        <p className="text-gray-500 mt-1">Happy Hearts Daycare · Submit and track daily headcounts</p>
      </div>

      {/* Today's submission */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Today's Headcount</h2>
            <p className="text-xs text-gray-400 mt-0.5">July 6, 2026 · Due by 11:59 PM</p>
          </div>
          <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 px-2.5 py-1 rounded-full">Not submitted</span>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-3 gap-5 mb-5">
            {[
              { key: 'breakfast', label: 'Breakfast', emoji: '🌅', placeholder: '0' },
              { key: 'lunch',     label: 'Lunch',     emoji: '☀️', placeholder: '0' },
              { key: 'snack',     label: 'Snack',     emoji: '🍎', placeholder: '0' },
            ].map(({ key, label, emoji, placeholder }) => (
              <div key={key} className="text-center">
                <div className="text-2xl mb-1">{emoji}</div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{label}</label>
                <input
                  type="number" min={0} max={200}
                  value={counts[key]}
                  placeholder={placeholder}
                  onChange={(e) => { setSubmitted(false); setCounts(c => ({ ...c, [key]: e.target.value })); }}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-center text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            ))}
          </div>
          {submitted ? (
            <div className="w-full py-3 bg-green-50 text-green-700 font-semibold text-sm rounded-xl text-center border border-green-100">
              ✓ Headcount submitted successfully!
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Submit Headcount
            </button>
          )}
          <p className="text-center text-xs text-gray-400 mt-2">
            Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to submit real data.
          </p>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'This Month',  value: '1,284', sub: 'total meals' },
          { label: 'Days Filed',  value: '20/21', sub: 'of working days' },
          { label: 'Avg Breakfast', value: '20',  sub: 'per day' },
          { label: 'Avg Lunch',   value: '26',    sub: 'per day' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* History table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Submission History</h2>
          <span className="text-xs text-gray-400">July 2026</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-gray-500">Date</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Breakfast</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Lunch</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Snack</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Total</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {HISTORY.map((row) => (
                <tr key={row.date} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{row.date}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.breakfast}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.lunch}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.snack}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{row.breakfast + row.lunch + row.snack}</td>
                  <td className="px-4 py-3 text-right">
                    {row.status === 'verified'
                      ? <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">✓ Verified</span>
                      : <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">Submitted</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Documents ───────────────────────────────────────────────────────────────
function DocumentsPage() {
  const [docs, setDocs] = useState(DOCUMENTS);
  const [uploading, setUploading] = useState(null);

  const simulateUpload = (name) => {
    setUploading(name);
    setTimeout(() => {
      setDocs(d => d.map(doc => doc.name === name ? { ...doc, status: 'valid', uploaded: 'Jul 6, 2026', expires: 'Jul 6, 2027' } : doc));
      setUploading(null);
    }, 1500);
  };

  const missing = docs.filter(d => d.status === 'missing').length;
  const expiring = docs.filter(d => d.status === 'expiring').length;
  const valid = docs.filter(d => d.status === 'valid').length;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-500 mt-1">Happy Hearts Daycare · Compliance documents for your site</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Valid',    value: valid,    color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-100' },
          { label: 'Expiring', value: expiring, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-100' },
          { label: 'Missing',  value: missing,  color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-100' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className={`text-xs font-semibold ${color} mt-0.5`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Document list */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Required Documents</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {docs.map((doc) => {
            const s = DOC_STATUS[doc.status];
            return (
              <div key={doc.name} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900">{doc.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                      {s.icon} {s.label}
                    </span>
                  </div>
                  {doc.status === 'missing' ? (
                    <p className="text-xs text-red-500">Document required — upload to stay compliant</p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      {doc.status === 'expiring' && <span className="text-yellow-600 font-medium">Expires {doc.expires} · </span>}
                      {doc.status === 'valid' && `Expires ${doc.expires} · `}
                      Uploaded {doc.uploaded}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => simulateUpload(doc.name)}
                  disabled={uploading === doc.name}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    uploading === doc.name
                      ? 'bg-gray-50 text-gray-400 border-gray-200'
                      : doc.status === 'missing'
                        ? 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  {uploading === doc.name ? 'Uploading...' : doc.status === 'missing' ? 'Upload' : 'Replace'}
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to upload real documents.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Messages ────────────────────────────────────────────────────────────────
function MessagesPage() {
  const [message, setMessage] = useState('');
  const [msgs, setMsgs] = useState(MESSAGES);
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!message.trim()) return;
    setMsgs(m => [...m, {
      from: 'Happy Hearts Daycare',
      time: 'Just now',
      text: message,
      fromSponsor: false,
    }]);
    setMessage('');
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">Happy Hearts Daycare · Messages from your sponsor</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">DS</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Demo Sponsor</p>
            <p className="text-xs text-gray-400">Your CACFP program sponsor</p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-80 overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.fromSponsor ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${
                m.fromSponsor
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-brand-600 text-white'
              }`}>
                <p className="text-sm">{m.text}</p>
                <p className={`text-xs mt-1 ${m.fromSponsor ? 'text-gray-400' : 'text-brand-200'}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              onClick={send}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to message your real sponsor.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Happy Hearts Daycare · Site profile and preferences</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Site Profile</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'Site Name', value: 'Happy Hearts Daycare' },
            { label: 'Contact Name', value: 'Jane Smith' },
            { label: 'Email', value: 'jane@happyhearts.org' },
            { label: 'Phone', value: '(515) 555-0142' },
            { label: 'Address', value: '123 Maple Street, Des Moines, IA 50301' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
              <input
                type="text"
                defaultValue={value}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          ))}
          {saved ? (
            <div className="w-full py-2.5 bg-green-50 text-green-700 font-semibold text-sm rounded-xl text-center border border-green-100">
              ✓ Settings saved!
            </div>
          ) : (
            <button
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Save Changes
            </button>
          )}
          <p className="text-center text-xs text-gray-400">
            Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to manage a real site.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Deliveries ──────────────────────────────────────────────────────────────
function DeliveriesPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-gray-500 mt-1">Happy Hearts Daycare · Week of July 14–20</p>
      </div>
      <WeekDeliverySchedule />
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
        <Truck className="w-8 h-8 text-gray-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-600 mb-1">Delivery schedule set by your sponsor</p>
        <p className="text-xs text-gray-400 mb-4">Your program sponsor creates recurring delivery plans and you see them automatically — no manual input needed.</p>
        <Link to="/register" className="inline-block bg-brand-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-brand-700 transition-colors">
          Get Started Free →
        </Link>
      </div>
    </>
  );
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
function SiteTasksPage() {
  const SITE_TASKS = [
    { title:"Submit today's meal counts",        priority:'urgent', due:'Today',    done: false },
    { title:'Upload updated enrollment list',    priority:'high',   due:'Jul 22',   done: false },
    { title:'Confirm July delivery schedule',    priority:'medium', due:'Jul 25',   done: false },
    { title:'Review June meal count report',     priority:'low',    due:'Jul 18',   done: true  },
  ];
  const [tasks, setTasks] = useState(SITE_TASKS);
  const toggle = (i) => setTasks(t => t.map((x, idx) => idx === i ? { ...x, done: !x.done } : x));
  const PCOL = { urgent:'text-red-700 bg-red-50', high:'text-orange-700 bg-orange-50', medium:'text-amber-700 bg-amber-50', low:'text-gray-600 bg-gray-100' };
  const open = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-500 mt-1">{open.length} open · {done.length} completed</p>
      </div>
      {open.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Open</h2></div>
          <div className="divide-y divide-gray-50">
            {tasks.map((t, i) => !t.done && (
              <div key={i} className="px-5 py-4 flex items-start gap-3">
                <button onClick={() => toggle(i)} className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 hover:border-brand-500 transition-colors" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${PCOL[t.priority]}`}>{t.priority}</span>
                    <span className="text-xs text-gray-400">Due {t.due}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4 opacity-60">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-400">Completed</h2></div>
          <div className="divide-y divide-gray-50">
            {tasks.map((t, i) => t.done && (
              <div key={i} className="px-5 py-4 flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded border-2 border-green-400 bg-green-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-gray-400 line-through">{t.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-brand-600 rounded-2xl p-5 text-center text-white mt-4">
        <p className="font-bold mb-1">Managing a real site?</p>
        <p className="text-brand-200 text-sm mb-3">Your sponsor will invite you to join CACFPLink.</p>
        <Link to="/register" className="inline-block bg-white text-brand-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-50">Get Started →</Link>
      </div>
    </>
  );
}

// ─── Activity ─────────────────────────────────────────────────────────────────
function SiteActivityPage() {
  const SITE_ACTIVITY = [
    { icon:'🍽️', text:'You submitted breakfast count (22 children)',    time:'8:15 AM',   group:'Today'     },
    { icon:'🚚', text:'Delivery arrived from Downtown Kitchen',         time:'7:50 AM',   group:'Today'     },
    { icon:'📄', text:'You uploaded Enrollment List',                   time:'Yesterday', group:'Yesterday' },
    { icon:'✅', text:'July 18 meal count verified by coordinator',     time:'Yesterday', group:'Yesterday' },
    { icon:'💬', text:'New message from sponsor',                       time:'Jul 19',    group:'Jul 19'    },
  ];
  const groups = [...new Set(SITE_ACTIVITY.map(a => a.group))];
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
        <p className="text-gray-500 mt-1">Everything that happened at your site</p>
      </div>
      <div className="space-y-6">
        {groups.map(g => (
          <div key={g}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{g}</p>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-50">
              {SITE_ACTIVITY.filter(a => a.group === g).map((a, i) => (
                <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                  <span className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center text-sm flex-shrink-0">{a.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{a.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Income Certs Page ────────────────────────────────────────────────────────
const DEMO_CHILDREN = [
  { id: 1, name: 'Emma Johnson',    age: 'Preschool',  status: 'expired',  cert_date: 'Jul 1, 2025',  expires: 'Jun 30, 2026', tier: 'Tier I' },
  { id: 2, name: 'James Smith',     age: 'Toddler',    status: 'missing',  cert_date: null,            expires: null,           tier: null     },
  { id: 3, name: 'Aisha Williams',  age: 'Preschool',  status: 'valid',    cert_date: 'Oct 15, 2025', expires: 'Oct 14, 2026', tier: 'Tier I' },
  { id: 4, name: 'Diego Martinez',  age: 'School Age', status: 'expiring', cert_date: 'Jul 30, 2025', expires: 'Jul 29, 2026', tier: 'Tier II'},
  { id: 5, name: 'Mia Chen',        age: 'Toddler',    status: 'valid',    cert_date: 'Jan 5, 2026',  expires: 'Jan 4, 2027',  tier: 'Tier I' },
  { id: 6, name: 'Liam Thompson',   age: 'Preschool',  status: 'missing',  cert_date: null,            expires: null,           tier: null     },
];
const CERT_META = {
  valid:    { label: 'Certified',     dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border-green-100'  },
  expiring: { label: 'Expiring Soon', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-100'  },
  expired:  { label: 'Expired',       dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700 border-red-100'        },
  missing:  { label: 'Not Certified', dot: 'bg-gray-300',  badge: 'bg-gray-50 text-gray-600 border-gray-200'     },
};
const ORDER = { missing: 0, expired: 1, expiring: 2, valid: 3 };

function IncomeCertsPage() {
  const [open, setOpen] = useState(null);
  const sorted = [...DEMO_CHILDREN].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const needsAction = DEMO_CHILDREN.filter(c => c.status === 'missing' || c.status === 'expired').length;
  const certified   = DEMO_CHILDREN.filter(c => c.status === 'valid' || c.status === 'expiring').length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Income Eligibility</h1>
        <p className="text-gray-500 mt-1 text-sm">CACFP requires annual income certification for every enrolled child.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{certified}</p>
          <p className="text-xs text-gray-500 mt-0.5">Certified</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-red-600">{needsAction}</p>
          <p className="text-xs text-gray-500 mt-0.5">Need Action</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-amber-600">1</p>
          <p className="text-xs text-gray-500 mt-0.5">Expiring Soon</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-700">{DEMO_CHILDREN.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Children</p>
        </div>
      </div>

      {/* Alert */}
      {needsAction > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">
            {needsAction} children missing income certification — fix before July 31 to protect your reimbursement.
          </p>
        </div>
      )}

      {/* Children list */}
      <div>
        {sorted.map(child => {
          const meta = CERT_META[child.status];
          return (
            <div key={child.id} className="rounded-xl border border-gray-100 bg-white mb-2 overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(open === child.id ? null : child.id)}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{child.name}</p>
                  <p className="text-xs text-gray-400">
                    {child.age}
                    {child.cert_date && ` · Cert: ${child.cert_date}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {child.status === 'expiring' && <span className="text-xs font-semibold text-amber-600">29d left</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}>{meta.label}</span>
                  {open === child.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              {open === child.id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Certification Date *</label>
                      <input type="date" defaultValue={child.cert_date ? '2026-07-22' : ''} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date</label>
                      <input type="date" defaultValue="2027-07-21" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Income Tier</label>
                      <select defaultValue={child.tier === 'Tier II' ? 'tier2' : 'tier1'} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-300">
                        <option value="tier1">Tier I — Free (≤130% FPL)</option>
                        <option value="tier2">Tier II — Paid (&gt;130% FPL)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(null)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Save Certification
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Renewals ────────────────────────────────────────────────────────────────
const DEMO_RENEWAL_ITEMS = [
  { id:'r1', item_type:'document',        item_label:'Site License / Permit',            status:'complete', completed_at:'2026-07-10' },
  { id:'r2', item_type:'document',        item_label:'Insurance Certificate',            status:'complete', completed_at:'2026-07-10' },
  { id:'r3', item_type:'document',        item_label:'Health Inspection Report',         status:'pending',  completed_at:null },
  { id:'r4', item_type:'document',        item_label:'Enrollment Packet',                status:'pending',  completed_at:null },
  { id:'r5', item_type:'income_certs',    item_label:'Income Eligibility Certifications',status:'complete', completed_at:'2026-07-12' },
  { id:'r6', item_type:'roster_review',   item_label:'Child Roster Review',             status:'pending',  completed_at:null },
  { id:'r7', item_type:'profile_confirm', item_label:'Site Profile Confirmation',       status:'pending',  completed_at:null },
  { id:'r8', item_type:'agreement',       item_label:'Sponsor Agreement / Acknowledgment',status:'pending', completed_at:null },
];

const SELF_CONFIRM_TYPES = new Set(['income_certs','roster_review','profile_confirm','agreement']);

function SiteRenewalPage() {
  const [items, setItems] = useState(DEMO_RENEWAL_ITEMS.map(i => ({ ...i })));

  const confirm = (id) => {
    setItems(prev => prev.map(i => i.id === id
      ? { ...i, status: 'complete', completed_at: new Date().toISOString() }
      : i
    ));
  };

  const complete = items.filter(i => i.status === 'complete').length;
  const total    = items.length;
  const pct      = Math.round((complete / total) * 100);
  const daysLeft = Math.ceil((new Date('2026-08-31') - new Date()) / 86400000);

  const ITEM_ICONS = { document:'📄', income_certs:'💰', roster_review:'👶', profile_confirm:'📍', agreement:'✍️' };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Annual Renewal</h1>
        <p className="text-sm text-gray-500 mt-1">Complete your annual CACFP program renewal checklist.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
        {/* Card header */}
        <div className={`px-5 py-4 border-b ${daysLeft < 30 ? 'bg-amber-50 border-amber-100' : 'bg-brand-50 border-brand-100'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-0.5">Annual Renewal</p>
              <h2 className="font-bold text-gray-900">Annual Renewal 2026</h2>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">Due August 31, 2026</span>
                <span className={`text-xs font-bold ${daysLeft < 30 ? 'text-amber-600' : 'text-brand-600'}`}>
                  {daysLeft} days left
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-2xl font-black ${pct === 100 ? 'text-green-600' : 'text-gray-900'}`}>{pct}%</p>
              <p className="text-xs text-gray-400">{complete}/{total} done</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {pct === 100 && (
          <div className="px-5 py-4 bg-green-50 border-b border-green-100 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-700">All items complete!</p>
              <p className="text-xs text-green-600">Your sponsor will review and confirm the renewal.</p>
            </div>
          </div>
        )}

        {/* Checklist */}
        <div className="divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.id} className="px-5 py-3.5 flex items-center gap-3">
              {item.status === 'complete'
                ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                : <Clock className="w-4 h-4 text-gray-300 flex-shrink-0" />
              }
              <span className="text-lg flex-shrink-0">{ITEM_ICONS[item.item_type] ?? '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.status === 'complete' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {item.item_label}
                </p>
                {item.status === 'complete' && item.completed_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Completed {new Date(item.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
              {item.status === 'pending' && (
                SELF_CONFIRM_TYPES.has(item.item_type) ? (
                  <button
                    onClick={() => confirm(item.id)}
                    className="text-xs font-semibold px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex-shrink-0"
                  >
                    Confirm ✓
                  </button>
                ) : (
                  <Link
                    to="/demo/site/documents"
                    className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                  >
                    Upload →
                  </Link>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          For documents, upload them from the <strong>Documents</strong> page — your sponsor marks those complete.
          For confirmations, click <strong>Confirm ✓</strong> to self-complete.
        </p>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SiteDemo() {
  const { pathname } = useLocation();

  let Page;
  if (pathname.startsWith('/demo/site/deliveries'))   Page = DeliveriesPage;
  else if (pathname.startsWith('/demo/site/meal-counts')) Page = MealCountsPage;
  else if (pathname.startsWith('/demo/site/income'))      Page = IncomeCertsPage;
  else if (pathname.startsWith('/demo/site/renewal'))     Page = SiteRenewalPage;
  else if (pathname.startsWith('/demo/site/tasks'))       Page = SiteTasksPage;
  else if (pathname.startsWith('/demo/site/documents'))   Page = DocumentsPage;
  else if (pathname.startsWith('/demo/site/messages'))    Page = MessagesPage;
  else if (pathname.startsWith('/demo/site/activity'))    Page = SiteActivityPage;
  else if (pathname.startsWith('/demo/site/settings'))    Page = SettingsPage;
  else                                                     Page = OverviewPage;

  return (
    <div className="flex h-screen bg-gray-50">
      <DemoBanner role="Site" />
      <DemoSidebar navItems={NAV} role="site" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-14 sm:p-8 max-w-3xl mx-auto">
          <Page />
        </div>
      </main>
    </div>
  );
}
