// DemoBanner — shown at the top of all demo pages
import { Link } from 'react-router-dom';

export default function DemoBanner({ role }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-900 text-xs font-semibold flex items-center justify-center gap-4 px-4 py-2 shadow-sm">
      <Link to="/demo" className="hover:underline whitespace-nowrap">← Back to Demo</Link>
      <span>👀 Demo mode — you're viewing the <strong className="capitalize">{role}</strong> dashboard with sample data.</span>
      <Link
        to="/register"
        className="bg-amber-900 text-white px-3 py-1 rounded-lg hover:bg-amber-800 transition-colors whitespace-nowrap"
      >
        Sign up free →
      </Link>
    </div>
  );
}
