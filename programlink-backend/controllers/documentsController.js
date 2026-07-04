const pool   = require('../config/database');
const multer = require('multer');
const { uploadFile } = require('../services/storageService');
const { createNotification, notifyCoordinators, notifySponsors } = require('../services/notificationService');

exports.uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 },
}).single('file');

// Compute live expiry status — called on every fetch so statuses stay accurate
function applyExpiryStatus(doc) {
  if (!doc.expires_at) return doc;
  const now       = new Date();
  const expiresAt = new Date(doc.expires_at);
  const daysLeft  = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
  let derivedStatus = doc.status;
  if (daysLeft < 0) derivedStatus = 'expired';
  else if (daysLeft <= 30 && doc.status === 'valid') derivedStatus = 'expiring_soon';
  return { ...doc, status: derivedStatus, days_until_expiry: daysLeft };
}

// ─── List documents ───────────────────────────────────────────────────────────
exports.listDocuments = async (req, res) => {
  try {
    const { role, organizationId } = req.user;
    const filterOrgId = req.query.org_id  || null;
    const limit       = Math.min(parseInt(req.query.limit  || '100', 10), 500);
    const offset      = parseInt(req.query.offset || '0', 10);

    let rows;

    if (['sponsor', 'coordinator', 'admin'].includes(role)) {
      // Sponsors / coordinators see ALL documents from orgs in their program.
      const baseQuery = `
        SELECT d.*,
               o.name     AS org_name,
               o.type     AS org_type,
               u.name     AS uploaded_by_name,
               u.role     AS uploaded_by_role
        FROM documents d
        JOIN organizations o ON o.id = d.org_id
        LEFT JOIN users u ON u.id = d.uploaded_by
        WHERE (o.sponsor_id = $1 OR o.id = $1)
      `;
      const params = [organizationId];

      if (filterOrgId) {
        params.push(filterOrgId, limit, offset);
        const { rows: r } = await pool.query(
          baseQuery + ` AND d.org_id = $2 ORDER BY d.uploaded_at DESC LIMIT $3 OFFSET $4`,
          params
        );
        rows = r;
      } else {
        params.push(limit, offset);
        const { rows: r } = await pool.query(
          baseQuery + ` ORDER BY d.uploaded_at DESC LIMIT $2 OFFSET $3`,
          params
        );
        rows = r;
      }
    } else {
      // Kitchen / site / delivery — own org only.
      const { rows: r } = await pool.query(
        `SELECT d.*,
                u.name  AS uploaded_by_name,
                u.role  AS uploaded_by_role
         FROM documents d
         LEFT JOIN users u ON u.id = d.uploaded_by
         WHERE d.org_id = $1
         ORDER BY d.uploaded_at DESC
         LIMIT $2 OFFSET $3`,
        [organizationId, limit, offset]
      );
      rows = r;
    }

    res.json({ documents: rows.map(applyExpiryStatus) });
  } catch (err) {
    console.error('listDocuments error:', err);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
};

// ─── Upload document ──────────────────────────────────────────────────────────
exports.uploadDocument = async (req, res) => {
  try {
    const { doc_type, label, expires_at, org_id } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    // Upload to storage (returns { url, key } or just a url string)
    let file_url = '';
    try {
      const result = await uploadFile(file.buffer, file.originalname, file.mimetype);
      file_url = result?.url ?? result ?? '';
    } catch {
      file_url = `uploads/${Date.now()}_${file.originalname}`;
    }

    const targetOrgId = org_id || req.user.organizationId;

    // Check if a previous version exists for this doc_type+org — increment version
    const prev = await pool.query(
      `SELECT MAX(version) AS max_v FROM documents
       WHERE org_id = $1 AND doc_type = $2 AND file_url != '' AND status != 'requested'`,
      [targetOrgId, doc_type || 'general']
    );
    const nextVersion = (prev.rows[0]?.max_v ?? 0) + 1;

    // Supersede any 'requested' placeholder for this doc_type+org
    await pool.query(
      `UPDATE documents SET status = 'superseded'
       WHERE org_id = $1 AND doc_type = $2 AND status = 'requested'`,
      [targetOrgId, doc_type || 'general']
    );

    const { rows } = await pool.query(
      `INSERT INTO documents (org_id, doc_type, label, file_url, file_name, uploaded_by, expires_at, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        targetOrgId,
        doc_type || 'general',
        label || doc_type || 'Document',
        file_url,
        file.originalname,
        req.user.id,
        expires_at || null,
        nextVersion,
      ]
    );
    const doc = rows[0];

    // Notify sponsors AND coordinators when any org uploads a document
    const org = await pool.query(
      'SELECT name, org_type, sponsor_id FROM organizations WHERE id = $1',
      [targetOrgId]
    );
    const sponsorId = org.rows[0]?.sponsor_id;
    const orgName   = org.rows[0]?.name ?? 'An organization';

    if (sponsorId) {
      const baseNotif = {
        type:      'document_uploaded',
        title:     `New document uploaded`,
        body:      `${orgName} uploaded: ${label || doc_type} (v${nextVersion})`,
      };
      notifyCoordinators(sponsorId, { ...baseNotif, actionUrl: '/dashboard/coordinator/documents' }).catch(() => {});
      notifySponsors(sponsorId,     { ...baseNotif, actionUrl: '/dashboard/sponsor/documents' }).catch(() => {});
    }

    res.status(201).json({ document: doc });
  } catch (err) {
    console.error('uploadDocument error:', err);
    res.status(500).json({ error: 'Failed to upload document.' });
  }
};

// ─── Request a document from an org ─────────────────────────────────────────
exports.requestDocument = async (req, res) => {
  try {
    const { org_id, doc_type, label, due_date, message } = req.body;
    if (!org_id) return res.status(400).json({ error: 'org_id is required.' });
    if (!label)  return res.status(400).json({ error: 'Document label is required.' });

    // Store as a placeholder document with status='requested'
    const { rows } = await pool.query(
      `INSERT INTO documents
         (org_id, doc_type, label, file_url, file_name, uploaded_by, expires_at, status, rejection_note)
       VALUES ($1, $2, $3, '', '', $4, $5, 'requested', $6) RETURNING *`,
      [
        org_id,
        doc_type || 'general',
        label,
        req.user.id,
        due_date || null,
        message || '',
      ]
    );
    const doc = rows[0];

    // Notify all active users at the target org
    const orgUsersResult = await pool.query(
      'SELECT id FROM users WHERE org_id = $1 AND is_active = TRUE',
      [org_id]
    );
    if (orgUsersResult.rows.length > 0) {
      const dueStr = due_date
        ? new Date(due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'soon';
      await createNotification(
        orgUsersResult.rows.map((u) => ({
          userId:    u.id,
          type:      'document_missing',
          title:     `Document Requested: ${label}`,
          body:      message || `Please upload your ${label} by ${dueStr}.`,
          actionUrl: '/dashboard/kitchen/documents',
        }))
      );
    }

    res.status(201).json({ document: doc });
  } catch (err) {
    console.error('requestDocument error:', err);
    res.status(500).json({ error: 'Failed to send document request.' });
  }
};

// ─── Update document status (approve / reject / request changes) ─────────────
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { status, rejection_note } = req.body;

    // Try to record reviewer — if the column doesn't exist yet, fall back gracefully
    let rows;
    try {
      const result = await pool.query(
        `UPDATE documents
            SET status = $1, rejection_note = $2, reviewed_by = $3, reviewed_at = NOW()
          WHERE id = $4
          RETURNING *`,
        [status, rejection_note || null, req.user.id, req.params.id]
      );
      rows = result.rows;
    } catch {
      const result = await pool.query(
        `UPDATE documents SET status = $1, rejection_note = $2 WHERE id = $3 RETURNING *`,
        [status, rejection_note || null, req.params.id]
      );
      rows = result.rows;
    }

    if (!rows.length) return res.status(404).json({ error: 'Document not found.' });
    const doc = rows[0];

    // If rejected, notify the uploader
    if (status === 'rejected' && doc.uploaded_by) {
      createNotification({
        userId:    doc.uploaded_by,
        type:      'document_rejected',
        title:     `Document Rejected: ${doc.label || doc.doc_type}`,
        body:      rejection_note || 'Please re-upload with the required changes.',
        actionUrl: '/dashboard/kitchen/documents',
      }).catch(() => {});
    }

    // If approved, notify the uploader
    if ((status === 'valid' || status === 'approved') && doc.uploaded_by) {
      createNotification({
        userId:    doc.uploaded_by,
        type:      'document_uploaded',
        title:     `Document Approved: ${doc.label || doc.doc_type}`,
        body:      'Your document has been reviewed and approved.',
        actionUrl: '/dashboard/kitchen/documents',
      }).catch(() => {});
    }

    res.json({ document: doc });
  } catch (err) {
    console.error('updateDocumentStatus error:', err);
    res.status(500).json({ error: 'Failed to update document status.' });
  }
};

// ─── Get expiring documents ───────────────────────────────────────────────────
exports.getExpiringDocuments = async (req, res) => {
  try {
    const { organizationId, role } = req.user;

    let query, params;
    if (['sponsor', 'coordinator', 'admin'].includes(role)) {
      query = `
        SELECT d.*, o.name AS org_name FROM documents d
        JOIN organizations o ON o.id = d.org_id
        WHERE d.expires_at IS NOT NULL
          AND d.expires_at <= NOW() + INTERVAL '60 days'
          AND d.expires_at > NOW()
          AND d.status NOT IN ('expired', 'superseded', 'requested')
          AND (o.sponsor_id = $1 OR o.id = $1)
        ORDER BY d.expires_at ASC
      `;
    } else {
      query = `
        SELECT d.*, o.name AS org_name FROM documents d
        JOIN organizations o ON o.id = d.org_id
        WHERE d.expires_at IS NOT NULL
          AND d.expires_at <= NOW() + INTERVAL '60 days'
          AND d.expires_at > NOW()
          AND d.status NOT IN ('expired', 'superseded', 'requested')
          AND d.org_id = $1
        ORDER BY d.expires_at ASC
      `;
    }
    const { rows } = await pool.query(query, [organizationId]);
    res.json({ documents: rows });
  } catch (err) {
    console.error('getExpiringDocuments error:', err);
    res.status(500).json({ error: 'Failed to fetch expiring documents.' });
  }
};
