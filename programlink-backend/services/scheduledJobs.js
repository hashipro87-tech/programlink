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
//
//   4. Enrollment expiry alerts — 9am daily
//      Fires alerts for enrollment forms expiring in exactly 30 or 7 days.
//
//   5. Weekly sponsor digest   — 7am UTC every Monday
//      Short "where your claim stands" pulse email: estimated reimbursement,
//      issues to fix, sites ready. Keeps sponsors engaged between monthly reports.
//
//   6. Monthly sponsor report  — 9am UTC on the 28th of each month
//      Sends every active sponsor a program summary: estimated reimbursement,
//      sites ready, flagged issues — before most state CACFP claim deadlines.

const cron = require('node-cron');
const https = require('https');
const fs   = require('fs');
const path = require('path');
const pool = require('../config/database');
const { createNotification, notifyCoordinators } = require('./notificationService');
const { sendDocumentExpiryEmail, sendTrainingExpiryEmail, sendMonthlyReportEmail, sendWeeklyDigestEmail } = require('./emailService');
const { sendTrainingExpiryReminders } = require('../controllers/trainingController');
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
          -- meal_counts has no org_id column — a submission is recorded under
          -- site_id (the site being fed) and/or kitchen_id (the kitchen that
          -- prepared it), never a generic org_id. This subquery previously
          -- referenced mc.org_id, which doesn't exist, so this cron threw a
          -- Postgres error on every run and no reminder was ever sent.
          SELECT site_id    FROM meal_counts WHERE date = $1 AND site_id    IS NOT NULL
          UNION
          SELECT kitchen_id FROM meal_counts WHERE date = $1 AND kitchen_id IS NOT NULL
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

// ─── Job 3: Enrollment expiry reminders ──────────────────────────────────────
// Runs every day at 9:00am UTC.
// Fires alerts for enrollment forms expiring in exactly 30 or 7 days.
async function checkEnrollmentExpiry() {
  console.log('[cron] Running enrollment expiry check…');
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id, c.first_name, c.last_name, c.org_id, c.enrollment_expires,
        o.name AS org_name, o.sponsor_id,
        DATE_PART('day', c.enrollment_expires - NOW()) AS days_left
      FROM children c
      JOIN organizations o ON o.id = c.org_id
      WHERE c.enrollment_expires IS NOT NULL
        AND c.enrollment_expires > NOW()
        AND c.form_status = 'approved'
        AND DATE_PART('day', c.enrollment_expires - NOW()) IN (30, 7)
    `);

    if (!rows.length) { console.log('[cron] No enrollment forms expiring soon.'); return; }

    for (const child of rows) {
      const days  = Math.round(child.days_left);
      const emoji = days <= 7 ? '🔴' : '🟠';
      const title = `${emoji} Enrollment form expiring in ${days} days`;
      const body  = `${child.first_name} ${child.last_name}'s enrollment form at ${child.org_name} expires in ${days} days. The site needs to resubmit.`;

      // Notify site staff
      const siteUsers = await pool.query(
        `SELECT id FROM users WHERE org_id = $1 AND is_active = TRUE`, [child.org_id]
      );
      if (siteUsers.rows.length) {
        await createNotification(siteUsers.rows.map(u => ({
          userId: u.id, type: 'general', title, body,
          actionUrl: '/dashboard/site/enrollment',
        })));
      }

      // Notify sponsor
      if (child.sponsor_id) {
        const sponsorUsers = await pool.query(
          `SELECT id FROM users WHERE org_id = $1 AND role = 'sponsor' AND is_active = TRUE`, [child.sponsor_id]
        );
        if (sponsorUsers.rows.length) {
          await createNotification(sponsorUsers.rows.map(u => ({
            userId: u.id, type: 'general', title, body,
            actionUrl: '/dashboard/sponsor/children',
          })));
        }
      }
    }
    console.log(`[cron] Enrollment expiry alerts sent for ${rows.length} children.`);
  } catch (err) {
    console.error('[cron] Enrollment expiry check failed:', err.message);
  }
}

// ─── Job 4: Monthly sponsor program summary email ────────────────────────────
// Runs at 9:00am UTC on the 28th of each month.
// Sends each active sponsor with a configured state a program summary email
// showing estimated reimbursement, sites ready, and flagged issues — giving
// them a few days to fix problems before most state CACFP claim deadlines.

async function sendMonthlyReports() {
  console.log('[cron] Running monthly sponsor report job…');

  const now       = new Date();
  const year      = now.getFullYear();
  const month     = now.getMonth() + 1; // 1-based
  const monthStr  = `${year}-${String(month).padStart(2, '0')}`;
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthStart = `${monthStr}-01`;
  const monthEnd   = new Date(year, month, 1).toISOString().split('T')[0]; // first of next month

  // State-based tier-1 reimbursement rates (mirrored from stateConfigs JSONs)
  // Falls back to simple averages if config file is missing.
  function getStateRates(region) {
    try {
      const cfgPath = path.join(__dirname, 'stateConfigs', `${region}.json`);
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      const t1 = cfg.rates?.tier1 ?? cfg.rates;
      return {
        breakfast: t1?.breakfast ?? 1.70,
        lunch:     t1?.lunch     ?? 3.22,
        snack:     t1?.snack     ?? 0.96,
        supper:    t1?.supper    ?? 3.22,
      };
    } catch {
      return { breakfast: 1.70, lunch: 3.22, snack: 0.96, supper: 3.22 };
    }
  }

  try {
    // Find all active, verified sponsor users with a state configured
    const sponsorsRes = await pool.query(`
      SELECT DISTINCT ON (u.org_id)
        u.id         AS user_id,
        u.email,
        u.name,
        o.id         AS org_id,
        o.name       AS org_name,
        o.region
      FROM users u
      JOIN organizations o ON u.org_id = o.id
      WHERE u.role       = 'sponsor'
        AND u.is_active  = TRUE
        AND u.is_verified = TRUE
        AND o.region IS NOT NULL
        AND o.region != ''
      ORDER BY u.org_id, u.created_at ASC
    `);

    if (!sponsorsRes.rows.length) {
      console.log('[cron] No active sponsors with state configured. Skipping monthly reports.');
      return;
    }

    let sent = 0;

    for (const sponsor of sponsorsRes.rows) {
      try {
        const rates = getStateRates(sponsor.region);

        // 1. All active sites for this sponsor
        const sitesRes = await pool.query(`
          SELECT id, name
          FROM organizations
          WHERE sponsor_id = $1 AND type = 'site' AND status = 'active'
        `, [sponsor.org_id]);

        const allSites   = sitesRes.rows;
        const totalSites = allSites.length;

        if (totalSites === 0) continue; // nothing to report yet

        const siteIds = allSites.map(s => s.id);

        // 2. Meal counts for this month (per type, per org)
        const countsRes = await pool.query(`
          SELECT
            org_id,
            SUM(breakfast) AS b,
            SUM(lunch)     AS l,
            SUM(snack)     AS s,
            SUM(supper)    AS sp
          FROM meal_counts
          WHERE org_id     = ANY($1)
            AND date      >= $2
            AND date       < $3
          GROUP BY org_id
        `, [siteIds, monthStart, monthEnd]);

        const countsByOrg = {};
        for (const r of countsRes.rows) {
          countsByOrg[r.org_id] = {
            breakfast: Number(r.b) || 0,
            lunch:     Number(r.l) || 0,
            snack:     Number(r.s) || 0,
            supper:    Number(r.sp) || 0,
          };
        }

        // 3. Totals and reimbursement
        let totalMealCounts         = 0;
        let estimatedReimbursement  = 0;
        const issues                = [];
        let sitesReady              = 0;

        for (const site of allSites) {
          const c   = countsByOrg[site.id];
          const hasSubmitted = !!c;

          if (hasSubmitted) {
            const b   = c.breakfast + c.lunch + c.snack + c.supper;
            totalMealCounts        += b;
            const siteEst =
              c.breakfast * rates.breakfast +
              c.lunch     * rates.lunch     +
              c.snack     * rates.snack     +
              c.supper    * rates.supper;
            estimatedReimbursement += siteEst;
            sitesReady++;
          } else {
            // No counts at all this month — biggest risk
            const siteEstPotential = 20 * 30 * (rates.breakfast + rates.lunch + rates.snack); // rough estimate
            issues.push({
              site:         site.name,
              message:      'No meal counts submitted this month',
              potentialLoss: Math.round(siteEstPotential),
            });
          }
        }

        // 4. Check for expired / missing required docs across all sites
        const expiredDocsRes = await pool.query(`
          SELECT o.name AS org_name, d.label, d.status
          FROM documents d
          JOIN organizations o ON d.org_id = o.id
          WHERE d.org_id = ANY($1)
            AND d.status IN ('expired', 'missing')
          ORDER BY o.name
          LIMIT 5
        `, [siteIds]);

        for (const doc of expiredDocsRes.rows) {
          issues.push({
            site:         doc.org_name,
            message:      `${doc.status === 'expired' ? 'Expired' : 'Missing'} document: ${doc.label}`,
            potentialLoss: Math.round(estimatedReimbursement / Math.max(totalSites, 1)),
          });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'https://cacfplink.com';
        const claimsUrl   = `${frontendUrl}/dashboard/sponsor/claims`;

        await sendMonthlyReportEmail(sponsor.email, sponsor.name || 'there', {
          monthName,
          estimatedReimbursement: Math.round(estimatedReimbursement),
          sitesReady,
          totalSites,
          totalMealCounts,
          issueCount: issues.length,
          issues,
          claimsUrl,
        });

        sent++;
        console.log(`[cron] Monthly report sent → ${sponsor.email} (${monthName})`);
      } catch (sponsorErr) {
        console.error(`[cron] Monthly report failed for ${sponsor.email}:`, sponsorErr.message);
      }
    }

    console.log(`[cron] Monthly reports done — sent to ${sent}/${sponsorsRes.rows.length} sponsors.`);
  } catch (err) {
    console.error('[cron] Monthly report job failed:', err.message);
  }
}

// ─── Job 5: Weekly sponsor digest email ──────────────────────────────────────
// Runs every Monday at 7:00am UTC.
// Sends each active sponsor a quick "where your claim stands" pulse —
// shorter than the monthly report, focused on immediate action items.

async function sendWeeklyDigests() {
  console.log('[cron] Running weekly sponsor digest job…');

  const now       = new Date();
  const year      = now.getFullYear();
  const month     = now.getMonth() + 1;
  const monthStr  = `${year}-${String(month).padStart(2, '0')}`;
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthStart = `${monthStr}-01`;
  const monthEnd   = new Date(year, month, 1).toISOString().split('T')[0];

  // "Week of Jul 21, 2026" label
  const weekOf = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  function getStateRates(region) {
    try {
      const cfgPath = path.join(__dirname, 'stateConfigs', `${region}.json`);
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      const t1 = cfg.rates?.tier1 ?? cfg.rates;
      return {
        breakfast: t1?.breakfast ?? 1.70,
        lunch:     t1?.lunch     ?? 3.22,
        snack:     t1?.snack     ?? 0.96,
        supper:    t1?.supper    ?? 3.22,
      };
    } catch {
      return { breakfast: 1.70, lunch: 3.22, snack: 0.96, supper: 3.22 };
    }
  }

  try {
    const sponsorsRes = await pool.query(`
      SELECT DISTINCT ON (u.org_id)
        u.id AS user_id, u.email, u.name,
        o.id AS org_id, o.name AS org_name, o.region
      FROM users u
      JOIN organizations o ON u.org_id = o.id
      WHERE u.role = 'sponsor'
        AND u.is_active  = TRUE
        AND u.is_verified = TRUE
        AND o.region IS NOT NULL
        AND o.region != ''
      ORDER BY u.org_id, u.created_at ASC
    `);

    if (!sponsorsRes.rows.length) {
      console.log('[cron] No active sponsors with state configured. Skipping weekly digests.');
      return;
    }

    let sent = 0;

    for (const sponsor of sponsorsRes.rows) {
      try {
        const rates = getStateRates(sponsor.region);

        const sitesRes = await pool.query(
          `SELECT id, name FROM organizations WHERE sponsor_id = $1 AND type = 'site' AND status = 'active'`,
          [sponsor.org_id]
        );
        const allSites   = sitesRes.rows;
        const totalSites = allSites.length;
        if (totalSites === 0) continue;

        const siteIds = allSites.map(s => s.id);

        const countsRes = await pool.query(`
          SELECT org_id,
            SUM(breakfast) AS b, SUM(lunch) AS l, SUM(snack) AS s, SUM(supper) AS sp
          FROM meal_counts
          WHERE org_id = ANY($1) AND date >= $2 AND date < $3
          GROUP BY org_id
        `, [siteIds, monthStart, monthEnd]);

        const countsByOrg = {};
        for (const r of countsRes.rows) {
          countsByOrg[r.org_id] = {
            breakfast: Number(r.b) || 0, lunch: Number(r.l) || 0,
            snack: Number(r.s) || 0,     supper: Number(r.sp) || 0,
          };
        }

        let estimatedReimbursement = 0;
        const issues = [];
        let sitesReady = 0;

        for (const site of allSites) {
          const c = countsByOrg[site.id];
          if (c) {
            estimatedReimbursement +=
              c.breakfast * rates.breakfast + c.lunch * rates.lunch +
              c.snack * rates.snack + c.supper * rates.supper;
            sitesReady++;
          } else {
            const potential = Math.round(20 * 30 * (rates.breakfast + rates.lunch + rates.snack));
            issues.push({ site: site.name, message: 'No meal counts submitted this month', potentialLoss: potential });
          }
        }

        const expiredDocsRes = await pool.query(`
          SELECT o.name AS org_name, d.label, d.status
          FROM documents d
          JOIN organizations o ON d.org_id = o.id
          WHERE d.org_id = ANY($1) AND d.status IN ('expired', 'missing')
          ORDER BY o.name LIMIT 3
        `, [siteIds]);

        for (const doc of expiredDocsRes.rows) {
          issues.push({
            site:         doc.org_name,
            message:      `${doc.status === 'expired' ? 'Expired' : 'Missing'} document: ${doc.label}`,
            potentialLoss: Math.round(estimatedReimbursement / Math.max(totalSites, 1)),
          });
        }

        const claimsUrl = `${process.env.FRONTEND_URL || 'https://cacfplink.com'}/dashboard/sponsor/claims`;

        await sendWeeklyDigestEmail(sponsor.email, sponsor.name || 'there', {
          weekOf, monthName,
          estimatedReimbursement: Math.round(estimatedReimbursement),
          sitesReady, totalSites,
          issueCount: issues.length,
          issues,
          claimsUrl,
        });

        sent++;
        console.log(`[cron] Weekly digest sent → ${sponsor.email}`);
      } catch (sponsorErr) {
        console.error(`[cron] Weekly digest failed for ${sponsor.email}:`, sponsorErr.message);
      }
    }

    console.log(`[cron] Weekly digests done — sent to ${sent}/${sponsorsRes.rows.length} sponsors.`);
  } catch (err) {
    console.error('[cron] Weekly digest job failed:', err.message);
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

  // Enrollment expiry reminders — 9:00am UTC every day
  cron.schedule('0 9 * * *', checkEnrollmentExpiry, {
    timezone: 'UTC',
  });

  // Weekly sponsor digest — 7:00am UTC every Monday
  cron.schedule('0 7 * * 1', sendWeeklyDigests, {
    timezone: 'UTC',
  });

  // Monthly sponsor report — 9:00am UTC on the 28th of each month
  cron.schedule('0 9 28 * *', sendMonthlyReports, {
    timezone: 'UTC',
  });

  // Training cert expiry reminders — 8:30am UTC every day
  cron.schedule('30 8 * * *', sendTrainingExpiryReminders, {
    timezone: 'UTC',
  });

  console.log('✅ Scheduled jobs started (self-ping @ 5min, deliveries @ 6am, doc expiry @ 8am, training expiry @ 8:30am, enrollment @ 9am, meal reminders @ 4pm, weekly digest @ Mon 7am, monthly report @ 28th UTC)');
}

module.exports = { startScheduledJobs, checkDocumentExpiry, checkMealCountReminders, checkEnrollmentExpiry, generateTodayDeliveries, sendMonthlyReports, sendWeeklyDigests, sendTrainingExpiryReminders };
