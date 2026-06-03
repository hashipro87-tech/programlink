// scripts/seed.js
// Creates a full set of test accounts for local development.
// Run with: node scripts/seed.js
//
// Creates:
//   sponsor@test.com    / password123  (Sponsor admin)
//   coord@test.com      / password123  (Coordinator)
//   kitchen@test.com    / password123  (Kitchen)
//   site@test.com       / password123  (Site / Daycare)
//   delivery@test.com   / password123  / (Delivery Provider)

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱  Seeding ProgramLink test data…\n');

    await client.query('BEGIN');

    const hash = await bcrypt.hash('password123', 12);

    // ── 1. Sponsor org ────────────────────────────────────────────────────────
    const { rows: [sponsorOrg] } = await client.query(`
      INSERT INTO organizations (name, type, status, address, phone)
      VALUES ('Illinois USDA Food Program', 'sponsor', 'active', '100 State St, Chicago IL 60601', '312-555-0100')
      RETURNING id, name
    `);
    // Sponsors point to themselves
    await client.query(`UPDATE organizations SET sponsor_id = $1 WHERE id = $1`, [sponsorOrg.id]);
    console.log(`✓ Sponsor org:  ${sponsorOrg.name}  (${sponsorOrg.id})`);

    // ── 2. Sponsor user ───────────────────────────────────────────────────────
    const { rows: [sponsorUser] } = await client.query(`
      INSERT INTO users (name, email, password_hash, role, org_id)
      VALUES ('Admin User', 'sponsor@test.com', $1, 'sponsor', $2)
      RETURNING id, email
    `, [hash, sponsorOrg.id]);
    console.log(`✓ Sponsor user: ${sponsorUser.email}`);

    // ── 3. Coordinator org + user ─────────────────────────────────────────────
    const { rows: [coordOrg] } = await client.query(`
      INSERT INTO organizations (name, type, status, sponsor_id)
      VALUES ('North Region Coordinator', 'sponsor', 'active', $1)
      RETURNING id
    `, [sponsorOrg.id]);
    const { rows: [coordUser] } = await client.query(`
      INSERT INTO users (name, email, password_hash, role, org_id)
      VALUES ('Jane Coordinator', 'coord@test.com', $1, 'coordinator', $2)
      RETURNING id, email
    `, [hash, coordOrg.id]);
    console.log(`✓ Coordinator:  ${coordUser.email}`);

    // ── 4. Kitchen org + user (approved) ─────────────────────────────────────
    const { rows: [kitchenOrg] } = await client.query(`
      INSERT INTO organizations (name, type, status, address, phone, sponsor_id)
      VALUES ('Central Community Kitchen', 'kitchen', 'active', '200 Kitchen Blvd, Chicago IL 60602', '312-555-0200', $1)
      RETURNING id, name
    `, [sponsorOrg.id]);
    const { rows: [kitchenUser] } = await client.query(`
      INSERT INTO users (name, email, password_hash, role, org_id)
      VALUES ('Chef Rivera', 'kitchen@test.com', $1, 'kitchen', $2)
      RETURNING id, email
    `, [hash, kitchenOrg.id]);
    // Create an approved application for the kitchen
    await client.query(`
      INSERT INTO applications (org_id, sponsor_id, status, submitted_at, reviewed_at, reviewed_by,
                                form_data, notes)
      VALUES ($1, $2, 'approved', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days', $3,
              '{"capacity": 500, "kitchen_type": "non_profit", "meal_types": ["breakfast","lunch","dinner"]}',
              'All documents verified. Approved.')
    `, [kitchenOrg.id, sponsorOrg.id, sponsorUser.id]);
    console.log(`✓ Kitchen:      ${kitchenUser.email}  (${kitchenOrg.name})`);

    // ── 5. Site org + user ────────────────────────────────────────────────────
    const { rows: [siteOrg] } = await client.query(`
      INSERT INTO organizations (name, type, status, address, phone, sponsor_id)
      VALUES ('Sunshine Daycare Center', 'site', 'active', '300 Lincoln Ave, Chicago IL 60603', '312-555-0300', $1)
      RETURNING id, name
    `, [sponsorOrg.id]);
    const { rows: [siteUser] } = await client.query(`
      INSERT INTO users (name, email, password_hash, role, org_id)
      VALUES ('Maria Site Director', 'site@test.com', $1, 'site', $2)
      RETURNING id, email
    `, [hash, siteOrg.id]);
    // Site application (in progress)
    await client.query(`
      INSERT INTO applications (org_id, sponsor_id, status, form_data)
      VALUES ($1, $2, 'submitted',
              '{"contact_name":"Maria Site Director","contact_title":"Director","phone":"312-555-0300",
                "enrollment":45,"age_range_min":2,"age_range_max":5}')
    `, [siteOrg.id, sponsorOrg.id]);
    // Connect site to kitchen
    await client.query(`
      INSERT INTO kitchen_site_connections (kitchen_id, site_id, status, approved_by, approved_at)
      VALUES ($1, $2, 'approved', $3, NOW() - INTERVAL '3 days')
    `, [kitchenOrg.id, siteOrg.id, sponsorUser.id]);
    console.log(`✓ Site:         ${siteUser.email}  (${siteOrg.name})`);

    // ── 6. Delivery org + user ────────────────────────────────────────────────
    const { rows: [deliveryOrg] } = await client.query(`
      INSERT INTO organizations (name, type, status, address, sponsor_id)
      VALUES ('QuickDeliver LLC', 'delivery', 'active', '400 Logistics Way, Chicago IL 60604', $1)
      RETURNING id, name
    `, [sponsorOrg.id]);
    const { rows: [deliveryUser] } = await client.query(`
      INSERT INTO users (name, email, password_hash, role, org_id)
      VALUES ('Tom Driver', 'delivery@test.com', $1, 'delivery', $2)
      RETURNING id, email
    `, [hash, deliveryOrg.id]);
    console.log(`✓ Delivery:     ${deliveryUser.email}  (${deliveryOrg.name})`);

    await client.query('COMMIT');

    console.log('\n✅  Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Email                Role        Password');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  sponsor@test.com     Sponsor     password123');
    console.log('  coord@test.com       Coordinator password123');
    console.log('  kitchen@test.com     Kitchen     password123');
    console.log('  site@test.com        Site        password123');
    console.log('  delivery@test.com    Delivery    password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
