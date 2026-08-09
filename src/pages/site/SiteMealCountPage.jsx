// SiteMealCountPage.jsx — Fast, minimal meal count entry for site directors.
// Goal: log in, enter numbers, hit Submit, done — under 30 seconds.

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertTriangle, Copy, ChevronRight, Users } from 'lucide-react';
import api from '../../services/api';

function todayISO() { return new Date().toISOString().split('T')[0]; }

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', color: 'bg-orange-50 border-orange-200 text-orange-600' },
  { key: 'lunch',     label: 'Lunch',     color: 'bg-green-50  border-green-200  text-green-600'  },
  { key: 'snack',     label: 'Snack',     color: 'bg-blue-50   border-blue-200   text-blue-600'   },
  { key: 'supper',    label: 'Supper',    color: 'bg-purple-50 border-purple-200 text-purple-600' },
];

export default function SiteMealCountPage() {
  const today = todayISO();

  const [date,       setDate]       = useState(today);
  const [counts,     setCounts]     = useState({ breakfast: 0, lunch: 0, snack: 0, supper: 0 });
  const [attendance, setAttendance] = useState('');      // '' = not yet set
  const [attSaved,   setAttSaved]   = useState(false);   // did we save it for this date?
  const [attSaving,  setAttSaving]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);    // { msg, ok }
  const [history,    setHistory]    = useState([]);
  const [attHistory, setAttHistory] = useState({});      // { "YYYY-MM-DD": count }
  const [todaySubmitted, setTodaySubmitted] = useState(false);

  const inputRefs = useRef([]);

  // ── Load recent history ─────────────────────────────────────────────────────
  useEffect(() => {
    const month = today.slice(0, 7);
    Promise.all([
      api.get(`/meal-counts?month=${month}&limit=30`),
      api.get(`/attendance?month=${month}`),
    ]).then(([mealRes, attRes]) => {
      const rows = mealRes.data.meal_counts ?? mealRes.data ?? [];
      setHistory(rows);
      // Pre-fill today if already submitted
      const todayRow = rows.find((r) => r.date === today);
      if (todayRow) {
        setCounts({
          breakfast: todayRow.breakfast_count ?? todayRow.count_submitted ?? 0,
          lunch:     todayRow.lunch_count     ?? 0,
          snack:     todayRow.snack_count     ?? 0,
          supper:    todayRow.supper_count    ?? 0,
        });
        setTodaySubmitted(true);
      }
      // Build attendance map by date
      const attRows = attRes.data.attendance ?? [];
      const attMap  = Object.fromEntries(attRows.map(r => [r.date?.slice(0,10), r.count]));
      setAttHistory(attMap);
      if (attMap[today] !== undefined) {
        setAttendance(String(attMap[today]));
        setAttSaved(true);
      }
    }).catch(() => {});
  }, []);

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 150);
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Save attendance ─────────────────────────────────────────────────────────
  const saveAttendance = async () => {
    const cnt = parseInt(attendance);
    if (isNaN(cnt) || cnt < 0) { showToast('Enter a valid attendance count', false); return; }
    setAttSaving(true);
    try {
      await api.post('/attendance', { date, count: cnt });
      setAttHistory(prev => ({ ...prev, [date]: cnt }));
      setAttSaved(true);
      showToast(`✓ Attendance saved: ${cnt} children`);
    } catch {
      showToast('Failed to save attendance', false);
    } finally {
      setAttSaving(false);
    }
  };

  // ── Copy yesterday ──────────────────────────────────────────────────────────
  const copyYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const row  = history.find((r) => r.date === yStr);
    if (row) {
      setCounts({
        breakfast: row.breakfast_count ?? 0,
        lunch:     row.lunch_count     ?? 0,
        snack:     row.snack_count     ?? 0,
        supper:    row.supper_count    ?? 0,
      });
      showToast("Copied yesterday's counts");
    } else {
      showToast('No entry found for yesterday', false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const total = counts.breakfast + counts.lunch + counts.snack + counts.supper;
    if (total === 0) {
      showToast('Enter at least one count before submitting', false);
      return;
    }
    setSaving(true);
    try {
      await api.post('/meal-counts', {
        date,
        breakfast_count: counts.breakfast,
        lunch_count:     counts.lunch,
        snack_count:     counts.snack,
        supper_count:    counts.supper,
        count_submitted: total,
      });
      setTodaySubmitted(date === today);
      setHistory((prev) => [
        { date, breakfast_count: counts.breakfast, lunch_count: counts.lunch, snack_count: counts.snack, supper_count: counts.supper, count_submitted: total },
        ...prev.filter((r) => r.date !== date),
      ]);
      showToast(`✓ Counts saved for ${fmtDate(date)}`);
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Failed to save — try again', false);
    } finally {
      setSaving(false);
    }
  };

  const total = counts.breakfast + counts.lunch + counts.snack + counts.supper;

  // ── Keyboard: Enter moves to next input, then submits ──────────────────────
  const onKeyDown = (idx) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx < MEALS.length - 1) inputRefs.current[idx + 1]?.focus();
      else handleSubmit();
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-24 sm:pb-6">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meal Counts</h1>
        <p className="text-sm text-gray-500 mt-1">Enter the number of meals served today.</p>
      </div>

      {/* ── Today confirmed banner ── */}
      {todaySubmitted && date === today && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700">Today's counts are submitted. You can update them below.</p>
        </div>
      )}

      {/* ── Date row ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              const d = e.target.value;
              setDate(d);
              setTodaySubmitted(false);
              const row = history.find((r) => r.date === d);
              if (row) {
                setCounts({
                  breakfast: row.breakfast_count ?? 0,
                  lunch:     row.lunch_count     ?? 0,
                  snack:     row.snack_count     ?? 0,
                  supper:    row.supper_count    ?? 0,
                });
                setTodaySubmitted(d === today);
              } else {
                setCounts({ breakfast: 0, lunch: 0, snack: 0, supper: 0 });
              }
              // Load attendance for this date
              if (attHistory[d] !== undefined) {
                setAttendance(String(attHistory[d]));
                setAttSaved(true);
              } else {
                setAttendance('');
                setAttSaved(false);
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

      {/* ── Attendance ── */}
      <div className={`rounded-2xl border-2 p-4 mb-5 ${attSaved ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Users className={`w-4 h-4 ${attSaved ? 'text-indigo-500' : 'text-gray-400'}`} />
          <label className={`text-xs font-bold uppercase tracking-wide ${attSaved ? 'text-indigo-600' : 'text-gray-500'}`}>
            Children in Attendance
          </label>
          {attSaved && (
            <span className="ml-auto text-xs font-semibold text-indigo-500 bg-indigo-100 rounded-full px-2 py-0.5">Saved</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setAttendance(a => String(Math.max(0, (parseInt(a) || 0) - 1))); setAttSaved(false); }}
            className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-lg font-bold text-gray-600 flex-shrink-0"
          >−</button>
          <input
            type="number"
            min="0"
            value={attendance}
            placeholder="0"
            onChange={(e) => { setAttendance(e.target.value); setAttSaved(false); }}
            onFocus={(e) => e.target.select()}
            className="flex-1 text-3xl font-bold text-center bg-transparent border-none outline-none min-w-0"
          />
          <button
            type="button"
            onClick={() => { setAttendance(a => String((parseInt(a) || 0) + 1)); setAttSaved(false); }}
            className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-lg font-bold text-gray-600 flex-shrink-0"
          >+</button>
          <button
            onClick={saveAttendance}
            disabled={attSaving || attendance === ''}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 flex-shrink-0"
          >
            {attSaving ? '…' : 'Save'}
          </button>
        </div>
        {/* Anomaly warning */}
        {attSaved && attendance !== '' && (() => {
          const att = parseInt(attendance) || 0;
          const bad = MEALS.filter(m => counts[m.key] > att && counts[m.key] > 0);
          return bad.length > 0 ? (
            <div className="flex items-start gap-2 mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-semibold text-red-700">
                {bad.map(m => `${m.label}: ${counts[m.key]} meals > ${att} attendance`).join(' · ')}
                {' '}— review before submitting claim.
              </p>
            </div>
          ) : null;
        })()}
      </div>

      {/* ── Meal inputs ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {MEALS.map(({ key, label, color }, idx) => (
          <div key={key} className={`rounded-2xl border-2 p-4 ${color}`}>
            <label className="block text-xs font-bold uppercase tracking-wide opacity-70 mb-3">{label}</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCounts((c) => ({ ...c, [key]: Math.max(0, c[key] - 1) }))}
                className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-lg font-bold text-gray-600 transition-colors flex-shrink-0"
              >−</button>
              <input
                ref={(el) => (inputRefs.current[idx] = el)}
                type="number"
                min="0"
                value={counts[key]}
                onChange={(e) => setCounts((c) => ({ ...c, [key]: Math.max(0, Number(e.target.value) || 0) }))}
                onFocus={(e) => e.target.select()}
                onKeyDown={onKeyDown(idx)}
                className="flex-1 text-3xl font-bold text-center bg-transparent border-none outline-none min-w-0"
              />
              <button
                type="button"
                onClick={() => setCounts((c) => ({ ...c, [key]: c[key] + 1 }))}
                className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-lg font-bold text-gray-600 transition-colors flex-shrink-0"
              >+</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Total ── */}
      {total > 0 && (
        <p className="text-center text-sm font-semibold text-gray-500 mb-5">
          {total} total meals
        </p>
      )}

      {/* ── Toast (desktop) ── */}
      {toast && (
        <div className={`hidden sm:flex items-center gap-2 text-sm font-semibold mb-4 ${toast.ok ? 'text-green-600' : 'text-red-500'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Submit button (desktop) ── */}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="hidden sm:flex w-full items-center justify-center gap-2 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-base font-bold transition-colors disabled:opacity-60 mb-8"
      >
        {saving ? 'Saving…' : todaySubmitted && date === today ? 'Update Counts' : 'Submit Counts'}
      </button>

      {/* ── This month history ── */}
      {history.length > 0 && (
        <div className="card">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">This Month</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {history.slice(0, 20).map((r) => {
              const tot = (r.breakfast_count ?? 0) + (r.lunch_count ?? 0) + (r.snack_count ?? 0) + (r.supper_count ?? 0) || r.count_submitted || 0;
              const isToday = r.date === today;
              return (
                <div
                  key={r.date}
                  onClick={() => {
                    setDate(r.date);
                    setCounts({
                      breakfast: r.breakfast_count ?? 0,
                      lunch:     r.lunch_count     ?? 0,
                      snack:     r.snack_count     ?? 0,
                      supper:    r.supper_count    ?? 0,
                    });
                    setTodaySubmitted(r.date === today);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isToday ? 'bg-green-400' : 'bg-gray-200'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isToday ? 'text-brand-700' : 'text-gray-800'}`}>
                      {fmtDate(r.date)} {isToday && <span className="text-xs font-normal text-green-600 ml-1">Today</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[
                        r.breakfast_count > 0 && `B: ${r.breakfast_count}`,
                        r.lunch_count     > 0 && `L: ${r.lunch_count}`,
                        r.snack_count     > 0 && `S: ${r.snack_count}`,
                        r.supper_count    > 0 && `D: ${r.supper_count}`,
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
            {total > 0 ? `${total} meals total` : 'Enter counts above'}
          </span>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : todaySubmitted && date === today ? 'Update' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
