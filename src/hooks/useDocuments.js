import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useDocuments(orgId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    const url = orgId ? `/documents?orgId=${orgId}` : '/documents';
    api.get(url)
      .then(({ data }) => setDocuments(data.documents ?? data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { reload(); }, [reload]);

  // file: File, docType: string, label: string, expiresAt: string|null
  async function uploadDocument(file, docType, label, expiresAt) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      formData.append('label', label);
      if (expiresAt) formData.append('expires_at', expiresAt);
      const { data } = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocuments((prev) => [data.document ?? data, ...prev]);
      return data;
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(id) {
    await api.delete(`/documents/${id}`);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  function getDoc(type) {
    return documents.find((d) => d.doc_type === type) ?? null;
  }

  return { documents, loading, uploading, error, reload, uploadDocument, deleteDocument, getDoc };
}
