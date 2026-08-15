const pool = require('../config/database');
const { createNotification, notifyCoordinators, notifySponsors } = require('../services/notificationService');
const { sendApplicationStatusEmail } = require('../services/emailService');
const { logAction } = require('../services/auditService');
const { logActivity, TYPES } = require('../services/activityService');

exports.listApplications = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT a.*, o.name AS org_name, o.type AS org_type
      FROM applications a
      JOIN organizations o ON o.id = a.org_id
      WHERE 1=1`;
    const params = [];
    if (req.user.role === 'sponsor') {
      params.push(req.user.organizationId);
      query += ` AND a.sponsor_id = $${params.length}`;
    } else if (req.user.role === 'coordinator') {
      params.push(req.user.sponsorId);
      query += ` AND a.sponsor_id = $${params.length}`;
    } else {
      params.push(req.user.organizationId);
      query += ` AND a.org_id = $${params.length}`;
    }
    if (status) { params.push(status); query += ` AND a.status = $${params.length}`; }
    params.push(limit, offset);
    query += ` ORDER BY a.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const { rows } = await pool.query(query, params);
    res.json({ applications: rows });
  } catch (err) {
    console.error('listApplications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, o.name AS org_name, o.type AS org_type
       FROM applications a JOIN organizations o ON o.id = a.org_id
       WHERE a.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Application not found.' });
    res.json({ application: rows[0] });
  } catch (err) {
    console.error('getApplication error:', err);
    res.status(500).json({ error: 'Failed to fetch application.' });
  }
};

exports.createApplication = async (req, res) => {
  try {
    const { form_data } = req.body;

    // Auto-look up sponsor_id from the applicant's org (set when sponsor invited them)
    // Fall back to body param for backwards compat, then null
    let sponsor_id = req.body.sponsor_id ?? null;
    if (!sponsor_id && req.user.organizationId) {
      const { rows: orgRows } = await pool.query(
        'SELECT sponsor_id FROM organizations WHERE id = $1',
        [req.user.organizationId]
      );
      sponsor_id = orgRows[0]?.sponsor_id ?? null;
    }

    const { rows } = await pool.query(
      `INSERT INTO applications (org_id, sponsor_id, form_data, status)
       VALUES ($1,$2,$3,'draft') RETURNING *`,
      [req.user.organizationId, sponsor_id, form_data ? JSON.stringify(form_data) : null]
    );
    res.status(201).json({ application: rows[0] });
  } catch (err) {
    console.error('createApplication error:', err);
    res.status(500).json({ error: 'Failed to create application.' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, notes, internal_notes, form_data } = req.body;
    const updates = [];
    const params = [];

    if (status) { params.push(status); updates.push(`status = $${params.length}`); }
    if (notes !== undefined) { params.push(notes); updates.push(`notes = $${params.length}`); }
    if (internal_notes !== undefined) { params.push(internal_notes); updates.push(`internal_notes = $${params.length}`); }
    if (form_data !== undefined) { params.push(JSON.stringify(form_data)); updates.push(`form_data = $${params.length}`); }
    if (status === 'submitted') { updates.push(`submitted_at = NOW()`); }
    if (['approved','rejected'].includes(status)) {
      params.push(req.user.id);
      updates.push(`reviewed_by = $${params.length}`, `reviewed_at = NOW()`);
    }
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE applications SET ${updates.join(', ')} WHERE id = $${params.length}
       RETURNING *,
         (SELECT name FROM organizations WHERE id = org_id) AS org_name,
         (SELECT type FROM organizations WHERE id = org_id) AS org_type`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Application not found.' });

    const app = rows[0];

    // ── Trigger notifications based on status change ──────────────────────
    if (status) {
      try {
        // Get the org's users to notify them
        const orgUsers = await pool.query(
          'SELECT id, name, email FROM users WHERE org_id = $1 AND is_active = TRUE',
          [app.org_id]
        );

        if (status === 'submitted') {
          // Notify coordinators + sponsors that a new application needs review
          await notifyCoordinators(app.sponsor_id, {
            type:      'pending_approval',
            title:     'New application submitted',
            body:      `${app.org_name} has submitted an application for review.`,
            actionUrl: `/dashboard/coordinator/applications`,
          });
          await notifySponsors(app.sponsor_id, {
            type:      'pending_approval',
            title:     'New application submitted',
            body:      `${app.org_name} has submitted an application for review.`,
            actionUrl: `/dashboard/sponsor/applications`,
          });
        }

        if (status === 'approved' || status === 'rejected') {
          // Notify all users in the applicant org
          if (orgUsers.rows.length) {
            await createNotification(orgUsers.rows.map((u) => ({
              userId:    u.id,
              type:      'application_status',
              title:     status === 'approved' ? 'Application approved!' : 'Application not approved',
              body:      status === 'approved'
                ? 'Your application has been approved. You can now use all program features.'
                : `Your application was not approved. ${notes ? `Note: ${notes}` : ''}`,
              actionUrl: `/dashboard/${app.org_type}/application`,
            })));

            // Also send email
            for (const u of orgUsers.rows) {
              sendApplicationStatusEmail(u.email, u.name, app.org_name, status, notes)
                .catch((err) => console.error('Failed to send status email:', err.message));
            }
          }
        }
      } catch (notifErr) {
        console.error('Notification error (non-fatal):', notifErr.message);
      }
    }

    // Audit log
    if (status) {
      logAction({
        actor:      req.user,
        action:     `application.${status}`,
        entityType: 'application',
        entityId:   app.id,
        entityName: app.org_name,
        details:    { status, notes },
      });

      // Activity feed
      const typeMap = {
        submitted: TYPES.APPLICATION_SUBMITTED,
        approved:  TYPES.APPLICATION_APPROVED,
        rejected:  TYPES.APPLICATION_REJECTED,
        changes_requested: TYPES.APPLICATION_CHANGES,
      };
      if (typeMap[status]) {
        await logActivity({
          org_id: app.org_id,
          actor_id: req.user.id,
          type: typeMap[status],
          title: `Application ${status.replace('_', ' ')}: ${app.org_name}`,
          link: `/dashboard/sponsor/applications`,
        });
      }
    }

    res.json({ application: app });
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ error: 'Failed to update application.' });
  }
};
