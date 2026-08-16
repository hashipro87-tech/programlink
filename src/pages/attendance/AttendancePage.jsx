// AttendancePage.jsx — Task #177: Individual Child Attendance Tracking
// Per-USDA 7 CFR 226.10(d): document individual child names present each day.
// Sponsor: pick site + date → roster loads → check present/meals → save
// Site: date → roster loads automatically → check present/meals → save
// On save: CACFPLink auto-writes meal_counts from the per-child totals.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Save, RefreshCw, AlertTriangle, Info, UserCheck,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEALS = [
  { key: 'had_breakfast', label: 'Breakfast', short: 'BK', color: 'amber'   },
  { key: 'had_lunch',     label: 'Lunch',     short: 'LN', color: 'green'   },
  { key: 'had_snack',     label: 'Snack',     short: 'SK', color: 'blue'    },
  { key: 'had_supper',    label: 'Supper',    short: 'SP', color: 'purple'  },
];

const MEAL_COLOR = {
  amber:  { chip: 'bg-amber-100 text-amber-700',  check: 'accent-amber-500'  },
  green:  { chip: 'bg-green-100 text-green-700',  check: 'accent-green-500'  },
  blue:   { chip: 'bg-blue-100 text-blue-700',    check: 'accent-blue-500'   },
  purple: { chip: 'bg-purple-100 text-purple-700', check: 'accent-purple-500' },
};

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function prevDay(iso) {
  const d = new Date(iso); d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function nextDay(iso) {
  const d = new Date(iso); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ─── Summary bar ─────────────────────────────────────────────────────────────

function SummaryBar({ summary }) {
  const { total, present, breakfast, lunch, snack, supper } = summary;
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-indigo-600" />
        <span className="text-sm font-bold text-indigo-900">
          {present} / {total} Present
        </span>
      </div>
      <div className="w-px h-5 bg-indigo-200 hidden sm:block" />
      {MEALS.map(m => {
        const count = { had_breakfast: breakfast, had_lunch: lunch, had_snack: snack, had_supper: supper }[m.key];
        const cfg   = MEAL_COLOR[m.color];
        return (
          <div key={m.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.chip}`}>
            <span>{m.short}</span>
            <span>{count}</span>
          </div>
        );
      })}
      <p className="text-xs text-indigo-500 ml-auto hidden sm:block">
        Auto-posts to Meal Counts on save
      </p>
    </div>
  );
}

// ─── Child row ────────────────────────────────────────────────────────────────

function ChildRow({ child, onChange }) {
  const { id, name, is_present } = child;

  function togglePresent() {
    const nowPresent = !is_present;
    onChange(id, {
      is_present:    nowPresent,
      had_breakfast: nowPresent ? child.had_breakfast : false,
      had_lunch:     nowPresent ? child.had_lunch     : false,
      had_snack:     nowPresent ? child.had_snack     : false,
      had_supper:    nowPresent ? child.had_supper     : false,
    });
  }

  function toggleMeal(mealKey) {
    onChange(id, { [mealKey]: !child[mealKey] });
  }

  return (
    <tr className={`border-b border-gray-100 transition-colors ${is_present ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'}`}>
      {/* Name */}
      <td className="py-2.5 pl-4 pr-2">
        <span className={`text-sm font-medium ${is_present ? 'text-gray-900' : 'text-gray-400'}`}>
          {name}
        </span>
      </td>

      {/* Present toggle */}
      <td className="py-2.5 px-3 text-center">
        <button
          onClick={togglePresent}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            is_present
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-600 hover:bg-red-200'
          }`}
        >
          {is_present
            ? <><CheckCircle className="w-3.5 h-3.5" /> Present</>
            : <><XCircle    className="w-3.5 h-3.5" /> Absent</>
          }
        </button>
      </td>

      {/* Meal checkboxes */}
      {MEALS.map(m => (
        <td key={m.key} className="py-2.5 px-4 text-center">
          <input
            type="checkbox"
            checked={!!child[m.key]}
            disabled={!is_present}
            onChange={() => toggleMeal(m.key)}
            className={`w-4 h-4 rounded cursor-pointer disabled:opacity-30 ${MEAL_COLOR[m.color].check}`}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSponsor = user?.role === 'sponsor' || user?.role === 'admin';

  const [sites,    setSites]    = useState([]);
  const [siteId,   setSiteId]   = useState('');
  const [siteName, setSiteName] = useState('');
  const [date,     setDate]     = useState(todayISO());

  // children is a map: child_id → child record (with is_present + meal flags)
  const [children, setChildren] = useState({});
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');
  const [hasRecord, setHasRecord] = useState(false);
  const [search,   setSearch]   = useState('');

  // Load site list for sponsor
  useEffect(() => {
    if (!isSponsor) return;
    api.get('/organizations?type=site&limit=200')
      .then(r => {
        const list = r.data?.organizations ?? r.data ?? [];
        setSites(list.filter(s => s.status === 'active'));
        if (list.length > 0) {
          setSiteId(list[0].id);
          setSiteName(list[0].name);
        }
      })
      .catch(() => {});
  }, [isSponsor]);

  // Load roster whenever site/date changes
  const loadRoster = useCallback(() => {
    const orgId = isSponsor ? siteId : user?.organizationId;
    if (!orgId) return;

    setLoading(true);
    setError('');
    setSaved(false);

    const params = new URLSearchParams({ org_id: orgId, date });
    api.get(`/attendance/roster?${params}`)
      .then(r => {
        const map = {};
        for (const c of r.data.children) map[c.id] = { ...c };
        setChildren(map);
        setHasRecord(r.data.has_record);
      })
      .catch(() => setError('Failed to load roster.'))
      .finally(() => setLoading(false));
  }, [siteId, date, isSponsor, user?.organizationId]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  // Derived summary
  const childList = Object.values(children);
  const summary = {
    total:     childList.length,
    present:   childList.filter(c => c.is_present).length,
    breakfast: childList.filter(c => c.had_breakfast).length,
    lunch:     childList.filter(c => c.had_lunch).length,
    snack:     childList.filter(c => c.had_snack).length,
    supper:    childList.filter(c => c.had_supper).length,
  };

  const filtered = search.trim()
    ? childList.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : childList;

  function handleChange(childId, updates) {
    setChildren(prev => ({ ...prev, [childId]: { ...prev[childId], ...updates } }));
    setSaved(false);
  }

  // Mark all present + auto-check all meals
  function markAllPresent() {
    setChildren(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], is_present: true, had_breakfast: true, had_lunch: true, had_snack: true, had_supper: false };
      }
      return next;
    });
  }

  // Mark all absent
  function markAllAbsent() {
    setChildren(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], is_present: false, had_breakfast: false, had_lunch: false, had_snack: false, had_supper: false };
      }
      return next;
    });
  }

  // Toggle entire meal column
  function toggleMealAll(mealKey) {
    const presentKids = childList.filter(c => c.is_present);
    const allChecked  = presentKids.every(c => c[mealKey]);
    setChildren(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (next[id].is_present) {
          next[id] = { ...next[id], [mealKey]: !allChecked };
        }
      }
      return next;
    });
  }

  async function handleSave() {
    const orgId = isSponsor ? siteId : user?.organizationId;
    if (!orgId) return;

    setSaving(true);
    setError('');

    const records = childList.map(c => ({
      child_id:      c.id,
      is_present:    c.is_present,
      had_breakfast: c.had_breakfast,
      had_lunch:     c.had_lunch,
      had_snack:     c.had_snack,
      had_supper:    c.had_supper,
    }));

    try {
      await api.post('/attendance/roster', { org_id: orgId, date, records });
      setSaved(true);
      setHasRecord(true);
    } catch {
      setError('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Record individual child attendance · Meal counts auto-post on save
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || childList.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            saved
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
          }`}
        >
          {saving ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle className="w-4 h-4" /> Saved · Meal Counts Updated</>
          ) : (
            <><Save className="w-4 h-4" /> Save Daily Attendance</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* Site picker — sponsor only */}
        {isSponsor && (
          <select
            value={siteId}
            onChange={e => {
              const s = sites.find(x => x.id === e.target.value);
              setSiteId(e.target.value);
              setSiteName(s?.name ?? '');
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        {/* Date navigator */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
          <button
            onClick={() => setDate(prevDay(date))}
            className="p-1 hover:bg-gray-100 rounded-md text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={todayISO()}
            className="text-sm font-medium text-gray-800 border-none outline-none bg-transparent"
          />
          <button
            onClick={() => setDate(nextDay(date))}
            disabled={date >= todayISO()}
            className="p-1 hover:bg-gray-100 rounded-md text-gray-500 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick actions */}
        <button
          onClick={markAllPresent}
          className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-100"
        >
          ✓ Mark All Present
        </button>
        <button
          onClick={markAllAbsent}
          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100"
        >
          ✕ Mark All Absent
        </button>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search child…"
          className="ml-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 w-44"
        />
      </div>

      {/* Date label */}
      <p className="text-sm text-gray-600 font-medium">
        {fmtDate(date)}
        {hasRecord && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" /> Already recorded
          </span>
        )}
      </p>

      {/* Summary bar */}
      {childList.length > 0 && <SummaryBar summary={summary} />}

      {/* Roster table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading roster…</p>
        </div>
      ) : childList.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No enrolled children found</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Children must be added and have approved enrollment forms before they appear here.
          </p>
          <button
            onClick={() => navigate(isSponsor ? '/dashboard/sponsor/children' : '/dashboard/site/enrollment')}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg"
          >
            {isSponsor ? 'Go to Child Roster' : 'Go to Enrollment'}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 pl-4 pr-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Child ({filtered.length})
                </th>
                <th className="py-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Present
                </th>
                {MEALS.map(m => (
                  <th key={m.key} className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleMealAll(m.key)}
                      title={`Toggle all ${m.label}`}
                      className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full hover:opacity-80 ${MEAL_COLOR[m.color].chip}`}
                    >
                      {m.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(child => (
                <ChildRow
                  key={child.id}
                  child={child}
                  onChange={handleChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer note */}
      {childList.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-gray-400 pt-1">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <p>
            Per USDA 7 CFR 226.10(d), individual child attendance records must be retained
            for 3 years. CACFPLink stores each child's daily presence and meal participation automatically.
            Clicking the column header toggles that meal for all present children.
          </p>
        </div>
      )}
    </div>
  );
}
