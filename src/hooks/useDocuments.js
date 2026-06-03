import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useDocuments(orgId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    const url = orgId ? `/documents?orgId=${orgId}` : '/documents';
    api.get(url)
      .then(({ data }) => setDocuments(data.documents ?? data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function uploadDocument(formData) {
    const { data } = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setDocuments((prev) => [data.document ?? data, ...prev]);
    return data;
  }

  async function deleteDocument(id) {
    await api.delete(`/documents/${id}`);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return { documents, loading, error, refetch: fetch, uploadDocument, deleteDocument };
}
