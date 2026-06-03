// scripts/add-reset-token-columns.js
// Adds reset_token and reset_token_expires_at columns to the users table.
// Run once: node scripts/add-reset-token-columns.js

require('dotenv').config();
const pool = require('../config/database');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reset_token            TEXT,
        ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;
    `);
    console.log('✅ reset_token columns added to users table.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
