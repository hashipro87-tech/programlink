// CoordinatorDemo.jsx — Daily Work Management Center preview
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  CheckCircle, Building2, AlertTriangle, ClipboardList, MessageSquare,
  Settings, FileText, UtensilsCrossed, Bell, ChevronRight, X,
  AlertCircle, Send, CheckSquare, TrendingUp,
} from 'lucide-react';
import DemoBanner from './DemoBanner';
import DemoSidebar from './DemoSidebar';

const NAV = [
  { label: 'Overview',      path: '/demo/coordinator',               icon: CheckCircle    },
  { label: 'Applications',  path: '/demo/coordinator/applications',  icon: ClipboardList  },
  { label: 'My Sites',      path: '/demo/coordinator/sites',         icon: Building2      },
  { label: 'Meal Counts',   path: '/demo/coordinator/meal-counts',   icon: UtensilsCrossed },
  { label: 'Documents',     path: '/demo/coordinator/documents',     icon: FileText       },
  { label: 'Messages',      path: '/demo/coordinator/messages',      icon: MessageSquare  },
  { label: 'Settings',      path: '/demo/coordinator/settings',      icon: Settings       },
];

const SITES = [
  { id: 1, name: 'Little Learners',    tier: 'compliant', score: 100, missing: [],                    expiring: [],                     unverified: 0 },
  { id: 2, name: 'Happy Kids Center',  tier: 'missing',   score: 40,  missing: ['Enrollment','Insurance'], expiring: [],                  unverified: 1 },
  { id: 3, name: 'Bright Futures',     tier: 'missing',   score: 55,  missing: ['CACFP Agreement'],   expiring: [],                     unverified: 2 },
  { id: 4, name: 'Sunshine Academy',   tier: 'expiring',  score: 80,  missing: [],                    expiring: ['License (5 days)'],   unverified: 0 },
  { id: 5, name: 'Lincoln Learning',   tier: 'compliant', score: 95,  missing: [],                    expiring: [],                     unverified: 0 },
];

const TIER_META = {
  compliant: { label: 'Compliant',    dot: 'bg-green-400',  text: 'text-green-700',  bg: 'bg-green-50'  },
  missing:   { label: 'Missing Docs', dot: 'bg-red-400',    text: 'text-red-600',    bg: 'bg-red-50'    },
  expiring:  { label: 'Expiring Soon',dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  pending:   { label: 'Pending',      dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50'   },
};

const ATTENTION_ITEMS = [
  { priority: 'red',    icon: '🔴', title: 'Missing: Enrollment, Insurance', org: 'Happy Kids Center'  },
  { priority: 'red',    icon: '🔴', title: 'Missing: CACFP Agreement',       org: 'Bright Futures'     },
  { priority: 'yellow', icon: '🟡', title: 'Food Permit expires in 4 days',  org: 'Sunshine Academy'   },
  { priority: 'yellow', icon: '🟡', title: 'Health Inspection expires tomorrow', org: 'Lincoln Learning' },
];

const MESSAGES = [
  { sender: 'Sponsor',       text: "Can you review Happy Kids today?",           time: '9:45 AM'   },
  { sender: 'Downtown Kitchen', text: "Delivery was short 12 lunches yesterday.", time: '8:30 AM'   },
  { sender: 'Happy Kids',    text: "Need help uploading our food permit.",        time: 'Yesterday' },
  { sender: 'Little Learners', text: "July meal counts are all in!",             time: 'Yesterday' },
];

const ACTIVITY = [
  { icon: '📄', text: 'Happy Kids uploaded License',                  time: '9:15 AM'   },
  { icon: '🍽️', text: 'Little Learners submitted Breakfast Count',   time: '8:42 AM'   },
  { icon: '📋', text: 'ABC Childcare submitted application',          time: 'Yesterday' },
  { icon: '⚠️', text: 'Sunshine Academy permit expires in 5 days',   time: 'Jul 9'     },
  { icon: '✅', text: 'Lincoln Learning documents approved',          time: 'Jul 8'     },
];

function SiteDrawer({ site, onClose }) {
  const meta = TIER_META[site.tier] ?? TIER_META.pending;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Site Overview</p>
            <h2 className="text-lg font-bold text-gray-900">{site.name}</h2>
            <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 px-6 py-5 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Compliance</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${site.score}%` }} />
              </div>
              <span className="text-sm font-bold text-gray-900 w-10 text-right">{site.score}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Documents</p>
            <div className="space-y-2">
              {site.missing.length === 0 && site.expiring.length === 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-gray-700">All documents valid</span>
                </div>
              )}
              {site.expiring.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-gray-700">{d} — expiring soon</span>
                </div>
              ))}
              {site.missing.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-gray-700">{d} — missing</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Meal Counts</p>
            {site.unverified > 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-gray-700">{site.unverified} unverified this month</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-gray-700">All counts verified</span>
              </div>
            )}
          </div>
          <div className="space-y-2 pt-1">
            {['Send Message', 'Request Document', 'Verify Meal Counts'].map((label, i) => (
              <Link
                key={i}
                to="/register"
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const [selectedSite, setSelectedSite] = useState(null);
  const [appState, setAppState]         = useState({});

  const handleAction = (id, status) => {
    setAppState((s) => ({ ...s, [id]: status }));
  };

  return (
    <>
      {/* Work Today Hero */}
      <div className="card mb-6">
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-0.5">Monday, July 14, 2026</p>
          <h1 className="text-2xl font-bold text-gray-900">Good morning, Sarah</h1>
          <p className="text-sm text-gray-500 mt-1">You have 3 items that need attention. Complete these to keep your region compliant.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
          {[
            { count: 3, label: 'Missing Meal Counts',  color: 'text-red-600',    emoji: '🔴', urgent: true  },
            { count: 2, label: 'Docs Expire This Week', color: 'text-yellow-600', emoji: '🟡', urgent: true  },
            { count: 1, label: 'Applications Waiting', color: 'text-brand-600',  emoji: '🟢', urgent: false },
            { count: 4, label: 'Unread Messages',      color: 'text-blue-600',   emoji: '🔵', urgent: true  },
          ].map((t) => (
            <div key={t.label} className="px-5 py-5">
              <div className="flex items-start gap-2 mb-1">
                <span className="text-sm leading-none mt-0.5">{t.emoji}</span>
                <p className={`text-3xl font-bold leading-none ${t.color}`}>{t.count}</p>
              </div>
              <p className="text-xs font-semibold text-gray-500 mt-2 leading-snug">{t.label}</p>
              {t.urgent && <p className={`text-[10px] font-bold mt-1 ${t.color}`}>↗ Needs attention</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">

          {/* Assigned Sites */}
          <div className="card mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">My Assigned Sites</h2>
              <span className="text-xs text-gray-400">Click any site for 360° view</span>
            </div>
            <div className="divide-y divide-gray-50">
              {SITES.map((site) => {
                const meta = TIER_META[site.tier] ?? TIER_META.pending;
                return (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                    <span className="flex-1 text-sm font-medium text-gray-900">{site.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {site.unverified > 0 && (
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          {site.unverified} unverified
                        </span>
                      )}
                      <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="card mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Needs Attention</h2>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">4 issues</span>
            </div>
            <div className="divide-y divide-gray-50">
              {ATTENTION_ITEMS.map((item, i) => (
                <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                  <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.org}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Inline Application */}
          <div className="card mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Pending Applications</h2>
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">1 waiting</span>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">ABC Childcare</p>
                  <p className="text-xs text-gray-400 mt-0.5">Site · Submitted today</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0">Pending</span>
              </div>
              {appState['abc'] === 'approved' ? (
                <p className="text-xs font-bold text-green-600">✓ Approved</p>
              ) : appState['abc'] === 'rejected' ? (
                <p className="text-xs font-bold text-red-500">✗ Rejected</p>
              ) : appState['abc'] === 'changes_requested' ? (
                <p className="text-xs font-bold text-yellow-600">↩ Changes Requested</p>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => handleAction('abc','approved')} className="flex-1 py-2 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors">Approve</button>
                  <button onClick={() => handleAction('abc','changes_requested')} className="flex-1 py-2 text-xs font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-colors">Request Changes</button>
                  <button onClick={() => handleAction('abc','rejected')} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">Reject</button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="card mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Messages</h2>
              <Link to="/register" className="text-xs text-brand-600 hover:underline font-semibold">Open inbox →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {MESSAGES.map((m, i) => (
                <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{m.sender}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{m.text}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">{m.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card mb-6">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <span className="text-base leading-none mt-0.5 flex-shrink-0">{a.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{a.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right sidebar */}
        <div>
          {/* Region Snapshot */}
          <div className="card mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <h2 className="font-semibold text-gray-900">My Region</h2>
            </div>
            {[
              { label: 'Total Sites',      value: '5',      color: 'text-gray-900'   },
              { label: 'Compliance Rate',  value: '60%',    color: 'text-yellow-600' },
              { label: 'Need Attention',   value: '2',      color: 'text-red-600'    },
              { label: 'Meals This Month', value: '12,438', color: 'text-brand-600'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-600">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="card mb-6">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="px-4 py-3 space-y-1">
              {[
                { label: 'Message All Sites',   icon: Send          },
                { label: 'Request Documents',   icon: FileText      },
                { label: 'Review Applications', icon: ClipboardList },
                { label: 'Verify Meal Counts',  icon: CheckSquare   },
                { label: 'View All Sites',      icon: Building2     },
              ].map(({ label, icon: Icon }) => (
                <Link
                  key={label}
                  to="/register"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors group"
                >
                  <div className="w-7 h-7 bg-gray-100 group-hover:bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-brand-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-brand-700">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-brand-600 rounded-2xl p-5 text-center text-white">
            <h3 className="text-base font-bold mb-1">Coordinating a real program?</h3>
            <p className="text-brand-200 text-xs mb-3">Your sponsor will invite you — ask them to add you as a coordinator.</p>
            <Link to="/register" className="inline-block bg-white text-brand-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Learn More →
            </Link>
          </div>
        </div>
      </div>

      {/* 360° Drawer */}
      {selectedSite && (
        <SiteDrawer site={selectedSite} onClose={() => setSelectedSite(null)} />
      )}
    </>
  );
}

export default function CoordinatorDemo() {
  const location = useLocation();
  const section  = location.pathname.split('/')[3];

  const renderSection = () => {
    switch (section) {
      case 'applications':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Applications</h1>
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Pending Applications</h2>
              </div>
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                <Link to="/register" className="text-brand-600 hover:underline font-semibold">Sign up</Link> to review and approve real applications.
              </div>
            </div>
          </div>
        );
      case 'sites':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Sites</h1>
            <div className="card divide-y divide-gray-100">
              {SITES.map((s) => {
                const meta = TIER_META[s.tier] ?? TIER_META.pending;
                return (
                  <div key={s.id} className="px-5 py-4 flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                    <span className="flex-1 text-sm font-medium text-gray-900">{s.name}</span>
                    <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DemoBanner role="Coordinator" />
      <DemoSidebar navItems={NAV} role="coordinator" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:pt-8 sm:p-8 max-w-6xl mx-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
