import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/notifications')
      .then(({ data }) => {
        const items = data.notifications ?? data;
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.read_at).length);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await api.post('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }

  return { notifications, unreadCount, loading, error, refetch: fetch, markRead, markAllRead };
}
