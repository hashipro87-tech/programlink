// scripts/add-audit-log-table.js
// Creates the audit_log table for tracking important changes.
// Run once: node scripts/add-audit-log-table.js

require('dotenv').config();
const pool = require('../config/database');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
        actor_name  VARCHAR(255),
        actor_role  VARCHAR(50),
        action      VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id   UUID,
        entity_name VARCHAR(255),
        details     JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_log_actor    ON audit_log(actor_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_entity   ON audit_log(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_created  ON audit_log(created_at DESC);
    `);
    console.log('✅ audit_log table created.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
