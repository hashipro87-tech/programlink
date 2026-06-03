// DeliveryDashboard.jsx — Dashboard for delivery providers
// Shows today's routes, delivery confirmation, and issue reporting

import { useState, useEffect } from 'react';
import { useLocation, Outlet, Routes, Route } from 'react-router-dom';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import ApplicationPage   from '../application/ApplicationPage';
import DocumentsPage     from '../documents/DocumentsPage';
import MessagesPage      from '../messages/MessagesPage';
import NotificationsPage from '../notifications/NotificationsPage';
import SettingsPage      from '../settings/SettingsPage';
import { Truck, MapPin, AlertTriangle, MessageSquare, CheckCircle, Settings } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';

const NAV_ITEMS = [
  { label: 'Overview',       path: '/dashboard/delivery',          icon: CheckCircle },
  { label: "Today's Routes", path: '/dashboard/delivery/routes',   icon: Truck },
  { label: 'Route History',  path: '/dashboard/delivery/history',  icon: MapPin },
  { label: 'Issues',         path: '/dashboard/delivery/issues',   icon: AlertTriangle },
  { label: 'Messages',       path: '/dashboard/delivery/messages',  icon: MessageSquare },
  { label: 'Settings',      path: '/dashboard/delivery/settings',  icon: Settings },
];

export default function DeliveryDashboard() {
  const location   = useLocation();
  const isOverview = location.pathname === '/dashboard/delivery';
  const { stats }  = useDashboardStats();

  // Fetch today's real routes from the /delivery API
  // Routes are assigned by coordinators — when none are assigned the empty state shows
  const [routes, setRoutes]         = useState([]);
  const [routesLoading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOverview) return;
    const today = new Date().toISOString().split('T')[0];
    api.get(`/delivery/routes?date=${today}`)
      .then(({ data }) => setRoutes(data.routes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOverview]);

  // Confirm a delivery stop — updates the route status in the database
  const confirmStop = async (routeId) => {
    try {
      await api.patch(`/delivery/routes/${routeId}/status`, { status: 'completed' });
      setRoutes((prev) =>
        prev.map((r) => r.id === routeId ? { ...r, status: 'completed' } : r)
      );
    } catch {
      alert('Could not confirm delivery. Please try again.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar navItems={NAV_ITEMS} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {isOverview ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
                <p className="text-gray-500 mt-1">View your routes, confirm deliveries, and report issues.</p>
              </div>

              {/* Stat cards use real counts from /stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard label="Routes Today" value={stats.routes_today    ?? '—'} icon={MapPin}      color="blue" />
                <StatCard label="Completed"    value={stats.completed_today ?? '—'} icon={CheckCircle} color="green" />
                <StatCard label="Remaining"    value={stats.remaining_today ?? '—'} icon={Truck}       color="yellow" />
              </div>

              {/* Today's routes — fetched from the real database */}
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Today's Delivery Stops</h2>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {routesLoading ? (
                  <div className="px-6 py-8 text-center text-sm text-gray-400">Loading routes…</div>
                ) : routes.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Truck className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No deliveries scheduled for today.</p>
                    <p className="text-xs text-gray-400 mt-1">Your coordinator will assign routes here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {routes.map((route, i) => (
                      <div key={route.id} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            route.status === 'completed'   ? 'bg-green-100 text-green-600' :
                            route.status === 'in_progress' ? 'bg-brand-100 text-brand-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{route.site_name ?? `Stop ${i + 1}`}</p>
                            <p className="text-xs text-gray-500">{route.site_address ?? '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={route.status} />
                          {route.status !== 'completed' && (
                            <button
                              onClick={() => confirmStop(route.id)}
                              className="text-xs text-brand-600 hover:underline font-medium ml-2"
                            >
                              Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <Routes>
              <Route path="application"   element={<ApplicationPage />} />
              <Route path="documents"     element={<DocumentsPage />} />
              <Route path="messages"      element={<MessagesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings"      element={<SettingsPage />} />
              <Route path="*"             element={<Outlet />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
}
