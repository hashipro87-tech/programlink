// CoordinatorsPage.jsx — Sponsor view of all coordinator accounts in their program.
// Coordinators are sponsor staff who handle day-to-day operations.
// Sponsors can see who is active, when they last logged in, and deactivate accounts.

import { useState, useEffect } from 'react';
import {
  Users, Search, X, RefreshCw, CheckCircle,
  Clock, ShieldOff, ChevronRight, Mail,
  Building2, UserCheck, UserX, Shield, Plus,
} from 'lucide-react';
import api from '../../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return 'Never';
  const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)   return `${diff} days ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ROLE_CONFIG = {
  coordinator: { label: 'Coordinator', color: 'text-brand-700 bg-brand-50 border-brand-200' },
  sponsor:     { label: 'Sponsor',     color: 'text-purple-700 bg-purple-50 border-purple-200' },
  site:        { label: 'Site staff',  color: 'text-blue-700 bg-blue-50 border-blue-200' },
  kitchen:     { label: 'Kitchen',     color: 'text-orange-700 bg-orange-50 border-orange-200' },
  delivery:    { label: 'Delivery',    color: 'text-teal-700 bg-teal-50 border-teal-200' },
  admin:       { label: 'Admin',       color: 'text-gray-700 bg-gray-100 border-gray-200' },
};

function RolePill({ role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.admin;
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── User Detail Panel ────────────────────────────────────────────────────────

function DetailPanel({ user, onClose, onStatusChange, onRemoved }) {
  const [saving,        setSaving]        = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing,      setRemoving]      = useState(false);
  const [removeError,   setRemoveError]   = useState('');
  const isSelf = false; // sponsor can never deactivate themselves (enforced server-side too)

  const handleToggle = async () => {
    setSaving(true);
    try {
      await api.patch(`/users/${user.id}/status`, { is_active: !user.is_active });
      onStatusChange(user.id, !user.is_active);
    } catch (err) {
      alert(err?.response?.data?.error ?? 'Failed to update — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setRemoveError('');
    try {
      await api.delete(`/users/${user.id}`);
      onRemoved(user.id);
      onClose();
    } catch (err) {
      setRemoveError(err?.response?.data?.error || 'Failed to remove. Please try again.');
      setRemoving(false);
      setConfirmRemove(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />

      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Team member</p>
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <RolePill role={user.role} />
              <span className={`text-xs font-semibold ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Contact */}
          <div className="px-6 py-5 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact</p>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a href={`mailto:${user.email}`} className="hover:text-brand-600 transition-colors">
                {user.email}
              </a>
            </div>
          </div>

          {/* Organization */}
          <div className="px-6 py-5 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Organization</p>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{user.org_name ?? '—'}</span>
            </div>
            {user.org_type && (
              <p className="text-xs text-gray-400 mt-1 ml-6.5 capitalize">{user.org_type}</p>
            )}
          </div>

          {/* Activity */}
          <div className="px-6 py-5 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Activity</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Last login</span>
                <span className="font-medium text-gray-700">{fmtDate(user.last_login_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Account created</span>
                <span className="font-medium text-gray-700">{fmtDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Account management — sponsor only action */}
          {user.role !== 'sponsor' && (
            <div className="px-6 py-5 border-b border-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Account</p>
              <p className="text-xs text-gray-400 mb-4">
                {user.is_active
                  ? 'Deactivating this account will immediately revoke access. The user will not be able to log in.'
                  : 'Reactivating this account will restore the user\'s access immediately.'}
              </p>
              <button
                onClick={handleToggle}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 ${
                  user.is_active
                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                    : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                }`}
              >
                {saving ? (
                  'Saving…'
                ) : user.is_active ? (
                  <><UserX className="w-4 h-4" /> Deactivate account</>
                ) : (
                  <><UserCheck className="w-4 h-4" /> Reactivate account</>
                )}
              </button>
            </div>
          )}

          {/* Danger zone */}
          {user.role !== 'sponsor' && (
            <div className="px-6 py-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Danger zone</p>
              {removeError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                  {removeError}
                </p>
              )}
              {!confirmRemove ? (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="w-full py-2.5 text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  Remove from program
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This will permanently remove <strong>{user.name}</strong> and delete their account. This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmRemove(false)}
                      className="flex-1 py-2 text-xs font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRemove}
                      disabled={removing}
                      className="flex-1 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                      {removing ? 'Removing…' : 'Yes, remove'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Invite Coordinator Modal ─────────────────────────────────────────────────

function InviteCoordinatorModal({ onClose }) {
  const [form,    setForm]    = useState({ contact_name: '', contact_email: '' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_name.trim())  { setError('Name is required.'); return; }
    if (!form.contact_email.trim()) { setError('Email is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/organizations/invite-coordinator', form);
      setSuccess(`Invite sent to ${form.contact_email}! They'll receive a link to set up their coordinator account.`);
      setTimeout(onClose, 2800);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send invite. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Invite Coordinator</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              They'll receive an email to create their account and join your team.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.contact_name}
              onChange={set('contact_name')}
              placeholder="e.g. Maria Johnson"
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={set('contact_email')}
              placeholder="coordinator@org.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              {success}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold
                         text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !!success}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl
                         text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Sending invite…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({ user, onClick }) {
  const isRecent = user.last_login_at &&
    (Date.now() - new Date(user.last_login_at)) < 7 * 86400000;

  return (
    <button
      onClick={onClick}
      className="w-full px-5 py-4 flex items-center gap-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors text-left group"
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        user.is_active ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-400'
      }`}>
        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
      </div>

      {/* Name + org */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate group-hover:text-brand-700 transition-colors ${
          user.is_active ? 'text-gray-900' : 'text-gray-400'
        }`}>
          {user.name}
        </p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{user.org_name ?? user.email}</p>
      </div>

      {/* Role */}
      <div className="flex-shrink-0 hidden sm:block">
        <RolePill role={user.role} />
      </div>

      {/* Last login */}
      <div className="flex-shrink-0 hidden md:flex items-center gap-1.5 text-xs">
        <Clock className={`w-3.5 h-3.5 ${isRecent ? 'text-green-500' : 'text-gray-300'}`} />
        <span className={isRecent ? 'text-green-600 font-medium' : 'text-gray-400'}>
          {fmtDate(user.last_login_at)}
        </span>
      </div>

      {/* Active indicator */}
      <div className="flex-shrink-0">
        {user.is_active
          ? <CheckCircle className="w-4 h-4 text-green-500" title="Active" />
          : <ShieldOff className="w-4 h-4 text-gray-300" title="Inactive" />
        }
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-brand-500 transition-colors" />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ROLE_FILTERS = [
  { id: 'all',         label: 'All' },
  { id: 'coordinator', label: 'Coordinators' },
  { id: 'site',        label: 'Site staff' },
  { id: 'kitchen',     label: 'Kitchen staff' },
  { id: 'delivery',    label: 'Delivery' },
];

export default function CoordinatorsPage() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showInvite, setShowInvite] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(({ data }) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const visible = users.filter((u) => {
    if (!showInactive && !u.is_active) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
        !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCoordinators = users.filter((u) => u.role === 'coordinator').length;
  const totalActive        = users.filter((u) => u.is_active).length;
  const recentLogins       = users.filter((u) => u.last_login_at &&
    (Date.now() - new Date(u.last_login_at)) < 7 * 86400000).length;

  const handleStatusChange = (userId, isActive) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: isActive } : u));
    setSelected((prev) => prev?.id === userId ? { ...prev, is_active: isActive } : prev);
  };

  const handleUserRemoved = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setSelected(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 mt-1 text-sm">
            All staff accounts across your program — coordinators, site staff, kitchen teams, and delivery.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
                     text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Invite Coordinator
        </button>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Coordinators',  value: totalCoordinators, icon: Shield,       color: 'text-brand-600' },
          { label: 'Active accounts', value: totalActive,      icon: CheckCircle,  color: 'text-green-600' },
          { label: 'Active this week', value: recentLogins,   icon: Clock,        color: 'text-gray-900' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card px-5 py-4 flex items-center gap-4">
            <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
            <div>
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="px-5 py-3 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role chips */}
          <div className="flex gap-2 flex-wrap">
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setRoleFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  roleFilter === f.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Show inactive toggle */}
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Show inactive
          </label>

          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="card">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading team…</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              {search ? `No team members matching "${search}"` : 'No team members found.'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Staff accounts appear here once they register under your program.
            </p>
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div className="px-5 py-2 border-b border-gray-100 hidden sm:flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <div className="w-9 flex-shrink-0" />
              <div className="flex-1">Name / Organization</div>
              <div className="w-24 flex-shrink-0 hidden sm:block">Role</div>
              <div className="w-28 flex-shrink-0 hidden md:block">Last login</div>
              <div className="w-6 flex-shrink-0 text-center">Active</div>
              <div className="w-4 flex-shrink-0" />
            </div>

            {visible.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onClick={() => setSelected(user)}
              />
            ))}

            <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400 text-right">
              Showing {visible.length} of {users.length} account{users.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          user={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onRemoved={handleUserRemoved}
        />
      )}

      {/* Invite Coordinator modal */}
      {showInvite && (
        <InviteCoordinatorModal onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}
