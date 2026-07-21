// activityService.js — lightweight activity feed logger
// Call logActivity() from any controller to add an event to the feed
const pool = require('../config/database');

/**
 * Log an activity event.
 * @param {Object} opts
 * @param {string}  opts.org_id      - The org this activity belongs to
 * @param {string}  [opts.actor_id]  - User who performed the action
 * @param {string}  [opts.actor_name]- Display name (pre-fetched to avoid extra query)
 * @param {string}  opts.type        - Event type key (see TYPES below)
 * @param {string}  opts.title       - Short summary line
 * @param {string}  [opts.description] - Optional detail
 * @param {string}  [opts.link]      - Frontend path to navigate to
 */
async function logActivity({ org_id, actor_id, actor_name, type, title, description, link }) {
  try {
    await pool.query(
      `INSERT INTO activity_feed (org_id, actor_id, actor_name, type, title, description, link)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [org_id, actor_id || null, actor_name || null, type, title, description || null, link || null]
    );
  } catch (err) {
    // Never crash the parent request — activity logging is best-effort
    console.error('logActivity error (non-fatal):', err.message);
  }
}

/**
 * Log the same activity for multiple orgs at once (e.g. sponsor-level broadcast).
 */
async function logActivityForOrgs(orgIds, opts) {
  await Promise.all(orgIds.map(org_id => logActivity({ ...opts, org_id })));
}

// ── Activity type constants ───────────────────────────────────────────────────
const TYPES = {
  APPLICATION_SUBMITTED:  'application_submitted',
  APPLICATION_APPROVED:   'application_approved',
  APPLICATION_REJECTED:   'application_rejected',
  APPLICATION_CHANGES:    'application_changes_requested',
  DOCUMENT_UPLOADED:      'document_uploaded',
  DOCUMENT_EXPIRED:       'document_expired',
  DOCUMENT_REQUESTED:     'document_requested',
  MEAL_COUNTS_SUBMITTED:  'meal_counts_submitted',
  MEAL_COUNTS_VERIFIED:   'meal_counts_verified',
  TASK_CREATED:           'task_created',
  TASK_COMPLETED:         'task_completed',
  INSPECTION_LOGGED:      'inspection_logged',
  FINDING_ADDED:          'finding_added',
  FINDING_RESOLVED:       'finding_resolved',
  CHILD_ADDED:            'child_added',
  MEMBER_JOINED:          'member_joined',
  CLAIM_GENERATED:        'claim_generated',
  DELIVERY_COMPLETED:     'delivery_completed',
};

module.exports = { logActivity, logActivityForOrgs, TYPES };
