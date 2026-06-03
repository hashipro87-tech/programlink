import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useKitchenDirectory() {
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/kitchen-directory')
      .then(({ data }) => setKitchens(data.kitchens ?? data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { kitchens, loading, error, refetch: fetch };
}

export function useConnectionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/kitchen-directory/requests')
      .then(({ data }) => setRequests(data.requests ?? data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function respondToRequest(id, action) {
    const { data } = await api.post(`/kitchen-directory/requests/${id}/${action}`);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    return data;
  }

  return { requests, loading, error, refetch: fetch, respondToRequest };
}
