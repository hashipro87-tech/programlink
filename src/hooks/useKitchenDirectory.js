import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useKitchenDirectory() {
  const [kitchens,      setKitchens]      = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [search,        setSearch]        = useState('');

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/kitchen-directory'),
      api.get('/kitchen-directory/connections').catch(() => ({ data: { connections: [] } })),
    ])
      .then(([kRes, cRes]) => {
        setKitchens(kRes.data.kitchens ?? kRes.data ?? []);
        setMyConnections(cRes.data.connections ?? []);
      })
      .catch((err) => setError(err?.response?.data?.error ?? 'Failed to load kitchens'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Return connection object for a given kitchen id
  const connectionFor = useCallback(
    (kitchenId) => myConnections.find((c) => c.kitchen_id === kitchenId) ?? null,
    [myConnections]
  );

  // Site requests a connection to a kitchen
  async function requestConnection(kitchenId) {
    const { data } = await api.post('/kitchen-directory/connections', { kitchen_id: kitchenId });
    setMyConnections((prev) => [
      ...prev.filter((c) => c.kitchen_id !== kitchenId),
      { kitchen_id: kitchenId, status: 'pending', ...(data.connection ?? {}) },
    ]);
    return data;
  }

  // Client-side search filter
  const filteredKitchens = search.trim()
    ? kitchens.filter((k) =>
        (k.name + ' ' + (k.address ?? '')).toLowerCase().includes(search.toLowerCase())
      )
    : kitchens;

  return {
    kitchens: filteredKitchens,
    loading,
    error,
    search,
    setSearch,
    requestConnection,
    connectionFor,
    refetch: fetchAll,
  };
}

export function useConnectionRequests(filter = '') {
  const [connections, setConnections] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const fetchConnections = useCallback(() => {
    setLoading(true);
    api.get('/kitchen-directory/connections')
      .then(({ data }) => {
        const all = data.connections ?? [];
        // Client-side filter by status if provided
        setConnections(filter ? all.filter((c) => c.status === filter) : all);
      })
      .catch((err) => setError(err?.response?.data?.error ?? 'Failed to load connections'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  async function reviewConnection(id, status) {
    await api.patch(`/kitchen-directory/connections/${id}`, { status });
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
          .filter((c) => !filter || c.status === filter)
    );
  }

  return { connections, loading, error, reviewConnection, refetch: fetchConnections };
}
