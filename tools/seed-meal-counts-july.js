'use strict';

/**
 * Seed 30 days of meal counts for July 2026
 * Usage: DATABASE_URL="postgresql://..." node tools/seed-meal-counts-july.js
 *
 * Looks up all sites belonging to Hashi's sponsor org and inserts realistic
 * daily meal counts for July 1–30 2026.
 */

const { Pool } = require('pg');

const SPONSOR_EMAIL = 'hashiguhad10@gmail.com';

// Realistic daily ranges per meal type
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function countsForDay(dayOfWeek) {
  // No meal counts on Sunday (dayOfWeek === 0) — most CACFP sites closed
  if (dayOfWeek === 0) return null;
  return {
    breakfast: rand(18, 35),
    lunch:     rand(28, 55),
    snack:     rand(15, 30),
    supper:    rand(0, 5),   // supper less common
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL env var first.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  // Get sponsor's org
  const { rows: [user] } = await pool.query(
    `SELECT u.id, u.organization_id FROM users u WHERE u.email = $1 LIMIT 1`,
    [SPONSOR_EMAIL]
  );
  if (!user) { console.error('Sponsor not found'); process.exit(1); }

  const sponsorOrgId = user.organization_id;
  console.log(`Sponsor org: ${sponsorOrgId}`);

  // Get all sites belonging to this sponsor
  const { rows: sites } = await pool.query(
    `SELECT id, name FROM organizations WHERE sponsor_id = $1 AND type = 'site'`,
    [sponsorOrgId]
  );

  if (!sites.length) {
    console.log('No sites found. Trying type=site OR type=center...');
    const { rows: fallback } = await pool.query(
      `SELECT id, name FROM organizations WHERE sponsor_id = $1 AND type NOT IN ('sponsor','coordinator','kitchen')`,
      [sponsorOrgId]
    );
    sites.push(...fallback);
  }

  if (!sites.length) {
    console.error('No sites found for this sponsor.');
    process.exit(1);
  }

  console.log(`Found ${sites.length} site(s):`);
  sites.forEach(s => console.log(`  - ${s.name} (${s.id})`));

  let inserted = 0;
  let skipped  = 0;

  for (const site of sites) {
    for (let d = 1; d <= 30; d++) {
      const date = `2026-07-${String(d).padStart(2, '0')}`;
      const dow  = new Date(date).getDay();
      const counts = countsForDay(dow);

      if (!counts) { skipped++; continue; } // skip Sundays

      const total = counts.breakfast + counts.lunch + counts.snack + counts.supper;

      await pool.query(
        `INSERT INTO meal_counts
           (site_id, date, breakfast, lunch, snack, supper, count_submitted, submitted_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (site_id, date) DO NOTHING`,
        [
          site.id,
          date,
          counts.breakfast,
          counts.lunch,
          counts.snack,
          counts.supper,
          total,
          user.id,
          'Seeded July 2026',
        ]
      );
      inserted++;
    }
    console.log(`  ✓ ${site.name} — inserted counts for July`);
  }

  console.log(`\nDone. ${inserted} rows inserted, ${skipped} Sundays skipped.`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
