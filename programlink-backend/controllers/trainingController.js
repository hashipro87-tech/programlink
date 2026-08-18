// trainingController.js — Staff training & certification tracking
const pool = require('../config/database');

const CERT_TYPES = {
  food_handler:   'Food Handler Certificate',
  food_manager:   'Food Safety Manager Certification',
  cacfp_training: 'CACFP Program Training',
  first_aid:      'First Aid Certification',
  cpr:            'CPR Certification',
  other:          'Other Training / Certification',
};

function getStatus(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  const daysLeft = Math.ceil((exp - today) / 86400000);
  if (daysLeft < 0)  return 'expired';
  if (daysLeft <= 30) return 'expiring_soon';
  return 'valid';
}

// ── List trainings ────────────────────────────────────────────────────────────
async function listTrainings(req, res) {
  const { organizationId, role } = req.user;
  const { org_id, status } = req.query;

  try {
    let orgFilter, params;

    if (role === 'sponsor' || role === 'admin' || role === 'coordinator') {
      // Sponsor/coordinator sees all orgs under them, or a specific one
      if (org_id) {
        // Verify org belongs to sponsor
        const { rows: [org] } = await pool.query(
          `SELECT id FROM organizations WHERE id = $1 AND sponsor_id = $2`,
          [org_id, organizationId]
        );
        if (!org) return res.status(403).json({ error: 'Access denied' });
        orgFilter = `AND st.org_id = $2`;
        params = [organizationId, org_id];
      } else {
        orgFilter = `AND o.sponsor_id = $2`;
        params = [organizationId, organizationId];
      }
    } else {
      // Kitchen / site sees only their own
      orgFilter = `AND st.org_id = $2`;
      params = [organizationId, organizationId];
    }

    const { rows } = await pool.query(`
      SELECT
        st.*,
        o.name AS org_name,
        o.type AS org_type
      FROM staff_trainings st
      JOIN organizations o ON o.id = st.org_id
      WHERE 1=1 ${orgFilter}
      ORDER BY st.expiry_date ASC
    `, params.slice(1).length === 0 ? [organizationId] : params.slice(role === 'sponsor' || role === 'admin' ? 1 : 1));

    // Re-run simpler query
    let rows2;
    if (role === 'sponsor' || role === 'admin') {
      if (org_id) {
        const r = await pool.query(`
          SELECT st.*, o.name AS org_name, o.type AS org_type
          FROM staff_trainings st
          JOIN organizations o ON o.id = st.org_id
          WHERE o.sponsor_id = $1 AND st.org_id = $2
          ORDER BY st.expiry_date ASC
        `, [organizationId, org_id]);
        rows2 = r.rows;
      } else {
        const r = await pool.query(`
          SELECT st.*, o.name AS org_name, o.type AS org_type
          FROM staff_trainings st
          JOIN organizations o ON o.id = st.org_id
          WHERE o.sponsor_id = $1
          ORDER BY st.expiry_date ASC
        `, [organizationId]);
        rows2 = r.rows;
      }
    } else {
      const r = await pool.query(`
        SELECT st.*, o.name AS org_name, o.type AS org_type
        FROM staff_trainings st
        JOIN organizations o ON o.id = st.org_id
        WHERE st.org_id = $1
        ORDER BY st.expiry_date ASC
      `, [organizationId]);
      rows2 = r.rows;
    }

    // Attach computed status and filter
    let trainings = rows2.map(t => ({ ...t, status: getStatus(t.expiry_date) }));
    if (status) trainings = trainings.filter(t => t.status === status);

    res.json({ trainings });
  } catch (err) {
    console.error('listTrainings:', err);
    res.status(500).json({ error: 'Failed to load trainings' });
  }
}

// ── Summary counts ────────────────────────────────────────────────────────────
async function getSummary(req, res) {
  const { organizationId, role } = req.user;

  try {
    let rows;
    if (role === 'sponsor' || role === 'admin') {
      const r = await pool.query(`
        SELECT expiry_date FROM staff_trainings st
        JOIN organizations o ON o.id = st.org_id
        WHERE o.sponsor_id = $1
      `, [organizationId]);
      rows = r.rows;
    } else {
      const r = await pool.query(
        `SELECT expiry_date FROM staff_trainings WHERE org_id = $1`,
        [organizationId]
      );
      rows = r.rows;
    }

    const statuses = rows.map(r => getStatus(r.expiry_date));
    res.json({
      total:         rows.length,
      valid:         statuses.filter(s => s === 'valid').length,
      expiring_soon: statuses.filter(s => s === 'expiring_soon').length,
      expired:       statuses.filter(s => s === 'expired').length,
    });
  } catch (err) {
    console.error('getSummary:', err);
    res.status(500).json({ error: 'Failed to load summary' });
  }
}

// ── Create ────────────────────────────────────────────────────────────────────
async function createTraining(req, res) {
  const { id: userId, organizationId, role } = req.user;
  const { org_id, staff_name, cert_type, cert_label, cert_date, expiry_date, notes } = req.body;

  if (!staff_name || !cert_type || !expiry_date) {
    return res.status(400).json({ error: 'staff_name, cert_type, and expiry_date are required' });
  }

  // Determine which org to attach this to
  let targetOrgId = organizationId;
  if ((role === 'sponsor' || role === 'admin') && org_id) {
    const { rows: [org] } = await pool.query(
      `SELECT id FROM organizations WHERE id = $1 AND sponsor_id = $2`,
      [org_id, organizationId]
    );
    if (!org) return res.status(403).json({ error: 'Access denied' });
    targetOrgId = org_id;
  }

  const label = cert_label || CERT_TYPES[cert_type] || cert_type;

  try {
    const { rows: [training] } = await pool.query(`
      INSERT INTO staff_trainings (org_id, staff_name, cert_type, cert_label, cert_date, expiry_date, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [targetOrgId, staff_name.trim(), cert_type, label, cert_date || null, expiry_date, notes || null, userId]);

    res.status(201).json({ training: { ...training, status: getStatus(training.expiry_date) } });
  } catch (err) {
    console.error('createTraining:', err);
    res.status(500).json({ error: 'Failed to create training record' });
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
async function updateTraining(req, res) {
  const { organizationId, role } = req.user;
  const { id } = req.params;
  const { staff_name, cert_type, cert_label, cert_date, expiry_date, notes } = req.body;

  try {
    // Ownership check
    const check = (role === 'sponsor' || role === 'admin')
      ? `AND o.sponsor_id = $2`
      : `AND st.org_id = $2`;

    const { rows: [existing] } = await pool.query(`
      SELECT st.id FROM staff_trainings st
      JOIN organizations o ON o.id = st.org_id
      WHERE st.id = $1 ${check}
    `, [id, organizationId]);
    if (!existing) return res.status(404).json({ error: 'Training record not found' });

    const label = cert_label || (cert_type ? CERT_TYPES[cert_type] : undefined);

    const { rows: [training] } = await pool.query(`
      UPDATE staff_trainings
      SET
        staff_name  = COALESCE($2, staff_name),
        cert_type   = COALESCE($3, cert_type),
        cert_label  = COALESCE($4, cert_label),
        cert_date   = COALESCE($5::date, cert_date),
        expiry_date = COALESCE($6::date, expiry_date),
        notes       = COALESCE($7, notes),
        updated_at  = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, staff_name, cert_type, label, cert_date, expiry_date, notes]);

    res.json({ training: { ...training, status: getStatus(training.expiry_date) } });
  } catch (err) {
    console.error('updateTraining:', err);
    res.status(500).json({ error: 'Failed to update training record' });
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteTraining(req, res) {
  const { organizationId, role } = req.user;
  const { id } = req.params;

  try {
    const check = (role === 'sponsor' || role === 'admin')
      ? `AND o.sponsor_id = $2`
      : `AND st.org_id = $2`;

    const { rows: [existing] } = await pool.query(`
      SELECT st.id FROM staff_trainings st
      JOIN organizations o ON o.id = st.org_id
      WHERE st.id = $1 ${check}
    `, [id, organizationId]);
    if (!existing) return res.status(404).json({ error: 'Training record not found' });

    await pool.query(`DELETE FROM staff_trainings WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteTraining:', err);
    res.status(500).json({ error: 'Failed to delete training record' });
  }
}

// ── Expiry reminder job (called from scheduledJobs) ───────────────────────────
async function sendTrainingExpiryReminders() {
  const { sendTrainingExpiryEmail } = require('./emailService').default
    ? require('./emailService').default
    : require('../services/emailService');

  try {
    const { rows } = await pool.query(`
      SELECT
        st.id, st.staff_name, st.cert_label, st.expiry_date,
        o.name AS org_name,
        u.email, u.first_name
      FROM staff_trainings st
      JOIN organizations o ON o.id = st.org_id
      JOIN users u ON u.org_id = st.org_id AND u.is_active = true
      WHERE st.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY st.expiry_date
    `);

    for (const row of rows) {
      const daysLeft = Math.ceil((new Date(row.expiry_date) - new Date()) / 86400000);
      if ([30, 14, 7].includes(daysLeft) && row.email) {
        await sendTrainingExpiryEmail(
          row.email,
          row.first_name || 'there',
          row.org_name,
          row.staff_name,
          row.cert_label,
          daysLeft,
          row.expiry_date
        );
      }
    }
    console.log(`[training reminders] checked ${rows.length} upcoming expirations`);
  } catch (err) {
    console.error('sendTrainingExpiryReminders:', err);
  }
}

module.exports = {
  listTrainings,
  getSummary,
  createTraining,
  updateTraining,
  deleteTraining,
  sendTrainingExpiryReminders,
};
