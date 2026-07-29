// childrenController.js — Child roster + enrollment compliance management
const pool = require('../config/database');

// Required fields for a complete enrollment form
const REQUIRED_FIELDS = [
  'first_name', 'last_name', 'birthdate', 'parent_name',
  'parent_phone', 'days_enrolled', 'meal_types', 'income_tier',
];

function getMissingFields(child) {
  return REQUIRED_FIELDS.filter(f => !child[f] || String(child[f]).trim() === '');
}

function calcAgeGroup(birthdate) {
  if (!birthdate) return null;
  const months = Math.floor((Date.now() - new Date(birthdate)) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 6)   return 'infant_0_5';
  if (months < 12)  return 'infant_6_11';
  if (months < 36)  return 'toddler';
  if (months < 72)  return 'preschool';
  return 'school_age';
}

// ── GET /children ─────────────────────────────────────────────────────────────
async function listChildren(req, res) {
  try {
    const { role, organizationId } = req.user;
    const { org_id, status, age_group, form_status, search, limit = 100, offset = 0 } = req.query;

    let query, params;

    if (role === 'sponsor' || role === 'coordinator' || role === 'admin') {
      let where = `WHERE o.sponsor_id = $1`;
      params = [organizationId];
      let idx = 2;

      if (org_id)      { where += ` AND c.org_id = $${idx++}`;            params.push(org_id); }
      if (status)      { where += ` AND c.enrollment_status = $${idx++}`;  params.push(status); }
      if (age_group)   { where += ` AND c.age_group = $${idx++}`;          params.push(age_group); }
      if (form_status) { where += ` AND c.form_status = $${idx++}`;        params.push(form_status); }
      if (search) {
        where += ` AND (c.first_name ILIKE $${idx} OR c.last_name ILIKE $${idx})`;
        params.push(`%${search}%`); idx++;
      }

      const countRes = await pool.query(
        `SELECT COUNT(*) FROM children c JOIN organizations o ON o.id = c.org_id ${where}`, params
      );
      query = `
        SELECT c.*, o.name AS org_name, o.type AS org_type
        FROM children c JOIN organizations o ON o.id = c.org_id
        ${where}
        ORDER BY c.last_name, c.first_name
        LIMIT $${idx} OFFSET $${idx + 1}
      `;
      params.push(Number(limit), Number(offset));
      const { rows } = await pool.query(query, params);
      return res.json({ children: rows, total: Number(countRes.rows[0].count), limit: Number(limit), offset: Number(offset) });

    } else {
      let where = `WHERE c.org_id = $1`;
      params = [organizationId];
      let idx = 2;

      if (status)      { where += ` AND c.enrollment_status = $${idx++}`; params.push(status); }
      if (age_group)   { where += ` AND c.age_group = $${idx++}`;         params.push(age_group); }
      if (form_status) { where += ` AND c.form_status = $${idx++}`;       params.push(form_status); }
      if (search) {
        where += ` AND (c.first_name ILIKE $${idx} OR c.last_name ILIKE $${idx})`;
        params.push(`%${search}%`); idx++;
      }

      const countRes = await pool.query(`SELECT COUNT(*) FROM children c ${where}`, params);
      query = `SELECT c.* FROM children c ${where} ORDER BY c.last_name, c.first_name LIMIT $${idx} OFFSET $${idx + 1}`;
      params.push(Number(limit), Number(offset));
      const { rows } = await pool.query(query, params);
      return res.json({ children: rows, total: Number(countRes.rows[0].count), limit: Number(limit), offset: Number(offset) });
    }
  } catch (err) {
    console.error('listChildren error:', err);
    res.status(500).json({ error: 'Failed to load children' });
  }
}

// ── POST /children ────────────────────────────────────────────────────────────
async function createChild(req, res) {
  try {
    const { role, organizationId } = req.user;
    const {
      org_id, first_name, last_name, birthdate,
      enrollment_status = 'enrolled', income_tier = 'tier1', age_group,
      enrollment_date, enrollment_expires,
      parent_name, parent_phone, parent_email,
      days_enrolled, meal_types,
      income_cert_date, income_cert_expires,
      signature_obtained = false,
      notes,
    } = req.body;

    if (!first_name || !last_name) return res.status(400).json({ error: 'First and last name are required' });

    const targetOrgId = (role === 'sponsor' || role === 'admin') ? org_id : organizationId;
    if (!targetOrgId) return res.status(400).json({ error: 'org_id is required' });

    const ageGrp = age_group || calcAgeGroup(birthdate);

    const { rows } = await pool.query(
      `INSERT INTO children
         (org_id, first_name, last_name, birthdate, enrollment_status, income_tier,
          age_group, enrollment_date, enrollment_expires,
          parent_name, parent_phone, parent_email,
          days_enrolled, meal_types,
          income_cert_date, income_cert_expires,
          signature_obtained, notes, form_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'draft')
       RETURNING *`,
      [targetOrgId, first_name, last_name, birthdate || null, enrollment_status,
       income_tier, ageGrp || null, enrollment_date || null, enrollment_expires || null,
       parent_name || null, parent_phone || null, parent_email || null,
       days_enrolled || null, meal_types || null,
       income_cert_date || null, income_cert_expires || null,
       signature_obtained || false, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createChild error:', err);
    res.status(500).json({ error: 'Failed to create child record' });
  }
}

// ── PUT /children/:id ─────────────────────────────────────────────────────────
async function updateChild(req, res) {
  try {
    const { id } = req.params;
    const { organizationId, role } = req.user;
    const {
      first_name, last_name, birthdate, enrollment_status,
      income_tier, age_group, enrollment_date, enrollment_expires,
      parent_name, parent_phone, parent_email,
      days_enrolled, meal_types,
      income_cert_date, income_cert_expires,
      signature_obtained, notes,
    } = req.body;

    const existing = await pool.query('SELECT * FROM children WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Child not found' });
    const child = existing.rows[0];
    if (role !== 'sponsor' && role !== 'admin' && child.org_id !== organizationId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // If a site edits a previously-approved form, reset to draft for re-review
    const wasApproved = child.form_status === 'approved';
    const keyFieldChanged = [first_name, last_name, birthdate, parent_name, parent_phone,
      days_enrolled, meal_types, income_tier].some(f => f !== undefined);
    const newFormStatus = (wasApproved && keyFieldChanged && role !== 'sponsor' && role !== 'admin')
      ? 'draft' : undefined;

    const { rows } = await pool.query(
      `UPDATE children SET
         first_name          = COALESCE($1,  first_name),
         last_name           = COALESCE($2,  last_name),
         birthdate           = COALESCE($3,  birthdate),
         enrollment_status   = COALESCE($4,  enrollment_status),
         income_tier         = COALESCE($5,  income_tier),
         age_group           = COALESCE($6,  age_group),
         enrollment_date     = COALESCE($7,  enrollment_date),
         enrollment_expires  = COALESCE($8,  enrollment_expires),
         parent_name         = COALESCE($9,  parent_name),
         parent_phone        = COALESCE($10, parent_phone),
         parent_email        = COALESCE($11, parent_email),
         days_enrolled       = COALESCE($12, days_enrolled),
         meal_types          = COALESCE($13, meal_types),
         income_cert_date    = COALESCE($14, income_cert_date),
         income_cert_expires = COALESCE($15, income_cert_expires),
         signature_obtained  = COALESCE($16, signature_obtained),
         notes               = COALESCE($17, notes),
         form_status         = COALESCE($18, form_status),
         updated_at          = NOW()
       WHERE id = $19
       RETURNING *`,
      [first_name, last_name, birthdate, enrollment_status, income_tier, age_group,
       enrollment_date, enrollment_expires, parent_name, parent_phone, parent_email,
       days_enrolled, meal_types, income_cert_date, income_cert_expires,
       signature_obtained, notes, newFormStatus, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('updateChild error:', err);
    res.status(500).json({ error: 'Failed to update child record' });
  }
}

// ── POST /children/:id/submit ─────────────────────────────────────────────────
// Site submits an enrollment form — validates all required fields first
async function submitEnrollmentForm(req, res) {
  try {
    const { id } = req.params;
    const { organizationId, role } = req.user;

    const existing = await pool.query('SELECT * FROM children WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Child not found' });
    const child = existing.rows[0];

    if (role !== 'sponsor' && role !== 'admin' && child.org_id !== organizationId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const missing = getMissingFields(child);
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Enrollment form is incomplete', missing_fields: missing });
    }
    if (!child.signature_obtained) {
      return res.status(400).json({ error: 'Parent/guardian signature is required before submission' });
    }

    const { rows } = await pool.query(
      `UPDATE children SET form_status = 'submitted', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    // Notify sponsor users (best-effort)
    try {
      const orgRes = await pool.query(`SELECT sponsor_id FROM organizations WHERE id = $1`, [child.org_id]);
      if (orgRes.rows[0]?.sponsor_id) {
        const sponsorUsers = await pool.query(
          `SELECT id FROM users WHERE org_id = $1 AND is_active = TRUE`, [orgRes.rows[0].sponsor_id]
        );
        if (sponsorUsers.rows.length) {
          const { createNotification } = require('../services/notificationService');
          await createNotification(sponsorUsers.rows.map(u => ({
            userId: u.id, type: 'general',
            title: `📋 Enrollment form submitted`,
            body: `${child.first_name} ${child.last_name}'s enrollment form is ready for review.`,
            actionUrl: '/dashboard/sponsor/children',
          })));
        }
      }
    } catch (e) { /* non-fatal */ }

    res.json(rows[0]);
  } catch (err) {
    console.error('submitEnrollmentForm error:', err);
    res.status(500).json({ error: 'Failed to submit enrollment form' });
  }
}

// ── POST /children/:id/review ─────────────────────────────────────────────────
// Sponsor approves or rejects an enrollment form
async function reviewEnrollmentForm(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.user;
    const { decision, rejection_reason } = req.body;

    if (role !== 'sponsor' && role !== 'admin') {
      return res.status(403).json({ error: 'Only sponsors can review enrollment forms' });
    }
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be approved or rejected' });
    }

    const existing = await pool.query('SELECT * FROM children WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Child not found' });
    const child = existing.rows[0];

    const { rows } = await pool.query(
      `UPDATE children SET
         form_status = $1,
         notes = CASE WHEN $2::text IS NOT NULL
                      THEN COALESCE(notes,'') || E'\nRejection: ' || $2
                      ELSE notes END,
         updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [decision, rejection_reason || null, id]
    );

    // Notify site (best-effort)
    try {
      const siteUsers = await pool.query(
        `SELECT id FROM users WHERE org_id = $1 AND is_active = TRUE`, [child.org_id]
      );
      if (siteUsers.rows.length) {
        const { createNotification } = require('../services/notificationService');
        const isApproved = decision === 'approved';
        await createNotification(siteUsers.rows.map(u => ({
          userId: u.id, type: 'general',
          title: isApproved ? `✅ Enrollment form approved` : `❌ Enrollment form needs corrections`,
          body: isApproved
            ? `${child.first_name} ${child.last_name}'s enrollment form has been approved.`
            : `${child.first_name} ${child.last_name}'s form was rejected. ${rejection_reason || 'Please correct and resubmit.'}`,
          actionUrl: '/dashboard/site/enrollment',
        })));
      }
    } catch (e) { /* non-fatal */ }

    res.json(rows[0]);
  } catch (err) {
    console.error('reviewEnrollmentForm error:', err);
    res.status(500).json({ error: 'Failed to review enrollment form' });
  }
}

// ── DELETE /children/:id ──────────────────────────────────────────────────────
async function deleteChild(req, res) {
  try {
    const { id } = req.params;
    const { organizationId, role } = req.user;
    const existing = await pool.query('SELECT * FROM children WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Child not found' });
    const child = existing.rows[0];
    if (role !== 'sponsor' && role !== 'admin' && child.org_id !== organizationId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await pool.query('DELETE FROM children WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteChild error:', err);
    res.status(500).json({ error: 'Failed to delete child record' });
  }
}

// ── GET /children/summary ─────────────────────────────────────────────────────
async function getChildrenSummary(req, res) {
  try {
    const { organizationId } = req.user;
    const { rows } = await pool.query(
      `SELECT
         o.id AS org_id, o.name AS org_name, o.type AS org_type,
         COUNT(c.id)                                                   AS total,
         COUNT(c.id) FILTER (WHERE c.enrollment_status = 'enrolled')  AS enrolled,
         COUNT(c.id) FILTER (WHERE c.form_status = 'approved')        AS forms_approved,
         COUNT(c.id) FILTER (WHERE c.form_status = 'submitted')       AS forms_submitted,
         COUNT(c.id) FILTER (WHERE c.form_status IN ('draft','rejected')) AS forms_incomplete,
         COUNT(c.id) FILTER (WHERE c.enrollment_expires <= NOW() + INTERVAL '30 days'
                              AND c.enrollment_expires > NOW())        AS expiring_soon
       FROM organizations o
       LEFT JOIN children c ON c.org_id = o.id
       WHERE o.sponsor_id = $1
       GROUP BY o.id, o.name, o.type
       ORDER BY o.name`,
      [organizationId]
    );
    res.json({ orgs: rows });
  } catch (err) {
    console.error('getChildrenSummary error:', err);
    res.status(500).json({ error: 'Failed to load children summary' });
  }
}

// ── GET /children/compliance ──────────────────────────────────────────────────
async function getEnrollmentCompliance(req, res) {
  try {
    const { organizationId } = req.user;
    const [totalsRes, pendingRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)                                                          AS total,
           COUNT(*) FILTER (WHERE c.form_status = 'approved')              AS forms_approved,
           COUNT(*) FILTER (WHERE c.form_status = 'submitted')             AS forms_submitted,
           COUNT(*) FILTER (WHERE c.form_status IN ('draft','rejected'))   AS forms_incomplete,
           COUNT(*) FILTER (WHERE c.enrollment_expires <= NOW() + INTERVAL '30 days'
                             AND c.enrollment_expires > NOW())              AS expiring_soon,
           COUNT(*) FILTER (WHERE c.enrollment_expires < NOW())            AS expired
         FROM children c
         JOIN organizations o ON o.id = c.org_id
         WHERE o.sponsor_id = $1`,
        [organizationId]
      ),
      pool.query(
        `SELECT c.id, c.first_name, c.last_name, c.form_status, o.name AS org_name
         FROM children c
         JOIN organizations o ON o.id = c.org_id
         WHERE o.sponsor_id = $1 AND c.form_status = 'submitted'
         ORDER BY c.last_name, c.first_name
         LIMIT 20`,
        [organizationId]
      ),
    ]);
    const t   = totalsRes.rows[0];
    const tot = Number(t.total);
    const pct = tot > 0 ? Math.round((Number(t.forms_approved) / tot) * 100) : 100;
    res.json({ ...t, audit_ready_pct: pct, pending_review: pendingRes.rows });
  } catch (err) {
    console.error('getEnrollmentCompliance error:', err);
    res.status(500).json({ error: 'Failed to load enrollment compliance' });
  }
}

// ── POST /children/import/extract ─────────────────────────────────────────────
// Accepts a PDF or image file, sends to Claude, returns structured child data
async function extractEnrollment(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ALLOWED_TYPES = ['application/pdf','image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: `Unsupported file type: ${req.file.mimetype}. Please upload a PDF, JPG, PNG, or WebP. iPhone HEIC photos must be converted to JPG first.`,
      });
    }

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const PROMPT = `You are extracting child enrollment information from a CACFP childcare program document.

Extract every child listed. For each child return EXACTLY this JSON structure:
{
  "first_name": string or null,
  "last_name": string or null,
  "birthdate": "YYYY-MM-DD" or null,
  "parent_name": string or null,
  "parent_phone": string or null,
  "meal_types": comma-separated string using only these values: breakfast,lunch,snack,supper — or null,
  "enrollment_date": "YYYY-MM-DD" or null,
  "enrollment_expires": "YYYY-MM-DD" or null,
  "income_tier": "tier1" or "tier2" or "tier3" (use tier1 if unclear)
}

Return ONLY a valid JSON array. No explanation. No markdown fences. Just the array.
If no children are found, return [].`;

    let content;

    if (req.file.mimetype === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(req.file.buffer);
      content = [{ type: 'text', text: PROMPT + '\n\nDocument text:\n' + data.text }];
    } else {
      // Image (jpg, png, heic, webp)
      const mediaType = req.file.mimetype === 'image/jpg' ? 'image/jpeg' : req.file.mimetype;
      content = [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: req.file.buffer.toString('base64') } },
        { type: 'text', text: PROMPT },
      ];
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    });

    const raw     = message.content[0].text.trim();
    const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    const children = JSON.parse(jsonStr);

    if (!Array.isArray(children)) throw new Error('Unexpected response format');

    res.json({ children, count: children.length });
  } catch (err) {
    console.error('extractEnrollment error:', err);
    res.status(500).json({ error: 'Failed to extract enrollment data', detail: err.message });
  }
}

// ── POST /children/import/confirm ─────────────────────────────────────────────
// Bulk-inserts the reviewed + confirmed children into the DB
async function confirmImport(req, res) {
  try {
    const { organizationId, role } = req.user;
    const { children, org_id } = req.body;

    if (!Array.isArray(children) || !children.length) {
      return res.status(400).json({ error: 'No children to import' });
    }

    // Sponsors can import to a specific site; sites import to themselves
    const targetOrgId = (role === 'sponsor' || role === 'admin') && org_id ? org_id : organizationId;

    const inserted = [];
    for (const child of children) {
      if (!child.first_name && !child.last_name) continue;
      const ageGroup = calcAgeGroup(child.birthdate);
      const { rows } = await pool.query(
        `INSERT INTO children (
           org_id, first_name, last_name, birthdate, parent_name, parent_phone,
           meal_types, enrollment_date, enrollment_expires, income_tier,
           age_group, enrollment_status, form_status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'enrolled','draft')
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [
          targetOrgId,
          (child.first_name || '').trim(),
          (child.last_name  || '').trim(),
          child.birthdate         || null,
          child.parent_name       || null,
          child.parent_phone      || null,
          child.meal_types        || null,
          child.enrollment_date   || null,
          child.enrollment_expires|| null,
          child.income_tier       || 'tier1',
          ageGroup,
        ]
      );
      if (rows[0]) inserted.push(rows[0]);
    }

    res.json({ imported: inserted.length, children: inserted });
  } catch (err) {
    console.error('confirmImport error:', err);
    res.status(500).json({ error: 'Import failed', detail: err.message });
  }
}

module.exports = {
  listChildren, createChild, updateChild, deleteChild,
  getChildrenSummary, getEnrollmentCompliance,
  submitEnrollmentForm, reviewEnrollmentForm,
  extractEnrollment, confirmImport,
};
