// SponsorMessaging.jsx — Replaces the empty messages card with a real messaging UI.
// Kitchen staff can send a message to their sponsor via a modal.
// Shows the last 3 messages in a clean chat-bubble style.

import { useState, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import api from '../../../services/api';

// Converts an ISO timestamp to a human-readable relative label
function timeAgo(ts) {
  const diffMins = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diffMins < 1)    return 'just now';
  if (diffMins < 60)   return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function SponsorMessaging() {
  const [messages,   setMessages]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [text,       setText]       = useState('');
  const [sending,    setSending]    = useState(false);
  const [sendError,  setSendError]  = useState('');

  useEffect(() => {
    api.get('/messages')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data.messages ?? []);
        setMessages(list);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  const openModal = () => {
    setText('');
    setSendError('');
    setShowModal(true);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    setSendError('');
    try {
      const { data } = await api.post('/messages', { body: text.trim() });
      // Append the new message to the list
      const newMsg = data.message ?? {
        id:        Date.now(),
        sender:    'Me',
        body:      text.trim(),
        created_at: new Date().toISOString(),
        from_me:   true,
      };
      setMessages((m) => [...m, newMsg]);
      setText('');
      setShowModal(false);
    } catch (err) {
      setSendError(err.response?.data?.error ?? 'Failed to send — please try again.');
    } finally {
      setSending(false);
    }
  };

  // Detect whether a message came from this kitchen (vs. sponsor reply)
  const isFromMe = (msg) => msg.from_me ?? msg.sender_role !== 'sponsor';

  return (
    <div className="card mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Sponsor Messages</h2>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Message Sponsor
        </button>
      </div>

      {/* Message list */}
      <div className="px-6 py-4">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading messages…</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Questions? Send your sponsor a message directly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.slice(-3).map((msg) => {
              const fromMe = isFromMe(msg);
              return (
                <div key={msg.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    fromMe
                      ? 'bg-brand-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.body ?? msg.message}</p>
                    <p className={`text-[11px] mt-1.5 ${fromMe ? 'text-brand-200' : 'text-gray-400'}`}>
                      {fromMe ? 'You' : (msg.sender_name ?? msg.sender ?? 'Sponsor')} · {timeAgo(msg.created_at ?? msg.ts)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose modal — slides up on mobile, centered on desktop */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Message Your Sponsor</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message here…"
                rows={4}
                autoFocus
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {sendError && (
                <p className="text-xs text-red-500 mt-2">{sendError}</p>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={sending || !text.trim()}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
