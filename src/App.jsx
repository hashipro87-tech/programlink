import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import HomePage            from './pages/home/HomePage';
import Login               from './pages/auth/Login';
import Register            from './pages/auth/Register';
import CheckEmailPage      from './pages/auth/CheckEmailPage';
import VerifyEmailPage     from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage  from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage   from './pages/auth/ResetPasswordPage';

import SponsorDashboard     from './pages/sponsor/SponsorDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import KitchenDashboard     from './pages/kitchen/KitchenDashboard';
import SiteDashboard        from './pages/site/SiteDashboard';
import DeliveryDashboard    from './pages/delivery/DeliveryDashboard';
import AdminDashboard       from './pages/admin/AdminDashboard';

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
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_DASHBOARD[user.role] ?? '/login'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                  element={<HomePage />} />
      <Route path="/login"             element={<Login />} />
      <Route path="/register"          element={<Register />} />
      <Route path="/check-email"       element={<CheckEmailPage />} />
      <Route path="/verify-email"      element={<VerifyEmailPage />} />
      <Route path="/forgot-password"   element={<ForgotPasswordPage />} />
      <Route path="/reset-password"    element={<ResetPasswordPage />} />

      {/* Dashboards */}
      <Route path="/dashboard/sponsor/*"     element={<PrivateRoute roles={['sponsor']}><SponsorDashboard /></PrivateRoute>} />
      <Route path="/dashboard/coordinator/*" element={<PrivateRoute roles={['coordinator']}><CoordinatorDashboard /></PrivateRoute>} />
      <Route path="/dashboard/kitchen/*"     element={<PrivateRoute roles={['kitchen']}><KitchenDashboard /></PrivateRoute>} />
      <Route path="/dashboard/site/*"        element={<PrivateRoute roles={['site']}><SiteDashboard /></PrivateRoute>} />
      <Route path="/dashboard/delivery/*"    element={<PrivateRoute roles={['delivery']}><DeliveryDashboard /></PrivateRoute>} />
      <Route path="/dashboard/admin/*"       element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
