// TasksPage — Org-wide task management for all roles
import { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Plus, X, Circle, CheckCircle2, Clock, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import api from '../../services/api';

const PRIORITY_META = {
  urgent: { label: 'Urgent', bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  high:   { label: 'High',   bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  medium: { label: 'Medium', bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  low:    { label: 'Low',    bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
};

const STATUS_META = {
  pending:     { label: 'Pending',     icon: Circle,        color: 'text-gray-400'   },
  in_progress: { label: 'In Progress', icon: Clock,         color: 'text-blue-500'   },
  completed:   { label: 'Completed',   icon: CheckCircle2,  color: 'text-green-500'  },
  cancelled:   { label: 'Cancelled',   icon: X,             color: 'text-gray-400'   },
};

const CATEGORY_META = {
  compliance:  { label: 'Compliance',   color: 'text-amber-700',  bg: 'bg-amber-50'  },
  documents:   { label: 'Documents',    color: 'text-blue-700',   bg: 'bg-blue-50'   },
  meal_counts: { label: 'Meal Counts',  color: 'text-green-700',  bg: 'bg-green-50'  },
  claims:      { label: 'Claims',       color: 'text-brand-700',  bg: 'bg-brand-50'  },
  inspection:  { label: 'Inspection',   color: 'text-purple-700', bg: 'bg-purple-50' },
  general:     { label: 'General',      color: 'text-gray-600',   bg: 'bg-gray-100'  },
};

const EMPTY_FORM = {
  title: '', description: '', due_date: '', priority: 'medium',
  status: 'pending', category: 'general', assigned_to: '',
};

function isOverdue(task) {
  if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') return false;
  return new Date(task.due_date) < new Date(new Date().toDateString());
}

export default function TasksPage() {
  const [tasks, setTasks]         = useState([]);
  const [users, setUsers]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setStatus] = useState('');
  const [filterPriority, setPri]  = useState('');
  const [filterCat, setCat]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 200 });
      if (filterStatus)   params.set('status', filterStatus);
      if (filterPriority) params.set('priority', filterPriority);
      if (filterCat)      params.set('category', filterCat);

      const [taskRes, userRes] = await Promise.all([
        api.get(`/tasks?${params}`),
        api.get('/users?limit=100').catch(() => ({ data: { users: [] } })),
      ]);

      setTasks(taskRes.data.tasks || []);
      setTotal(taskRes.data.total || 0);
      setUsers(userRes.data.users || userRes.data || []);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, filterCat]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
    setError('');
  }

  function openEdit(task) {
    setEditing(task);
    setForm({
      title:       task.title || '',
      description: task.description || '',
      due_date:    task.due_date ? task.due_date.slice(0, 10) : '',
      priority:    task.priority || 'medium',
      status:      task.status || 'pending',
      category:    task.category || 'general',
      assigned_to: task.assigned_to || '',
    });
    setShowModal(true);
    setError('');
  }

  async function quickStatus(task, newStatus) {
    try {
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      load();
    } catch { /* silent */ }
  }

  async function save() {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/tasks/${editing.id}`, form);
      } else {
        await api.post('/tasks', form);
      }
      setShowModal(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      load();
    } catch { /* silent */ }
  }

  // Group tasks
  const pending    = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completed  = tasks.filter(t => t.status === 'completed' || t.status === 'cancelled');
  const overdueCount = pending.filter(isOverdue).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track important to-do's so nothing falls through the cracks</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',     value: total,                                          color: 'text-gray-900' },
          { label: 'Open',      value: pending.length,                                 color: 'text-blue-600' },
          { label: 'Overdue',   value: overdueCount,                                   color: overdueCount > 0 ? 'text-red-600' : 'text-gray-400' },
          { label: 'Completed', value: completed.length,                               color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-brand-400"
          value={filterStatus} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-brand-400"
          value={filterPriority} onChange={e => setPri(e.target.value)}>
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-brand-400"
          value={filterCat} onChange={e => setCat(e.target.value)}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {(filterStatus || filterPriority || filterCat) && (
          <button onClick={() => { setStatus(''); setPri(''); setCat(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tasks yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first task to keep the team on track</p>
          <button onClick={openAdd} className="btn-primary mt-4 mx-auto">Add Task</button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Open tasks */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Open · {pending.length}
              </h2>
              <div className="space-y-2">
                {pending.map(task => <TaskRow key={task.id} task={task} onEdit={openEdit} onDelete={deleteTask} onStatus={quickStatus} />)}
              </div>
            </div>
          )}

          {/* Completed tasks */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Completed · {completed.length}
              </h2>
              <div className="space-y-2 opacity-60">
                {completed.map(task => <TaskRow key={task.id} task={task} onEdit={openEdit} onDelete={deleteTask} onStatus={quickStatus} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Task' : 'Add Task'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                <input className="input w-full" placeholder="What needs to get done?"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea className="input w-full h-20 resize-none" placeholder="Optional details…"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                  <input type="date" className="input w-full"
                    value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                  <select className="input w-full" value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select className="input w-full" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select className="input w-full" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {users.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assign To</label>
                  <select className="input w-full" value={form.assigned_to}
                    onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onEdit, onDelete, onStatus }) {
  const pm  = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const sm  = STATUS_META[task.status]     || STATUS_META.pending;
  const cm  = CATEGORY_META[task.category];
  const overdue = isOverdue(task);
  const Icon = sm.icon;

  return (
    <div className={`card p-4 flex items-start gap-3 hover:shadow-sm transition-shadow ${overdue ? 'border-red-200' : ''}`}>
      {/* Quick complete toggle */}
      <button
        onClick={() => onStatus(task, task.status === 'completed' ? 'pending' : 'completed')}
        className={`mt-0.5 flex-shrink-0 ${sm.color} hover:opacity-70 transition-opacity`}
      >
        <Icon className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${pm.bg} ${pm.text}`}>
            {pm.label}
          </span>
          {cm && (
            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${cm.bg} ${cm.color}`}>
              {cm.label}
            </span>
          )}
          {overdue && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
              <AlertCircle className="w-3 h-3" /> Overdue
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
          {task.due_date && (
            <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
          )}
          {task.assigned_to_name && (
            <span>→ {task.assigned_to_name}</span>
          )}
          {task.created_by_name && (
            <span>by {task.created_by_name}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(task)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
