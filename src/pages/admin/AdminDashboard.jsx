// AdminDashboard.jsx — Platform-wide control panel
// Full platform visibility: all users, all orgs, all programs.
// Dark theme to visually distinguish from role dashboards.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Building2, ClipboardList, BarChart2,
  ChevronRight, Shield, LogOut, Search, CheckCircle,
  AlertTriangle, X, RefreshCw, LayoutDashboard,
} from 'lucide-react';
import api from '../../services/api';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { label: 'Overview',      path: '/dashboard/admin',              icon: LayoutDashboard },
  { label: 'Users',         path: '/dashboard/admin/users',        icon: Users           },
  { label: 'Organizations', path: '/dashboard/admin/orgs',         icon: Building2       },
  { label: 'Search',        path: '/dashboard/admin/search',       icon: Search          },
];

// ─── Global Search ────────────────────────────────────────────────────────────
function GlobalSearch() {
  const navigate         = useNavigate();
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const doSearch = useCallback((q) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    Promise.all([
      api.get(`/users?search=${encodeURIComponent(q)}`).catch(() => ({ data: { users: [] } })),
      api.get(`/organizations?search=${encodeURIComponent(q)}`).catch(() => ({ data: { organizations: [] } })),
      api.get(`/applications?search=${encodeURIComponent(q)}`).catch(() => ({ data: { applications: [] } })),
    ]).then(([usersRes, orgsRes, appsRes]) => {
      setResults({
        users:         usersRes.data.users         ?? [],
        organizations: orgsRes.data.organizations  ?? [],
        applications:  appsRes.data.applications   ?? [],
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 400);
  };

  const total = results ? (results.users.length + results.organizations.length + results.applications.length) : 0;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Global Search</h1>
        <p className="text-gray-400 mt-1 text-sm">Search across users, organizations, and applications.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search by name, email, org…"
          className="w-full pl-12 pr-4 py-3.5 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {results && (
        <div className="space-y-6">
          <p className="text-xs text-gray-500">{total} result{total !== 1 ? 's' : ''} for "{query}"</p>

          {/* Users */}
          {results.users.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Users</p>
              <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                {results.users.slice(0, 5).map((u) => (
                  <button key={u.id} onClick={() => navigate('/dashboard/admin/users')}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-700 border-b border-gray-700 last:border-0 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-gray-300">{u.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Organizations */}
          {results.organizations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Organizations</p>
              <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                {results.organizations.slice(0, 5).map((o) => (
                  <button key={o.id} onClick={() => navigate('/dashboard/admin/orgs')}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-700 border-b border-gray-700 last:border-0 transition-colors">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{o.name}</p>
                      <p className="text-xs text-gray-400 truncate">{o.address ?? 'No address'}</p>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{o.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          {results.applications.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Applications</p>
              <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                {results.applications.slice(0, 5).map((a) => (
                  <div key={a.id} className="px-4 py-3 flex items-center gap-3 border-b border-gray-700 last:border-0">
                    <ClipboardList className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.org_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{a.org_type}</p>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{a.status?.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No results for "{query}"</p>
            </div>
          )}
        </div>
      )}

      {!results && !loading && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Type to search across the platform</p>
        </div>
      )}
    </>
  );
}

function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="w-52 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-sm">ProgramLink</span>
          <span className="ml-1.5 text-[10px] bg-brand-600 text-white px-1.5 py-0.5 rounded font-semibold">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/organizations'),
    ]).then(([usersRes, orgsRes]) => {
      const users = usersRes.data.users ?? usersRes.data ?? [];
      const orgs  = orgsRes.data.organizations ?? orgsRes.data ?? [];
      setStats({
        total_users:    users.length,
        active_users:   users.filter((u) => u.is_active).length,
        total_orgs:     orgs.length,
        sponsors:       orgs.filter((o) => o.type === 'sponsor').length,
        kitchens:       orgs.filter((o) => o.type === 'kitchen').length,
        sites:          orgs.filter((o) => o.type === 'site').length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const ROLE_VIEWS = [
    { label: 'Sponsor View',     path: '/dashboard/sponsor',     color: 'bg-violet-900/40 border-violet-700 text-violet-300', dot: 'bg-violet-500' },
    { label: 'Coordinator View', path: '/dashboard/coordinator', color: 'bg-blue-900/40 border-blue-700 text-blue-300',       dot: 'bg-blue-500'   },
    { label: 'Kitchen View',     path: '/dashboard/kitchen',     color: 'bg-orange-900/40 border-orange-700 text-orange-300', dot: 'bg-orange-500' },
    { label: 'Site View',        path: '/dashboard/site',        color: 'bg-green-900/40 border-green-700 text-green-300',    dot: 'bg-green-500'  },
  ];

  const statCards = [
    { label: 'Total Users',    value: stats.total_users   ?? '—' },
    { label: 'Active Users',   value: stats.active_users  ?? '—' },
    { label: 'Organizations',  value: stats.total_orgs    ?? '—' },
    { label: 'Sponsors',       value: stats.sponsors      ?? '—' },
    { label: 'Kitchens',       value: stats.kitchens      ?? '—' },
    { label: 'Sites',          value: stats.sites         ?? '—' },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
        <p className="text-gray-400 mt-1 text-sm">Platform-wide view — all sponsors, programs, and organizations.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-white">{loading ? '…' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Role switcher */}
      <div className="mb-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Jump to Role View</h2>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_VIEWS.map((view) => (
            <button
              key={view.path}
              onClick={() => navigate(view.path)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:opacity-90 ${view.color}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${view.dot}`} />
                {view.label}
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Use your browser's back button to return here after viewing a role dashboard.
        </p>
      </div>
    </>
  );
}

// ─── Role pill ────────────────────────────────────────────────────────────────
function RolePill({ role }) {
  const map = {
    admin:       'bg-red-900/50 text-red-300 border-red-700',
    sponsor:     'bg-violet-900/50 text-violet-300 border-violet-700',
    coordinator: 'bg-blue-900/50 text-blue-300 border-blue-700',
    kitchen:     'bg-orange-900/50 text-orange-300 border-orange-700',
    site:        'bg-green-900/50 text-green-300 border-green-700',
    delivery:    'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${map[role] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
      {role}
    </span>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────
function AdminUsersPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('all');
  const [toggling, setToggling] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(({ data }) => setUsers(data.users ?? data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggle = async (user) => {
    setToggling(user.id);
    try {
      await api.patch(`/users/${user.id}/status`, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch {}
    finally { setToggling(null); }
  };

  const ROLES = ['all', 'admin', 'sponsor', 'coordinator', 'kitchen', 'site'];

  const filtered = users.filter((u) => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                        u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1 text-sm">All platform users across every organization.</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                roleFilter === r
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500 mb-3">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-700">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">Loading users…</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">No users found.</div>
          ) : filtered.map((user) => (
            <div key={user.id} className="px-6 py-4 flex items-center gap-4">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-gray-300">
                  {user.name?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  {!user.is_active && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-900/40 px-1.5 py-0.5 rounded">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                <p className="text-xs text-gray-600 truncate">{user.org_name ?? '—'}</p>
              </div>

              {/* Role */}
              <RolePill role={user.role} />

              {/* Toggle */}
              <button
                disabled={toggling === user.id}
                onClick={() => handleToggle(user)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  user.is_active
                    ? 'bg-gray-700 text-gray-300 hover:bg-red-900/50 hover:text-red-300'
                    : 'bg-green-900/50 text-green-300 hover:bg-green-800'
                }`}
              >
                {toggling === user.id ? '…' : user.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Organizations Page ───────────────────────────────────────────────────────
function AdminOrgsPage() {
  const [orgs, setOrgs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState('all');

  useEffect(() => {
    api.get('/organizations')
      .then(({ data }) => setOrgs(Array.isArray(data) ? data : (data.organizations ?? [])))
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, []);

  const TYPES = ['all', 'sponsor', 'coordinator', 'kitchen', 'site'];

  const filtered = orgs.filter((o) => {
    const matchSearch = o.name?.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === 'all' || o.type === typeFilter;
    return matchSearch && matchType;
  });

  const typeColor = {
    sponsor:     'bg-violet-900/40 text-violet-300 border-violet-700',
    coordinator: 'bg-blue-900/40 text-blue-300 border-blue-700',
    kitchen:     'bg-orange-900/40 text-orange-300 border-orange-700',
    site:        'bg-green-900/40 text-green-300 border-green-700',
  };

  const statusColor = {
    active:    'text-green-400',
    pending:   'text-yellow-400',
    suspended: 'text-red-400',
    inactive:  'text-gray-500',
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Organizations</h1>
        <p className="text-gray-400 mt-1 text-sm">All organizations across the platform.</p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search organizations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                typeFilter === t
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtered.length} organization{filtered.length !== 1 ? 's' : ''}</p>

      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-700">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">Loading organizations…</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">No organizations found.</div>
          ) : filtered.map((org) => (
            <div key={org.id} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{org.name}</p>
                <p className="text-xs text-gray-500 truncate">{org.address ?? 'No address'}</p>
              </div>

              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${typeColor[org.type] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                {org.type}
              </span>

              <span className={`text-xs font-semibold capitalize ${statusColor[org.status] ?? 'text-gray-400'}`}>
                {org.status}
              </span>

              {(org.doc_alerts > 0) && (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
                  <AlertTriangle className="w-3 h-3" /> {org.doc_alerts}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-5xl mx-auto">
          <Routes>
            <Route index          element={<Overview />} />
            <Route path="users"   element={<AdminUsersPage />} />
            <Route path="orgs"    element={<AdminOrgsPage />} />
            <Route path="search"  element={<GlobalSearch />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
