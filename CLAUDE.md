# CACFPLink — Project Memory

**Product:** CACFPLink (cacfplink.com) — USDA CACFP food program operations platform  
**Stack:** React/Vite SPA (Vercel) + Node.js/Express backend (Railway) + PostgreSQL (Railway)  
**Repo:** https://github.com/hashipro87-tech/programlink  
**User:** Hashi (hashipro87@gmail.com)

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

Key tables: `organizations`, `users`, `applications`, `documents`, `notifications`, `meal_counts`, `routes`, `kitchen_site_connections`, `message_threads`, `messages`

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
