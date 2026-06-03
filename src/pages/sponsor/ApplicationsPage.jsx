// ApplicationsPage.jsx — Coordinator / Sponsor application review queue
// Shows all applications across the program with filter tabs and a slide-in detail panel.

import { useState } from 'react';
import { Search, ChevronRight, CheckCircle, XCircle, RotateCcw, Eye } from 'lucide-react';
import { useApplications } from '../../hooks/useApplications';
import StatusBadge from '../../components/common/StatusBadge';
import ApplicationReviewPanel from './ApplicationReviewPanel';

// Filter tabs — maps to the status query param
const TABS = [
  { label: 'All',          value: ''             },
  { label: 'Needs Review', value: 'submitted'     },
  { label: 'Under Review', value: 'under_review'  },
  { label: 'Approved',     value: 'approved'      },
  { label: 'Rejected',     value: 'rejected'      },
];

const TYPE_LABELS = { kitchen: 'Kitchen', site: 'Site', delivery: 'Delivery' };

export default function ApplicationsPage({ reviewerRole = 'coordinator' }) {
  const [activeTab,    setActiveTab]    = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [search,       setSearch]       = useState('');
  const [selectedId,   setSelectedId]   = useState(null);

  const { applications, loading, error, changeStatus } =
    useApplications({ status: activeTab, type: typeFilter });

  // Client-side name search on top of server-side status/type filters
  const filtered = applications.filter((a) =>
    !search || a.org_name?.toLowerCase().includes(search.toLowerCase())
  );

  const selected = filtered.find((a) => a.id === selectedId) || null;

  return (
    <div className="flex gap-6 h-full">
      {/* ── Left: List ────────────────────────────────────────────────────── */}
      <div className={`flex flex-col ${selected ? 'w-1/2' : 'w-full'} transition-all`}>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and act on submitted applications from sites, kitchens, and delivery providers.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by organization name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All types</option>
            <option value="kitchen">Kitchens</option>
            <option value="site">Sites</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.value
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applications list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No applications match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedId(selectedId === app.id ? null : app.id)}
                className={`w-full text-left card px-5 py-4 hover:border-brand-200 hover:shadow-md
                            transition-all flex items-center gap-4
                            ${selectedId === app.id ? 'border-brand-300 ring-1 ring-brand-200' : ''}`}
              >
                {/* Org type chip */}
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-brand-600">
                    {app.org_type?.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{app.org_name}</p>
                    <span className="text-xs text-gray-400">{TYPE_LABELS[app.org_type]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {app.submitted_at
                      ? `Submitted ${new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : `Created ${new Date(app.created_at).toLocaleDateString()}`
                    }
                    {app.reviewed_by_name && ` · Reviewed by ${app.reviewed_by_name}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={app.status} />
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                    selectedId === app.id ? 'rotate-90' : ''
                  }`} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Detail panel ───────────────────────────────────────────── */}
      {selected && (
        <div className="w-1/2 flex-shrink-0">
          <ApplicationReviewPanel
            application={selected}
            reviewerRole={reviewerRole}
            onClose={() => setSelectedId(null)}
            onStatusChange={changeStatus}
          />
        </div>
      )}
    </div>
  );
}
