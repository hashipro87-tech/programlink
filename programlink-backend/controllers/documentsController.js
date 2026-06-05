const pool   = require('../config/database');
const multer = require('multer');
const { uploadFile } = require('../services/storageService');
const { notifyCoordinators } = require('../services/notificationService');

exports.uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 },
}).single('file');

exports.listDocuments = async (req, res) => {
  try {
    const { org_id } = req.query;
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    if (org_id) { params.push(org_id); query += ` AND org_id = $${params.length}`; }
    else { params.push(req.user.organizationId); query += ` AND org_id = $${params.length}`; }
    query += ' ORDER BY uploaded_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ documents: rows });
  } catch (err) {
    console.error('listDocuments error:', err);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { doc_type, label, expires_at, org_id } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    let file_url = '';
    try {
      file_url = await uploadFile(file.buffer, file.originalname, file.mimetype);
    } catch {
      file_url = `uploads/${Date.now()}_${file.originalname}`;
    }

    const { rows } = await pool.query(
      `INSERT INTO documents (org_id, doc_type, label, file_url, file_name, uploaded_by, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [org_id || req.user.organizationId, doc_type, label, file_url, file.originalname, req.user.id, expires_at || null]
    );

    // Notify coordinators that a new document was uploaded
    const org = await pool.query('SELECT name, sponsor_id FROM organizations WHERE id = $1', [org_id || req.user.organizationId]);
    if (org.rows[0]?.sponsor_id) {
      notifyCoordinators(org.rows[0].sponsor_id, {
        type:      'document_uploaded',
        title:     'New document uploaded',
        body:      `${org.rows[0].name} uploaded: ${label || doc_type}`,
        actionUrl: `/dashboard/coordinator/documents`,
      }).catch(() => {});
    }

    res.status(201).json({ document: rows[0] });
  } catch (err) {
    console.error('uploadDocument error:', err);
    res.status(500).json({ error: 'Failed to upload document.' });
  }
};

exports.updateDocumentStatus = async (req, res) => {
  try {
    const { status, rejection_note } = req.body;
    const { rows } = await pool.query(
      `UPDATE documents SET status = $1, rejection_note = $2 WHERE id = $3 RETURNING *`,
      [status, rejection_note || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Document not found.' });
    res.json({ document: rows[0] });
  } catch (err) {
    console.error('updateDocumentStatus error:', err);
    res.status(500).json({ error: 'Failed to update document status.' });
  }
};

exports.getExpiringDocuments = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.*, o.name AS org_name FROM documents d
       JOIN organizations o ON o.id = d.org_id
       WHERE d.expires_at IS NOT NULL
         AND d.expires_at <= NOW() + INTERVAL '30 days'
         AND d.expires_at > NOW()
         AND d.status != 'expired'
       ORDER BY d.expires_at ASC`
    );
    res.json({ documents: rows });
  } catch (err) {
    console.error('getExpiringDocuments error:', err);
    res.status(500).json({ error: 'Failed to fetch expiring documents.' });
  }
};
