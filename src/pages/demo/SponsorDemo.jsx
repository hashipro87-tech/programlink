import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ClipboardList, AlertTriangle, Building2, Users, UtensilsCrossed, FileText, Settings, Truck, ChefHat, Clock, Plus, X } from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',     path: '/demo/sponsor',              icon: CheckCircle },
  { label: 'Applications', path: '/demo/sponsor/applications', icon: ClipboardList },
  { label: 'Compliance',   path: '/demo/sponsor/compliance',   icon: AlertTriangle },
  { label: 'Sites',        path: '/demo/sponsor/sites',        icon: Building2 },
  { label: 'Kitchens',     path: '/demo/sponsor/kitchens',     icon: Building2 },
  { label: 'Meal Orders',  path: '/demo/sponsor/meal-orders',  icon: Truck },
  { label: 'Coordinators', path: '/demo/sponsor/coordinators', icon: Users },
  { label: 'Meal Counts',  path: '/demo/sponsor/meal-counts',  icon: UtensilsCrossed },
  { label: 'Documents',    path: '/demo/sponsor/documents',    icon: FileText },
  { label: 'Settings',     path: '/demo/sponsor/settings',     icon: Settings },
];

const RECENT_APPS = [
  { name: 'Sunshine Daycare',    type: 'site',     status: 'pending',  date: '2 days ago' },
  { name: 'Lincoln Kitchen',     type: 'kitchen',  status: 'approved', date: '4 days ago' },
  { name: 'Happy Hearts Center', type: 'site',     status: 'pending',  date: '5 days ago' },
  { name: 'Metro Meals LLC',     type: 'delivery', status: 'approved', date: '1 week ago' },
];

const STATUS_STYLES = {
  pending:  'bg-yellow-50 text-yellow-700 border border-yellow-100',
  approved: 'bg-green-50 text-green-700 border border-green-100',
  rejected: 'bg-red-50 text-red-700 border border-red-100',
};

const DEMO_ORDERS = [
  { kitchen: 'Lincoln Kitchen', site: 'Sunshine Daycare',    meal: 'Lunch',     count: 42, time: '10:30 AM', status: 'delivered' },
  { kitchen: 'Lincoln Kitchen', site: 'Happy Hearts Center', meal: 'Lunch',     count: 28, time: '11:00 AM', status: 'prepping'  },
  { kitchen: 'Metro Meals LLC', site: 'Bright Minds Academy',meal: 'Breakfast', count: 35, time: '7:45 AM',  status: 'delivered' },
];

const STATUS_PILL = {
  delivered: 'bg-green-50 text-green-700 border-green-200',
  prepping:  'bg-blue-50 text-blue-700 border-blue-200',
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function DemoOrderModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Meal Order</h2>
            <p className="text-xs text-gray-500 mt-0.5">Assign a kitchen to deliver meals to a site.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'Delivery Date', type: 'date', value: new Date().toISOString().split('T')[0], icon: null },
          ].map(() => null)}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Date</label>
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50" readOnly />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Kitchen</label>
            <select className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50">
              <option>Lincoln Kitchen</option>
              <option>Metro Meals LLC</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Deliver To (Site)</label>
            <select className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50">
              <option>Sunshine Daycare</option>
              <option>Happy Hearts Center</option>
              <option>Bright Minds Academy</option>
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
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
              Cancel
            </button>
            <Link to="/register"
              className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold text-center">
              Sign Up to Create →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SponsorDemo() {
  const [copied,    setCopied]    = useState(false);
  const [showOrder, setShowOrder] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText('DEMO-SP-4829');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DemoBanner role="Sponsor" />
      <DemoSidebar navItems={NAV} role="sponsor" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-14 sm:p-8 max-w-5xl mx-auto">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Program Overview</h1>
            <p className="text-gray-500 mt-1">Monitor all sites, kitchens, and compliance status across your program.</p>
          </div>

          {/* Action Center */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Action Center</h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <span className="text-sm text-yellow-800 font-medium">Review 2 pending applications</span>
                <Link to="/register" className="ml-auto text-xs font-semibold text-brand-600 hover:underline">Sign up to action →</Link>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-sm text-red-800 font-medium">3 documents expiring within 30 days</span>
                <Link to="/register" className="ml-auto text-xs font-semibold text-brand-600 hover:underline">Sign up to action →</Link>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-sm text-gray-600 font-medium">No unread messages</span>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Sites',       value: '24', color: 'text-blue-600',   bg: 'bg-blue-50',   icon: Building2 },
              { label: 'Active Kitchens',   value: '8',  color: 'text-green-600',  bg: 'bg-green-50',  icon: UtensilsCrossed },
              { label: 'Pending Approvals', value: '2',  color: 'text-yellow-600', bg: 'bg-yellow-50', icon: ClipboardList },
              { label: 'Compliance Alerts', value: '3',  color: 'text-red-600',    bg: 'bg-red-50',    icon: AlertTriangle },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Sponsor ID */}
          <div className="bg-white border border-brand-100 rounded-2xl p-5 mb-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your Sponsor ID</p>
            <p className="text-xs text-gray-400 mb-3">Share this with kitchens, sites, and delivery providers so they can join your program.</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg">DEMO-SP-4829</code>
              <button
                onClick={copy}
                className="px-3 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Applications</h2>
              <Link to="/register" className="text-sm text-brand-600 hover:underline">Sign up to manage</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {RECENT_APPS.map((app) => (
                <div key={app.name} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.name}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{app.type} · {app.date}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[app.status]}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Compliance Alerts</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                3 documents are expiring within 30 days. <Link to="/register" className="font-semibold underline">Sign up to review →</Link>
              </p>
            </div>
          </div>

          {/* Meal Orders */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-500" />
                <h2 className="font-semibold text-gray-900">Today's Meal Orders</h2>
              </div>
              <button
                onClick={() => setShowOrder(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700
                           text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create Order
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {DEMO_ORDERS.map((o, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center gap-3">
                  <ChefHat className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {o.kitchen} <span className="text-gray-400">→</span> {o.site}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {o.meal} · {o.count} meals · Pickup {o.time}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_PILL[o.status]}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-gray-50 text-center">
              <Link to="/register" className="text-xs font-semibold text-brand-600 hover:underline">
                Sign up to manage all orders →
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 bg-brand-600 rounded-2xl p-6 text-center text-white">
            <h3 className="text-lg font-bold mb-1">Ready to manage your real program?</h3>
            <p className="text-brand-200 text-sm mb-4">Create your sponsor account — it's free and takes 2 minutes.</p>
            <Link to="/register" className="inline-block bg-white text-brand-700 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              Get Started Free →
            </Link>
          </div>

        </div>
      </main>

      {showOrder && <DemoOrderModal onClose={() => setShowOrder(false)} />}
    </div>
  );
}
