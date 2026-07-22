// scheduledJobs.js — Background jobs that run on a timer inside the Express process.
// Uses node-cron so no external scheduler is needed — Railway keeps the server
// running 24/7 so these fire reliably.
//
// Jobs:
//   1. Delivery plan generation — 6am daily
//      Creates today's delivery instances from recurring plans + notifies sites/kitchens.
//
//   2. Document expiry alerts  — 8am daily
//      Finds documents expiring within 30 days and notifies the org's users
//      and their assigned coordinators/sponsors.
//
//   3. Meal count reminders    — 4pm daily
//      Finds sites/kitchens that haven't submitted a count for today
//      and sends a reminder to all active users in that org.

const cron = require('node-cron');
const https = require('https');
const pool = require('../config/database');
const { createNotification, notifyCoordinators } = require('./notificationService');
const { sendDocumentExpiryEmail } = require('./emailService');
const { generateTodayDeliveries } = require('../controllers/deliveryPlansController');

// ─── Job 1: Document expiry alerts ───────────────────────────────────────────
// Runs every day at 8:00am UTC.
// Only fires alerts for documents expiring in exactly 30, 14, or 7 days
// to avoid spamming the same alert every day.

async function checkDocumentExpiry() {
  console.log('[cron] Running document expiry check…');
  try {
    // Find documents expiring in 30, 14, or 7 days (not already expired)
    // Uses d.label (not d.name — documents table uses label column)
    const result = await pool.query(`
      SELECT
        d.id,
        d.label         AS doc_name,
        d.expires_at,
        d.org_id,
        o.name          AS org_name,
        o.sponsor_id,
        DATE_PART('day', d.expires_at - NOW()) AS days_left
      FROM documents d
      JOIN organizations o ON d.org_id = o.id
      WHERE d.expires_at IS NOT NULL
        AND d.expires_at > NOW()
        AND d.status NOT IN ('expired', 'superseded', 'requested')
        AND DATE_PART('day', d.expires_at - NOW()) IN (30, 14, 7)
    `);

    if (!result.rows.length) {
      console.log('[cron] No expiring documents found.');
      return;
    }

    for (const doc of result.rows) {
      const days = Math.round(doc.days_left);
      const urgency = days <= 7 ? '🔴' : days <= 14 ? '🟡' : '🟠';
      const title   = `${urgency} Document expiring in ${days} days`;
      const body    = `"${doc.doc_name}" for ${doc.org_name} expires in ${days} days. Upload a renewed copy to stay compliant.`;
      const actionUrl = '/dashboard/sponsor/documents';

      // Notify all active users in the org (in-app + email)
      const orgUsers = await pool.query(
        `SELECT id, name, email FROM users WHERE org_id = $1 AND is_active = TRUE`,
        [doc.org_id]
      );

      if (orgUsers.rows.length) {
        // In-app notification
        await createNotification(orgUsers.rows.map((u) => ({
          userId:    u.id,
          type:      'document_expiring',  // matches DB CHECK constraint
          title,
          body,
          actionUrl,
        })));

        // Email each user
        for (const u of orgUsers.rows) {
          sendDocumentExpiryEmail(
            u.email, u.name, doc.org_name, doc.doc_name, days, doc.expires_at
          ).catch((err) => console.error(`[cron] Email failed for ${u.email}:`, err.message));
        }
      }

      // Also notify coordinators and sponsors so nothing slips through
      if (doc.sponsor_id) {
        await notifyCoordinators(doc.sponsor_id, {
          type:      'document_expiring',
          title,
          body,
          actionUrl,
        });
      }
    }

    console.log(`[cron] Document expiry alerts sent for ${result.rows.length} documents.`);
  } catch (err) {
    console.error('[cron] Document expiry check failed:', err.message);
  }
}

// ─── Job 2: Daily meal count reminders ───────────────────────────────────────
// Runs every day at 4:00pm UTC (end of afternoon — gives kitchen staff time to submit).
// Finds sites/kitchens that haven't submitted ANY count for today's date.

async function checkMealCountReminders() {
  console.log('[cron] Running meal count reminder check…');
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Find approved kitchens and sites that have NOT submitted a count today
    const result = await pool.query(`
      SELECT
        o.id        AS org_id,
        o.name      AS org_name,
        o.type      AS org_type,
        o.sponsor_id
      FROM organizations o
      WHERE o.type IN ('kitchen', 'site')
        AND o.status = 'active'
        AND o.id NOT IN (
          SELECT DISTINCT mc.org_id
          FROM meal_counts mc
          WHERE mc.date = $1
        )
    `, [today]);

    if (!result.rows.length) {
      console.log('[cron] All orgs have submitted counts for today.');
      return;
    }

    for (const org of result.rows) {
      // Notify all active users in the org
      const users = await pool.query(
        `SELECT id FROM users WHERE org_id = $1 AND is_active = TRUE`,
        [org.org_id]
      );

      if (users.rows.length) {
        await createNotification(users.rows.map((u) => ({
          userId: u.id,
          type: 'meal_count_reminder',
          title: '⏰ Meal count not yet submitted',
          body: `Don't forget to submit today's meal counts for ${org.org_name}. Counts are due by end of day.`,
          actionUrl: org.org_type === 'kitchen'
            ? '/dashboard/kitchen/meals'
            : '/dashboard/site/meals',
        })));
      }

      // Also notify coordinators so they can follow up if needed
      if (org.sponsor_id) {
        await notifyCoordinators(org.sponsor_id, {
          type: 'meal_count_reminder',
          title: `⏰ ${org.org_name} hasn't submitted counts`,
          body: `${org.org_name} has not submitted meal counts for today (${today}).`,
          actionUrl: '/dashboard/coordinator/meal-counts',
        });
      }
    }

    console.log(`[cron] Meal count reminders sent for ${result.rows.length} orgs.`);
  } catch (err) {
    console.error('[cron] Meal count reminder check failed:', err.message);
  }
}

// ─── Self-ping: keeps Railway from sleeping ───────────────────────────────────
// Pings /health every 5 minutes so Railway's free tier never idles the process.
function selfPing() {
  const url = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/health`
    : 'https://programlink-production.up.railway.app/health';
  https.get(url, (res) => {
    console.log(`[ping] /health → ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('[ping] self-ping failed:', err.message);
  });
}

// ─── Start all jobs ───────────────────────────────────────────────────────────
function startScheduledJobs() {
  // Self-ping every 5 minutes — keeps Railway awake, no third-party service needed
  cron.schedule('*/5 * * * *', selfPing);

  // Delivery plan generation — 6:00am UTC every day
  cron.schedule('0 6 * * *', generateTodayDeliveries, {
    timezone: 'UTC',
  });

  // Document expiry check — 8:00am UTC every day
  cron.schedule('0 8 * * *', checkDocumentExpiry, {
    timezone: 'UTC',
  });

  // Meal count reminder — 4:00pm UTC every day
  cron.schedule('0 16 * * *', checkMealCountReminders, {
    timezone: 'UTC',
  });

  console.log('✅ Scheduled jobs started (self-ping @ 5min, deliveries @ 6am, doc expiry @ 8am, meal reminders @ 4pm UTC)');
}

module.exports = { startScheduledJobs, checkDocumentExpiry, checkMealCountReminders, generateTodayDeliveries };
