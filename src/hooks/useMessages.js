import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useThreads() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/messages/threads')
      .then(({ data }) => setThreads(data.threads ?? data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function createThread(payload) {
    const { data } = await api.post('/messages/threads', payload);
    setThreads((prev) => [data.thread ?? data, ...prev]);
    return data;
  }

  return { threads, loading, error, refetch: fetch, createThread };
}

export function useThread(threadId) {
  const [thread, setThread]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(() => {
    if (!threadId) { setLoading(false); return; }
    setLoading(true);
    api.get(`/messages/threads/${threadId}`)
      .then(({ data }) => {
        setThread(data.thread ?? null);
        setMessages(data.messages ?? []);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [threadId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function sendMessage(body) {
    const { data } = await api.post(`/messages/threads/${threadId}/messages`, { body });
    setMessages((prev) => [...prev, data.message ?? data]);
    return data;
  }

  return { thread, messages, loading, error, refetch: fetch, sendMessage };
}
