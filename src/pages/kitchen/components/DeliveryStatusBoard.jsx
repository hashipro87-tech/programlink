// DeliveryStatusBoard.jsx — Shows today's delivery assignments and lets kitchen staff
// advance each one through the prep → ready → picked up → delivered pipeline.
// One-tap status updates with a late-pickup alert (red highlight if pickup time has passed).

import { useState, useEffect } from 'react';
import { Truck, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';

const STAGES       = ['prepping', 'ready', 'picked_up', 'delivered'];
const STAGE_LABELS = { prepping: 'Prepping', ready: 'Ready for Pickup', picked_up: 'Picked Up', delivered: 'Delivered' };
const STAGE_COLORS = {
  prepping:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  ready:     'bg-blue-100 text-blue-700 border-blue-200',
  picked_up: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
};

// Returns the next stage in the pipeline (null if already at the end)
function nextStage(current) {
  const idx = STAGES.indexOf(current);
  return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
}

// Returns true if the pickup time has already passed and the route isn't picked up yet
function isLate(pickupTime, status) {
  if (status === 'picked_up' || status === 'delivered') return false;
  if (!pickupTime) return false;
  const [h, m] = pickupTime.split(':').map(Number);
  const pickup = new Date();
  pickup.setHours(h, m, 0, 0);
  return new Date() > pickup;
}

export default function DeliveryStatusBoard() {
  const [routes,   setRoutes]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState({}); // { routeId: bool }

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api.get(`/delivery/routes?date=${today}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data.routes ?? []);
        setRoutes(list);
      })
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (routeId, newStatus) => {
    setUpdating((u) => ({ ...u, [routeId]: true }));
    try {
      await api.patch(`/delivery/routes/${routeId}/status`, { status: newStatus });
      setRoutes((rs) => rs.map((r) => r.id === routeId ? { ...r, status: newStatus } : r));
    } catch {
      // Silently fail — the button will re-enable
    } finally {
      setUpdating((u) => ({ ...u, [routeId]: false }));
    }
  };

  const delivered    = routes.filter((r) => r.status === 'delivered').length;
  const progressPct  = routes.length ? Math.round((delivered / routes.length) * 100) : 0;

  if (loading) {
    return (
      <div className="card mb-6 px-6 py-10 text-center text-sm text-gray-400">
        Loading today's routes…
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Today's Deliveries</h2>
        </div>
        <div className="px-6 py-10 text-center">
          <Truck className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No deliveries scheduled for today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-6">
      {/* Header with delivery count */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Today's Deliveries</h2>
        </div>
        <span className="text-sm text-gray-500 font-medium">{delivered}/{routes.length} delivered</span>
      </div>

      {/* Overall progress bar */}
      <div className="px-6 pt-3 pb-1">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Route cards */}
      <div className="px-6 py-4 space-y-3">
        {routes.map((route) => {
          const late   = isLate(route.pickup_time ?? route.pickup, route.status);
          const next   = nextStage(route.status);
          const siteName = route.site_name ?? route.site ?? 'Unknown Site';
          const driver   = route.driver_name ?? route.driver ?? 'Unassigned';
          const pickup   = route.pickup_time ?? route.pickup ?? '—';

          return (
            <div
              key={route.id}
              className={`p-4 rounded-xl border ${
                late ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
              }`}
            >
              {/* Route info row */}
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900 truncate">{siteName}</p>
                    {late && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                        <AlertTriangle className="w-3.5 h-3.5" /> Late
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Driver: {driver} · Pickup: {pickup}
                  </p>
                </div>

                {/* Status badge */}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${STAGE_COLORS[route.status] ?? ''}`}>
                  {STAGE_LABELS[route.status] ?? route.status}
                </span>
              </div>

              {/* One-tap advance button */}
              {next && (
                <button
                  onClick={() => updateStatus(route.id, next)}
                  disabled={updating[route.id]}
                  className="mt-3 w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {updating[route.id] ? 'Updating…' : `Mark as ${STAGE_LABELS[next]}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
