// MenuCyclesPage.jsx — reusable rotating menu cycle library
// Sponsors build cycles (Fall Cycle = 4 weeks), assign menus to each week,
// then apply cycles to the real calendar with a start + end date.
import { useState, useEffect } from 'react';
import {
  FolderOpen, Plus, Calendar, ChevronDown, ChevronRight,
  Trash2, CheckCircle2, Edit2, X, AlertTriangle, Clock,
  Link2, Unlink, ArrowRight,
} from 'lucide-react';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

function weekRange(start, end) {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end   + 'T00:00:00Z');
  const weeks = Math.ceil((e - s) / (7 * 86400000));
  return `${weeks} week${weeks !== 1 ? 's' : ''}`;
}

function isActive(schedule) {
  const today = new Date().toISOString().split('T')[0];
  return schedule.start_date <= today && schedule.end_date >= today;
}

// ── Apply Schedule Modal ───────────────────────────────────────────────────────
function ApplyModal({ cycle, onClose, onApplied }) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState('');
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const handleApply = async () => {
    if (!startDate || !endDate) { setError('Start and end dates are required.'); return; }
    if (endDate < startDate)    { setError('End date must be after start date.'); return; }
    setSaving(true); setError('');
    try {
      await api.post(`/menu-cycles/${cycle.id}/schedules`, { start_date: startDate, end_date: endDate, notes });
      onApplied();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply schedule.');
    } finally {
      setSaving(false);
    }
  };

  // Preview: how many times each week repeats
  const cycleWeeks = cycle.week_count || 4;
  const totalWeeks = startDate && endDate
    ? Math.ceil((new Date(endDate + 'T00:00:00Z') - new Date(startDate + 'T00:00:00Z')) / (7 * 86400000))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Apply {cycle.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{cycleWeeks}-week cycle on the calendar</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">End Date</label>
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          {totalWeeks > 0 && (
            <div className="bg-brand-50 rounded-xl px-4 py-3 text-sm text-brand-700">
              <p className="font-semibold">{totalWeeks} weeks scheduled</p>
              <p className="text-xs text-brand-500 mt-0.5">
                Cycle repeats {Math.ceil(totalWeeks / cycleWeeks)} time{Math.ceil(totalWeeks / cycleWeeks) !== 1 ? 's' : ''}
                &nbsp;·&nbsp; {cycleWeeks} weeks per rotation
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Fall semester 2026"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {error && <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleApply} disabled={saving || !startDate || !endDate}
            className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-40">
            {saving ? 'Applying…' : 'Apply to Calendar →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Cycle Modal ────────────────────────────────────────────────────────────
function NewCycleModal({ onClose, onCreated }) {
  const [name,      setName]      = useState('');
  const [weekCount, setWeekCount] = useState(4);
  const [desc,      setDesc]      = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Cycle name is required.'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/menu-cycles', { name: name.trim(), description: desc, week_count: weekCount });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create cycle.');
    } finally {
      setSaving(false);
    }
  };

  const PRESETS = [
    { name: 'Fall Cycle',    weeks: 4 },
    { name: 'Winter Cycle',  weeks: 4 },
    { name: 'Spring Cycle',  weeks: 4 },
    { name: 'Summer Feeding', weeks: 2 },
    { name: 'Emergency Menu', weeks: 1 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">New Menu Cycle</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick presets */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quick Start</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p.name}
                  onClick={() => { setName(p.name); setWeekCount(p.weeks); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    name === p.name ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Cycle Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fall Cycle"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Number of Weeks</label>
            <div className="flex items-center gap-3">
              {[1,2,3,4,5,6,8,12].map(n => (
                <button key={n} onClick={() => setWeekCount(n)}
                  className={`w-9 h-9 text-sm rounded-xl border font-semibold transition-colors ${
                    weekCount === n ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description (optional)</label>
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="e.g. Used August through October"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {error && <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={saving || !name.trim()}
            className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-40">
            {saving ? 'Creating…' : `Create ${weekCount}-Week Cycle`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Week Row ───────────────────────────────────────────────────────────────────
function WeekRow({ week, menus, onAssign, onUnassign }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = menus.filter(m =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-brand-600">{week.week_number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{week.label || `Week ${week.week_number}`}</p>
          {week.menu_name
            ? <p className="text-xs text-green-600 font-medium">✓ {week.menu_name}</p>
            : <p className="text-xs text-gray-400 italic">No menu assigned</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {week.menu_id && (
            <button onClick={() => onUnassign(week.week_number)}
              className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 flex items-center gap-1">
              <Unlink className="w-3 h-3" /> Unassign
            </button>
          )}
          <button onClick={() => setOpen(o => !o)}
            className="text-xs text-brand-600 font-semibold px-2 py-1 rounded-lg hover:bg-brand-50 flex items-center gap-1">
            <Link2 className="w-3 h-3" /> {week.menu_id ? 'Change' : 'Assign menu'}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search menus…" autoFocus
            className="w-full mb-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No menus found. Build menus in the Menu Builder first.</p>
            )}
            {filtered.map(m => (
              <button key={m.id} onClick={() => { onAssign(week.week_number, m.id); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white hover:shadow-sm transition-all ${
                  week.menu_id === m.id ? 'bg-white ring-1 ring-brand-300 text-brand-700 font-semibold' : 'text-gray-700'
                }`}>
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="flex-1 truncate">{m.name || `Week of ${m.week_start?.slice(0, 10)}`}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{m.week_start?.slice(0, 10)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cycle Card ─────────────────────────────────────────────────────────────────
function CycleCard({ cycle, menus, onSelect, selected, onDelete, onApply, onScheduleRemove, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const assignedCount = (cycle.weeks || []).filter(w => w.menu_id).length;
  const totalWeeks    = cycle.week_count || 0;
  const pct           = totalWeeks ? Math.round((assignedCount / totalWeeks) * 100) : 0;
  const activeScheds  = (cycle.schedules || []).filter(isActive);
  const hasActive     = activeScheds.length > 0;

  const handleAssign = async (weekNum, menuId) => {
    setAssigning(true);
    try {
      await api.put(`/menu-cycles/${cycle.id}/weeks/${weekNum}`, { menu_id: menuId });
      onRefresh();
    } catch { /* silent */ } finally { setAssigning(false); }
  };

  const handleUnassign = async (weekNum) => {
    setAssigning(true);
    try {
      await api.put(`/menu-cycles/${cycle.id}/weeks/${weekNum}`, { menu_id: null });
      onRefresh();
    } catch { /* silent */ } finally { setAssigning(false); }
  };

  return (
    <div className={`card overflow-hidden transition-all ${selected ? 'ring-2 ring-brand-400' : ''}`}>
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            hasActive ? 'bg-green-50' : 'bg-brand-50'
          }`}>
            <FolderOpen className={`w-5 h-5 ${hasActive ? 'text-green-600' : 'text-brand-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-gray-900">{cycle.name}</h3>
              {hasActive && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                  Active
                </span>
              )}
            </div>
            {cycle.description && <p className="text-xs text-gray-500 mt-0.5">{cycle.description}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>{totalWeeks} weeks</span>
              <span>·</span>
              <span>{assignedCount}/{totalWeeks} menus assigned</span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-brand-400'}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {expanded ? 'Hide weeks' : 'Manage weeks'}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => onApply(cycle)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors">
              <Calendar className="w-3.5 h-3.5" /> Apply to Calendar
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Delete?</span>
                <button onClick={() => onDelete(cycle.id)} className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 px-2 py-1 rounded-lg hover:bg-gray-100">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-gray-300 hover:text-red-400 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: week list */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-2 bg-gray-50">
          {assigning && <p className="text-xs text-gray-400">Saving…</p>}
          {(cycle.weeks || []).map(w => (
            <WeekRow key={w.week_number} week={w} menus={menus}
              onAssign={handleAssign} onUnassign={handleUnassign} />
          ))}
          {(!cycle.weeks || cycle.weeks.length === 0) && (
            <p className="text-xs text-gray-400 text-center py-4">No weeks — reload to see them.</p>
          )}
        </div>
      )}

      {/* Active schedules */}
      {(cycle.schedules || []).length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3 bg-white">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Scheduled</p>
          <div className="space-y-1.5">
            {cycle.schedules.map(s => (
              <div key={s.id} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
                isActive(s) ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'
              }`}>
                <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${isActive(s) ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`font-medium ${isActive(s) ? 'text-green-700' : 'text-gray-600'}`}>
                  {fmtDate(s.start_date)} → {fmtDate(s.end_date)}
                </span>
                <span className="text-gray-400">· {weekRange(s.start_date, s.end_date)}</span>
                {s.notes && <span className="text-gray-400 truncate ml-1">· {s.notes}</span>}
                <button onClick={() => onScheduleRemove(s.id)} className="ml-auto text-gray-300 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MenuCyclesPage() {
  const [cycles,   setCycles]   = useState([]);
  const [menus,    setMenus]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showNew,  setShowNew]  = useState(false);
  const [applyTarget, setApplyTarget] = useState(null); // cycle to apply

  const load = async () => {
    setLoading(true);
    try {
      const [cycRes, menuRes] = await Promise.all([
        api.get('/menu-cycles'),
        api.get('/menus?limit=200'),
      ]);
      setCycles(cycRes.data.cycles || []);
      setMenus(menuRes.data.menus || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/menu-cycles/${id}`);
      setCycles(prev => prev.filter(c => c.id !== id));
    } catch { alert('Failed to delete cycle.'); }
  };

  const handleScheduleRemove = async (scheduleId) => {
    try {
      await api.delete(`/menu-cycles/schedules/${scheduleId}`);
      load();
    } catch { alert('Failed to remove schedule.'); }
  };

  const activeCycles = cycles.filter(c => (c.schedules || []).some(isActive));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Cycles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Build reusable rotating menus — Fall Cycle, Winter Cycle, Summer Program.
            Apply once and the system knows what's for lunch every day.
          </p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> New Cycle
        </button>
      </div>

      {/* How it works — first visit callout */}
      {cycles.length === 0 && !loading && (
        <div className="card px-6 py-8 text-center mb-6">
          <FolderOpen className="w-10 h-10 text-brand-200 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Build your menu library</h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto mb-6">
            Instead of rebuilding menus every week, create a cycle once and schedule it for the whole semester.
            Production Records and Claims automatically know what's on the menu — no manual lookup.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6 text-left max-w-xl mx-auto">
            {[
              { step: '1', label: 'Create a cycle', desc: 'Fall Cycle · 4 weeks' },
              { step: '2', label: 'Assign menus', desc: 'Week 1 → Turkey Lunch menu' },
              { step: '3', label: 'Apply to calendar', desc: 'Aug 18 → Oct 31, repeating' },
            ].map(s => (
              <div key={s.step} className="bg-gray-50 rounded-xl p-4">
                <div className="w-6 h-6 bg-brand-600 text-white rounded-full text-xs font-bold flex items-center justify-center mb-2">{s.step}</div>
                <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl">
            <Plus className="w-4 h-4" /> Create Your First Cycle
          </button>
        </div>
      )}

      {/* Active now banner */}
      {activeCycles.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl mb-5">
          <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 animate-pulse" />
          <p className="text-sm font-semibold text-green-700">
            {activeCycles.length === 1
              ? `${activeCycles[0].name} is active now`
              : `${activeCycles.length} cycles are active now`}
          </p>
          <p className="text-xs text-green-600 ml-auto">
            Production Records and Claims pull menus from this cycle automatically
          </p>
        </div>
      )}

      {/* Cycle list */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Loading cycles…</div>
      ) : (
        <div className="space-y-4">
          {cycles.map(cycle => (
            <CycleCard
              key={cycle.id}
              cycle={cycle}
              menus={menus}
              onDelete={handleDelete}
              onApply={c => setApplyTarget(c)}
              onScheduleRemove={handleScheduleRemove}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {/* USDA note */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mt-6">
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          USDA 7 CFR Part 226 — menus must be approved before the first day of service and retained for 3 years.
          Cycle menus count as pre-approved for the dates they're scheduled.
        </p>
      </div>

      {/* Modals */}
      {showNew && (
        <NewCycleModal
          onClose={() => setShowNew(false)}
          onCreated={cycle => { setCycles(prev => [cycle, ...prev]); load(); }}
        />
      )}
      {applyTarget && (
        <ApplyModal
          cycle={applyTarget}
          onClose={() => setApplyTarget(null)}
          onApplied={load}
        />
      )}
    </div>
  );
}
