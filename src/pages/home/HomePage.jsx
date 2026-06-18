// HomePage.jsx — Public landing page for CACFPLink.
// Designed to feel like real operations software, not a generic startup page.
// Single-file, no external animation libraries, React + Tailwind only.

import { Link } from 'react-router-dom';
import {
  Camera, FileText, Building2, Users, BarChart2, ShieldCheck,
  ClipboardList, Truck, CheckCircle, AlertTriangle, ArrowRight,
  Zap, Clock, X, Menu, UtensilsCrossed, MapPin, Shield, RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import DemoPlayer from '../../components/common/DemoPlayer';

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
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
              Stop managing CACFP with{' '}
              <span className="text-brand-600">spreadsheets, emails, and phone calls.</span>
            </h1>

            <p className="text-xl text-gray-500 leading-relaxed mb-8 max-w-lg">
              Manage meal counts, compliance documents, kitchens, sites, and coordinators in one platform built for USDA food programs.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to="/register"
                className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="px-6 py-3.5 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                See How It Works
              </a>
            </div>

            {/* Social proof chips */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              {[
                'Built specifically for CACFP sponsors, kitchens, and meal sites',
                'Designed around real compliance and reporting workflows',
                'No credit card required',
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
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
    icon: Camera,
    title: 'AI Delivery Slip Scanning',
    desc: 'Point your phone at any paper delivery slip. OCR reads the numbers and fills your meal count form instantly.',
    tag: 'Most popular',
  },
  {
    icon: ClipboardList,
    title: 'Daily Meal Count Tracking',
    desc: 'Breakfast, lunch, supper, snack — logged per day with automatic anomaly detection before counts are submitted.',
  },
  {
    icon: Building2,
    title: 'Multi-Site Management',
    desc: 'Connect kitchens to the sites they serve. Coordinators see every relationship, every submission, in one view.',
  },
  {
    icon: ShieldCheck,
    title: 'Document Compliance',
    desc: 'W-9, Menu Plan, Insurance — tracked with expiry alerts so nothing lapses before your next USDA review.',
  },
  {
    icon: Truck,
    title: 'Delivery Coordination',
    desc: 'Kitchens advance each delivery through Prepping → Ready → Picked Up → Delivered with one tap.',
  },
  {
    icon: Users,
    title: 'Coordinator Oversight',
    desc: 'Coordinators verify meal counts, manage site connections, and flag issues — without email chains.',
  },
  {
    icon: BarChart2,
    title: 'Real-Time Reporting',
    desc: 'Monthly summaries, submission rates, unverified counts — ready for USDA reporting the moment you need them.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    desc: 'Sponsors, coordinators, kitchens, sites, delivery providers — each sees exactly what they need.',
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

// ─── Final CTA ────────────────────────────────────────────────────────────────

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
                { label: 'Contact',         href: 'mailto:support@cacfplink.com' },
                { label: 'Privacy Policy',  href: '#' },
                { label: 'Terms of Service',href: '#' },
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
      <Hero />
      <DemoSection />
      <WorkflowDiagram />
      <ProblemSolution />
      <Features />
      <ScreenshotsSection />
      <TrustSection />
      <HowItWorks />
      <MobileSection />
      <Impact />
      <FinalCTA />
      <Footer />
    </div>
  );
}
