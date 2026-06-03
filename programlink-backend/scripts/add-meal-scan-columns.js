// scripts/add-meal-scan-columns.js
// Adds per-meal-type columns and scan image storage to meal_counts.
// Run once: DATABASE_URL="..." node scripts/add-meal-scan-columns.js

require('dotenv').config();
const { Pool } = require('pg');

const sslConfig = process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false };
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: sslConfig });

async function migrate() {
  console.log('Adding meal scan columns to meal_counts…');

  await pool.query(`
    ALTER TABLE meal_counts
      ADD COLUMN IF NOT EXISTS breakfast_count  INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lunch_count      INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS supper_count     INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS snack_count      INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS scan_image_data  TEXT,
      ADD COLUMN IF NOT EXISTS scanned_by_ai    BOOLEAN DEFAULT FALSE;
  `);

  console.log('✓ Columns added successfully.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
