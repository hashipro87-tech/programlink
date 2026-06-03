// scripts/add-email-verification-columns.js
// Adds email verification columns to the users table.
// Existing users are defaulted to verified = TRUE so they aren't locked out.
// Run once: node scripts/add-email-verification-columns.js

require('dotenv').config();
const pool = require('../config/database');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_verified         BOOLEAN      DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS verification_token  TEXT,
        ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ;
    `);

    // Existing users: mark as verified with a verified_at timestamp
    await pool.query(`
      UPDATE users
      SET is_verified = TRUE,
          verified_at = NOW()
      WHERE is_verified IS NULL OR is_verified = TRUE
        AND verified_at IS NULL;
    `);

    console.log('✅ Email verification columns added. Existing users marked as verified.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
