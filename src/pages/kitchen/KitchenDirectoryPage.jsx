// KitchenDirectoryPage.jsx — For sites: browse approved kitchens and request connections
// For coordinators: review pending connection requests

import { useState } from 'react';
import { Search, Building2, CheckCircle, Clock, XCircle, MapPin, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useKitchenDirectory, useConnectionRequests } from '../../hooks/useKitchenDirectory';

// ─── Status chip for a connection ───
function ConnectionBadge({ status }) {
  const config = {
    pending:  { label: 'Requested',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    approved: { label: 'Connected',  cls: 'bg-green-50  text-green-700  border-green-200' },
    rejected: { label: 'Not approved', cls: 'bg-red-50  text-red-700    border-red-200' },
    ended:    { label: 'Ended',       cls: 'bg-gray-50  text-gray-600   border-gray-200' },
  };
  const c = config[status] ?? config.ended;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ─── Kitchen card for sites browsing the directory ───
function KitchenCard({ kitchen, connection, onRequest, requesting }) {
  const connStatus = connection?.status;
  const canRequest = !connStatus || connStatus === 'rejected' || connStatus === 'ended';

  return (
    <div className="card p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{kitchen.name}</p>
            {kitchen.address && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {kitchen.address}
              </p>
            )}
          </div>
        </div>
        {connStatus && <ConnectionBadge status={connStatus} />}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {kitchen.form_data?.capacity && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> Capacity: {kitchen.form_data.capacity}
          </span>
        )}
        {kitchen.form_data?.kitchen_type && (
          <span className="capitalize">{kitchen.form_data.kitchen_type.replace(/_/g, ' ')}</span>
        )}
        {kitchen.connected_sites > 0 && (
          <span>{kitchen.connected_sites} site{kitchen.connected_sites !== 1 ? 's' : ''} connected</span>
        )}
      </div>

      {/* Meal types */}
      {kitchen.form_data?.meal_types?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {kitchen.form_data.meal_types.map((mt) => (
            <span key={mt} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
              {mt.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Action */}
      {connStatus === 'approved' ? (
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-1">
          <CheckCircle className="w-4 h-4" />
          You are connected to this kitchen
        </div>
      ) : connStatus === 'pending' ? (
        <div className="flex items-center gap-1.5 text-xs text-yellow-600 font-medium mt-1">
          <Clock className="w-4 h-4" />
          Connection request pending coordinator approval
        </div>
      ) : (
        <button
          onClick={() => onRequest(kitchen.id)}
          disabled={requesting || !canRequest}
          className="mt-1 w-full py-2 px-4 rounded-lg text-sm font-medium border transition-colors
                     border-brand-500 text-brand-600 hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {requesting ? 'Requesting…' : 'Request Connection'}
        </button>
      )}
    </div>
  );
}

// ─── Coordinator / Sponsor view: pending requests list ───
function ConnectionRequestsPanel() {
  const [filter, setFilter] = useState('pending');
  const { connections, loading, reviewConnection } = useConnectionRequests(filter);
  const [acting, setActing] = useState(null);

  const handle = async (id, status) => {
    setActing(id);
    try { await reviewConnection(id, status); }
    finally { setActing(null); }
  };

  const TABS = [
    { label: 'Pending',  value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'All',      value: '' },
  ];

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-5">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === t.value
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : connections.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No connection requests to show.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {connections.map((c) => (
            <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {c.site_name} <ChevronRight className="w-3.5 h-3.5 inline text-gray-400" /> {c.kitchen_name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Requested {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {c.approved_by_name && ` · Reviewed by ${c.approved_by_name}`}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <ConnectionBadge status={c.status} />
                {c.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handle(c.id, 'approved')}
                      disabled={acting === c.id}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium
                                 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handle(c.id, 'rejected')}
                      disabled={acting === c.id}
                      className="px-3 py-1.5 bg-white border border-red-300 text-red-600 text-xs font-medium
                                 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Root export: role-aware wrapper ───
export default function KitchenDirectoryPage() {
  const { user } = useAuth();
  const isSite   = user?.role === 'site';
  const isReviewer = user?.role === 'coordinator' || user?.role === 'sponsor';

  // ── Site: browse kitchens ──
  const {
    kitchens, loading, error, search, setSearch, requestConnection, connectionFor,
  } = useKitchenDirectory();
  const [requesting, setRequesting] = useState(null);

  const handleRequest = async (kitchenId) => {
    setRequesting(kitchenId);
    try { await requestConnection(kitchenId); }
    finally { setRequesting(null); }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kitchen Directory</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {isSite
            ? 'Browse approved kitchens and request a connection for your program.'
            : 'Review and manage kitchen ↔ site connection requests.'}
        </p>
      </div>

      {/* Coordinator / Sponsor: connection request review */}
      {isReviewer && <ConnectionRequestsPanel />}

      {/* Site: browse + request */}
      {isSite && (
        <>
          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search kitchens by name or address…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : kitchens.length === 0 ? (
            <div className="card px-6 py-16 text-center">
              <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-4" />
              <p className="text-sm text-gray-500 font-medium">No kitchens found</p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? 'Try a different search term.' : 'Approved kitchens will appear here once available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kitchens.map((k) => (
                <KitchenCard
                  key={k.id}
                  kitchen={k}
                  connection={connectionFor(k.id)}
                  onRequest={handleRequest}
                  requesting={requesting === k.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Kitchen role: show their own connected sites */}
      {user?.role === 'kitchen' && (
        <KitchenOwnConnections />
      )}
    </>
  );
}

// Kitchen's own view: which sites are connected to them
function KitchenOwnConnections() {
  const { connections, loading } = useConnectionRequests('approved');
  return (
    <>
      <p className="text-sm text-gray-500 mb-5">Sites currently connected to your kitchen.</p>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : connections.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No sites connected yet.</p>
          <p className="text-xs text-gray-400 mt-1">Sites will appear here once a coordinator approves a connection.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {connections.map((c) => (
            <div key={c.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.site_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Connected {new Date(c.approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <ConnectionBadge status={c.status} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
