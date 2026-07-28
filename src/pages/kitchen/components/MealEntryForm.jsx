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

export default function MealEntryForm() {
  const today = toDateStr(new Date());

  // Form state
  const [date, setDate]               = useState(today);
  const [counts, setCounts]           = useState({ ...EMPTY_COUNTS });
  const [savedCounts, setSavedCounts] = useState(null); // last successfully saved counts
  const [savedAt, setSavedAt]         = useState(null); // timestamp of last save
  const [timeAgoStr, setTimeAgoStr]   = useState('');

  // Data
  const [recentMeals, setRecentMeals] = useState([]);

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
  useEffect(() => {
    api.get('/meal-counts?recent=7')
      .then(({ data }) => setRecentMeals(data.meal_counts ?? (Array.isArray(data) ? data : [])))
      .catch(() => {});
  }, []);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
  }, []);

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
      const avg = (key) => Math.round(
        recentMeals.reduce((s, m) => s + (m[key] || 0), 0) / recentMeals.length
      );
      setCounts({
        breakfast: avg('breakfast_count'),
        lunch:     avg('lunch_count'),
        supper:    avg('supper_count'),
        snack:     avg('snack_count'),
      });
      showToast('Filled with your 7-day averages');
      return;
    }

    if (preset === 'lastMonday') {
      const d = new Date();
      const day = d.getDay();
      const diff = (day === 0 ? 6 : day - 1) + 7; // go back to last Monday
      d.setDate(d.getDate() - diff);
      const mondayStr = toDateStr(d);
      const entry = recentMeals.find((m) => m.date === mondayStr);
      if (entry) {
        setCounts({
          breakfast: entry.breakfast_count ?? 0,
          lunch:     entry.lunch_count     ?? 0,
          supper:    entry.supper_count    ?? 0,
          snack:     entry.snack_count     ?? 0,
        });
        showToast('Filled with last Monday\'s counts');
      } else {
        showToast('No entry found for last Monday', false);
      }
      return;
    }

    if (preset === 'lastEntry' && recentMeals.length > 0) {
      const last = recentMeals[0];
      setCounts({
        breakfast: last.breakfast_count ?? 0,
        lunch:     last.lunch_count     ?? 0,
        supper:    last.supper_count    ?? 0,
        snack:     last.snack_count     ?? 0,
      });
      showToast(`Filled with ${last.date}'s counts`);
    }
  };

  // ── Copy yesterday ──────────────────────────────────────────────────────────
  const copyYesterday = async () => {
    setCopying(true);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = toDateStr(yesterday);
    const cached = recentMeals.find((m) => m.date === yStr);
    if (cached) {
      setCounts({
        breakfast: cached.breakfast_count ?? 0,
        lunch:     cached.lunch_count     ?? 0,
        supper:    cached.supper_count    ?? 0,
        snack:     cached.snack_count     ?? 0,
      });
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
  const isUnusuallyHigh = (c) => {
    if (recentMeals.length < 3) return false;
    for (const type of MEAL_TYPES) {
      const key = `${type}_count`;
      const avg = recentMeals.reduce((s, m) => s + (m[key] || 0), 0) / recentMeals.length;
      if (avg > 0 && c[type] > avg * 1.5) return true;
    }
    return false;
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
      setRecentMeals((prev) => [
        { date: payload.date, breakfast_count: payload.breakfast_count, lunch_count: payload.lunch_count, supper_count: payload.supper_count, snack_count: payload.snack_count },
        ...prev.filter((m) => m.date !== payload.date),
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
