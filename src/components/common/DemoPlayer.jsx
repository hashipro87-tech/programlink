// DemoPlayer.jsx — Auto-playing interactive demo of CACFPLink
// Cycles through 4 screens: Sponsor Overview, Meal Counts, Documents, Compliance

import { useState, useEffect, useRef } from 'react';

const SCENES = [
  {
    label: 'Sponsor Overview',
    url: 'cacfplink.com/dashboard/sponsor',
    nav: ['Overview', 'Applications', 'Compliance', 'Sites', 'Kitchens', 'Documents', 'Settings'],
    active: 0,
  },
  {
    label: 'Meal Count Tracking',
    url: 'cacfplink.com/dashboard/kitchen/meal-counts',
    nav: ['Overview', 'Meal Counts', 'Documents', 'Messages', 'Settings'],
    active: 1,
  },
  {
    label: 'Document Compliance',
    url: 'cacfplink.com/dashboard/kitchen/documents',
    nav: ['Overview', 'Meal Counts', 'Documents', 'Messages', 'Settings'],
    active: 2,
  },
  {
    label: 'Compliance Dashboard',
    url: 'cacfplink.com/dashboard/sponsor/compliance',
    nav: ['Overview', 'Applications', 'Compliance', 'Sites', 'Kitchens', 'Documents', 'Settings'],
    active: 2,
  },
];

const DURATION = 5000;

// ── Badge helper ──────────────────────────────────────────────────────────────
function Badge({ children, color }) {
  const styles = {
    valid:    'bg-green-100 text-green-800',
    expiring: 'bg-yellow-100 text-yellow-800',
    expired:  'bg-red-100 text-red-700',
    pending:  'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full ${styles[color] ?? styles.valid}`}>
      {children}
    </span>
  );
}

// ── Task row ──────────────────────────────────────────────────────────────────
function Task({ dot, children }) {
  const dotColor = dot === 'red' ? 'bg-red-500' : 'bg-yellow-400';
  return (
    <div className="flex items-center gap-2 bg-white border border-yellow-200 rounded-lg px-2.5 py-1.5 mb-1 text-[10px] font-medium text-gray-700">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
      {children}
      <span className="ml-auto text-gray-400 text-[10px]">→</span>
    </div>
  );
}

// ── Screen 0: Sponsor Overview ────────────────────────────────────────────────
function Screen0() {
  return (
    <>
      <p className="text-[13px] font-bold text-gray-900 mb-0.5">Program Overview</p>
      <p className="text-[9px] text-gray-400 mb-2.5">Monitor all sites, kitchens, and compliance status</p>

      {/* Action center */}
      <div className="bg-amber-50 border border-yellow-300 rounded-lg p-2.5 mb-2">
        <p className="text-[8px] font-bold text-amber-800 uppercase tracking-wider mb-1.5">Tasks Requiring Attention</p>
        <Task dot="red">Review 3 pending applications</Task>
        <Task dot="red">1 document expiring within 30 days</Task>
        <Task dot="yellow">Verify meal counts for Eastside Daycare</Task>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {[
          { val: '8', label: 'Sites', color: 'text-blue-600' },
          { val: '4', label: 'Kitchens', color: 'text-green-600' },
          { val: '3', label: 'Pending', color: 'text-yellow-600' },
          { val: '1', label: 'Alerts', color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-lg p-1.5 text-center">
            <p className={`text-base font-black leading-none ${s.color}`}>{s.val}</p>
            <p className="text-[8px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent apps */}
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <p className="px-2.5 py-1.5 text-[10px] font-bold text-gray-900 border-b border-gray-100">Recent Applications</p>
        {[
          { name: 'Sunshine Learning Center', sub: 'Site · 2 days ago', badge: 'pending', badgeLabel: 'Pending' },
          { name: 'Riverside Kitchen', sub: 'Kitchen · 5 days ago', badge: 'approved', badgeLabel: 'Approved' },
        ].map((a) => (
          <div key={a.name} className="px-2.5 py-1.5 flex items-center justify-between border-b last:border-0 border-gray-50">
            <div>
              <p className="text-[10px] font-semibold text-gray-900">{a.name}</p>
              <p className="text-[9px] text-gray-400">{a.sub}</p>
            </div>
            <Badge color={a.badge}>{a.badgeLabel}</Badge>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Screen 1: Meal Counts ─────────────────────────────────────────────────────
function Screen1({ counts, barHeights }) {
  const total = counts.b + counts.l + counts.s + counts.sn;
  return (
    <>
      <p className="text-[13px] font-bold text-gray-900 mb-0.5">Daily Meal Counts</p>
      <p className="text-[9px] text-gray-400 mb-2.5">Thursday, June 18, 2026 — Riverside Kitchen</p>

      <div className="bg-white border border-gray-100 rounded-lg p-2.5 mb-2">
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {[
            { label: 'Breakfast', val: counts.b },
            { label: 'Lunch', val: counts.l },
            { label: 'Supper', val: counts.s },
            { label: 'Snack', val: counts.sn },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-[8px] text-gray-400 font-medium uppercase mb-1">{m.label}</p>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-lg font-black text-gray-900 leading-none">
                {m.val}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Submit Counts</div>
          <p className="text-[9px] text-gray-400">✓ Auto-saved 2m ago</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg px-2.5 py-2 mb-2">
        <p className="text-[9px] font-bold text-green-800 mb-0.5">✓ Today's totals</p>
        <p className="text-[10px] text-green-700">
          {total > 0 ? `${total} meals logged across 4 meal types` : 'Counting…'}
        </p>
      </div>

      {/* Mini bar chart */}
      <div className="bg-white border border-gray-100 rounded-lg p-2.5">
        <p className="text-[9px] font-semibold text-gray-700 mb-2">This week</p>
        <div className="flex gap-1 items-end h-9">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all duration-500 ${i < 4 ? 'bg-brand-600' : 'bg-gray-200'}`}
              style={{ height: `${h}%`, opacity: i < 4 ? 0.6 + i * 0.1 : 1 }}
            />
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {['M','T','W','Th','F'].map((d) => (
            <div key={d} className="flex-1 text-center text-[8px] text-gray-400">{d}</div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Screen 2: Documents ───────────────────────────────────────────────────────
function Screen2() {
  const docs = [
    { icon: '📄', name: 'W-9 Form',               sub: 'Uploaded Jan 15, 2026',          badge: 'valid',    label: 'Valid' },
    { icon: '📋', name: 'Menu Plan',               sub: 'Uploaded Mar 1, 2026',           badge: 'valid',    label: 'Valid' },
    { icon: '🔒', name: 'Insurance Certificate',   sub: 'Expires Jul 2, 2026 · 14 days',  badge: 'expiring', label: 'Expiring' },
    { icon: '📑', name: 'Food Safety Certificate', sub: 'Expired May 1, 2026',             badge: 'expired',  label: 'Expired' },
  ];
  return (
    <>
      <p className="text-[13px] font-bold text-gray-900 mb-0.5">Compliance Documents</p>
      <p className="text-[9px] text-gray-400 mb-2.5">Upload and track required program documents</p>

      <div className="bg-red-50 border border-red-200 rounded-lg px-2.5 py-2 mb-2 flex items-center gap-2">
        <span className="text-xs flex-shrink-0">⚠️</span>
        <p className="text-[10px] text-red-800 font-medium">Insurance Certificate expires in 14 days — upload renewal now</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <div className="px-2.5 py-1.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-900">Documents</p>
          <div className="bg-brand-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">+ Upload</div>
        </div>
        {docs.map((d) => (
          <div key={d.name} className="px-2.5 py-1.5 flex items-center justify-between border-b last:border-0 border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm">{d.icon}</span>
              <div>
                <p className="text-[10px] font-semibold text-gray-900">{d.name}</p>
                <p className={`text-[9px] ${d.badge === 'valid' ? 'text-gray-400' : 'text-red-600 font-medium'}`}>{d.sub}</p>
              </div>
            </div>
            <Badge color={d.badge}>{d.label}</Badge>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Screen 3: Compliance ──────────────────────────────────────────────────────
function Screen3() {
  const orgs = [
    { tier: '🟢', name: 'Sunshine Learning Center', sub: '✓ Approved · 3 valid docs',  score: '95%', scoreStyle: 'bg-green-100 text-green-800' },
    { tier: '🟡', name: 'Riverside Kitchen',         sub: '✓ Approved · 1 doc expiring', score: '62%', scoreStyle: 'bg-yellow-100 text-yellow-800' },
    { tier: '🔴', name: 'Eastside Daycare',           sub: '⏳ Pending · 2 expired docs', score: '30%', scoreStyle: 'bg-red-100 text-red-700' },
    { tier: '🟢', name: 'Westview Kitchen',           sub: '✓ Approved · 3 valid docs',  score: '88%', scoreStyle: 'bg-green-100 text-green-800' },
  ];
  return (
    <>
      <p className="text-[13px] font-bold text-gray-900 mb-0.5">Compliance Dashboard</p>
      <p className="text-[9px] text-gray-400 mb-2.5">Per-organization compliance scores</p>

      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {[
          { val: '12', label: 'Total',     bg: 'bg-blue-50',   color: 'text-blue-700' },
          { val: '8',  label: 'Compliant', bg: 'bg-green-50',  color: 'text-green-700' },
          { val: '3',  label: 'At Risk',   bg: 'bg-yellow-50', color: 'text-yellow-700' },
          { val: '1',  label: 'Critical',  bg: 'bg-red-50',    color: 'text-red-700' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-lg p-1.5 text-center`}>
            <p className={`text-base font-black leading-none ${s.color}`}>{s.val}</p>
            <p className={`text-[8px] font-semibold mt-0.5 ${s.color}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <p className="px-2.5 py-1.5 text-[10px] font-bold text-gray-900 border-b border-gray-100">Organizations</p>
        {orgs.map((o) => (
          <div key={o.name} className="px-2.5 py-1.5 flex items-center gap-2 border-b last:border-0 border-gray-50">
            <span className="text-xs">{o.tier}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-900 truncate">{o.name}</p>
              <p className="text-[9px] text-gray-400">{o.sub}</p>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${o.scoreStyle}`}>
              {o.score}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DemoPlayer() {
  const [cur, setCur] = useState(0);
  const [counts, setCounts] = useState({ b: 0, l: 0, s: 0, sn: 0 });
  const [barHeights, setBarHeights] = useState([0, 0, 0, 0, 10]);
  const timerRef = useRef(null);

  // Auto-advance
  useEffect(() => {
    timerRef.current = setTimeout(() => setCur((c) => (c + 1) % SCENES.length), DURATION);
    return () => clearTimeout(timerRef.current);
  }, [cur]);

  // Animate meal counts on screen 1
  useEffect(() => {
    if (cur !== 1) return;
    setCounts({ b: 0, l: 0, s: 0, sn: 0 });
    setBarHeights([0, 0, 0, 0, 10]);
    const targets = { b: 48, l: 62, s: 31, sn: 20 };
    const steps = 20;
    let t = 0;
    const delay = setTimeout(() => {
      const iv = setInterval(() => {
        t++;
        setCounts({
          b:  Math.min(Math.round(targets.b  * t / steps), targets.b),
          l:  Math.min(Math.round(targets.l  * t / steps), targets.l),
          s:  Math.min(Math.round(targets.s  * t / steps), targets.s),
          sn: Math.min(Math.round(targets.sn * t / steps), targets.sn),
        });
        if (t >= steps) clearInterval(iv);
      }, 55);
      [62, 72, 82, 92, 10].forEach((h, i) => {
        setTimeout(() => setBarHeights((prev) => { const n = [...prev]; n[i] = h; return n; }), i * 80);
      });
    }, 600);
    return () => clearTimeout(delay);
  }, [cur]);

  const scene = SCENES[cur];

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">CACFPLink — Live Demo</span>
        </div>
        <span className="text-[10px] font-bold bg-brand-50 text-brand-600 px-3 py-1 rounded-full">
          {scene.label}
        </span>
      </div>

      {/* Browser frame */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        {/* Browser bar */}
        <div className="bg-gray-50 border-b border-gray-100 px-3 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-md px-2.5 py-1 text-[10px] text-gray-400 font-mono">
            {scene.url}
          </div>
        </div>

        {/* App shell */}
        <div className="flex" style={{ height: 390 }}>
          {/* Sidebar */}
          <div className="w-32 border-r border-gray-100 p-2 bg-white flex-shrink-0">
            <div className="flex items-center gap-1.5 px-1.5 pb-2 mb-2 border-b border-gray-100">
              <div className="w-4 h-4 bg-brand-600 rounded flex items-center justify-center flex-shrink-0">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <span className="text-[10px] font-bold text-gray-900">CACFPLink</span>
            </div>
            {scene.nav.map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium mb-0.5 ${
                  i === scene.active ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === scene.active ? 'bg-brand-500' : 'bg-gray-300'}`} />
                {item}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 bg-gray-50 overflow-hidden relative">
            {[Screen0, Screen1, Screen2, Screen3].map((Scr, i) => (
              <div
                key={i}
                className="absolute inset-0 p-3 overflow-hidden transition-opacity duration-500"
                style={{ opacity: i === cur ? 1 : 0, pointerEvents: i === cur ? 'auto' : 'none' }}
              >
                {i === 1
                  ? <Screen1 counts={counts} barHeights={barHeights} />
                  : <Scr />
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress pips + CTA */}
      <div className="flex items-center gap-3 mt-3">
        <div className="flex gap-1.5 flex-1">
          {SCENES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCur(i)}
              className="flex-1 h-1 rounded-full overflow-hidden bg-gray-200 cursor-pointer"
            >
              <div
                key={`fill-${cur}-${i}`}
                className="h-full bg-brand-600 origin-left"
                style={
                  i === cur
                    ? { animation: `demoFill ${DURATION}ms linear forwards` }
                    : { transform: i < cur ? 'scaleX(1)' : 'scaleX(0)' }
                }
              />
            </button>
          ))}
        </div>
        <a
          href="/register"
          className="flex-shrink-0 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition-colors"
        >
          Try it free →
        </a>
      </div>

      <style>{`@keyframes demoFill { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
    </div>
  );
}
