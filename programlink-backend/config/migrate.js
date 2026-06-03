// migrate.js — Run this with `npm run db:migrate` to create all tables
// This is a simple migration runner. For production, consider using
// a proper migration tool like db-migrate or Knex migrations.

require('dotenv').config();
const pool = require('./database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const schemaPath = path.join(__dirname, '../models/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    console.log('🔄 Running migrations...');
    await pool.query(sql);
    console.log('✅ All tables created successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigrations();
