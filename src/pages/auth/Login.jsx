// Login.jsx — The single sign-in page for all user types
// After login, users are automatically routed to their role-specific dashboard

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Maps each role to its dashboard path
const ROLE_ROUTES = {
  sponsor:     '/dashboard/sponsor',
  coordinator: '/dashboard/coordinator',
  kitchen:     '/dashboard/kitchen',
  site:        '/dashboard/site',
  delivery:    '/dashboard/delivery',
  admin:       '/dashboard/admin',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Route to the correct dashboard based on the user's role
      const destination = ROLE_ROUTES[user.role] || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CACFPLink</h1>
          <p className="text-gray-500 mt-1 text-sm">CACFP Operations Platform</p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} noValidate>
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-danger-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                           placeholder-gray-400"
                placeholder="you@organization.org"
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                           placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300
                         text-white font-medium rounded-lg text-sm transition-colors
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Help text */}
          <p className="mt-4 text-center text-xs text-gray-500">
            New to CACFPLink? <Link to="/register" className="text-brand-600 hover:underline">Create an account</Link>
          </p>
          <p className="mt-2 text-center text-xs text-gray-500">
            <Link to="/forgot-password" className="text-brand-600 hover:underline">Forgot your password?</Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} CACFPLink. All rights reserved.
        </p>
        <p className="text-center mt-3">
          <Link to="/" className="text-xs text-brand-600 hover:underline">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}
