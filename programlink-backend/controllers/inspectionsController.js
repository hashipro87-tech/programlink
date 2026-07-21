// inspectionsController.js — CACFP monitoring visit tracker
const pool = require('../config/database');

// ── GET /inspections ──────────────────────────────────────────────────────────
// Sponsor sees all inspections for all their orgs
// Coordinator sees inspections for their assigned orgs
// Site/kitchen sees their own org's inspections
async function listInspections(req, res) {
  try {
    const { organizationId, id: userId, role } = req.user;
    const { org_id, status, limit = 100, offset = 0 } = req.query;

    let where, params;

    if (role === 'sponsor' || role === 'admin') {
      // Sponsor sees all orgs under them + their own
      where = `WHERE (i.sponsor_org_id = $1 OR i.org_id = $1)`;
      params = [organizationId];
    } else if (role === 'coordinator') {
      // Coordinator sees assigned orgs
      where = `WHERE i.org_id IN (
        SELECT org_id FROM coordinator_assignments WHERE coordinator_id = $1
      )`;
      params = [userId];
    } else {
      where = `WHERE i.org_id = $1`;
      params = [organizationId];
    }

    let idx = params.length + 1;
    if (org_id) { where += ` AND i.org_id = $${idx++}`;  params.push(org_id); }
    if (status)  { where += ` AND i.status = $${idx++}`; params.push(status); }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM inspections i ${where}`, params
    );

    const { rows } = await pool.query(
      `SELECT i.*,
         o.name AS org_name, o.type AS org_type,
         u.first_name || ' ' || u.last_name AS created_by_name,
         (SELECT COUNT(*) FROM inspection_findings f WHERE f.inspection_id = i.id)                                      AS total_findings,
         (SELECT COUNT(*) FROM inspection_findings f WHERE f.inspection_id = i.id AND f.status = 'open')               AS open_findings,
         (SELECT COUNT(*) FROM inspection_findings f WHERE f.inspection_id = i.id AND f.status = 'resolved')           AS resolved_findings,
         (SELECT COUNT(*) FROM inspection_findings f WHERE f.inspection_id = i.id AND f.severity IN ('critical','major') AND f.status != 'resolved') AS critical_open
       FROM inspections i
       JOIN organizations o ON o.id = i.org_id
       LEFT JOIN users u ON u.id = i.created_by
       ${where}
       ORDER BY i.visit_date DESC, i.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Number(limit), Number(offset)]
    );

    res.json({ inspections: rows, total: Number(countRes.rows[0].count) });
  } catch (err) {
    console.error('listInspections error:', err);
    res.status(500).json({ error: 'Failed to load inspections' });
  }
}

// ── GET /inspections/:id/findings ─────────────────────────────────────────────
async function listFindings(req, res) {
  try {
    const { id } = req.params;
    const { organizationId, id: userId, role } = req.user;

    // Verify access to this inspection
    let accessCheck;
    if (role === 'sponsor' || role === 'admin') {
      accessCheck = await pool.query(
        `SELECT id FROM inspections WHERE id = $1 AND (sponsor_org_id = $2 OR org_id = $2)`,
        [id, organizationId]
      );
    } else if (role === 'coordinator') {
      accessCheck = await pool.query(
        `SELECT i.id FROM inspections i
         JOIN coordinator_assignments ca ON ca.org_id = i.org_id AND ca.coordinator_id = $2
         WHERE i.id = $1`,
        [id, userId]
      );
    } else {
      accessCheck = await pool.query(
        `SELECT id FROM inspections WHERE id = $1 AND org_id = $2`,
        [id, organizationId]
      );
    }
    if (!accessCheck.rows.length) return res.status(403).json({ error: 'Access denied' });

    // Auto-mark overdue
    await pool.query(
      `UPDATE inspection_findings
       SET status = 'overdue', updated_at = NOW()
       WHERE inspection_id = $1 AND status IN ('open','in_progress')
         AND due_date IS NOT NULL AND due_date < CURRENT_DATE`,
      [id]
    );

    const { rows } = await pool.query(
      `SELECT * FROM inspection_findings
       WHERE inspection_id = $1
       ORDER BY
         CASE severity WHEN 'critical' THEN 1 WHEN 'major' THEN 2 WHEN 'minor' THEN 3 ELSE 4 END,
         due_date ASC NULLS LAST`,
      [id]
    );
    res.json({ findings: rows });
  } catch (err) {
    console.error('listFindings error:', err);
    res.status(500).json({ error: 'Failed to load findings' });
  }
}

// ── POST /inspections ─────────────────────────────────────────────────────────
async function createInspection(req, res) {
  try {
    const { organizationId, id: userId } = req.user;
    const { org_id, visit_date, visit_type = 'sponsor_monitoring', conducted_by, status = 'completed', notes, next_visit_date } = req.body;

    if (!visit_date) return res.status(400).json({ error: 'visit_date is required' });

    const targetOrg = org_id || organizationId;

    const { rows } = await pool.query(
      `INSERT INTO inspections
         (org_id, sponsor_org_id, visit_date, visit_type, conducted_by, status, notes, next_visit_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [targetOrg, organizationId, visit_date, visit_type, conducted_by || null,
       status, notes || null, next_visit_date || null, userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createInspection error:', err);
    res.status(500).json({ error: 'Failed to create inspection' });
  }
}

// ── PUT /inspections/:id ──────────────────────────────────────────────────────
async function updateInspection(req, res) {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    const { visit_date, visit_type, conducted_by, status, notes, next_visit_date } = req.body;

    const { rows } = await pool.query(
      `UPDATE inspections SET
         visit_date      = COALESCE($1, visit_date),
         visit_type      = COALESCE($2, visit_type),
         conducted_by    = COALESCE($3, conducted_by),
         status          = COALESCE($4, status),
         notes           = COALESCE($5, notes),
         next_visit_date = COALESCE($6, next_visit_date),
         updated_at      = NOW()
       WHERE id = $7 AND (sponsor_org_id = $8 OR org_id = $8)
       RETURNING *`,
      [visit_date, visit_type, conducted_by, status, notes, next_visit_date, id, organizationId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Inspection not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('updateInspection error:', err);
    res.status(500).json({ error: 'Failed to update inspection' });
  }
}

// ── DELETE /inspections/:id ───────────────────────────────────────────────────
async function deleteInspection(req, res) {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    await pool.query(
      `DELETE FROM inspections WHERE id = $1 AND (sponsor_org_id = $2 OR org_id = $2)`,
      [id, organizationId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('deleteInspection error:', err);
    res.status(500).json({ error: 'Failed to delete inspection' });
  }
}

// ── POST /inspections/:id/findings ────────────────────────────────────────────
async function createFinding(req, res) {
  try {
    const { id: inspection_id } = req.params;
    const { organizationId }    = req.user;

    // Lookup org_id from inspection
    const insp = await pool.query(
      `SELECT org_id FROM inspections WHERE id = $1 AND (sponsor_org_id = $2 OR org_id = $2)`,
      [inspection_id, organizationId]
    );
    if (!insp.rows.length) return res.status(403).json({ error: 'Access denied' });

    const { finding, severity = 'minor', corrective_action, due_date, status = 'open' } = req.body;
    if (!finding) return res.status(400).json({ error: 'finding text is required' });

    const { rows } = await pool.query(
      `INSERT INTO inspection_findings
         (inspection_id, org_id, finding, severity, corrective_action, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [inspection_id, insp.rows[0].org_id, finding, severity, corrective_action || null, due_date || null, status]
    );

    // Update inspection status to 'corrective_action_required' if any finding exists
    await pool.query(
      `UPDATE inspections SET status = 'corrective_action_required', updated_at = NOW()
       WHERE id = $1 AND status = 'completed'`,
      [inspection_id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createFinding error:', err);
    res.status(500).json({ error: 'Failed to create finding' });
  }
}

// ── PUT /inspections/findings/:finding_id ─────────────────────────────────────
async function updateFinding(req, res) {
  try {
    const { finding_id } = req.params;
    const { organizationId } = req.user;
    const { finding, severity, corrective_action, due_date, status } = req.body;

    const resolvedAt = status === 'resolved' ? 'NOW()' : null;

    const { rows } = await pool.query(
      `UPDATE inspection_findings SET
         finding           = COALESCE($1, finding),
         severity          = COALESCE($2, severity),
         corrective_action = COALESCE($3, corrective_action),
         due_date          = COALESCE($4, due_date),
         status            = COALESCE($5, status),
         resolved_at       = CASE WHEN $5 = 'resolved' THEN NOW() ELSE resolved_at END,
         updated_at        = NOW()
       WHERE id = $6 AND org_id = $7
       RETURNING *`,
      [finding, severity, corrective_action, due_date, status, finding_id, organizationId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Finding not found' });

    // If all findings resolved, update inspection status
    if (status === 'resolved') {
      const f = rows[0];
      const open = await pool.query(
        `SELECT COUNT(*) FROM inspection_findings WHERE inspection_id = $1 AND status != 'resolved'`,
        [f.inspection_id]
      );
      if (Number(open.rows[0].count) === 0) {
        await pool.query(
          `UPDATE inspections SET status = 'resolved', updated_at = NOW() WHERE id = $1`,
          [f.inspection_id]
        );
      }
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('updateFinding error:', err);
    res.status(500).json({ error: 'Failed to update finding' });
  }
}

// ── DELETE /inspections/findings/:finding_id ──────────────────────────────────
async function deleteFinding(req, res) {
  try {
    const { finding_id } = req.params;
    const { organizationId } = req.user;
    await pool.query(
      `DELETE FROM inspection_findings WHERE id = $1 AND org_id = $2`,
      [finding_id, organizationId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('deleteFinding error:', err);
    res.status(500).json({ error: 'Failed to delete finding' });
  }
}

// ── GET /inspections/summary ──────────────────────────────────────────────────
async function getSummary(req, res) {
  try {
    const { organizationId, id: userId, role } = req.user;

    let where;
    let params;

    if (role === 'sponsor' || role === 'admin') {
      where = `(i.sponsor_org_id = $1 OR i.org_id = $1)`;
      params = [organizationId];
    } else if (role === 'coordinator') {
      where = `i.org_id IN (SELECT org_id FROM coordinator_assignments WHERE coordinator_id = $1)`;
      params = [userId];
    } else {
      where = `i.org_id = $1`;
      params = [organizationId];
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(DISTINCT i.id)                                                                           AS total_inspections,
         COUNT(DISTINCT CASE WHEN i.status = 'scheduled' THEN i.id END)                               AS scheduled,
         COUNT(DISTINCT CASE WHEN i.status IN ('corrective_action_required','findings_pending') THEN i.id END) AS needs_action,
         COUNT(DISTINCT CASE WHEN f.status IN ('open','in_progress','overdue') THEN f.id END)          AS open_findings,
         COUNT(DISTINCT CASE WHEN f.status = 'overdue' THEN f.id END)                                 AS overdue_findings,
         COUNT(DISTINCT CASE WHEN f.severity IN ('critical','major') AND f.status != 'resolved' THEN f.id END) AS critical_findings,
         COUNT(DISTINCT CASE WHEN i.next_visit_date IS NOT NULL AND i.next_visit_date <= CURRENT_DATE + 30 THEN i.id END) AS upcoming_visits
       FROM inspections i
       LEFT JOIN inspection_findings f ON f.inspection_id = i.id
       WHERE ${where}`,
      params
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('getSummary error:', err);
    res.status(500).json({ error: 'Failed to load summary' });
  }
}

module.exports = {
  listInspections, listFindings, createInspection, updateInspection, deleteInspection,
  createFinding, updateFinding, deleteFinding, getSummary,
};
