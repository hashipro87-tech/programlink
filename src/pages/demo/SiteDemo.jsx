import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ClipboardList, FileText, MessageSquare, Settings, Upload, AlertTriangle, Clock } from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',    path: '/demo/site',             icon: CheckCircle },
  { label: 'Meal Counts', path: '/demo/site/meal-counts', icon: ClipboardList },
  { label: 'Documents',   path: '/demo/site/documents',   icon: FileText },
  { label: 'Messages',    path: '/demo/site/messages',    icon: MessageSquare },
  { label: 'Settings',    path: '/demo/site/settings',    icon: Settings },
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

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Submit Today's Headcount</h2>
          <p className="text-xs text-gray-400 mt-0.5">July 6, 2026</p>
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SiteDemo() {
  const { pathname } = useLocation();

  let Page;
  if (pathname.startsWith('/demo/site/meal-counts')) Page = MealCountsPage;
  else if (pathname.startsWith('/demo/site/documents'))  Page = DocumentsPage;
  else if (pathname.startsWith('/demo/site/messages'))   Page = MessagesPage;
  else if (pathname.startsWith('/demo/site/settings'))   Page = SettingsPage;
  else                                                    Page = OverviewPage;

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
