import { useState, useEffect } from 'react';
import api from '../services/api';

// ─── Shared store ───────────────────────────────────────────────────────────
// useNotifications() used to give every caller its own independent state and
// its own 30s poll timer — it's called separately in NotificationsPage.jsx,
// SponsorDashboard.jsx, CoordinatorDashboard.jsx, KitchenDashboard.jsx, and
// twice in SiteDashboard.jsx. Because each dashboard shell renders
// NotificationsPage as a nested <Route> (the shell never unmounts), marking
// a notification read on the full page updated ONLY that page's private
// state — the sidebar Bell badge's separate instance had no way to find out,
// and only caught up on its own next 30s poll. That's what looked like
// "marking as read doesn't work": it worked, but nothing told the rest of
// the app.
//
// Fix: one shared in-memory store. Every hook instance subscribes to it, so
// a markRead()/markAllRead() from any component updates every other
// component (Bell badge included) immediately, and there's only ever one
// poll timer running regardless of how many components use the hook.

let store = { notifications: [], unreadCount: 0, loading: true, error: null };
const listeners = new Set();

function setStore(patch) {
  store = { ...store, ...patch };
  listeners.forEach((l) => l(store));
}

function computeUnread(items) {
  return items.filter((n) => !n.read_at).length;
}

function fetchNotifications() {
  setStore({ loading: store.notifications.length === 0 });
  return api.get('/notifications')
    .then(({ data }) => {
      const items = data.notifications ?? data;
      setStore({ notifications: items, unreadCount: computeUnread(items), loading: false, error: null });
    })
    .catch((err) => setStore({ error: err, loading: false }));
}

let intervalId = null;
function ensurePolling() {
  if (intervalId) return;
  fetchNotifications();
  intervalId = setInterval(fetchNotifications, 30000);
}
function maybeStopPolling() {
  if (listeners.size === 0 && intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function useNotifications() {
  const [local, setLocal] = useState(store);

  useEffect(() => {
    listeners.add(setLocal);
    setLocal(store); // pick up whatever the shared store already has
    ensurePolling();
    return () => {
      listeners.delete(setLocal);
      maybeStopPolling();
    };
  }, []);

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    const notifications = store.notifications.map((n) =>
      n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n
    );
    setStore({ notifications, unreadCount: computeUnread(notifications) });
  }

  async function markAllRead() {
    await api.post('/notifications/read-all');
    const notifications = store.notifications.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }));
    setStore({ notifications, unreadCount: 0 });
  }

  return { ...local, refetch: fetchNotifications, markRead, markAllRead };
}
