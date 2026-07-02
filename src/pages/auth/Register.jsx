// Register.jsx — Self-registration for new organizations
// Sponsors register independently; kitchens/sites/delivery need a sponsor ID

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { trackRoleSelect, trackSignUp, trackRegisterField, trackRegisterAbort, trackRegisterSubmit } from '../../utils/analytics';

const ROLE_OPTIONS = [
  {
    value: 'sponsor',
    label: 'Sponsor / Program Administrator',
    description: 'Oversee multiple sites, kitchens, and delivery providers across your USDA program.',
  },
  {
    value: 'kitchen',
    label: 'Kitchen / Food Production Site',
    description: 'Prepare and supply meals to sites in a sponsor\'s program.',
  },
  {
    value: 'site',
    label: 'Site / Daycare Center',
    description: 'Serve meals to children and track daily meal counts.',
  },
  {
    value: 'delivery',
    label: 'Delivery Provider',
    description: 'Transport meals from kitchens to sites on assigned routes.',
  },
];

const ROLE_HOME = {
  sponsor:     '/dashboard/sponsor',
  coordinator: '/dashboard/coordinator',
  kitchen:     '/dashboard/kitchen',
  site:        '/dashboard/site',
  delivery:    '/dashboard/delivery',
};

export default function Register() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [step, setStep]       = useState(1); // 1 = choose role, 2 = fill details
  const [role, setRole]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    name:       '',
    email:      '',
    password:   '',
    orgName:    '',
    orgAddress: '',
    orgPhone:   '',
    sponsorId:  '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Track the last field the user touched — used for abandonment event
  const lastFieldRef = useRef('');
  const trackField = (fieldName) => {
    lastFieldRef.current = fieldName;
    trackRegisterField(fieldName);
  };

  // Fire abandonment event if user leaves step 2 without submitting
  const submittedRef = useRef(false);
  useEffect(() => {
    if (step !== 2) return;
    return () => {
      if (!submittedRef.current) {
        trackRegisterAbort(2, lastFieldRef.current || 'none');
      }
    };
  }, [step]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name:       form.name,
        email:      form.email,
        password:   form.password,
        role,
        orgName:    form.orgName,
        orgAddress: form.orgAddress || undefined,
        orgPhone:   form.orgPhone   || undefined,
        sponsorId:  form.sponsorId  || undefined,
      });

      // Registration now requires email verification — show confirmation screen
      submittedRef.current = true;
      trackRegisterSubmit(role);
      trackSignUp(role);
      navigate('/register/check-email', { state: { email: form.email }, replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: role picker ────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="max-w-lg mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900">CACFPLink</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
            <p className="text-sm text-gray-500 mb-6">What best describes your organization?</p>

            <div className="space-y-3">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRole(opt.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    role === opt.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className={`text-sm font-semibold ${role === opt.value ? 'text-brand-700' : 'text-gray-900'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>

            {/* Warn non-sponsors that they need a Sponsor ID before continuing */}
            {role && role !== 'sponsor' && (
              <div className="mt-4 flex gap-2.5 items-start p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <span className="text-base leading-none mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold mb-0.5">You'll need a Sponsor ID to finish registration.</p>
                  <p className="text-xs text-amber-700">
                    This is a code provided by your USDA program sponsor. Ask them for it before continuing — you won't be able to complete signup without it.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => { trackRoleSelect(role); setStep(2); }}
              disabled={!role}
              className="mt-4 w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium
                         rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>

            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: account details ────────────────────────────────────────────────
  const selectedRole = ROLE_OPTIONS.find((r) => r.value === role);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-lg mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-xl text-gray-900">CACFPLink</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Back button + role label */}
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back
            </button>
            <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">
              {selectedRole?.label}
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Fill in your organization and login details.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization section */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Organization
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required value={form.orgName} onChange={set('orgName')}
                    onFocus={() => trackField('org_name')}
                    placeholder={role === 'sponsor' ? 'e.g. Illinois USDA Food Program' : 'e.g. Sunshine Daycare Center'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text" value={form.orgAddress} onChange={set('orgAddress')}
                      onFocus={() => trackField('org_address')}
                      placeholder="123 Main St, City, State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel" value={form.orgPhone} onChange={set('orgPhone')}
                      onFocus={() => trackField('org_phone')}
                      placeholder="(312) 555-0100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Sponsor ID field — only for non-sponsor roles */}
                {role !== 'sponsor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sponsor ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" required value={form.sponsorId} onChange={set('sponsorId')}
                      onFocus={() => trackField('sponsor_id')}
                      placeholder="Provided by your program sponsor"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Ask your USDA program sponsor for their Sponsor ID to join their program.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Account section */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pt-2">
                Your account
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required value={form.name} onChange={set('name')}
                    onFocus={() => trackField('full_name')}
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email" required value={form.email} onChange={set('email')}
                    onFocus={() => trackField('email')}
                    placeholder="jane@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password" required minLength={8} value={form.password} onChange={set('password')}
                    onFocus={() => trackField('password')}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium
                         rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
          </p>

          <p className="text-center text-sm text-gray-500 mt-3">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:underline font-medium">Sign in</Link>
          </p>

          {/* Trust badges */}
          <div className="flex justify-center gap-4 mt-5 pt-5 border-t border-gray-100">
            {[
              { icon: Lock,        label: 'SSL Encrypted' },
              { icon: ShieldCheck, label: 'Secure Storage' },
              { icon: CheckCircle, label: 'CACFP-Ready' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <Icon className="w-3.5 h-3.5 text-green-500" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
