import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ClipboardList, AlertTriangle, Building2, Users, UtensilsCrossed, FileText, Settings } from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',     path: '/demo/sponsor',             icon: CheckCircle },
  { label: 'Applications', path: '/demo/sponsor/applications', icon: ClipboardList },
  { label: 'Compliance',   path: '/demo/sponsor/compliance',   icon: AlertTriangle },
  { label: 'Sites',        path: '/demo/sponsor/sites',        icon: Building2 },
  { label: 'Kitchens',     path: '/demo/sponsor/kitchens',     icon: Building2 },
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

export default function SponsorDemo() {
  const [copied, setCopied] = useState(false);

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
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Compliance Alerts</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                3 documents are expiring within 30 days. <Link to="/register" className="font-semibold underline">Sign up to review →</Link>
              </p>
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
    </div>
  );
}
