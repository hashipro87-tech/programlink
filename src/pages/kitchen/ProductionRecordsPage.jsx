// ProductionRecordsPage.jsx (kitchen) — a kitchen logging its OWN production
// records. Previously this was a separate week-grid design (7 columns × 4
// meal rows, click a cell to open a drawer) that looked and behaved nothing
// like the sponsor's "log for a self-managed kitchen" flow. Rebuilt to share
// the exact same form (menu auto-fill, enrollment prefill, previous-record
// sidebar, copy-yesterday, print kitchen sheet, record history) via
// src/components/production/ProductionRecordShared.jsx — same concept as the
// sponsor page, just scoped to the kitchen's own org with no kitchen picker.

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import api from '../../services/api';
import {
  todayISO, emptyItem,
  PreviousRecordPanel, SmartProductionForm, RecordHistory,
} from '../../components/production/ProductionRecordShared';

export default function KitchenProductionRecordsPage() {
  const today = new Date();
  const [month, setMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  );

  const [kitchen,     setKitchen]     = useState(null); // { id, name } — this kitchen's own org
  const [records,     setRecords]     = useState([]);
  const [recLoading,  setRecLoading]  = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Lifted form state so sidebar can write into it
  const [formDate,  setFormDate]  = useState(todayISO());
  const [formMeal,  setFormMeal]  = useState('breakfast');
  const [formItems, setFormItems] = useState([emptyItem()]);

  // Previous record sidebar
  const [prevRecord,       setPrevRecord]       = useState(null);
  const [prevLoading,      setPrevLoading]      = useState(false);
  const [copyingYesterday, setCopyingYesterday] = useState(false);
  const [copiedYesterday,  setCopiedYesterday]  = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        const me = data?.user ?? data;
        if (me?.org_id) setKitchen({ id: me.org_id, name: me.org_name ?? 'Your Kitchen' });
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, []);

  const loadRecords = () => {
    if (!kitchen?.id) { setRecords([]); return; }
    setRecLoading(true);
    api.get('/production-records', { params: { org_id: kitchen.id, month } })
      .then(({ data }) => setRecords(data.records ?? []))
      .catch(() => setRecords([]))
      .finally(() => setRecLoading(false));
  };

  useEffect(() => { loadRecords(); }, [kitchen?.id, month]);

  // Auto-load previous record when date / meal changes
  useEffect(() => {
    if (!kitchen?.id) { setPrevRecord(null); return; }

    const candidates = records
      .filter(r => String(r.date).slice(0, 10) < formDate && r.meal_type === formMeal)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    if (!candidates.length) { setPrevRecord(null); return; }

    setPrevLoading(true);
    api.get(`/production-records/${candidates[0].id}`)
      .then(({ data }) => setPrevRecord(data))
      .catch(() => setPrevRecord(null))
      .finally(() => setPrevLoading(false));
  }, [kitchen?.id, formDate, formMeal, records]);

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
    if (!yesterdayRecords.length || !kitchen) return;
    setCopyingYesterday(true);
    try {
      for (const rec of yesterdayRecords) {
        const { data: full } = await api.get(`/production-records/${rec.id}`);
        const { data: newRec } = await api.post('/production-records', {
          org_id:            kitchen.id,
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
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Records</h1>
          <p className="text-gray-500 mt-1 text-sm">USDA-required daily logs of meals prepared. Complete each record to stay audit-ready.</p>
        </div>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 flex-shrink-0" />
      </div>

      {kitchen ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Left: form + history */}
          <div>
            <SmartProductionForm
              kitchen={kitchen}
              date={formDate}  setDate={setFormDate}
              meal={formMeal}  setMeal={setFormMeal}
              items={formItems} setItems={setFormItems}
              onSaved={loadRecords}
            />
            <RecordHistory
              records={records}
              loading={recLoading}
              onDelete={handleDelete}
              onRefresh={loadRecords}
            />
          </div>

          {/* Right: previous record sidebar */}
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
        </div>
      ) : (
        <div className="card py-14 text-center">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Couldn't load your kitchen profile.</p>
          <p className="text-xs text-gray-400 mt-1">Try reloading the page.</p>
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
