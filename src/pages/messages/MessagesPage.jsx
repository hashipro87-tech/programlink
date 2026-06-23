// MessagesPage.jsx — Full messaging inbox
// Two-pane layout: thread list on the left, message view on the right.
// Coordinators get a "New Message" button with broadcast option.

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Plus, X, Users, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useThreads, useThread } from '../../hooks/useMessages';
import api from '../../services/api';

// ── Role badge colors ──────────────────────────────────────────────────────
const ROLE_COLORS = {
  sponsor:     'bg-purple-100 text-purple-700',
  coordinator: 'bg-brand-100 text-brand-700',
  kitchen:     'bg-orange-100 text-orange-700',
  site:        'bg-green-100 text-green-700',
  delivery:    'bg-yellow-100 text-yellow-700',
};

// ── Single thread list item ───────────────────────────────────────────────
function ThreadItem({ thread, isActive, onClick }) {
  const unread = parseInt(thread.unread_count, 10) || 0;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50
                  transition-colors flex items-start gap-3
                  ${isActive ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
            {thread.subject || 'No subject'}
          </p>
          {thread.last_message_at && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {new Date(thread.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        {thread.related_org_name && (
          <p className="text-xs text-brand-600 mt-0.5">{thread.related_org_name}</p>
        )}
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {thread.last_message_sender && `${thread.last_message_sender}: `}
          {thread.last_message || 'No messages yet'}
        </p>
      </div>
      {unread > 0 && (
        <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold
                         flex items-center justify-center flex-shrink-0 mt-0.5">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

// ── Individual message bubble ─────────────────────────────────────────────
function MessageBubble({ message, currentUserId }) {
  const isMine = message.sender_id === currentUserId;
  return (
    <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                       ${ROLE_COLORS[message.sender_role] || 'bg-gray-100 text-gray-600'}`}>
        {message.sender_name?.charAt(0).toUpperCase()}
      </div>
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`flex items-center gap-2 text-xs text-gray-500 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="font-medium text-gray-700">{message.sender_name}</span>
          <span>{new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          {message.is_broadcast && (
            <span className="flex items-center gap-0.5 text-purple-600">
              <Users className="w-3 h-3" /> Broadcast
            </span>
          )}
        </div>
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMine
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
        }`}>
          {message.body}
        </div>
      </div>
    </div>
  );
}

// ── Thread view pane ──────────────────────────────────────────────────────
function ThreadView({ threadId, onClose }) {
  const { user } = useAuth();
  const { thread, messages, loading, sendMessage: reply } = useThread(threadId);
  const [replyText, setReplyText] = useState('');
  const [sending,   setSending]   = useState(false);
  const bottomRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await reply(replyText.trim());
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900">{thread?.subject || 'No subject'}</p>
          {thread?.related_org_name && (
            <p className="text-xs text-brand-600 mt-0.5">{thread.related_org_name}</p>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No messages yet — start the conversation.</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} currentUserId={user?.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Type a reply… (Ctrl+Enter to send)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg
                       disabled:opacity-50 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">Ctrl+Enter to send</p>
      </div>
    </div>
  );
}

// ── New Thread modal ──────────────────────────────────────────────────────
// Fetches real users from /api/users so you can actually address a message.
function NewThreadModal({ onClose, onCreate }) {
  const [subject,    setSubject]    = useState('');
  const [body,       setBody]       = useState('');
  const [sending,    setSending]    = useState(false);
  const [error,      setError]      = useState('');

  // User search state
  const [allUsers,    setAllUsers]    = useState([]);
  const [userSearch,  setUserSearch]  = useState('');
  const [selected,    setSelected]    = useState([]); // array of user objects

  // Load users once on mount
  useEffect(() => {
    api.get("/users").then(({ data }) => setAllUsers(data.users ?? data ?? [])).catch(() => {});
  }, []);

  const filtered = allUsers.filter((u) =>
    (u.name + ' ' + u.email + ' ' + (u.org_name ?? '')).toLowerCase().includes(userSearch.toLowerCase())
  ).slice(0, 8);

  const toggleUser = (u) => {
    setSelected((prev) =>
      prev.find((s) => s.id === u.id) ? prev.filter((s) => s.id !== u.id) : [...prev, u]
    );
  };

  const handleSend = async () => {
    if (!body.trim())        { setError('Message body is required'); return; }
    if (!selected.length)    { setError('Select at least one recipient'); return; }
    setSending(true);
    setError('');
    try {
      await onCreate(subject, body, selected.map((u) => u.id), undefined, undefined);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const ROLE_COLORS = {
    sponsor: 'bg-violet-100 text-violet-700', coordinator: 'bg-blue-100 text-blue-700',
    kitchen: 'bg-orange-100 text-orange-700', site: 'bg-green-100 text-green-700',
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">New Message</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          {/* Recipient picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To <span className="text-red-500">*</span>
            </label>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selected.map((u) => (
                  <span key={u.id} className="flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium px-2 py-1 rounded-full">
                    {u.name}
                    <button onClick={() => toggleUser(u)} className="text-brand-400 hover:text-brand-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, or org…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* User list */}
            {userSearch && (
              <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">No users found</p>
                ) : filtered.map((u) => {
                  const isSelected = !!selected.find((s) => s.id === u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u)}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${isSelected ? 'bg-brand-50' : ''}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500">{u.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.org_name ?? u.email}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                      {isSelected && <span className="text-brand-600 text-xs font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this message about?"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Write your message…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!body.trim() || !selected.length || sending}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending…' : `Send${selected.length > 1 ? ` (${selected.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { threads, loading, error, createThread } = useThreads();
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [showCompose,    setShowCompose]    = useState(false);

  // Auto-open first thread if any exist
  useEffect(() => {
    if (!activeThreadId && threads.length) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  const totalUnread = threads.reduce((sum, t) => sum + (parseInt(t.unread_count, 10) || 0), 0);

  return (
    <div className="flex h-[calc(100vh-4rem)] sm:h-[calc(100vh-6rem)] gap-0 -mx-4 -mb-4 sm:-m-8 overflow-hidden mt-12 sm:mt-0">
      {/* ── Left: Thread list ──────────────────────────────────────────── */}
      <div className={`${activeThreadId ? "hidden sm:flex" : "flex"} w-full sm:w-80 flex-shrink-0 border-r border-gray-200 flex-col bg-white`}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-gray-900">Messages</h1>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-600 text-white rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            title="New message"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 p-4 text-center">{error?.message ?? 'Failed to load messages'}</p>
          ) : threads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No messages yet.</p>
              <button
                onClick={() => setShowCompose(true)}
                className="mt-3 text-xs text-brand-600 hover:underline"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            threads.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isActive={activeThreadId === thread.id}
                onClick={() => setActiveThreadId(thread.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right: Thread view ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {activeThreadId ? (
          <ThreadView
            key={activeThreadId}
            threadId={activeThreadId}
            onClose={() => setActiveThreadId(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 text-sm">Select a conversation to read it</p>
            <button
              onClick={() => setShowCompose(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
                         text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Message
            </button>
          </div>
        )}
      </div>

      {/* Compose modal */}
      {showCompose && (
        <NewThreadModal
          onClose={() => setShowCompose(false)}
          onCreate={createThread}
        />
      )}
    </div>
  );
}
