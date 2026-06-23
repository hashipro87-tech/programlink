import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const errMsg = (err) => err?.response?.data?.error ?? err?.message ?? 'Something went wrong';

export function useThreads() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchThreads = useCallback(() => {
    api.get('/messages/threads')
      .then(({ data }) => setThreads(data.threads ?? data ?? []))
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false));
  }, []);

  // Initial fetch + poll every 15 seconds for new threads/unread counts
  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 15000);
    return () => clearInterval(interval);
  }, [fetchThreads]);

  async function createThread(subject, body, recipientIds, _unused1, _unused2) {
    const { data } = await api.post('/messages/threads', {
      subject,
      body,
      recipient_ids: recipientIds,
    });
    setThreads((prev) => [data.thread ?? data, ...prev]);
    return data;
  }

  return { threads, loading, error, refetch: fetchThreads, createThread };
}

export function useThread(threadId) {
  const [thread, setThread]     = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const lastCountRef            = useRef(0);

  const fetchMessages = useCallback((silent = false) => {
    if (!threadId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    api.get(`/messages/threads/${threadId}`)
      .then(({ data }) => {
        setThread(data.thread ?? null);
        const incoming = data.messages ?? [];
        // Only update if we have new messages (avoids scroll-jump on poll)
        if (incoming.length !== lastCountRef.current) {
          lastCountRef.current = incoming.length;
          setMessages(incoming);
        }
      })
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false));
  }, [threadId]);

  // Initial fetch
  useEffect(() => { fetchMessages(false); }, [fetchMessages]);

  // Poll every 5 seconds for new messages
  useEffect(() => {
    if (!threadId) return;
    const interval = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(interval);
  }, [threadId, fetchMessages]);

  async function sendMessage(body) {
    const { data } = await api.post(`/messages/threads/${threadId}/reply`, { body });
    const newMsg = data.message ?? data;
    setMessages((prev) => {
      lastCountRef.current = prev.length + 1;
      return [...prev, newMsg];
    });
    return data;
  }

  return { thread, messages, loading, error, refetch: fetchMessages, sendMessage };
}
