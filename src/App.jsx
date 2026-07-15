import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Shield } from 'lucide-react';

import HomePage            from './pages/home/HomePage';
import Login               from './pages/auth/Login';
import Register            from './pages/auth/Register';
import CheckEmailPage      from './pages/auth/CheckEmailPage';
import VerifyEmailPage     from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage  from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage   from './pages/auth/ResetPasswordPage';
import AcceptInvitePage    from './pages/auth/AcceptInvitePage';

import SponsorDashboard     from './pages/sponsor/SponsorDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import KitchenDashboard     from './pages/kitchen/KitchenDashboard';
import SiteDashboard        from './pages/site/SiteDashboard';
import DeliveryDashboard    from './pages/delivery/DeliveryDashboard';
import AdminDashboard       from './pages/admin/AdminDashboard';

import DemoLanding      from './pages/demo/DemoLanding';
import SponsorDemo      from './pages/demo/SponsorDemo';
import KitchenDemo      from './pages/demo/KitchenDemo';
import SiteDemo         from './pages/demo/SiteDemo';
import CoordinatorDemo  from './pages/demo/CoordinatorDemo';

import AuditPage   from './pages/audit/AuditPage';
import AboutPage   from './pages/about/AboutPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import TermsPage   from './pages/legal/TermsPage';

const ROLE_DASHBOARD = {
  sponsor:     '/dashboard/sponsor',
  coordinator: '/dashboard/coordinator',
  kitchen:     '/dashboard/kitchen',
  site:        '/dashboard/site',
  delivery:    '/dashboard/delivery',
  admin:       '/dashboard/admin',
};

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role) && user.role !== 'admin') return <Navigate to={ROLE_DASHBOARD[user.role] ?? '/login'} replace />;
  return children;
}

function AdminBackButton() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (user?.role !== 'admin') return null;
  if (location.pathname.startsWith('/dashboard/admin')) return null;
  return (
    <button
      onClick={() => navigate('/dashboard/admin')}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-lg transition-colors"
    >
      <Shield className="w-4 h-4" />
      Back to Admin
    </button>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/"                  element={<HomePage />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/check-email"       element={<CheckEmailPage />} />
        <Route path="/verify-email"      element={<VerifyEmailPage />} />
        <Route path="/forgot-password"   element={<ForgotPasswordPage />} />
        <Route path="/reset-password"    element={<ResetPasswordPage />} />
        <Route path="/accept-invite"     element={<AcceptInvitePage />} />

        {/* Dashboards */}
        <Route path="/dashboard/sponsor/*"     element={<PrivateRoute roles={['sponsor']}><SponsorDashboard /></PrivateRoute>} />
        <Route path="/dashboard/coordinator/*" element={<PrivateRoute roles={['coordinator']}><CoordinatorDashboard /></PrivateRoute>} />
        <Route path="/dashboard/kitchen/*"     element={<PrivateRoute roles={['kitchen']}><KitchenDashboard /></PrivateRoute>} />
        <Route path="/dashboard/site/*"        element={<PrivateRoute roles={['site']}><SiteDashboard /></PrivateRoute>} />
        <Route path="/dashboard/delivery/*"    element={<PrivateRoute roles={['delivery']}><DeliveryDashboard /></PrivateRoute>} />
        <Route path="/dashboard/admin/*"       element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />

        {/* Demo — no login required */}
        <Route path="/demo"               element={<DemoLanding />} />
        <Route path="/demo/sponsor/*"     element={<SponsorDemo />} />
        <Route path="/demo/kitchen/*"     element={<KitchenDemo />} />
        <Route path="/demo/site/*"        element={<SiteDemo />} />
        <Route path="/demo/coordinator/*" element={<CoordinatorDemo />} />

        {/* Audit — public, no login */}
        <Route path="/audit/:token" element={<AuditPage />} />

        {/* Public pages */}
        <Route path="/about"   element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms"   element={<TermsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AdminBackButton />
    </>
  );
}
