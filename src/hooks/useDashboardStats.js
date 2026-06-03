import { useState, useEffect } from 'react';
import api from '../services/api';

export function useDashboardStats() {
  const [stats, setStats]     = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get('/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}
