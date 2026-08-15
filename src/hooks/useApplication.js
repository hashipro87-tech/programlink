import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useApplication(applicationId) {
  const [internalId,  setInternalId]  = useState(applicationId ?? null);
  const [application, setApplication] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);

  const fetch = useCallback(() => {
    if (internalId) {
      // Fetch a specific application by id
      setLoading(true);
      api.get(`/applications/${internalId}`)
        .then(({ data }) => setApplication(data.application ?? data))
        .catch((err) => setError(err))
        .finally(() => setLoading(false));
    } else {
      // Fetch the user's most recent application (site/kitchen applicant role)
      setLoading(true);
      api.get('/applications')
        .then(({ data }) => {
          const apps = data.applications ?? [];
          const app  = apps[0] ?? null;
          setApplication(app);
          if (app) setInternalId(app.id);
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false));
    }
  }, [internalId]);

  useEffect(() => { fetch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Create a new application record (called on first Next click)
  async function createApplication(formData) {
    setSaving(true);
    try {
      const { data } = await api.post('/applications', { form_data: formData ?? null });
      const app = data.application ?? data;
      setApplication(app);
      setInternalId(app.id);
      return app;
    } finally {
      setSaving(false);
    }
  }

  // Patch arbitrary fields (status, notes, form_data, etc.)
  async function updateApplication(payload) {
    if (!internalId) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/applications/${internalId}/status`, payload);
      setApplication(data.application ?? data);
      return data;
    } finally {
      setSaving(false);
    }
  }

  // Submit the application with all form data
  async function submitApplication(formData) {
    if (!internalId) throw new Error('No application to submit');
    setSaving(true);
    try {
      const payload = { status: 'submitted' };
      if (formData !== undefined) payload.form_data = formData;
      const { data } = await api.patch(`/applications/${internalId}/status`, payload);
      setApplication(data.application ?? data);
      return data;
    } finally {
      setSaving(false);
    }
  }

  return {
    application,
    loading,
    saving,
    error,
    refetch: fetch,
    createApplication,
    updateApplication,
    submitApplication,
  };
}
