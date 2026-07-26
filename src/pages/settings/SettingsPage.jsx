// SettingsPage.jsx — Profile, password, and organization settings for all roles
// This page is shared across every role — each user can update their own info
// Changes save immediately to the database via the /api/settings endpoints

import { useState, useEffect } from 'react';
import { User, Lock, Building2, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PROGRAM_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

// A small reusable success/error message component
function Message({ msg }) {
  if (!msg) return null;
  const isSuccess = msg.startsWith('✓');
  return (
    <p className={`text-sm mt-2 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const isSponsor = user?.role === 'sponsor' || user?.role === 'admin';
  const [loading, setLoading] = useState(true);

  // Profile section state
  const [profile, setProfile]         = useState({ name: '', email: '' });
  const [profileMsg, setProfileMsg]   = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password section state
  const [passwords, setPasswords]     = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Organization section state
  const [org, setOrg]               = useState({ name: '', address: '', phone: '', region: '' });
  const [orgMsg, setOrgMsg]         = useState('');
  const [savingOrg, setSavingOrg]   = useState(false);

  // Load current settings when the page opens
  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => {
        setProfile({ name: data.settings?.name ?? '', email: data.settings?.email ?? '' });
        setOrg({
          name:    data.settings?.org_name ?? '',
          address: data.settings?.address ?? '',
          phone:   data.settings?.phone ?? '',
          region:  data.settings?.region ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Save profile changes — only sends what changed
  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await api.patch('/settings/profile', { name: profile.name, email: profile.email });
      setProfileMsg('✓ Profile updated.');
    } catch (err) {
      setProfileMsg(err.response?.data?.error ?? 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save password — validates match before sending
  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    if (passwords.newPass.length < 8) {
      setPasswordMsg('New password must be at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    setPasswordMsg('');
    try {
      await api.patch('/settings/password', {
        current_password: passwords.current,
        new_password: passwords.newPass,
      });
      setPasswordMsg('✓ Password changed.');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      setPasswordMsg(err.response?.data?.error ?? 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Save org info
  const saveOrg = async (e) => {
    e.preventDefault();
    setSavingOrg(true);
    setOrgMsg('');
    try {
      const { data } = await api.patch('/settings/organization', { name: org.name, address: org.address, phone: org.phone, region: org.region });
      // If a fresh token is returned (first-time org creation), swap it in so Claims
      // Center activates immediately — no log out / log in required.
      if (data.token) {
        await refreshUser(data.token);
      }
      setOrgMsg('✓ Organization saved.');
    } catch (err) {
      setOrgMsg(err.response?.data?.error ?? 'Failed to save organization info.');
    } finally {
      setSavingOrg(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-gray-400">Loading settings…</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Update your profile, password, and organization details.</p>
      </div>

      {/* ── Profile ───────────────────────────────────────────────────── */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Profile</h2>
        </div>
        <form onSubmit={saveProfile} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
            <Message msg={profileMsg} />
          </div>
        </form>
      </div>

      {/* ── Password ──────────────────────────────────────────────────── */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={savePassword} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password"
              value={passwords.newPass}
              onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {savingPassword ? 'Saving…' : 'Change Password'}
            </button>
            <Message msg={passwordMsg} />
          </div>
        </form>
      </div>

      {/* ── Organization ──────────────────────────────────────────────── */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Organization</h2>
        </div>
        <form onSubmit={saveOrg} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization name</label>
            <input
              type="text"
              value={org.name}
              onChange={(e) => setOrg((o) => ({ ...o, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={org.address}
              onChange={(e) => setOrg((o) => ({ ...o, address: e.target.value }))}
              placeholder="123 Main St, City, State"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={org.phone}
              onChange={(e) => setOrg((o) => ({ ...o, phone: e.target.value }))}
              placeholder="(614) 555-0100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* CACFP Program State — sponsors only */}
          {isSponsor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CACFP Program State
              </label>
              <select
                value={org.region}
                onChange={(e) => setOrg((o) => ({ ...o, region: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select your state…</option>
                {PROGRAM_STATES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Sets your state's CACFP reimbursement rates for the Claims Center. Log out and back in after changing.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingOrg}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {savingOrg ? 'Saving…' : 'Save Organization'}
            </button>
            <Message msg={orgMsg} />
          </div>
        </form>
      </div>
    </div>
  );
}
