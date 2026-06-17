// Migration: ensure documents table has expires_at + days_until_expiry support
// Run once: node scripts/add-document-expiry-columns.js

const pool = require('../config/database');

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // expires_at may already exist — add only if missing
    await client.query(`
      ALTER TABLE documents
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;
    `);

    // Index so expiry queries are fast
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_expires_at ON documents (expires_at)
      WHERE expires_at IS NOT NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ Document expiry columns ready.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
