// HomePage.jsx — Public landing page for CACFPLink.
// Designed to feel like real operations software, not a generic startup page.
// Single-file, no external animation libraries, React + Tailwind only.

import { Link } from 'react-router-dom';
import {
  Camera, FileText, Building2, Users, BarChart2, ShieldCheck,
  ClipboardList, Truck, CheckCircle, AlertTriangle, ArrowRight,
  Zap, Clock, X, Menu, UtensilsCrossed, MapPin, Shield, RefreshCw,
  Activity, Eye, ListTodo, Baby, GraduationCap, Printer, Download,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import DemoPlayer from '../../components/common/DemoPlayer';
import { trackCTAClick } from '../../utils/analytics';

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">CACFPLink</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Impact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              {item}
            </a>
          ))}
          <Link to="/about" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            About
          </Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setOpen((v) => !v)} className="md:hidden p-2 text-gray-500">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
          {['Features', 'How It Works', 'Impact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-gray-600 py-1"
            >
              {item}
            </a>
          ))}
          <Link to="/about" onClick={() => setOpen(false)} className="block text-sm font-medium text-gray-600 py-1">
            About
          </Link>
          <div className="pt-3 flex gap-3 border-t border-gray-100">
            <Link to="/login" className="flex-1 py-2.5 text-center text-sm font-semibold border border-gray-200 rounded-lg text-gray-600">
              Sign In
            </Link>
            <Link to="/register" className="flex-1 py-2.5 text-center text-sm font-semibold bg-brand-600 text-white rounded-lg">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
// Looks like real software — real stat cards, alert badges, table rows.

function DashboardMockup() {
  return (
    <div className="w-full bg-gray-50 rounded-2xl border border-gray-200 shadow-2xl overflow-hidden text-left">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="flex-1 mx-4 h-6 bg-gray-100 rounded-md flex items-center px-3">
          <span className="text-[10px] text-gray-400 font-mono">cacfplink.com/dashboard/kitchen</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col w-44 bg-white border-r border-gray-100 p-3 gap-1 flex-shrink-0">
          <div className="px-3 py-2 mb-2">
            <div className="w-20 h-2 bg-gray-200 rounded" />
            <div className="w-14 h-1.5 bg-brand-100 rounded mt-1.5" />
          </div>
          {[
            { label: 'Overview', active: true },
            { label: 'Meal Counts' },
            { label: 'Documents' },
            { label: 'Deliveries' },
            { label: 'Messages' },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                item.active ? 'bg-brand-50 text-brand-700' : 'text-gray-500'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.active ? 'bg-brand-500' : 'bg-gray-300'}`} />
              <span className="text-[11px] font-medium">{item.label}</span>
              {item.label === 'Messages' && (
                <span className="ml-auto bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span>
              )}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Next action banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-blue-700">Next step: Upload your Insurance Certificate</span>
            <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Upload</span>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'App Status',   value: 'Under Review', color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Sites',        value: '3 Connected',  color: 'text-blue-600',   bg: 'bg-blue-50' },
              { label: 'Docs',         value: '2 / 3',        color: 'text-green-600',  bg: 'bg-green-50' },
            ].map((card) => (
              <div key={card.label} className="bg-white border border-gray-100 rounded-lg p-2.5">
                <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">{card.label}</p>
                <p className={`text-[11px] font-bold mt-0.5 ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Meal count entry */}
          <div className="bg-white border border-gray-100 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-700">Daily Meal Counts — Today</span>
              <span className="text-[9px] text-green-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Saved 2m ago
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Breakfast', val: '48' },
                { label: 'Lunch',     val: '62' },
                { label: 'Supper',    val: '31' },
                { label: 'Snack',     val: '20' },
              ].map((m) => (
                <div key={m.label} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <p className="text-[8px] text-gray-400 uppercase font-medium">{m.label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{m.val}</p>
                </div>
              ))}
            </div>
            {/* Scan button */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-600 rounded-lg">
                <Camera className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold text-white">Scan Slip</span>
              </div>
              <span className="text-[9px] text-gray-400">or enter manually</span>
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-[10px] text-red-700 font-medium flex-1">Insurance Certificate expires in 14 days</span>
              <span className="text-[9px] font-bold text-red-500">Upload</span>
            </div>
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 rounded-lg px-2.5 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
              <span className="text-[10px] text-yellow-700 font-medium flex-1">Delivery to Sunshine Learning — pickup overdue</span>
              <span className="text-[9px] font-bold text-yellow-600">Review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-20 pb-12 sm:pt-28 sm:pb-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            {/* Live pilot badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-700">2 CACFP sponsors in active pilot</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
              Never lose a dollar of{' '}
              <span className="text-brand-600">CACFP reimbursement.</span>
            </h1>

            <p className="text-xl text-gray-500 leading-relaxed mb-8 max-w-lg">
              CACFPLink runs a financial analysis on your claim 24/7 — flagging every missing meal count, expired document, and incomplete enrollment before your state deadline. Sponsors who fix those issues get back every dollar they're owed.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to="/demo"
                onClick={() => trackCTAClick('hero_try_demo')}
                className="flex items-center gap-2 px-7 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg rounded-xl transition-colors shadow-md"
              >
                Try Demo — No Account Needed
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/register"
                onClick={() => trackCTAClick('hero_get_started')}
                className="flex items-center gap-2 px-6 py-4 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Social proof chips */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-6">
              {[
                'Every issue shown with its exact dollar value',
                'Know your reimbursement status every single day',
                'No credit card required',
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: ShieldCheck, label: 'SSL Encrypted' },
                { icon: Shield,      label: 'Role-Based Access' },
                { icon: CheckCircle, label: 'CACFP-Ready' },
                { icon: RefreshCw,   label: '99.9% Uptime' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                  <Icon className="w-3.5 h-3.5 text-brand-500" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative">
            <div className="absolute -inset-4 bg-brand-50 rounded-3xl -z-10" />
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Claim Intelligence Section ──────────────────────────────────────────────

function ClaimIntelligenceSection() {
  const ISSUES = [
    { site:'Happy Kids Site',    issue:'No meal counts submitted this month',  loss:'$820',  dot:'bg-red-500'   },
    { site:'Lincoln Kitchen',    issue:'Insurance certificate expired',         loss:'$1,240', dot:'bg-red-500'   },
    { site:'Eastside Daycare',   issue:'Missing income certs — 3 children',    loss:'$648',  dot:'bg-amber-400' },
    { site:'Westview Site',      issue:'Menu pattern incomplete',               loss:'$820',  dot:'bg-amber-400' },
    { site:'Northside Site',     issue:'Enrollment form not submitted',         loss:'$600',  dot:'bg-amber-400' },
  ];

  return (
    <section className="py-20 px-6 bg-gray-950">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-semibold text-violet-300">Claim Intelligence — NEW</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-5">
              Know exactly how much money you're about to receive —{' '}
              <span className="text-violet-400">every single day.</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-6 text-sm">
              CACFPLink runs a financial analysis on your claim 24/7. Every meal count, every document,
              every child enrolled — the system calculates your reimbursement instantly and flags every
              dollar at risk before your submission deadline.
            </p>
            <div className="space-y-3 mb-8">
              {[
                { icon:'💰', text:'Estimated reimbursement updates in real time with every change' },
                { icon:'⚠️', text:'Every issue shown with an exact dollar amount at risk' },
                { icon:'🔗', text:'One click takes you to the exact fix for each issue' },
                { icon:'📅', text:'Deadline countdown so you never scramble on the last day of the month' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-lg leading-none flex-shrink-0 mt-0.5">{item.icon}</span>
                  <span className="text-sm text-gray-300 leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-violet-400 italic leading-relaxed border-l-2 border-violet-500 pl-4">
              "The goal isn't to help you file claims. It's to help you maximize every reimbursement dollar you're entitled to receive."
            </p>
          </div>

          {/* Right — Claim Intelligence mockup */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Gradient header */}
            <div className="bg-gradient-to-r from-violet-600 to-brand-600 px-5 py-4">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Claim Intelligence</span>
                <span className="text-[10px] text-white/60">⏰ 9 days left · Due Jul 31</span>
              </div>
              <p className="text-white font-bold text-sm">July 2026</p>
            </div>
            <div className="p-5">
              {/* Two key numbers */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide mb-1">Estimated Reimbursement</p>
                  <p className="text-xl font-black text-green-700">$214,873</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide mb-1">At Risk</p>
                  <p className="text-xl font-black text-red-600">$4,128</p>
                </div>
              </div>
              {/* Issues */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Fix these 5 issues to recover all $4,128</p>
              <div className="space-y-1.5">
                {ISSUES.map((issue) => (
                  <div key={issue.site} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${issue.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-gray-800 truncate">{issue.site}</p>
                      <p className="text-[10px] text-gray-400">{issue.issue}</p>
                    </div>
                    <span className="text-[11px] text-red-600 font-bold flex-shrink-0">{issue.loss}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-brand-600 rounded-xl px-4 py-2.5 text-center">
                <span className="text-xs font-bold text-white">View Full Claims Center →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Performance Section ──────────────────────────────────────────────────────

function PerformanceSection() {
  return (
    <section className="py-16 px-6 bg-gray-900 border-t border-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-green-400">Performance Tested</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Can it handle your program? We tested it.
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Before any sponsor went live, we stress-tested CACFPLink with real concurrent load across every major workflow.
          </p>
        </div>

        {/* Big stat grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { value: '300+',   label: 'Organizations',      sub: 'kitchens & sites' },
            { value: '600+',   label: 'Active Users',        sub: 'concurrent sessions' },
            { value: '9,000+', label: 'Meal Records',        sub: '6 months of data' },
            { value: '1,300+', label: 'Documents',           sub: 'all statuses tested' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-center">
              <p className="text-3xl font-black text-white mb-1">{s.value}</p>
              <p className="text-sm font-semibold text-gray-300">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Error rate hero */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-8 py-6 text-center">
          <p className="text-5xl sm:text-6xl font-black text-green-400 mb-2">0.09%</p>
          <p className="text-white font-semibold text-lg mb-1">Error rate under sustained concurrent load</p>
          <p className="text-gray-400 text-sm">159,761 requests benchmarked · 14 endpoints · Sub-200ms p99 latency</p>
        </div>

        {/* Uptime & Reliability */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-bold text-lg">All Systems Operational</span>
            </div>
            <p className="text-xs text-gray-500">Monitored 24/7 with automated alerts</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-center">
            <p className="text-3xl font-black text-white mb-1">99.9%</p>
            <p className="text-sm font-semibold text-gray-300">Target Uptime</p>
            <p className="text-xs text-gray-500 mt-0.5">Monitored every 5 minutes</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-center">
            <p className="text-3xl font-black text-white mb-1">&lt;200ms</p>
            <p className="text-sm font-semibold text-gray-300">p99 Response Time</p>
            <p className="text-xs text-gray-500 mt-0.5">Across all critical endpoints</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-5">
          CACFPLink is monitored around the clock — so it's always there when you need it most, including end of month.
        </p>
      </div>
    </section>
  );
}

// ─── Try Demo Roles Section ───────────────────────────────────────────────────

function TryDemoSection() {
  const roles = [
    {
      to: '/demo/sponsor',
      emoji: '🟣',
      label: 'Sponsor',
      color: 'border-indigo-100 hover:border-indigo-300 bg-white',
      dot: 'bg-indigo-500',
      iconBg: 'bg-indigo-50 text-indigo-600',
      highlights: ['Claim Intelligence — reimbursement at risk every day', 'Compliance dashboard, bulk actions, expiry alerts', 'Menu Builder + Compliance Assistant', 'Child roster, income certs, enrollment', 'Inspection dashboard, task system, activity feed'],
    },
    {
      to: '/demo/kitchen',
      emoji: '🟢',
      label: 'Kitchen',
      color: 'border-emerald-100 hover:border-emerald-300 bg-white',
      dot: 'bg-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
      highlights: ["Today's production schedule per site", 'Menu Builder with CACFP validation', 'Recurring delivery calendar', 'Tasks, documents, activity feed'],
    },
    {
      to: '/demo/site',
      emoji: '🔵',
      label: 'Site',
      color: 'border-sky-100 hover:border-sky-300 bg-white',
      dot: 'bg-sky-500',
      iconBg: 'bg-sky-50 text-sky-600',
      highlights: ['Meal count entry — 4 meal types, 60 seconds', 'Enrollment form + income cert tracking', '7-day delivery schedule', 'Tasks, documents, compliance status'],
    },
    {
      to: '/demo/coordinator',
      emoji: '🟠',
      label: 'Coordinator',
      color: 'border-orange-100 hover:border-orange-300 bg-white',
      dot: 'bg-orange-500',
      iconBg: 'bg-orange-50 text-orange-600',
      highlights: ['Daily work center — applications, sites, alerts', 'Inline approve / reject / request changes', 'Inspection logging + findings tracking', 'Tasks, activity feed, site compliance status'],
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-green-700">No account required</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Explore any role instantly
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Explore the platform with realistic sample data. No account required. No setup. See exactly how CACFPLink works before signing up.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map(({ to, emoji, label, color, dot, highlights }) => (
            <Link
              key={to}
              to={to}
              onClick={() => trackCTAClick(`demo_role_${label.toLowerCase()}`)}
              className={`group border rounded-2xl p-5 transition-all hover:shadow-md ${color}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-3 h-3 rounded-full ${dot}`} />
                <span className="text-sm font-bold text-gray-900">{label}</span>
              </div>
              <ul className="space-y-1.5 mb-5">
                {highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="mt-0.5 text-gray-300">—</span>
                    {h}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:gap-2 transition-all">
                {emoji} Try {label} demo →
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Seen enough?{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline" onClick={() => trackCTAClick('demo_roles_signup')}>
            Create your free account →
          </Link>
        </p>
      </div>
    </section>
  );
}

// ─── Demo Section ─────────────────────────────────────────────────────────────

function DemoSection() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50 border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-brand-700">Interactive Product Demo</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
            Stop Managing CACFP With<br className="hidden sm:block" /> Spreadsheets, Emails &amp; Phone Calls
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            See how sponsors, kitchens, coordinators, and meal sites manage applications, meal counts, compliance, and communication in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Link
              to="/register"
              onClick={() => trackCTAClick('demo_section_try_free')}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Try CACFPLink Free
            </Link>
            <a
              href="#demo"
              className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-xl transition-colors"
            >
              View Demo ↓
            </a>
          </div>
        </div>
        <div id="demo">
          <DemoPlayer />
        </div>
      </div>
    </section>
  );
}

// ─── Workflow Diagram ─────────────────────────────────────────────────────────
// Visual hub-and-spoke showing CACFPLink as the central workflow layer
// connecting all 6 entities: Sponsors, Kitchens, Sites, Meal Counts,
// Compliance Tracking, and Document Workflows.

function WorkflowDiagram() {
  const topNodes = [
    {
      icon: Users,
      label: 'Sponsors',
      desc: 'Program oversight & approvals',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      lineColor: '#3b82f6',
    },
    {
      icon: UtensilsCrossed,
      label: 'Kitchens',
      desc: 'Meal prep & daily counts',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-600',
      lineColor: '#f59e0b',
    },
    {
      icon: MapPin,
      label: 'Sites',
      desc: 'Service locations & staff',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      iconColor: 'text-violet-600',
      lineColor: '#8b5cf6',
    },
  ];

  const bottomNodes = [
    {
      icon: ClipboardList,
      label: 'Meal Counts',
      desc: 'Daily tracking & verification',
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconColor: 'text-green-600',
      lineColor: '#22c55e',
    },
    {
      icon: ShieldCheck,
      label: 'Compliance Tracking',
      desc: 'Status alerts & audit trails',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      iconColor: 'text-rose-600',
      lineColor: '#f43f5e',
    },
    {
      icon: FileText,
      label: 'Document Workflows',
      desc: 'W-9, menus, insurance certs',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      iconColor: 'text-teal-600',
      lineColor: '#14b8a6',
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-brand-700">One workflow layer</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything connected. Nothing fragmented.
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            CACFPLink's strength isn't any one feature — it's that every part of your operation flows through one system, so nothing gets lost between roles, teams, or deadlines.
          </p>
        </div>

        {/* Diagram */}
        <div>
          {/* Top nodes: Sponsors, Kitchens, Sites */}
          <div className="grid grid-cols-3 gap-2 sm:gap-5">
            {topNodes.map((node) => (
              <div
                key={node.label}
                className={`rounded-2xl border ${node.bg} ${node.border} p-3 sm:p-5 text-center`}
              >
                <div className={`w-10 h-10 mx-auto rounded-xl border ${node.border} flex items-center justify-center mb-3 bg-white`}>
                  <node.icon className={`w-5 h-5 ${node.iconColor}`} />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{node.label}</p>
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">{node.desc}</p>
              </div>
            ))}
          </div>

          {/* Connector lines: top nodes → hub */}
          <div className="grid grid-cols-3 gap-2 sm:gap-5">
            {topNodes.map((node) => (
              <div key={node.label} className="flex flex-col items-center py-1">
                <div
                  className="w-px h-7"
                  style={{ background: `linear-gradient(to bottom, ${node.lineColor}88, #4f46e5)` }}
                />
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              </div>
            ))}
          </div>

          {/* CACFPLink Hub */}
          <div className="rounded-2xl bg-brand-600 px-6 py-6 text-center shadow-xl mb-0">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <Zap className="w-5 h-5 text-white" />
              <span className="text-xl font-bold text-white tracking-tight">CACFPLink</span>
            </div>
            <p className="text-brand-200 text-sm font-medium">Centralized Compliance &amp; Operations Workflow</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 sm:gap-8 text-brand-100 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-brand-300" />
                Real-time visibility
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-brand-300" />
                Role-based access
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-brand-300" />
                USDA-ready reporting
              </span>
            </div>
          </div>

          {/* Connector lines: hub → bottom nodes */}
          <div className="grid grid-cols-3 gap-2 sm:gap-5">
            {bottomNodes.map((node) => (
              <div key={node.label} className="flex flex-col items-center py-1">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <div
                  className="w-px h-7"
                  style={{ background: `linear-gradient(to bottom, #4f46e5, ${node.lineColor}88)` }}
                />
              </div>
            ))}
          </div>

          {/* Bottom nodes: Meal Counts, Compliance Tracking, Document Workflows */}
          <div className="grid grid-cols-3 gap-2 sm:gap-5">
            {bottomNodes.map((node) => (
              <div
                key={node.label}
                className={`rounded-2xl border ${node.bg} ${node.border} p-3 sm:p-5 text-center`}
              >
                <div className={`w-10 h-10 mx-auto rounded-xl border ${node.border} flex items-center justify-center mb-3 bg-white`}>
                  <node.icon className={`w-5 h-5 ${node.iconColor}`} />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{node.label}</p>
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">{node.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <p className="text-center text-xs text-gray-400 mt-10 font-medium">
          Every role. Every workflow. One system. — No more chasing emails or lost paperwork.
        </p>
      </div>
    </section>
  );
}

// ─── Compliance Assistant Section ────────────────────────────────────────────

function ComplianceAssistantSection() {
  return (
    <section className="py-20 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-xs font-semibold text-brand-700">Built-in Compliance Guide</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-5">
              CACFP answers,{' '}
              <span className="text-brand-600">right where you're working.</span>
            </h2>
            <p className="text-gray-500 leading-relaxed mb-6 text-sm">
              The Compliance Assistant lives inside the Menu Builder. Every question you'd normally call your state agency about — milk age rules, WGR requirements, infant meals, creditable foods — answered in seconds with USDA citations. No tab switching. No waiting on hold.
            </p>
            <div className="space-y-3 mb-8">
              {[
                { icon: '📋', text: 'Meal component guide for breakfast, lunch, snack, and supper' },
                { icon: '🌾', text: 'Whole grain-rich (WGR) tracking with per-day indicator' },
                { icon: '🍼', text: 'Infant meal track with formula requirement validation' },
                { icon: '⚡', text: 'Live issue detection — clickable errors open the exact cell to fix' },
                { icon: '🔍', text: 'Smart search: type any question, get an answer with a 7 CFR citation' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-lg leading-none flex-shrink-0 mt-0.5">{item.icon}</span>
                  <span className="text-sm text-gray-600 leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-brand-600 font-semibold italic border-l-2 border-brand-300 pl-4">
              No other CACFP platform has a built-in compliance guide tied to what you're currently editing.
            </p>
          </div>

          {/* Right — Compliance Assistant mockup */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-bold text-gray-900">Compliance Assistant</span>
              <span className="ml-auto px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-full border border-brand-100">Texas (TX)</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button className="flex-1 px-4 py-2.5 text-[11px] font-bold text-brand-600 border-b-2 border-brand-500 bg-brand-50">
                USDA Compliance
              </button>
              <button className="flex-1 px-4 py-2.5 text-[11px] font-medium text-gray-400 hover:text-gray-600">
                State Resources
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Search */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-gray-400 text-xs">🔍</span>
                <span className="text-[11px] text-gray-400">Can I serve juice at breakfast?</span>
              </div>

              {/* Search result */}
              <div className="bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span className="text-[10px] font-bold text-brand-700 uppercase">Answer · 7 CFR 226.20(a)</span>
                </div>
                <p className="text-[11px] text-gray-700 leading-relaxed">Yes — 100% fruit juice counts as the fruit/vegetable component at breakfast. Full-strength only; blends with less than 100% juice are not creditable.</p>
              </div>

              {/* Meal guide pills */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Meal Components</p>
                <div className="space-y-1.5">
                  {[
                    { meal: '🌅 Breakfast', components: 'Milk + Grain + Fruit/Veg', ok: true },
                    { meal: '☀️ Lunch',     components: 'Milk + Protein + Grain + 2 Fruit/Veg', ok: true },
                    { meal: '🍎 Snack',     components: '2 of 4 components', ok: true },
                  ].map((row) => (
                    <div key={row.meal} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                      <span className="text-[11px] font-medium text-gray-700 w-20 flex-shrink-0">{row.meal}</span>
                      <span className="text-[10px] text-gray-400 flex-1">{row.components}</span>
                      <span className="text-green-500 text-xs">✓</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live issues */}
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <p className="text-[10px] font-bold text-red-600 uppercase mb-1.5">Live Issues — This Week's Menu</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    Monday Lunch · Missing vegetable component
                    <span className="ml-auto font-bold text-red-500 underline cursor-pointer">Fix →</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    Wednesday · No WGR grain served
                    <span className="ml-auto font-bold text-amber-600 underline cursor-pointer">Fix →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── State Resources Section ──────────────────────────────────────────────────

function StateResourcesSection() {
  const TX_FORMS = [
    'Sponsor Agreement',
    'Site Information Sheet',
    'Income Eligibility Statement',
    'Production Records (90 days)',
    'Attendance Records',
    'Menu Documentation',
  ];

  return (
    <section className="py-20 px-6 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — State Resources mockup */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-violet-600 px-5 py-4">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">State Resources</span>
                <span className="ml-auto px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full">Texas</span>
              </div>
              <p className="text-white font-bold text-sm">Your state rules, rates, and deadlines — in one place.</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Rates */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Reimbursement Rates (FY2025)</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Breakfast', tier1: '$1.70', tier2: '$0.36' },
                    { label: 'Lunch',     tier1: '$3.22', tier2: '$1.72' },
                    { label: 'Snack',     tier1: '$0.96', tier2: '$0.10' },
                    { label: 'Supper',    tier1: '$3.22', tier2: '$1.72' },
                  ].map((r) => (
                    <div key={r.label} className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[8px] text-gray-400 uppercase">{r.label}</p>
                      <p className="text-[11px] font-black text-brand-600">{r.tier1}</p>
                      <p className="text-[9px] text-gray-400">{r.tier2} T2</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deadline + Agency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-[9px] font-bold text-amber-700 uppercase mb-1">Claim Deadline</p>
                  <p className="text-[11px] font-bold text-gray-800">60 days after month end</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">via SquareMeals portal</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-[9px] font-bold text-blue-700 uppercase mb-1">State Agency</p>
                  <p className="text-[11px] font-bold text-gray-800">Texas Dept. of Agriculture</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">squaremeals.org</p>
                </div>
              </div>

              {/* Required forms */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Required Forms</p>
                <div className="space-y-1">
                  {TX_FORMS.map((form) => (
                    <div key={form} className="flex items-center gap-2 text-[11px] text-gray-700">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {form}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-green-700">50 States Supported</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-5">
              Your state's rules —{' '}
              <span className="text-brand-600">instantly.</span>
            </h2>
            <p className="text-gray-500 leading-relaxed mb-6 text-sm">
              CACFP rules vary by state. Reimbursement rates, claim deadlines, required forms, and state portal links — CACFPLink loads your state's complete profile the moment you set up your account. No searching. No calling your state agency for information that hasn't changed in years.
            </p>
            <div className="space-y-3 mb-8">
              {[
                { icon: '💰', text: 'Tier 1 and Tier 2 reimbursement rates for every meal type' },
                { icon: '📅', text: "Your state's claim submission deadline, every month" },
                { icon: '🏛️', text: 'State agency name, portal link, and contact information' },
                { icon: '📝', text: 'Required forms checklist — know what to file before your review' },
                { icon: '📌', text: 'Set your state once on signup — everything updates automatically' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-lg leading-none flex-shrink-0 mt-0.5">{item.icon}</span>
                  <span className="text-sm text-gray-600 leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
            <Link
              to="/register"
              onClick={() => trackCTAClick('state_resources_cta')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors"
            >
              See your state's rules <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Why CACFPLink Comparison ────────────────────────────────────────────────

function WhyCACFPLink() {
  const rows = [
    { before: 'Paper forms and spreadsheets',              after: 'Fully digital workflows' },
    { before: 'Email reminders that get ignored',          after: 'Automatic alerts before deadlines' },
    { before: 'Chasing sites for meal count updates',      after: 'Real-time submission tracking' },
    { before: 'Documents expire without warning',          after: '30-day expiry reminders, automatically' },
    { before: 'No idea what you\'ll get reimbursed until month-end', after: 'Claim Intelligence shows your estimated reimbursement every single day' },
    { before: 'Menu planning done on paper with no validation', after: 'Menu Builder flags missing CACFP components before you submit' },
    { before: 'Child enrollment tracked in spreadsheets', after: 'Child roster with income certs, enrollment compliance, and import from spreadsheet' },
    { before: 'Inspections and findings tracked in email', after: 'Inspection dashboard with findings, corrective actions, and auto-close' },
    { before: 'Generic software you had to adapt',         after: 'Built only for CACFP programs' },
    { before: 'Complicated demos and long sales calls',    after: 'Try it instantly — no account needed' },
    { before: 'No visibility across sites',                after: 'Full compliance dashboard, one screen' },
    { before: 'Coordinators manage via email threads',     after: 'Coordinator assignment + broadcast messaging' },
    { before: 'Staff cert expiry tracked in a spreadsheet', after: 'Training tracker with automatic 30/14/7-day email reminders' },
    { before: 'Filling in the same org info on every form', after: 'Form Generator pre-fills every field from your existing data' },
    { before: 'Claims only export as PDF',                  after: 'PDF, Excel, or CSV — state-specific formats plug in on demand' },
  ];

  return (
    <section className="py-20 px-6 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-brand-700">Why CACFPLink?</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            The way CACFP gets done today vs. how it should work
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            No competitor names. Just a clear look at what most programs are still dealing with — and what CACFPLink replaces.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200">
            <div className="px-6 py-3.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">The old way</span>
            </div>
            <div className="px-6 py-3.5 flex items-center gap-2 bg-brand-600">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">CACFPLink</span>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-2 ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="px-6 py-4 flex items-center gap-3 bg-white">
                <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">{row.before}</span>
              </div>
              <div className="px-6 py-4 flex items-center gap-3 bg-brand-50 border-l border-brand-100">
                <CheckCircle className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">{row.after}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/register"
            onClick={() => trackCTAClick('why_cacfplink_cta')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Problem / Solution ───────────────────────────────────────────────────────

function ProblemSolution() {
  const pairs = [
    {
      before: { icon: FileText,    text: 'Paper delivery slips get lost, misread, or never filed' },
      after:  { icon: Camera,      text: 'Scan any slip with your phone — counts fill in automatically' },
    },
    {
      before: { icon: ClipboardList, text: 'Coordinators chase sites for daily meal count submissions' },
      after:  { icon: CheckCircle,   text: 'Automatic reminders and real-time submission tracking' },
    },
    {
      before: { icon: AlertTriangle, text: 'Compliance documents expire without anyone noticing' },
      after:  { icon: ShieldCheck,   text: 'Expiry alerts surface 30 days early — automatically' },
    },
    {
      before: { icon: Users,         text: 'Managing 10+ sites means 10+ email threads' },
      after:  { icon: Building2,     text: 'Every site, kitchen, and coordinator in one dashboard' },
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Built around how food programs actually work
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            We talked to coordinators, kitchen managers, and sponsors. Here's what we replaced.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {pairs.map(({ before, after }, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              {/* Before */}
              <div className="bg-white border border-red-100 rounded-2xl p-5">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mb-3">
                  <before.icon className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">Before</p>
                <p className="text-sm text-gray-600 leading-relaxed">{before.text}</p>
              </div>

              {/* After */}
              <div className="bg-white border border-green-100 rounded-2xl p-5">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                  <after.icon className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1.5">After</p>
                <p className="text-sm text-gray-600 leading-relaxed">{after.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Grid ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Claim Intelligence',
    desc: 'See your estimated reimbursement every day. Every issue flagged with its exact dollar value — fix what matters before the deadline.',
    tag: '✨ Core',
  },
  {
    icon: ShieldCheck,
    title: 'Menu Builder + Compliance Assistant',
    desc: 'Build a 7-day CACFP menu with real-time meal pattern validation. Built-in Compliance Assistant answers any question instantly — milk age rules, WGR, infant meals.',
  },
  {
    icon: Baby,
    title: 'Child Roster + Income Certs',
    desc: 'Import rosters from spreadsheets or PDFs in seconds. Track enrollment status, income eligibility tiers, and recertification deadlines per child.',
  },
  {
    icon: ClipboardList,
    title: 'Daily Meal Count Tracking',
    desc: 'Breakfast, lunch, supper, snack — per site, per day. Anomaly detection flags unusual counts before submission.',
  },
  {
    icon: FileText,
    title: 'Document Compliance',
    desc: 'W-9, Menu Plan, Insurance — tracked with 30-day expiry alerts so nothing lapses quietly before your next USDA review.',
  },
  {
    icon: AlertTriangle,
    title: 'Inspection Dashboard',
    desc: 'Log monitoring visits, findings, and corrective actions. Track due dates and auto-close inspections when all findings are resolved.',
    tag: '✨ New',
  },
  {
    icon: Building2,
    title: 'Multi-Site Management',
    desc: 'Connect kitchens to the sites they serve. Coordinators see every relationship, every submission, and every alert in one place.',
  },
  {
    icon: Truck,
    title: 'Recurring Delivery Plans',
    desc: 'Set weekly delivery schedules once. Sites see their 7-day calendar automatically. Bulk-create plans for 15 sites in one click.',
  },
  {
    icon: ListTodo,
    title: 'Task System',
    desc: 'Assign tasks across your program with priorities and due dates. Every role sees their own work queue. Nothing falls through the cracks.',
    tag: '✨ New',
  },
  {
    icon: Users,
    title: 'Coordinator Oversight',
    desc: 'Coordinators get a daily work center: pending applications, inspections to review, sites needing attention — organized by priority.',
  },
  {
    icon: Activity,
    title: 'Activity Feed',
    desc: 'Every submission, approval, and action logged in real time. Know what changed, who changed it, and when — across all sites and kitchens.',
    tag: '✨ New',
  },
  {
    icon: Eye,
    title: 'One-Click Audit Mode',
    desc: 'Generate a secure read-only audit portal with one click. Share a link with your state agency — no login required, 30-day expiry, fully self-contained.',
    tag: '✨ New',
  },
  {
    icon: GraduationCap,
    title: 'Staff Training Tracker',
    desc: 'Track every food handler cert, CACFP training, and CPR certification across all sites and kitchens. Automatic email reminders fire at 30, 14, and 7 days before expiry.',
    tag: '✨ New',
  },
  {
    icon: Printer,
    title: 'Form Generator',
    desc: 'Generate pre-filled CACFP forms in seconds. Org name, address, contact, and sponsor number fill in automatically from your existing data — no re-typing.',
    tag: '✨ New',
  },
  {
    icon: Download,
    title: 'Multi-Format Claim Export',
    desc: 'Export your monthly claim as a branded PDF, a formatted Excel workbook, or a CSV. State-specific formats (Texas SquareMeals, CNIPS) plug in without rebuilding anything.',
    tag: '✨ New',
  },
];

function Features() {
  return (
    <section id="features" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything your program needs. Nothing it doesn't.
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Every feature was built for food program operations — not adapted from a generic tool.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative bg-gray-50 hover:bg-white border border-gray-100 hover:border-brand-200 hover:shadow-md rounded-2xl p-5 transition-all duration-200"
            >
              {f.tag && (
                <span className="absolute top-4 right-4 text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                  {f.tag}
                </span>
              )}
              <div className="w-9 h-9 bg-white group-hover:bg-brand-50 border border-gray-200 group-hover:border-brand-200 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <f.icon className="w-4 h-4 text-gray-500 group-hover:text-brand-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Compliance Dashboard Mockup ─────────────────────────────────────────────

function ComplianceMockup() {
  const orgs = [
    { name: 'Sunshine Learning Center', type: 'site',    tier: 'compliant', score: 95, app: 'approved', docs: '3 valid',          expiry: null },
    { name: 'Riverside Kitchen',        type: 'kitchen', tier: 'at_risk',   score: 62, app: 'approved', docs: '1 valid · 1 expiring', expiry: '12d' },
    { name: 'Eastside Daycare',         type: 'site',    tier: 'critical',  score: 30, app: 'pending',  docs: '0 valid · 2 expired', expiry: '3d ago' },
    { name: 'Westview Kitchen',         type: 'kitchen', tier: 'compliant', score: 88, app: 'approved', docs: '3 valid',          expiry: null },
  ];
  const tierColor = { compliant: 'text-green-500', at_risk: 'text-yellow-500', critical: 'text-red-500' };
  const scoreColor = { compliant: 'bg-green-100 text-green-700', at_risk: 'bg-yellow-100 text-yellow-700', critical: 'bg-red-100 text-red-600' };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden text-left">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="flex-1 mx-4 h-6 bg-gray-100 rounded-md flex items-center px-3">
          <span className="text-[10px] text-gray-400 font-mono">cacfplink.com/dashboard/sponsor/compliance</span>
        </div>
      </div>

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Compliance</p>
            <p className="text-[10px] text-gray-400">Monitor document status across all sites and kitchens</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg">
            <RefreshCw className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-500 font-medium">Refresh</span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Total Orgs', value: '12', color: 'text-blue-600',  bg: 'bg-blue-50' },
            { label: 'Compliant',  value: '8',  color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'At Risk',    value: '3',  color: 'text-yellow-600',bg: 'bg-yellow-50' },
            { label: 'Critical',   value: '1',  color: 'text-red-600',   bg: 'bg-red-50' },
          ].map((c) => (
            <div key={c.label} className={`${c.bg} rounded-xl p-2.5`}>
              <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">{c.label}</p>
              <p className={`text-lg font-black ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Alert banner */}
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-[10px] text-red-700 font-medium">2 expired documents · 1 expiring within 14 days</p>
        </div>

        {/* Org rows */}
        <div className="bg-gray-50 rounded-xl overflow-hidden">
          {orgs.map((org, i) => (
            <div key={org.name} className={`flex items-center gap-2.5 px-3 py-2.5 ${i < orgs.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <Shield className={`w-3.5 h-3.5 flex-shrink-0 ${tierColor[org.tier]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-semibold text-gray-900 truncate">{org.name}</p>
                  <span className="text-[9px] bg-gray-200 text-gray-500 px-1 rounded uppercase font-bold">{org.type}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] ${org.app === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {org.app === 'approved' ? '✓ Approved' : '⏳ Pending'}
                  </span>
                  <span className="text-[9px] text-gray-400">{org.docs}</span>
                  {org.expiry && (
                    <span className="text-[9px] text-red-500 font-medium">⏱ {org.expiry}</span>
                  )}
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${scoreColor[org.tier]}`}>
                {org.score}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Action Center Mockup ─────────────────────────────────────────────────────

function ActionCenterMockup() {
  const tasks = [
    { label: 'Review 3 pending applications', urgent: true },
    { label: '1 document expiring within 30 days', urgent: true },
    { label: 'Verify meal counts for Eastside Daycare', urgent: false },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden text-left">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="flex-1 mx-4 h-6 bg-gray-100 rounded-md flex items-center px-3">
          <span className="text-[10px] text-gray-400 font-mono">cacfplink.com/dashboard/sponsor</span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm font-bold text-gray-900 mb-3">Program Overview</p>

        {/* Action Center */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2">Tasks Requiring Attention</p>
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.label} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-100">
                {t.urgent
                  ? <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                  : <Clock className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                }
                <span className="text-[10px] text-gray-700 font-medium flex-1">{t.label}</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Sites',      value: '8',  color: 'text-blue-600' },
            { label: 'Kitchens',   value: '4',  color: 'text-green-600' },
            { label: 'Pending',    value: '3',  color: 'text-yellow-600' },
            { label: 'Alerts',     value: '1',  color: 'text-red-600' },
          ].map((c) => (
            <div key={c.label} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-gray-400 uppercase">{c.label}</p>
              <p className={`text-base font-black ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Screenshots Section ──────────────────────────────────────────────────────

function ScreenshotsSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-brand-700">See it in action</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Purpose-built for CACFP operations
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Not adapted from a generic tool. Every screen was designed around real food program workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Compliance Dashboard */}
          <div>
            <div className="mb-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full uppercase tracking-wide mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                Compliance Dashboard
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">Know every org's compliance status at a glance</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Per-organization compliance scores, document expiry alerts, and tier classification — so you're never caught off guard before a USDA review.
              </p>
            </div>
            <ComplianceMockup />
          </div>

          {/* Action Center */}
          <div>
            <div className="mb-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wide mb-3">
                <CheckCircle className="w-3.5 h-3.5" />
                Action Center
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">Every role sees exactly what needs attention</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Sponsors, coordinators, kitchens, and sites each get a focused list of outstanding tasks — no inbox hunting, no spreadsheet-checking.
              </p>
            </div>
            <ActionCenterMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Trust Section ────────────────────────────────────────────────────────────

function TrustSection() {
  const pillars = [
    {
      icon: ClipboardList,
      title: 'Reliable meal reporting',
      desc: 'Daily counts logged, verified, and summarized — audit-ready the moment you need them.',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      icon: FileText,
      title: 'Document tracking',
      desc: 'W-9s, menu plans, insurance certs — tracked with 30-day expiry alerts so nothing lapses quietly.',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      icon: ShieldCheck,
      title: 'Audit-ready records',
      desc: 'Every submission, approval, and document change is logged with a timestamp and actor name.',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Built for organizations that take compliance seriously
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Built for organizations that need reliable meal reporting, document tracking, and audit-ready records — not a tool you have to adapt to fit a USDA workflow.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {pillars.map((p) => (
            <div key={p.title} className={`bg-white border ${p.border} rounded-2xl p-6`}>
              <div className={`w-10 h-10 ${p.bg} rounded-xl flex items-center justify-center mb-4`}>
                <p.icon className={`w-5 h-5 ${p.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* CACFP-specific callout */}
        <div className="mt-8 bg-brand-600 rounded-2xl px-8 py-6 text-center">
          <p className="text-white font-semibold text-lg mb-1">Built specifically for CACFP sponsors, kitchens, and meal sites.</p>
          <p className="text-brand-200 text-sm">Not a generic project tool. Not a repurposed HR system. Purpose-built for USDA food program compliance.</p>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Kitchens log their day',
      desc: 'Kitchen staff scan a delivery slip or manually enter Breakfast, Lunch, Supper, and Snack counts. Takes under 60 seconds.',
      detail: ['Scan delivery slip with phone camera', 'OCR fills counts automatically', 'Review, confirm, done'],
    },
    {
      num: '02',
      title: 'Coordinators review operations',
      desc: 'Coordinators see every site submission in real time, verify counts, and flag anything unusual before it hits a report.',
      detail: ['See all site submissions live', 'One-click count verification', 'Automatic anomaly alerts'],
    },
    {
      num: '03',
      title: 'Sponsors track everything centrally',
      desc: 'Sponsors get a full view across all kitchens, sites, and coordinators — with monthly summaries ready for USDA reporting.',
      detail: ['Full multi-site dashboard', 'Monthly USDA-ready summaries', 'Compliance document tracking'],
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Three roles. One system. No training required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(100%+1rem)] w-8 h-px bg-gray-300 z-10" />
              )}

              <div className="bg-white rounded-2xl border border-gray-100 p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-black text-brand-100">{step.num}</span>
                  <h3 className="font-bold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{step.desc}</p>
                <ul className="space-y-2">
                  {step.detail.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-xs text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Impact Stats ─────────────────────────────────────────────────────────────

function Impact() {
  const stats = [
    { value: '4 hrs',   label: 'Saved per site per week',      sub: 'vs. manual spreadsheet tracking' },
    { value: '94%',     label: 'On-time submission rate',       sub: 'with automated reminders' },
    { value: '0',       label: 'Paper forms required',          sub: 'fully digital workflow' },
    { value: '< 60s',   label: 'To log a full day of counts',   sub: 'with delivery slip scanning' },
  ];

  return (
    <section id="impact" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Real impact for real programs
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Built around actual coordinator and kitchen workflows, not theoretical ones.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
              <p className="text-4xl font-black text-brand-600 mb-2">{s.value}</p>
              <p className="font-semibold text-gray-900 text-sm mb-1">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Mobile Section ───────────────────────────────────────────────────────────

function MobileSection() {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-green-700">Designed for the kitchen floor</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Works on the phone in your pocket
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Kitchen staff don't sit at desks. CACFPLink is built mobile-first — large buttons, fast loading, and a camera that reads your delivery slips so staff never have to count twice.
            </p>
            <ul className="space-y-4">
              {[
                { icon: Camera,      text: 'Scan delivery slips from any phone camera' },
                { icon: CheckCircle, text: 'Submit meal counts in under 60 seconds' },
                { icon: Clock,       text: 'View alerts and deadlines on the go' },
                { icon: Truck,       text: 'Confirm deliveries with one tap' },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-3.5 h-3.5 text-brand-600" />
                  </div>
                  <span className="text-sm text-gray-600">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phone mockup built in pure HTML */}
          <div className="flex justify-center">
            <div className="relative w-64">
              {/* Phone frame */}
              <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-gray-50 px-5 pt-3 pb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-600">9:41</span>
                    <div className="w-20 h-4 bg-gray-900 rounded-full" /> {/* notch */}
                    <div className="flex gap-1">
                      <div className="w-3 h-1.5 bg-gray-600 rounded-sm" />
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                    </div>
                  </div>

                  {/* App content */}
                  <div className="bg-white px-4 py-3">
                    <p className="text-[11px] font-bold text-gray-900 mb-1">Scan Delivery Slip</p>
                    <p className="text-[9px] text-gray-400 mb-3">Tap below to open your camera</p>

                    {/* Camera viewfinder mock */}
                    <div className="bg-gray-900 rounded-xl h-32 flex items-center justify-center mb-3 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-brand-400 to-brand-800" />
                      <div className="relative text-center">
                        <Camera className="w-7 h-7 text-white mx-auto mb-1" />
                        <p className="text-[9px] text-white font-medium">Point at delivery slip</p>
                      </div>
                      {/* Corner brackets */}
                      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl" />
                      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr" />
                      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl" />
                      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-white rounded-br" />
                    </div>

                    {/* Extracted counts */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 mb-3">
                      <p className="text-[9px] font-bold text-green-700 mb-1.5">✓ Counts extracted</p>
                      <div className="grid grid-cols-4 gap-1">
                        {[['B', '48'], ['L', '62'], ['S', '31'], ['Snk', '20']].map(([l, v]) => (
                          <div key={l} className="bg-white rounded border border-green-100 p-1 text-center">
                            <p className="text-[8px] text-gray-400">{l}</p>
                            <p className="text-[11px] font-bold text-gray-900">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-brand-600 rounded-lg py-2 text-center">
                      <span className="text-[11px] font-bold text-white">Save Counts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Security Section ─────────────────────────────────────────────────────────

function SecuritySection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full mb-4">
            <Shield className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Security & Privacy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Built for government-adjacent programs
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            CACFP programs handle sensitive data. CACFPLink is designed from the ground up with security and privacy as core requirements — not afterthoughts.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Encrypted connections (HTTPS)', desc: 'All data in transit is protected with TLS encryption across the entire platform.' },
            { title: 'Role-based access controls', desc: 'Each user only sees data relevant to their role — sponsors, coordinators, kitchens, and sites are fully isolated.' },
            { title: 'Secure document storage', desc: 'Compliance documents are stored securely with access logging and audit trails.' },
            { title: 'Privacy-first design', desc: 'Your program data is never sold to third parties or used for advertising. Period.' },
            { title: 'No data sharing', desc: 'Program operational data stays within your organization and CACFPLink infrastructure only.' },
            { title: 'Transparent about our stack', desc: 'Our Privacy Policy clearly lists every third-party service we use and why.' },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/privacy" className="text-sm text-brand-600 hover:underline font-medium">
            Read our full Privacy Policy →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "We were managing everything in spreadsheets. Now I can see which sites are missing documents in seconds — and send reminders to all of them at once.",
    name: "Program Coordinator",
    org: "Multi-site CACFP Sponsor",
    initials: "PC",
    color: "bg-brand-600",
  },
  {
    quote: "The compliance dashboard alone saved us hours every week. We used to manually track expiration dates in a spreadsheet. Now it just tells us what needs attention.",
    name: "Operations Manager",
    org: "Regional CACFP Sponsor",
    initials: "OM",
    color: "bg-emerald-600",
  },
  {
    quote: "Simple enough that our site directors could use it without any training. That's rare in this space.",
    name: "Site Director",
    org: "CACFP Center Site",
    initials: "SD",
    color: "bg-violet-600",
  },
];

function Testimonials() {
  return (
    <section className="py-20 px-6 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-4">
            <span className="text-xs font-semibold text-brand-600">From the field</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            What CACFP operators say
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Real feedback from coordinators, managers, and site directors using CACFPLink.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-7 border border-gray-100 flex flex-col gap-5">
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.453 2.504c-.784.57-1.838-.197-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.55 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z"/>
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 text-sm leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xs font-bold text-white">{t.initials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.org}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Early access pilot program — names withheld at sponsor request.
        </p>
      </div>
    </section>
  );
}

// ─── Founder Story ────────────────────────────────────────────────────────────

function FounderStory() {
  return (
    <section className="py-20 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-brand-700">About the Founder</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Meet the person behind CACFPLink
          </h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Photo */}
            <div className="sm:w-64 flex-shrink-0">
              <img
                src="/IMG_6752.jpeg"
                alt="Hashi, Founder of CACFPLink"
                className="w-full h-72 sm:h-full object-cover object-top"
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center">
              <div className="mb-6">
                <p className="text-2xl font-bold text-gray-900 mb-0.5">Hashi</p>
                <p className="text-sm font-semibold text-brand-600">Founder, CACFPLink</p>
              </div>

              <blockquote className="text-lg text-gray-700 leading-relaxed mb-6 border-l-4 border-brand-200 pl-5">
                "Hi, I'm Hashi, founder of CACFPLink. I started CACFPLink after seeing how much
                time sponsors, coordinators, and centers lose juggling paperwork, spreadsheets,
                and outdated software. My goal is simple: build modern software that makes running
                CACFP easier, faster, and less stressful for everyone involved."
              </blockquote>

              <a
                href="mailto:cacfplink@gmail.com"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline"
              >
                cacfplink@gmail.com →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ─────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section className="py-20 px-6 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-brand-700">Pricing</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            Simple pricing. Built for sponsors of every size.
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            No per-site fees that punish growth. No setup costs. No hidden charges.
            During our pilot period, early sponsors get full access free.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Pilot tier */}
          <div className="relative bg-brand-600 rounded-2xl p-8 text-white overflow-hidden">
            <div className="absolute top-5 right-5">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-400/20 border border-green-400/30 rounded-full text-xs font-bold text-green-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Now Open
              </span>
            </div>
            <p className="text-xs font-bold text-brand-300 uppercase tracking-widest mb-2">Pilot Program</p>
            <p className="text-5xl font-black text-white mb-1">Free</p>
            <p className="text-brand-200 text-sm mb-6">During the pilot period</p>
            <ul className="space-y-3 mb-8">
              {[
                'Full platform access — every feature',
                'Direct access to the founder',
                'Influence over the roadmap',
                'Hands-on onboarding support',
                'First access to every new release',
                'No credit card required',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-brand-100">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              onClick={() => trackCTAClick('pricing_pilot_cta')}
              className="block text-center py-3 bg-white hover:bg-gray-50 text-brand-700 font-bold rounded-xl transition-colors"
            >
              Join as a Pilot Sponsor →
            </Link>
          </div>

          {/* Paid tier coming soon */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 flex flex-col">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">After Pilot</p>
            <p className="text-3xl font-black text-gray-900 mb-1">Early Access Pricing</p>
            <p className="text-gray-400 text-sm mb-6">Locked in for pilot sponsors forever</p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Flat monthly rate — not per site',
                'Scales with your program, not against it',
                'Everything included, no add-on fees',
                'Priority support for early partners',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="mailto:cacfplink@gmail.com"
              onClick={() => trackCTAClick('pricing_contact_cta')}
              className="block text-center py-3 border-2 border-gray-200 hover:border-brand-300 text-gray-700 hover:text-brand-700 font-bold rounded-xl transition-colors"
            >
              Contact us for pricing details →
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Questions? Email us at{' '}
          <a href="mailto:cacfplink@gmail.com" className="text-brand-600 hover:underline font-medium">
            cacfplink@gmail.com
          </a>
          {' '}— we typically reply within a few hours.
        </p>
      </div>
    </section>
  );
}

// ─── ROI Calculator ──────────────────────────────────────────────────────────
// CACFP FY2025 federal reimbursement rates (USDA-set, same in all states)
const TIER_RATES = {
  tier1: { breakfast: 1.70, lunch: 3.22, snack: 0.96, supper: 3.22 },
  tier2: { breakfast: 0.36, lunch: 1.72, snack: 0.10, supper: 1.72 },
};
const OPERATING_DAYS = 20;

function ROICalculator() {
  const [sites,       setSites]       = useState(5);
  const [enrollment,  setEnrollment]  = useState(30);
  const [tier,        setTier]        = useState('tier1');
  const [meals,       setMeals]       = useState({ breakfast: true, lunch: true, snack: true, supper: false });

  const { monthly, annual, daily } = useMemo(() => {
    const rates  = TIER_RATES[tier] ?? TIER_RATES.tier1;
    const perDay = Object.entries(meals).reduce((sum, [m, on]) => on ? sum + (rates[m] ?? 0) : sum, 0);
    const monthly = Math.round(sites * enrollment * OPERATING_DAYS * perDay);
    return { monthly, annual: monthly * 12, daily: Math.round(sites * enrollment * perDay) };
  }, [sites, enrollment, tier, meals]);

  function toggleMeal(m) {
    setMeals(prev => ({ ...prev, [m]: !prev[m] }));
  }

  const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-4">
            <BarChart2 className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-xs font-semibold text-brand-700">Reimbursement Estimator</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            How much is your program worth?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">
            Enter your program details below to see your estimated CACFP reimbursement.
            CACFPLink protects every dollar by flagging issues before your submission deadline.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left — inputs */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-gray-100">
              <p className="text-sm font-bold text-gray-700 mb-6">Your program</p>

              {/* Number of sites */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Number of sites / daycares
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSites(s => Math.max(1, s - 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold text-lg">
                    −
                  </button>
                  <span className="text-3xl font-black text-gray-900 w-12 text-center">{sites}</span>
                  <button onClick={() => setSites(s => Math.min(200, s + 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold text-lg">
                    +
                  </button>
                  <input type="range" min={1} max={200} value={sites} onChange={e => setSites(+e.target.value)}
                    className="flex-1 accent-brand-600" />
                </div>
              </div>

              {/* Enrollment per site */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Average children per site
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEnrollment(e => Math.max(5, e - 5))}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold text-lg">
                    −
                  </button>
                  <span className="text-3xl font-black text-gray-900 w-12 text-center">{enrollment}</span>
                  <button onClick={() => setEnrollment(e => Math.min(500, e + 5))}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold text-lg">
                    +
                  </button>
                  <input type="range" min={5} max={500} step={5} value={enrollment} onChange={e => setEnrollment(+e.target.value)}
                    className="flex-1 accent-brand-600" />
                </div>
              </div>

              {/* Meals served */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Meals served daily
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key:'breakfast', label:'Breakfast' },
                    { key:'lunch',     label:'Lunch'     },
                    { key:'snack',     label:'Snack'     },
                    { key:'supper',    label:'Supper'    },
                  ].map(({ key, label }) => {
                    const rate = (TIER_RATES[tier] ?? TIER_RATES.tier1)[key];
                    return (
                      <button key={key} onClick={() => toggleMeal(key)}
                        className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 text-xs font-bold transition-colors ${
                          meals[key]
                            ? 'border-brand-400 bg-brand-50 text-brand-700'
                            : 'border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}>
                        <span className="capitalize">{label}</span>
                        <span className={`text-[10px] font-normal mt-0.5 ${meals[key] ? 'text-brand-500' : 'text-gray-300'}`}>
                          ${rate.toFixed(2)}/child
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Program Tier */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Program Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'tier1', label: 'Tier 1', sub: 'Income-eligible sites' },
                    { value: 'tier2', label: 'Tier 2', sub: 'All other sites' },
                  ].map(({ value, label, sub }) => (
                    <button key={value} onClick={() => setTier(value)}
                      className={`flex flex-col items-start px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                        tier === value
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <span className={`text-sm font-bold ${tier === value ? 'text-brand-700' : 'text-gray-600'}`}>{label}</span>
                      <span className={`text-[10px] mt-0.5 ${tier === value ? 'text-brand-500' : 'text-gray-400'}`}>{sub}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">Based on USDA FY2025 federal reimbursement rates. All states use the same federal rates.</p>
              </div>
            </div>

            {/* Right — result */}
            <div className="p-8 flex flex-col justify-between bg-gradient-to-br from-brand-600 to-violet-700">
              <div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-wide mb-6">Your estimated CACFP reimbursement</p>

                <div className="mb-8">
                  <p className="text-white/70 text-sm mb-1">Monthly</p>
                  <p className="text-5xl font-black text-white leading-none mb-1">{fmt(monthly)}</p>
                  <p className="text-white/50 text-xs">{sites} {sites===1?'site':'sites'} × {enrollment} children × {OPERATING_DAYS} days</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                    <p className="text-white/60 text-xs mb-1">Annual</p>
                    <p className="text-2xl font-black text-white">{fmt(annual)}</p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                    <p className="text-white/60 text-xs mb-1">Per day</p>
                    <p className="text-2xl font-black text-white">{fmt(daily)}</p>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-6">
                  <p className="text-white/70 text-xs font-semibold mb-2">What CACFPLink protects</p>
                  <p className="text-white text-sm leading-relaxed">
                    Every disallowance issue we catch before submission day protects dollars from this total.
                    A 2% error rate on {fmt(annual)}/year = <span className="font-bold text-green-300">{fmt(Math.round(annual * 0.02))} recovered</span>.
                  </p>
                </div>
              </div>

              <Link to="/register" onClick={() => trackCTAClick('roi_calculator_cta')}
                className="block text-center py-3 bg-white hover:bg-gray-50 text-brand-700 font-bold rounded-xl transition-colors">
                Protect this reimbursement with CACFPLink →
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Rates are illustrative estimates based on USDA FY2025 Tier 1 reimbursement rates. Actual reimbursements depend on meal type, income eligibility tier, and state-specific rates. No credit card required to sign up.
        </p>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

// ─── Contact Section ──────────────────────────────────────────────────────────

function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', role: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://programlink-production.up.railway.app/api'}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Have questions? We're here.</h2>
          <p className="text-gray-500">
            Whether you're a sponsor, kitchen, or site — reach out and we'll get back to you the same day.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Message received!</h3>
            <p className="text-gray-500 text-sm">We'll get back to you at <strong>{form.email}</strong> shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your name <span className="text-red-500">*</span></label>
                <input
                  required value={form.name} onChange={set('name')}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address <span className="text-red-500">*</span></label>
                <input
                  required type="email" value={form.email} onChange={set('email')}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I am a…</label>
              <select
                value={form.role} onChange={set('role')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Select your role (optional)</option>
                <option value="sponsor">Sponsor / Program Administrator</option>
                <option value="kitchen">Kitchen / Food Production Site</option>
                <option value="site">Site / Daycare Center</option>
                <option value="coordinator">Coordinator</option>
                <option value="other">Other / Just curious</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
              <textarea
                required value={form.message} onChange={set('message')}
                rows={4}
                placeholder="Tell us about your program, or ask anything you'd like to know..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            {status === 'error' && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                Something went wrong. Please try again or email us directly at cacfplink@gmail.com.
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
            <p className="text-center text-xs text-gray-400">We typically reply within a few hours.</p>
          </form>
        )}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-20 px-6 bg-brand-600">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Modernize your food program operations
        </h2>
        <p className="text-brand-200 text-lg mb-10 max-w-xl mx-auto">
          Join kitchens, coordinators, and sponsors already managing their programs with CACFPLink.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            onClick={() => trackCTAClick('bottom_cta_get_started')}
            className="px-8 py-4 bg-white hover:bg-gray-50 text-brand-700 font-bold rounded-xl transition-colors shadow-sm"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl border border-brand-400 transition-colors"
          >
            Sign In
          </Link>
        </div>
        <p className="text-brand-300 text-xs mt-6">No credit card required · Set up in minutes</p>
      </div>
    </section>
  );
}

// ─── Pilot Section ────────────────────────────────────────────────────────────

function PilotSection() {
  return (
    <section className="py-16 px-6 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="bg-brand-600 rounded-3xl px-8 py-12 sm:px-14 sm:py-14 flex flex-col sm:flex-row items-center gap-10">
          {/* Left */}
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full mb-5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wide">Pilot Program — Now Open</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
              Be one of the first sponsors on CACFPLink.
            </h2>
            <p className="text-brand-200 text-sm leading-relaxed mb-6 max-w-md">
              We're working closely with early sponsors across Iowa, Ohio, Virginia, Colorado, and beyond.
              Pilot partners help shape features and get hands-on support from day one.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-6">
              {['Iowa', 'Ohio', 'Virginia', 'Colorado'].map((state) => (
                <span key={state} className="px-3 py-1 bg-white/10 border border-white/20 text-white text-xs font-semibold rounded-full">
                  {state}
                </span>
              ))}
              <span className="px-3 py-1 bg-white/10 border border-white/20 text-white text-xs font-semibold rounded-full">
                + more states
              </span>
            </div>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <Link
                to="/register"
                onClick={() => trackCTAClick('pilot_get_started')}
                className="px-6 py-3 bg-white hover:bg-gray-50 text-brand-700 font-bold text-sm rounded-xl transition-colors shadow-sm"
              >
                Join as a Pilot Sponsor →
              </Link>
              <a
                href="mailto:cacfplink@gmail.com"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Ask a question
              </a>
            </div>
          </div>

          {/* Right — what you get */}
          <div className="w-full sm:w-64 flex-shrink-0 bg-white/10 border border-white/20 rounded-2xl p-6 text-sm text-white space-y-3">
            <p className="font-bold text-white mb-4">What pilot partners get:</p>
            {[
              'Direct access to the founder',
              'Influence over new features',
              'Hands-on onboarding support',
              'Free during the pilot period',
              'First access to every new release',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-brand-100 text-xs leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white text-sm">CACFPLink</span>
            </div>
            <p className="text-xs leading-relaxed">
              Operations software built for USDA food programs. Replace paper with real-time systems.
            </p>
          </div>

          {/* Links */}
          {[
            {
              title: 'Product',
              links: [
                { label: 'Features',     href: '#features' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Sign In',      href: '/login' },
                { label: 'Register',     href: '/register' },
              ],
            },
            {
              title: 'Roles',
              links: [
                { label: 'Sponsors',        href: '/register' },
                { label: 'Coordinators',    href: '/register' },
                { label: 'Kitchens',        href: '/register' },
                { label: 'Sites & Daycares',href: '/register' },
              ],
            },
            {
              title: 'Company',
              links: [
                { label: 'About',           href: '/about' },
                { label: 'Contact',         href: 'mailto:cacfplink@gmail.com' },
                { label: 'Privacy Policy',  href: '/privacy' },
                { label: 'Terms of Service',href: '/terms' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-xs hover:text-white transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs">© {new Date().getFullYear()} CACFPLink. All rights reserved.</p>
          <p className="text-xs">Built for USDA Child and Adult Care Food Programs</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* 1. The hook — what does CACFPLink do for you? */}
      <Hero />
      {/* 2. The pain — what problems does it solve? */}
      <ProblemSolution />
      {/* 3. The core differentiator — Claim Intelligence */}
      <ClaimIntelligenceSection />
      {/* 4. Everything you get — full feature list */}
      <Features />
      {/* 5. How it all connects — workflow diagram */}
      <WorkflowDiagram />
      {/* 6. Compliance Assistant — built-in CACFP guide */}
      <ComplianceAssistantSection />
      {/* 7. State Resources — your state's rules instantly */}
      <StateResourcesSection />
      {/* 8. Old way vs. CACFPLink */}
      <WhyCACFPLink />
      {/* 9. Try it — no account needed */}
      <TryDemoSection />
      {/* 10. Trust — performance tested */}
      <PerformanceSection />
      {/* 11. Social proof */}
      <Testimonials />
      {/* 12. ROI — how much is your program worth? */}
      <ROICalculator />
      {/* 13. The founder */}
      <FounderStory />
      {/* 14. Pricing */}
      <PricingSection />
      {/* 15. Pilot CTA */}
      <PilotSection />
      {/* 16. Contact */}
      <ContactSection />
      {/* 17. Final CTA */}
      <FinalCTA />
      <Footer />
    </div>
  );
}
