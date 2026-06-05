// auditService.js — Write audit log entries from anywhere in the app.
const pool = require('../config/database');

/**
 * Log an auditable action.
 * @param {Object} opts
 * @param {Object} opts.actor   - req.user object (id, name(?), role, email)
 * @param {string} opts.action  - e.g. 'application.approved', 'user.deactivated'
 * @param {string} [opts.entityType] - e.g. 'application', 'user', 'document'
 * @param {string} [opts.entityId]
 * @param {string} [opts.entityName]
 * @param {Object} [opts.details]    - any extra context
 */
async function logAction({ actor, action, entityType, entityId, entityName, details }) {
  try {
    await pool.query(
      `INSERT INTO audit_log (actor_id, actor_name, actor_role, action, entity_type, entity_id, entity_name, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        actor?.id   || null,
        actor?.name || actor?.email || null,
        actor?.role || null,
        action,
        entityType  || null,
        entityId    || null,
        entityName  || null,
        details ? JSON.stringify(details) : null,
      ]
    );
  } catch (err) {
    // Audit logging must never break the main request
    console.error('Audit log error (non-fatal):', err.message);
  }
}

module.exports = { logAction };
