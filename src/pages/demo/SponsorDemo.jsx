import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle, ClipboardList, AlertTriangle, Building2, Users, UtensilsCrossed,
  FileText, Settings, Truck, ChefHat, Plus, X,
  ShieldCheck, ShieldAlert, ShieldX, Shield,
  MessageSquare, Megaphone, Bell, TrendingUp, Upload,
} from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',     path: '/demo/sponsor',              icon: CheckCircle },
  { label: 'Applications', path: '/demo/sponsor/applications', icon: ClipboardList },
  { label: 'Compliance',   path: '/demo/sponsor/compliance',   icon: AlertTriangle },
  { label: 'Sites',        path: '/demo/sponsor/sites',        icon: Building2 },
  { label: 'Kitchens',     path: '/demo/sponsor/kitchens',     icon: Building2 },
  { label: 'Deliveries',   path: '/demo/sponsor/deliveries',   icon: Truck },
  { label: 'Coordinators', path: '/demo/sponsor/coordinators', icon: Users },
  { label: 'Messages',     path: '/demo/sponsor/messages',     icon: MessageSquare },
  { label: 'Meal Counts',  path: '/demo/sponsor/meal-counts',  icon: UtensilsCrossed },
  { label: 'Documents',    path: '/demo/sponsor/documents',    icon: FileText },
  { label: 'Settings',     path: '/demo/sponsor/settings',     icon: Settings },
];

const RECENT_APPS = [
  { name: 'Sunshine Daycare',    type: 'site',    status: 'pending',  date: '2 days ago' },
  { name: 'Lincoln Kitchen',     type: 'kitchen', status: 'approved', date: '4 days ago' },
  { name: 'Happy Hearts Center', type: 'site',    status: 'pending',  date: '5 days ago' },
  { name: 'Metro Meals LLC',     type: 'kitchen', status: 'approved', date: '1 week ago' },
];

const ALL_APPS = [
  { name: 'Sunshine Daycare',      type: 'Site',    status: 'pending',  date: 'Jul 4, 2026',  address: '842 Oak Ave, Des Moines, IA' },
  { name: 'Happy Hearts Center',   type: 'Site',    status: 'pending',  date: 'Jul 3, 2026',  address: '215 Maple St, Ames, IA' },
  { name: 'Lincoln Kitchen',       type: 'Kitchen', status: 'approved', date: 'Jun 30, 2026', address: '1100 State St, Iowa City, IA' },
  { name: 'Metro Meals LLC',       type: 'Kitchen', status: 'approved', date: 'Jun 28, 2026', address: '400 Main Blvd, Cedar Rapids, IA' },
  { name: 'Bright Minds Academy',  type: 'Site',    status: 'approved', date: 'Jun 21, 2026', address: '77 Learning Lane, Davenport, IA' },
  { name: 'Riverside Childcare',   type: 'Site',    status: 'rejected', date: 'Jun 15, 2026', address: '300 River Rd, Sioux City, IA' },
];

const DEMO_ORDERS = [
  { kitchen: 'Lincoln Kitchen', site: 'Sunshine Daycare',     meal: 'Lunch',     count: 42, time: '10:30 AM', status: 'delivered' },
  { kitchen: 'Lincoln Kitchen', site: 'Happy Hearts Center',  meal: 'Lunch',     count: 28, time: '11:00 AM', status: 'prepping'  },
  { kitchen: 'Metro Meals LLC', site: 'Bright Minds Academy', meal: 'Breakfast', count: 35, time: '7:45 AM',  status: 'delivered' },
];

const STATUS_STYLES = {
  pending:  'bg-yellow-50 text-yellow-700 border border-yellow-100',
  approved: 'bg-green-50 text-green-700 border border-green-100',
  rejected: 'bg-red-50 text-red-700 border border-red-100',
};

const STATUS_PILL = {
  delivered: 'bg-green-50 text-green-700 border-green-200',
  prepping:  'bg-blue-50 text-blue-700 border-blue-200',
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const TREND_DATA = [
  { month: 'Feb', submitted: 1840, verified: 1720 },
  { month: 'Mar', submitted: 2100, verified: 1950 },
  { month: 'Apr', submitted: 1980, verified: 1860 },
  { month: 'May', submitted: 2380, verified: 2210 },
  { month: 'Jun', submitted: 2650, verified: 2490 },
  { month: 'Jul', submitted: 2420, verified: 2310 },
];

const COMPLIANCE_ORGS = [
  { name: 'Happy Hearts Center', type: 'Site',    tier: 'Missing Docs',   tierBg: 'bg-red-50',    tierText: 'text-red-700',    tierBorder: 'border-red-100',    score: 52,  docs: '5/10', missing: 3, expiring: 0, Icon: ShieldX,    iconColor: 'text-red-400'    },
  { name: 'Sunshine Daycare',    type: 'Site',    tier: 'Expiring Soon',  tierBg: 'bg-orange-50', tierText: 'text-orange-700', tierBorder: 'border-orange-100', score: 78,  docs: '8/10', missing: 0, expiring: 2, Icon: ShieldAlert, iconColor: 'text-orange-400', autoRemind: true },
  { name: 'Metro Meals LLC',     type: 'Kitchen', tier: 'Pending Review', tierBg: 'bg-yellow-50', tierText: 'text-yellow-700', tierBorder: 'border-yellow-100', score: 65,  docs: '3/5',  missing: 0, expiring: 1, Icon: Shield,      iconColor: 'text-yellow-400' },
  { name: 'Bright Minds Academy',type: 'Site',    tier: 'Compliant',      tierBg: 'bg-green-50',  tierText: 'text-green-700',  tierBorder: 'border-green-100',  score: 100, docs: '10/10',missing: 0, expiring: 0, Icon: ShieldCheck, iconColor: 'text-green-500'  },
  { name: 'Lincoln Kitchen',     type: 'Kitchen', tier: 'Compliant',      tierBg: 'bg-green-50',  tierText: 'text-green-700',  tierBorder: 'border-green-100',  score: 100, docs: '5/5',  missing: 0, expiring: 0, Icon: ShieldCheck, iconColor: 'text-green-500'  },
];

const SITES = [
  { name: 'Sunshine Daycare',     address: '842 Oak Ave, Des Moines', enrolled: 28, mealDays: '20/21', compliance: 78,  status: 'expiring' },
  { name: 'Happy Hearts Center',  address: '215 Maple St, Ames',      enrolled: 22, mealDays: '19/21', compliance: 52,  status: 'missing' },
  { name: 'Bright Minds Academy', address: '77 Learning Lane, Davenport', enrolled: 35, mealDays: '21/21', compliance: 100, status: 'compliant' },
  { name: 'Riverside Childcare',  address: '300 River Rd, Sioux City',enrolled: 18, mealDays: '17/21', compliance: 88,  status: 'compliant' },
  { name: 'Little Stars Center',  address: '55 Pine Rd, Waterloo',    enrolled: 30, mealDays: '20/21', compliance: 91,  status: 'compliant' },
];

const KITCHENS = [
  { name: 'Lincoln Kitchen',  address: '1100 State St, Iowa City', capacity: 120, servingSites: 3, status: 'active' },
  { name: 'Metro Meals LLC',  address: '400 Main Blvd, Cedar Rapids', capacity: 85, servingSites: 2, status: 'active' },
  { name: 'Northside Prep',   address: '22 Industrial Way, Waterloo', capacity: 60, servingSites: 1, status: 'active' },
];

const COORDINATORS = [
  { name: 'Maria Torres',   email: 'mtorres@demo.org', assigned: 8,  sites: ['Sunshine Daycare', 'Happy Hearts Center', '+6 more'] },
  { name: 'James Porter',   email: 'jporter@demo.org', assigned: 10, sites: ['Bright Minds Academy', 'Riverside Childcare', '+8 more'] },
  { name: 'Aaliyah Brooks', email: 'abrooks@demo.org', assigned: 6,  sites: ['Little Stars Center', '+5 more'] },
];

const MESSAGES = [
  { org: 'Sunshine Daycare',    avatar: 'SD', last: 'Thanks for the heads up on the license renewal!', time: '10:02 AM',  unread: 1 },
  { org: 'Happy Hearts Center', avatar: 'HH', last: "We'll have the health cert uploaded by Friday.",   time: '9:41 AM',   unread: 0 },
  { org: 'Lincoln Kitchen',     avatar: 'LK', last: 'Delivery confirmed for tomorrow. Count is 45.',   time: 'Yesterday', unread: 2 },
  { org: 'Northside Prep',      avatar: 'NP', last: 'Let me know when you need the July menu plan.',   time: 'Jul 3',     unread: 0 },
];

const DOCUMENTS_LIST = [
  { org: 'Happy Hearts Center',  type: 'Site',    docName: 'Health Certification', status: 'missing',  expires: null,           uploaded: null },
  { org: 'Happy Hearts Center',  type: 'Site',    docName: 'Enrollment List',      status: 'missing',  expires: null,           uploaded: null },
  { org: 'Sunshine Daycare',     type: 'Site',    docName: 'Facility License',     status: 'expiring', expires: 'Aug 15, 2026', uploaded: 'Aug 14, 2025' },
  { org: 'Sunshine Daycare',     type: 'Site',    docName: 'Insurance Certificate',status: 'expiring', expires: 'Sep 1, 2026',  uploaded: 'Sep 1, 2025' },
  { org: 'Metro Meals LLC',      type: 'Kitchen', docName: 'Food Handler Permits', status: 'pending',  expires: null,           uploaded: 'Jun 30, 2026' },
  { org: 'Lincoln Kitchen',      type: 'Kitchen', docName: 'Food Service Permit',  status: 'valid',    expires: 'Dec 31, 2026', uploaded: 'Jan 2, 2026' },
  { org: 'Bright Minds Academy', type: 'Site',    docName: 'Enrollment List',      status: 'valid',    expires: 'Dec 31, 2026', uploaded: 'Jan 4, 2026' },
];

const DOC_STATUS_STYLE = {
  valid:    { label: 'Valid',          bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100'  },
  expiring: { label: 'Expiring Soon',  bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
  missing:  { label: 'Missing',        bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100'    },
  pending:  { label: 'Pending Review', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100' },
};

// ─── Shared ───────────────────────────────────────────────────────────────────
function TrendChart() {
  const maxVal = Math.max(...TREND_DATA.map(d => d.submitted));
  const W = 480, H = 140, PAD = { top: 20, bottom: 28, left: 40, right: 10 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const barW  = Math.floor(plotW / TREND_DATA.length);
  const pairW = barW * 0.72;
  const singleW = pairW / 2 - 2;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxVal));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      {gridLines.map((v, i) => {
        const y = PAD.top + plotH - (v / maxVal) * plotH;
        return (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            {i % 2 === 0 && (
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="8">
                {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
              </text>
            )}
          </g>
        );
      })}
      {TREND_DATA.map((d, i) => {
        const cx = PAD.left + i * barW + barW / 2;
        const offset = pairW / 2;
        const subH = (d.submitted / maxVal) * plotH;
        const verH = (d.verified  / maxVal) * plotH;
        return (
          <g key={d.month}>
            <rect x={cx - offset} y={PAD.top + plotH - subH} width={singleW} height={subH} rx="2" fill="#e2e8f0" />
            <rect x={cx - offset + singleW + 2} y={PAD.top + plotH - verH} width={singleW} height={verH} rx="2" fill="#4f46e5" opacity="0.85" />
            <text x={cx} y={H - 4} textAnchor="middle" fill="#94a3b8" fontSize="9">{d.month}</text>
          </g>
        );
      })}
      <rect x={PAD.left} y={2} width={8} height={8} rx="1" fill="#e2e8f0" />
      <text x={PAD.left + 11} y={10} fill="#64748b" fontSize="8">Submitted</text>
      <rect x={PAD.left + 68} y={2} width={8} height={8} rx="1" fill="#4f46e5" opacity="0.85" />
      <text x={PAD.left + 81} y={10} fill="#64748b" fontSize="8">Verified</text>
    </svg>
  );
}

function DemoOrderModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Schedule Delivery</h2>
            <p className="text-xs text-gray-500 mt-0.5">Assign a kitchen to deliver meals to a site.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Date</label>
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50" readOnly />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Kitchen</label>
            <select className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50">
              <option>Lincoln Kitchen</option><option>Metro Meals LLC</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Deliver To (Site)</label>
            <select className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50">
              <option>Sunshine Daycare</option><option>Happy Hearts Center</option><option>Bright Minds Academy</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Meal Type</label>
              <select className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50">
                <option>Breakfast</option><option>Lunch</option><option>PM Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Meal Count</label>
              <input type="number" placeholder="e.g. 45"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
            <Link to="/register" className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold text-center">Sign Up to Create →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BroadcastModal({ onClose }) {
  const GROUPS = [
    { key: 'all_sites',    label: 'All Sites',    count: 18, color: 'blue' },
    { key: 'all_kitchens', label: 'All Kitchens', count: 6,  color: 'green' },
    { key: 'coordinators', label: 'Coordinators', count: 3,  color: 'purple' },
    { key: 'everyone',     label: 'Everyone',     count: 27, color: 'gray' },
  ];
  const COLOR = {
    blue:   { sel: 'border-blue-400 bg-blue-50',   dot: 'bg-blue-400',  text: 'text-blue-700' },
    green:  { sel: 'border-green-400 bg-green-50', dot: 'bg-green-400', text: 'text-green-700' },
    purple: { sel: 'border-brand-400 bg-brand-50', dot: 'bg-brand-400', text: 'text-brand-700' },
    gray:   { sel: 'border-gray-400 bg-gray-100',  dot: 'bg-gray-400',  text: 'text-gray-700' },
  };
  const [group, setGroup] = useState('all_sites');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-brand-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Broadcast Message</h2>
              <p className="text-xs text-gray-500 mt-0.5">Send one message to a group all at once.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Send to</label>
            <div className="grid grid-cols-2 gap-2">
              {GROUPS.map(g => {
                const c = COLOR[g.color];
                const active = group === g.key;
                return (
                  <button key={g.key} onClick={() => setGroup(g.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${active ? c.sel : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? c.dot : 'bg-gray-300'}`} />
                    <div>
                      <p className={`text-sm font-semibold ${active ? c.text : 'text-gray-700'}`}>{g.label}</p>
                      <p className="text-xs text-gray-400">{g.count} recipients</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
            <input type="text" placeholder="e.g. July meal count reminder"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
            <textarea rows={3} placeholder="Type your message..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
            <Link to="/register" className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold text-center">Sign Up to Send →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoCTA() {
  return (
    <div className="mt-8 bg-brand-600 rounded-2xl p-6 text-center text-white">
      <h3 className="text-lg font-bold mb-1">Ready to manage your real program?</h3>
      <p className="text-brand-200 text-sm mb-4">Create your sponsor account — it's free and takes 2 minutes.</p>
      <Link to="/register" className="inline-block bg-white text-brand-700 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
        Get Started Free →
      </Link>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────
function OverviewPage({ onOpenOrder, onOpenBroadcast }) {
  const [copied, setCopied] = useState(false);
  const [remindSent, setRemindSent] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText('DEMO-SP-4829');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Program Overview</h1>
        <p className="text-gray-500 mt-1">Monitor all sites, kitchens, and compliance status across your program.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Action Center</h2>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
            <span className="text-sm text-yellow-800 font-medium">Review 2 pending applications</span>
            <Link to="/demo/sponsor/applications" className="ml-auto text-xs font-semibold text-brand-600 hover:underline">Review →</Link>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
            <span className="text-sm text-red-800 font-medium">2 orgs missing required documents · 1 expiring soon</span>
            <Link to="/demo/sponsor/compliance" className="ml-auto text-xs font-semibold text-brand-600 hover:underline">Fix issues →</Link>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
            <Bell className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-sm text-purple-800 font-medium">Auto-expiry reminders active — 1 doc expiring in 14 days</span>
            <span className="ml-auto text-xs font-semibold text-purple-400">Email sent ✓</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 font-medium">No unread messages</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sites',       value: '24', color: 'text-blue-600',   bg: 'bg-blue-50',   icon: Building2,      path: '/demo/sponsor/sites' },
          { label: 'Active Kitchens',   value: '8',  color: 'text-green-600',  bg: 'bg-green-50',  icon: UtensilsCrossed, path: '/demo/sponsor/kitchens' },
          { label: 'Pending Approvals', value: '2',  color: 'text-yellow-600', bg: 'bg-yellow-50', icon: ClipboardList,  path: '/demo/sponsor/applications' },
          { label: 'Compliance Alerts', value: '3',  color: 'text-red-600',    bg: 'bg-red-50',    icon: AlertTriangle,  path: '/demo/sponsor/compliance' },
        ].map(({ label, value, color, bg, icon: Icon, path }) => (
          <Link key={label} to={path} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow block">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-brand-100 rounded-2xl p-5 mb-6 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your Sponsor ID</p>
        <p className="text-xs text-gray-400 mb-3">Share this with sites and kitchens so they can join your program.</p>
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg">DEMO-SP-4829</code>
          <button onClick={copy} className="px-3 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors">
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Applications</h2>
          <Link to="/demo/sponsor/applications" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {RECENT_APPS.map((app) => (
            <div key={app.name} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{app.name}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">{app.type} · {app.date}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[app.status]}`}>{app.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <h2 className="font-semibold text-gray-900">Meal Count Trend</h2>
          </div>
          <Link to="/demo/sponsor/meal-counts" className="text-xs font-semibold text-brand-600 hover:underline">Full report →</Link>
        </div>
        <div className="px-6 py-4">
          <TrendChart />
        </div>
      </div>

      <DemoCTA />
    </>
  );
}

// ─── Applications ────────────────────────────────────────────────────────────
function ApplicationsPage() {
  const [apps, setApps] = useState(ALL_APPS);
  const pending = apps.filter(a => a.status === 'pending');

  const decide = (name, status) => setApps(a => a.map(x => x.name === name ? { ...x, status } : x));

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 mt-1">{pending.length} pending · Review and approve new sites and kitchens</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending',  value: apps.filter(a=>a.status==='pending').length,  color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Approved', value: apps.filter(a=>a.status==='approved').length, color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Rejected', value: apps.filter(a=>a.status==='rejected').length, color: 'text-red-600',    bg: 'bg-red-50'    },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border border-gray-100 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Applications</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {apps.map((app) => (
            <div key={app.name} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{app.name}</p>
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide bg-gray-100 px-1.5 py-0.5 rounded">{app.type}</span>
                  </div>
                  <p className="text-xs text-gray-400">{app.address} · Applied {app.date}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {app.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => decide(app.name, 'rejected')}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => decide(app.name, 'approved')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
                      >
                        Approve
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[app.status]}`}>{app.status}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to manage real applications.</p>
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Compliance ───────────────────────────────────────────────────────────────
function CompliancePage() {
  const [remindSent, setRemindSent] = useState(false);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Compliance Action Center</h1>
        <p className="text-gray-500 mt-1">Track document compliance across all sites and kitchens</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Compliant',     value: 2, color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Expiring Soon', value: 1, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Missing Docs',  value: 1, color: 'text-red-600',    bg: 'bg-red-50'    },
          { label: 'Pending Review',value: 1, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border border-gray-100 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Organizations</h2>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg font-semibold">3 Kitchens</span>
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-semibold">5 Sites</span>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bulk Actions</span>
          <button
            onClick={() => { setRemindSent(true); setTimeout(() => setRemindSent(false), 3000); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              remindSent ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-3 h-3" />
            {remindSent ? '✓ Reminders Sent!' : 'Remind Non-Compliant (2)'}
          </button>
          <Link to="/register" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-gray-700 border-gray-200 hover:bg-gray-100 transition-all">
            <FileText className="w-3 h-3" />
            Request Doc from All Missing →
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {COMPLIANCE_ORGS.map((org) => (
            <div key={org.name} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <org.Icon className={`w-4 h-4 flex-shrink-0 ${org.iconColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{org.name}</p>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{org.type}</span>
                  {org.autoRemind && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">auto-remind on</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 max-w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${org.score >= 90 ? 'bg-green-400' : org.score >= 70 ? 'bg-orange-400' : 'bg-red-400'}`}
                      style={{ width: `${org.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{org.score}%</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{org.docs} docs</span>
                  {org.missing > 0 && <span className="text-xs text-red-500">· {org.missing} missing</span>}
                  {org.expiring > 0 && <span className="text-xs text-orange-500">· {org.expiring} expiring</span>}
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${org.tierBg} ${org.tierText} ${org.tierBorder}`}>
                {org.tier}
              </span>
              <button className="text-xs text-brand-600 hover:underline flex-shrink-0 font-medium">Remind</button>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to manage real compliance.</p>
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Sites ────────────────────────────────────────────────────────────────────
function SitesPage() {
  const compColor = (s) => s === 'compliant' ? 'text-green-700 bg-green-50 border-green-100' : s === 'expiring' ? 'text-orange-700 bg-orange-50 border-orange-100' : 'text-red-700 bg-red-50 border-red-100';
  const compLabel = (s) => s === 'compliant' ? '✓ Compliant' : s === 'expiring' ? '⚠ Expiring' : '! Missing Docs';

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
        <p className="text-gray-500 mt-1">{SITES.length} sites in your program · Monitor enrollment and compliance</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Sites',   value: SITES.length },
          { label: 'Total Enrolled',value: SITES.reduce((a,s)=>a+s.enrolled,0) },
          { label: 'Compliant',     value: SITES.filter(s=>s.status==='compliant').length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Sites</h2>
          <Link to="/register" className="text-xs font-semibold text-brand-600 hover:underline">+ Add Site</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {SITES.map((site) => (
            <div key={site.name} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{site.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{site.address} · {site.enrolled} enrolled · {site.mealDays} days submitted</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${compColor(site.status)}`}>
                  {compLabel(site.status)}
                </span>
                <Link to="/demo/sponsor/messages" className="text-xs text-brand-600 hover:underline font-medium">Message</Link>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to manage real sites.</p>
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Kitchens ─────────────────────────────────────────────────────────────────
function KitchensPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kitchens</h1>
        <p className="text-gray-500 mt-1">{KITCHENS.length} kitchens supplying meals to your program</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Kitchens',    value: KITCHENS.length },
          { label: 'Total Capacity/Day',value: KITCHENS.reduce((a,k)=>a+k.capacity,0) },
          { label: 'Sites Served',      value: KITCHENS.reduce((a,k)=>a+k.servingSites,0) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Kitchens</h2>
          <Link to="/register" className="text-xs font-semibold text-brand-600 hover:underline">+ Add Kitchen</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {KITCHENS.map((k) => (
            <div key={k.name} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <ChefHat className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{k.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{k.address}</p>
                <p className="text-xs text-gray-400 mt-0.5">Capacity: {k.capacity}/day · Serving {k.servingSites} sites</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">Active</span>
                <Link to="/demo/sponsor/deliveries" className="text-xs text-brand-600 hover:underline font-medium">Deliveries</Link>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to manage real kitchens.</p>
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Deliveries ───────────────────────────────────────────────────────────────
function DeliveriesPage({ onOpenOrder }) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-gray-500 mt-1">Manage meal delivery schedules from kitchens to sites</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Today's Deliveries",  value: '3' },
          { label: 'On Time',             value: '2' },
          { label: 'In Progress',         value: '1' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-500" />
            <div>
              <h2 className="font-semibold text-gray-900">Today's Deliveries</h2>
              <p className="text-xs text-gray-400 mt-0.5">July 6, 2026</p>
            </div>
          </div>
          <button
            onClick={onOpenOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Delivery
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {DEMO_ORDERS.map((o, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-3">
              <ChefHat className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {o.kitchen} <span className="text-gray-400">→</span> {o.site}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{o.meal} · {o.count} meals · Pickup {o.time}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_PILL[o.status]}`}>
                {o.status}
              </span>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to schedule real deliveries.</p>
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Coordinators ─────────────────────────────────────────────────────────────
function CoordinatorsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Coordinators</h1>
        <p className="text-gray-500 mt-1">{COORDINATORS.length} coordinators managing your program sites</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Coordinators', value: COORDINATORS.length },
          { label: 'Sites Assigned',     value: COORDINATORS.reduce((a,c)=>a+c.assigned,0) },
          { label: 'Unassigned Sites',   value: '6' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Coordinators</h2>
          <Link to="/register" className="text-xs font-semibold text-brand-600 hover:underline">+ Invite Coordinator</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {COORDINATORS.map((c) => (
            <div key={c.name} className="px-6 py-4">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-brand-700">{c.name.split(' ').map(n=>n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                    <span className="text-xs text-gray-400">{c.assigned} sites assigned</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{c.email}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.sites.map(s => (
                      <span key={s} className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to manage real coordinators.</p>
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Messages ────────────────────────────────────────────────────────────────
function MessagesPage({ onOpenBroadcast }) {
  const [selected, setSelected] = useState('Sunshine Daycare');
  const [message, setMessage] = useState('');
  const [threads, setThreads] = useState({
    'Sunshine Daycare': [
      { from: 'Sponsor', text: "Hi Sunshine team — your facility license expires August 15. Please upload the renewed certificate.", time: 'Yesterday', fromSponsor: true },
      { from: 'Sunshine Daycare', text: "Thanks for the heads up! We're in the process of renewing — should have it uploaded by end of week.", time: '10:02 AM', fromSponsor: false },
    ],
    'Happy Hearts Center': [
      { from: 'Sponsor', text: "We're missing your health certification and updated enrollment list. Please upload at your earliest convenience.", time: 'Jul 3', fromSponsor: true },
      { from: 'Happy Hearts Center', text: "We'll have the health cert uploaded by Friday.", time: '9:41 AM', fromSponsor: false },
    ],
    'Lincoln Kitchen': [
      { from: 'Lincoln Kitchen', text: "Delivery confirmed for tomorrow. Count is 45 for Sunshine Daycare.", time: 'Yesterday', fromSponsor: false },
      { from: 'Sponsor', text: "Thanks! Will relay to the site.", time: 'Yesterday', fromSponsor: true },
      { from: 'Lincoln Kitchen', text: "July menus are ready when you need them for CACFP filing.", time: '8:30 AM', fromSponsor: false },
    ],
  });

  const send = () => {
    if (!message.trim()) return;
    setThreads(t => ({
      ...t,
      [selected]: [...(t[selected] ?? []), { from: 'Sponsor', text: message, time: 'Just now', fromSponsor: true }],
    }));
    setMessage('');
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">Communicate with your sites and kitchens</p>
        </div>
        <button
          onClick={onOpenBroadcast}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <Megaphone className="w-3.5 h-3.5" /> Broadcast
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 flex overflow-hidden" style={{ minHeight: 420 }}>
        {/* Thread list */}
        <div className="w-64 border-r border-gray-100 flex-shrink-0">
          {MESSAGES.map((m) => (
            <button
              key={m.org}
              onClick={() => setSelected(m.org)}
              className={`w-full px-4 py-3.5 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected === m.org ? 'bg-brand-50' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${selected === m.org ? 'bg-brand-600' : 'bg-gray-200'}`}>
                  <span className={`text-[9px] font-bold ${selected === m.org ? 'text-white' : 'text-gray-600'}`}>{m.avatar}</span>
                </div>
                <p className={`text-xs font-semibold truncate flex-1 ${selected === m.org ? 'text-brand-700' : 'text-gray-900'}`}>{m.org}</p>
                {m.unread > 0 && <span className="w-4 h-4 bg-brand-600 rounded-full text-[9px] text-white font-bold flex items-center justify-center flex-shrink-0">{m.unread}</span>}
              </div>
              <p className="text-[11px] text-gray-400 truncate pl-8">{m.last}</p>
            </button>
          ))}
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900">{selected}</p>
          </div>
          <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto" style={{ maxHeight: 280 }}>
            {(threads[selected] ?? []).map((m, i) => (
              <div key={i} className={`flex ${m.fromSponsor ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${m.fromSponsor ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  <p className="text-sm">{m.text}</p>
                  <p className={`text-xs mt-1 ${m.fromSponsor ? 'text-brand-200' : 'text-gray-400'}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3.5 border-t border-gray-100 flex gap-2">
            <input
              type="text" value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button onClick={send} className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors">Send</button>
          </div>
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Meal Counts ─────────────────────────────────────────────────────────────
function MealCountsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meal Counts</h1>
        <p className="text-gray-500 mt-1">6-month trend and submission summary across your program</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'This Month Submitted', value: '2,420' },
          { label: 'This Month Verified',  value: '2,310' },
          { label: 'Verification Rate',    value: '95.5%' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-500" />
          <div>
            <h2 className="font-semibold text-gray-900">Meal Count Trend</h2>
            <p className="text-xs text-gray-400 mt-0.5">6-month submitted vs. verified</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <TrendChart />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-gray-500">Month</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Submitted</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Verified</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...TREND_DATA].reverse().map((d) => (
                <tr key={d.month} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{d.month} 2026</td>
                  <td className="px-4 py-3 text-center text-gray-700">{d.submitted.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{d.verified.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                      {Math.round(d.verified / d.submitted * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to access real reports.</p>
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Documents ───────────────────────────────────────────────────────────────
function DocumentsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-500 mt-1">All compliance documents across your program</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Valid',          value: DOCUMENTS_LIST.filter(d=>d.status==='valid').length,    color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Expiring',       value: DOCUMENTS_LIST.filter(d=>d.status==='expiring').length,  color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Missing',        value: DOCUMENTS_LIST.filter(d=>d.status==='missing').length,   color: 'text-red-600',    bg: 'bg-red-50'    },
          { label: 'Pending Review', value: DOCUMENTS_LIST.filter(d=>d.status==='pending').length,   color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border border-gray-100 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Documents</h2>
          <Link to="/demo/sponsor/compliance" className="text-xs font-semibold text-brand-600 hover:underline">Compliance view →</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {DOCUMENTS_LIST.map((doc, i) => {
            const s = DOC_STATUS_STYLE[doc.status];
            return (
              <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{doc.docName}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {doc.org} · {doc.type}
                    {doc.expires ? ` · Expires ${doc.expires}` : ''}
                    {doc.uploaded ? ` · Uploaded ${doc.uploaded}` : ''}
                  </p>
                </div>
                {doc.status === 'missing' && (
                  <Link to="/register" className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline flex-shrink-0">
                    <Upload className="w-3 h-3" /> Request
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to manage real documents.</p>
        </div>
      </div>
      <DemoCTA />
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
        <p className="text-gray-500 mt-1">Demo Sponsor · Program configuration</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Program Profile</h2></div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'Program Name', value: 'Demo Sponsor Program' },
            { label: 'Contact Name', value: 'Program Director' },
            { label: 'Email',        value: 'director@demosponsor.org' },
            { label: 'Phone',        value: '(515) 555-0100' },
            { label: 'State',        value: 'Iowa' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
              <input type="text" defaultValue={value}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          ))}
          {saved ? (
            <div className="w-full py-2.5 bg-green-50 text-green-700 font-semibold text-sm rounded-xl text-center border border-green-100">✓ Settings saved!</div>
          ) : (
            <button
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Save Changes
            </button>
          )}
          <p className="text-center text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to configure a real program.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Notifications</h2></div>
        <div className="px-6 py-5 space-y-3">
          {[
            { label: 'Document expiry reminders (30-day auto-email)', on: true },
            { label: 'New application alerts', on: true },
            { label: 'Meal count submission digest', on: false },
            { label: 'Compliance status changes', on: true },
          ].map(({ label, on }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{label}</span>
              <div className={`w-9 h-5 rounded-full transition-colors ${on ? 'bg-brand-600' : 'bg-gray-200'} relative cursor-pointer`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} style={{ top: 3, left: on ? 18 : 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SponsorDemo() {
  const { pathname } = useLocation();
  const [showOrder,     setShowOrder]     = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

  let Page;
  if      (pathname.startsWith('/demo/sponsor/applications')) Page = () => <ApplicationsPage />;
  else if (pathname.startsWith('/demo/sponsor/compliance'))   Page = () => <CompliancePage />;
  else if (pathname.startsWith('/demo/sponsor/sites'))        Page = () => <SitesPage />;
  else if (pathname.startsWith('/demo/sponsor/kitchens'))     Page = () => <KitchensPage />;
  else if (pathname.startsWith('/demo/sponsor/deliveries'))   Page = () => <DeliveriesPage onOpenOrder={() => setShowOrder(true)} />;
  else if (pathname.startsWith('/demo/sponsor/coordinators')) Page = () => <CoordinatorsPage />;
  else if (pathname.startsWith('/demo/sponsor/messages'))     Page = () => <MessagesPage onOpenBroadcast={() => setShowBroadcast(true)} />;
  else if (pathname.startsWith('/demo/sponsor/meal-counts'))  Page = () => <MealCountsPage />;
  else if (pathname.startsWith('/demo/sponsor/documents'))    Page = () => <DocumentsPage />;
  else if (pathname.startsWith('/demo/sponsor/settings'))     Page = () => <SettingsPage />;
  else                                                         Page = () => <OverviewPage onOpenOrder={() => setShowOrder(true)} onOpenBroadcast={() => setShowBroadcast(true)} />;

  return (
    <div className="flex h-screen bg-gray-50">
      <DemoBanner role="Sponsor" />
      <DemoSidebar navItems={NAV} role="sponsor" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-14 sm:p-8 max-w-5xl mx-auto">
          <Page />
        </div>
      </main>
      {showOrder     && <DemoOrderModal  onClose={() => setShowOrder(false)}     />}
      {showBroadcast && <BroadcastModal  onClose={() => setShowBroadcast(false)} />}
    </div>
  );
}
