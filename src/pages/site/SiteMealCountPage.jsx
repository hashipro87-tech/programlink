// SiteMealCountPage.jsx — Unified Daily Record: one entry = attendance + meal counts.
// Spec: enter Children Present + per-meal counts → single Save → writes both tables.

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertTriangle, Copy, ChevronRight, Users } from 'lucide-react';
import api from '../../services/api';

function todayISO() { return new Date().toISOString().split('T')[0]; }

function fmtDate(iso) {
  if (!iso) return '';
  // Slice to YYYY-MM-DD in case Postgres returns a full ISO timestamp
  const clean = String(iso).slice(0, 10);
  const d = new Date(clean + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-600', activeColor: 'bg-orange-100 border-orange-400' },
  { key: 'lunch',     label: 'Lunch',     color: 'bg-green-50  border-green-200',  textColor: 'text-green-600',  activeColor: 'bg-green-100  border-green-400'  },
  { key: 'snack',     label: 'Snack',     color: 'bg-blue-50   border-blue-200',   textColor: 'text-blue-600',   activeColor: 'bg-blue-100   border-blue-400'   },
  { key: 'supper',    label: 'Supper',    color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-600', activeColor: 'bg-purple-100 border-purple-400' },
];

// Check if last N entries are all identical per-meal breakdowns
function detectPattern(history, days = 7) {
  const recent = [...history]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
  if (recent.length < days) return false;
  const first = recent[0];
  return recent.every(r =>
    r.breakfast_count === first.breakfast_count &&
    r.lunch_count     === first.lunch_count     &&
    r.snack_count     === first.snack_count     &&
    r.supper_count    === first.supper_count
  );
}

export default function SiteMealCountPage() {
  const today = todayISO();

  const [date,           setDate]           = useState(today);
  const [childrenPresent,setChildrenPresent] = useState('');   // total attendance for the day
  const [counts,         setCounts]         = useState({ breakfast: 0, lunch: 0, snack: 0, supper: 0 });
  const [saving,         setSaving]         = useState(false);
  const [toast,          setToast]          = useState(null);  // { msg, ok }
  const [history,        setHistory]        = useState([]);
  const [alreadySaved,   setAlreadySaved]   = useState(false);
  const [patternWarning, setPatternWarning] = useState(false);

  const attendanceRef = useRef(null);
  const mealRefs      = useRef([]);

  // ── Load history ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const month = today.slice(0, 7);
    Promise.all([
      api.get(`/meal-counts?month=${month}&limit=31`),
      api.get(`/attendance?month=${month}`),
    ]).then(([mealRes, attRes]) => {
      const rows    = mealRes.data.meal_counts ?? mealRes.data ?? [];
      const attRows = attRes.data.attendance ?? [];
      const attMap  = Object.fromEntries(attRows.map(r => [r.date?.slice(0,10), r.count]));

      // Merge attendance into history rows
      const merged = rows.map(r => ({
        ...r,
        children_present: attMap[r.date?.slice(0,10)] ?? null,
      }));
      setHistory(merged);

      // Pre-fill today if already submitted
      const todayRow = merged.find(r => r.date === today);
      if (todayRow) {
        setCounts({
          breakfast: todayRow.breakfast_count ?? 0,
          lunch:     todayRow.lunch_count     ?? 0,
          snack:     todayRow.snack_count     ?? 0,
          supper:    todayRow.supper_count    ?? 0,
        });
        if (todayRow.children_present !== null) {
          setChildrenPresent(String(todayRow.children_present));
        }
        setAlreadySaved(true);
      }

      // Pattern detection: last 7 days identical?
      setPatternWarning(detectPattern(merged, 7));
    }).catch(() => {});
  }, []);

  // Auto-focus attendance field
  useEffect(() => {
    setTimeout(() => attendanceRef.current?.focus(), 150);
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const present = parseInt(childrenPresent) || 0;

  // Which meals exceed the children present count?
  const violations = present > 0
    ? MEALS.filter(m => counts[m.key] > present && counts[m.key] > 0)
    : [];

  const canSubmit = () => {
    const total = counts.breakfast + counts.lunch + counts.snack + counts.supper;
    if (total === 0) return false;
    if (violations.length > 0) return false;
    return true;
  };

  // ── Copy yesterday ────────────────────────────────────────────────────────────
  const copyYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const row  = history.find(r => r.date === yStr);
    if (row) {
      setCounts({
        breakfast: row.breakfast_count ?? 0,
        lunch:     row.lunch_count     ?? 0,
        snack:     row.snack_count     ?? 0,
        supper:    row.supper_count    ?? 0,
      });
      if (row.children_present !== null) setChildrenPresent(String(row.children_present));
      showToast("Copied yesterday's record");
    } else {
      showToast('No entry found for yesterday', false);
    }
  };

  // ── Save Daily Record ─────────────────────────────────────────────────────────
  // One save → writes meal_counts + attendance_records
  const handleSubmit = async () => {
    const total = counts.breakfast + counts.lunch + counts.snack + counts.supper;
    if (total === 0) {
      showToast('Enter at least one meal count before saving', false);
      return;
    }
    if (violations.length > 0) {
      showToast(`${violations.map(m => m.label).join(', ')} exceed children present`, false);
      return;
    }

    setSaving(true);
    try {
      // 1. Write meal counts
      await api.post('/meal-counts', {
        date,
        breakfast_count: counts.breakfast,
        lunch_count:     counts.lunch,
        snack_count:     counts.snack,
        supper_count:    counts.supper,
        count_submitted: total,
      });

      // 2. Auto-write attendance (children present) — uses the same date
      if (present > 0) {
        await api.post('/attendance', { date, count: present });
      }

      // 3. Update local history
      const newRow = {
        date,
        breakfast_count:  counts.breakfast,
        lunch_count:      counts.lunch,
        snack_count:      counts.snack,
        supper_count:     counts.supper,
        count_submitted:  total,
        children_present: present || null,
      };
      const updatedHistory = [
        newRow,
        ...history.filter(r => r.date !== date),
      ];
      setHistory(updatedHistory);
      setAlreadySaved(date === today);

      // 4. Re-check pattern warning with updated history
      setPatternWarning(detectPattern(updatedHistory, 7));

      showToast(`✓ Daily record saved for ${fmtDate(date)}`);
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Failed to save — try again', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Load a history row into the form ─────────────────────────────────────────
  const loadHistoryRow = (r) => {
    setDate(r.date);
    setCounts({
      breakfast: r.breakfast_count ?? 0,
      lunch:     r.lunch_count     ?? 0,
      snack:     r.snack_count     ?? 0,
      supper:    r.supper_count    ?? 0,
    });
    setChildrenPresent(r.children_present !== null ? String(r.children_present) : '');
    setAlreadySaved(r.date === today);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const total = counts.breakfast + counts.lunch + counts.snack + counts.supper;

  // ── Keyboard: Enter moves focus down ─────────────────────────────────────────
  const onKeyDown = (idx) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx < MEALS.length - 1) mealRefs.current[idx + 1]?.focus();
      else handleSubmit();
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-24 sm:pb-6">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Record</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter attendance and meals served. One save updates everything.
        </p>
      </div>

      {/* ── Already saved banner ── */}
      {alreadySaved && date === today && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700">Today's record is saved. You can update it below.</p>
        </div>
      )}

      {/* ── 7-day pattern warning ── */}
      {patternWarning && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <span className="text-base flex-shrink-0 mt-0.5">🟡</span>
          <p className="text-xs font-medium text-amber-800">
            <span className="font-bold">Pattern detected:</span> Your attendance and meal counts have been identical for the past 7 days. Please verify these numbers were entered from your daily records — you're clear to save if they're accurate.
          </p>
        </div>
      )}

      {/* ── Date + Copy row ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              const d = e.target.value;
              setDate(d);
              const row = history.find(r => r.date === d);
              if (row) {
                loadHistoryRow(row);
              } else {
                setCounts({ breakfast: 0, lunch: 0, snack: 0, supper: 0 });
                setChildrenPresent('');
                setAlreadySaved(false);
              }
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          onClick={copyYesterday}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 mt-5"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy yesterday
        </button>
      </div>

      {/* ── Children Present ── */}
      <div className="rounded-2xl border-2 bg-indigo-50 border-indigo-200 p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-indigo-500" />
          <label className="text-xs font-bold uppercase tracking-wide text-indigo-600">
            Children Present Today
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setChildrenPresent(v => String(Math.max(0, (parseInt(v) || 0) - 1)))}
            className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-lg font-bold text-gray-600 flex-shrink-0"
          >−</button>
          <input
            ref={attendanceRef}
            type="number"
            min="0"
            value={childrenPresent}
            placeholder="0"
            onChange={(e) => setChildrenPresent(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); mealRefs.current[0]?.focus(); } }}
            className="flex-1 text-3xl font-bold text-center bg-transparent border-none outline-none min-w-0 text-indigo-700"
          />
          <button
            type="button"
            onClick={() => setChildrenPresent(v => String((parseInt(v) || 0) + 1))}
            className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-lg font-bold text-gray-600 flex-shrink-0"
          >+</button>
        </div>
        <p className="text-xs text-indigo-400 mt-2 text-center">
          No meal count can exceed this number
        </p>
      </div>

      {/* ── Meal count inputs ── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {MEALS.map(({ key, label, color, textColor, activeColor }, idx) => {
          const isViolation = present > 0 && counts[key] > present && counts[key] > 0;
          return (
            <div key={key} className={`rounded-2xl border-2 p-4 transition-colors ${isViolation ? 'bg-red-50 border-red-400' : color}`}>
              <label className={`block text-xs font-bold uppercase tracking-wide opacity-70 mb-1 ${isViolation ? 'text-red-600' : ''}`}>
                {label}
              </label>
              {isViolation && (
                <p className="text-[10px] font-bold text-red-600 mb-2">
                  ⚠ Exceeds {present} present
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCounts(c => ({ ...c, [key]: Math.max(0, c[key] - 1) }))}
                  className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-lg font-bold text-gray-600 flex-shrink-0"
                >−</button>
                <input
                  ref={(el) => (mealRefs.current[idx] = el)}
                  type="number"
                  min="0"
                  value={counts[key]}
                  onChange={(e) => setCounts(c => ({ ...c, [key]: Math.max(0, Number(e.target.value) || 0) }))}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={onKeyDown(idx)}
                  className={`flex-1 text-3xl font-bold text-center bg-transparent border-none outline-none min-w-0 ${isViolation ? 'text-red-600' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setCounts(c => ({ ...c, [key]: c[key] + 1 }))}
                  className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-lg font-bold text-gray-600 flex-shrink-0"
                >+</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Violation message ── */}
      {violations.length > 0 && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-semibold text-red-700">
            {violations.map(m => `${m.label} (${counts[m.key]})`).join(', ')} cannot exceed the {present} children present. Adjust the counts before saving.
          </p>
        </div>
      )}

      {/* ── Summary ── */}
      {total > 0 && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <span className="text-sm text-gray-500">Total meals served</span>
          <span className="text-lg font-bold text-gray-900">{total}</span>
        </div>
      )}

      {/* ── Toast (desktop) ── */}
      {toast && (
        <div className={`hidden sm:flex items-center gap-2 text-sm font-semibold mb-4 ${toast.ok ? 'text-green-600' : 'text-red-500'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Save button (desktop) ── */}
      <button
        onClick={handleSubmit}
        disabled={saving || !canSubmit()}
        className="hidden sm:flex w-full items-center justify-center gap-2 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-base font-bold transition-colors disabled:opacity-50 mb-8"
      >
        {saving ? 'Saving…' : alreadySaved && date === today ? 'Update Daily Record' : 'Save Daily Record'}
      </button>

      {/* ── This month history ── */}
      {history.length > 0 && (
        <div className="card">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">This Month</h2>
            <span className="text-xs text-gray-400">Tap to edit</span>
          </div>
          <div className="divide-y divide-gray-50">
            {history
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 20)
              .map((r) => {
                // DB columns are breakfast/lunch/snack/supper (not _count suffix)
                const b   = r.breakfast ?? r.breakfast_count ?? 0;
                const l   = r.lunch     ?? r.lunch_count     ?? 0;
                const s   = r.snack     ?? r.snack_count     ?? 0;
                const su  = r.supper    ?? r.supper_count    ?? 0;
                const tot = (b + l + s + su) || r.count_submitted || 0;
                const isToday      = r.date === today;
                const isVerified   = r.count_verified != null;
                return (
                  <div
                    key={r.date}
                    onClick={() => loadHistoryRow(r)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer"
                  >
                    {/* dot: green=verified, blue=today, amber=pending */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isVerified ? 'bg-green-400' : isToday ? 'bg-blue-400' : 'bg-amber-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isToday ? 'text-brand-700' : 'text-gray-800'}`}>
                        {fmtDate(r.date)} {isToday && <span className="text-xs font-normal text-blue-600 ml-1">Today</span>}
                        {isVerified && <span className="text-xs font-normal text-green-600 ml-1">✓ Verified</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.children_present != null && (
                          <span className="text-indigo-500 font-medium">{r.children_present} present · </span>
                        )}
                        {[
                          b  > 0 && `B:${b}`,
                          l  > 0 && `L:${l}`,
                          s  > 0 && `S:${s}`,
                          su > 0 && `D:${su}`,
                        ].filter(Boolean).join(' · ') || `${tot} meals`}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-700 tabular-nums">{tot}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Sticky mobile submit bar ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        {toast ? (
          <span className={`flex-1 flex items-center gap-2 text-sm font-semibold ${toast.ok ? 'text-green-600' : 'text-red-500'}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.msg}
          </span>
        ) : (
          <span className="flex-1 text-xs text-gray-400">
            {total > 0 ? `${total} total meals` : 'Enter counts above'}
          </span>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving || !canSubmit()}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : alreadySaved && date === today ? 'Update' : 'Save'}
        </button>
      </div>
    </div>
  );
}
