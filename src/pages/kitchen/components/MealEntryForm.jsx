// MealEntryForm.jsx — Daily meal count entry, production-grade UX.
//
// Features:
//  • +/- stepper buttons + tap-to-type inputs with active focus ring
//  • "Last saved X seconds ago" live timer
//  • Quick-fill presets: average, last Monday, last entry
//  • Mobile-first layout with sticky Save bar at bottom
//  • Post-scan confidence indicator per field (✓ high / ? review / ! low)
//  • Unsaved changes warning on navigate-away
//  • Scanning loader animation
//  • Success toast, keyboard auto-focus, Enter key navigation

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  UtensilsCrossed, Copy, Save, AlertTriangle, CheckCircle,
  Camera, X, ZoomIn, Plus, Minus, ChevronDown, Loader2,
} from 'lucide-react';
import api from '../../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPES  = ['breakfast', 'lunch', 'supper', 'snack'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', supper: 'Supper', snack: 'Snack' };
const EMPTY_COUNTS = { breakfast: 0, lunch: 0, supper: 0, snack: 0 };

// Per-field confidence styling after a scan
const FIELD_CONFIDENCE = {
  high:    { ring: 'ring-2 ring-green-400',   badge: '✓', badgeCls: 'text-green-600' },
  medium:  { ring: 'ring-2 ring-yellow-400',  badge: '?', badgeCls: 'text-yellow-500' },
  low:     { ring: 'ring-2 ring-red-400',     badge: '!', badgeCls: 'text-red-500' },
};

function toDateStr(d) { return d.toISOString().split('T')[0]; }

// Read a meal count off an entry regardless of shape.
// The API returns DB column names (breakfast/lunch/snack/supper), but rows we
// append locally after a save use the POST field names (breakfast_count/...).
// Code that only checked one shape silently read undefined -> 0.
function readCount(entry, type) {
  if (!entry) return 0;
  return entry[type] ?? entry[`${type}_count`] ?? 0;
}

// Pull all four counts off an entry at once.
function readCounts(entry) {
  return {
    breakfast: readCount(entry, 'breakfast'),
    lunch:     readCount(entry, 'lunch'),
    supper:    readCount(entry, 'supper'),
    snack:     readCount(entry, 'snack'),
  };
}

// How long ago was `ts` (Date)?
function timeAgo(ts) {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 5)   return 'just now';
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Single meal type input with +/- steppers and optional scan confidence badge
function MealInput({ type, value, onChange, confidence, inputRef, onKeyDown }) {
  const conf = confidence ? FIELD_CONFIDENCE[confidence] : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        {MEAL_LABELS[type]}
        {conf && (
          <span className={`ml-1 font-bold ${conf.badgeCls}`}>{conf.badge}</span>
        )}
      </label>

      <div className={`flex items-center gap-1 w-full rounded-xl border bg-white transition-all ${
        conf ? conf.ring : 'border-gray-200 focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-brand-400'
      }`}>
        {/* Minus button */}
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-14 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-l-xl transition-colors flex-shrink-0 text-lg font-bold"
          aria-label={`Decrease ${MEAL_LABELS[type]}`}
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Number input */}
        <input
          ref={inputRef}
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          onKeyDown={onKeyDown}
          onFocus={(e) => e.target.select()}
          className="flex-1 h-14 text-2xl font-bold text-center text-gray-900 bg-transparent border-none outline-none min-w-0"
          aria-label={MEAL_LABELS[type]}
        />

        {/* Plus button */}
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 h-14 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-r-xl transition-colors flex-shrink-0 text-lg font-bold"
          aria-label={`Increase ${MEAL_LABELS[type]}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MealEntryForm({ compact = false }) {
  const today = toDateStr(new Date());

  // Form state
  const [date, setDate]               = useState(today);
  const [counts, setCounts]           = useState({ ...EMPTY_COUNTS });
  const [savedCounts, setSavedCounts] = useState(null); // last successfully saved counts
  const [savedAt, setSavedAt]         = useState(null); // timestamp of last save
  const [timeAgoStr, setTimeAgoStr]   = useState('');

  // Data
  const [recentMeals, setRecentMeals] = useState([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Scan state
  const [scanning, setScanning]           = useState(false);
  const [scanResult, setScanResult]       = useState(null);
  const [fieldConfidence, setFieldConfidence] = useState({}); // per-field confidence
  const [showFullImage, setShowFullImage] = useState(false);
  const scanInputRef                      = useRef(null);

  // Presets
  const [showPresets, setShowPresets] = useState(false);

  // Save state
  const [saving, setSaving]           = useState(false);
  const [copying, setCopying]         = useState(false);
  const [toast, setToast]             = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const pendingPayload                = useRef(null);

  // Unsaved changes
  const hasChanges = JSON.stringify(counts) !== JSON.stringify(savedCounts ?? EMPTY_COUNTS);

  // Input refs for keyboard navigation
  const inputRefs = useRef([]);

  // ── Load recent meals ───────────────────────────────────────────────────────
  // NOTE: this used to request ?recent=7, but listMealCounts has no 'recent'
  // param — it was ignored and the endpoint returned the kitchen's ENTIRE
  // history. So "7-day average" averaged everything ever recorded. Use the
  // start_date filter the backend actually supports.
  useEffect(() => {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    api.get(`/meal-counts?start_date=${toDateStr(since)}`)
      .then(({ data }) => setRecentMeals(data.meal_counts ?? (Array.isArray(data) ? data : [])))
      .catch(() => {});
  }, []);

  // Auto-focus first input on mount — standalone page only.
  // The `compact` prop was accepted here but never actually read anywhere in
  // this component, so <MealEntryForm compact /> on the Overview page
  // rendered the identical full form AND still ran this autofocus. Browsers
  // scroll a freshly-focused element into view, so every kitchen login
  // silently jumped the page down to this card — the "why does it auto-scroll"
  // bug. Now only the real /dashboard/kitchen/meals page autofocuses.
  useEffect(() => {
    if (compact) return;
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
  }, [compact]);

  // Pre-fill the form with whatever is already recorded for the selected date.
  // Without this the form always opened at 0s — a kitchen that had already
  // submitted today saw an empty form and had no way to tell, and picking an
  // earlier date showed zeros rather than that day's real counts.
  // prefilledFor guards against clobbering edits when recentMeals arrives late.
  const prefilledFor = useRef(null);
  useEffect(() => {
    if (prefilledFor.current === date) return;
    const existing = recentMeals.find((m) => (m.date ?? '').slice(0, 10) === date);
    if (existing) {
      const c = readCounts(existing);
      setCounts(c);
      setSavedCounts(c);        // so "unsaved changes" isn't shown for untouched data
      setAlreadySubmitted(true);
      prefilledFor.current = date;
    } else if (recentMeals.length > 0) {
      // We have data loaded and this date isn't in it — genuinely a new entry
      setCounts({ ...EMPTY_COUNTS });
      setSavedCounts(null);
      setAlreadySubmitted(false);
      prefilledFor.current = date;
    }
  }, [date, recentMeals]);

  // Live "X seconds ago" timer
  useEffect(() => {
    if (!savedAt) return;
    const id = setInterval(() => setTimeAgoStr(timeAgo(savedAt)), 5000);
    setTimeAgoStr(timeAgo(savedAt));
    return () => clearInterval(id);
  }, [savedAt]);

  // Warn before leaving if unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Keyboard navigation: Enter moves to next input ──────────────────────────
  const handleKeyDown = (idx) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx < MEAL_TYPES.length - 1) {
        inputRefs.current[idx + 1]?.focus();
      } else {
        handleSave();
      }
    }
  };

  // ── Update a single count ───────────────────────────────────────────────────
  const setCount = (type, val) => {
    setCounts((c) => ({ ...c, [type]: val }));
    // Clear that field's confidence badge once the user edits it
    if (fieldConfidence[type]) {
      setFieldConfidence((f) => { const n = { ...f }; delete n[type]; return n; });
    }
  };

  // ── Quick-fill presets ──────────────────────────────────────────────────────
  const applyPreset = (preset) => {
    setShowPresets(false);

    if (preset === 'average' && recentMeals.length > 0) {
      const avgF = (type) => Math.round(
        recentMeals.reduce((s, m) => s + readCount(m, type), 0) / recentMeals.length
      );
      setCounts({
        breakfast: avgF('breakfast'),
        lunch:     avgF('lunch'),
        supper:    avgF('supper'),
        snack:     avgF('snack'),
      });
      showToast(`Filled with your average across ${recentMeals.length} recent day${recentMeals.length === 1 ? '' : 's'}`);
      return;
    }

    if (preset === 'lastMonday') {
      const d = new Date();
      const day = d.getDay();
      const diff = (day === 0 ? 6 : day - 1) + 7; // go back to last Monday
      d.setDate(d.getDate() - diff);
      const mondayStr = toDateStr(d);
      const entry = recentMeals.find((m) => (m.date ?? '').slice(0, 10) === mondayStr);
      if (entry) {
        setCounts(readCounts(entry));
        showToast('Filled with last Monday\'s counts');
      } else {
        showToast('No entry found for last Monday', false);
      }
      return;
    }

    if (preset === 'lastEntry' && recentMeals.length > 0) {
      const last = recentMeals[0];
      setCounts(readCounts(last));
      showToast(`Filled with ${(last.date ?? '').slice(0, 10)}'s counts`);
    }
  };

  // ── Copy yesterday ──────────────────────────────────────────────────────────
  const copyYesterday = async () => {
    setCopying(true);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = toDateStr(yesterday);
    const cached = recentMeals.find((m) => (m.date ?? '').slice(0, 10) === yStr);
    if (cached) {
      setCounts(readCounts(cached));
      showToast("Copied yesterday's counts");
    } else {
      showToast('No entry found for yesterday', false);
    }
    setCopying(false);
  };

  // ── Scan ────────────────────────────────────────────────────────────────────
  const handleScanFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    setFieldConfidence({});
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/meal-counts/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const c = data.meal_count ?? data.counts ?? {};
      setCounts({
        breakfast: c.breakfast ?? 0,
        lunch:     c.lunch     ?? 0,
        supper:    c.supper    ?? 0,
        snack:     c.snack     ?? 0,
      });

      // Assign per-field confidence based on overall confidence
      // High overall = all fields high; medium = mixed; low = all low
      const overallConf = c.confidence ?? 'low';
      setFieldConfidence({
        breakfast: overallConf,
        lunch:     overallConf,
        supper:    c.supper > 0 ? overallConf : 'low',
        snack:     c.snack  > 0 ? overallConf : 'low',
      });

      setScanResult({ imageData: data.imageData, confidence: overallConf });
      showToast(
        overallConf === 'high'   ? '✓ Slip scanned — counts look good' :
        overallConf === 'medium' ? 'Scanned — please review the numbers' :
                                   'Scanned — low confidence, edit as needed'
      , overallConf !== 'low');
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Scan failed — try a clearer photo', false);
    } finally {
      setScanning(false);
      if (scanInputRef.current) scanInputRef.current.value = '';
    }
  };

  // ── Anomaly check ───────────────────────────────────────────────────────────
  // Was reading m[`${type}_count`], but the API returns DB column names
  // (breakfast/lunch/snack/supper). Every average came out 0, the `avg > 0`
  // guard then failed, and this warning never fired for server-loaded data —
  // only for rows appended locally after a save in the same session.
  const isUnusuallyHigh = (c) => {
    if (recentMeals.length < 3) return false;
    return MEAL_TYPES.some((type) => {
      const avg = recentMeals.reduce((s, m) => s + readCount(m, type), 0) / recentMeals.length;
      return avg > 0 && c[type] > avg * 1.5;
    });
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const payload = {
      date,
      breakfast_count: counts.breakfast,
      lunch_count:     counts.lunch,
      supper_count:    counts.supper,
      snack_count:     counts.snack,
      count_submitted: counts.breakfast + counts.lunch + counts.supper + counts.snack,
      scanned_by_ai:   !!scanResult,
      scan_image_data: scanResult?.imageData ?? null,
    };
    if (isUnusuallyHigh(counts)) {
      pendingPayload.current = payload;
      setShowWarning(true);
      return;
    }
    doSave(payload);
  };

  const doSave = async (payload) => {
    setSaving(true);
    setShowWarning(false);
    try {
      await api.post('/meal-counts', payload);
      setSavedCounts({ ...counts });
      setSavedAt(Date.now());
      setTimeAgoStr('just now');
      setAlreadySubmitted(true);
      // Store using the API's own column names so the cached row matches what a
      // refetch would return (readCount tolerates both, but keep them aligned).
      setRecentMeals((prev) => [
        {
          date:      payload.date,
          breakfast: payload.breakfast_count,
          lunch:     payload.lunch_count,
          supper:    payload.supper_count,
          snack:     payload.snack_count,
        },
        ...prev.filter((m) => (m.date ?? '').slice(0, 10) !== payload.date),
      ]);
      showToast(`✓ Saved for ${payload.date}`);
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Failed to save — try again', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="card mb-24 sm:mb-6"> {/* bottom margin leaves room for sticky save bar on mobile */}

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Daily Meal Counts</h2>

          {/* Last saved indicator */}
          {savedAt && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              Saved {timeAgoStr}
            </span>
          )}
          {hasChanges && !savedAt && (
            <span className="ml-auto text-xs text-gray-400 font-medium">Unsaved changes</span>
          )}
          {hasChanges && savedAt && (
            <span className="ml-2 text-xs text-amber-500 font-medium">· unsaved changes</span>
          )}
        </div>

        <div className="px-6 py-5">

          {/* ── Scan Banner ── */}
          <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-xl">
            <p className="text-sm font-semibold text-brand-700 mb-1">
              📷 Scan a delivery slip — we'll fill in the numbers automatically
            </p>
            <p className="text-xs text-brand-500 mb-3">
              Works with printed forms and handwritten slips. You can edit any number before saving.
            </p>
            <label className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
              scanning ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 text-white'
            }`}>
              {scanning
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
                : <><Camera className="w-4 h-4" /> Scan Delivery Slip</>
              }
              <input
                ref={scanInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={scanning}
                onChange={handleScanFile}
              />
            </label>
          </div>

          {/* ── Scan result preview ── */}
          {scanResult && (
            <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div
                  className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group"
                  onClick={() => setShowFullImage(true)}
                >
                  <img src={scanResult.imageData} alt="Scanned slip" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">Slip scanned</p>
                  <p className="text-xs text-gray-500">
                    Fields highlighted below — <span className="font-semibold text-green-600">✓</span> = confident,
                    <span className="font-semibold text-yellow-500"> ?</span> = review,
                    <span className="font-semibold text-red-500"> !</span> = edit needed
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Sponsor sees this photo alongside your counts.</p>
                </div>
                <button onClick={() => { setScanResult(null); setFieldConfidence({}); }} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Date + quick-fill row ── */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Quick-fill presets */}
            <div className="relative mt-5">
              <button
                onClick={() => setShowPresets((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Quick Fill <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showPresets && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {[
                    { id: 'average',   label: 'Use 7-day average' },
                    { id: 'lastEntry', label: 'Repeat last entry' },
                    { id: 'lastMonday',label: 'Last Monday\'s counts' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors border-b border-gray-50 last:border-0"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Copy yesterday */}
            <button
              onClick={copyYesterday}
              disabled={copying || scanning}
              className="mt-5 flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              {copying ? 'Copying…' : "Yesterday's"}
            </button>
          </div>

          {/* ── Already-submitted notice ── */}
          {alreadySubmitted && (
            <div className="mb-5 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                <span className="font-bold">Counts already recorded for this date.</span>{' '}
                The numbers below are what's on file — edit and save to update them.
              </p>
            </div>
          )}

          {/* ── Meal inputs — 2-col on mobile, 4-col on sm+ ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {MEAL_TYPES.map((type, idx) => (
              <MealInput
                key={type}
                type={type}
                value={counts[type]}
                onChange={(v) => setCount(type, v)}
                confidence={fieldConfidence[type]}
                inputRef={(el) => (inputRefs.current[idx] = el)}
                onKeyDown={handleKeyDown(idx)}
              />
            ))}
          </div>

          {/* ── Toast (desktop only — mobile uses sticky bar) ── */}
          {toast && (
            <div className={`hidden sm:flex items-center gap-2 text-sm font-semibold ${toast.ok ? 'text-green-600' : 'text-red-500'}`}>
              {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {toast.msg}
            </div>
          )}

          {/* ── Desktop Save button (hidden on mobile — sticky bar handles it) ── */}
          <div className="hidden sm:flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={saving || scanning}
              className="flex items-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Counts'}
            </button>
          </div>

        </div>
      </div>

      {/* ── Sticky mobile Save bar ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        {toast ? (
          <span className={`flex-1 flex items-center gap-2 text-sm font-semibold ${toast.ok ? 'text-green-600' : 'text-red-500'}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.msg}
          </span>
        ) : (
          <span className="flex-1 text-xs text-gray-400">
            {savedAt ? `✓ Saved ${timeAgoStr}` : hasChanges ? 'Unsaved changes' : 'No changes'}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || scanning}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* ── Full image lightbox ── */}
      {showFullImage && scanResult && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowFullImage(false)} className="absolute -top-10 right-0 text-white/80 hover:text-white">
              <X className="w-7 h-7" />
            </button>
            <img src={scanResult.imageData} alt="Delivery slip" className="w-full rounded-xl shadow-2xl" />
            <p className="text-center text-white/50 text-xs mt-3">Tap outside to close</p>
          </div>
        </div>
      )}

      {/* ── High count warning ── */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-bold text-gray-900">Unusually High Count</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              One or more counts is significantly higher than your 7-day average. Double-check before saving.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowWarning(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Go Back
              </button>
              <button onClick={() => doSave(pendingPayload.current)} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-bold">
                Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
