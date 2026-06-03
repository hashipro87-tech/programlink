// notificationService.js
// Shared helper used by other controllers to create in-app notifications.
// Keeping this in a service layer means any controller can trigger a
// notification without duplicating the INSERT logic.
//
// Future: this is also where we'd trigger SendGrid emails in addition
// to the in-app record.

const pool = require('../config/database');

/**
 * Create one or more in-app notifications.
 *
 * @param {Object|Object[]} opts - A single notification or an array of them
 * @param {string}   opts.userId     - Recipient user ID
 * @param {string}   opts.type       - One of the notification type enum values
 * @param {string}   opts.title      - Short headline shown in the bell dropdown
 * @param {string}   [opts.body]     - Optional longer description
 * @param {string}   [opts.actionUrl]- Link to the relevant page in the app
 */
async function createNotification(opts) {
  const items = Array.isArray(opts) ? opts : [opts];

  if (!items.length) return;

  // Build a multi-row INSERT for efficiency
  const values = [];
  const placeholders = items.map((item, i) => {
    const base = i * 5;
    values.push(
      item.userId,
      item.type,
      item.title,
      item.body    || null,
      item.actionUrl || null
    );
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
  });

  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, action_url)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}

/**
 * Notify all coordinators assigned to a given sponsor.
 * Useful for "application submitted" events where every coordinator
 * on the account should be alerted.
 */
async function notifyCoordinators(sponsorId, notification) {
  const result = await pool.query(
    `SELECT u.id FROM users u
     JOIN organizations o ON u.org_id = o.id
     WHERE u.role = 'coordinator'
       AND (o.id = $1 OR o.sponsor_id = $1)
       AND u.is_active = TRUE`,
    [sponsorId]
  );

  if (!result.rows.length) return;

  const items = result.rows.map((row) => ({
    userId: row.id,
    ...notification,
  }));

  await createNotification(items);
}

/**
 * Notify all sponsor admin users for a given sponsor org.
 */
async function notifySponsors(sponsorId, notification) {
  const result = await pool.query(
    `SELECT id FROM users
     WHERE role = 'sponsor'
       AND org_id = $1
       AND is_active = TRUE`,
    [sponsorId]
  );

  if (!result.rows.length) return;

  const items = result.rows.map((row) => ({
    userId: row.id,
    ...notification,
  }));

  await createNotification(items);
}

module.exports = { createNotification, notifyCoordinators, notifySponsors };
