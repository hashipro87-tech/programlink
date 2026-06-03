// CheckEmailPage.jsx — Shown after registration to tell user to verify their email.

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react';
import api from '../../services/api';

export default function CheckEmailPage() {
  const location = useLocation();
  const email    = location.state?.email ?? '';

  const [resendStatus, setResendStatus] = useState('idle'); // 'idle' | 'loading' | 'sent' | 'error'

  async function handleResend() {
    if (!email || resendStatus === 'loading') return;
    setResendStatus('loading');
    try {
      await api.post('/auth/resend-verification', { email });
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">ProgramLink</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 mb-1">
            We sent a verification link to
          </p>
          <p className="text-sm font-semibold text-gray-800 mb-5">{email || 'your email'}</p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to activate your account. Once verified you can sign in.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Don't see it? Check your spam folder.
          </p>

          {email && (
            <div className="mb-6">
              {resendStatus === 'sent' ? (
                <p className="text-sm text-green-600 font-medium">Link resent — check your inbox.</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendStatus === 'loading'}
                  className="text-sm text-brand-600 hover:underline font-medium disabled:opacity-50"
                >
                  {resendStatus === 'loading' ? 'Sending…' : 'Resend verification email'}
                </button>
              )}
              {resendStatus === 'error' && (
                <p className="text-xs text-red-500 mt-1">Couldn't resend. Try again in a moment.</p>
              )}
            </div>
          )}

          <Link
            to="/login"
            className="text-sm text-gray-400 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
