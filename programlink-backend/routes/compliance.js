// routes/compliance.js — Sponsor compliance action center
// GET  /compliance            — per-org compliance with score breakdown
// POST /compliance/:id/remind — send nudge notification to all users in an org

const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const pool = require('../config/database');
const { createNotification } = require('../services/notificationService');

// Required doc types per org type (mirrors frontend constants)
const REQUIRED = {
  kitchen: ['w9', 'food_permit', 'insurance', 'menu_plan', 'health_cert'],
  site:    ['enrollment', 'license', 'insurance', 'health_cert'],
};

// ── GET /compliance ───────────────────────────────────────────────────────────
router.get('/', authenticate, authorizeRoles('sponsor', 'coordinator', 'admin'), async (req, res) => {
  try {
    const sponsorId = (req.user.role === 'coordinator') ? (req.user.sponsorId ?? req.user.organizationId) : req.user.organizationId;

    // CTE replaces 4 correlated subqueries — single-pass over applications table,
    // document subqueries become FILTER aggregations on the existing LEFT JOIN.
    const { rows: orgs } = await pool.query(
      `WITH latest_apps AS (
         SELECT DISTINCT ON (org_id)
           org_id,
           status,
           updated_at
         FROM applications
         ORDER BY org_id, created_at DESC
       )
       SELECT
         o.id,
         o.name,
         o.type,
         o.status AS org_status,

         -- Application status (via CTE — no correlated subquery)
         la.status      AS app_status,
         la.updated_at  AS app_updated_at,

         -- Document counts
         COUNT(d.id) FILTER (WHERE d.status = 'valid')                                         AS docs_valid,
         COUNT(d.id) FILTER (WHERE d.status = 'expired')                                       AS docs_expired,
         COUNT(d.id) FILTER (
           WHERE d.status = 'expiring_soon'
             OR  (d.expires_at IS NOT NULL
                  AND d.expires_at  > NOW()
                  AND d.expires_at <= NOW() + INTERVAL '30 days'
                  AND d.status = 'valid')
         )                                                                                      AS docs_expiring,
         COUNT(d.id) FILTER (WHERE d.status = 'rejected')                                      AS docs_rejected,
         COUNT(d.id) FILTER (WHERE d.status = 'pending_review')                                AS docs_pending,
         COUNT(d.id) FILTER (WHERE d.status = 'requested')                                     AS docs_requested,

         -- Soonest upcoming expiry (valid or expiring_soon docs only)
         MIN(d.expires_at) FILTER (
           WHERE d.expires_at IS NOT NULL
             AND d.expires_at > NOW()
             AND d.status IN ('valid', 'expiring_soon')
         ) AS next_expiry,

         -- Most recent real upload — aggregation replaces correlated subquery
         MAX(d.uploaded_at) FILTER (
           WHERE d.file_url IS NOT NULL
             AND d.file_url != ''
             AND d.status NOT IN ('superseded', 'requested')
         ) AS last_doc_upload,

         -- Distinct doc types with current valid/pending upload — aggregation replaces correlated subquery
         COALESCE(
           json_agg(DISTINCT d.doc_type) FILTER (
             WHERE d.status IN ('valid', 'expiring_soon', 'pending_review')
           ),
           '[]'::json
         ) AS uploaded_doc_types

       FROM organizations o
       LEFT JOIN documents d    ON d.org_id  = o.id
       LEFT JOIN latest_apps la ON la.org_id = o.id
       WHERE o.sponsor_id = $1
         AND o.type IN ('site', 'kitchen')
       GROUP BY o.id, la.status, la.updated_at
       ORDER BY o.name`,
      [sponsorId]
    );

    // Enrich each org with score, tier, and missing-doc info
    const withScores = orgs.map((org) => {
      const requiredTypes  = REQUIRED[org.type] ?? [];
      const uploadedSet    = new Set(org.uploaded_doc_types ?? []);
      const missingDocs    = requiredTypes.filter((t) => !uploadedSet.has(t));
      const docsRequired   = requiredTypes.length;
      const docsUploaded   = requiredTypes.filter((t) => uploadedSet.has(t)).length;

      // Sponsor-created orgs (status='active', no application) don't need an application —
      // they were added directly by the sponsor, not through the application flow.
      const sponsorCreated = !org.app_status && org.org_status === 'active';

      // ── Score (0–100) ───────────────────────────────────────────────────────
      let score = 100;
      if (!sponsorCreated) {
        if (!org.app_status)                    score -= 20;
        else if (org.app_status !== 'approved') score -= 10;
      }
      score -= Number(org.docs_expired  ?? 0) * 20;
      score -= Number(org.docs_rejected ?? 0) * 10;
      score -= missingDocs.length              * 10;
      score -= Number(org.docs_expiring ?? 0) *  5;
      score  = Math.max(0, Math.min(100, score));

      // ── Tier ────────────────────────────────────────────────────────────────
      let tier;
      if (Number(org.docs_expired) > 0 || Number(org.docs_rejected) > 0) {
        tier = 'overdue';
      } else if (missingDocs.length > 0 && !org.app_status && !sponsorCreated) {
        tier = 'overdue';
      } else if (missingDocs.length > 0) {
        tier = 'missing';
      } else if (Number(org.docs_expiring) > 0) {
        tier = 'expiring';
      } else if (
        Number(org.docs_pending) > 0 ||
        (org.app_status && org.app_status !== 'approved' && org.app_status !== 'rejected')
      ) {
        tier = 'pending';
      } else {
        tier = 'compliant';
      }

      return {
        ...org,
        score,
        tier,
        sponsor_created:     sponsorCreated,
        docs_required:       docsRequired,
        docs_uploaded:       docsUploaded,
        missing_docs:        missingDocs,         // array of doc_type strings
        uploaded_doc_types:  [...uploadedSet],
      };
    });

    // ── Program-wide summary ─────────────────────────────────────────────────
    const summary = {
      total:            withScores.length,
      total_kitchens:   withScores.filter((o) => o.type === 'kitchen').length,
      total_sites:      withScores.filter((o) => o.type === 'site').length,
      compliant:        withScores.filter((o) => o.tier === 'compliant').length,
      pending:          withScores.filter((o) => o.tier === 'pending').length,
      missing:          withScores.filter((o) => o.tier === 'missing').length,
      expiring:         withScores.filter((o) => o.tier === 'expiring').length,
      overdue:          withScores.filter((o) => o.tier === 'overdue').length,
      missing_docs_orgs:    withScores.filter((o) => o.missing_docs.length > 0).length,
      docs_expiring_soon:   withScores.reduce((s, o) => s + Number(o.docs_expiring  ?? 0), 0),
      docs_expired:         withScores.reduce((s, o) => s + Number(o.docs_expired   ?? 0), 0),
    };

    res.json({ summary, organizations: withScores });
  } catch (err) {
    console.error('compliance GET error:', err);
    res.status(500).json({ error: 'Failed to fetch compliance data.' });
  }
});

// ── POST /compliance/:orgId/remind ────────────────────────────────────────────
router.post('/:orgId/remind', authenticate, authorizeRoles('sponsor', 'coordinator', 'admin'), async (req, res) => {
  try {
    const { orgId }  = req.params;
    const { message } = req.body;
    const sponsorId  = (req.user.role === 'coordinator') ? req.user.sponsorId : req.user.organizationId;

    // Verify org belongs to this sponsor
    const { rows: orgRows } = await pool.query(
      'SELECT name FROM organizations WHERE id = $1 AND sponsor_id = $2',
      [orgId, sponsorId]
    );
    if (!orgRows.length) return res.status(404).json({ error: 'Organization not found.' });
    const orgName = orgRows[0].name;

    // Notify all active users in the org
    const { rows: users } = await pool.query(
      'SELECT id FROM users WHERE org_id = $1 AND is_active = TRUE',
      [orgId]
    );
    if (!users.length) return res.json({ success: true, notified: 0 });

    await createNotification(
      users.map((u) => ({
        userId:    u.id,
        type:      'compliance_reminder',
        title:     'Compliance Reminder',
        body:      message || 'Your program coordinator has sent a compliance reminder. Please review your outstanding requirements.',
        actionUrl: '/dashboard/kitchen/documents',
      }))
    );

    res.json({ success: true, notified: users.length, orgName });
  } catch (err) {
    console.error('compliance remind error:', err);
    res.status(500).json({ error: 'Failed to send reminder.' });
  }
});

// ── POST /compliance/remind-bulk ─────────────────────────────────────────────
// Body: { org_ids: [uuid, ...], message? }
// Sends a compliance reminder to all active users across multiple orgs at once.
router.post('/remind-bulk', authenticate, authorizeRoles('sponsor', 'coordinator', 'admin'), async (req, res) => {
  try {
    const { org_ids, message } = req.body;
    if (!Array.isArray(org_ids) || !org_ids.length) {
      return res.status(400).json({ error: 'org_ids array is required.' });
    }

    const sponsorId = (req.user.role === 'coordinator') ? (req.user.sponsorId ?? req.user.organizationId) : req.user.organizationId;

    // Only allow orgs that belong to this sponsor
    const { rows: orgs } = await pool.query(
      `SELECT id FROM organizations WHERE id = ANY($1) AND sponsor_id = $2`,
      [org_ids, sponsorId]
    );
    const validIds = orgs.map((o) => o.id);
    if (!validIds.length) return res.json({ success: true, notified: 0, orgs_reached: 0 });

    // Collect all active users in those orgs
    const { rows: users } = await pool.query(
      'SELECT id, org_id FROM users WHERE org_id = ANY($1) AND is_active = TRUE',
      [validIds]
    );
    if (!users.length) return res.json({ success: true, notified: 0, orgs_reached: validIds.length });

    await createNotification(
      users.map((u) => ({
        userId:    u.id,
        type:      'compliance_reminder',
        title:     'Compliance Reminder',
        body:      message || 'Your program coordinator has sent a compliance reminder. Please review your outstanding requirements.',
        actionUrl: '/dashboard/kitchen/documents',
      }))
    );

    const orgsReached = new Set(users.map((u) => u.org_id)).size;
    res.json({ success: true, notified: users.length, orgs_reached: orgsReached });
  } catch (err) {
    console.error('remind-bulk error:', err);
    res.status(500).json({ error: 'Failed to send bulk reminders.' });
  }
});

// ── POST /compliance/request-bulk ────────────────────────────────────────────
// Body: { org_ids: [uuid, ...], doc_type, label, due_date?, message? }
// Creates a 'requested' document placeholder + notification for each org.
router.post('/request-bulk', authenticate, authorizeRoles('sponsor', 'coordinator', 'admin'), async (req, res) => {
  try {
    const { org_ids, doc_type, label, due_date, message } = req.body;
    if (!Array.isArray(org_ids) || !org_ids.length) {
      return res.status(400).json({ error: 'org_ids array is required.' });
    }
    if (!label) return res.status(400).json({ error: 'Document label is required.' });

    const sponsorId = (req.user.role === 'coordinator') ? (req.user.sponsorId ?? req.user.organizationId) : req.user.organizationId;

    // Only allow orgs that belong to this sponsor
    const { rows: orgs } = await pool.query(
      `SELECT id FROM organizations WHERE id = ANY($1) AND sponsor_id = $2`,
      [org_ids, sponsorId]
    );
    const validIds = orgs.map((o) => o.id);
    if (!validIds.length) return res.json({ success: true, created: 0 });

    let created = 0;
    for (const orgId of validIds) {
      // Insert a 'requested' doc placeholder (same pattern as single requestDocument)
      await pool.query(
        `INSERT INTO documents
           (org_id, doc_type, label, file_url, file_name, uploaded_by, expires_at, status, rejection_note)
         VALUES ($1, $2, $3, '', '', $4, $5, 'requested', $6)`,
        [orgId, doc_type || 'general', label, req.user.id, due_date || null, message || '']
      );

      // Notify active users in this org
      const { rows: users } = await pool.query(
        'SELECT id FROM users WHERE org_id = $1 AND is_active = TRUE',
        [orgId]
      );
      if (users.length) {
        await createNotification(
          users.map((u) => ({
            userId:    u.id,
            type:      'document_missing',
            title:     'Document Requested',
            body:      `A document has been requested: ${label}. Please upload it as soon as possible.`,
            actionUrl: '/dashboard/kitchen/documents',
          }))
        );
      }
      created++;
    }

    res.json({ success: true, created });
  } catch (err) {
    console.error('request-bulk error:', err);
    res.status(500).json({ error: 'Failed to send bulk document requests.' });
  }
});

module.exports = router;
