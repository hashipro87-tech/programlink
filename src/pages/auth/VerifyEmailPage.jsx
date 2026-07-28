// VerifyEmailPage.jsx — Landing page when user clicks the verification link.
// Reads ?token= from the URL, calls the API, shows success or error.

import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react';
import api from '../../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const location       = useLocation();
  const token          = searchParams.get('token') ?? '';
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const called = useRef(false); // prevent double-call from React strict mode / re-renders

  // For resend — pre-fill from navigation state if available
  const [resendEmail, setResendEmail]   = useState(location.state?.email ?? '');
  const [resendStatus, setResendStatus] = useState('idle'); // 'idle' | 'loading' | 'sent' | 'error'

  async function handleResend() {
    if (!resendEmail || resendStatus === 'loading') return;
    setResendStatus('loading');
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  }

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }
    if (called.current) return; // already fired — ignore re-runs
    called.current = true;

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error ?? 'Something went wrong. Please try again.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">CACFPLink</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500">Verifying your email…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Email verified!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your account is now active. You can sign in to get started.
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Sign in
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Verification failed</h2>
              <p className="text-sm text-gray-500 mb-6">{message}</p>

              {resendStatus === 'sent' ? (
                <p className="text-sm text-green-600 font-medium mb-6">Link resent — check your inbox.</p>
              ) : (
                <div className="mb-6 space-y-2 text-left">
                  <p className="text-xs text-gray-500 font-medium text-center">Get a new verification link</p>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <button
                    onClick={handleResend}
                    disabled={!resendEmail || resendStatus === 'loading'}
                    className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {resendStatus === 'loading' ? 'Sending…' : 'Resend verification email'}
                  </button>
                  {resendStatus === 'error' && (
                    <p className="text-xs text-red-500 text-center">Couldn't resend. Try again in a moment.</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block text-sm text-brand-600 hover:underline font-medium"
                >
                  Back to sign in
                </Link>
                <Link
                  to="/register"
                  className="block text-xs text-gray-400 hover:underline"
                >
                  Create a new account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
