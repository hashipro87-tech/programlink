// FormGeneratorPage.jsx — Pre-fill engine UI
// Sponsor picks org + form template → sees pre-filled fields → downloads PDF.
// Adding a new form type = one object in formDataService.js FORM_TEMPLATES. Zero UI changes.
import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, ChevronRight, RefreshCw, Check,
  Search, Building2, AlertCircle, Info,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({ template, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left border rounded-2xl px-4 py-4 transition-all hover:shadow-sm ${
        selected
          ? 'border-brand-500 bg-brand-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-brand-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${selected ? 'bg-brand-600' : 'bg-gray-100'}`}>
          <FileText className={`w-4 h-4 ${selected ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${selected ? 'text-brand-900' : 'text-gray-900'}`}>{template.label}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{template.description}</p>
        </div>
        {selected && <Check className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />}
      </div>
    </button>
  );
}

// ── Form preview ──────────────────────────────────────────────────────────────
function FormPreview({ formData, downloading, onDownload }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{formData.label}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Pre-filled for: <span className="font-semibold text-gray-700">{formData.org.name}</span>
            {' · '}Generated {new Date(formData.generated_at).toLocaleDateString('en-US')}
          </p>
        </div>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          {downloading
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />
          }
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      {/* Note */}
      {formData.note && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">{formData.note}</p>
        </div>
      )}

      {/* Sections */}
      {formData.sections.map((section, si) => (
        <div key={si} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-brand-600 px-4 py-2.5">
            <p className="text-xs font-bold text-white uppercase tracking-wider">{section.title}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {section.fields.map((field, fi) => (
              <div key={fi} className="px-4 py-3 flex items-baseline gap-4">
                <p className="text-xs font-semibold text-gray-400 w-36 flex-shrink-0">{field.label}</p>
                <p className={`text-sm flex-1 ${field.value ? 'text-gray-900 font-medium' : 'text-gray-300 italic'}`}>
                  {field.value || 'Not on file'}
                </p>
                {!field.value && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">Missing</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Checklist preview */}
      {formData.checklist?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-brand-600 px-4 py-2.5">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Renewal Confirmation</p>
          </div>
          <div className="px-4 py-3 space-y-2">
            {formData.checklist.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature line preview */}
      {formData.signature_line && (
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Signatures</p>
          <div className={`grid gap-6 ${formData.signature_line_2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {[formData.signature_label, formData.signature_line_2 ? formData.signature_label_2 : null]
              .filter(Boolean)
              .map((label, i) => (
                <div key={i}>
                  <div className="border-b border-gray-300 pb-1 mb-1" />
                  <p className="text-xs text-gray-500">{label}</p>
                  <div className="mt-3 text-xs text-gray-400">
                    Print Name: _________________ &nbsp; Title: _________________
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Info className="w-3.5 h-3.5" />
        <span>Missing fields will appear as blank lines in the PDF. Update org info in Settings to fill them.</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FormGeneratorPage() {
  const { user } = useAuth();
  const isSponssor = user?.role === 'sponsor' || user?.role === 'admin';

  const [templates,   setTemplates]   = useState([]);
  const [orgs,        setOrgs]        = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedTpl, setSelectedTpl] = useState('');
  const [formData,    setFormData]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');

  // Load templates + orgs on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [tRes] = await Promise.allSettled([api.get('/forms/templates')]);
        if (tRes.status === 'fulfilled') setTemplates(tRes.value.data.templates ?? []);

        if (isSponssor) {
          const oRes = await api.get('/organizations', { params: { limit: 500 } });
          const all  = oRes.data?.organizations ?? oRes.data ?? [];
          setOrgs(all.filter(o => o.type === 'site' || o.type === 'kitchen'));
        } else {
          // Kitchen/site — only their own org
          setSelectedOrg(user.organizationId);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [isSponssor, user?.organizationId]);

  const loadPreview = useCallback(async (orgId, tplId) => {
    if (!orgId || !tplId) return;
    setLoading(true);
    setError('');
    setFormData(null);
    try {
      const res = await api.get(`/forms/data/${orgId}`, { params: { template: tplId } });
      setFormData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOrgChange = (orgId) => {
    setSelectedOrg(orgId);
    if (selectedTpl) loadPreview(orgId, selectedTpl);
  };

  const handleTplChange = (tplId) => {
    setSelectedTpl(tplId);
    if (selectedOrg) loadPreview(selectedOrg, tplId);
  };

  const handleDownload = async () => {
    if (!selectedOrg || !selectedTpl) return;
    setDownloading(true);
    try {
      const res = await api.get(`/forms/pdf/${selectedOrg}`, {
        params:       { template: selectedTpl },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${formData?.org?.name?.replace(/[^a-z0-9]/gi, '_') ?? 'form'}_${selectedTpl}_${new Date().getFullYear()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const filteredOrgs = orgs.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Form Generator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select an organization and form type — CACFPLink pre-fills every field it already knows.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — selectors */}
        <div className="space-y-5">

          {/* Org picker (sponsor only) */}
          {isSponssor && orgs.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">1. Select Organization</p>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text" placeholder="Search…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                {filteredOrgs.map(o => (
                  <button
                    key={o.id}
                    onClick={() => handleOrgChange(o.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-2.5 transition-colors ${
                      selectedOrg === o.id ? 'bg-brand-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${selectedOrg === o.id ? 'text-brand-600' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${selectedOrg === o.id ? 'font-bold text-brand-700' : 'text-gray-700'}`}>{o.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{o.type}</p>
                    </div>
                    {selectedOrg === o.id && <Check className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
                  </button>
                ))}
                {filteredOrgs.length === 0 && (
                  <p className="px-4 py-3 text-xs text-gray-400">No organizations found.</p>
                )}
              </div>
            </div>
          )}

          {/* Template picker */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              {isSponssor ? '2. Select Form Type' : '1. Select Form Type'}
            </p>
            <div className="space-y-2">
              {templates.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={selectedTpl === t.id}
                  onClick={() => handleTplChange(t.id)}
                />
              ))}
              {templates.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Loading templates…</p>
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 space-y-1.5">
            <p className="text-xs font-bold text-gray-700">How it works</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              CACFPLink pulls org name, address, contact, and sponsor info from your existing records — no re-typing.
              Fields you haven't filled in yet will appear blank in the PDF.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              To fill missing fields, go to <span className="font-semibold">Settings → Organization</span> and update your profile.
            </p>
          </div>
        </div>

        {/* Right column — preview */}
        <div className="lg:col-span-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mb-3" />
              <p className="text-sm">Loading form data…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && !formData && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
              <FileText className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-semibold">Select an organization and form type</p>
              <p className="text-xs mt-1 text-center max-w-xs">
                {isSponssor
                  ? 'Choose a site or kitchen on the left, then pick a form type to see the pre-filled preview.'
                  : 'Choose a form type on the left to see your pre-filled preview.'
                }
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs text-brand-600">
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Fields are auto-filled from your organization profile</span>
              </div>
            </div>
          )}

          {!loading && !error && formData && (
            <FormPreview
              formData={formData}
              downloading={downloading}
              onDownload={handleDownload}
            />
          )}
        </div>
      </div>
    </div>
  );
}
