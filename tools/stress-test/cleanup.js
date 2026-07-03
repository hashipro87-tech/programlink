#!/usr/bin/env node
/**
 * Removes all stress test data for a given TAG.
 * Uses the `region` column on organizations to identify test data.
 *
 * Usage:
 *   DATABASE_URL="..." TAG="ST_1234567890" node tools/stress-test/cleanup.js
 *
 *   Without TAG — lists all stress test runs found in the DB.
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const TAG          = process.env.TAG;

if (!DATABASE_URL) {
  console.error('\n❌  Set DATABASE_URL env var first.\n');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function cleanup() {
  const client = await pool.connect();
  try {
    if (!TAG) {
      const { rows } = await client.query(
        `SELECT region AS tag, COUNT(*) AS orgs
         FROM organizations
         WHERE region LIKE 'ST_%'
         GROUP BY region ORDER BY region DESC`
      );
      if (!rows.length) {
        console.log('\nNo stress test runs found in DB.\n');
      } else {
        console.log('\nStress test runs:\n');
        for (const r of rows) {
          console.log(`  TAG=${r.tag}  (${r.orgs} orgs)`);
        }
        console.log('\nTo clean up:\n  DATABASE_URL="..." TAG=<tag> node tools/stress-test/cleanup.js\n');
      }
      return;
    }

    console.log(`\n🧹  Cleaning up TAG: ${TAG}\n`);

    // All org IDs for this TAG (includes sponsor + kitchens + sites + delivery orgs)
    const { rows: orgs } = await client.query(
      `SELECT id, type FROM organizations WHERE region = $1`, [TAG]
    );
    if (!orgs.length) {
      console.log('  No organizations found for this TAG. Nothing to delete.\n');
      return;
    }
    const orgIds    = orgs.map(o => o.id);
    const sponsorId = orgs.find(o => o.type === 'sponsor')?.id;
    console.log(`  Found ${orgIds.length} organizations to remove`);

    // Get all user IDs in these orgs (for cascading FK-safe deletes)
    const { rows: users } = await client.query(
      `SELECT id FROM users WHERE org_id = ANY($1) OR email LIKE 'stress%@test.com'`,
      [orgIds]
    );
    const userIds = users.map(u => u.id);

    let r;

    // Delete in FK-safe order
    r = await client.query(`DELETE FROM coordinator_assignments WHERE org_id = ANY($1)`, [orgIds]);
    console.log(`  ✓ coordinator_assignments: ${r.rowCount}`);

    r = await client.query(`DELETE FROM meal_counts WHERE site_id = ANY($1)`, [orgIds]);
    console.log(`  ✓ meal_counts: ${r.rowCount}`);

    r = await client.query(`DELETE FROM documents WHERE org_id = ANY($1)`, [orgIds]);
    console.log(`  ✓ documents: ${r.rowCount}`);

    r = await client.query(`DELETE FROM applications WHERE org_id = ANY($1) OR (sponsor_id = ANY($1))`, [orgIds]);
    console.log(`  ✓ applications: ${r.rowCount}`);

    r = await client.query(`DELETE FROM routes WHERE delivery_provider_id = ANY($1)`, [orgIds]);
    console.log(`  ✓ routes: ${r.rowCount}`);

    if (userIds.length) {
      r = await client.query(`DELETE FROM notifications WHERE user_id = ANY($1)`, [userIds]);
      console.log(`  ✓ notifications: ${r.rowCount}`);

      // message_recipients references messages, so need to be careful
      r = await client.query(
        `DELETE FROM message_recipients WHERE recipient_id = ANY($1)`,
        [userIds]
      );
      console.log(`  ✓ message_recipients: ${r.rowCount}`);
    }

    // Messages + threads created by the stress test sponsor user
    if (sponsorId) {
      const { rows: stUsers } = await client.query(
        `SELECT id FROM users WHERE org_id = $1`, [sponsorId]
      );
      if (stUsers.length) {
        const stUserIds = stUsers.map(u => u.id);
        const { rows: threads } = await client.query(
          `SELECT id FROM message_threads WHERE created_by = ANY($1)`, [stUserIds]
        );
        if (threads.length) {
          const tids = threads.map(t => t.id);
          await client.query(`DELETE FROM messages WHERE thread_id = ANY($1)`, [tids]);
          await client.query(`DELETE FROM message_threads WHERE id = ANY($1)`, [tids]);
          console.log(`  ✓ message_threads + messages: ${threads.length} threads`);
        }
      }
    }

    r = await client.query(
      `DELETE FROM users WHERE org_id = ANY($1) OR email LIKE 'stress%@test.com'`,
      [orgIds]
    );
    console.log(`  ✓ users: ${r.rowCount}`);

    r = await client.query(`DELETE FROM organizations WHERE id = ANY($1)`, [orgIds]);
    console.log(`  ✓ organizations: ${r.rowCount}`);

    console.log(`\n✅  Cleanup complete.\n`);

  } finally {
    client.release();
    await pool.end();
  }
}

cleanup().catch((err) => { console.error('Cleanup failed:', err.message); process.exit(1); });
