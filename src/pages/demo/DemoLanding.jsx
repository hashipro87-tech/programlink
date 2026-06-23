// DemoLanding — role picker for the demo, no login required
import { Link } from 'react-router-dom';
import { Building2, UtensilsCrossed, Users, MapPin, ArrowRight } from 'lucide-react';
import { trackDemoRoleClick } from '../../utils/analytics';

const ROLES = [
  {
    path: '/demo/sponsor',
    icon: Building2,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    label: 'Sponsor / Program Admin',
    description: 'See the full program overview: sites, kitchens, compliance alerts, pending applications, and meal count summaries.',
    highlights: ['Program-wide dashboard', 'Compliance tracking', 'Application approvals', 'Sponsor ID management'],
  },
  {
    path: '/demo/kitchen',
    icon: UtensilsCrossed,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    label: 'Kitchen / Food Production',
    description: 'Submit daily meal counts, manage compliance documents, and communicate with your sponsor.',
    highlights: ['Daily meal count entry', 'Document uploads', 'Meal history', 'Sponsor messaging'],
  },
  {
    path: '/demo/site',
    icon: MapPin,
    color: 'bg-sky-50 text-sky-600 border-sky-100',
    label: 'Site / Daycare Center',
    description: 'Track meal deliveries, submit headcounts, and stay on top of your compliance documents.',
    highlights: ['Delivery tracking', 'Headcount submission', 'Document status', 'Compliance alerts'],
  },
  {
    path: '/demo/coordinator',
    icon: Users,
    color: 'bg-violet-50 text-violet-600 border-violet-100',
    label: 'Coordinator',
    description: 'Monitor the kitchens and sites you oversee, review meal counts, and flag compliance issues.',
    highlights: ['Site monitoring', 'Kitchen oversight', 'Meal count review', 'Compliance reports'],
  },
];

export default function DemoLanding() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 44 44" fill="none">
                <path d="M19 26H17a6 6 0 0 1 0-12h2" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M25 18h2a6 6 0 0 1 0 12h-2" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <line x1="18.5" y1="22" x2="25.5" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">CACFPLink</span>
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-brand-700">No account needed</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Explore CACFPLink as any role
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Click any role below to instantly explore that dashboard with sample data. No login, no credit card.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {ROLES.map(({ path, icon: Icon, color, label, description, highlights }) => (
            <Link
              key={path}
              to={path}
              onClick={() => trackDemoRoleClick(path.replace('/demo/', ''))}
              className="group bg-white border border-gray-200 hover:border-brand-300 hover:shadow-md rounded-2xl p-6 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1.5">{label}</h2>
              <p className="text-sm text-gray-500 mb-4">{description}</p>
              <ul className="space-y-1.5 mb-5">
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 group-hover:gap-2.5 transition-all">
                Try {label.split('/')[0].trim()} demo
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          Ready to use the real thing?{' '}
          <Link to="/register" className="text-brand-600 hover:underline font-medium">
            Create your free account →
          </Link>
        </p>
      </div>
    </div>
  );
}
