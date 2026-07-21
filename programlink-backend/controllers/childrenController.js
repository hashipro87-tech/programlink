// childrenController.js — Child roster management
// Sponsors see all children across their orgs
// Sites see only their own children

const pool = require('../config/database');

// ── GET /children ─────────────────────────────────────────────────────────────
// Sponsor: all children across their sites/kitchens (with org filter)
// Site/Kitchen: only their own children
async function listChildren(req, res) {
  try {
    const { role, organizationId } = req.user;
    const { org_id, status, age_group, search, limit = 100, offset = 0 } = req.query;

    let query, params;

    if (role === 'sponsor' || role === 'coordinator' || role === 'admin') {
      // Sponsor sees all children across all their orgs
      let where = `WHERE o.sponsor_id = $1`;
      params = [organizationId];
      let idx = 2;

      if (org_id) {
        where += ` AND c.org_id = $${idx++}`;
        params.push(org_id);
      }
      if (status) {
        where += ` AND c.enrollment_status = $${idx++}`;
        params.push(status);
      }
      if (age_group) {
        where += ` AND c.age_group = $${idx++}`;
        params.push(age_group);
      }
      if (search) {
        where += ` AND (c.first_name ILIKE $${idx} OR c.last_name ILIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
      }

      const countRes = await pool.query(
        `SELECT COUNT(*) FROM children c
         JOIN organizations o ON o.id = c.org_id
         ${where}`,
        params
      );

      query = `
        SELECT c.*, o.name AS org_name, o.type AS org_type
        FROM children c
        JOIN organizations o ON o.id = c.org_id
        ${where}
        ORDER BY c.last_name, c.first_name
        LIMIT $${idx} OFFSET $${idx + 1}
      `;
      params.push(Number(limit), Number(offset));

      const { rows } = await pool.query(query, params);
      return res.json({
        children: rows,
        total: Number(countRes.rows[0].count),
        limit: Number(limit),
        offset: Number(offset),
      });

    } else {
      // Site or kitchen: only their own children
      let where = `WHERE c.org_id = $1`;
      params = [organizationId];
      let idx = 2;

      if (status) {
        where += ` AND c.enrollment_status = $${idx++}`;
        params.push(status);
      }
      if (age_group) {
        where += ` AND c.age_group = $${idx++}`;
        params.push(age_group);
      }
      if (search) {
        where += ` AND (c.first_name ILIKE $${idx} OR c.last_name ILIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
      }

      const countRes = await pool.query(
        `SELECT COUNT(*) FROM children c ${where}`, params
      );

      query = `
        SELECT c.*
        FROM children c
        ${where}
        ORDER BY c.last_name, c.first_name
        LIMIT $${idx} OFFSET $${idx + 1}
      `;
      params.push(Number(limit), Number(offset));

      const { rows } = await pool.query(query, params);
      return res.json({
        children: rows,
        total: Number(countRes.rows[0].count),
        limit: Number(limit),
        offset: Number(offset),
      });
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
      org_id,
      first_name,
      last_name,
      birthdate,
      enrollment_status = 'enrolled',
      income_tier = 'tier1',
      age_group,
      enrollment_date,
      parent_name,
      parent_phone,
      notes,
    } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First and last name are required' });
    }

    // Determine which org this child belongs to
    const targetOrgId = (role === 'sponsor' || role === 'admin') ? org_id : organizationId;
    if (!targetOrgId) return res.status(400).json({ error: 'org_id is required' });

    // Auto-calculate age_group from birthdate if not provided
    let calculatedAgeGroup = age_group;
    if (!calculatedAgeGroup && birthdate) {
      const ageMonths = Math.floor((Date.now() - new Date(birthdate)) / (1000 * 60 * 60 * 24 * 30.44));
      if (ageMonths < 6)        calculatedAgeGroup = 'infant_0_5';
      else if (ageMonths < 12)  calculatedAgeGroup = 'infant_6_11';
      else if (ageMonths < 36)  calculatedAgeGroup = 'toddler';
      else if (ageMonths < 72)  calculatedAgeGroup = 'preschool';
      else                       calculatedAgeGroup = 'school_age';
    }

    const { rows } = await pool.query(
      `INSERT INTO children
         (org_id, first_name, last_name, birthdate, enrollment_status, income_tier,
          age_group, enrollment_date, parent_name, parent_phone, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [targetOrgId, first_name, last_name, birthdate || null, enrollment_status,
       income_tier, calculatedAgeGroup || null, enrollment_date || null,
       parent_name || null, parent_phone || null, notes || null]
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
      income_tier, age_group, enrollment_date, parent_name, parent_phone, notes,
    } = req.body;

    // Verify ownership
    const existing = await pool.query('SELECT * FROM children WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Child not found' });

    const child = existing.rows[0];
    if (role !== 'sponsor' && role !== 'admin' && child.org_id !== organizationId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { rows } = await pool.query(
      `UPDATE children SET
         first_name = COALESCE($1, first_name),
         last_name  = COALESCE($2, last_name),
         birthdate  = COALESCE($3, birthdate),
         enrollment_status = COALESCE($4, enrollment_status),
         income_tier = COALESCE($5, income_tier),
         age_group   = COALESCE($6, age_group),
         enrollment_date = COALESCE($7, enrollment_date),
         parent_name  = COALESCE($8, parent_name),
         parent_phone = COALESCE($9, parent_phone),
         notes = COALESCE($10, notes),
         updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [first_name, last_name, birthdate, enrollment_status, income_tier,
       age_group, enrollment_date, parent_name, parent_phone, notes, id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('updateChild error:', err);
    res.status(500).json({ error: 'Failed to update child record' });
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
// Quick counts per org — used on sponsor overview
async function getChildrenSummary(req, res) {
  try {
    const { organizationId } = req.user;

    const { rows } = await pool.query(
      `SELECT
         o.id AS org_id,
         o.name AS org_name,
         o.type AS org_type,
         COUNT(c.id)                                          AS total,
         COUNT(c.id) FILTER (WHERE c.enrollment_status = 'enrolled')  AS enrolled,
         COUNT(c.id) FILTER (WHERE c.enrollment_status = 'inactive')  AS inactive,
         COUNT(c.id) FILTER (WHERE c.enrollment_status = 'pending')   AS pending
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

module.exports = { listChildren, createChild, updateChild, deleteChild, getChildrenSummary };
