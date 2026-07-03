#!/usr/bin/env node
/**
 * CACFPLink Stress Test Seeder
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a fully realistic large-sponsor dataset directly in Railway's DB:
 *
 *   • 1 sponsor org + 1 sponsor user + 3 coordinators
 *   • 100 kitchens + 200 sites + 2 delivery providers  (303 orgs total)
 *   • 2 users per kitchen/site  (~600 org users)
 *   • 1 approved application per org + scattered pending/rejected
 *   • 1,500+ documents spread across every status
 *   • 4,000+ meal count records across 6 months
 *   • 10 delivery routes with realistic stops JSON
 *   • 30 message threads with replies
 *   • Coordinator assignments (each coordinator owns ~100 orgs)
 *
 * Usage:
 *   cd ~/Desktop/outputs/programlink-backend
 *   DATABASE_URL="postgresql://..." node tools/stress-test/seed.js
 *
 * Get DATABASE_URL: Railway dashboard → project → PostgreSQL → Connect tab
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { Pool } = require('pg');
const crypto   = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('\n❌  Set DATABASE_URL env var first.');
  console.error('    DATABASE_URL="postgresql://..." node tools/stress-test/seed.js\n');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ── Config ────────────────────────────────────────────────────────────────────
const TAG          = `ST_${Date.now()}`;   // stored in org.region for cleanup
const N_KITCHENS   = 100;
const N_SITES      = 200;
const MEAL_MONTHS  = 6;

// bcryptjs hash of "StressTest123!" (10 rounds)
const PW_HASH = '$2a$10$1GqX7PQhf4OHGAxy1wy0xONak0GqRJYxt1swP6XpKG4crRPnu6.w2';

// ── Realistic name pools ──────────────────────────────────────────────────────
const KITCHEN_ADJECTIVES = ['Central','Metro','Valley','Lakeside','Riverside','Sunrise','Westside','Eastside','Northside','Southside','Downtown','Community','Harvest','Heritage','Summit'];
const KITCHEN_NOUNS      = ['Kitchen','Prep Kitchen','Meals Hub','Food Center','Catering Kitchen','Culinary Hub','Meal Prep'];
const SITE_ADJECTIVES    = ['Happy','Bright','Little','Sunny','Golden','Rainbow','Caring','Creative','Growing','Playful','Joyful','Tiny','Loving','Wonder','Shining'];
const SITE_NOUNS         = ['Hearts','Stars','Minds','Futures','Learners','Explorers','Sprouts','Dreams','Beginnings','Steps','Wonders','Kids','Angels','Cubs','Champions'];
const SITE_TYPES         = ['Childcare','Learning Center','Academy','Day School','Child Development Center','Early Learning','Preschool','Child Care Center'];
const CITIES             = ['Richmond','Norfolk','Virginia Beach','Alexandria','Arlington','Roanoke','Hampton','Newport News','Chesapeake','Portsmouth','Denver','Aurora','Lakewood','Fort Collins','Pueblo','Boulder','Colorado Springs','Arvada'];

function uuid()           { return crypto.randomUUID(); }
function randEl(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min,max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(daysAgo, daysAhead = 0) {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysAgo) + randInt(0, daysAhead));
  return d.toISOString().split('T')[0];
}

const KITCHEN_DOC_TYPES = ['w9','food_permit','insurance','menu_plan','health_cert'];
const SITE_DOC_TYPES    = ['enrollment','license','insurance','health_cert'];
const DOC_STATUSES      = [
  'valid','valid','valid','valid',          // 4x weighted
  'expiring_soon','expiring_soon',          // 2x
  'expired','pending_review','rejected',   // 1x each
  'requested',
];
const APP_STATUSES = ['approved','approved','approved','approved','approved','submitted','under_review','rejected'];

// ── Batch insert helper ───────────────────────────────────────────────────────
async function batchInsert(client, sql, rows, chunkSize = 200) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    if (chunk.length) await client.query(sql + chunk.join(','));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    console.log(`\n🚀  CACFPLink Stress Test Seeder`);
    console.log(`    Tag: ${TAG}\n`);
    console.time('total');

    // ── 1. Sponsor org ────────────────────────────────────────────────────────
    const sponsorId = uuid();
    await client.query(
      `INSERT INTO organizations (id, name, type, status, region, address)
       VALUES ($1, $2, 'sponsor', 'active', $3, $4)`,
      [sponsorId, `[ST] Great Lakes CACFP Sponsor`, TAG, '1 Program Plaza, Richmond, VA 23219']
    );

    // ── 2. Sponsor user (login: stress@test.com / StressTest123!) ─────────────
    const sponsorUserId = uuid();
    await client.query(
      `INSERT INTO users (id, name, email, password_hash, role, org_id, is_active)
       VALUES ($1, 'Stress Test Admin', 'stress@test.com', $2, 'sponsor', $3, TRUE)
       ON CONFLICT (email) DO UPDATE
         SET org_id = $3, is_active = TRUE, password_hash = $2`,
      [sponsorUserId, PW_HASH, sponsorId]
    );
    console.log(`✅  Sponsor org + user  →  stress@test.com / StressTest123!`);

    // ── 3. Coordinators (3, each will be assigned ~100 orgs) ─────────────────
    const coordIds = [];
    for (let i = 0; i < 3; i++) {
      const cid = uuid();
      coordIds.push(cid);
      const city = randEl(CITIES);
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, org_id, is_active)
         VALUES ($1, $2, $3, $4, 'coordinator', $5, TRUE)
         ON CONFLICT (email) DO NOTHING`,
        [cid, `Coordinator ${i + 1}`, `stress_coord_${i}@test.com`, PW_HASH, sponsorId]
      );
    }
    console.log(`✅  3 coordinators`);

    // ── 4. Delivery provider orgs ─────────────────────────────────────────────
    const deliveryOrgIds = [];
    for (let i = 0; i < 2; i++) {
      const did = uuid();
      deliveryOrgIds.push(did);
      await client.query(
        `INSERT INTO organizations (id, name, type, status, sponsor_id, region)
         VALUES ($1, $2, 'delivery', 'active', $3, $4)`,
        [did, `[ST] ${randEl(CITIES)} Delivery Co. ${i+1}`, sponsorId, TAG]
      );
    }

    // Delivery users
    for (const did of deliveryOrgIds) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, org_id, is_active)
         VALUES ($1, $2, $3, $4, 'delivery', $5, TRUE)
         ON CONFLICT (email) DO NOTHING`,
        [uuid(), 'Delivery Driver', `stress_delivery_${did.slice(0,6)}@test.com`, PW_HASH, did]
      );
    }
    console.log(`✅  2 delivery provider orgs`);

    // ── 5. Kitchens ───────────────────────────────────────────────────────────
    const kitchenIds = [];
    const kitchenRows = [];
    for (let i = 0; i < N_KITCHENS; i++) {
      const id   = uuid();
      kitchenIds.push(id);
      const city = randEl(CITIES);
      const name = `[ST] ${randEl(KITCHEN_ADJECTIVES)} ${randEl(KITCHEN_NOUNS)} — ${city}`;
      kitchenRows.push(`('${id}','${name.replace(/'/g,"''")}','kitchen','active','${sponsorId}','${TAG}','${city}, VA','555-${String(randInt(1000,9999))}')`);
    }
    await batchInsert(client,
      `INSERT INTO organizations (id, name, type, status, sponsor_id, region, address, phone) VALUES `,
      kitchenRows
    );
    console.log(`✅  ${N_KITCHENS} kitchens`);

    // ── 6. Sites ──────────────────────────────────────────────────────────────
    const siteIds = [];
    const siteRows = [];
    for (let i = 0; i < N_SITES; i++) {
      const id   = uuid();
      siteIds.push(id);
      const city = randEl(CITIES);
      const name = `[ST] ${randEl(SITE_ADJECTIVES)} ${randEl(SITE_NOUNS)} ${randEl(SITE_TYPES)}`;
      siteRows.push(`('${id}','${name.replace(/'/g,"''")}','site','active','${sponsorId}','${TAG}','${randInt(100,9999)} ${randEl(CITIES)} St, ${city}','555-${String(randInt(1000,9999))}')`);
    }
    await batchInsert(client,
      `INSERT INTO organizations (id, name, type, status, sponsor_id, region, address, phone) VALUES `,
      siteRows
    );
    console.log(`✅  ${N_SITES} sites`);

    // ── 7. Org users (2 per kitchen + 2 per site) ────────────────────────────
    const userRows = [];
    let   userIdx  = 0;
    for (const [orgId, role] of [...kitchenIds.map(id => [id,'kitchen']), ...siteIds.map(id => [id,'site'])]) {
      for (let u = 0; u < 2; u++) {
        const uid = uuid();
        const n   = `${role === 'kitchen' ? 'Kitchen' : 'Site'} User ${userIdx}`;
        const e   = `stress_${userIdx}@test.com`;
        userRows.push(`('${uid}','${n}','${e}','${PW_HASH}','${role}','${orgId}',TRUE)`);
        userIdx++;
      }
    }
    await batchInsert(client,
      `INSERT INTO users (id, name, email, password_hash, role, org_id, is_active) VALUES `,
      userRows, 150
    );
    console.log(`✅  ${userRows.length} org users`);

    // ── 8. Applications ───────────────────────────────────────────────────────
    const allOrgIds  = [...kitchenIds, ...siteIds];
    const appRows    = [];
    for (const orgId of allOrgIds) {
      const status  = randEl(APP_STATUSES);
      const subDays = randInt(30, 180);
      const subAt   = `NOW() - INTERVAL '${subDays} days'`;
      const revAt   = ['approved','rejected'].includes(status) ? `NOW() - INTERVAL '${randInt(1,subDays-1)} days'` : 'NULL';
      const notes   = status === 'rejected' ? `'Missing required documentation.'` : 'NULL';
      appRows.push(
        `('${uuid()}','${orgId}','${sponsorId}','${status}',${subAt},${revAt},${notes})`
      );
    }
    await batchInsert(client,
      `INSERT INTO applications (id, org_id, sponsor_id, status, submitted_at, reviewed_at, notes) VALUES `,
      appRows
    );
    console.log(`✅  ${appRows.length} applications (mixed statuses)`);

    // ── 9. Documents ──────────────────────────────────────────────────────────
    const docRows = [];
    for (const orgId of allOrgIds) {
      const isKitchen = kitchenIds.includes(orgId);
      const types     = isKitchen ? KITCHEN_DOC_TYPES : SITE_DOC_TYPES;
      for (const docType of types) {
        const status   = randEl(DOC_STATUSES);
        const upDays   = randInt(1, 120);
        const expDays  = status === 'expired'        ? -randInt(1, 60)
                       : status === 'expiring_soon'  ? randInt(1, 28)
                       : status === 'requested'      ? 30
                       : randInt(60, 400);
        const upAt     = `NOW() - INTERVAL '${upDays} days'`;
        const expAt    = status === 'requested' ? 'NULL'
                       : `NOW() + INTERVAL '${expDays} days'`;
        const label    = docType.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
        const fileUrl  = `https://storage.cacfplink.com/stress-test/${orgId}/${docType}.pdf`;
        const rejNote  = status === 'rejected' ? `'Document is illegible or outdated.'` : 'NULL';
        docRows.push(
          `('${uuid()}','${orgId}','${docType}','${label}','${fileUrl}',${upAt},${expAt},'${status}',${rejNote},1)`
        );
      }
    }
    await batchInsert(client,
      `INSERT INTO documents (id, org_id, doc_type, label, file_url, uploaded_at, expires_at, status, rejection_note, version) VALUES `,
      docRows
    );
    console.log(`✅  ${docRows.length} documents (all statuses)`);

    // ── 10. Meal counts (6 months, ~7 days/month per site) ────────────────────
    const mcRows = [];
    const today  = new Date();
    for (const siteId of siteIds) {
      const kitchenId = randEl(kitchenIds);
      for (let m = 0; m < MEAL_MONTHS; m++) {
        const daysThisMonth = randInt(5, 10);
        const usedDates = new Set();
        for (let d = 0; d < daysThisMonth; d++) {
          // Pick a unique date in this month window
          let attempts = 0;
          let dateStr;
          do {
            const dt = new Date(today);
            dt.setMonth(dt.getMonth() - m);
            dt.setDate(randInt(1, 28));
            dateStr = dt.toISOString().split('T')[0];
            attempts++;
          } while (usedDates.has(dateStr) && attempts < 10);
          if (usedDates.has(dateStr)) continue;
          usedDates.add(dateStr);

          const submitted  = randInt(30, 160);
          const verified   = Math.random() > 0.25 ? randInt(Math.max(0, submitted - 8), submitted) : 'NULL';
          mcRows.push(
            `('${uuid()}','${siteId}','${kitchenId}','${dateStr}',${submitted},${verified})`
          );
        }
      }
    }
    await batchInsert(client,
      `INSERT INTO meal_counts (id, site_id, kitchen_id, date, count_submitted, count_verified) VALUES `,
      mcRows, 300
    );
    console.log(`✅  ${mcRows.length} meal count records`);

    // ── 11. Delivery routes (10 routes with stop arrays) ─────────────────────
    const routeRows = [];
    const ROUTE_STATUSES = ['scheduled','scheduled','in_progress','completed','completed','completed'];
    for (let r = 0; r < 10; r++) {
      const rid        = uuid();
      const delivOrgId = randEl(deliveryOrgIds);
      const status     = randEl(ROUTE_STATUSES);
      const daysOff    = status === 'completed' ? -randInt(1,14) : 0;
      const routeDate  = new Date(today);
      routeDate.setDate(routeDate.getDate() + daysOff);
      const dateStr    = routeDate.toISOString().split('T')[0];

      // 5–10 site stops per route
      const stopCount = randInt(5, 10);
      const stops = Array.from({ length: stopCount }, (_, i) => ({
        order:         i + 1,
        site_id:       siteIds[randInt(0, siteIds.length - 1)],
        expected_time: `${String(8 + Math.floor(i * 30 / 60)).padStart(2,'0')}:${String((i * 30) % 60).padStart(2,'0')}`,
        status:        status === 'completed' ? 'delivered'
                     : status === 'in_progress' && i < 3 ? 'delivered' : 'pending',
      }));

      routeRows.push(
        `('${rid}','${delivOrgId}','${dateStr}','${JSON.stringify(stops).replace(/'/g,"''")}','${status}')`
      );
    }
    await client.query(
      `INSERT INTO routes (id, delivery_provider_id, date, stops, status) VALUES ${routeRows.join(',')}`
    );
    console.log(`✅  10 delivery routes`);

    // ── 12. Message threads (30 threads, sponsor → sites/kitchens) ───────────
    const threadRows = [];
    const msgRows    = [];
    const recipRows  = [];

    const SUBJECTS = [
      'Monthly Compliance Reminder','Document Expiry Notice','Menu Update Required',
      'New CACFP Guidelines — Please Review','Meal Count Submission Reminder',
      'Important: Upcoming Audit','Training Schedule — Q3','Welcome to CACFPLink!',
      'Kitchen Inspection Reminder','Action Required: Missing Documents',
    ];

    for (let t = 0; t < 30; t++) {
      const tid     = uuid();
      const subject = SUBJECTS[t % SUBJECTS.length];
      const isBcast = t < 5; // first 5 are broadcasts
      threadRows.push(`('${tid}','${subject}','${sponsorUserId}')`);

      // 1–3 messages per thread
      const msgCount = randInt(1, 3);
      for (let m = 0; m < msgCount; m++) {
        const mid    = uuid();
        const body   = m === 0
          ? `Please review your pending compliance items before the end of the month.`
          : `Thank you for your response. We'll follow up shortly.`;
        msgRows.push(`('${mid}','${tid}','${sponsorUserId}','${body}',${isBcast && m === 0 ? 'TRUE' : 'FALSE'})`);

        // Recipients: 5–10 random site/kitchen users (by adding them to message_recipients)
        const recipientOrgIds = siteIds.slice(t * 5 % siteIds.length, t * 5 % siteIds.length + 5);
        // We'll use the org IDs as placeholders — get 1 user per org
        for (const oid of recipientOrgIds) {
          const idx  = siteIds.indexOf(oid) * 2; // first user of each org
          if (idx >= 0 && idx < userRows.length) {
            // Parse user id from the userRows value string
            const uid = userRows[idx].slice(2, 38);
            recipRows.push(`('${mid}','${uid}')`);
          }
        }
      }
    }

    await client.query(
      `INSERT INTO message_threads (id, subject, created_by) VALUES ${threadRows.join(',')}`
    );
    await batchInsert(client,
      `INSERT INTO messages (id, thread_id, sender_id, body, is_broadcast) VALUES `,
      msgRows
    );
    if (recipRows.length) {
      await batchInsert(client,
        `INSERT INTO message_recipients (message_id, recipient_id) VALUES `,
        recipRows
      );
    }
    console.log(`✅  30 message threads`);

    // ── 13. Coordinator assignments ───────────────────────────────────────────
    const caRows  = [];
    const allOrgs = [...kitchenIds, ...siteIds];
    for (let i = 0; i < allOrgs.length; i++) {
      const coordId = coordIds[i % coordIds.length]; // round-robin distribute
      caRows.push(`('${uuid()}','${coordId}','${allOrgs[i]}')`);
    }
    await batchInsert(client,
      `INSERT INTO coordinator_assignments (id, coordinator_id, org_id) VALUES `,
      caRows, 300
    );
    console.log(`✅  ${caRows.length} coordinator assignments`);

    // ── Summary ───────────────────────────────────────────────────────────────
    console.timeEnd('total');
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  SEED COMPLETE                                               ║
╠══════════════════════════════════════════════════════════════╣
║  Tag (save this for cleanup!):  ${TAG.padEnd(28)}║
║                                                              ║
║  Login:     stress@test.com                                  ║
║  Password:  StressTest123!                                   ║
╠══════════════════════════════════════════════════════════════╣
║  Data generated:                                             ║
║   • 303 organizations (100 kitchens, 200 sites, 2 delivery)  ║
║   • ~606 org users + 1 sponsor + 3 coordinators              ║
║   • 300 applications (mixed statuses)                        ║
║   • ${String(docRows.length).padEnd(4)} documents (all statuses)                    ║
║   • ${String(mcRows.length).padEnd(4)} meal count records                           ║
║   • 10 delivery routes                                       ║
║   • 30 message threads                                       ║
║   • 300 coordinator assignments                              ║
╠══════════════════════════════════════════════════════════════╣
║  Next step:                                                  ║
║  BACKEND_URL="https://your-app.railway.app" \\               ║
║    node tools/stress-test/load-test.js                       ║
╠══════════════════════════════════════════════════════════════╣
║  To clean up:                                                ║
║  DATABASE_URL="..." TAG=${TAG} \\           ║
║    node tools/stress-test/cleanup.js                         ║
╚══════════════════════════════════════════════════════════════╝
`);

  } catch (err) {
    console.error('\n❌  Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
