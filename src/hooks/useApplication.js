import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useApplication(applicationId) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const fetch = useCallback(() => {
    if (!applicationId) { setLoading(false); return; }
    setLoading(true);
    api.get(`/applications/${applicationId}`)
      .then(({ data }) => setApplication(data.application ?? data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [applicationId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function updateApplication(payload) {
    const { data } = await api.patch(`/applications/${applicationId}`, payload);
    setApplication(data.application ?? data);
    return data;
  }

  async function submitApplication() {
    const { data } = await api.post(`/applications/${applicationId}/submit`);
    setApplication(data.application ?? data);
    return data;
  }

  return { application, loading, error, refetch: fetch, updateApplication, submitApplication };
}
