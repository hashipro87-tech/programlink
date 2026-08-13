import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle, ClipboardList, AlertTriangle, Building2, Users, UtensilsCrossed,
  FileText, Settings, Truck, ChefHat, Plus, X,
  ShieldCheck, ShieldAlert, ShieldX, Shield,
  MessageSquare, Megaphone, Bell, TrendingUp, Upload, DollarSign,
  CheckSquare, Users2, Activity, BookOpen, Circle, RotateCcw, GraduationCap, Printer, Download,
  CalendarCheck, Repeat, Search, MapPin,
} from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',       path: '/demo/sponsor',                   icon: CheckCircle    },
  { label: 'Applications',   path: '/demo/sponsor/applications',      icon: ClipboardList  },
  { label: 'Claims',         path: '/demo/sponsor/claims',            icon: DollarSign     },
  { label: 'Compliance',     path: '/demo/sponsor/compliance',        icon: AlertTriangle  },
  { label: 'Sites',          path: '/demo/sponsor/sites',             icon: Building2      },
  { label: 'Kitchens',       path: '/demo/sponsor/kitchens',          icon: Building2      },
  { label: 'Children',       path: '/demo/sponsor/children',          icon: Users2         },
  { label: 'Attendance',     path: '/demo/sponsor/attendance',        icon: CalendarCheck  },
  { label: 'Tasks',          path: '/demo/sponsor/tasks',             icon: CheckSquare    },
  { label: 'Inspections',    path: '/demo/sponsor/inspections',       icon: ShieldCheck    },
  { label: 'Menus',          path: '/demo/sponsor/menus',             icon: BookOpen       },
  { label: 'Menu Cycles',    path: '/demo/sponsor/menu-cycles',       icon: Repeat         },
  { label: 'Deliveries',     path: '/demo/sponsor/deliveries',        icon: Truck          },
  { label: 'Coordinators',   path: '/demo/sponsor/coordinators',      icon: Users          },
  { label: 'Messages',       path: '/demo/sponsor/messages',          icon: MessageSquare  },
  { label: 'Meal Counts',    path: '/demo/sponsor/meal-counts',       icon: UtensilsCrossed },
  { label: 'Renewals',       path: '/demo/sponsor/renewals',          icon: RotateCcw      },
  { label: 'Staff Training', path: '/demo/sponsor/training',          icon: GraduationCap  },
  { label: 'Form Generator', path: '/demo/sponsor/forms',             icon: Printer        },
  { label: 'State Rule Book',path: '/demo/sponsor/state-rules',       icon: FileText       },
  { label: 'Activity',       path: '/demo/sponsor/activity',          icon: Activity       },
  { label: 'Settings',       path: '/demo/sponsor/settings',          icon: Settings       },
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

const DEMO_RATES = {
  breakfast: { tier1: 1.70, tier2: 1.28 },
  lunch:     { tier1: 3.22, tier2: 2.89 },
  snack:     { tier1: 0.96, tier2: 0.89 },
  supper:    { tier1: 2.14, tier2: 1.94 },
};
const DEMO_INITIAL_COUNTS = { breakfast: 2100, lunch: 2900, snack: 2000, supper: 0 };
const DEMO_SITES_CLAIM = [
  { name: 'Bright Minds Academy', status: 'ready',        est: 3840 },
  { name: 'Little Stars Center',  status: 'ready',        est: 3210 },
  { name: 'Riverside Childcare',  status: 'ready',        est: 2880 },
  { name: 'Lincoln Kitchen',      status: 'ready',        est: 3484 },
  { name: 'Happy Hearts Center',  status: 'needs_review', est: 820,  error: 'Enrollment docs missing' },
];
const MEAL_COLORS = {
  breakfast: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: '🌅 Breakfast' },
  lunch:     { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  label: '☀️ Lunch'     },
  snack:     { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   label: '🍎 Snack'     },
  supper:    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', label: '🌙 Supper'    },
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

      {/* Claim Intelligence Widget */}
      <div className="mb-6 rounded-2xl overflow-hidden shadow-sm border border-brand-200">
        <Link to="/demo/sponsor/claims" className="block px-5 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-brand-200 uppercase tracking-wide">Claim Intelligence</p>
              <p className="text-base font-bold mt-0.5">July 2026</p>
            </div>
            <div className="text-right text-brand-200">
              <p className="text-xs font-bold">⏰ 9 days left</p>
              <p className="text-xs opacity-80">Due Jul 31</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-brand-200 mb-0.5">Estimated Reimbursement</p>
              <p className="text-2xl font-bold">$14,234</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-red-300">Reimbursement at Risk</p>
              <p className="text-2xl font-bold text-red-300">$820</p>
            </div>
          </div>
        </Link>
        <div className="bg-white px-5 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Fix 1 issue before Jul 31 to recover $820:
          </p>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700">
                <span className="font-semibold">Happy Tots Site</span>
                {' — '}
                <span className="text-gray-500">no meal counts submitted</span>
              </p>
            </div>
            <span className="text-xs font-bold text-red-500 flex-shrink-0 tabular-nums">$820</span>
            <Link to="/demo/sponsor/meal-counts" className="text-xs font-bold text-brand-600 hover:underline whitespace-nowrap flex-shrink-0">
              Enter Counts →
            </Link>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <Link to="/demo/sponsor/claims" className="text-xs font-bold text-brand-600 hover:underline">
              View Full Claims Center →
            </Link>
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

// ─── Delivery Plans ───────────────────────────────────────────────────────────
const DEMO_PLANS = [
  {
    id: 1, name: 'Morning Route', kitchen: 'Downtown Kitchen',
    sites: ['Little Learners', 'Happy Kids Center', 'Sunshine Academy'],
    days: ['Mon','Tue','Wed','Thu','Fri'],
    eta: '8:00 AM', meals: { breakfast: 45, lunch: 62, snack: 28 }, active: true,
  },
  {
    id: 2, name: 'Afternoon Route', kitchen: 'Westside Kitchen',
    sites: ['Lincoln Learning', 'Riverside Kids'],
    days: ['Mon','Wed','Fri'],
    eta: '11:30 AM', meals: { lunch: 40, snack: 20 }, active: true,
  },
  {
    id: 3, name: 'North Sites', kitchen: 'Downtown Kitchen',
    sites: ['Northside Prep'],
    days: ['Tue','Thu'],
    eta: '9:00 AM', meals: { breakfast: 18, lunch: 22 }, active: false,
  },
];

const DAY_COLORS = {
  Mon: 'bg-blue-50 text-blue-700', Tue: 'bg-purple-50 text-purple-700',
  Wed: 'bg-green-50 text-green-700', Thu: 'bg-orange-50 text-orange-700',
  Fri: 'bg-pink-50 text-pink-700', Sat: 'bg-gray-50 text-gray-500', Sun: 'bg-gray-50 text-gray-500',
};

function DeliveryPlansPage() {
  const [plans, setPlans] = useState(DEMO_PLANS);
  const toggle = (id) => setPlans((ps) => ps.map((p) => p.id === id ? { ...p, active: !p.active } : p));

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Plans</h1>
          <p className="text-gray-500 mt-1 text-sm">Recurring schedules — set once, run every week automatically.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link to="/register" className="text-xs font-semibold text-brand-600 border border-brand-200 bg-white px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors">
            Bulk Create
          </Link>
          <Link to="/register" className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-2 rounded-xl transition-colors">
            + New Plan
          </Link>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
          {plans.filter((p) => p.active).length} active
        </span>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          {plans.filter((p) => !p.active).length} paused
        </span>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => {
          const mealParts = [];
          if (plan.meals.breakfast) mealParts.push(`${plan.meals.breakfast} Breakfast`);
          if (plan.meals.lunch)     mealParts.push(`${plan.meals.lunch} Lunch`);
          if (plan.meals.snack)     mealParts.push(`${plan.meals.snack} Snack`);

          return (
            <div key={plan.id} className={`card ${!plan.active ? 'opacity-60' : ''}`}>
              <div className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {plan.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{plan.kitchen} · {plan.eta}</p>

                  {/* Day badges */}
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
                      <span key={d} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.days.includes(d) ? (DAY_COLORS[d] ?? 'bg-blue-50 text-blue-700') : 'bg-gray-50 text-gray-300'}`}>
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Meal summary */}
                  <p className="text-xs text-gray-500">{mealParts.join(' · ')}</p>

                  {/* Sites */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {plan.sites.map((s, i) => (
                      <span key={i} className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggle(plan.id)}
                    className="text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    {plan.active ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-brand-50 border border-brand-100 rounded-2xl p-5">
        <p className="text-sm font-bold text-brand-900 mb-1">How Delivery Plans work</p>
        <p className="text-xs text-brand-700 leading-relaxed">
          Create a plan once — pick a kitchen, sites, days, arrival time, and meal counts.
          CACFPLink automatically generates daily delivery instances and notifies sites the morning of each delivery.
          Kitchens see a production list so they know exactly what to cook and for whom.
        </p>
        <Link to="/register" className="inline-block mt-3 text-xs font-bold text-brand-700 underline">
          Sign up to create your first plan →
        </Link>
      </div>
    </>
  );
}

// ─── Deliveries ───────────────────────────────────────────────────────────────
const TODAY_DELIVERIES = [
  { id:1, kitchen:'Downtown Kitchen', site:'Little Learners',  meal:'Breakfast', count:25, time:'7:30 AM'  },
  { id:2, kitchen:'Downtown Kitchen', site:'Sunshine Academy', meal:'Breakfast', count:20, time:'7:50 AM'  },
  { id:3, kitchen:'North Kitchen',    site:'Happy Hearts',     meal:'Lunch',     count:32, time:'11:15 AM' },
  { id:4, kitchen:'Downtown Kitchen', site:'Little Learners',  meal:'Lunch',     count:25, time:'11:30 AM' },
  { id:5, kitchen:'North Kitchen',    site:'Sunshine Academy', meal:'Snack',     count:18, time:'3:00 PM'  },
];
const DEMO_SCHEDULED_ROUTES = [
  { id:1, kitchen:'Downtown Kitchen', sites:2, days:'Mon–Fri', timing:'B: 7:30 AM · L: 11:30 AM', active:true  },
  { id:2, kitchen:'North Kitchen',    sites:1, days:'Mon–Fri', timing:'L: 11:15 AM · S: 3:00 PM',  active:true  },
  { id:3, kitchen:'Eastside Kitchen', sites:1, days:'Mon–Wed', timing:'B: 8:00 AM',                active:false },
];
function DeliveriesPage({ onOpenOrder }) {
  const [tab,     setTab]     = useState('today');
  const [checked, setChecked] = useState({});
  const [skipped, setSkipped] = useState({});
  const toggle = (id) => setChecked(c => ({ ...c, [id]: !c[id] }));
  const skip   = (id) => setSkipped(s => ({ ...s, [id]: !s[id] }));
  const delivered = Object.values(checked).filter(Boolean).length;
  const skippedN  = Object.values(skipped).filter(Boolean).length;

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-500 mt-1 text-sm">Today's checklist + recurring delivery routes</p>
        </div>
        <button
          onClick={onOpenOrder}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Delivery
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key:'today',     label:"Today's Deliveries" },
          { key:'schedules', label:'Scheduled Routes'   },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab===t.key?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'today' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label:"Total Today",  value: TODAY_DELIVERIES.length },
              { label:'Delivered',    value: delivered               },
              { label:'Remaining',    value: TODAY_DELIVERIES.length - delivered - skippedN },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Today's Checklist</h2>
                <p className="text-xs text-gray-400 mt-0.5">Thursday, August 14, 2026 · {delivered}/{TODAY_DELIVERIES.length} delivered</p>
              </div>
              <button className="text-xs font-semibold text-brand-600 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
                Notify Kitchens
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {TODAY_DELIVERIES.map((d) => (
                <div key={d.id} className={`px-6 py-4 flex items-center gap-3 ${skipped[d.id] ? 'opacity-50' : ''}`}>
                  <button onClick={() => toggle(d.id)}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${checked[d.id]?'bg-green-500 border-green-500':'border-gray-300 hover:border-brand-400'}`}
                  >
                    {checked[d.id] && <CheckCircle className="w-3 h-3 text-white" />}
                  </button>
                  <ChefHat className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${checked[d.id]?'line-through text-gray-400':'text-gray-900'}`}>
                      {d.kitchen} → {d.site}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.meal} · {d.count} meals · {d.time}</p>
                  </div>
                  {checked[d.id] ? (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Delivered</span>
                  ) : skipped[d.id] ? (
                    <button onClick={() => skip(d.id)} className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">Undo Skip</button>
                  ) : (
                    <button onClick={() => skip(d.id)} className="text-xs text-gray-400 hover:text-gray-600">Skip</button>
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-gray-50 rounded-b-2xl text-center border-t border-gray-100">
              <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to manage real deliveries.</p>
            </div>
          </div>
        </>
      )}

      {tab === 'schedules' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Scheduled Routes</h2>
            <p className="text-xs text-gray-400 mt-0.5">Recurring templates — set once, auto-generates daily deliveries at 6 AM</p>
          </div>
          <div className="divide-y divide-gray-50">
            {DEMO_SCHEDULED_ROUTES.map((p) => (
              <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.active?'bg-green-400':'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{p.kitchen}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.days} · {p.sites} site{p.sites!==1?'s':''} · {p.timing}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${p.active?'bg-green-50 text-green-700 border-green-100':'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {p.active?'Active':'Paused'}
                </span>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-brand-50 border-t border-brand-100 rounded-b-2xl">
            <p className="text-xs text-brand-700 font-medium">
              Scheduled routes auto-generate today's checklist every morning and notify kitchen + site staff automatically.
            </p>
          </div>
        </div>
      )}
      <DemoCTA />
    </>
  );
}

// ─── Attendance ───────────────────────────────────────────────────────────────
const DEMO_ROSTER = [
  { id:1, name:'Emma Johnson',   present:true,  breakfast:true,  lunch:true,  snack:false, supper:false },
  { id:2, name:'James Smith',    present:true,  breakfast:false, lunch:true,  snack:true,  supper:false },
  { id:3, name:'Aisha Williams', present:false, breakfast:false, lunch:false, snack:false, supper:false },
  { id:4, name:'Diego Martinez', present:true,  breakfast:true,  lunch:true,  snack:false, supper:false },
  { id:5, name:'Mia Chen',       present:true,  breakfast:false, lunch:true,  snack:true,  supper:false },
  { id:6, name:'Liam Thompson',  present:true,  breakfast:true,  lunch:true,  snack:true,  supper:false },
];
const SITE_OPTS = ['Little Learners', 'Sunshine Academy', 'Happy Hearts Daycare'];
function SponsorAttendancePage() {
  const [site,   setSite]   = useState(SITE_OPTS[0]);
  const [roster, setRoster] = useState(DEMO_ROSTER);
  const toggle = (id, field) => setRoster(r => r.map(c => c.id !== id ? c :
    field === 'present' ? { ...c, present: !c.present, breakfast:false, lunch:false, snack:false, supper:false }
                        : { ...c, [field]: !c[field] }
  ));
  const present   = roster.filter(c => c.present).length;
  const breakfast = roster.filter(c => c.breakfast).length;
  const lunch     = roster.filter(c => c.lunch).length;
  const snack     = roster.filter(c => c.snack).length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 mt-1 text-sm">Per-child daily records — USDA 7 CFR 226.10(d) compliant. Saving auto-populates meal counts.</p>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Site:</label>
        <select value={site} onChange={e => { setSite(e.target.value); setRoster(DEMO_ROSTER); }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300">
          {SITE_OPTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-400 ml-2">Thursday, August 14, 2026</span>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label:'Present',   value:present,   color:'text-green-600'  },
          { label:'Breakfast', value:breakfast, color:'text-orange-600' },
          { label:'Lunch',     value:lunch,     color:'text-green-600'  },
          { label:'Snack',     value:snack,     color:'text-blue-600'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setRoster(r => r.map(c => ({ ...c, present:true })))}
              className="text-xs font-semibold text-brand-600 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50">
              Mark All Present
            </button>
            <button onClick={() => setRoster(r => r.map(c => ({ ...c, present:false, breakfast:false, lunch:false, snack:false, supper:false })))}
              className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
              Mark All Absent
            </button>
          </div>
          <span className="text-xs text-gray-400">{roster.length} children enrolled</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-gray-500">Child</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600">Present</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-orange-500">🌅 Bkfst</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-green-500">☀️ Lunch</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-blue-500">🍎 Snack</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-purple-500">🌙 Supper</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {roster.map(c => (
                <tr key={c.id} className={!c.present ? 'opacity-50 bg-gray-50/60' : ''}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 flex-shrink-0">
                        {c.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggle(c.id, 'present')}
                      className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-colors ${c.present?'bg-green-500 border-green-500':'border-gray-300 hover:border-green-400'}`}>
                      {c.present && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                  </td>
                  {['breakfast','lunch','snack','supper'].map(meal => (
                    <td key={meal} className="px-4 py-3 text-center">
                      <input type="checkbox" checked={c[meal]} disabled={!c.present} onChange={() => toggle(c.id, meal)}
                        className="w-4 h-4 rounded accent-brand-600 cursor-pointer disabled:cursor-not-allowed" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex items-center justify-between">
          <p className="text-xs text-gray-400">Saving attendance auto-populates meal counts for the day</p>
          <button className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-1.5 rounded-lg transition-colors">
            Save Attendance
          </button>
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Menu Cycles ──────────────────────────────────────────────────────────────
const DEMO_CYCLES = [
  { id:1, name:'Fall Cycle 2026',    weeks:4, weeksAssigned:4, active:true,  schedule:'Sep 1 – Nov 28, 2026'  },
  { id:2, name:'Winter Cycle 2026',  weeks:4, weeksAssigned:2, active:false, schedule:'Not scheduled yet'      },
  { id:3, name:'Summer Rotation',    weeks:6, weeksAssigned:6, active:false, schedule:'Jun 1 – Aug 29, 2026'  },
];
const CYCLE_WEEKS = [
  { week:1, menu:'Standard Week A', items:18 },
  { week:2, menu:'Standard Week B', items:21 },
  { week:3, menu:'Variety Week',    items:19 },
  { week:4, menu:'Standard Week A', items:18 },
];
function MenuCyclesPage() {
  const [selected, setSelected] = useState(1);
  const cycle = DEMO_CYCLES.find(c => c.id === selected);

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Cycles</h1>
          <p className="text-gray-500 mt-1 text-sm">Build rotating menu libraries. Apply them to any date range — CACFPLink calculates the right week automatically.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex-shrink-0">
          <Plus className="w-4 h-4" /> New Cycle
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {DEMO_CYCLES.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)}
            className={`text-left bg-white border rounded-2xl p-4 shadow-sm hover:border-brand-300 transition-colors ${selected===c.id?'border-brand-400 ring-1 ring-brand-200':'border-gray-200'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
              {c.active && <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-full">Active</span>}
            </div>
            <p className="text-xs text-gray-500 mb-3">{c.weeks}-week rotation</p>
            <div className="bg-gray-100 rounded-full h-1.5">
              <div className="bg-brand-500 h-1.5 rounded-full" style={{ width:`${(c.weeksAssigned/c.weeks)*100}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{c.weeksAssigned}/{c.weeks} weeks assigned</p>
          </button>
        ))}
      </div>

      {cycle && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{cycle.name} — Week Assignments</h2>
              <p className="text-xs text-gray-400 mt-0.5">Scheduled: {cycle.schedule}</p>
            </div>
            <button className="text-xs font-semibold text-brand-600 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50">
              Apply to Calendar
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {CYCLE_WEEKS.map(w => (
              <div key={w.week} className="px-6 py-3.5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-brand-700">W{w.week}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{w.menu}</p>
                  <p className="text-xs text-gray-500">{w.items} food items · Mon–Fri</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full">Assigned</span>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-brand-50 border-t border-brand-100 rounded-b-2xl">
            <p className="text-xs text-brand-700 font-medium">
              Production Records auto-fill from the cycle's correct week — no manual lookup needed.
            </p>
          </div>
        </div>
      )}
      <DemoCTA />
    </>
  );
}

// ─── State Rule Book ──────────────────────────────────────────────────────────
const TX_RATES = [
  { type:'Breakfast',      tier1:'$1.70', tier2:'$0.31' },
  { type:'Lunch / Supper', tier1:'$3.22', tier2:'$1.23' },
  { type:'Snack',          tier1:'$0.96', tier2:'$0.10' },
];
const TX_DEADLINES = [
  { label:'Monthly claim',   value:'60 days after month end', note:'Submitted via SquareMeals portal' },
  { label:'Annual training', value:'Once per program year' },
  { label:'Site reviews',    value:'At least once annually' },
];
const TX_FORMS = [
  'Application for Participation','Site Information Sheet',
  'CACFP Monthly Claim (FNS-10)','Income Eligibility Statement',
  'Meal Pattern Checklist','Serious Deficiency Notice Template',
];
function StateRuleBookDemoPage() {
  const [tab, setTab] = useState('state');
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">State Rule Book</h1>
        <p className="text-gray-500 mt-1 text-sm">CACFP rules, rates, and deadlines for Texas — in plain English</p>
      </div>
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {[{ key:'state', label:'Texas (TX)' },{ key:'federal', label:'Federal Meal Pattern' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab===t.key?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'state' && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Reimbursement Rates (Tier I)</h2>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100"><th className="text-left pb-2 text-xs text-gray-500">Meal</th><th className="text-right pb-2 text-xs text-gray-500">Tier I</th><th className="text-right pb-2 text-xs text-gray-500">Tier II</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {TX_RATES.map(r => (
                    <tr key={r.type}><td className="py-2 text-gray-700">{r.type}</td><td className="py-2 text-right font-bold text-green-600">{r.tier1}</td><td className="py-2 text-right text-gray-500">{r.tier2}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Key Deadlines</h2>
              <div className="space-y-3">
                {TX_DEADLINES.map(d => (
                  <div key={d.label}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{d.label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{d.value}</p>
                    {d.note && <p className="text-xs text-gray-400">{d.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-4">
            <h2 className="font-semibold text-gray-900 mb-1">State Agency — Texas Department of Agriculture (TDA)</h2>
            <p className="text-sm text-brand-600 mt-1">squaremeals.org — SquareMeals Claims Reimbursement Portal</p>
            <p className="text-xs text-gray-500 mt-1">(877) 228-5799 · cacfp@texasagriculture.gov</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Required Forms</h2>
            <div className="grid grid-cols-2 gap-2">
              {TX_FORMS.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-[10px] font-bold flex-shrink-0">✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'federal' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Federal Meal Pattern (7 CFR Part 226)</h2>
          <div className="space-y-4">
            {[
              { meal:'🌅 Breakfast',      components:['Fluid milk (age-appropriate)','Grain/bread or meat alternate','Fruit or vegetable'] },
              { meal:'☀️ Lunch / 🌙 Supper', components:['Fluid milk (age-appropriate)','Grain/bread (WGR ≥ 1 serving)','Meat or meat alternate','Fruit','Vegetable'] },
              { meal:'🍎 Snack',          components:['Choose 2 of 4: milk, grain/bread, meat/alternate, fruit or vegetable'] },
            ].map(m => (
              <div key={m.meal} className="border border-gray-100 rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-2">{m.meal}</p>
                <ul className="space-y-1">
                  {m.components.map(c => <li key={c} className="text-sm text-gray-600 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />{c}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Federal meal pattern rules are identical in all 50 states</p>
        </div>
      )}
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

// ─── Claims ──────────────────────────────────────────────────────────────────
function ClaimsPage() {
  const [counts, setCounts] = useState({ ...DEMO_INITIAL_COUNTS });
  const [simOpen, setSimOpen] = useState(false);
  const SCORE = 88;

  const blended = (type) => 0.7 * DEMO_RATES[type].tier1 + 0.3 * DEMO_RATES[type].tier2;
  const fmt$ = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const simTotal     = Object.entries(counts).reduce((s, [t, n]) => s + n * blended(t), 0);
  const currentTotal = Object.entries(DEMO_INITIAL_COUNTS).reduce((s, [t, n]) => s + n * blended(t), 0);
  const delta        = simTotal - currentTotal;

  const adjust = (type, d) => setCounts(c => ({ ...c, [type]: Math.max(0, c[type] + d) }));
  const reset  = () => setCounts({ ...DEMO_INITIAL_COUNTS });

  const statusCfg = {
    ready:        { label: 'Ready',   bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400' },
    needs_review: { label: 'Review',  bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
    cannot_submit:{ label: 'Blocked', bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400' },
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Claim Command Center</h1>
        <p className="text-gray-500 mt-1">July 2026 · Ohio CACFP Program</p>
      </div>

      {/* Health Score */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-gray-900">Claim Health Score</h2>
            <p className="text-xs text-gray-400 mt-0.5">1 issue preventing full readiness · Fix it to recover $820</p>
          </div>
          <span className="text-3xl font-black text-amber-500">{SCORE}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-600 rounded-full" style={{ width: `${SCORE}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="text-red-600 font-medium">• 1 site needs review</span>
          <span className="text-gray-400">• 4 sites ready</span>
          <span className="text-gray-400">• Claim period active</span>
        </div>
      </div>

      {/* 3 stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Estimated Reimbursement', value: fmt$(currentTotal), color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Reimbursement at Risk',   value: '$820',             color: 'text-red-600',   bg: 'bg-red-50'   },
          { label: 'Claim Deadline',          value: 'Jul 31',           color: 'text-brand-600', bg: 'bg-brand-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border border-gray-100 rounded-2xl p-5`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Meal Breakdown */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Meal Type Breakdown</h2>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100 px-2 py-4">
          {[
            { label: 'Breakfast', value: fmt$(DEMO_INITIAL_COUNTS.breakfast * blended('breakfast')), count: '2,100 meals', color: 'text-orange-600' },
            { label: 'Lunch',     value: fmt$(DEMO_INITIAL_COUNTS.lunch     * blended('lunch')),     count: '2,900 meals', color: 'text-green-600'  },
            { label: 'Snack',     value: fmt$(DEMO_INITIAL_COUNTS.snack     * blended('snack')),     count: '2,000 meals', color: 'text-blue-600'   },
          ].map(({ label, value, count, color }) => (
            <div key={label} className="px-4 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Simulator */}
      <div className="mb-6">
        <button
          onClick={() => setSimOpen(o => !o)}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-3 text-sm font-semibold text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors"
        >
          {simOpen ? '▲ Hide Claim Simulator' : '🧮 Open Claim Simulator — Adjust meal counts and see impact instantly'}
        </button>
        {simOpen && (
          <div className="mt-3 bg-white border border-brand-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-brand-900">Claim Simulator</h3>
                <p className="text-xs text-brand-600 mt-0.5">Adjust counts to see how reimbursement changes instantly</p>
              </div>
              <button onClick={reset} className="text-xs font-semibold text-brand-600 hover:underline">Reset to actual</button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {Object.keys(DEMO_INITIAL_COUNTS).map((type) => {
                const c = MEAL_COLORS[type];
                return (
                  <div key={type} className={`${c.bg} border ${c.border} rounded-xl p-3`}>
                    <p className={`text-xs font-bold ${c.text} mb-2`}>{c.label}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => adjust(type, -10)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">−</button>
                      <input
                        type="number"
                        value={counts[type]}
                        onChange={e => setCounts(prev => ({ ...prev, [type]: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="flex-1 text-center text-sm font-bold bg-white border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                      />
                      <button onClick={() => adjust(type, 10)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">+</button>
                    </div>
                    <p className={`text-xs ${c.text} mt-1.5 text-center font-medium`}>
                      ≈ {fmt$(counts[type] * blended(type))}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className={`px-6 py-4 border-t flex items-center justify-between ${delta >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Simulated Total</p>
                <p className="text-xl font-black text-gray-900">{fmt$(simTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">vs Current Estimate</p>
                <p className={`text-lg font-bold ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {delta >= 0 ? '+' : ''}{fmt$(delta)}
                </p>
              </div>
            </div>
            <div className="px-6 py-3 text-center border-t border-gray-100">
              <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to simulate with your real meal data.</p>
            </div>
          </div>
        )}
      </div>

      {/* Site Status Grid */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Site Status — 4 / 5 Ready</h2>
          <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: '80%' }} />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
          {DEMO_SITES_CLAIM.map((site) => {
            const cfg = statusCfg[site.status];
            return (
              <div key={site.name} className={`${cfg.bg} border border-gray-100 rounded-xl p-3`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5">{site.name}</p>
                <p className="text-sm font-bold text-gray-900">{fmt$(site.est)}</p>
                {site.error && <p className="text-xs text-red-600 mt-1">{site.error}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate Claim CTA */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Submit & Export</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex gap-3">
            <Link to="/register" className="flex-1 py-2.5 bg-brand-600 text-white font-semibold text-sm rounded-xl text-center hover:bg-brand-700 transition-colors">
              Sign Up to Generate Claim →
            </Link>
            <button disabled className="flex-1 py-2.5 bg-gray-100 text-gray-400 font-semibold text-sm rounded-xl cursor-not-allowed">
              📄 Download PDF (Sign Up)
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-bold text-gray-800 mb-0.5">🔍 One-Click Audit Mode</p>
            <p className="text-xs text-gray-500 mb-2">Generate a secure read-only link for auditors — no login required. Share it in seconds.</p>
            <Link to="/register" className="inline-block text-xs font-semibold text-brand-600 hover:underline">
              Sign Up to Create Audit Link →
            </Link>
          </div>
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Demo only — <Link to="/register" className="text-brand-600 hover:underline">sign up</Link> to generate real claims.</p>
        </div>
      </div>

      <DemoCTA />
    </>
  );
}

// ─── Child Roster ─────────────────────────────────────────────────────────────
const CHILDREN = [
  { name: 'Emma Rodriguez',   dob: '2022-03-15', status: 'active',   age_group: 'toddler',    site: 'Sunshine Daycare',     tier: 1 },
  { name: 'Marcus Johnson',   dob: '2021-08-22', status: 'active',   age_group: 'preschool',  site: 'Happy Hearts Center',  tier: 1 },
  { name: 'Sofia Chen',       dob: '2020-01-10', status: 'active',   age_group: 'preschool',  site: 'Bright Minds Academy', tier: 2 },
  { name: 'Aiden Williams',   dob: '2019-11-05', status: 'inactive', age_group: 'school_age', site: 'Little Stars Center',  tier: 1 },
  { name: 'Isabella Davis',   dob: '2022-07-30', status: 'active',   age_group: 'infant',     site: 'Sunshine Daycare',     tier: 1 },
  { name: 'Noah Martinez',    dob: '2021-02-14', status: 'active',   age_group: 'toddler',    site: 'Happy Hearts Center',  tier: 2 },
  { name: 'Olivia Thompson',  dob: '2020-09-05', status: 'active',   age_group: 'preschool',  site: 'Bright Minds Academy', tier: 1 },
  { name: 'Liam Parker',      dob: '2023-01-20', status: 'pending',  age_group: 'infant',     site: 'Riverside Childcare',  tier: 1 },
];
const AGE_META = {
  infant:     { label: 'Infant',     bg: 'bg-pink-50',    text: 'text-pink-700'    },
  toddler:    { label: 'Toddler',    bg: 'bg-purple-50',  text: 'text-purple-700'  },
  preschool:  { label: 'Preschool',  bg: 'bg-blue-50',    text: 'text-blue-700'    },
  school_age: { label: 'School Age', bg: 'bg-green-50',   text: 'text-green-700'   },
};
const CHILD_STATUS_META = {
  active:   { label: 'Active',   bg: 'bg-green-50',  text: 'text-green-700' },
  inactive: { label: 'Inactive', bg: 'bg-gray-100',  text: 'text-gray-500'  },
  pending:  { label: 'Pending',  bg: 'bg-yellow-50', text: 'text-yellow-700'},
};

function ChildRosterPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const visible = CHILDREN.filter(c =>
    (filter === 'all' || c.status === filter) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const active   = CHILDREN.filter(c => c.status === 'active').length;
  const inactive = CHILDREN.filter(c => c.status === 'inactive').length;
  const pending  = CHILDREN.filter(c => c.status === 'pending').length;
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Child Roster</h1>
          <p className="text-gray-500 mt-1">{CHILDREN.length} children enrolled across all sites</p>
        </div>
        <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Add Child
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active',   value: active,   bg: 'bg-green-50',  text: 'text-green-700'  },
          { label: 'Inactive', value: inactive, bg: 'bg-gray-100',  text: 'text-gray-600'   },
          { label: 'Pending',  value: pending,  bg: 'bg-yellow-50', text: 'text-yellow-700' },
        ].map(({ label, value, bg, text }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${text}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4">
        <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" />
          <div className="flex gap-1">
            {['all','active','inactive','pending'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${filter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {visible.map((c) => {
            const am = AGE_META[c.age_group];
            const sm = CHILD_STATUS_META[c.status];
            const age = Math.floor((new Date() - new Date(c.dob)) / (365.25 * 24 * 3600 * 1000));
            return (
              <div key={c.name} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-brand-600">{c.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.site} · Age {age} · Tier {c.tier}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${am.bg} ${am.text}`}>{am.label}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sm.bg} ${sm.text}`}>{sm.label}</span>
              </div>
            );
          })}
          {visible.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-gray-400">No children match your filter.</div>
          )}
        </div>
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
const DEMO_TASKS = [
  { id:1, title: 'Review Happy Hearts enrollment list',     priority:'urgent', status:'open',      due:'Jul 22, 2026', assignee:'Maria Torres',   category:'compliance' },
  { id:2, title: 'Follow up on Lincoln Kitchen food permit',priority:'high',   status:'open',      due:'Jul 24, 2026', assignee:'James Porter',   category:'documents'  },
  { id:3, title: 'Send broadcast reminder for July counts', priority:'medium', status:'open',      due:'Jul 25, 2026', assignee:'You',            category:'general'    },
  { id:4, title: 'Approve Sunshine Daycare application',    priority:'high',   status:'open',      due:'Jul 21, 2026', assignee:'You',            category:'applications'},
  { id:5, title: 'Update Metro Meals delivery schedule',    priority:'low',    status:'completed', due:'Jul 18, 2026', assignee:'Aaliyah Brooks', category:'deliveries' },
  { id:6, title: 'Review Q2 compliance report',            priority:'low',    status:'completed', due:'Jul 15, 2026', assignee:'You',            category:'compliance' },
];
const PRIORITY_META = {
  urgent: { label:'Urgent', dot:'bg-red-500',    text:'text-red-700',    bg:'bg-red-50'    },
  high:   { label:'High',   dot:'bg-orange-400', text:'text-orange-700', bg:'bg-orange-50' },
  medium: { label:'Medium', dot:'bg-amber-400',  text:'text-amber-700',  bg:'bg-amber-50'  },
  low:    { label:'Low',    dot:'bg-gray-400',   text:'text-gray-600',   bg:'bg-gray-100'  },
};

function TasksPage() {
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const toggle = (id) => setTasks(t => t.map(x => x.id === id ? { ...x, status: x.status === 'open' ? 'completed' : 'open' } : x));
  const open      = tasks.filter(t => t.status === 'open');
  const completed = tasks.filter(t => t.status === 'completed');
  const overdue   = open.filter(t => new Date(t.due) < new Date()).length;
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Track important actions across your program</p>
        </div>
        <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Add Task
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Open',      value: open.length,      bg:'bg-blue-50',   text:'text-blue-700'  },
          { label:'Overdue',   value: overdue,           bg:'bg-red-50',    text:'text-red-700'   },
          { label:'Completed', value: completed.length,  bg:'bg-green-50',  text:'text-green-700' },
        ].map(({ label, value, bg, text }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${text}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      {open.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Open Tasks</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {open.map(t => {
              const pm = PRIORITY_META[t.priority];
              const isOverdue = new Date(t.due) < new Date();
              return (
                <div key={t.id} className="px-5 py-4 flex items-start gap-3">
                  <button onClick={() => toggle(t.id)} className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 hover:border-brand-500 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pm.bg} ${pm.text}`}>{pm.label}</span>
                      <span className="text-xs text-gray-400">{t.category}</span>
                      <span className="text-xs text-gray-400">→ {t.assignee}</span>
                      {isOverdue
                        ? <span className="text-xs font-bold text-red-600">Overdue · {t.due}</span>
                        : <span className="text-xs text-gray-400">Due {t.due}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {completed.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-gray-400">Completed</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {completed.map(t => (
              <div key={t.id} className="px-5 py-4 flex items-start gap-3 opacity-60">
                <button onClick={() => toggle(t.id)} className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 border-green-400 bg-green-400 flex items-center justify-center transition-colors">
                  <CheckSquare className="w-3 h-3 text-white" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 line-through">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Completed · {t.due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <DemoCTA />
    </>
  );
}

// ─── Inspections ──────────────────────────────────────────────────────────────
const DEMO_INSPECTIONS = [
  {
    id: 1, org: 'Happy Hearts Center', visitType: 'Sponsor Monitoring', date: 'Jul 8, 2026',
    conductedBy: 'Maria Torres', status: 'corrective_action_required',
    findings: [
      { id:1, finding:'Meal counts not posted in meal service area', severity:'major',    status:'open',     due:'Jul 22, 2026' },
      { id:2, finding:'Missing civil rights poster',                 severity:'minor',    status:'resolved', due:null           },
    ],
  },
  {
    id: 2, org: 'Sunshine Daycare', visitType: 'Sponsor Monitoring', date: 'Jul 1, 2026',
    conductedBy: 'James Porter', status: 'resolved',
    findings: [
      { id:3, finding:'Enrollment forms not current', severity:'minor', status:'resolved', due:null },
    ],
  },
  {
    id: 3, org: 'Lincoln Kitchen', visitType: 'Self Assessment', date: 'Jun 20, 2026',
    conductedBy: 'Aaliyah Brooks', status: 'completed',
    findings: [],
  },
];
const SEV_META = {
  critical:    { label:'Critical',    bg:'bg-red-100',    text:'text-red-700'    },
  major:       { label:'Major',       bg:'bg-orange-100', text:'text-orange-700' },
  minor:       { label:'Minor',       bg:'bg-yellow-100', text:'text-yellow-700' },
  observation: { label:'Observation', bg:'bg-blue-50',    text:'text-blue-700'   },
};
const INSP_STATUS = {
  corrective_action_required: { label:'Action Required', bg:'bg-red-50',    text:'text-red-700'    },
  resolved:                   { label:'Resolved',        bg:'bg-green-50',  text:'text-green-700'  },
  completed:                  { label:'Completed',       bg:'bg-gray-100',  text:'text-gray-600'   },
  scheduled:                  { label:'Scheduled',       bg:'bg-blue-50',   text:'text-blue-700'   },
};

function InspectionsPage() {
  const [expanded, setExpanded] = useState({});
  const [resolved, setResolved] = useState({});
  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const resolve = (fid) => setResolved(r => ({ ...r, [fid]: true }));
  const totalFindings = DEMO_INSPECTIONS.flatMap(i => i.findings).length;
  const openFindings  = DEMO_INSPECTIONS.flatMap(i => i.findings).filter(f => f.status === 'open').length;
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
          <p className="text-gray-500 mt-1">Monitor visits, findings, and corrective actions</p>
        </div>
        <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Log Visit
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Total Visits',  value: DEMO_INSPECTIONS.length, bg:'bg-blue-50',   text:'text-blue-700'  },
          { label:'Open Findings', value: openFindings,            bg:'bg-red-50',    text:'text-red-700'   },
          { label:'Resolved',      value: totalFindings - openFindings, bg:'bg-green-50',text:'text-green-700'},
        ].map(({ label, value, bg, text }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${text}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-4 mb-6">
        {DEMO_INSPECTIONS.map(insp => {
          const sm = INSP_STATUS[insp.status] ?? INSP_STATUS.completed;
          const isOpen = expanded[insp.id];
          return (
            <div key={insp.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <button onClick={() => toggle(insp.id)} className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors">
                <ShieldCheck className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{insp.org}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{insp.visitType} · {insp.date} · {insp.conductedBy}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${sm.bg} ${sm.text}`}>{sm.label}</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 border-t border-gray-100">
                  {insp.findings.length === 0 ? (
                    <p className="text-sm text-green-600 font-medium pt-4">✓ No findings — clean visit</p>
                  ) : (
                    <div className="pt-3 space-y-2">
                      {insp.findings.map(f => {
                        const isRes = resolved[f.id] || f.status === 'resolved';
                        const sev = SEV_META[f.severity] ?? SEV_META.minor;
                        return (
                          <div key={f.id} className={`flex items-start gap-3 p-3 rounded-xl ${isRes ? 'bg-green-50 opacity-60' : 'bg-gray-50'}`}>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${sev.bg} ${sev.text}`}>{sev.label}</span>
                            <p className={`flex-1 text-sm ${isRes ? 'line-through text-gray-400' : 'text-gray-800'}`}>{f.finding}</p>
                            {!isRes && (
                              <button onClick={() => resolve(f.id)} className="text-xs font-semibold text-green-600 hover:text-green-700 flex-shrink-0">
                                Resolve
                              </button>
                            )}
                            {isRes && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <DemoCTA />
    </>
  );
}

// ─── Menus ────────────────────────────────────────────────────────────────────
const MENU_DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MEAL_TYPES  = ['breakfast','lunch','snack','supper'];
const COMP_EMOJI  = { milk:'🥛', grain:'🌾', protein:'🍗', fruit:'🍎', vegetable:'🥦', formula:'🍼', other:'🍽️' };

const MENU_GRID_BASE = {
  Mon: {
    breakfast:[{food:'Whole Wheat Toast',comp:'grain',wgr:true},{food:'1% Milk',comp:'milk'},{food:'Orange Juice',comp:'fruit'}],
    lunch:    [{food:'Turkey Sandwich',comp:'protein'},{food:'WG Bread',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Apple Slices',comp:'fruit'},{food:'Carrots',comp:'vegetable'}],
    snack:    [{food:'Graham Crackers',comp:'grain'},{food:'Apple Juice',comp:'fruit'}],
    supper:   [],
  },
  Tue: {
    breakfast:[{food:'Oatmeal',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Banana',comp:'fruit'}],
    lunch:    [{food:'Chicken Strips',comp:'protein'},{food:'Brown Rice',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Peach Cup',comp:'fruit'}],
    snack:    [{food:'Yogurt',comp:'milk'}],   // missing 2nd comp
    supper:   [],
  },
  Wed: {
    breakfast:[{food:'Pancakes',comp:'grain'},{food:'Milk',comp:'milk'}],  // missing fruit/veg
    lunch:    [{food:'Bean Burrito',comp:'protein'},{food:'WG Tortilla',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Pineapple',comp:'fruit'},{food:'Corn',comp:'vegetable'}],
    snack:    [{food:'String Cheese',comp:'milk'},{food:'WG Crackers',comp:'grain',wgr:true}],
    supper:   [],
  },
  Thu: {
    breakfast:[{food:'Cereal',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Strawberries',comp:'fruit'}],
    lunch:    [{food:'Tuna Salad',comp:'protein'},{food:'WG Bread',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Grapes',comp:'fruit'},{food:'Broccoli',comp:'vegetable'}],
    snack:    [{food:'Apple',comp:'fruit'},{food:'Peanut Butter',comp:'protein'}],
    supper:   [],
  },
  Fri: {
    breakfast:[{food:'French Toast',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'OJ',comp:'fruit'}],
    lunch:    [{food:'Salmon Patty',comp:'protein'},{food:'Brown Rice',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Mandarin',comp:'fruit'},{food:'Green Beans',comp:'vegetable'}],
    snack:    [{food:'WG Crackers',comp:'grain',wgr:true},{food:'Hummus',comp:'protein'}],
    supper:   [],
  },
  Sat: {
    breakfast:[{food:'Scrambled Eggs',comp:'protein'},{food:'WG Toast',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Melon',comp:'fruit'}],
    lunch:    [{food:'Grilled Cheese',comp:'protein'},{food:'WG Bread',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Tomato Soup',comp:'vegetable'},{food:'Peach',comp:'fruit'}],
    snack:    [{food:'Popcorn',comp:'grain'},{food:'Apple',comp:'fruit'}],
    supper:   [{food:'Chicken',comp:'protein'},{food:'WG Pasta',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Peas',comp:'vegetable'},{food:'Orange',comp:'fruit'}],
  },
  Sun: {
    breakfast:[{food:'Waffles',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Blueberries',comp:'fruit'}],
    lunch:    [{food:'Turkey Meatballs',comp:'protein'},{food:'WG Spaghetti',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Marinara Veg',comp:'vegetable'},{food:'Grapes',comp:'fruit'}],
    snack:    [{food:'Yogurt',comp:'milk'},{food:'Granola',comp:'grain',wgr:true}],
    supper:   [{food:'Baked Fish',comp:'protein'},{food:'Brown Rice',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Broccoli',comp:'vegetable'},{food:'Peach',comp:'fruit'}],
  },
};

const AI_GENERATED_GRID = {
  Mon:{breakfast:[{food:'WG English Muffin',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Apple',comp:'fruit'}],lunch:[{food:'Beef Taco',comp:'protein'},{food:'WG Tortilla',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Mango',comp:'fruit'},{food:'Peppers',comp:'vegetable'}],snack:[{food:'Cheese',comp:'milk'},{food:'WG Crackers',comp:'grain',wgr:true}],supper:[]},
  Tue:{breakfast:[{food:'Cream of Wheat',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Raisins',comp:'fruit'}],lunch:[{food:'Pork Loin',comp:'protein'},{food:'WG Roll',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Applesauce',comp:'fruit'},{food:'Sweet Potato',comp:'vegetable'}],snack:[{food:'Hummus',comp:'protein'},{food:'Veggie Sticks',comp:'vegetable'}],supper:[]},
  Wed:{breakfast:[{food:'WG Bagel',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Orange',comp:'fruit'}],lunch:[{food:'Chicken Soup',comp:'protein'},{food:'WG Noodles',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Pear',comp:'fruit'},{food:'Celery',comp:'vegetable'}],snack:[{food:'Milk',comp:'milk'},{food:'Graham Crackers',comp:'grain'}],supper:[]},
  Thu:{breakfast:[{food:'Grits',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Peach',comp:'fruit'}],lunch:[{food:'Egg Salad',comp:'protein'},{food:'WG Bread',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Grapes',comp:'fruit'},{food:'Spinach',comp:'vegetable'}],snack:[{food:'Apple',comp:'fruit'},{food:'Cheese',comp:'milk'}],supper:[]},
  Fri:{breakfast:[{food:'WG Pancakes',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Berries',comp:'fruit'}],lunch:[{food:'Salmon',comp:'protein'},{food:'Brown Rice',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Kiwi',comp:'fruit'},{food:'Zucchini',comp:'vegetable'}],snack:[{food:'Yogurt',comp:'milk'},{food:'WG Granola',comp:'grain',wgr:true}],supper:[]},
  Sat:{breakfast:[{food:'Oatmeal',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Banana',comp:'fruit'}],lunch:[{food:'Turkey Chili',comp:'protein'},{food:'WG Cornbread',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Apple',comp:'fruit'},{food:'Tomatoes',comp:'vegetable'}],snack:[{food:'Popcorn',comp:'grain'},{food:'Juice',comp:'fruit'}],supper:[{food:'Baked Chicken',comp:'protein'},{food:'WG Mac',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Broccoli',comp:'vegetable'},{food:'Peach',comp:'fruit'}]},
  Sun:{breakfast:[{food:'WG Cereal',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Strawberries',comp:'fruit'}],lunch:[{food:'Tuna Casserole',comp:'protein'},{food:'WG Pasta',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Green Beans',comp:'vegetable'},{food:'Orange',comp:'fruit'}],snack:[{food:'Cheese',comp:'milk'},{food:'Apple',comp:'fruit'}],supper:[{food:'Pork Loin',comp:'protein'},{food:'Brown Rice',comp:'grain',wgr:true},{food:'Milk',comp:'milk'},{food:'Carrots',comp:'vegetable'},{food:'Grapes',comp:'fruit'}]},
};

const MENU_TEMPLATES = [
  { name:'Classic Weekday',   saved: true },
  { name:'High-Protein Week', saved: true },
  { name:'Vegetarian Pack',   saved: false },
];

function validateMenuMeal(items, type) {
  if (!items || items.length === 0) return { ok: false, missing: ['empty'] };
  const comps = new Set(items.map(i => i.comp));
  if (type === 'breakfast') {
    const m=[];
    if (!comps.has('milk'))  m.push('milk');
    if (!comps.has('grain')) m.push('grain');
    if (!comps.has('fruit') && !comps.has('vegetable')) m.push('fruit/veg');
    return { ok: m.length===0, missing: m };
  }
  if (type === 'lunch' || type === 'supper') {
    const m=[];
    if (!comps.has('milk'))      m.push('milk');
    if (!comps.has('grain'))     m.push('grain');
    if (!comps.has('protein'))   m.push('protein');
    if (!comps.has('fruit'))     m.push('fruit');
    if (!comps.has('vegetable')) m.push('vegetable');
    return { ok: m.length===0, missing: m };
  }
  const present = ['milk','grain','protein','fruit','vegetable'].filter(c => comps.has(c));
  return { ok: present.length>=2, missing: present.length<2?['needs 2 components']:[] };
}

function dayValidation(grid, day) {
  const meals = MEAL_TYPES.filter(m => (grid[day]?.[m]?.length??0) > 0 || m !== 'supper' || ['Sat','Sun'].includes(day));
  let issues=0;
  meals.forEach(m => { if (!(validateMenuMeal(grid[day]?.[m], m).ok)) issues++; });
  return issues===0 ? 'green' : issues===1 ? 'yellow' : 'red';
}

function DayStatusDot({ color }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
      color==='green' ? 'bg-green-400' : color==='yellow' ? 'bg-amber-400' : 'bg-red-400'
    }`} />
  );
}

function MenusPage() {
  const [grid,         setGrid]         = useState(MENU_GRID_BASE);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showTemplates,setShowTemplates]= useState(false);
  const [infantTrack,  setInfantTrack]  = useState(false);
  const [panelDay,     setPanelDay]     = useState(null);
  const templatesRef = useRef(null);

  // Close templates on outside click
  useEffect(() => {
    function handle(e) { if (templatesRef.current && !templatesRef.current.contains(e.target)) setShowTemplates(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const totalIssues = MENU_DAYS.reduce((acc, d) => {
    return acc + MEAL_TYPES.filter(m => {
      const items = grid[d]?.[m];
      if (!items?.length) return false;
      return !validateMenuMeal(items, m).ok;
    }).length;
  }, 0);

  function handleAIGenerate() {
    setAiGenerating(true);
    setTimeout(() => {
      setGrid(AI_GENERATED_GRID);
      setAiGenerating(false);
    }, 1800);
  }

  const activeMealTypes = infantTrack ? [...MEAL_TYPES, 'infant'] : MEAL_TYPES;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Week of Jul 14 – 20, 2026</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Infant track */}
          <button onClick={() => setInfantTrack(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              infantTrack ? 'border-pink-300 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}>
            🍼 Infant Track {infantTrack ? 'ON' : 'OFF'}
          </button>
          {/* Copy previous week */}
          <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            ← Copy Prev Week
          </button>
          {/* Templates */}
          <div className="relative" ref={templatesRef}>
            <button onClick={() => setShowTemplates(v => !v)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              Templates ▾
            </button>
            {showTemplates && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-48 py-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase px-3 pt-2 pb-1">Saved Templates</p>
                {MENU_TEMPLATES.filter(t => t.saved).map(t => (
                  <button key={t.name} onClick={() => setShowTemplates(false)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 font-medium text-gray-700">
                    {t.name}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-brand-600 font-semibold">
                    + Save current as template
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* AI Generate */}
          <button onClick={handleAIGenerate} disabled={aiGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-violet-600 text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-60">
            {aiGenerating ? (
              <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
            ) : (
              <><span>✨</span> AI Generate</>
            )}
          </button>
        </div>
      </div>

      {/* Validation banner */}
      {aiGenerating ? (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl px-5 py-3 mb-4 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm font-semibold text-brand-700">AI is building a compliant 7-day menu plan…</p>
        </div>
      ) : totalIssues > 0 ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-3 mb-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700">{totalIssues} meals have missing CACFP components — fix before submitting</p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 mb-4 flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700">All meals meet CACFP requirements — ready to approve</p>
        </div>
      )}

      <div className="flex gap-4">
        {/* Grid */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs min-w-[780px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-20 px-3 py-3 text-left font-semibold text-gray-400 text-[11px] uppercase tracking-wide">Meal</th>
                {MENU_DAYS.map(d => {
                  const color = dayValidation(grid, d);
                  return (
                    <th key={d} className="px-2 py-3 text-center">
                      <button onClick={() => setPanelDay(panelDay===d ? null : d)}
                        className={`w-full flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 transition-colors ${
                          panelDay===d ? 'bg-brand-50' : 'hover:bg-gray-50'
                        }`}>
                        <span className="font-bold text-gray-700">{d}</span>
                        <DayStatusDot color={color} />
                        <span className="text-[10px] text-gray-400">~$3.42</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map(meal => (
                <tr key={meal} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-2.5 font-semibold text-gray-500 capitalize align-top text-[11px]">{meal}</td>
                  {MENU_DAYS.map(day => {
                    const items = grid[day]?.[meal] ?? [];
                    if (!items.length && (meal==='supper') && !['Sat','Sun'].includes(day)) {
                      return <td key={day} className="px-2 py-2 align-top"><span className="text-gray-200 text-[10px]">–</span></td>;
                    }
                    const { ok, missing } = validateMenuMeal(items, meal);
                    return (
                      <td key={day} className={`px-2 py-2 align-top ${
                        items.length===0 ? 'bg-gray-50' : ok ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        {items.length===0 ? (
                          <span className="text-gray-300 italic text-[10px]">Empty</span>
                        ) : (
                          <div className="space-y-1">
                            {items.map((item, i) => (
                              <div key={i} className="flex items-center gap-0.5 flex-wrap">
                                <span className="text-[11px]">{COMP_EMOJI[item.comp]??'🍽️'}</span>
                                <span className={`text-[10px] leading-tight ${ok?'text-green-800':'text-red-800'}`}>{item.food}</span>
                                {item.wgr && <span className="text-amber-400 text-[10px]">🌾</span>}
                              </div>
                            ))}
                            {!ok && <p className="text-red-500 font-bold text-[9px] mt-0.5">⚠ {missing.join(', ')}</p>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Infant row if toggled */}
              {infantTrack && (
                <tr className="bg-pink-50 border-t border-pink-100">
                  <td className="px-3 py-2 font-semibold text-pink-600 text-[11px] align-top">🍼 Infant</td>
                  {MENU_DAYS.map(day => (
                    <td key={day} className="px-2 py-2 text-[10px] text-pink-700 align-top">
                      Formula + Iron-fortified cereal
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Validation panel (appears when a day is clicked) */}
        {panelDay && (
          <div className="w-52 flex-shrink-0 bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-900 text-sm">{panelDay} — Issues</p>
              <button onClick={() => setPanelDay(null)} className="text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-2">
              {MEAL_TYPES.map(meal => {
                const items = grid[panelDay]?.[meal] ?? [];
                if (!items.length && meal==='supper' && !['Sat','Sun'].includes(panelDay)) return null;
                const { ok, missing } = validateMenuMeal(items, meal);
                return (
                  <div key={meal} className={`rounded-lg p-2 text-xs ${ok ? 'bg-green-50' : items.length ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-1.5 font-semibold capitalize mb-0.5">
                      <DayStatusDot color={ok?'green': items.length?'red':'red'} />
                      <span className={ok?'text-green-800':items.length?'text-red-700':'text-gray-400'}>{meal}</span>
                    </div>
                    {!ok && missing[0]!=='empty' && (
                      <p className="text-red-500 text-[10px]">Missing: {missing.join(', ')}</p>
                    )}
                    {!ok && missing[0]==='empty' && (
                      <p className="text-gray-400 text-[10px]">No items added</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-[11px] text-gray-500 font-semibold mb-1.5">Est. reimbursement</p>
              <p className="text-lg font-bold text-gray-900">$3.42 <span className="text-xs font-normal text-gray-400">/ child</span></p>
              <p className="text-[10px] text-gray-400 mt-0.5">Based on 28 enrolled × OH Tier 1</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-gray-400 mt-4 flex-wrap">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> All components met</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 1 issue</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Multiple issues</div>
        <div className="flex items-center gap-1.5"><span>🌾</span> Whole Grain Rich</div>
        <span className="text-gray-300">· Click a day header to see details</span>
      </div>

      <div className="mt-6">
        <DemoCTA />
      </div>
    </>
  );
}

// ─── Activity ─────────────────────────────────────────────────────────────────
const SPONSOR_ACTIVITY = [
  { icon:'📋', type:'application_submitted', title:'ABC Childcare submitted an application',     time:'9:42 AM',   group:'Today'     },
  { icon:'🍽️', type:'meal_counts_submitted', title:'Sunshine Daycare submitted breakfast count', time:'8:15 AM',   group:'Today'     },
  { icon:'✅', type:'task_completed',        title:'Maria Torres completed a compliance task',   time:'7:55 AM',   group:'Today'     },
  { icon:'📄', type:'document_uploaded',     title:'Happy Hearts uploaded Insurance Certificate',time:'Yesterday', group:'Yesterday' },
  { icon:'🔍', type:'inspection_logged',     title:'James Porter logged a monitoring visit',     time:'Yesterday', group:'Yesterday' },
  { icon:'✅', type:'application_approved',  title:'Lincoln Kitchen application approved',       time:'Jul 19',    group:'Jul 19'    },
  { icon:'⚠️', type:'document_expiring',     title:'Sunshine Daycare license expires in 25 days',time:'Jul 18',   group:'Jul 18'    },
];
const ACTIVITY_TYPE_COLOR = {
  application_submitted: 'bg-blue-50 text-blue-600',
  meal_counts_submitted: 'bg-green-50 text-green-600',
  task_completed:        'bg-brand-50 text-brand-600',
  document_uploaded:     'bg-teal-50 text-teal-600',
  inspection_logged:     'bg-orange-50 text-orange-600',
  application_approved:  'bg-green-50 text-green-600',
  document_expiring:     'bg-yellow-50 text-yellow-600',
};

function ActivityPage({ activityData }) {
  const items = activityData || SPONSOR_ACTIVITY;
  const groups = [...new Set(items.map(i => i.group))];
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
          <p className="text-gray-500 mt-1">Everything that happened across your program</p>
        </div>
      </div>
      <div className="space-y-6 mb-6">
        {groups.map(group => (
          <div key={group}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{group}</p>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-50">
              {items.filter(i => i.group === group).map((item, idx) => (
                <div key={idx} className="px-5 py-3.5 flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${ACTIVITY_TYPE_COLOR[item.type] ?? 'bg-gray-50 text-gray-500'}`}>
                    {item.icon}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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

// ─── Renewals ────────────────────────────────────────────────────────────────
const DEMO_RENEWALS = [
  {
    id: '1', title: 'Annual Renewal 2026', year: 2026, due_date: '2026-08-31',
    status: 'active', total_sites: 5, total_items: 40,
    complete_items: 22, waived_items: 2, sites_complete: 1,
  },
  {
    id: '2', title: 'Annual Renewal 2025', year: 2025, due_date: '2025-08-31',
    status: 'completed', total_sites: 5, total_items: 40,
    complete_items: 40, waived_items: 0, sites_complete: 5,
  },
];

const DEMO_SITES_RENEWAL = [
  { site_id:'s1', site_name:'Little Learners',   total:8, complete:8, waived:0, pending:0, items:[
    { id:'i1', item_label:'Site License / Permit',            status:'complete' },
    { id:'i2', item_label:'Insurance Certificate',            status:'complete' },
    { id:'i3', item_label:'Health Inspection Report',         status:'complete' },
    { id:'i4', item_label:'Enrollment Packet',                status:'complete' },
    { id:'i5', item_label:'Income Eligibility Certifications',status:'complete' },
    { id:'i6', item_label:'Child Roster Review',              status:'complete' },
    { id:'i7', item_label:'Site Profile Confirmation',        status:'complete' },
    { id:'i8', item_label:'Sponsor Agreement',                status:'complete' },
  ]},
  { site_id:'s2', site_name:'Sunshine Academy',  total:8, complete:5, waived:0, pending:3, items:[
    { id:'i9',  item_label:'Site License / Permit',            status:'complete' },
    { id:'i10', item_label:'Insurance Certificate',            status:'complete' },
    { id:'i11', item_label:'Health Inspection Report',         status:'pending'  },
    { id:'i12', item_label:'Enrollment Packet',                status:'pending'  },
    { id:'i13', item_label:'Income Eligibility Certifications',status:'complete' },
    { id:'i14', item_label:'Child Roster Review',              status:'complete' },
    { id:'i15', item_label:'Site Profile Confirmation',        status:'complete' },
    { id:'i16', item_label:'Sponsor Agreement',                status:'pending'  },
  ]},
  { site_id:'s3', site_name:'Happy Kids Center', total:8, complete:3, waived:1, pending:4, items:[
    { id:'i17', item_label:'Site License / Permit',            status:'complete' },
    { id:'i18', item_label:'Insurance Certificate',            status:'pending'  },
    { id:'i19', item_label:'Health Inspection Report',         status:'pending'  },
    { id:'i20', item_label:'Enrollment Packet',                status:'waived'   },
    { id:'i21', item_label:'Income Eligibility Certifications',status:'complete' },
    { id:'i22', item_label:'Child Roster Review',              status:'pending'  },
    { id:'i23', item_label:'Site Profile Confirmation',        status:'complete' },
    { id:'i24', item_label:'Sponsor Agreement',                status:'pending'  },
  ]},
];

// ── Form Generator demo ───────────────────────────────────────────────────────
const DEMO_TEMPLATES = [
  { id:'site_information_sheet', label:'Site Information Sheet',       description:'Basic site profile for CACFP enrollment and sponsor records.'           },
  { id:'sponsor_agreement',      label:'Sponsor Agreement',            description:'Annual agreement between sponsor and participating site/kitchen.'        },
  { id:'annual_renewal',         label:'Annual Renewal Confirmation',  description:'Confirms participation intent for program year renewal.'                 },
  { id:'income_eligibility_form',label:'Income Eligibility Statement', description:'Family income eligibility form with site/sponsor info pre-filled.'       },
];

const DEMO_FORM_DATA = {
  site_information_sheet: {
    label: 'Site Information Sheet',
    org: { name: 'Sunshine Daycare', type: 'site' },
    sections: [
      { title: 'Site / Kitchen Information', fields: [
        { label:'Organization Name', value:'Sunshine Daycare'             },
        { label:'Program Type',      value:'Child Care Site'              },
        { label:'Street Address',    value:'842 Oak Ave'                  },
        { label:'City',              value:'Des Moines'                   },
        { label:'State',             value:'IA'                           },
        { label:'ZIP Code',          value:'50309'                        },
        { label:'Phone',             value:'(515) 555-0112'               },
        { label:'Email',             value:'admin@sunshinedaycare.org'    },
        { label:'Licensed Capacity', value:'48'                           },
        { label:'License Number',    value:''                             },
      ]},
      { title: 'Primary Contact', fields: [
        { label:'Contact Name',  value:'Maria Gonzalez'             },
        { label:'Contact Phone', value:'(515) 555-0112'             },
        { label:'Contact Email', value:'mgonzalez@sunshinedaycare.org' },
      ]},
      { title: 'Sponsoring Organization', fields: [
        { label:'Sponsor Name',    value:'Iowa CACFP Sponsor Group'   },
        { label:'Sponsor Address', value:'200 Grand Ave, Des Moines, IA 50309' },
        { label:'Sponsor Phone',   value:'(515) 555-0100'             },
        { label:'Sponsor Email',   value:'admin@iacsfp.org'           },
        { label:'Sponsor Number',  value:'A4F2B1E3'                   },
      ]},
    ],
    signature_line: true,
    signature_label: 'Authorized Site Representative',
    checklist: null,
    note: null,
  },
  sponsor_agreement: {
    label: 'Sponsor Agreement',
    org: { name: 'Lincoln Kitchen', type: 'kitchen' },
    sections: [
      { title: 'Sponsoring Organization', fields: [
        { label:'Sponsor Organization Name', value:'Iowa CACFP Sponsor Group' },
        { label:'Address',                   value:'200 Grand Ave'            },
        { label:'City',                      value:'Des Moines'               },
        { label:'State',                     value:'IA'                       },
        { label:'ZIP Code',                  value:'50309'                    },
        { label:'Phone',                     value:'(515) 555-0100'           },
        { label:'Email',                     value:'admin@iacsfp.org'         },
        { label:'Sponsor Number',            value:'A4F2B1E3'                 },
      ]},
      { title: 'Participating Organization', fields: [
        { label:'Site / Kitchen Name', value:'Lincoln Kitchen'               },
        { label:'Program Type',        value:'Child Nutrition Kitchen'       },
        { label:'Address',             value:'1100 State St, Iowa City, IA'  },
        { label:'Phone',               value:'(319) 555-0222'                },
        { label:'Email',               value:'contact@lincolnkitchen.org'    },
        { label:'Contact Person',      value:'James Okafor'                  },
      ]},
      { title: 'Agreement Details', fields: [
        { label:'Program Year',  value:'2026'                                 },
        { label:'Effective Date',value:'July 24, 2026'                       },
      ]},
    ],
    signature_line: true,
    signature_label: 'Site/Kitchen Authorized Representative',
    signature_line_2: true,
    signature_label_2: 'Sponsor Authorized Representative',
    checklist: null,
    note: null,
  },
  annual_renewal: {
    label: 'Annual Renewal Confirmation',
    org: { name: 'Sunshine Daycare', type: 'site' },
    sections: [
      { title: 'Site / Kitchen Information', fields: [
        { label:'Organization Name', value:'Sunshine Daycare'             },
        { label:'Program Type',      value:'Child Care Site'              },
        { label:'Address',           value:'842 Oak Ave, Des Moines, IA 50309' },
        { label:'Phone',             value:'(515) 555-0112'               },
        { label:'Email',             value:'admin@sunshinedaycare.org'    },
        { label:'Licensed Capacity', value:'48'                           },
        { label:'License Number',    value:''                             },
      ]},
      { title: 'Contact Information', fields: [
        { label:'Primary Contact',  value:'Maria Gonzalez'                },
        { label:'Contact Phone',    value:'(515) 555-0112'                },
        { label:'Contact Email',    value:'mgonzalez@sunshinedaycare.org' },
      ]},
      { title: 'Renewal Period', fields: [
        { label:'Renewal Year', value:'2026'                              },
        { label:'Submitted',    value:'July 2026'                         },
        { label:'Sponsor',      value:'Iowa CACFP Sponsor Group'          },
      ]},
    ],
    signature_line: true,
    signature_label: 'Authorized Representative',
    checklist: [
      'No changes to licensed capacity or age groups',
      'Contact information above is current and correct',
      'Site continues to meet all CACFP eligibility requirements',
      'Staff responsible for meal counts have completed required training',
    ],
    note: null,
  },
  income_eligibility_form: {
    label: 'Income Eligibility Statement',
    org: { name: 'Sunshine Daycare', type: 'site' },
    sections: [
      { title: 'Site Information', fields: [
        { label:'Site Name',     value:'Sunshine Daycare'              },
        { label:'Site Address',  value:'842 Oak Ave, Des Moines, IA'   },
        { label:'Site Phone',    value:'(515) 555-0112'                },
        { label:'Sponsor Name',  value:'Iowa CACFP Sponsor Group'      },
        { label:'Sponsor Number',value:'A4F2B1E3'                      },
        { label:'Program Year',  value:'2026'                          },
      ]},
    ],
    signature_line: false,
    checklist: null,
    note: 'Family/guardian information and income data must be completed by the household.',
  },
};

const DEMO_ORGS = [
  { id:'o1', name:'Sunshine Daycare',    type:'site'    },
  { id:'o2', name:'Happy Hearts Center', type:'site'    },
  { id:'o3', name:'Lincoln Kitchen',     type:'kitchen' },
];

function FormGeneratorPage() {
  const [selectedOrg, setSelectedOrg] = useState('o1');
  const [selectedTpl, setSelectedTpl] = useState('site_information_sheet');
  const [showDownload, setShowDownload] = useState(false);

  const formData = DEMO_FORM_DATA[selectedTpl];

  const handleDownload = () => {
    setShowDownload(true);
    setTimeout(() => setShowDownload(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Form Generator</h1>
        <p className="text-sm text-gray-500 mt-1">Select an organization and form type — CACFPLink pre-fills every field it already knows.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — selectors */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">1. Select Organization</p>
            </div>
            <div className="divide-y divide-gray-50">
              {DEMO_ORGS.map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrg(o.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-2.5 transition-colors ${selectedOrg === o.id ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
                >
                  <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${selectedOrg === o.id ? 'text-brand-600' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${selectedOrg === o.id ? 'font-bold text-brand-700' : 'text-gray-700'}`}>{o.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{o.type}</p>
                  </div>
                  {selectedOrg === o.id && <CheckCircle className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">2. Select Form Type</p>
            <div className="space-y-2">
              {DEMO_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTpl(t.id)}
                  className={`w-full text-left border rounded-2xl px-4 py-4 transition-all hover:shadow-sm ${selectedTpl === t.id ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-gray-200 bg-white hover:border-brand-200'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedTpl === t.id ? 'bg-brand-600' : 'bg-gray-100'}`}>
                      <FileText className={`w-4 h-4 ${selectedTpl === t.id ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${selectedTpl === t.id ? 'text-brand-900' : 'text-gray-900'}`}>{t.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — preview */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{formData.label}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Pre-filled for: <span className="font-semibold text-gray-700">{formData.org.name}</span> · Generated Jul 24, 2026</p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              {showDownload ? 'Downloaded ✓' : 'Download PDF'}
            </button>
          </div>

          {formData.note && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <FileText className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{formData.note}</p>
            </div>
          )}

          {formData.sections.map((section, si) => (
            <div key={si} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-brand-600 px-4 py-2.5">
                <p className="text-xs font-bold text-white uppercase tracking-wider">{section.title}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {section.fields.map((field, fi) => (
                  <div key={fi} className="px-4 py-3 flex items-baseline gap-4">
                    <p className="text-xs font-semibold text-gray-400 w-36 flex-shrink-0">{field.label}</p>
                    <p className={`text-sm flex-1 ${field.value ? 'text-gray-900 font-medium' : 'text-gray-300 italic'}`}>
                      {field.value || 'Not on file'}
                    </p>
                    {!field.value && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">Missing</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {formData.checklist?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-brand-600 px-4 py-2.5">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Renewal Confirmation</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                {formData.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.signature_line && (
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Signatures</p>
              <div className={`grid gap-6 ${formData.signature_line_2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {[formData.signature_label, formData.signature_line_2 ? formData.signature_label_2 : null].filter(Boolean).map((label, i) => (
                  <div key={i}>
                    <div className="border-b border-gray-300 pb-1 mb-1" />
                    <p className="text-xs text-gray-500">{label}</p>
                    <div className="mt-2 text-xs text-gray-400">Print Name: _________________ &nbsp; Title: _________________</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DEMO_TRAINING_CERTS = [
  { id:'t1', staff_name:'Maria Gonzalez', org_name:'Lincoln Kitchen',   cert_label:'Food Safety Manager Certification', cert_date:'2024-12-15', expiry_date:'2026-12-15', status:'valid'         },
  { id:'t2', staff_name:'James Okafor',   org_name:'Lincoln Kitchen',   cert_label:'Food Handler Certificate',          cert_date:'2025-08-01', expiry_date:'2026-08-10', status:'expiring_soon'  },
  { id:'t3', staff_name:'Sarah Chen',     org_name:'Metro Meals LLC',   cert_label:'CACFP Program Training',            cert_date:'2023-06-01', expiry_date:'2025-06-01', status:'expired'        },
  { id:'t4', staff_name:'Luis Mendoza',   org_name:'Metro Meals LLC',   cert_label:'CPR Certification',                 cert_date:'2025-03-20', expiry_date:'2027-03-20', status:'valid'          },
  { id:'t5', staff_name:'Aisha Williams', org_name:'Sunshine Daycare',  cert_label:'First Aid Certification',           cert_date:'2025-01-10', expiry_date:'2027-01-10', status:'valid'          },
];

const TRAINING_STATUS_META = {
  valid:         { label:'Valid',         color:'text-green-600', bg:'bg-green-50',  border:'border-green-200' },
  expiring_soon: { label:'Expiring Soon', color:'text-amber-600', bg:'bg-amber-50',  border:'border-amber-200' },
  expired:       { label:'Expired',       color:'text-red-600',   bg:'bg-red-50',    border:'border-red-200'   },
};

function SponsorTrainingPage() {
  const [filter, setFilter] = useState('all');
  const visible = filter === 'all' ? DEMO_TRAINING_CERTS : DEMO_TRAINING_CERTS.filter(c => c.status === filter);
  const counts = {
    all:          DEMO_TRAINING_CERTS.length,
    valid:        DEMO_TRAINING_CERTS.filter(c => c.status === 'valid').length,
    expiring_soon:DEMO_TRAINING_CERTS.filter(c => c.status === 'expiring_soon').length,
    expired:      DEMO_TRAINING_CERTS.filter(c => c.status === 'expired').length,
  };
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Training &amp; Certifications</h1>
          <p className="text-sm text-gray-500 mt-1">Track food handler certs, CACFP training, and expiry dates across all your sites and kitchens.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl">
          <Plus className="w-4 h-4" /> Add Certification
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { key:'all',          label:'Total',         value: counts.all,          color:'text-gray-900'  },
          { key:'valid',        label:'Valid',          value: counts.valid,         color:'text-green-600' },
          { key:'expiring_soon',label:'Expiring Soon', value: counts.expiring_soon, color:'text-amber-600' },
          { key:'expired',      label:'Expired',       value: counts.expired,       color:'text-red-600'   },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
            className={`bg-white border rounded-2xl px-4 py-3 text-left transition-all hover:shadow-sm ${filter === s.key ? 'border-brand-400 shadow-sm' : 'border-gray-200'}`}
          >
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {visible.map(c => {
          const m = TRAINING_STATUS_META[c.status];
          return (
            <div key={c.id} className={`bg-white border ${m.border} rounded-2xl px-5 py-4 flex items-center gap-4`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${m.bg}`}>
                <GraduationCap className={`w-4 h-4 ${m.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{c.staff_name}</p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{c.org_name}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{c.cert_label}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.bg} ${m.color}`}>{m.label}</span>
                <p className="text-xs text-gray-400 mt-1">
                  Expires {new Date(c.expiry_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', timeZone:'UTC' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex gap-3">
        <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">CACFPLink automatically emails reminders at 30, 14, and 7 days before a cert expires — keeping your program audit-ready at all times.</p>
      </div>
    </div>
  );
}

function RenewalsPage() {
  const [tab, setTab]         = useState('active');
  const [openSite, setOpenSite] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [localItems, setLocalItems] = useState(
    DEMO_SITES_RENEWAL.map(s => ({ ...s, items: s.items.map(i => ({ ...i })) }))
  );

  const toggleItem = (siteIdx, itemId) => {
    setLocalItems(prev => prev.map((s, si) => si !== siteIdx ? s : {
      ...s,
      items: s.items.map(i => i.id === itemId
        ? { ...i, status: i.status === 'pending' ? 'complete' : 'pending' }
        : i
      ),
    }));
  };

  const visible = DEMO_RENEWALS.filter(r => tab === 'all' ? true : r.status === tab);

  return (
    <>
      {/* Wizard modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Start New Renewal</h2>
                <p className="text-xs text-gray-400 mt-0.5">Step {wizardStep} of 3</p>
              </div>
              <button onClick={() => { setShowWizard(false); setWizardStep(1); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex px-6 pt-4 gap-2">
              {[1,2,3].map(s => (
                <div key={s} className={`h-1 flex-1 rounded-full ${s <= wizardStep ? 'bg-brand-600' : 'bg-gray-100'}`} />
              ))}
            </div>
            {wizardStep === 1 && (
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Renewal Title</label>
                  <input type="text" defaultValue="Annual Renewal 2027" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Due Date</label>
                  <input type="date" defaultValue="2027-08-31" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
                </div>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-600">Select Sites (5)</label>
                  <span className="text-xs text-brand-600 font-semibold cursor-pointer">Select all</span>
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {['Little Learners','Sunshine Academy','Happy Kids Center','Riverside Youth','Oak Park Center'].map(s => (
                    <label key={s} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-indigo-600 w-4 h-4" />
                      <span className="text-sm text-gray-800">{s}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">5 of 5 selected</p>
              </div>
            )}
            {wizardStep === 3 && (
              <div className="px-6 py-5">
                <p className="text-xs font-semibold text-gray-600 mb-3">Required Checklist Items</p>
                <div className="space-y-1">
                  {['Site License / Permit','Insurance Certificate','Health Inspection Report','Enrollment Packet','Income Eligibility Certifications','Child Roster Review','Site Profile Confirmation','Sponsor Agreement / Acknowledgment'].map(item => (
                    <label key={item} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-indigo-600 w-4 h-4" />
                      <span className="text-sm text-gray-800">{item}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">Each site will get a checklist with 8 items.</p>
              </div>
            )}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
              {wizardStep > 1
                ? <button onClick={() => setWizardStep(s => s-1)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-semibold">Back</button>
                : <div />
              }
              {wizardStep < 3
                ? <button onClick={() => setWizardStep(s => s+1)} className="px-5 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl">Next →</button>
                : <button onClick={() => { setShowWizard(false); setWizardStep(1); }} className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl">Create Renewal for 5 Sites</button>
              }
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renewal Wizard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage annual CACFP paperwork renewals for all sites.</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Start Renewal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
          <p className="text-2xl font-black text-blue-600">1</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Active</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
          <p className="text-2xl font-black text-green-600">1</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Completed</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
          <p className="text-2xl font-black text-gray-700">5</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Total Sites</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {[['active','Active'],['completed','Completed'],['all','All']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Renewal cards */}
      <div className="space-y-4 mb-6">
        {visible.map(r => {
          const done  = r.complete_items + r.waived_items;
          const p     = Math.round((done / r.total_items) * 100);
          const isActive = r.status === 'active';
          return (
            <div key={r.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${isActive ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-green-500'}`} />
                        {isActive ? 'Active' : 'Completed'}
                      </span>
                      <span className="text-xs text-gray-400">{r.year}</span>
                    </div>
                    <h3 className="font-bold text-gray-900">{r.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Due Aug 31 · {r.total_sites} sites</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-black text-gray-900">{p}%</p>
                    <p className="text-xs text-gray-400">{done}/{r.total_items} items</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p === 100 ? 'bg-green-500' : 'bg-brand-500'}`} style={{ width: `${p}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{r.sites_complete} of {r.total_sites} sites fully complete</p>
                </div>
                {isActive && (
                  <button
                    onClick={() => setOpenSite(openSite === r.id ? null : r.id)}
                    className="mt-2 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    {openSite === r.id ? 'Hide per-site status ↑' : 'View per-site status →'}
                  </button>
                )}
              </div>

              {/* Per-site breakdown */}
              {openSite === r.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
                  {localItems.map((site, si) => {
                    const sComplete = site.items.filter(i => i.status === 'complete').length;
                    const sWaived   = site.items.filter(i => i.status === 'waived').length;
                    const sPct      = Math.round(((sComplete + sWaived) / site.total) * 100);
                    return (
                      <div key={site.site_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{site.site_name}</p>
                            <p className="text-xs text-gray-400">{sComplete} done · {site.items.filter(i=>i.status==='pending').length} pending</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sPct === 100 ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'}`}>{sPct}%</span>
                        </div>
                        <div className="divide-y divide-gray-50 border-t border-gray-100">
                          {site.items.map((item, ii) => (
                            <div key={item.id} className="px-4 py-2.5 flex items-center gap-2.5">
                              {item.status === 'complete'
                                ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                : item.status === 'waived'
                                  ? <span className="w-3.5 text-gray-400 text-xs font-bold">—</span>
                                  : <div className="w-3.5 h-3.5 rounded border-2 border-gray-300 flex-shrink-0" />
                              }
                              <span className={`text-xs flex-1 ${item.status === 'complete' ? 'text-gray-400 line-through' : item.status === 'waived' ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                                {item.item_label}
                              </span>
                              {item.status === 'pending' && (
                                <button onClick={() => toggleItem(si, item.id)} className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 font-semibold rounded-md">Complete</button>
                              )}
                              {item.status === 'complete' && (
                                <button onClick={() => toggleItem(si, item.id)} className="text-[10px] text-gray-400 hover:text-gray-600">Undo</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
  else if (pathname.startsWith('/demo/sponsor/children'))     Page = () => <ChildRosterPage />;
  else if (pathname.startsWith('/demo/sponsor/tasks'))        Page = () => <TasksPage />;
  else if (pathname.startsWith('/demo/sponsor/inspections'))  Page = () => <InspectionsPage />;
  else if (pathname.startsWith('/demo/sponsor/menus'))        Page = () => <MenusPage />;
  else if (pathname.startsWith('/demo/sponsor/activity'))       Page = () => <ActivityPage />;
  else if (pathname.startsWith('/demo/sponsor/delivery-plans')) Page = () => <DeliveriesPage onOpenOrder={() => setShowOrder(true)} />;
  else if (pathname.startsWith('/demo/sponsor/deliveries'))     Page = () => <DeliveriesPage onOpenOrder={() => setShowOrder(true)} />;
  else if (pathname.startsWith('/demo/sponsor/coordinators'))   Page = () => <CoordinatorsPage />;
  else if (pathname.startsWith('/demo/sponsor/messages'))       Page = () => <MessagesPage onOpenBroadcast={() => setShowBroadcast(true)} />;
  else if (pathname.startsWith('/demo/sponsor/meal-counts'))    Page = () => <MealCountsPage />;
  else if (pathname.startsWith('/demo/sponsor/claims'))         Page = () => <ClaimsPage />;
  else if (pathname.startsWith('/demo/sponsor/renewals'))       Page = () => <RenewalsPage />;
  else if (pathname.startsWith('/demo/sponsor/training'))       Page = () => <SponsorTrainingPage />;
  else if (pathname.startsWith('/demo/sponsor/forms'))          Page = () => <FormGeneratorPage />;
  else if (pathname.startsWith('/demo/sponsor/attendance'))     Page = () => <SponsorAttendancePage />;
  else if (pathname.startsWith('/demo/sponsor/menu-cycles'))    Page = () => <MenuCyclesPage />;
  else if (pathname.startsWith('/demo/sponsor/state-rules'))    Page = () => <StateRuleBookDemoPage />;
  else if (pathname.startsWith('/demo/sponsor/documents'))      Page = () => <DocumentsPage />;
  else if (pathname.startsWith('/demo/sponsor/settings'))       Page = () => <SettingsPage />;
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
