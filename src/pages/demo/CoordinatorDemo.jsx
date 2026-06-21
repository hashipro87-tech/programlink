import { Link } from 'react-router-dom';
import { CheckCircle, Building2, AlertTriangle, ClipboardList, MessageSquare, Settings } from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',     path: '/demo/coordinator',              icon: CheckCircle },
  { label: 'Sites',        path: '/demo/coordinator/sites',        icon: Building2 },
  { label: 'Approvals',    path: '/demo/coordinator/approvals',    icon: ClipboardList },
  { label: 'Compliance',   path: '/demo/coordinator/compliance',   icon: AlertTriangle },
  { label: 'Messages',     path: '/demo/coordinator/messages',     icon: MessageSquare },
  { label: 'Settings',     path: '/demo/coordinator/settings',     icon: Settings },
];

const SITES = [
  { name: 'Happy Hearts Daycare',  status: 'compliant',  meals: 284, lastSubmit: 'Today' },
  { name: 'Lincoln Learning Ctr',  status: 'compliant',  meals: 311, lastSubmit: 'Today' },
  { name: 'Sunshine Early Ed',     status: 'alert',      meals: 198, lastSubmit: '3 days ago' },
  { name: 'Riverside Kids Club',   status: 'compliant',  meals: 257, lastSubmit: 'Yesterday' },
  { name: 'Westside Head Start',   status: 'pending',    meals: 142, lastSubmit: '5 days ago' },
];

const APPROVALS = [
  { org: 'Eastside Daycare',   type: 'New site application',       submitted: '2 days ago' },
  { org: 'Green Leaf Kitchen', type: 'Kitchen renewal',            submitted: '4 days ago' },
  { org: 'North Park Center',  type: 'Document compliance update', submitted: '5 days ago' },
];

const ALERTS = [
  { site: 'Sunshine Early Ed',  issue: 'Meal counts not submitted for 3 days', level: 'high' },
  { site: 'Westside Head Start',issue: 'CACFP renewal document expiring in 5 days', level: 'medium' },
  { site: 'Lincoln Learning',   issue: 'Food handler cert missing for 1 staff', level: 'low' },
];

const STATUS_STYLES = {
  compliant: { dot: 'bg-green-400', badge: 'bg-green-50 text-green-700 border-green-100', label: 'Compliant' },
  alert:     { dot: 'bg-red-400',   badge: 'bg-red-50 text-red-700 border-red-100',     label: 'Alert' },
  pending:   { dot: 'bg-yellow-400',badge: 'bg-yellow-50 text-yellow-700 border-yellow-100', label: 'Pending' },
};

const LEVEL_STYLES = {
  high:   'border-l-4 border-red-400 bg-red-50',
  medium: 'border-l-4 border-yellow-400 bg-yellow-50',
  low:    'border-l-4 border-gray-300 bg-gray-50',
};

export default function CoordinatorDemo() {
  return (
    <div className="flex h-screen bg-gray-50">
      <DemoBanner role="Coordinator" />
      <DemoSidebar navItems={NAV} role="coordinator" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-14 sm:p-8 max-w-4xl mx-auto">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1>
            <p className="text-gray-500 mt-1">Demo Program · 5 sites assigned</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Sites Assigned',   value: '5',   color: 'text-blue-600' },
              { label: 'Compliant Sites',  value: '4',   color: 'text-green-600' },
              { label: 'Open Alerts',      value: '3',   color: 'text-red-600' },
              { label: 'Pending Approvals',value: '3',   color: 'text-yellow-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Alerts */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Active Alerts</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {ALERTS.map((alert) => (
                <div key={alert.site} className={`mx-4 my-2 rounded-xl px-4 py-3 ${LEVEL_STYLES[alert.level]}`}>
                  <p className="text-sm font-semibold text-gray-900">{alert.site}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{alert.issue}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-3">
              <Link to="/register" className="text-xs text-brand-600 font-semibold hover:underline">
                Sign up to manage alerts →
              </Link>
            </div>
          </div>

          {/* Organization Oversight */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Site Overview</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {SITES.map((site) => (
                <div key={site.name} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_STYLES[site.status].dot}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{site.name}</p>
                      <p className="text-xs text-gray-400">Last submitted: {site.lastSubmit} · {site.meals} meals this month</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[site.status].badge}`}>
                    {STATUS_STYLES[site.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Workflows */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Pending Approvals</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {APPROVALS.map((item) => (
                <div key={item.org} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.org}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.type} · {item.submitted}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/register" className="text-xs px-3 py-1.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                      Approve
                    </Link>
                    <Link to="/register" className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-600 rounded-2xl p-6 text-center text-white">
            <h3 className="text-lg font-bold mb-1">Coordinating a real program?</h3>
            <p className="text-brand-200 text-sm mb-4">Your sponsor will set up your coordinator account — ask them to invite you.</p>
            <Link to="/register" className="inline-block bg-white text-brand-700 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              Learn More →
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
