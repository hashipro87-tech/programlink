// ImportEnrollmentModal.jsx — Upload a PDF or photo, Claude extracts children, user reviews + imports
import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Image, CheckCircle, AlertTriangle, Trash2, Plus, Table2 } from 'lucide-react';
import api from '../../services/api';

const BLANK_CHILD = {
  first_name: '', last_name: '', birthdate: '',
  parent_name: '', parent_phone: '',
  meal_types: '', enrollment_date: '', enrollment_expires: '',
  income_tier: 'tier1',
};

const MEALS = ['breakfast', 'lunch', 'snack', 'supper'];

// Animated processing steps shown during extraction
const PROCESS_STEPS = [
  { label: 'Reading names…',            duration: 2200 },
  { label: 'Reading dates of birth…',   duration: 2000 },
  { label: 'Reading enrollment dates…', duration: 2000 },
  { label: 'Reading meal eligibility…', duration: 2000 },
  { label: 'Finalizing results…',       duration: null  },
];

function ProcessingSteps() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let i = 0;
    function advance() {
      if (i >= PROCESS_STEPS.length - 1) return;
      const d = PROCESS_STEPS[i].duration;
      if (!d) return;
      setTimeout(() => { i++; setCurrent(i); advance(); }, d);
    }
    advance();
  }, []);

  return (
    <div className="py-10 px-4">
      <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-6" />
      <div className="space-y-3 max-w-xs mx-auto">
        {PROCESS_STEPS.map((step, i) => (
          <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${
            i < current  ? 'opacity-40' :
            i === current ? 'opacity-100' : 'opacity-20'
          }`}>
            {i < current ? (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : i === current ? (
              <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />
            )}
            <p className={`text-sm font-medium ${i === current ? 'text-gray-900' : 'text-gray-400'}`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChildCard({ child, index, onChange, onRemove }) {
  const meals = child.meal_types ? child.meal_types.split(',').filter(Boolean) : [];

  function toggleMeal(m) {
    const next = meals.includes(m) ? meals.filter(x => x !== m) : [...meals, m];
    onChange(index, 'meal_types', next.join(','));
  }

  const missing = !child.first_name || !child.last_name;

  return (
    <div className={`border rounded-2xl p-4 bg-white ${missing ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${missing ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
          Child {index + 1}{missing ? ' · Name required' : ''}
        </span>
        <button onClick={() => onRemove(index)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">First Name *</label>
          <input value={child.first_name || ''} onChange={e => onChange(index, 'first_name', e.target.value)}
            className={`w-full px-2.5 py-1.5 border rounded-lg text-sm ${!child.first_name ? 'border-red-300' : 'border-gray-200'}`} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name *</label>
          <input value={child.last_name || ''} onChange={e => onChange(index, 'last_name', e.target.value)}
            className={`w-full px-2.5 py-1.5 border rounded-lg text-sm ${!child.last_name ? 'border-red-300' : 'border-gray-200'}`} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Date of Birth</label>
          <input type="date" value={child.birthdate || ''} onChange={e => onChange(index, 'birthdate', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Income Tier</label>
          <select value={child.income_tier || 'tier1'} onChange={e => onChange(index, 'income_tier', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm">
            <option value="tier1">Tier 1 (Free)</option>
            <option value="tier2">Tier 2 (Reduced)</option>
            <option value="tier3">Tier 3 (Paid)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Parent / Guardian</label>
          <input value={child.parent_name || ''} onChange={e => onChange(index, 'parent_name', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Name" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Parent Phone</label>
          <input value={child.parent_phone || ''} onChange={e => onChange(index, 'parent_phone', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="(555) 000-0000" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Enrollment Date</label>
          <input type="date" value={child.enrollment_date || ''} onChange={e => onChange(index, 'enrollment_date', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Expires</label>
          <input type="date" value={child.enrollment_expires || ''} onChange={e => onChange(index, 'enrollment_expires', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Meal Types</label>
        <div className="flex gap-1.5 flex-wrap">
          {MEALS.map(m => (
            <button key={m} type="button" onClick={() => toggleMeal(m)}
              className={`px-2 py-1 text-xs font-bold rounded-lg border transition-colors capitalize ${
                meals.includes(m) ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500'
              }`}>
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ImportEnrollmentModal({ onClose, onImported, orgId }) {
  const [step, setStep]         = useState('upload');  // upload | extracting | review | importing | done
  const [file, setFile]         = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [children, setChildren] = useState([]);
  const [error, setError]       = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const inputRef = useRef();

  function handleFile(f) {
    if (!f) return;
    const ok = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'].includes(f.type);
    if (!ok) { setError('Please upload a PDF or image (JPG, PNG, HEIC, WebP)'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('File must be under 10 MB'); return; }
    setError('');
    setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function extract() {
    if (!file) return;
    setStep('extracting');
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/children/import/extract', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setChildren(res.data.children || []);
      setStep('review');
    } catch (e) {
      setError(e.response?.data?.error || 'Extraction failed. Try a clearer image.');
      setStep('upload');
    }
  }

  function updateChild(index, field, value) {
    setChildren(c => c.map((x, i) => i === index ? { ...x, [field]: value } : x));
  }

  function removeChild(index) {
    setChildren(c => c.filter((_, i) => i !== index));
  }

  function addBlank() {
    setChildren(c => [...c, { ...BLANK_CHILD }]);
  }

  async function confirmImport() {
    const valid = children.filter(c => c.first_name || c.last_name);
    if (!valid.length) { setError('No valid children to import'); return; }
    setStep('importing');
    setError('');
    try {
      const res = await api.post('/children/import/confirm', { children: valid, org_id: orgId });
      setImportedCount(res.data.imported);
      setStep('done');
      if (onImported) onImported(res.data.imported);
    } catch (e) {
      setError(e.response?.data?.error || 'Import failed');
      setStep('review');
    }
  }

  const validCount = children.filter(c => c.first_name || c.last_name).length;

  // Step label for header
  const STEP_LABELS = {
    upload:     'Step 1 — Upload',
    extracting: 'Step 2 — Processing',
    review:     'Step 3 — Review',
    importing:  'Step 3 — Review',
    done:       'Import Complete',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Import Children</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{STEP_LABELS[step]}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              {['upload', 'extracting', 'review'].map((s, i) => {
                const idx = ['upload','extracting','review'].indexOf(step === 'importing' ? 'review' : step);
                const done = i < idx;
                const active = i === idx;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      done ? 'bg-green-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-semibold ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                      {['Upload', 'Process', 'Review'][i]}
                    </span>
                    {i < 2 && <div className={`flex-1 h-px w-8 ${done ? 'bg-green-300' : 'bg-gray-200'}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">

          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div>
              {/* Format options */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="border-2 border-brand-400 bg-brand-50 rounded-xl p-3 text-center">
                  <FileText className="w-5 h-5 text-brand-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-brand-700">PDF</p>
                </div>
                <div className="border-2 border-brand-400 bg-brand-50 rounded-xl p-3 text-center">
                  <Image className="w-5 h-5 text-brand-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-brand-700">Photo</p>
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center opacity-50 cursor-not-allowed relative">
                  <Table2 className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-400">Excel / CSV</p>
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full whitespace-nowrap">Coming soon</span>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                }`}>
                <input ref={inputRef} type="file" className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                  onChange={e => handleFile(e.target.files[0])} />
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                {file ? (
                  <div>
                    <p className="font-semibold text-gray-800 text-sm mb-0.5">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-gray-600 mb-1">Drop your file here or click to browse</p>
                    <p className="text-xs text-gray-400">PDF, JPG, PNG, HEIC, WebP · Max 10 MB</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-semibold text-amber-800 mb-1">Tips for best results</p>
                <p className="text-xs text-amber-700">Make sure names are clearly readable. Good lighting if taking a photo — avoid shadows. You'll review and correct everything before importing.</p>
              </div>
            </div>
          )}

          {/* ── Step 2: Extracting (animated steps) ── */}
          {step === 'extracting' && <ProcessingSteps />}

          {/* ── Step 3: Review ── */}
          {step === 'review' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">{children.length} children found</p>
                  <p className="text-xs text-gray-500 mt-0.5">Review and correct anything before importing</p>
                </div>
                <button onClick={() => { setStep('upload'); setFile(null); setChildren([]); }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline">
                  Upload different file
                </button>
              </div>

              {children.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <p className="text-sm">No children were detected. Try a clearer image or add them manually.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {children.map((child, i) => (
                    <ChildCard key={i} child={child} index={i} onChange={updateChild} onRemove={removeChild} />
                  ))}
                </div>
              )}

              <button onClick={addBlank}
                className="mt-3 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-semibold">
                <Plus className="w-4 h-4" /> Add child manually
              </button>

              {error && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Importing spinner ── */}
          {step === 'importing' && (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="font-semibold text-gray-800">Importing {validCount} children…</p>
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">{importedCount} children imported</p>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">Their enrollment forms are saved as drafts. Complete and submit each form to send for review.</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step === 'done' ? (
            <button onClick={onClose} className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700">
              Done
            </button>
          ) : step === 'review' ? (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmImport} disabled={validCount === 0}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40">
                Import {validCount} {validCount === 1 ? 'Child' : 'Children'}
              </button>
            </>
          ) : step === 'upload' ? (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={extract} disabled={!file}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40">
                Extract Data
              </button>
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
}
