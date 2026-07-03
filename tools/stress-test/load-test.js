#!/usr/bin/env node
/**
 * CACFPLink Load Test
 * ─────────────────────────────────────────────────────────────────────────────
 * Authenticates as the stress test sponsor, then hammers every major page's
 * API endpoints with 50 concurrent requests for 30 seconds each.
 *
 * Pages tested:
 *   Sponsor Dashboard  →  GET /api/stats
 *   Compliance         →  GET /api/compliance
 *   Documents          →  GET /api/documents + /api/documents/expiring
 *   Meal Counts        →  GET /api/meal-counts/summary + /trend
 *   Deliveries         →  GET /api/delivery/routes
 *   Search / Orgs      →  GET /api/organizations?search=
 *   Reports            →  GET /api/meal-counts/trend
 *   Messages           →  GET /api/messages/threads
 *   Applications       →  GET /api/applications
 *   Notifications      →  GET /api/notifications
 *
 * Usage:
 *   BACKEND_URL="https://your-app.railway.app" node tools/stress-test/load-test.js
 *
 * Optional:
 *   CONCURRENCY=25 DURATION=20 node tools/stress-test/load-test.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const https = require('https');
const http  = require('http');
const url   = require('url');

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10);
const DURATION_S  = parseInt(process.env.DURATION   || '30', 10);
const DURATION_MS = DURATION_S * 1000;

// ── Endpoints grouped by page ─────────────────────────────────────────────────
const PAGES = [
  {
    page: 'Sponsor Dashboard',
    endpoints: [
      { method: 'GET', path: '/api/stats' },
    ],
  },
  {
    page: 'Compliance',
    endpoints: [
      { method: 'GET', path: '/api/compliance?limit=100&offset=0' },
    ],
  },
  {
    page: 'Documents',
    endpoints: [
      { method: 'GET', path: '/api/documents?limit=100' },
      { method: 'GET', path: '/api/documents/expiring' },
    ],
  },
  {
    page: 'Meal Counts',
    endpoints: [
      { method: 'GET', path: `/api/meal-counts/summary?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}` },
      { method: 'GET', path: '/api/meal-counts/trend' },
    ],
  },
  {
    page: 'Deliveries',
    endpoints: [
      { method: 'GET', path: '/api/delivery/routes' },
    ],
  },
  {
    page: 'Organizations / Search',
    endpoints: [
      { method: 'GET', path: '/api/organizations?limit=100&offset=0' },
      { method: 'GET', path: '/api/organizations?type=site&limit=50' },
      { method: 'GET', path: '/api/organizations?type=kitchen&limit=50' },
    ],
  },
  {
    page: 'Applications',
    endpoints: [
      { method: 'GET', path: '/api/applications?limit=50' },
      { method: 'GET', path: '/api/applications?status=submitted&limit=50' },
    ],
  },
  {
    page: 'Messages',
    endpoints: [
      { method: 'GET', path: '/api/messages/threads' },
    ],
  },
  {
    page: 'Notifications',
    endpoints: [
      { method: 'GET', path: '/api/notifications?limit=20' },
    ],
  },
];

// ── HTTP helper ───────────────────────────────────────────────────────────────
function request(method, urlStr, body, token) {
  return new Promise((resolve) => {
    const parsed  = new url.URL(urlStr);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const data    = body ? JSON.stringify(body) : undefined;
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data)  headers['Content-Length'] = Buffer.byteLength(data);

    const t0 = Date.now();
    const req = lib.request(
      {
        hostname: parsed.hostname,
        port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path:     parsed.pathname + parsed.search,
        method,
        headers,
      },
      (res) => {
        res.on('data', () => {});  // drain
        res.on('end', () => resolve({ status: res.statusCode, ms: Date.now() - t0 }));
      }
    );
    req.on('error', () => resolve({ status: 0, ms: Date.now() - t0 }));
    if (data) req.write(data);
    req.end();
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────────
class Histogram {
  constructor() { this.data = []; this.errors = 0; }

  add(ms, isError) {
    this.data.push(ms);
    if (isError) this.errors++;
  }

  p(pct) {
    const s   = [...this.data].sort((a, b) => a - b);
    const idx = Math.min(Math.ceil(pct / 100 * s.length), s.length) - 1;
    return s[Math.max(0, idx)] ?? 0;
  }

  get count()  { return this.data.length; }
  get avg()    { return this.data.length ? Math.round(this.data.reduce((a,b) => a+b, 0) / this.data.length) : 0; }
  get max()    { return this.data.length ? Math.max(...this.data) : 0; }
  get errPct() { return this.data.length ? (this.errors / this.data.length * 100) : 0; }
}

// ── Live display helpers ──────────────────────────────────────────────────────
const CLEAR_LINE = '\x1b[2K\r';
const BOLD       = '\x1b[1m';
const RESET      = '\x1b[0m';
const GREEN      = '\x1b[32m';
const YELLOW     = '\x1b[33m';
const RED        = '\x1b[31m';
const CYAN       = '\x1b[36m';
const DIM        = '\x1b[2m';

function colorLatency(ms) {
  if (ms < 200)  return `${GREEN}${ms}ms${RESET}`;
  if (ms < 800)  return `${YELLOW}${ms}ms${RESET}`;
  return `${RED}${ms}ms${RESET}`;
}

function progressBar(elapsed, total, width = 30) {
  const pct   = Math.min(elapsed / total, 1);
  const filled = Math.round(pct * width);
  const bar   = '█'.repeat(filled) + '░'.repeat(width - filled);
  return `${CYAN}${bar}${RESET}`;
}

function liveRow(elapsed, durationS, hist, flying) {
  const secLeft = Math.max(0, durationS - Math.floor(elapsed / 1000));
  const rps     = elapsed > 0 ? (hist.count / (elapsed / 1000)).toFixed(1) : '0.0';
  const p50     = hist.count > 0 ? hist.p(50)  : 0;
  const p99     = hist.count > 0 ? hist.p(99)  : 0;
  const errPct  = hist.errPct.toFixed(1);
  const bar     = progressBar(elapsed, durationS * 1000);

  return (
    `  ${bar} ${String(secLeft).padStart(2)}s left` +
    `  ${BOLD}${String(hist.count).padStart(5)}${RESET} req` +
    `  ${BOLD}${rps.padStart(6)}${RESET}/s` +
    `  p50 ${colorLatency(p50)}` +
    `  p99 ${colorLatency(p99)}` +
    `  ${flying.toString().padStart(2)} in-flight` +
    (parseFloat(errPct) > 0 ? `  ${RED}${hist.errors} err${RESET}` : `  ${GREEN}0 err${RESET}`)
  );
}

// ── Run one endpoint for DURATION_MS at CONCURRENCY, with live display ────────
async function hammer(method, path, token, label) {
  const hist    = new Histogram();
  const fullUrl = BACKEND_URL + path;
  const startAt = Date.now();
  const endAt   = startAt + DURATION_MS;
  let   flying  = 0;

  // Print endpoint header
  process.stdout.write(`\n  ${BOLD}${method} ${path}${RESET}\n`);
  process.stdout.write(`  ${DIM}${'─'.repeat(64)}${RESET}\n`);

  // Live ticker — refreshes every 250ms
  const ticker = setInterval(() => {
    const elapsed = Date.now() - startAt;
    process.stdout.write(CLEAR_LINE + liveRow(elapsed, DURATION_S, hist, flying));
  }, 250);

  await new Promise((done) => {
    function fire() {
      while (flying < CONCURRENCY && Date.now() < endAt) {
        flying++;
        request(method, fullUrl, null, token).then((r) => {
          flying--;
          hist.add(r.ms, r.status === 0 || r.status >= 500);
          if (Date.now() < endAt) fire();
          else if (flying === 0) done();
        });
      }
      if (Date.now() >= endAt && flying === 0) done();
    }
    fire();
    setTimeout(() => { if (flying === 0) done(); }, DURATION_MS + 5000);
  });

  clearInterval(ticker);

  // Final line for this endpoint
  const total  = hist.count;
  const rps    = (total / DURATION_S).toFixed(1);
  const v      = verdict(hist.p(99), hist.errPct);
  process.stdout.write(
    CLEAR_LINE +
    `  ${v}${String(total).padStart(5)} req · ${rps}/s · ` +
    `p50=${colorLatency(hist.p(50))} p95=${colorLatency(hist.p(95))} p99=${colorLatency(hist.p(99))} · ` +
    `err=${hist.errPct > 0 ? RED : GREEN}${hist.errPct.toFixed(1)}%${RESET}\n`
  );

  return hist;
}

// ── Render a bar proportional to latency ─────────────────────────────────────
function latBar(ms) {
  const blocks = ['▏','▎','▍','▌','▋','▊','▉','█'];
  const capped = Math.min(ms, 2000);
  const idx    = Math.floor(capped / 2000 * 40);
  return '█'.repeat(Math.min(idx, 40));
}

// ── Verdict for a single endpoint ────────────────────────────────────────────
function verdict(p99, errPct) {
  if (errPct > 5  || p99 > 3000) return '❌ FAIL    ';
  if (errPct > 1  || p99 > 1000) return '⚠️  WARN    ';
  return '✅ PASS    ';
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${'═'.repeat(68)}`);
  console.log(`  🔥  CACFPLink Load Test`);
  console.log(`${'═'.repeat(68)}`);
  console.log(`  Backend:     ${BACKEND_URL}`);
  console.log(`  Concurrency: ${CONCURRENCY} simultaneous requests per endpoint`);
  console.log(`  Duration:    ${DURATION_S}s per endpoint`);
  console.log(`  Pages:       ${PAGES.length} pages, ${PAGES.flatMap(p => p.endpoints).length} endpoints total`);
  console.log(`${'═'.repeat(68)}\n`);

  // Auth
  process.stdout.write('  🔐  Authenticating... ');
  const auth = await request('POST', `${BACKEND_URL}/api/auth/login`,
    { email: 'stress@test.com', password: 'StressTest123!' }, null
  );
  if (auth.status !== 200) {
    console.error(`FAILED (HTTP ${auth.status})`);
    console.error('  Make sure seed.js ran successfully and BACKEND_URL is correct.');
    process.exit(1);
  }

  let token;
  try {
    // Quick re-request to get body (the hammer helper drains without saving)
    const authFull = await new Promise((resolve) => {
      const parsed = new url.URL(`${BACKEND_URL}/api/auth/login`);
      const lib    = parsed.protocol === 'https:' ? https : http;
      const data   = JSON.stringify({ email: 'stress@test.com', password: 'StressTest123!' });
      const req    = lib.request(
        { hostname: parsed.hostname, port: parsed.port||(parsed.protocol==='https:'?443:80),
          path: parsed.pathname, method: 'POST',
          headers: { 'Content-Type':'application/json','Content-Length':Buffer.byteLength(data) } },
        (res) => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve(JSON.parse(b))); }
      );
      req.on('error', () => resolve({}));
      req.write(data); req.end();
    });
    token = authFull.token;
  } catch { token = null; }

  if (!token) {
    console.error('Could not parse JWT from login response.');
    process.exit(1);
  }
  console.log(`✅  Token acquired\n`);

  // Run pages
  const pageResults = [];

  for (const page of PAGES) {
    console.log(`\n  ${'━'.repeat(64)}`);
    console.log(`  ${BOLD}📄  ${page.page}${RESET}`);
    console.log(`  ${'━'.repeat(64)}`);

    const endpointResults = [];
    for (const ep of page.endpoints) {
      const hist = await hammer(ep.method, ep.path, token, ep.path);
      endpointResults.push({ ep, hist });
    }

    pageResults.push({ page, endpointResults });
  }

  // ── Full report ─────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(68)}`);
  console.log(`  RESULTS  (${CONCURRENCY} concurrent · ${DURATION_S}s per endpoint)`);
  console.log(`${'═'.repeat(68)}\n`);

  let worstP99    = 0;
  let worstErrPct = 0;
  let totalReqs   = 0;
  let totalErrs   = 0;

  for (const { page, endpointResults } of pageResults) {
    console.log(`  📄  ${page.page}`);
    for (const { ep, hist } of endpointResults) {
      const rps  = (hist.count / DURATION_S).toFixed(1);
      const p50  = hist.p(50);
      const p95  = hist.p(95);
      const p99  = hist.p(99);
      const pErr = hist.errPct;
      if (p99  > worstP99)    worstP99    = p99;
      if (pErr > worstErrPct) worstErrPct = pErr;
      totalReqs += hist.count;
      totalErrs += hist.errors;
      console.log(`     ${verdict(p99, pErr)} ${ep.method} ${ep.path.slice(0,45)}`);
      console.log(`          ${hist.count} req · ${rps}/s · p50=${p50}ms · p95=${p95}ms · p99=${p99}ms · max=${hist.max}ms · err=${pErr.toFixed(1)}%`);
    }
    console.log();
  }

  // ── Final verdict ────────────────────────────────────────────────────────────
  const errPctOverall = totalReqs > 0 ? (totalErrs / totalReqs * 100) : 0;

  console.log(`${'═'.repeat(68)}`);
  console.log(`  SUMMARY`);
  console.log(`${'═'.repeat(68)}`);
  console.log(`  Total requests:   ${totalReqs.toLocaleString()}`);
  console.log(`  Total errors:     ${totalErrs} (${errPctOverall.toFixed(2)}%)`);
  console.log(`  Worst p99:        ${worstP99}ms`);
  console.log(`  Worst error rate: ${worstErrPct.toFixed(1)}%`);
  console.log();

  if (worstP99 < 500 && worstErrPct < 1) {
    console.log(`  ✅  EXCELLENT — All pages respond in <500ms p99 with <1% errors`);
    console.log(`      Safe for a live sponsor with 300 orgs and 50 concurrent users.\n`);
    console.log(`  📣  Marketing copy:`);
    console.log(`      "Performance Tested: 300 organizations · ${Math.round(totalReqs/PAGES.length).toLocaleString()}+ requests`);
    console.log(`       per page · Sub-500ms response at 50 concurrent users."\n`);
  } else if (worstP99 < 1500 && worstErrPct < 5) {
    console.log(`  ⚠️   ACCEPTABLE — Some pages are slow but stable.`);
    console.log(`       Check endpoints marked ⚠️  above for optimization targets.\n`);
  } else {
    console.log(`  ❌  NEEDS WORK — High latency or error rates detected.`);
    console.log(`       Worst p99: ${worstP99}ms · Worst error rate: ${worstErrPct.toFixed(1)}%\n`);
  }
  console.log(`${'═'.repeat(68)}\n`);
}

main().catch((err) => { console.error('Load test crashed:', err.message); process.exit(1); });
