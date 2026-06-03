// scripts/add-admin-role.js
// Updates the users table to allow the 'admin' role, then creates the admin account.
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔧  Updating role constraint…');
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('sponsor','coordinator','kitchen','site','delivery','admin'));
    `);
    console.log('✓  Constraint updated.');

    const email = 'admin@programlink.app';
    const { rows: existing } = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.length) {
      console.log('⚠️   Admin already exists — done.');
      return;
    }

    const hash = await bcrypt.hash('admin123!', 12);
    await client.query('BEGIN');

    const { rows: [org] } = await client.query(`
      INSERT INTO organizations (name, type, status)
      VALUES ('ProgramLink Admin', 'sponsor', 'active')
      RETURNING id
    `);
    await client.query(`UPDATE organizations SET sponsor_id = $1 WHERE id = $1`, [org.id]);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, org_id)
      VALUES ('Admin', $1, $2, 'admin', $3)
    `, [email, hash, org.id]);

    await client.query('COMMIT');
    console.log('\n✅  Admin account created!');
    console.log('  Email:    admin@programlink.app');
    console.log('  Password: admin123!\n');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌  Failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
