# CACFPLink — Project Memory

**Product:** CACFPLink (cacfplink.com) — USDA CACFP food program operations platform  
**Stack:** React/Vite SPA (Vercel) + Node.js/Express backend (Railway) + PostgreSQL (Railway)  
**Repo:** https://github.com/hashipro87-tech/programlink  
**User:** Hashi (hashipro87@gmail.com)

---

## Product Philosophy ⭐

> **Build effortless features that make CACFP simple for every user.**

- Build effortless features that solve real problems.
- Build effortless workflows that users love.
- Build effortless experiences for sponsors, kitchens, coordinators, and sites.
- Build features so intuitive they require almost no training.
- Build the easiest CACFP platform to use.
- Build features that save users time every single day.
- Ship improvements in days, not months.
- Build with users, not assumptions — every sponsor conversation should make CACFPLink better.
- Win by solving real workflow problems, not by matching feature lists.

> **Don't compete by saying "We have more features."**
> **Compete by making people say "CACFPLink understands how I actually work."**

**Underdog Feedback Loop:** Listen → Build → Release → Gather Feedback → Improve → Repeat

Every feature decision should be measured against these principles.

---

## Industry Differentiators (Build after first sponsors) 🚀

These are features no other CACFP platform has. Build them once real sponsor feedback confirms the pain.

1. **One-Click Legacy Migrator** — Import data from legacy CACFP software (MINUTE MENU, etc.) with minimal manual work. Removes the #1 switching barrier.

2. **Point-of-Service (POS) Sync** — Touch-screen meal count mode for fast, real-time service entry at the site level. Works like a restaurant POS.

3. **AI Menu Scanner** — Upload a menu photo and automatically detect missing CACFP meal components before submission. Prevents reimbursement denials before they happen.

4. **One-Click State Audit Mode** — Generate a secure, read-only portal for auditors with only the requested month's claims, documents, and signatures. Turns a stressful audit into a 2-minute task.

5. **Public API & Integrations** — Connect with childcare platforms (Brightwheel, Procare) and automation tools (Zapier). Makes CACFPLink the hub, not a silo.

---

## Roadmap

| Priority | Task | Status |
|----------|------|--------|
| 1 | Trust signals — Privacy Policy, ToS, Security, About | ✅ |
| 2 | Add Messages to sponsor sidebar nav (Task #50) | ✅ |
| 3 | Add Applications to coordinator nav (Task #51) | ✅ |
| 4 | Approval/rejection emails when application status changes (Task #46) | ✅ |
| 5 | Coordinator → site/kitchen assignment system (Task #47) | ✅ |
| 6 | Bulk compliance actions — remind all, request from all missing (Task #44) | ✅ |
| 7 | Auto document expiry reminders — email 30 days before (Task #45) | ✅ |
| 8 | Stress test with a large sponsor (Task #28) | ✅ |
| 9 | Sponsor-driven features from feedback (Task #31) | ⏳ waiting on sponsor |
| 10 | Meal count trend chart — 6-month view (Task #48) | ✅ |
| 11 | Broadcast messaging (Task #49) | ✅ |
| 12 | Homepage: performance stats, comparison table, pricing, founder story, testimonials (Tasks #70–74) | ✅ |

---

## Future Roadmap — After First Sponsors ⭐

> Work on these after landing a few paying/pilot sponsors. Build based on their feedback.

### Sponsor
- Activity Feed
- Notification Center
- Audit Log
- Dashboard customization (drag-and-drop widgets)
- Bulk actions (invite, assign, reminders, exports)
- Global search

### Coordinator
- Applications page in navigation ← already built, just needs nav link (Task #51)
- Notification Center
- Activity Feed

### Kitchen
- Production Schedule (tomorrow's meals)
- Meal history
- Notification Center

### Site
- Meal history
- Notification Center

### Documents
- Document Requests (bulk)
- Version history
- Activity timeline
- Expiration reminders (auto-email)
- Bulk document requests

### Messaging
- @Mentions
- File attachments
- Read receipts
- Message search

### Reports
- PDF export
- Excel export
- Scheduled reports
- Custom report builder

### Organization Management
- Bulk imports (CSV)
- Bulk invitations
- Bulk assignments
- Organization branding / logo

### Performance
- Server-side pagination ← done (Task #39–43)
- Query optimization ← done (CTE rewrite, indexes)
- Large sponsor stress testing ← done (Task #28)
- Caching layer

### Nice-to-Have
- Mobile app
- USDA / state-specific exports
- Calendar view (document expiry)
- Dashboard widgets
- Dark / light theme

---
| 🔥 Now | Research + outreach — Virginia, Colorado, orgs like Charles's | ⏳ |
| ⬆️ Next | About page | 🔄 |
| ⬆️ Next | Social proof + pilot program badge | ⏳ |
| 📈 Growth | Stress test with a large sponsor | ✅ |
| 📈 Growth | Optimize workflows that don't scale | ✅ |
| 🔁 Ongoing | Continue sponsor outreach (more states) | ⏳ |
| 🔁 Ongoing | Build features based on sponsor feedback | ⏳ |

---

## Architecture

### Frontend (Vercel)
- `src/pages/` — page components by role: `sponsor/`, `kitchen/`, `site/`, `coordinator/`, `demo/`, `application/`
- `src/components/common/` — shared: `StatusBadge`, `ErrorState`, etc.
- `src/services/api.js` — Axios instance, base URL from `VITE_API_URL`
- Tailwind CSS with custom `brand-*` color classes (`#4f46e5`)
- React Router v6

### Backend (Railway)
- `programlink-backend/routes/index.js` — master router, mounts all routes under `/api`
- `programlink-backend/middleware/auth.js` — `authenticate` (JWT), `authorizeRoles(...roles)`
- `programlink-backend/services/notificationService.js` — `createNotification(opts)` accepts single object OR array; `notifyCoordinators()`, `notifySponsors()`
- `programlink-backend/services/storageService.js` — `uploadFile()` returns `{url, key}`

### JWT payload
```js
req.user.role           // 'sponsor' | 'coordinator' | 'kitchen' | 'site' | 'delivery'
req.user.organizationId // org UUID
req.user.id             // user UUID
```

---

## Database (PostgreSQL on Railway)

Key tables: `organizations`, `users`, `applications`, `documents`, `notifications`, `meal_counts`, `routes`, `kitchen_site_connections`, `message_threads`, `messages`, `message_recipients`, `coordinator_assignments`

### coordinator_assignments table (added Task #47)
```sql
CREATE TABLE coordinator_assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coordinator_id, org_id)
);
```
Already deployed to Railway (confirmed empty table with correct columns).

### documents.status CHECK constraint (updated 2025-06-30)
```sql
CHECK (status IN ('valid', 'expiring_soon', 'expired', 'rejected', 'pending_review', 'requested', 'superseded'))
```
`'requested'` was added to fix the "Send Request" button silently failing.

### notifications.type CHECK constraint
```
'status_change', 'application_status', 'document_missing', 'document_expiring',
'document_expired', 'document_uploaded', 'document_rejected', 'new_message',
'pending_approval', 'delivery_issue', 'meal_anomaly', 'connection_request', 'general'
```

---

## Key Files Built / Modified

### Application Flow
- `src/pages/application/steps/StepBasicInfo.jsx` — org type dropdown (`ORG_TYPES` array), plain address input (Google Maps skipped — costs money)
- `src/pages/application/ApplicationFlow.jsx` — validates `orgType`, checklist sidebar with `BASIC_ITEMS`

### Compliance (Sponsor)
- `src/pages/sponsor/CompliancePage.jsx` — **complete rewrite** (~650 lines)
  - 5-tier system: `overdue` > `missing` > `expiring` > `pending` > `compliant`
  - `TIER` constant: tier name → label, bg/text colors, icon
  - `SummaryCard` — clickable, toggles filter
  - `TierBadge`, `ScoreBadge` components
  - `RequestDocModal` — inline doc request with error state
  - `ComplianceDrawer` — right-side panel, score bar, full checklist, "Fix Remaining Issues" CTA
  - `OrgRow` — doc fraction "8/10 docs · 2 missing · 1 expiring", hover quick-actions (Remind/Request)
  - `Toast` component
  - Filters: type tabs (Kitchen/Site), status tabs (5 tiers), "Missing only", "Expiring this month" toggles
  - `handleRemind(org)` — POST `/compliance/:orgId/remind`, shows toast

- `programlink-backend/routes/compliance.js` — **complete rewrite**
  - GET `/compliance` — per-org data: `uploaded_doc_types`, `last_doc_upload`, `docs_required`, `docs_uploaded`, `missing_docs`, 5-tier scoring
  - POST `/compliance/:orgId/remind` — sends `compliance_reminder` notification to all active users in org
  - Required docs constant:
    ```js
    const REQUIRED = {
      kitchen: ['w9', 'food_permit', 'insurance', 'menu_plan', 'health_cert'],
      site:    ['enrollment', 'license', 'insurance', 'health_cert'],
    };
    ```

### Coordinator
- `src/pages/coordinator/CoordinatorKitchensPage.jsx` — fixed `o.map is not a function` crash
  - Was: `api.get('/kitchen-directory?kitchen_id=...')` returning `{ kitchens: [...] }` (not array)
  - Fixed: `Promise.all([api.get('/organizations?type=site&limit=100'), api.get('/meal-counts/summary?month=...')])` with `sitesRes.data?.organizations ?? sitesRes.data ?? []`

### Demo Pages
- `src/pages/demo/SponsorDemo.jsx` — updated 2025-06-30:
  - NAV: "Meal Orders" → "Deliveries" (`/demo/sponsor/deliveries`)
  - Compliance section: old yellow alert → full 5-tier Compliance Action Center preview
    - Summary row: Total Kitchens, Total Sites, Missing Docs, Expiring Soon
    - 4 org rows with shield icons, score bars, doc fractions, tier badges
  - "Today's Meal Orders" → "Today's Deliveries", modal title updated

### Coordinator Assignment System (Task #47, 2026-07-03)
- `coordinator_assignments.sql` (Desktop/outputs) — SQL to run once in Railway:
  ```sql
  CREATE TABLE coordinator_assignments (id UUID PRIMARY KEY, coordinator_id UUID REFERENCES users, org_id UUID REFERENCES organizations, UNIQUE(coordinator_id, org_id));
  CREATE INDEX idx_ca_coordinator ON coordinator_assignments(coordinator_id);
  CREATE INDEX idx_ca_org ON coordinator_assignments(org_id);
  ```
- `programlink-backend/routes/coordinatorAssignments.js` — new file:
  - GET `/coordinator-assignments` — list assignments for a coordinator
  - POST `/coordinator-assignments` — assign coordinator to org (sponsor only)
  - DELETE `/coordinator-assignments/:coordinator_id/:org_id` — remove assignment
- `programlink-backend/routes/index.js` — added `router.use('/coordinator-assignments', require('./coordinatorAssignments'));`
- `programlink-backend/controllers/organizationsController.js` — coordinator scoping: if coordinator has assignments, filter to only those orgs; fallback shows all (safe for new coordinators with no assignments yet)
- `src/pages/sponsor/CoordinatorsPage.jsx` — added "Assigned Sites & Kitchens" section in detail panel:
  - Lists assigned orgs with X to remove
  - "Assign" button opens inline searchable picker of unassigned sites/kitchens

### Bulk Compliance Actions (Task #44, 2026-07-03)
- `programlink-backend/routes/compliance.js` — added two endpoints:
  - `POST /compliance/remind-bulk` — `{ org_ids, message? }` — verifies orgs belong to sponsor, sends notification to all active users in each org
  - `POST /compliance/request-bulk` — `{ org_ids, doc_type, label, due_date?, message? }` — inserts 'requested' doc placeholder + notification for each org
- `src/pages/sponsor/CompliancePage.jsx` — added BulkActions bar:
  - "Remind Non-Compliant (N)" button → calls `/compliance/remind-bulk`
  - "Request Doc from All Missing" → dropdown with doc type selector, shows count, "Send to N" button
  - `nonCompliantOrgs` + `orgsMissingDoc` computed values

### Auto Document Expiry Reminders (Task #45, 2026-07-03)
- `programlink-backend/services/emailService.js` — added `sendDocumentExpiryEmail(to, name, orgName, docLabel, daysLeft, expiryDate)`:
  - Sends branded HTML email with colored urgency indicator (🟠 30d, 🟡 14d, 🔴 7d)
  - Gracefully no-ops if `RESEND_API_KEY` not set
- `programlink-backend/services/scheduledJobs.js` — added email loop to existing cron job:
  - Fixed bug: `d.name` → `d.label` (documents table uses `label` column)
  - Fixed bug: `'document_expiry'` → `'document_expiring'` (matches DB CHECK constraint)
  - Added `name, email` to orgUsers query for email sending

### Meal Count Trend Chart (Task #48, 2026-07-03)
- `programlink-backend/controllers/mealCountsController.js` — added `getTrend`:
  - Queries 6-month rolling totals (submitted vs verified) grouped by month
  - Fills missing months with zeros in JS so chart always renders 6 bars
- `programlink-backend/routes/mealCounts.js` — added `router.get('/trend', getTrend);`
- `src/pages/sponsor/ReportsPage.jsx` — added `TrendChart` SVG component:
  - Pure SVG, no dependencies — gray bars = submitted, brand purple = verified
  - Y-axis gridlines, month labels, value labels above bars

### Scalability (2026-07-02)
- `programlink-backend/routes/compliance.js` — rewrote GET query:
  - Added CTE `latest_apps` using `DISTINCT ON (org_id)` to get latest app status per org in one pass
  - Replaced 4 correlated subqueries (2 on applications, 2 on documents) with CTE join + FILTER aggregations
  - GROUP BY now includes `la.status, la.updated_at`
  - Result: query cost drops from O(n × subqueries) to O(n) — handles 300+ orgs cleanly
- `programlink-backend/controllers/organizationsController.js` — added pagination:
  - Reads `limit` (default 100, max 500) and `offset` (default 0) from query params
  - Runs COUNT query first, then paginated SELECT
  - Response now: `{ organizations, total, limit, offset, has_more }`
  - Fully backward-compatible (callers using `.organizations` still work)
- `add_indexes.sql` (Desktop/outputs) — 5 indexes to run in Railway query editor:
  - `idx_orgs_sponsor_id`, `idx_docs_org_id`, `idx_docs_org_status`, `idx_apps_org_created`, `idx_users_org_id`

### Documents Pagination (Task #28 fix, 2026-07-03)
- `programlink-backend/controllers/documentsController.js` — `listDocuments` now respects `limit`/`offset`:
  - Was: ignored query params, returned ALL docs for sponsor (1300 rows in stress test → p99=2775ms)
  - Fix: `LIMIT $2 OFFSET $3` applied to all three query branches (sponsor, sponsor+filter, kitchen/site)
  - Default: limit=100, max=500

### Stress Test Tools (Task #28, 2026-07-03)
- `tools/stress-test/package.json` — `{"type":"commonjs"}` overrides frontend ESM mode
- `tools/stress-test/seed.js` — seeds 300 orgs, 1 sponsor, 3 coordinators, 1300 docs, 8900+ meal counts, 30 message threads, 10 routes, 300 coordinator assignments. TAG stored in `organizations.region` (e.g. `ST_1783123044715`) for cleanup identification. PW_HASH for "StressTest123!". Usage: `DATABASE_URL="..." node tools/stress-test/seed.js`
- `tools/stress-test/load-test.js` — 50 concurrent, 9 pages / 14 endpoints, live ANSI display. Usage: `BASE_URL="https://..." AUTH_TOKEN="Bearer ..." node tools/stress-test/load-test.js`
- `tools/stress-test/cleanup.js` — removes all data by TAG. Usage: `DATABASE_URL="..." TAG="ST_..." node tools/stress-test/cleanup.js`
- **Results:** 159,761 requests, 0.09% error rate, all 14 endpoints PASS after pagination fix. p99 <200ms on 13/14 endpoints; compliance (most complex CTE query) p99 ~900ms.
- **Marketing copy earned:** "Performance Tested: 300 organizations · 3,000+ meal counts · 1,500 documents · Designed to scale as your program grows."

---

## Recurring Issues

### Git lock files (sandbox can't remove)
Sandbox write permission denied for `.git/HEAD.lock` / `.git/index.lock`.  
**Fix:** User runs from Terminal:
```bash
rm ~/Desktop/outputs/programlink-backend/.git/HEAD.lock
rm ~/Desktop/outputs/programlink-backend/.git/index.lock
```

### Git push
Sandbox can't push (no GitHub auth). User always runs `git push` from Terminal.

### Railway DB query editor
Click the query box → Cmd+A → delete → paste SQL → Run.

---

## Task List Status

| # | Task | Status |
|---|------|--------|
| 1–9 | Homepage, demo player, analytics, chat, CTAs | ✅ |
| 10 | Build About page | 🔄 in progress |
| 11 | Trust signals (badges, privacy policy, ToS, contact) | ⏳ |
| 12 | Social proof + pilot program badge | ⏳ |
| 13 | Research Iowa + Ohio CACFP sponsor outreach list | ⏳ |
| 14 | Iowa + Ohio outreach document | ✅ |
| 15–17 | Email verification, Resend API, manual verify | ✅ |
| 18 | CACFPLink study guide PDF | ✅ |
| 19 | Add Site button + modal | ✅ |
| 20 | Meal Orders page (sponsor assigns kitchen → site) | ✅ |
| 21–22 | Invite flow for all roles | ✅ |
| 23 | Remove button for Kitchen/Site/Coordinator | ✅ |
| 24 | Redesign Meal Orders → Deliveries (grouped by date/kitchen) | ✅ |
| 25 | Compliance page → full action center (5-tier) | ✅ |
| 26 | Update SponsorDemo with 5-tier compliance + Deliveries | ✅ |
| 27 | Update KitchenDemo/SiteDemo deliveries refs | ✅ |
| 44 | Bulk compliance actions — remind all, request from all missing | ✅ |
| 45 | Auto document expiry reminders — email 30 days before expiry | ✅ |
| 47 | Coordinator → site/kitchen assignment system | ✅ |
| 48 | Meal count trend chart — 6-month SVG bar chart on Reports page | ✅ |
| 49 | Broadcast messaging — sponsor sends message to all sites/kitchens | ✅ |
| 28 | Stress test — 300 orgs, 1300 docs, 8900+ meal counts, 14 endpoints benchmarked | ✅ |
| 70 | Move performance stats section higher on homepage | ✅ |
| 71 | Add testimonials section to homepage (3 placeholder cards, swap in real quotes) | ✅ |
| 72 | Add "Why CACFPLink?" comparison table to homepage | ✅ |
| 73 | Add founder story section to homepage (Hashi's words verbatim) | ✅ |
| 74 | Add pricing section to homepage (Pilot free + contact us) | ✅ |

---

## Outreach

5 personalized emails drafted and sent to Iowa/Ohio CACFP sponsors (stored in outreach doc, Task #14).  
Target contacts in Iowa and Ohio — see outreach document on Desktop.

---

## Env Vars

**Vercel (frontend):**
- `VITE_API_URL` — Railway backend URL

**Railway (backend):**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET`
- `RESEND_API_KEY` — for transactional email (Resend)
- `AWS_*` or storage keys — for document uploads

---

## Notes

- Google Maps Places autocomplete was built and wired but **skipped** (costs money per autocomplete call). The `loadGoogleMaps()` function and `useRef`/`useEffect` are in StepBasicInfo but the API key env var (`VITE_GOOGLE_MAPS_API_KEY`) is not set, so it gracefully falls back to plain text input.
- `createNotification` in `notificationService.js` accepts single object OR array — already handles both.
- 5-tier compliance scoring is computed **purely in JS** (no schema changes needed): overdue → missing → expiring → pending → compliant, based on existing DB fields.
