import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useApplications(params = {}) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/applications', { params })
      .then(({ data }) => setApplications(data.applications ?? data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  async function updateStatus(id, status, notes, internalNote) {
    const { data } = await api.patch(`/applications/${id}/status`, { status, notes, internal_notes: internalNote });
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...data.application } : a)));
    return data;
  }

  return { applications, loading, error, refetch: fetch, updateStatus };
}
