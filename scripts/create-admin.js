// scripts/create-admin.js
// Creates the platform-wide admin account.
// Run with: node scripts/create-admin.js
//
// This creates:
//   admin@programlink.app / admin123!  (Admin — full platform access)

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createAdmin() {
  const client = await pool.connect();
  try {
    console.log('🔧  Creating admin account…\n');

    const email    = 'admin@programlink.app';
    const password = 'admin123!';
    const hash     = await bcrypt.hash(password, 12);

    // Check if already exists
    const { rows: existing } = await client.query(
      `SELECT id FROM users WHERE email = $1`, [email]
    );
    if (existing.length) {
      console.log('⚠️   Admin account already exists — no changes made.');
      return;
    }

    await client.query('BEGIN');

    // Create a special admin org (admin users don't belong to a sponsor program)
    const { rows: [org] } = await client.query(`
      INSERT INTO organizations (name, type, status)
      VALUES ('ProgramLink Admin', 'sponsor', 'active')
      RETURNING id
    `);
    // Sponsor self-reference
    await client.query(
      `UPDATE organizations SET sponsor_id = $1 WHERE id = $1`, [org.id]
    );

    await client.query(`
      INSERT INTO users (name, email, password_hash, role, org_id)
      VALUES ('Admin', $1, $2, 'admin', $3)
    `, [email, hash, org.id]);

    await client.query('COMMIT');

    console.log('✅  Admin account created!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Email:    admin@programlink.app');
    console.log('  Password: admin123!');
    console.log('  Role:     admin (full platform access)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
