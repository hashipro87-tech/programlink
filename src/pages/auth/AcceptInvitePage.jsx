// AcceptInvitePage.jsx
// Landed here via the invite link in the email (e.g. /accept-invite?token=JWT).
// Decodes the JWT payload to show invite details, then lets the invitee set a password.
// On success, stores the session token and redirects to the appropriate dashboard.

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Eye, EyeOff, ChefHat, Building2, Users } from 'lucide-react';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  kitchen: {
    label:     'Kitchen Manager',
    dashboard: '/dashboard/kitchen',
    icon:      ChefHat,
    color:     'text-orange-600',
    bg:        'bg-orange-50',
  },
  site: {
    label:     'Site Director',
    dashboard: '/dashboard/site',
    icon:      Building2,
    color:     'text-blue-600',
    bg:        'bg-blue-50',
  },
  coordinator: {
    label:     'Program Coordinator',
    dashboard: '/dashboard/coordinator',
    icon:      Users,
    color:     'text-brand-600',
    bg:        'bg-brand-50',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Decode JWT payload without verifying signature (just to read invite info). */
function decodeJwtPayload(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

// ─── Expired / Invalid view ──────────────────────────────────────────────────

function ExpiredView() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invite link expired</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          This invite link is no longer valid or has expired.<br />
          Please ask your sponsor to send a new one.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="mt-6 text-sm text-brand-600 hover:underline font-medium"
        >
          Back to sign in →
        </button>
      </div>
    </div>
  );
}

// ─── Success view ────────────────────────────────────────────────────────────

function SuccessView({ roleCfg }) {
  const Icon = roleCfg?.icon ?? CheckCircle;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className={`w-14 h-14 rounded-full ${roleCfg?.bg ?? 'bg-green-50'} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-7 h-7 ${roleCfg?.color ?? 'text-green-600'}`} />
        </div>
        <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
        <h1 className="text-xl font-bold text-gray-900 mb-2 mt-2">Account created!</h1>
        <p className="text-sm text-gray-500">Taking you to your dashboard…</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const token   = searchParams.get('token');
  const payload = token ? decodeJwtPayload(token) : null;

  // Check if token is missing or has expired client-side
  const isExpired = !token || !payload || (payload.exp && Date.now() / 1000 > payload.exp);

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  const role    = payload?.role || 'kitchen';
  const roleCfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.kitchen;
  const RoleIcon = roleCfg.icon;

  if (isExpired) return <ExpiredView />;
  if (done)      return <SuccessView roleCfg={roleCfg} />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password)              { setError('Please enter a password.'); return; }
    if (password.length < 8)    { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)   { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/accept-invite', { token, password });

      // Store session token — AuthContext reads this key on next load
      localStorage.setItem('token', data.token);

      setDone(true);

      // Hard redirect after short delay so AuthContext re-initialises with the token
      setTimeout(() => {
        window.location.href = roleCfg.dashboard;
      }, 1400);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Something went wrong. Please try again.';
      const code = err?.response?.data?.code;
      if (code === 'ALREADY_REGISTERED') {
        setError(msg + ' Click "Back to sign in" below.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">

        {/* Brand header */}
        <div className="bg-brand-600 px-8 pt-8 pb-6">
          <p className="text-brand-200 text-xs font-semibold uppercase tracking-widest mb-3">CACFPLink</p>
          <h1 className="text-white text-2xl font-bold leading-snug">
            You've been invited!
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-brand-100 text-sm font-medium">{payload.org_name}</span>
            <span className="text-brand-300">·</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleCfg.bg} ${roleCfg.color}`}>
              {roleCfg.label}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-7">
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Hi <strong>{payload.contact_name || 'there'}</strong> — set a password to activate your account
            and get access to your {roleCfg.label.toLowerCase()} dashboard.
          </p>

          {/* Email (readonly) */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Email address
            </label>
            <input
              type="email"
              value={payload.email || ''}
              readOnly
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50
                         text-gray-400 cursor-not-allowed"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Create password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoFocus
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Confirm password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl
                         transition-colors disabled:opacity-50 text-sm mt-2"
            >
              {loading ? 'Creating account…' : 'Create my account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-brand-600 hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
