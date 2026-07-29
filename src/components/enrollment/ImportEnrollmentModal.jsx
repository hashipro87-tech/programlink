// ImportEnrollmentModal.jsx — Import children from PDF/photo (AI) or CSV/Excel (client-side parse)
import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileText, Image, CheckCircle, AlertTriangle, Trash2, Plus, Table2, Sparkles } from 'lucide-react';
import api from '../../services/api';

const BLANK_CHILD = {
  first_name: '', last_name: '', birthdate: '',
  parent_name: '', parent_phone: '',
  meal_types: '', enrollment_date: '', enrollment_expires: '',
  income_tier: 'tier1',
};

const MEALS = ['breakfast', 'lunch', 'snack', 'supper'];

// ─── Column mapping for CSV/Excel ─────────────────────────────────────────────
// Maps common spreadsheet column names → child field names

const FIELD_ALIASES = {
  first_name:          ['first_name','first name','firstname','given name','given_name','first','child first','student first','child first name','fname','f name'],
  last_name:           ['last_name','last name','lastname','surname','family name','family_name','last','child last','student last','child last name','lname','l name'],
  birthdate:           ['birthdate','birth_date','dob','date of birth','birthday','birth date','date_of_birth','child dob','child birth date','child birthdate','child date of birth','date of birth (dob)','child age/dob'],
  parent_name:         ['parent_name','parent name','parent/guardian','guardian','contact name','parent guardian','guardian name','contact','parent or guardian','parent / guardian','caregiver','caregiver name'],
  parent_phone:        ['parent_phone','parent phone','phone','contact phone','guardian phone','phone number','telephone','mobile','cell','parent cell','home phone','emergency phone'],
  enrollment_date:     ['enrollment_date','enrollment date','start date','enrolled date','enroll date','date enrolled','start_date','date of enrollment','enrollment start'],
  enrollment_expires:  ['enrollment_expires','enrollment expires','expiry','expiration','expiration date','expire date','expires','end date','enrollment end','enrollment end date','renewal date'],
  income_tier:         ['income_tier','income tier','tier','income level','income','eligibility','income eligibility','free reduced paid','category','benefit category'],
  meal_types:          ['meal_types','meal types','meals','meal type','meal eligibility','meals served','approved meals'],
};

function detectColumnMap(headers) {
  const mapped = {};
  const used   = new Set();
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const h of headers) {
      if (used.has(h)) continue;
      const key = h.toLowerCase().trim().replace(/[-_\s]+/g, ' ');
      if (aliases.includes(key)) {
        mapped[field] = h;
        used.add(h);
        break;
      }
    }
  }
  return mapped;
}

function normalizeDate(raw) {
  if (!raw) return '';
  // SheetJS may give us a Date object or a serial number or a string
  if (raw instanceof Date) return raw.toISOString().split('T')[0];
  if (typeof raw === 'number') {
    // Excel date serial
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  const d = new Date(raw);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return String(raw);
}

function normalizeTier(raw) {
  if (!raw) return 'tier1';
  const s = String(raw).toLowerCase();
  if (s.includes('2') || s.includes('reduce') || s.includes('paid')) return 'tier2';
  return 'tier1';
}

function parseSheetsRows(rows, colMap) {
  return rows
    .filter(row => Object.values(row).some(v => v != null && String(v).trim() !== ''))
    .map(row => {
      const child = { ...BLANK_CHILD };
      for (const [field, header] of Object.entries(colMap)) {
        if (!header || row[header] == null) continue;
        const raw = row[header];
        if (field === 'income_tier')           child[field] = normalizeTier(raw);
        else if (['birthdate','enrollment_date','enrollment_expires'].includes(field))
                                               child[field] = normalizeDate(raw);
        else                                   child[field] = String(raw).trim();
      }
      return child;
    });
}

// ─── AI processing animation ──────────────────────────────────────────────────

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
            i < current ? 'opacity-40' : i === current ? 'opacity-100' : 'opacity-20'
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

// ─── Child review card ─────────────────────────────────────────────────────────

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

// ─── Column mapping preview (shown before review in CSV mode) ─────────────────

function ColumnMapPreview({ colMap, headers, onConfirm, onBack }) {
  const FIELD_LABELS = {
    first_name: 'First Name', last_name: 'Last Name', birthdate: 'Date of Birth',
    parent_name: 'Parent Name', parent_phone: 'Parent Phone',
    enrollment_date: 'Enrollment Date', enrollment_expires: 'Enrollment Expires',
    income_tier: 'Income Tier', meal_types: 'Meal Types',
  };
  const mapped   = Object.entries(colMap).filter(([,v]) => v);
  const unmapped = headers.filter(h => !Object.values(colMap).includes(h));

  const total = headers.length;
  const matchedCount = mapped.length;

  return (
    <div>
      {/* Smart match summary */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 ${
        matchedCount >= total * 0.8 ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'
      }`}>
        <span className="text-base">{matchedCount >= total * 0.8 ? '✅' : '⚠️'}</span>
        <p className={`text-sm font-semibold ${matchedCount >= total * 0.8 ? 'text-green-800' : 'text-amber-800'}`}>
          Matched {matchedCount} of {total} column{total !== 1 ? 's' : ''} automatically
        </p>
        {unmapped.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">{unmapped.length} skipped</span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Review the mapping and click Continue to import.
      </p>
      <div className="space-y-1.5 mb-4 max-h-52 overflow-y-auto">
        {mapped.map(([field, header]) => (
          <div key={field} className="flex items-center gap-3 text-sm px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <span className="text-gray-500 w-32 flex-shrink-0">"{header}"</span>
            <span className="text-gray-300">→</span>
            <span className="font-semibold text-gray-800">{FIELD_LABELS[field] || field}</span>
          </div>
        ))}
        {unmapped.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-400 mb-1.5">Columns not recognized (will be skipped):</p>
            {unmapped.map(h => (
              <div key={h} className="flex items-center gap-3 text-sm px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg mb-1">
                <span className="text-gray-400 text-xs">"{h}"</span>
                <span className="text-gray-200 text-xs ml-auto">skipped</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {mapped.length < 2 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Only {mapped.length} column{mapped.length !== 1 ? 's' : ''} detected. Make sure your spreadsheet has columns named "First Name" and "Last Name". You can correct everything in the review step.
          </p>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
          Back
        </button>
        <button onClick={onConfirm} className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700">
          Continue to Review
        </button>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ImportEnrollmentModal({ onClose, onImported, orgId: propOrgId }) {
  const [mode,      setMode]      = useState('ai');
  // When propOrgId is provided (e.g. opened from a site row), skip site-select.
  // When it's missing (top-level "Import Children" button), start at 'site-select'.
  const [step,      setStep]      = useState(propOrgId ? 'upload' : 'site-select');
  const [selectedOrgId, setSelectedOrgId] = useState(propOrgId || '');
  const [sites,     setSites]     = useState([]);
  const [sitesLoading, setSitesLoading] = useState(!propOrgId);
  const [file,      setFile]      = useState(null);
  const [dragOver,  setDragOver]  = useState(false);
  const [children,  setChildren]  = useState([]);
  const [error,     setError]     = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [colMap,    setColMap]    = useState({});
  const [allHeaders, setAllHeaders] = useState([]);
  const [rawRows,   setRawRows]   = useState([]);
  const [siteSearch, setSiteSearch] = useState('');
  const inputRef = useRef();

  // Fetch sites for the site-select step (only when orgId not pre-supplied)
  useEffect(() => {
    if (propOrgId) return;
    api.get('/organizations?type=site&limit=200')
      .then(({ data }) => setSites(data.organizations ?? []))
      .catch(() => {})
      .finally(() => setSitesLoading(false));
  }, [propOrgId]);

  // The org ID we'll actually import into
  const orgId = selectedOrgId || propOrgId;

  // Name of selected site — shown persistently throughout the flow
  const selectedSiteName = propOrgId
    ? null   // pre-supplied orgId: sponsor already knows the context
    : (sites.find(s => s.id === selectedOrgId)?.name ?? null);

  // Reset state on mode change
  function switchMode(m) {
    setMode(m);
    setFile(null);
    setChildren([]);
    setError('');
    setStep('upload');
    setColMap({});
    setAllHeaders([]);
    setRawRows([]);
  }

  // ── File acceptance ──────────────────────────────────────────────────────────

  function handleFile(f) {
    if (!f) return;
    if (mode === 'ai') {
      const ok = ['application/pdf','image/jpeg','image/jpg','image/png','image/webp'].includes(f.type);
      if (!ok) { setError('Please upload a PDF, JPG, or PNG. iPhone photos must be saved as JPG first (Settings → Camera → Formats → Most Compatible).'); return; }
    } else {
      const ext = f.name.split('.').pop().toLowerCase();
      const ok  = ['csv','xlsx','xls','tsv'].includes(ext);
      if (!ok) { setError('Please upload a CSV, Excel (.xlsx/.xls), or TSV file'); return; }
    }
    if (f.size > 10 * 1024 * 1024) { setError('File must be under 10 MB'); return; }
    setError('');
    setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  // ── AI extraction ────────────────────────────────────────────────────────────

  async function extractWithAI() {
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

  // ── CSV / Excel parsing ──────────────────────────────────────────────────────

  async function parseSpreadsheet() {
    if (!file) return;
    setError('');
    try {
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: 'array', cellDates: true });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rows.length === 0) {
        setError('No data found in the file. Make sure the first row contains column headers.');
        return;
      }

      const headers = Object.keys(rows[0]);
      const map     = detectColumnMap(headers);

      setAllHeaders(headers);
      setColMap(map);
      setRawRows(rows);
      setStep('mapping');
    } catch (e) {
      console.error('Spreadsheet parse error:', e);
      setError('Could not read the file. Make sure it\'s a valid CSV or Excel file and is not password-protected.');
    }
  }

  function confirmColumnMap() {
    const parsed = parseSheetsRows(rawRows, colMap);
    setChildren(parsed);
    setStep('review');
  }

  // Dispatch based on mode
  function handleExtract() {
    if (mode === 'ai') extractWithAI();
    else               parseSpreadsheet();
  }

  // ── Review actions ───────────────────────────────────────────────────────────

  function updateChild(index, field, value) {
    setChildren(c => c.map((x, i) => i === index ? { ...x, [field]: value } : x));
  }
  function removeChild(index) {
    setChildren(c => c.filter((_, i) => i !== index));
  }
  function addBlank() {
    setChildren(c => [...c, { ...BLANK_CHILD }]);
  }

  // ── Confirm import ────────────────────────────────────────────────────────────

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

  const hasSiteSelect = !propOrgId;

  const STEP_LABELS = {
    'site-select': 'Step 1 — Select Site',
    upload:        hasSiteSelect ? 'Step 2 — Upload'   : 'Step 1 — Upload',
    mapping:       hasSiteSelect ? 'Step 3 — Map Columns' : 'Step 2 — Map Columns',
    extracting:    hasSiteSelect ? 'Step 3 — Processing'  : 'Step 2 — Processing',
    review:        hasSiteSelect ? 'Step 4 — Review'   : 'Step 3 — Review',
    importing:     hasSiteSelect ? 'Step 4 — Review'   : 'Step 3 — Review',
    done:          'Import Complete',
  };

  const showStepBar = step !== 'done';
  const stepBarSteps = hasSiteSelect
    ? (mode === 'csv' ? ['Select Site', 'Upload', 'Map Columns', 'Review'] : ['Select Site', 'Upload', 'Process', 'Review'])
    : (mode === 'csv' ? ['Upload', 'Map Columns', 'Review'] : ['Upload', 'Process', 'Review']);
  const stepBarIndex = hasSiteSelect
    ? (mode === 'csv'
        ? { 'site-select': 0, upload: 1, mapping: 2, review: 3, importing: 3 }[step] ?? 0
        : { 'site-select': 0, upload: 1, extracting: 2, review: 3, importing: 3 }[step] ?? 0)
    : (mode === 'csv'
        ? { upload: 0, mapping: 1, review: 2, importing: 2 }[step] ?? 0
        : { upload: 0, extracting: 1, review: 2, importing: 2 }[step] ?? 0);

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

        {/* Step progress */}
        {showStepBar && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              {stepBarSteps.map((s, i) => {
                const done   = i < stepBarIndex;
                const active = i === stepBarIndex;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      done ? 'bg-green-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-semibold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
                    {i < stepBarSteps.length - 1 && <div className={`h-px w-8 ${done ? 'bg-green-300' : 'bg-gray-200'}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Persistent site banner — shown on every step after site is chosen */}
        {selectedSiteName && step !== 'site-select' && step !== 'done' && (
          <div className="mx-6 mt-3 flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-100 rounded-xl">
            <span className="text-sm">📍</span>
            <p className="text-xs font-semibold text-brand-700 flex-1">
              Importing to: <span className="font-bold">{selectedSiteName}</span>
            </p>
            <button
              onClick={() => { setSelectedOrgId(''); setStep('site-select'); setFile(null); setChildren([]); }}
              className="text-xs text-brand-400 hover:text-brand-600 underline"
            >
              Change
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">

          {/* ── Site select step ── */}
          {step === 'site-select' && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Which site are these children enrolled at?
              </p>

              {/* Search — always shown so sponsors with many sites can filter instantly */}
              {!sitesLoading && sites.length > 0 && (
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search sites…"
                    value={siteSearch}
                    onChange={e => setSiteSearch(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    autoFocus
                  />
                  {siteSearch && (
                    <button onClick={() => setSiteSearch('')} className="absolute right-2.5 top-2.5 text-gray-300 hover:text-gray-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {sitesLoading ? (
                <div className="py-8 text-center text-sm text-gray-400">Loading sites…</div>
              ) : sites.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No sites found. Add a site to your program first.
                </div>
              ) : (
                <>
                  {/* Site count context */}
                  <p className="text-xs text-gray-400 mb-2">
                    {siteSearch
                      ? `${sites.filter(s => s.name.toLowerCase().includes(siteSearch.toLowerCase())).length} result${sites.filter(s => s.name.toLowerCase().includes(siteSearch.toLowerCase())).length !== 1 ? 's' : ''}`
                      : `${sites.length} site${sites.length !== 1 ? 's' : ''} in your program`
                    }
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-4 pr-0.5">
                    {sites
                      .filter(s => !siteSearch || s.name.toLowerCase().includes(siteSearch.toLowerCase()))
                      .map(site => (
                        <button
                          key={site.id}
                          type="button"
                          onClick={() => setSelectedOrgId(site.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                            selectedOrgId === site.id
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              selectedOrgId === site.id ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                            }`}>
                              {selectedOrgId === site.id && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${selectedOrgId === site.id ? 'text-brand-700' : 'text-gray-800'}`}>
                                {site.name}
                              </p>
                              {site.address && (
                                <p className="text-xs text-gray-400 mt-0.5">{site.address}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    {siteSearch && sites.filter(s => s.name.toLowerCase().includes(siteSearch.toLowerCase())).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No sites match "{siteSearch}"</p>
                    )}
                  </div>
                </>
              )}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => setStep('upload')}
                  disabled={!selectedOrgId}
                  className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40"
                >
                  {selectedOrgId
                    ? `Continue with ${sites.find(s => s.id === selectedOrgId)?.name ?? 'selected site'}`
                    : 'Select a site to continue'}
                </button>
              </div>
            </div>
          )}

          {/* ── Upload step ── */}
          {step === 'upload' && (
            <div>
              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => switchMode('ai')}
                  className={`rounded-xl p-3 text-center border-2 transition-all ${
                    mode === 'ai' ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Sparkles className={`w-5 h-5 mx-auto mb-1 ${mode === 'ai' ? 'text-brand-600' : 'text-gray-400'}`} />
                  <p className={`text-xs font-bold ${mode === 'ai' ? 'text-brand-700' : 'text-gray-500'}`}>AI Scan</p>
                  <p className={`text-[10px] mt-0.5 ${mode === 'ai' ? 'text-brand-500' : 'text-gray-400'}`}>PDF or Photo</p>
                </button>
                <button
                  onClick={() => switchMode('csv')}
                  className={`rounded-xl p-3 text-center border-2 transition-all ${
                    mode === 'csv' ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Table2 className={`w-5 h-5 mx-auto mb-1 ${mode === 'csv' ? 'text-brand-600' : 'text-gray-400'}`} />
                  <p className={`text-xs font-bold ${mode === 'csv' ? 'text-brand-700' : 'text-gray-500'}`}>Spreadsheet</p>
                  <p className={`text-[10px] mt-0.5 ${mode === 'csv' ? 'text-brand-500' : 'text-gray-400'}`}>CSV or Excel</p>
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={inputRef} type="file" className="hidden"
                  accept={mode === 'ai'
                    ? '.pdf,.jpg,.jpeg,.png,.webp'
                    : '.csv,.xlsx,.xls,.tsv'}
                  onChange={e => handleFile(e.target.files[0])}
                />
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                {file ? (
                  <div>
                    <p className="font-semibold text-gray-800 text-sm mb-0.5">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-gray-600 mb-1">Drop your file here or click to browse</p>
                    {mode === 'ai'
                      ? <p className="text-xs text-gray-400">PDF, JPG, PNG, WebP · Max 10 MB · iPhone users: save as JPG</p>
                      : <p className="text-xs text-gray-400">CSV, Excel (.xlsx / .xls), TSV · Max 10 MB · First row must be column headers</p>
                    }
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {mode === 'ai' ? (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-semibold text-amber-800 mb-1">Tips for best results</p>
                  <p className="text-xs text-amber-700">Make sure names are clearly readable. Good lighting if taking a photo — avoid shadows. You'll review and correct everything before importing.</p>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800 mb-1">Column names CACFPLink recognizes</p>
                  <p className="text-xs text-blue-700">First Name, Last Name, Date of Birth, Parent Name, Parent Phone, Enrollment Date, Income Tier. Columns that don't match will be skipped — you can fill them in during review.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Column mapping (CSV mode) ── */}
          {step === 'mapping' && (
            <ColumnMapPreview
              colMap={colMap}
              headers={allHeaders}
              onConfirm={confirmColumnMap}
              onBack={() => setStep('upload')}
            />
          )}

          {/* ── Extracting (AI mode) ── */}
          {step === 'extracting' && <ProcessingSteps />}

          {/* ── Review ── */}
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
                  <p className="text-sm">No children were detected. Try a clearer file or add them manually.</p>
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
          {step === 'site-select' ? null : step === 'done' ? (
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
              <button onClick={handleExtract} disabled={!file}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40">
                {mode === 'ai' ? 'Extract Data' : 'Parse Spreadsheet'}
              </button>
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
}
