// SponsorProductionRecordsPage.jsx
// Kitchen-first layout. Self-managed kitchens: sponsor enters records inline.
// Two-column: entry form (left) + Previous Record sidebar (right).
//
// The actual form/history/sidebar UI now lives in
// src/components/production/ProductionRecordShared.jsx, shared with
// KitchenProductionRecordsPage.jsx (a kitchen logging its own records) so the
// two flows can't silently drift into different designs. This file owns only
// the sponsor-specific parts: picking which kitchen you're logging for, and
// the "you manage this kitchen" vs "this kitchen logs its own records" mode
// banner.

import { useState, useEffect } from 'react';
import { ChevronDown, Eye, FileText, PenLine } from 'lucide-react';
import api from '../../services/api';
import {
  todayISO, emptyItem,
  PreviousRecordPanel, SmartProductionForm, RecordHistory,
} from '../../components/production/ProductionRecordShared';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SponsorProductionRecordsPage() {
  const today = new Date();
  const [month, setMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  );

  const [kitchens,    setKitchens]    = useState([]);
  const [kitchenId,   setKitchenId]   = useState('');
  const [records,     setRecords]     = useState([]);
  const [recLoading,  setRecLoading]  = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Lifted form state so sidebar can write into it
  const [formDate,  setFormDate]  = useState(todayISO());
  const [formMeal,  setFormMeal]  = useState('breakfast');
  const [formItems, setFormItems] = useState([emptyItem()]);

  // Previous record sidebar
  const [prevRecord,      setPrevRecord]      = useState(null);
  const [prevLoading,     setPrevLoading]     = useState(false);
  const [copyingYesterday, setCopyingYesterday] = useState(false);
  const [copiedYesterday,  setCopiedYesterday]  = useState(false);

  useEffect(() => {
    api.get('/organizations', { params: { type: 'kitchen', limit: 200 } })
      .then(({ data }) => setKitchens(data.organizations ?? []))
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, []);

  const selectedKitchen = kitchens.find(k => k.id === kitchenId) ?? null;
  const isEntryMode     = selectedKitchen && !selectedKitchen.has_kitchen_users;

  const loadRecords = () => {
    if (!kitchenId) { setRecords([]); return; }
    setRecLoading(true);
    api.get('/production-records', { params: { org_id: kitchenId, month } })
      .then(({ data }) => setRecords(data.records ?? []))
      .catch(() => setRecords([]))
      .finally(() => setRecLoading(false));
  };

  useEffect(() => { loadRecords(); }, [kitchenId, month]);

  // Auto-load previous record when kitchen / date / meal changes
  useEffect(() => {
    if (!kitchenId || !isEntryMode) { setPrevRecord(null); return; }

    const candidates = records
      .filter(r => String(r.date).slice(0, 10) < formDate && r.meal_type === formMeal)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    if (!candidates.length) { setPrevRecord(null); return; }

    setPrevLoading(true);
    api.get(`/production-records/${candidates[0].id}`)
      .then(({ data }) => setPrevRecord(data))
      .catch(() => setPrevRecord(null))
      .finally(() => setPrevLoading(false));
  }, [kitchenId, formDate, formMeal, records, isEntryMode]);

  const handleCopyItem = (item) => {
    setFormItems(prev => {
      const hasEmpty = prev.length === 1 && !prev[0].food_name.trim();
      const base = hasEmpty ? [] : prev;
      return [...base, { food_name: item.food_name, component: item.component || 'other', quantity_actual: '' }];
    });
  };

  const handleCopyAll = (items) => {
    setFormItems(items.map(i => ({
      food_name:      i.food_name,
      component:      i.component || 'other',
      quantity_actual: '',
    })));
  };

  // Compute yesterday's date relative to the form date
  const yesterday = (() => {
    const d = new Date(formDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  const yesterdayRecords = records.filter(r => String(r.date).slice(0, 10) === yesterday);

  const handleCopyYesterday = async () => {
    if (!yesterdayRecords.length || !selectedKitchen) return;
    setCopyingYesterday(true);
    try {
      for (const rec of yesterdayRecords) {
        const { data: full } = await api.get(`/production-records/${rec.id}`);
        const { data: newRec } = await api.post('/production-records', {
          org_id:            selectedKitchen.id,
          date:              formDate,
          meal_type:         full.meal_type,
          servings_planned:  full.servings_planned,
          servings_prepared: 0,   // reset actual — user fills in today's count
          notes:             null,
          status:            'draft',
        });
        if (newRec.id) {
          for (const item of full.items || []) {
            await api.post(`/production-records/${newRec.id}/items`, {
              food_name: item.food_name,
              component: item.component || 'other',
            });
          }
        }
      }
      loadRecords();
      setCopiedYesterday(true);
      setTimeout(() => setCopiedYesterday(false), 4000);
    } catch {
      alert('Failed to copy yesterday\'s records.');
    } finally {
      setCopyingYesterday(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this production record?')) return;
    try {
      await api.delete(`/production-records/${id}`);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Failed to delete — please try again.');
    }
  };

  if (pageLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Production Records</h1>
        <p className="text-gray-500 mt-1 text-sm">USDA-required logs of what each kitchen prepared for every meal service.</p>
      </div>

      {/* Kitchen + month picker */}
      <div className="card px-5 py-4 mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select a Kitchen</label>
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <select value={kitchenId} onChange={e => setKitchenId(e.target.value)}
              className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white pr-10">
              <option value="">— Select a kitchen —</option>
              {kitchens.map(k => (
                <option key={k.id} value={k.id}>
                  {k.name} {!k.has_kitchen_users ? "(I'll log records)" : '(kitchen logs records)'}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 flex-shrink-0" />
        </div>
      </div>

      {/* Mode banner */}
      {selectedKitchen && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium ${
          isEntryMode
            ? 'bg-brand-50 border border-brand-200 text-brand-700'
            : 'bg-gray-50 border border-gray-200 text-gray-600'
        }`}>
          {isEntryMode
            ? <><PenLine className="w-4 h-4 flex-shrink-0" /> You manage this kitchen — log production records below.</>
            : <><Eye className="w-4 h-4 flex-shrink-0" /> This kitchen logs its own records — review submissions below.</>}
        </div>
      )}

      {selectedKitchen ? (
        <div className={isEntryMode ? 'grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6' : ''}>
          {/* Left: form + history */}
          <div>
            {isEntryMode && (
              <SmartProductionForm
                kitchen={selectedKitchen}
                date={formDate}  setDate={setFormDate}
                meal={formMeal}  setMeal={setFormMeal}
                items={formItems} setItems={setFormItems}
                onSaved={loadRecords}
              />
            )}
            <RecordHistory
              records={records}
              loading={recLoading}
              onDelete={handleDelete}
              onRefresh={loadRecords}
            />
          </div>

          {/* Right: previous record sidebar */}
          {isEntryMode && (
            <PreviousRecordPanel
              prevRecord={prevRecord}
              loading={prevLoading}
              meal={formMeal}
              onCopyItem={handleCopyItem}
              onCopyAll={handleCopyAll}
              yesterdayCount={yesterdayRecords.length}
              onCopyYesterday={handleCopyYesterday}
              copyingYesterday={copyingYesterday}
              copiedYesterday={copiedYesterday}
            />
          )}
        </div>
      ) : kitchens.length > 0 ? (
        <div className="card py-14 text-center">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Select a kitchen to view or log production records.</p>
        </div>
      ) : (
        <div className="card py-14 text-center">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">No kitchens yet.</p>
          <p className="text-xs text-gray-400 mt-1">Add kitchens to your program first.</p>
        </div>
      )}

      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mt-6">
        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          USDA 7 CFR Part 226 — production records must be kept for every meal service and retained for 3 years. They must be available for state agency review during audits.
        </p>
      </div>
    </div>
  );
}
