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

## The Great Shift — From Website to Machine 🧠

> **CACFPLink is not a compliance tool. It is a financial guardian that runs 24/7, protecting every dollar sponsors are owed.**

This is the core vision. Everything else is a feature. This is the machine.

### The Key Insight
Don't think about reimbursement as something sponsors start at the end of the month.
Think about it as something CACFPLink is **always preparing**.

- Every meal count entered → claim updates instantly
- Every document uploaded → readiness updates instantly
- Every application approved → eligibility updates instantly
- Every correction made → reimbursement updates instantly

Sponsors should never wait until the last day of the month in a panic. They should know **every single day** exactly where their claim stands and exactly how much money is at risk.

### The Dashboard That Changes Everything
```
Today's Claim Status
96% Ready
Estimated Reimbursement: $186,440
Potential Loss: $1,820
3 issues preventing full submission
```

That number — **Potential Loss** — is what makes this product unkillable.
It reframes CACFPLink from a cost to a return on investment.
A sponsor paying $200/month who recovers $4,128 in prevented disallowances gets a 20x return.
You are not selling software. You are selling recovered money.

### Claim Intelligence (The End Goal)
```
Claim Intelligence — July 2026
Estimated Reimbursement:     $214,873
Reimbursement at Risk:         $4,128
Fix these 5 issues before July 31 to recover all $4,128.
```

Each issue has a dollar value. Each fix recovers money. The system runs constantly.

### Why This Cannot Be Copied
The intelligence only works if ALL data lives in one place:
meal counts + documents + enrollment + income eligibility + menus + attendance.

A legacy system like KidKare cannot bolt this on.
A new competitor cannot build it without the full data layer.
CACFPLink owns the data layer. That is the moat.

### The Claims Center (Build First)
Before Claim Intelligence, build the Claims Center:
- Progress bar: `██████████░░░░░░░ 82% — 92 Sites Ready, 7 Need Attention`
- Estimated reimbursement shown at all times
- Per-site status: 🟢 Ready / 🟡 Needs Review / 🔴 Cannot Submit
- Per-site checklist: Meal Counts, Attendance, Enrollment, Income Eligibility, Documents, Menus
- Anomaly detection: "Lunch count exceeds attendance" before submission
- Breakdown: Breakfast $23,921 / Lunch $88,341 / Snack $32,400 / Supper $4,201

### State Engine (What Makes It Scale)
When a sponsor signs up, they choose their state once.
Everything changes automatically:
- State-specific reimbursement rates
- State-required documents
- State validation rules
- State claim deadlines
- State export/submission format
- State email wording and reports

One product. One codebase. Different engine per state.
Build it for one state first. Prove it. Expand state by state.

### Build Sequence
1. Capture missing data inputs: enrollment, income eligibility, menus
2. Build state configuration engine (rates, rules, deadlines per state)
3. Build the Claims Center UI (progress, per-site status, estimated reimbursement)
4. Add live reimbursement calculation — updates on every change, not month-end
5. Build the rules engine — each known disallowance type becomes a rule with a dollar value
6. Surface as Claim Intelligence on the main dashboard

### The Pitch When This Is Built
> "Every day you log in, CACFPLink tells you exactly how much money you're about to receive and exactly how much you're at risk of losing. Fix the issues it flags, and you keep every dollar."

No sponsor who has seen that goes back to KidKare.

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
| 13 | Fix demo navigation — all nav items now render unique content (Task #75) | ✅ |
| 14 | 6-phase QA self-test — find bugs before real sponsors do (2026-07-29) | ✅ |
| 15 | Homepage redesign — clean top-to-bottom story (Hero → Problems → Features → Workflow → Claim Intelligence → Compliance Assistant → State Resources → Trust → Pricing → CTA) | ✅ |
| 16 | State Rule Book page — dedicated sidebar page at /dashboard/sponsor/state-rules; rates table, deadlines, required forms, agency contact, state tips; Federal Meal Pattern tab with WGR + milk-by-age rules; full data for TX/CA/OH/VA/CO; key Alexia demo | ✅ |
| 17 | Sentry error monitoring — wire up backend + frontend so crashes alert Hashi automatically | ✅ |
| 18 | Sponsor Dashboard redesign — mission-driven layout replacing stat cards: MissionCard (7-step claim readiness checklist + % progress bar), BlockingIssues ($-framed issues), TeamStatusCard, ClaimSnapshotCard, RecentActivityFeed; useMissionData() parallel-fetches 4 endpoints (2026-07-29) | ✅ |
| 19 | Program type picker on Add Site modal (Task #144) — 6 program types (Child Care Center, Family Day Care Home, Head Start, At-Risk Afterschool, Emergency Shelter, Open Community Meal Site) with emoji + note about what's required; card-style selection; program_type stored in organizations table; run add_program_type.sql in Railway | ✅ |
| 20 | Program type insight — CACFPLink should be program-aware per site type: Open Community Sites don't need child rosters or income certs; At-Risk uses area eligibility; requirements driven by JSON config per type (future: filter MissionCard checklist steps based on site's program_type) | ⏳ future |
| 21 | Import children bug fix — children not showing after Done: root cause was orgId=undefined falling back to sponsor's own org_id; children inserted under wrong org and never appeared in list; fix: site-select step added to ImportEnrollmentModal when orgId not pre-supplied | ✅ |
| 22 | AI scan fix (HEIC) — iPhone photos are HEIC by default; Claude API doesn't support HEIC; was causing silent 500 errors; removed HEIC from accepted types, added clear error + "save as JPG" hint; backend guard added | ✅ |
| 23 | Import UX: persistent site banner + searchable site list — "Importing to: [Site Name]" pinned to all steps after selection with Change link; search input auto-focused on site-select step; site count shown; Continue button shows selected site name; "Matched N of M columns automatically" banner on CSV mapping step | ✅ |
| 24 | Column matching expanded — FIELD_ALIASES now includes 20+ more synonyms: "Child DOB", "Child Birth Date", "Caregiver", "Renewal Date", "Home Phone", "F Name", "Date of Birth (DOB)", etc. | ✅ |

---

## Future Roadmap — After First Sponsors ⭐

> Work on these after landing a few paying/pilot sponsors. Build based on their feedback.

### Deliveries UX Consolidation (Task #160) — ✅ BUILT 2026-08-05
Merged "Deliveries" and "Delivery Plans" into a single nav item with two tabs. Sponsors think "check today's deliveries" not "manage delivery plans."

**UI:** Single "Deliveries" nav item → two tabs inside:
- **Scheduled Routes** (currently Delivery Plans) — recurring templates: Kitchen A → Sunshine Daycare, Lunch, Mon–Fri, 11:30 AM, Active
- **One-Time Deliveries** (currently Deliveries) — exceptions and one-offs

**Add Delivery modal** gets a "How often?" step at the start:
- ○ One time → creates a delivery route (current flow)
- ○ Repeat every weekday / Weekly / Monthly → creates a delivery plan (current DeliveryPlansPage flow)
Recurrence becomes a property of a delivery, not a separate concept.

**Dashboard stat card changes:**
```
Deliveries
Today's Deliveries: 12
Recurring Routes: 8
Exceptions: 1
```

**Implementation:**
- Remove "Delivery Plans" from sidebar NAV_ITEMS (keep the route so deep links don't break)
- MealOrdersPage.jsx: add tab switcher, render DeliveryPlansPage content inside "Scheduled Routes" tab
- Add "How often?" step 0 to AddDeliveryModal — one-time vs repeat branches to different API calls
- Note: SponsorDashboard.jsx line 55 already had "Delivery Plans" nav item removed in prep (2026-08-04)

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
| ✅ Done | About page | ✅ |
| ✅ Done | Social proof + pilot program badge | ✅ |
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

Key tables: `organizations`, `users`, `applications`, `documents`, `notifications`, `meal_counts`, `routes`, `kitchen_site_connections`, `message_threads`, `messages`, `message_recipients`, `coordinator_assignments`, `delivery_plans`, `delivery_instances`

### meal_counts per-type columns (added Task #105)
```sql
ALTER TABLE meal_counts
  ADD COLUMN IF NOT EXISTS breakfast INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lunch     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS snack     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supper    INTEGER NOT NULL DEFAULT 0;
```
Run `meal_counts_types.sql` (Desktop/outputs) in Railway. `count_submitted` still stored as total for backward compat.

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

### Demo Pages (Task #75, 2026-07-06)
- **Root fix:** Both SponsorDemo and SiteDemo previously rendered only their overview regardless of URL. Fixed by adding `useLocation` from react-router-dom and switching on `pathname` to render different content per section.
- `src/pages/demo/SiteDemo.jsx` — full rewrite:
  - Overview: stats, task checklist, headcount form
  - Meal Counts (`/demo/site/meal-counts`): headcount form + full history table
  - Documents (`/demo/site/documents`): valid/expiring/missing doc list with upload simulation
  - Messages (`/demo/site/messages`): message thread with sponsor, live reply input
  - Settings (`/demo/site/settings`): site profile form
- `src/pages/demo/SponsorDemo.jsx` — full rewrite, all 11 sections:
  - Overview: action center, stat cards (link to sub-pages), recent apps, trend chart preview
  - Applications (`/applications`): approve/reject buttons with live state, pending/approved/rejected counts
  - Compliance (`/compliance`): full 5-tier compliance center with bulk remind button
  - Sites (`/sites`): site list with enrollment, meal days, compliance status
  - Kitchens (`/kitchens`): kitchen list with capacity and sites served
  - Deliveries (`/deliveries`): today's deliveries + Schedule Delivery modal
  - Coordinators (`/coordinators`): coordinator list with assigned sites
  - Messages (`/messages`): multi-thread message panel with Broadcast button
  - Meal Counts (`/meal-counts`): TrendChart + monthly breakdown table
  - Documents (`/documents`): cross-org document list with status badges
  - Settings (`/settings`): program profile + notification toggles
- `src/pages/demo/SponsorDemo.jsx` — updated 2025-06-30 (previous notes):
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

## Repo Structure (CRITICAL — don't get this wrong again)

The git repo root (`~/Desktop/outputs/programlink-backend/`) contains TWO layers:

```
programlink-backend/          ← git repo root (also frontend)
  package.json                ← "programlink-frontend", type: module, Vite/React
  src/                        ← React frontend → deployed to Vercel
  server.js / app.js          ← NOT used by Railway (wrong layer)
  routes/                     ← NOT used by Railway (wrong layer)
  controllers/                ← NOT used by Railway (wrong layer)
  programlink-backend/        ← THE REAL BACKEND → Railway deploys from here
    package.json              ← "programlink-backend", CommonJS, node server.js
    server.js / app.js        ← Railway entry point
    routes/index.js           ← master router
    controllers/              ← all real controllers
    services/                 ← claimsEngine, notificationService, etc.
    config/database.js        ← DB pool (use require('../config/database'))
```

**Railway runs `node server.js` from `programlink-backend/programlink-backend/`.**

When adding backend files, ALWAYS put them in `programlink-backend/programlink-backend/` — NOT the repo root.
When adding frontend files, put them in `src/`.

DB pool import: `require('../config/database')` — NOT `require('../db')`.

---

## Recurring Delivery Plans (Task #94, 2026-07-14) ✅ LIVE

### What was built
- **`delivery_plans` table** — one row per recurring plan (sponsor_id, site_id, kitchen_id, days_of_week TEXT[], arrival_time, meal counts, start/end dates, auto_notify, active)
- **`delivery_instances` table** — one row per plan per day, UNIQUE(plan_id, date). Status: scheduled/in_transit/delivered/skipped/cancelled
- **`programlink-backend/controllers/deliveryPlansController.js`** — listPlans, createPlan, updatePlan, deletePlan, getSiteSchedule, updateInstance, generateTodayDeliveries (exported for cron)
  - `generateInstancesForPlan(plan, daysAhead=60)` — called on createPlan, pre-populates 60 days of instances
  - `generateTodayDeliveries()` — 6 AM cron, creates today's instances for all active plans + notifies sites/kitchens if auto_notify=true
- **`programlink-backend/routes/deliveryPlans.js`** — sponsor CRUD + `/schedule` for sites
- **`programlink-backend/services/scheduledJobs.js`** — added `cron.schedule('0 6 * * *', generateTodayDeliveries)` at 6 AM UTC
- **`src/pages/sponsor/DeliveryPlansPage.jsx`** — plan list with day badges, meal summary, arrival time; create/edit modal (site picker, kitchen picker, day checkboxes Mon–Sun, arrival time, meal counts, date range, auto-notify toggle); pause/resume/delete per plan
- **`src/pages/sponsor/SponsorDashboard.jsx`** — added "Delivery Plans" nav item (Repeat icon, path `/dashboard/sponsor/delivery-plans`) + Route
- **`src/pages/site/SiteDashboard.jsx`** — `useSiteData()` now fetches `/delivery-plans/schedule?days=14` in parallel; merges plan instances with manual `/delivery/routes` so both show on Deliveries page

### How it works
1. Sponsor creates a plan (single or bulk): site(s) + kitchen + days + arrival time + meal counts
2. Backend immediately generates delivery_instances for next 60 days
3. Every morning at 6 AM UTC, cron generates today's instance + notifies site/kitchen users
4. **Kitchen** sees TodayProductionSchedule — per-site breakdown + totals (Breakfast 120, Lunch 185, Snack 92)
5. **Site** sees WeekDeliverySchedule on overview — 7-day view, today highlighted, meal chips per day
6. **SiteDeliveriesPage** merges /delivery/routes + /delivery-plans/schedule (60 days)
7. **KitchenDeliveriesPage** merges /delivery/routes + /delivery-plans/production

### New endpoints (Task #96)
- `GET /delivery-plans/production` — kitchen role, today's production per site with totals
- `POST /delivery-plans/bulk` — sponsor role, create N plans for N site_ids in one request

### Bulk wizard
Sponsor opens "Bulk Create" → picks kitchen → checks any number of sites (searchable, select all) → picks days → sets arrival time + meal counts → one click creates all plans at once. 15 sites = 15 plans generated immediately.

### SQL migration
Run `delivery_plans.sql` (in Desktop/outputs) in Railway query editor. ✅ Done 2026-07-14.

---

## Claims Engine (Task #80–83, 2026-07-09) ✅ LIVE

### What was built
- **Universal Claims Engine** (`programlink-backend/services/claimsEngine.js`) — state-agnostic engine that takes sites + stateConfig + claimMonth → returns full claim with reimbursement, per-site status, validation errors, potential loss
- **State configs** (`programlink-backend/services/stateConfigs/OH.json`, TX.json, GA.json, FL.json) — JSON-only, no state logic in code. OH rates: breakfast tier1 $1.70 / lunch tier1 $3.22 / snack tier1 $0.96
- **Claims controller** (`programlink-backend/controllers/claimsController.js`) — loads state from org's `region` column, runs engine, upserts to `claims` table
- **Claims route** (`programlink-backend/routes/claims.js`) — GET `/claims?month=YYYY-MM`, `/claims/history`, `/claims/states`. Requires `authorizeRoles('sponsor', 'admin')`
- **Claims Center UI** (`src/pages/sponsor/ClaimsPage.jsx`) — "Claim Command Center" title + month picker, HealthScore (CSS progress bar, specific blocker counts, "Claim period still active" fallback), 3 cards (Estimated Reimbursement / Reimbursement at Risk / Claim Deadline), meal type breakdown row, SiteStatusGrid (X/Y Sites Ready + per-site cards), ClaimTimeline (vertical checklist), sites detail table with expandable checklist + Send Reminder, GenerateClaim CTA (label changes based on readiness)
- **Claims DB tables** — `state_configs`, `claims`, `claim_items` (run `migrations/claims_tables.sql` in Railway)

### Claims Center is LIVE at cacfplink.com/dashboard/sponsor/claims

### State setup (how it works)
- Sponsor's org must have `region` column set to a 2-letter state code ('OH', 'TX', 'GA', 'FL')
- Engine loads the matching JSON config from `stateConfigs/`
- State is now set during registration (Task #83 ✅) — sponsors pick state on the registration form
- Existing sponsors with no state: go to Settings → Organization → pick CACFP Program State → Save → log out → log back in

### Existing users with null org_id (Charles, Deborah)
These users registered before Task #83. Fix:
1. They go to Settings → Organization → fill in org name + pick state → Save Organization
2. The backend auto-creates their org and links it (no manual DB work needed)
3. They log out and log back in → Claims Center works

### Railway watched files issue
Railway's "watch paths" filter causes some pushes to be SKIPPED ("No changes to watched files"). Fix: manually click ⋮ → Redeploy on the SKIPPED deployment in Railway.

### Railway sleeping (KNOWN PAIN POINT 🔴)
Railway free/hobby tier puts the backend to sleep after inactivity. Every time Hashi opens Railway he has to wait for a redeploy. This is frustrating and needs to be solved. Options to fix:
- Upgrade to Railway Pro ($20/mo) — no sleeping, always on
- Add a cron ping (UptimeRobot free tier pings the backend URL every 5 minutes to keep it awake)
- Move backend to a always-on host (Render, Fly.io, etc.)
**Priority:** Set up UptimeRobot free ping as the immediate fix. Pro upgrade when revenue supports it.

### Railway query editor LIMIT injection
Railway wraps subqueries in UPDATE statements with a LIMIT, causing syntax errors. Use two-step workaround: SELECT to get UUID, then UPDATE with literal UUID. Example:
```sql
-- Step 1: get the id
SELECT org_id FROM users WHERE email = 'hashipro87@gmail.com';
-- Step 2: update directly
UPDATE organizations SET region = 'OH' WHERE id = 'paste-uuid-here';
```

---

## Hashi Self-Test (2026-07-25) 🧪

**Account:** hashiguhad10@gmail.com — role: sponsor
**Org ID:** 475ca0a8-01ef-481b-9b67-75bdb98aff7d

Hashi ran CACFPLink as a real sponsor and found the following bugs. All fixed as of 2026-07-28.

### Bugs Found and Fixed

**1. Kitchen invite 403 error**
- Root cause: Two tabs open — AcceptInvitePage wrote a site-role JWT to `localStorage.token`, overwriting the sponsor JWT. The sidebar still showed the sponsor email (stale React state) but all API calls used the site token.
- Fix: Switched token storage from `localStorage` to `sessionStorage` — each tab now has its own isolated token.
- Files: `src/services/api.js`, `src/context/AuthContext.jsx`, `src/pages/auth/AcceptInvitePage.jsx`

**2. Cross-tab logout (logging out of site tab logged out sponsor tab)**
- Root cause: `localStorage` is shared across all tabs on the same domain. One tab's `logout()` removed the shared token; the other tab's 401 interceptor redirected to login.
- Fix: Same sessionStorage switch above. Each tab now has its own session. Closing a tab logs you out (expected behavior — more secure).

**3. Onboarding checklist showing "Done" when tasks weren't completed**
- Root cause: Steps tracked by localStorage "visited" array — marked done when user navigated to the page, not when the task was actually done.
- Fix: Rewrote `OnboardingPage.jsx` to check real API data. Step 1 done = `siteCount > 0`, Step 2 done = `kitchenCount > 0` (from stats endpoint). Step 3 (coordinator) is self-reported via "Already done" button.
- Files: `src/pages/sponsor/OnboardingPage.jsx`, `src/pages/sponsor/SponsorDashboard.jsx`

**4. Kitchens / Sites / Coordinators pages showing 0 results despite data existing**
- Root cause: All three pages used `Array.isArray(data) ? data : []`. The API returns objects (`{ organizations: [...] }`, `{ users: [...] }`), not arrays. `Array.isArray` always returned false → always `[]`.
- Fix: Changed to `data.organizations ?? ...` and `data.users ?? ...` across all affected pages.
- Files: `src/pages/sponsor/KitchensPage.jsx`, `src/pages/sponsor/SitesPage.jsx`, `src/pages/sponsor/CoordinatorsPage.jsx`

**5. Same Array.isArray bug in meal count and kitchen detail pages**
- `MealCountsPage.jsx` — `data.meal_counts ??` (was always [])
- `MealEntryForm.jsx` — `data.meal_counts ??` (kitchen recent meals always empty)
- `MealReminderBanner.jsx` — `data.meal_counts ??` (missed days check always wrong)
- `KitchensPage.jsx` connected sites panel — `data.kitchens ??`

**6. Sponsor tenant isolation bug**
- Root cause: `listOrganizations` had no scoping for sponsor role — any sponsor could see ALL organizations in the database (all sponsors' sites, kitchens, etc.)
- Fix: Added `WHERE sponsor_id = $N OR id = $N` filter using `req.user.organizationId` when role = 'sponsor'.
- File: `programlink-backend/controllers/organizationsController.js`

**7. Stats endpoint missing `total_kitchens`**
- Fixed: Added `total_kitchens` to stats response so onboarding can check `kitchenCount > 0`.
- File: `programlink-backend/controllers/statsController.js`

### Remaining Known Issues (not yet fixed)
- Invite emails go to spam — emails come from shared Resend domain `onboarding@resend.dev`. Fix: set up custom domain `cacfplink.com` in Resend (noreply@cacfplink.com).
- AcceptInvitePage in same browser as sponsor: when accepting an invite in the same browser session (not incognito), the accepted role's JWT replaces the current session. Real sponsors won't do this — invite recipients are different people. For testing, always accept invites in an incognito window.

---

## Real Signups (2026-07-09) 🔥

**Charles@cacfpsolutions.com** — role: sponsor — signed up 2026-06-29, `is_verified = true` ✅
- **State: Texas** 🤠 — build Texas state config/export first, not Ohio
- Last login: 2026-06-29 19:41:54 (hasn't logged back in since losing the link)
- Outreach email sent 2026-07-09, replied "Yeah, still here. Still interested. Can you give me that login link again?"
- Sent login link (https://cacfplink.com/login) + instructions to set state in Settings
- Still needs: Settings → Organization → pick state (Texas) → Save → re-login for Claims Center to work

**deborah.wilson@gansi.org** — role: sponsor (Deborah Gillison-Wilson, GANSI) — signed up 2026-07-09, `is_verified = true` ✅ (manually verified via Railway)
- Last login: NULL — has never logged in
- Outreach email sent 2026-07-09, no reply yet
- Still needs: first login + Settings → Organization → pick state → re-login for Claims Center to work

### How to check login status
```sql
SELECT email, last_login_at FROM users 
WHERE email ILIKE '%charles%' OR email ILIKE '%deborah%';
```
Note: `users` table has `last_login_at TIMESTAMPTZ` column (already exists — do NOT run ALTER TABLE again).

### Railway UPDATE quirk
Direct `UPDATE users SET is_verified = true WHERE email = '...'` returns "0 rows" in Railway UI even when it succeeds. Verify with a follow-up SELECT to confirm.

### audit_log table
The `audit_log` table does NOT have a `user_id` column — querying it by user_id will error.

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
| 10 | Build About page | ✅ |
| 11 | Trust signals (badges, privacy policy, ToS, contact) | ✅ |
| 12 | Social proof + pilot program badge — added live "2 sponsors in pilot" badge to hero | ✅ |
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
| 75 | Fix demo navigation — SiteDemo + SponsorDemo use useLocation, all nav items show unique content | ✅ |
| 80 | Universal Claims Engine — state-agnostic, JSON state configs (OH/TX/GA/FL) | ✅ |
| 81 | Claims Center UI — progress bar, per-site status, reimbursement breakdown | ✅ |
| 82 | Claims DB tables — claims, claim_items, state_configs | ✅ |
| 83 | Add state picker to registration + Settings page (so sponsors self-configure state) | ✅ |
| 84 | Claims Center redesign — Claim Health Score, Reimbursement at Risk, sites table, Generate Claim CTA | ✅ |
| 85 | Claims Center — specific blocker counts, smart CTA label, Claim Timeline | ✅ |
| 86 | Claim Command Center polish — CSS progress bar, Claim Deadline card, "0 blockers" fallback fix | ✅ |
| 87 | Site Status Grid (X/Y Sites Ready + per-site status cards) + rename "Potential Loss" → "Reimbursement at Risk" | ✅ |
| 88 | Remove USDA from product branding — Login.jsx subtitle → "CACFP Operations Platform", ReportsPage title → "CACFP Meal Count Report" | ✅ |
| 89 | Sponsor onboarding UX — "Already a Sponsor?" note on Register.jsx + first-login OnboardingPage.jsx (5 steps, localStorage per user) wired into SponsorDashboard | ✅ |
| 90 | CheckEmailPage spam warning — replaced tiny gray text with prominent amber warning box | ✅ |
| 91 | Notification Center — unread badge on all 4 sidebar bells, NotificationsPage full redesign (filter tabs, time groups, action buttons, role-aware paths) | ✅ |
| 92 | All 50 US states — added to PROGRAM_STATES in Register.jsx + SettingsPage.jsx + generated 46 stateConfig JSON files | ✅ |
| 93 | Site Dashboard redesign — daily assistant layout (GoodMorningBanner, TodayChecklist, SummaryCards, MealCountStatus, TodayDeliveryCard, meal count vs delivery integration, QuickActions, DocProgress, RecentActivity) + SiteDeliveriesPage with hero, timeline, history | ✅ |
| 94 | Recurring Delivery Plans — backend controller + routes, delivery_plans + delivery_instances DB tables, DeliveryPlansPage.jsx (plan list, create/edit modal, pause/resume/delete), sponsor sidebar nav item, site dashboard merges plan schedule with manual routes | ✅ |
| 95 | Week delivery schedule on site dashboard — WeekDeliverySchedule replaces TodayDeliveryCard, shows 7-day view with meal chips, kitchen, ETA, today highlighted blue, inline match indicator; SiteDeliveriesPage now merges /delivery-plans/schedule with /delivery/routes | ✅ |
| 96 | Kitchen production schedule + bulk plan wizard — TodayProductionSchedule on kitchen dashboard (per-site breakdown + totals footer, color-coded meal chips); GET /delivery-plans/production + POST /delivery-plans/bulk backend endpoints; BulkWizardModal on DeliveryPlansPage (multi-site select, search, select all, creates N plans at once) | ✅ |
| 98 | Coordinator Dashboard redesign — daily work management center: WorkTodayCard hero (4 tiles: missing counts/expiring docs/apps/messages), AssignedSitesList (tier dot + unverified count, click-to-drawer), NeedsAttentionList (priority inbox red→yellow), InlineApplications (approve/request changes/reject inline), MessagePreviews, RegionSnapshot sidebar, QuickActions sidebar, RecentActivity timeline, SiteDetailDrawer (360° overlay: compliance score, docs, counts, app status, 3 quick actions); useCoordinatorData() parallel-fetches 6 sources | ✅ |
| 97 | Kitchen Dashboard redesign — 9-section daily assistant layout: KitchenDailyChecklist (5 auto-tracked tasks), TodayProductionCard (meal totals + sites served + next delivery), TodayDeliveriesTimeline (dot timeline), SiteStatusCard (submitted vs pending with site list), inline MealEntryForm, DocComplianceCard (5 required docs inline), KitchenSummaryCard (monthly stats), TomorrowProductionCard (planning preview); useKitchenData() hook parallel-fetches 6 endpoints; getKitchenProduction extended with has_submitted/submittedCount/pendingCount/nextDelivery | ✅ |
| 99 | All 4 demo pages updated — CoordinatorDemo full rewrite (5 sites, TIER_META, SiteDrawer, inline approve/reject); KitchenDemo full rewrite (production card, checklist, deliveries, timeline); SiteDemo + WeekDeliverySchedule + Deliveries section; SponsorDemo + DeliveryPlansPage with pause/resume toggle | ✅ |
| 100 | Kitchen Dashboard layout — TodayProductionCard moved above KitchenDailyChecklist (production is primary job); checklist compacted (py-2, gap-x-4 gap-y-1.5) so both are visible above the fold; KitchenDemo mirrored same order | ✅ |
| 101 | Proactive warning triggers — GET /warnings backend endpoint (4 warning types: sites missing counts 3+ days, docs expiring ≤7 days, sites with zero counts this month, meal count anomaly >2x avg); ProactiveWarningsCard on sponsor overview (severity colors, Fix → links, dismissible per session) | ✅ |
| 102 | Simplified site meal count page — SiteMealCountPage.jsx replaces MealEntryForm on site /meals route; 2x2 color-coded tile grid (Breakfast/Lunch/Snack/Supper), big +/− inputs, copy yesterday, pre-fills if today submitted, this-month history list (click to edit), sticky mobile Submit bar | ✅ |
| 103 | Claim readiness widget on sponsor overview — ClaimReadinessWidget fetches GET /claims?month=YYYY-MM; shows readiness %, progress bar, estimated $, at-risk $, X/Y sites ready; no-state fallback prompts Settings; entire card links to /claims | ✅ |
| 104 | Claim history in ClaimsPage — ClaimHistory component below GenerateClaim CTA; table of past 6 months (month, status badge, readiness %, estimated $, sites ready); clicking a row loads that month's claim | ✅ |
| 105 | Claim Simulator — add breakfast/lunch/snack/supper columns to meal_counts; submitMealCount stores per-type; claimsController pulls real per-type totals (falls back to even split for legacy rows); eliminates approximation in claims engine | ✅ |
| 106 | Live Claim Simulator UI — ClaimSimulatorPanel on ClaimsPage; collapsed behind a dashed button; 2×2 meal type tiles with editable count inputs (+/− 10); client-side reimbursement recalculates instantly using state rates from API; simulated total vs current estimate delta; Reset to actual button | ✅ |
| 107 | State export profiles — GET /claims/export?month=YYYY-MM returns formatted PDF (pdfkit); header bar, 3 summary cards, meal breakdown table with tier rates, per-site detail table, issues section, footer; "Download [State] Claim PDF" button on ClaimsPage; blob download via api responseType blob | ✅ |
| 108 | One-Click Audit Mode — audit_tokens table (token UUID, snapshot JSONB, 30-day expiry, view_count); POST /claims/audit-token creates token with full claim snapshot; GET /audit/:token public endpoint; AuditPage.jsx public read-only view (no login); "Create Audit Link" + copy button in GenerateClaim section | ✅ |
| 109 | Update SponsorDemo with Claims — added Claims nav item (DollarSign icon), DEMO_RATES/DEMO_INITIAL_COUNTS/DEMO_SITES_CLAIM/MEAL_COLORS constants, ClaimsPage demo component (health score bar, 3 stat cards, meal breakdown, interactive Claim Simulator with +/− inputs, site status grid, Submit & Export CTA with disabled PDF + audit link); claim readiness widget on Overview (gradient purple card, 88% / $14,234 / 4/5 sites) | ✅ |
| 110 | Child Roster — `children` table (SQL run ✅), childrenController.js (list/create/update/delete/summary, age_group auto-calc from birthdate), routes/children.js, ChildRosterPage.jsx (summary cards, search/filter by status+age+org, add/edit/delete modal, STATUS_META/AGE_META/TIER_META), wired into SponsorDashboard nav + routes | ✅ |
| 111 | Task System — `tasks` table (SQL run ✅), tasksController.js (CRUD, sponsors see all, sites/kitchens see assigned only, priority sort, notification on assignment), routes/tasks.js, TasksPage.jsx (summary cards, status/priority/category filters, grouped Open/Completed, one-click status toggle, overdue badge, add/edit modal), wired into all 4 dashboards | ✅ |
| 112 | Inspection Dashboard — `inspections` + `inspection_findings` tables (SQL run ✅), inspectionsController.js (9 endpoints: list/create/update/delete inspections + list/create/update/delete findings + summary; auto-marks overdue; auto-closes inspection when all findings resolved), routes/inspections.js, InspectionsPage.jsx (summary cards, expandable inspection cards, severity badges critical/major/minor/observation, one-click resolve, add/edit modals), wired into SponsorDashboard + CoordinatorDashboard | ✅ |
| 113 | Activity Feed — `activity_feed` table (SQL run ✅), activityService.js (logActivity() best-effort, TYPES constants), activityController.js (GET /activity, role-scoped), routes/activity.js; wired logActivity() into tasksController (task_created/completed), inspectionsController (inspection_logged/finding_resolved), mealCountsController (meal_counts_submitted), applicationsController (submitted/approved/rejected/changes); ActivityFeedPage.jsx (type filter pills, grouped by Today/Yesterday/day, timeAgo labels, load more pagination, refresh button, skeleton loading), wired into all 4 dashboards | ✅ |
| 114 | Menu Builder — `menus` + `menu_items` tables (SQL run ✅), menusController.js (CACFP meal pattern validation + WGR check per day, getMenu returns validation object with missing components per meal + wgr_ok, upsertItem ON CONFLICT DO NOTHING), routes/menus.js; MenuBuilderPage.jsx (weekly Mon–Fri grid, green/red/gray cell color coding, FoodChip with component emoji, add-item drawer, wheat WGR indicator, Approve button unlocks at 0 issues, validation summary bar, legend), wired into SponsorDashboard + KitchenDashboard | ✅ |
| 115 | Uptime monitoring + reliability copy — UptimeRobot free ping every 5 min to /health keeps Railway awake; homepage PerformanceSection enhanced with 3-card uptime block (All Systems Operational + green pulse, 99.9% uptime, <200ms p99), footer copy "monitored around the clock — always there when you need it most, including end of month" | ✅ |
| 116 | Update all 4 demo pages — added Children, Tasks, Inspections, Menus, Activity sections to SponsorDemo; added Tasks, Inspections, Activity to CoordinatorDemo; added Menus, Tasks, Activity to KitchenDemo; added Tasks, Activity to SiteDemo | ✅ |
| 117 | Enrollment compliance system — `enrollment_fields.sql` (add 8 new columns to children table); childrenController.js rewritten: REQUIRED_FIELDS validation, getMissingFields(), submitEnrollmentForm(), reviewEnrollmentForm(), getEnrollmentCompliance() (returns 4 counts + pending_review list); routes/children.js: 8 routes including /compliance, /:id/submit, /:id/review; SiteEnrollmentPage.jsx (site-facing form: child list with form_status badges, missing-field warnings, expandable detail, day/meal toggles, signature checkbox, submit-blocks until complete); ChildRosterPage.jsx: enrollment compliance panel at top (audit-ready %, 4 stat tiles, inline approve/reject for pending forms); scheduledJobs.js: enrollment expiry cron at 9am UTC (30-day + 7-day alerts to site staff + sponsor); SiteDashboard.jsx: Enrollment nav item + route wired | ✅ |
| 118 | Enrollment roster import (AI scan) — POST /children/import/extract (multer memoryStorage, sends PDF text or image base64 to Claude claude-sonnet-5, returns structured JSON array); POST /children/import/confirm (bulk insert with ON CONFLICT DO NOTHING); ImportEnrollmentModal.jsx (4-step: upload drag-drop → extracting spinner → review editable child cards → done); "Import Roster" button on both SiteEnrollmentPage and ChildRosterPage; packages: @anthropic-ai/sdk + pdf-parse added to backend; requires ANTHROPIC_API_KEY in Railway env vars | ✅ |
| 119 | Menu Builder enhancements — Per-day validation assistant panel (🟢/🟡/🔴 per day, clickable issue pills that open that exact cell); Copy Previous Week button (loads last week's menu items and posts them to current week); Duplicate Day (Copy button per day column header, opens modal to pick target days, copies all meals); summary bar updated to reference the validation panel; full 7-day grid Mon–Sun (DAYS array expanded, formatWeek shows Mon–Sun, minWidth bumped to 1160) | ✅ |
| 121 | Menu Builder feature pack — meal templates (save/apply/delete), searchable USDA curated food library (~65 foods, filtered by meal type), AI Generate Weekly Menu (claude-haiku-4-5, 7-day compliant menu, clears existing items), infant track toggle (has_infant on menus table, pink row, formula required validation), daily reimbursement estimate per day (est. children input × state tier-1 rates, shown in column headers), per-cell notes/comments (menu_comments table, 4th tab in drawer); 4-tab drawer: Add Food / Library / Templates / Notes; menu_templates + menu_comments tables (SQL: menu_builder_features.sql) | ✅ |
| 120 | Grouped sidebar nav for all 4 roles — Sidebar.jsx updated to render sectionLabel markers (gray uppercase labels) and divider markers (thin hr); all 4 dashboards reorganized: Sponsor (Program / Operations / Finance / Compliance / Tracking), Coordinator (Assignments / Program Data / Work), Kitchen (Daily Ops / Admin), Site (Daily Ops / Admin); Messages/Notifications/Settings always in bottom section after divider | ✅ |
| 124 | Demo pages update — SponsorDemo overview: Claim Readiness widget → Claim Intelligence widget (purple header, at-risk $, issues list with fix links); SiteDemo: Income Certs nav item + IncomeCertsPage (6 demo children sorted by urgency, expandable inline cert form with date/tier, summary cards, red alert) | ✅ |
| 125 | CSV/Excel roster import — ImportEnrollmentModal.jsx full rewrite: mode toggle (AI Scan vs Spreadsheet), SheetJS XLSX parsing, auto column detection (FIELD_ALIASES maps 9 fields × multiple synonyms), ColumnMapPreview step shows detected vs skipped columns, date normalization (Excel serial + string), tier normalization; AI mode unchanged; step bar adapts to mode (3 steps each, different labels) | ✅ |
| 126 | Menu Builder demo upgrade — SponsorDemo MenusPage: 7-day Mon–Sun grid, per-day status dots (🟢/🟡/🔴) + ~$3.42 daily estimate in column headers, supper row for Sat/Sun, infant track toggle (pink row), Copy Prev Week button, Templates dropdown (saved templates + save current), AI Generate button (1.8s spinner → swaps to AI_GENERATED_GRID), clickable day header opens validation panel (per-meal status + est. reimbursement) | ✅ |
| 127 | Homepage — Claim Intelligence section + updated Features grid: added ClaimIntelligenceSection (dark bg, 2-col layout, copy on financial guardian, live mockup with $214,873 estimated / $4,128 at risk / 5 issues list); inserted after Hero before PerformanceSection; updated FEATURES array (replaced stale features with Claim Intelligence/AI Menu Builder/Child Roster+Income Certs/Recurring Deliveries); updated Sponsor demo card highlights to mention Claims + Menu Builder + Income Certs | ✅ |
| 128 | Reimbursement ROI Calculator on homepage — interactive ROICalculator component: +/− buttons + sliders for sites (1-200) and children per site (5-500), 4 meal toggles (breakfast $1.70/lunch $3.22/snack $0.96/supper $3.22), state picker (15 states), useMemo calculation shows monthly/annual/daily estimates + 2% error-rate recovery example; CTA "Protect this reimbursement with CACFPLink →"; inserted above ContactSection | ✅ |
| 129 | Monthly sponsor report email — `sendMonthlyReportEmail()` in emailService.js (branded HTML: purple header, 3 stat boxes est. reimbursement/sites ready/meal counts, issue table with site + message + at-risk $, green all-clear when 0 issues, View Claims Center CTA); `sendMonthlyReports()` cron in scheduledJobs.js (queries all active verified sponsors with region set, loads stateConfig rates per sponsor, computes estimated reimbursement from per-type meal counts, flags sites with no counts + expired docs as issues, sends email per sponsor); cron `0 9 28 * *` fires at 9am UTC on the 28th of each month — before most state CACFP claim deadlines | ✅ |
| 123 | Income Eligibility form — SiteIncomePage.jsx (site-facing); children listed by cert status (valid/expiring/expired/missing); summary cards (certified/need action/expiring/total); red callout when certs missing; inline per-child cert form (cert date auto-fills 12-month expiry, tier selector, recertify button); filter tabs + search; sorted by urgency (missing → expired → expiring → valid); uses existing PUT /children/:id; wired into SiteDashboard nav + route as "Income Certs" | ✅ |
| 122 | Claims Rules Engine + Claim Intelligence — claimsEngine.js: added universal `no_meal_counts_submitted` rule (always runs, potentialLoss=site estimated $), fixed potentialLoss for `documents_not_expired` and `menus_meet_meal_pattern` (was 0, now site.estimatedReimbursement); claimsController.js: full refactor with `_loadClaimData` helper — now queries real hasMenus (menus table), hasEnrollment (children form_status=approved), hasIncomeEligibility (income_cert_date+expires); new `getIntelligence` endpoint returns flat issues list with fixPath/fixLabel per error code + calcDeadline helper; routes/claims.js: GET /intelligence added; SponsorDashboard.jsx: ClaimReadinessWidget → ClaimIntelligenceWidget (purple gradient header with month + deadline countdown, estimated $ + at-risk $, issues list with red/amber dots + dollar amounts + direct fix links, green all-clear when 0 issues) | ✅ |
| 129 | Monthly sponsor report email — `sendMonthlyReportEmail()` in emailService.js; `sendMonthlyReports()` cron fires at 9am UTC on the 28th of each month | ✅ |
| 130 | Remove AI Generate menu (costs money, unreliable) — replaced with Compliance Assistant panel; `generateMenu` endpoint now returns 503 gracefully if key missing | ✅ |
| 131 | Compliance Assistant panel — ShieldCheck button in Menu Builder header toggles right-side panel; expandable sections: Meal Component Guide (per meal emoji + components + tip), WGR Guide, Milk by Age, Infant Meals, Common CACFP Errors (8 entries), Non-Creditable Foods (8 entries), food search; `showHelp` + `helpContext` state; contextual — `openCell()` sets `helpContext` to the meal type so panel auto-focuses relevant section | ✅ |
| 132 | Compliance Assistant enhancements — severity system 🟥 Critical / 🟨 Warning / 🟦 Info; USDA 7 CFR Part 226 citations on every rule; live issue detection (runs `validateMealClient` + `getDayWGROk` over all items, surfaces issues by day+meal); clickable errors open exact meal cell (onOpenCell prop); smart natural-language Q&A search (15-entry QA_DB, matched by keyword, layered with food library + non-creditable results); button renamed "Compliance Assistant"; NON_CREDITABLE / SEVERITY / MEAL_GUIDE / COMMON_ERRORS / QA_DB constants added to MenuBuilderPage.jsx | ✅ |
| 133 | Compliance Assistant — State Resources tab: two-tab panel (USDA Compliance / State Resources), TX full data (agency TDA, SquareMeals portal, phone/email, 3 deadlines, 6 required forms, 3 tips), minimal data for CA/OH/VA/CO, graceful fallback when no state set, state pulled from /menus/rates | ✅ |
| 139 | Update CACFPLink homepage — FEATURES expanded 8→12 (added Inspection Dashboard, Task System, Activity Feed, One-Click Audit Mode; updated AI Menu Builder → Menu Builder + Compliance Assistant); demo role highlights updated for all 4 roles; WhyCACFPLink table 8→12 rows; Hero subtitle updated | ✅ |
| 140 | Weekly sponsor digest email — `sendWeeklyDigestEmail()` in emailService.js (3-stat header: estimated reimbursement / issues / sites ready; top-3 issues table with at-risk $; green all-clear when 0 issues; subject line includes issue count); `sendWeeklyDigests()` cron in scheduledJobs.js; cron `0 7 * * 1` fires at 7am UTC every Monday; reuses same sponsor query + stateConfig rate logic as monthly report | ✅ |
| 134 | Production Records — `production_records` + `production_record_items` tables (SQL: production_records.sql in Desktop/outputs); productionRecordsController.js (listRecords, getRecord, upsertRecord, updateRecord, autoFill, upsertItem, deleteItem, getSummary); routes/productionRecords.js; mounted at /production-records; ProductionRecordsPage.jsx (7-day week grid, 4 meal rows, click-to-drawer, auto-fill from menu, add items manually, WGR checkbox, servings, notes, draft/complete status); wired into KitchenDashboard nav + routes as "Production Records" under Daily Ops | ✅ |
| 141 | Sponsor production records view + KitchenDemo update — SponsorProductionRecordsPage.jsx (per-kitchen audit view: summary cards, expandable KitchenRow with completion bar + date/meal status badges, draft warning, USDA 3-year note); wired into SponsorDashboard under Operations; KitchenDemo "Production Records" nav item + full demo section (week grid Mon–Sun, complete/draft/empty cells, clickable cells open drawer preview with auto-fill note, food items, servings inputs, Save Draft / Mark Complete footer) | ✅ |
| 135 | Renewal Wizard — `renewals` + `renewal_items` tables (SQL: renewals.sql in Desktop/outputs); renewalsController.js (listRenewals, getRenewal, createRenewal, updateRenewal, updateItem, getSiteRenewals); routes/renewals.js; mounted at /renewals; RenewalWizardPage.jsx (sponsor: 3-step create wizard — title/due date → site picker with search/select-all → required items checklist; renewal cards with progress bar, per-site accordion with Complete/Waive per item); SiteRenewalPage.jsx (site: checklist with Confirm button for self-complete items, Upload link for document items, progress bar, days-left warning); wired into SponsorDashboard (Compliance section) + SiteDashboard (Daily Ops section); SponsorDemo + SiteDemo updated with full interactive Renewal demo (3-step wizard modal, per-site accordion with live Complete toggle, site checklist with Confirm buttons) | ✅ |
| 136 | Training tracking + expiration reminders — `staff_trainings` table (SQL: staff_trainings.sql in Desktop/outputs); trainingController.js (listTrainings, getSummary, createTraining, updateTraining, deleteTraining, sendTrainingExpiryReminders — role-scoped: sponsor sees all orgs, kitchen/site sees own); routes/training.js; mounted at /staff-trainings; emailService.js: `sendTrainingExpiryEmail` (30/14/7 day urgency 🟠🟡🔴); scheduledJobs.js: daily 8:30am UTC cron; TrainingPage.jsx (sponsor + kitchen, summary cards, filterable cert list, add/edit modal with CERT_TYPES, org picker for sponsors, expiry countdown); SponsorDashboard: "Staff Training" nav + route under Compliance; KitchenDashboard: "Staff Training" nav + route under Admin; SponsorDemo: SponsorTrainingPage (5 demo certs across 3 orgs, filter by status); KitchenDemo: training case (4 kitchen staff certs, status badges, info note) | ✅ |
| 137 | Forms Pre-fill Engine — `formDataService.js` (FIELD_SOURCES + FORM_TEMPLATES constants; `generateFormData(orgId, templateId)` pulls org/sponsor/contact data from DB and resolves all fields); `formsController.js` (listTemplates, getFormData, generateFormPDF — pdfkit PDF with header bar, section blocks, signature lines, checklist); `routes/forms.js` mounted at /forms; 4 initial templates: Site Information Sheet, Sponsor Agreement, Annual Renewal Confirmation, Income Eligibility Statement; adding a new form = one FORM_TEMPLATES object only; `FormGeneratorPage.jsx` (3-panel: org picker, template cards, live preview with field values + missing badges, Download PDF button); wired into SponsorDashboard under Compliance as "Form Generator"; SponsorDemo: interactive FormGeneratorPage (3 orgs, 4 templates, live preview swap, download toast) | ✅ |
| 138 | Export Framework — pluggable adapter pattern for claim exports; `exportEngine.js` routes format param to adapter; `exportAdapters/pdf.js` (refactored from claimsExportController), `exportAdapters/excel.js` (exceljs — 2-sheet workbook: Summary + Per-Site Detail), `exportAdapters/csv.js` (pure Node, BOM for Excel UTF-8); `exportAdapters/tx_squaremeals.js` (stub — build when Charles needs it); `claimsExportController.js` updated: accepts `?format=pdf\|excel\|csv`, delegates to engine; `ClaimsPage.jsx`: 3 export buttons (PDF / Excel / CSV) with per-format loading states; `exceljs` added to package.json | ✅ |
| 142 | Self-test bug fixes (2026-07-28) — Fixed 7 bugs found during Hashi's sponsor self-test: (1) Kitchen invite 403 — root cause was site-role JWT in localStorage overwriting sponsor JWT across tabs; (2) Cross-tab logout — localStorage shared across tabs, one tab's logout cleared all; (3) Onboarding showed "Done" based on page navigation not real data; (4–5) KitchensPage/SitesPage/CoordinatorsPage/MealCountsPage/MealEntryForm/MealReminderBanner all used `Array.isArray(data)` which always returned false since API returns `{ organizations/users/meal_counts: [...] }`; (6) Sponsor tenant isolation — any sponsor could see all orgs in DB; (7) Stats missing total_kitchens for onboarding check. Fix for 1+2: switched token storage from localStorage → sessionStorage (per-tab isolation). Files: api.js, AuthContext.jsx, AcceptInvitePage.jsx, OnboardingPage.jsx, SponsorDashboard.jsx, KitchensPage.jsx, SitesPage.jsx, CoordinatorsPage.jsx, MealCountsPage.jsx, MealEntryForm.jsx, MealReminderBanner.jsx, organizationsController.js, statsController.js | ✅ |
| 143 | Sponsor Dashboard redesign (2026-07-29) — Mission-driven layout answering "What do I do next?": MissionCard (7-step claim readiness checklist with real API data, progress bar), BlockingIssues (dollar-framed list of what's stopping reimbursement with fix links), TeamStatusCard (sites/kitchens/applications counts), ClaimSnapshotCard (estimated $, deadline, readiness %), RecentActivityFeed (5 latest activity items). Removed: ProactiveWarningsCard, ClaimIntelligenceWidget, stat cards, ActionCenter, Sponsor ID card, Recent Applications. useMissionData() parallel-fetches /claims/intelligence + /activity + /children/summary + /warnings. Files: src/pages/sponsor/SponsorDashboard.jsx | ✅ |
| 144 | Program type picker on Add Site modal — 6 CACFP program types with emoji + note (Child Care Center 🏫, Family Day Care Home 🏠, Head Start ⭐, At-Risk Afterschool 🌙, Emergency Shelter 🏥, Open Community Meal Site 🌳); card-style selection; required before invite can proceed; program_type stored in organizations DB column (add_program_type.sql run in Railway ✅); foundation for program-aware workflows where different types show/hide enrollment, income eligibility, etc. Files: src/pages/sponsor/SitesPage.jsx, organizationsController.js | ✅ |
| 145 | Import children bug fix (2026-07-29) — after clicking Done, children count remained 0; root cause: orgId was undefined when no site pre-selected, children saved under sponsor's own org instead of site org, invisible in list; fix: added site-select step as first step in ImportEnrollmentModal when propOrgId not provided; selectedOrgId used for all API calls. Files: src/components/enrollment/ImportEnrollmentModal.jsx | ✅ |
| 146 | AI scan HEIC fix (2026-07-29) — iPhone photos default to HEIC format; Claude API rejects HEIC causing silent 500 errors; removed HEIC from accepted file types (.pdf,.jpg,.jpeg,.png,.webp only); clear error message with iPhone settings path; backend guard in childrenController rejects unsupported mimetypes with 400. Files: ImportEnrollmentModal.jsx, childrenController.js | ✅ |
| 147 | Import UX: column matching + persistent site banner (2026-07-29) — "Matched N of M columns automatically" banner on CSV mapping step (green ≥80%, amber otherwise); FIELD_ALIASES expanded with 20+ synonyms (Child DOB, Birth Date, Caregiver, Renewal Date, Home Phone, F Name, fname, lname, etc.); persistent "Importing to: [Site Name]" banner pinned to all steps after site selection with Change link; searchable site list for sponsors with many sites (search auto-focused, real-time filter, count context); Continue button shows selected site name to prevent confusion. Files: src/components/enrollment/ImportEnrollmentModal.jsx | ✅ |
| 148 | Homepage redesign (Task #15, 2026-07-29) — Updated hero: headline "Never lose a dollar of CACFP reimbursement", financial guardian subtitle, social proof chip; added ComplianceAssistantSection (2-col with live mockup, search bar, CFR citation answer, meal guide); added StateResourcesSection (TX mockup with rate grid, deadline card, TDA agency, required forms); reordered page: Hero → ProblemSolution → ClaimIntelligence → Features → Workflow → ComplianceAssistant → StateResources → WhyCACFPLink → TryDemo → Performance → Testimonials → ROI → FounderStory → Pricing → CTA; removed 7 redundant sections (Demo, Screenshots, Trust, Security, HowItWorks, Mobile, Impact). Files: src/pages/home/HomePage.jsx | ✅ |
| 149 | QA bug fixes (2026-07-29) — Issue #10: coordinator enrollment dead end — childrenController notifies sponsors/coordinators separately with role-correct action_url; changed type to 'pending_approval'; routes/children.js opens review endpoint to coordinator role; NotificationsPage.jsx getActions() uses stored action_url when present; CoordinatorDashboard.jsx adds pendingEnrollments fetch, Enrollment Review nav, NeedsAttentionList entry, route; new CoordinatorEnrollmentPage.jsx with Approve/Reject inline + expandable detail. Issue #8: enrollment missing-field breakdown — getEnrollmentCompliance adds 3rd parallel query returning field_gaps (sorted by count); ChildRosterPage.jsx shows field-gap chips in compliance panel + per-child "N fields missing" badge. | ✅ |
| 150 | State Rule Book page (Task #16, 2026-07-29) — /dashboard/sponsor/state-rules; fetches state from /menus/rates; State tab: rates table (Tier I), key deadlines, required forms list, agency contact (name/portal/phone/email), state tips; Federal Meal Pattern tab: breakfast/lunch/snack component tables, milk-by-age rules, WGR explanation, 7 CFR Part 226 citation; graceful fallbacks for no-state and unknown-state; full data: TX/CA/OH/VA/CO; 'State Rule Book' in sponsor sidebar Compliance section. Files: src/pages/sponsor/StateRuleBookPage.jsx, src/pages/sponsor/SponsorDashboard.jsx | ✅ |
| 151 | Sentry error monitoring (Task #17, 2026-07-29) — @sentry/node added to backend package.json; Sentry.init() at top of app.js before all middleware; Sentry.setupExpressErrorHandler() before global error handler; @sentry/react added to frontend package.json; Sentry.init() in main.jsx before ReactDOM.createRoot; both no-op gracefully without env vars; tracesSampleRate: 0 (errors only, free tier safe); ignoreErrors: ResizeObserver/ChunkLoadError/non-Error rejections. Railway needs SENTRY_DSN, Vercel needs VITE_SENTRY_DSN (one-time setup). | ✅ |
| 152 | Actionable compliance panel + auto-filter after save (2026-08-02) — replaced vague field-gap chips with per-child "Needs Attention" list: each incomplete child shown by name + exact missing fields (e.g., "Missing: Income tier, Attendance days") + "Fix →" button that opens the enrollment wizard for that child; no backend change needed — computed client-side from loaded children array; after wizard Done is clicked, roster auto-filters to that child's org_id so newly added child doesn't get lost. Files: src/pages/sponsor/ChildRosterPage.jsx | ✅ |
| 153 | Enrollment + meal count polish (2026-08-02) — (1) Sponsor auto-approve: childrenController createChild/updateChild now sets form_status='approved' when role=sponsor/admin; draft status only applies to site-submitted forms; (2) Wizard date clearing fix: normalizeDates() slices ISO timestamps to YYYY-MM-DD before setChild(); applied on initialChild load and every POST/PUT response; (3) Needs Attention simplified: only shows children with getMissingCount>0, no more draft-status false positives, no Approve button; (4) Missing Information filter in status dropdown: client-side computed filter, skips backend param; (5) Income tier step enhanced: plain-English explanation, WIC/SNAP/TANF shortcut, 2025–2026 FPL quick-reference table; (6) Meal Counts All Sites view: entry panels for all self-managed sites shown immediately on page load, no tab click required. Files: childrenController.js, ChildEnrollmentWizard.jsx, ChildRosterPage.jsx, MealCountsPage.jsx | ✅ |
| 154 | Meal Counts page — site dropdown is a filter not a gate (2026-08-02) — page loads with all content visible by default (siteId='all'); "Select a Site" dropdown at top filters without hiding content; All Sites view shows entry panels for every self-managed site + full submissions list; picking a specific site scopes to that site; removed blank-state guard and all selectedSite conditional wrappers on stat bar, filter bar, and entries list. Files: src/pages/sponsor/MealCountsPage.jsx | ✅ |
| 155 | OCR scan date auto-detection (2026-08-02) — updated Claude vision prompt in mealScanController.js to also extract the date from the slip image and return it as `date: "YYYY-MM-DD"` (null if not visible); frontend handleFileUpload now calls setDate(data.date) when detected and shows "Counts and date filled in (YYYY-MM-DD)" in scan message; date string validated with regex before use. Files: mealScanController.js, MealCountsPage.jsx | ✅ |
| 156 | Meal count spreadsheet import (2026-08-02) — "Import Spreadsheet" button in page header; ImportMealCountsModal component: upload .xlsx/.csv → auto-detect column names (COL_ALIASES map supports 20+ synonyms for date/breakfast/lunch/snack/supper) → preview table with detected columns + site picker → submit all rows via POST /meal-counts; uses SheetJS (already a dep); skips rows with invalid/missing dates; reports ok/skipped count when done. Fixed date parsing to use object-key mode (no XLSX.SSF dependency); moved button next to upload area inside MealEntryPanel; modal skips site picker when site already selected (shows "Importing to: [Site]" badge instead); removed "All Sites" option from site dropdown. Files: src/pages/sponsor/MealCountsPage.jsx | ✅ |
| 157 | Sponsor can log production records for kitchens (2026-08-02) — "Log for Kitchen" button on SponsorProductionRecordsPage; LogRecordModal: kitchen picker, date, meal type chips, servings field, food items list (food name + component + quantity, add/remove rows), notes, "Mark as complete" checkbox; saves via POST /production-records + POST /production-records/:id/items; page reloads after save; backend already allowed sponsor role for writes; enables workflow where kitchen emails/calls production info and sponsor enters it. Files: src/pages/sponsor/SponsorProductionRecordsPage.jsx | ✅ |
| 158 | Production Records full redesign (2026-08-02) — kitchen-first layout matching Meal Counts pattern; kitchen selector with "(I'll log records)" vs "(kitchen logs records)" label; mode banner after selection; inline RecordForm: date, meal type dropdown (Breakfast/AM Snack/Lunch/PM Snack/Supper), menu items list (food name + component + qty), Planned/Actual/Leftovers (auto-calc), Prepared By, Notes, Save Draft / Submit; multiple records per day supported (separate by meal_type); RecordHistory grouped by date with meal chip + status badge + delete button; new DELETE /production-records/:id backend endpoint (cascades to items); month picker in header. Files: src/pages/sponsor/SponsorProductionRecordsPage.jsx, programlink-backend/routes/productionRecords.js, programlink-backend/controllers/productionRecordsController.js | ✅ |
| 161 | Deliveries redesign — Today's Deliveries checklist (2026-08-05) — MealOrdersPage fully rewritten with two tabs: "Today's Deliveries" (default, date-navigable checklist auto-generated from delivery schedules) + "Delivery Schedules" (recurring templates). Each delivery row: checkbox to mark delivered, pencil to edit today's quantity (override without changing schedule), skip button (undo-able), Print Slips (per-kitchen printable window), Notify Kitchens (sends today's list to kitchen users). Backend: new GET /delivery-plans/today (sponsor-scoped, returns instances + effective counts with overrides applied), POST /delivery-plans/notify-kitchen, extended PATCH /delivery-plans/instances/:id (dynamic partial update supporting qty overrides). SQL: delivery_instances_overrides.sql adds breakfast_override/lunch_override/snack_override/supper_override nullable INTEGER columns (run in Railway ✅). Files: MealOrdersPage.jsx, deliveryPlansController.js, routes/deliveryPlans.js | ✅ |
| 162 | Per-meal arrival times on delivery schedules (2026-08-05) — replaced single "Arrival Time" field in PlanModal + BulkWizardModal with a 3-column table: Meal / Count / Arrival Time per row. Each meal type (Breakfast, Lunch, Snack, Supper) gets its own time. PlanCard updated to show per-meal times inline (B:25 · 8:30 AM). Backend: bulkCreatePlans now accepts breakfast_time/lunch_time/snack_time/supper_time; createPlan and updatePlan already accepted them. COALESCE(meal_time, arrival_time) in getTodayDeliveries keeps backward compat for old plans. SQL: delivery_plans_meal_times.sql adds 4 TIME columns to delivery_plans (run in Railway). Files: MealOrdersPage.jsx, deliveryPlansController.js | ✅ |
| 160 | Deliveries UX Consolidation (2026-08-05) — merged "Deliveries" + "Delivery Plans" into one nav item with two tabs. MealOrdersPage.jsx fully rewritten: tab bar "Scheduled Routes" | "One-Time Deliveries"; "Add Delivery" modal now starts with "How often?" step 0 — One time → 2-step one-time flow, Recurring schedule → switches to Scheduled Routes tab + opens PlanModal; PlanCard, PlanModal, BulkWizardModal all moved into MealOrdersPage.jsx; "Delivery Plans" nav item removed from SponsorDashboard.jsx NAV_ITEMS (route kept at /delivery-plans for deep link compat). Files: src/pages/sponsor/MealOrdersPage.jsx, src/pages/sponsor/SponsorDashboard.jsx | ✅ |
| 164 | Menu file import — AI extraction from Excel/Word/PDF/KidKare/Minute Menu: "Import Menu" button in Menu Builder header; ImportMenuModal (upload → extracting → review → done); backend POST /menus/import/extract uses mammoth (DOCX), xlsx (Excel), pdf-parse (PDF); Claude Haiku extracts structured items [{day_of_week, meal_type, food_item, component, is_whole_grain}]; review step shows items grouped by day+meal with checkboxes + inline editing; imports via existing POST /menus/:id/items; ensureMenu() creates week automatically if needed; mammoth + xlsx added to backend package.json | ✅ |
| 163 | Smart Production Records — Phase 1 (2026-08-06): SmartProductionForm replaces RecordForm; GET /production-records/prefill called on every date+meal change; "Menu Imported — [Name]" green chip + "X Children Enrolled" blue chip banners when data available; food items auto-populated from menu (food_item mapped to food_name); "No menu for this week" amber warning with "Build menu →" link; existing-record duplicate warning; Planned Servings pre-fills from enrollment count; compliance warning ⚠ when planned < enrolled; Print Kitchen Sheet opens printable window; footer: Save Draft + Complete Meal Service; backend GET /production-records/prefill (prefillPreview) already built and wired | ✅ |
| 165 | Menu Cycles (2026-08-06) — reusable rotating menu library: sponsors build cycles (Fall Cycle = 4 weeks, Winter Cycle = 6 weeks), assign existing menus to each week slot, then apply cycles to a date range on the real calendar. The system automatically calculates which rotation week covers any given date. SQL: menu_cycles.sql (3 tables: menu_cycles, cycle_weeks, cycle_schedules); backend controller: menuCyclesController.js (listCycles/createCycle/updateCycle/deleteCycle, assignWeekMenu, listSchedules/applySchedule/removeSchedule, resolveMenuForDate, _resolveMenu helper); routes/menuCycles.js; mounted at /menu-cycles in routes/index.js. Frontend: MenuCyclesPage.jsx (cycle library cards with progress bars + active badge, inline week assignment picker with menu search, Apply to Calendar modal with rotation preview, active schedule rows with remove button, empty-state 3-step explainer, USDA 3-year retention note); "Menu Cycles" nav item added to Sponsor sidebar Operations section with Repeat icon. Cycle-aware Production Records: prefillPreview now calls _resolveMenu first; if active cycle covers the date, shows "Fall Cycle · Week 2" green badge instead of raw menu name. SQL: run menu_cycles.sql in Railway before deploying. Files: src/pages/menus/MenuCyclesPage.jsx, SponsorDashboard.jsx (import + nav + route), programlink-backend/controllers/menuCyclesController.js, programlink-backend/routes/menuCycles.js, programlink-backend/routes/index.js, productionRecordsController.js (_resolveMenu integration + cycle_info in response) | ✅ |
| 159 | Production Records polish (2026-08-03) — (1) Date parsing fix: Postgres returns full ISO timestamp; sliced to 10 chars before passing to Date constructor — fixed "Invalid Date" in history; (2) Inline edit: pencil icon per record opens edit panel with date picker, meal type dropdown, food items list (add/remove), planned/actual/notes, Save Changes; (3) Food items save fix: upsertRecord returns data directly not data.record — was data.record?.id → data.id; (4) Food names shown in collapsed history row via food_items_summary subquery in listRecords; (5) Previous Record sidebar: 2-column layout (form left, sidebar right); auto-fetches most recent prior record for the currently selected meal type — switches when user changes meal dropdown; (6) Auto-fill from Menu button → preview modal with item checkboxes (all pre-checked), Planned Count field, Done to apply; (7) Copy Entire Meal from sidebar fills form items; (8) Copy Yesterday: bulk copies all meal records from prior day as today's draft records (iterates yesterdayRecords, fetches full items per record, POSTs new records + items); (9) Redesigned action bar: Mark Complete checkbox (label changes to "✓ Ready to Complete" when checked), Save Draft button (always draft), Complete Record button (always complete, turns green when checkbox checked). Files: SponsorProductionRecordsPage.jsx, productionRecordsController.js (food_items_summary subquery + date/meal_type in updateRecord) | ✅ |

---

## Alexia Thex — National CACFP Association (KEY CONTACT) 🌟

**Who:** Alexia Thex, President, National CACFP Association (alexia@cacfp.org)
**Phone:** 512-987-1459
**Location:** Round Rock, TX (Austin area)
**Network:** 165,000 CACFP stakeholders
**Website:** cacfp.org

### First Call — Monday, July 21, 2026 (~20 minutes)
- Hashi told her he was nervous — she was warm and put him at ease immediately
- She spent the first few minutes explaining NCA and what they do
- Hashi explained why he built CACFPLink — she liked the concept
- She asked question after question (this helped Hashi relax)
- Hashi asked what challenges sponsors face with other software — she gave real answers (see below)
- Hashi told her this attention is new to him — she appreciated his honesty
- She said she loves the concept and he should work harder to make the software more usable
- She asked where he sees CACFPLink in the future — Hashi said: "I'm not worried about the future. My next step is to get 1 active user." She respected that answer.
- She told him to keep in touch and don't be afraid to ask her anything
- She hopes the next time they talk CACFPLink will be a finished product
- She joked that the first person talking to Hashi about CACFPLink and hearing his voice is the president of the national association
- **Open door: stay in touch, she is rooting for CACFPLink**

### What Alexia Said Sponsors Struggle With (Direct From The Call)
These came up even after she saw the demo — treat them as confirmed real gaps:

| Pain Point | What Sponsors Are Really Saying | Opportunity for CACFPLink |
|---|---|---|
| List of kids | Child rosters are difficult to manage and verify | Build a stronger child roster with enrollment status, age groups, and quick lookup |
| Monitors / inspections | Preparing for reviews is stressful | Inspection dashboard with findings, corrective actions, and due dates |
| Compliance | They don't know what's missing until it's too late | Keep expanding proactive warnings and compliance center |
| To-do's | Important tasks fall through the cracks | Organization-wide task system with assignments and reminders |
| Real-time updates | Staff don't know what changed | Live notifications, activity feed, and status updates |
| End-of-month claims | Month-end becomes a scramble | Claims dashboard with progress, missing info, and readiness indicators |
| Technical problems / reliability | Software goes down right when sponsors need it most (end of month) | Make reliability a selling point — monitor uptime, market stability |
| Meal maintenance | Menus and meal patterns are hard to maintain | Improve menu management and meal pattern validation |
| Buyer's Guide | Sponsors need trusted resources | Get CACFPLink listed in NCA Buyer's Guide when product is more complete |

**Key insight:** She saw the demo AND still flagged these. They are real gaps, not already-solved problems.

### State Rule Book — Key Selling Point for Alexia's Follow-Up 🌟

**The insight:** State association directors spend half their time answering the same compliance questions from confused directors. If CACFPLink becomes the place where sponsors get those answers themselves, associations stop fielding those calls. That's a product associations actively recommend to their members.

**What to build (Task #143):**
- Dedicated sidebar page: "State Resources" — pulled out of the Compliance Assistant panel (currently buried inside Menu Builder)
- Sponsor sees their state automatically (already set on account)
- Sections: Rates / Deadlines / Required Forms / State Tips / State Agency Contact / Plain-English Rule Summary
- Eventually: public-facing version non-sponsors can browse before signing up

**What already exists:**
- 50 state JSON configs with reimbursement rates
- Texas has full data (TDA agency, SquareMeals portal, deadlines, required forms, tips)
- Compliance Assistant State Resources tab (Task #133) — needs to become its own page

**Demo pitch for Alexia:** Pick Texas → see TDA rates, SquareMeals deadline, required forms list, plain-English meal pattern rules — all in one place. Show her this in the follow-up call.

**Why this wins with NCA:**
- Reduces the compliance Q&A burden on state associations
- Makes CACFPLink the authoritative plain-English reference for state CACFP rules
- Strong case for NCA Buyer's Guide listing and newsletter feature

### Follow-Up Strategy
- Don't reach out every week — only when something meaningful happens
- Meaningful moments: new sponsor signed up, major feature shipped, milestone hit
- **Next meaningful moment: State Rule Book page is live → reach out to Alexia with a demo**
- Future ask (when product is more complete): NCA Buyer's Guide listing + newsletter feature
- Possible 2027 opportunity: NCA annual conference exhibitor/workshop slot

---

## Outreach

Iowa/Ohio: 5 personalized emails drafted and sent (stored in outreach doc, Task #14).

California outreach (2026-07-15): 10 sponsor emails drafted and sent:
1. Community Bridges — CACFPinfo@cbridges.org (Santa Cruz/Monterey)
2. Wu Yee Children's Services — randr@wuyee.org (San Francisco)
3. Valley Oak Children's Services — info@valleyoakchildren.org (Chico)
4. Solano Family & Children's Services — info@solanofamily.org (Fairfield)
5. Community Child Care Council of Sonoma County (4Cs) — info@sonoma4cs.org
6. Central Valley Children's Services Network — info@cvcsn.org (Fresno)
7. Chicano Federation of San Diego County — info@chicanofed.org
8. Changing Tides Family Services — info@changingtidesfs.org (Eureka)
9. Felton Institute — info@felton.org (San Francisco)
10. Del Norte Child Care Council — carissa@dnccc.com (Crescent City)

All sourced from the official CDSS CACFP Day Care Home Sponsors directory.

Virginia + Colorado outreach (2026-07-23): 7 sponsor emails drafted — saved to Desktop/outputs/outreach-va-co-july-2026.md:
1. ChildSavers (Richmond, VA) — CACFP@childsavers.org — Hali Riley — covers Richmond + central/southern VA
2. Child Care Resources, Inc. (Richmond, VA) — Support@ccresourcesinc.org — Donald Reese Goff — covers nearly all of Virginia
3. The Planning Council (Norfolk, VA) — llyons@theplanningcouncil.org — Lisa Lyons — Hampton Roads/Norfolk region
4. Kids' Nutrition Company (Lakewood, CO) — kidsnutritionco@kncinc.org — Deirdre Byerly — Denver metro + front range
5. Southwest Food Program, Inc. (Colorado Springs, CO) — southwestcacfp@gmail.com — Carrie Dyster — covers most of Colorado
6. Kidcare Nutrition Sponsor (Greeley, CO) — kidcarenutrition@yahoo.com — Laura McCabe — northern Colorado + Denver metro
7. Colorado Food Cluster (Denver metro) — kristen.collins@coloradofoodcluster.com — Kristen Collins — Denver area + delivers to home providers

All sourced from official Virginia CACFP Sponsors Association directory and Colorado CDPHE FCCH Sponsor Contact List.

---

## Compliance Assistant (Tasks #131–#132) ✅ LIVE

### What it is
A built-in CACFP guidance panel inside the Menu Builder. Replaced the AI Generate Weekly Menu button (removed — costs money, unreliable). The panel is CACFPLink's differentiator: no other platform has an inline compliance reference that knows what you're currently editing.

### Files
- `src/pages/menus/MenuBuilderPage.jsx` — all logic lives here (no backend changes needed)

### Architecture
- `showHelp` state — toggles the panel open/closed
- `helpContext` state — set to the current meal key (`'breakfast'`, `'lunch'`, `'snack'`, `'supper'`, `'infant'`) whenever `openCell()` is called — panel auto-expands that meal's section
- `ComplianceAssistantPanel({ open, onClose, contextMeal, items, onOpenCell })` — pure UI component, receives items + openCell callback

### Constants added to MenuBuilderPage.jsx
```js
NON_CREDITABLE   // 8 foods that don't count (condiments, fruit snacks, etc.)
SEVERITY         // { critical, warning, info } → { dot, bg, border, text, fixText, label }
MEAL_GUIDE       // per meal: emoji, label, required components array, tip
COMMON_ERRORS    // 9 entries: { severity, icon, text, fix, citation }
QA_DB            // 15 natural-language Q&A entries: { q: [keywords], a, severity, citation }
```

### Live issue detection
Inside the panel, `liveIssues` is computed from the current `items` prop by running `validateMealClient()` + `getDayWGROk()` across all days and meals. Each issue is a clickable button that calls `onOpenCell(dayNum, mealKey)` to open the exact cell.

### Severity system
- 🟥 Critical — missing required component, wrong milk type
- 🟨 Warning — WGR not met, expiring soon
- 🟦 Info — substitution guidance, clarifications

### Smart search
Search input tries QA_DB keyword match first → then CACFP_FOODS food library → then NON_CREDITABLE. Returns answer + citation if QA match, food card if food match, "not creditable" warning if non-creditable match.

### Next: Task #133 — State Resources tab
Split panel into two tabs: **USDA Compliance** (current content, universal) + **State Resources** (state-specific: agency name, deadlines, portal link, required forms). Texas first (Charles is TX). Config data only — no engine changes.

---

## State Engine Architecture

### The key insight
CACFP meal pattern rules are **federal** — identical in all 50 states. Only the following change per state:
- Reimbursement rates (tier 1/2 breakfast/lunch/snack/supper)
- Claim deadlines (e.g., Texas: 60 days after month end via TDA / SquareMeals)
- State agency name + portal URL
- Required forms/exports

### What's already built
- 50 state config JSON files in `programlink-backend/programlink-backend/services/stateConfigs/` (AL.json through WY.json)
- Each currently has: `name`, `rates` (tier1/tier2 × meal types), `agency` stub
- Universal engine in `claimsEngine.js` — reads rates from config, applies to any state

### What's deferred
- Deadlines, portal links, required forms per state (just data, no code change)
- State-specific export/PDF format adapters (defer until a real sponsor needs it — Charles/Texas first)
- State-specific validation rules (almost none exist — USDA is the authority)

### Build order for state engine
1. ✅ Done — universal engine + 50 rate configs
2. ✅ Done — state picker in registration + settings
3. ✅ Done — state PDF export (generic format, branded per state)
4. ⏳ Next — add deadlines + portal links to TX.json first, surface in State Resources tab (Task #133)
5. ⏳ Later — TX-specific claim export format (Task #138), only when Charles needs it

### Priority: Texas first
Charles (cacfpsolutions.com) is from Texas. Texas CACFP is administered by Texas Department of Agriculture (TDA). Claims submitted via SquareMeals portal (squaremeals.org). TX-UNPS is the legacy claim system.

No Ohio sponsor exists yet — do not prioritize Ohio.

---

## Facebook CACFP Group Feedback (Backlog — build after real sponsor confirms)

These pain points came from a real Facebook CACFP group thread. Treat as confirmed real gaps — but **wait for sponsor feedback before building**.

| Pain Point | What They Said | Task |
|---|---|---|
| Production records | "We have to log every meal we produce separately" | #134 — digital meal production logs, auto-fill from menus |
| Annual renewals | "Every year we redo all the same paperwork" | #135 — renewal wizard, one-click re-use of previous year's data |
| Staff training tracking | "We track certificate expiry in a spreadsheet" | #136 — training log + expiry reminders |
| Forms pre-fill | "I fill in the same info on 6 different forms" | #137 — auto-generate/pre-fill state forms from existing data |

**Rule:** Don't build these speculatively. Build when a sponsor or Alexia confirms it's blocking them.

---

## NCA Research Framework (Alexia's lens for future conversations)

When talking to Alexia or any NCA contact, look for friction in these 4 areas:

| Category | What to listen for |
|---|---|
| Technical Compliance | Meal pattern errors, WGR tracking, milk age rules, documentation gaps |
| Operations | Production records, staff training, site inspections, annual renewals |
| Training | New staff onboarding, CACFP certification, recurring compliance training |
| Advocacy | State policy changes, USDA rule updates, audit preparation |

For each pain point: ask "Is this something sponsors handle manually today?" If yes → it's a feature.

---

## Permanent Build Rules (set by Hashi — never override)

- **Build tasks sequentially. No need to ask what's next — just start the next task.**
- **No outreach emails on Friday, Saturday, Sunday.**
- **Don't chase Charles or Deborah** — they'll reach out when ready. Only contact them if they message first.
- **Ship improvements in days, not months.** Don't gold-plate. Build, push, move on.
- **Build for Texas first** — Charles is the first real sponsor. Ohio is not a priority (no sponsor there yet).

---

## Env Vars

**Vercel (frontend):**
- `VITE_API_URL` — Railway backend URL

**Railway (backend):**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET`
- `RESEND_API_KEY` — for transactional email (Resend)
- `AWS_*` or storage keys — for document uploads
- `ANTHROPIC_API_KEY` — for enrollment roster import (Task #118 — AI extraction from PDF/image). Key IS set in Railway with a real value. AI Generate menu was intentionally removed (Task #130) — costs money per call. The key only powers the PDF/image roster scan in `/children/import/extract`.

---

## Notes

- Google Maps Places autocomplete was built and wired but **skipped** (costs money per autocomplete call). The `loadGoogleMaps()` function and `useRef`/`useEffect` are in StepBasicInfo but the API key env var (`VITE_GOOGLE_MAPS_API_KEY`) is not set, so it gracefully falls back to plain text input.
- `createNotification` in `notificationService.js` accepts single object OR array — already handles both.
- 5-tier compliance scoring is computed **purely in JS** (no schema changes needed): overdue → missing → expiring → pending → compliant, based on existing DB fields.
