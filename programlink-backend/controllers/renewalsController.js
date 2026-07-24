// renewalsController.js — Annual CACFP renewal wizard
const pool = require('../config/database');

// Default checklist every site gets when a renewal is created
const DEFAULT_ITEMS = [
  { item_type: 'document',        item_label: 'Site License / Permit',            doc_type: 'license'    },
  { item_type: 'document',        item_label: 'Insurance Certificate',             doc_type: 'insurance'  },
  { item_type: 'document',        item_label: 'Health Inspection Report',          doc_type: 'health_cert'},
  { item_type: 'document',        item_label: 'Enrollment Packet',                 doc_type: 'enrollment' },
  { item_type: 'income_certs',    item_label: 'Income Eligibility Certifications', doc_type: null         },
  { item_type: 'roster_review',   item_label: 'Child Roster Review',              doc_type: null         },
  { item_type: 'profile_confirm', item_label: 'Site Profile Confirmation',        doc_type: null         },
  { item_type: 'agreement',       item_label: 'Sponsor Agreement / Acknowledgment', doc_type: null       },
];

// ── List renewals (sponsor) ────────────────────────────────────────────────────
async function listRenewals(req, res) {
  const { organizationId } = req.user;
  const { status } = req.query;

  try {
    const whereStatus = status ? `AND r.status = $2` : '';
    const params = status ? [organizationId, status] : [organizationId];

    const { rows } = await pool.query(`
      SELECT
        r.id, r.title, r.due_date, r.year, r.status, r.created_at,
        COUNT(DISTINCT ri.site_id)                                         AS total_sites,
        COUNT(ri.id)                                                       AS total_items,
        COUNT(ri.id) FILTER (WHERE ri.status = 'complete')                AS complete_items,
        COUNT(ri.id) FILTER (WHERE ri.status = 'waived')                  AS waived_items,
        COUNT(DISTINCT ri.site_id) FILTER (
          WHERE NOT EXISTS (
            SELECT 1 FROM renewal_items ri2
            WHERE ri2.renewal_id = r.id
              AND ri2.site_id = ri.site_id
              AND ri2.status = 'pending'
          )
        )                                                                  AS sites_complete
      FROM renewals r
      LEFT JOIN renewal_items ri ON ri.renewal_id = r.id
      WHERE r.sponsor_id = $1 ${whereStatus}
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `, params);

    res.json({ renewals: rows });
  } catch (err) {
    console.error('listRenewals:', err);
    res.status(500).json({ error: 'Failed to load renewals' });
  }
}

// ── Get single renewal with per-site breakdown ─────────────────────────────────
async function getRenewal(req, res) {
  const { organizationId } = req.user;
  const { id } = req.params;

  try {
    // Confirm ownership
    const { rows: [renewal] } = await pool.query(
      `SELECT * FROM renewals WHERE id = $1 AND sponsor_id = $2`,
      [id, organizationId]
    );
    if (!renewal) return res.status(404).json({ error: 'Renewal not found' });

    // Per-site items
    const { rows: items } = await pool.query(`
      SELECT
        ri.*,
        o.name AS site_name,
        u.first_name || ' ' || u.last_name AS completed_by_name
      FROM renewal_items ri
      JOIN organizations o ON o.id = ri.site_id
      LEFT JOIN users u ON u.id = ri.completed_by
      WHERE ri.renewal_id = $1
      ORDER BY o.name, ri.item_type
    `, [id]);

    // Group by site
    const siteMap = {};
    for (const item of items) {
      if (!siteMap[item.site_id]) {
        siteMap[item.site_id] = { site_id: item.site_id, site_name: item.site_name, items: [] };
      }
      siteMap[item.site_id].items.push(item);
    }

    const sites = Object.values(siteMap).map(s => ({
      ...s,
      total:    s.items.length,
      complete: s.items.filter(i => i.status === 'complete').length,
      waived:   s.items.filter(i => i.status === 'waived').length,
      pending:  s.items.filter(i => i.status === 'pending').length,
    }));

    res.json({ renewal, sites });
  } catch (err) {
    console.error('getRenewal:', err);
    res.status(500).json({ error: 'Failed to load renewal' });
  }
}

// ── Create renewal (sponsor) ───────────────────────────────────────────────────
async function createRenewal(req, res) {
  const { organizationId } = req.user;
  const { title, due_date, site_ids, required_items } = req.body;

  if (!due_date || !site_ids?.length) {
    return res.status(400).json({ error: 'due_date and site_ids are required' });
  }

  // Verify all site_ids belong to this sponsor
  const { rows: validSites } = await pool.query(
    `SELECT id FROM organizations WHERE id = ANY($1::uuid[]) AND sponsor_id = $2`,
    [site_ids, organizationId]
  );
  if (validSites.length !== site_ids.length) {
    return res.status(403).json({ error: 'One or more sites do not belong to this sponsor' });
  }

  // Determine which items to include
  const itemTemplate = required_items?.length
    ? DEFAULT_ITEMS.filter(i => required_items.includes(i.item_type))
    : DEFAULT_ITEMS;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [renewal] } = await client.query(`
      INSERT INTO renewals (sponsor_id, title, due_date, year)
      VALUES ($1, $2, $3, EXTRACT(YEAR FROM $3::date)::INTEGER)
      RETURNING *
    `, [organizationId, title || 'Annual Renewal', due_date]);

    // Insert items for each site × each item template
    for (const site_id of site_ids) {
      for (const tmpl of itemTemplate) {
        await client.query(`
          INSERT INTO renewal_items (renewal_id, site_id, item_type, item_label, doc_type)
          VALUES ($1, $2, $3, $4, $5)
        `, [renewal.id, site_id, tmpl.item_type, tmpl.item_label, tmpl.doc_type]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ renewal });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createRenewal:', err);
    res.status(500).json({ error: 'Failed to create renewal' });
  } finally {
    client.release();
  }
}

// ── Update renewal (title / due_date / status) ────────────────────────────────
async function updateRenewal(req, res) {
  const { organizationId } = req.user;
  const { id } = req.params;
  const { title, due_date, status } = req.body;

  try {
    const { rows: [renewal] } = await pool.query(`
      UPDATE renewals
      SET
        title    = COALESCE($3, title),
        due_date = COALESCE($4::date, due_date),
        status   = COALESCE($5, status)
      WHERE id = $1 AND sponsor_id = $2
      RETURNING *
    `, [id, organizationId, title, due_date, status]);

    if (!renewal) return res.status(404).json({ error: 'Renewal not found' });
    res.json({ renewal });
  } catch (err) {
    console.error('updateRenewal:', err);
    res.status(500).json({ error: 'Failed to update renewal' });
  }
}

// ── Complete / waive a renewal item ───────────────────────────────────────────
async function updateItem(req, res) {
  const { id: itemId } = req.params;
  const { status, notes } = req.body;
  const { id: userId, organizationId, role } = req.user;

  if (!['complete', 'waived', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Check the item belongs to this user's org (sponsor sees all, site sees own)
    const check = role === 'sponsor'
      ? `AND r.sponsor_id = $2`
      : `AND ri.site_id = $2`;

    const { rows: [item] } = await pool.query(`
      SELECT ri.* FROM renewal_items ri
      JOIN renewals r ON r.id = ri.renewal_id
      WHERE ri.id = $1 ${check}
    `, [itemId, organizationId]);

    if (!item) return res.status(404).json({ error: 'Item not found' });

    const { rows: [updated] } = await pool.query(`
      UPDATE renewal_items
      SET
        status       = $2,
        notes        = COALESCE($3, notes),
        completed_at = CASE WHEN $2 = 'complete' THEN NOW() ELSE NULL END,
        completed_by = CASE WHEN $2 = 'complete' THEN $4 ELSE NULL END
      WHERE id = $1
      RETURNING *
    `, [itemId, status, notes, userId]);

    res.json({ item: updated });
  } catch (err) {
    console.error('updateItem:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
}

// ── Site: get active renewals for my site ────────────────────────────────────
async function getSiteRenewals(req, res) {
  const { organizationId } = req.user;

  try {
    const { rows } = await pool.query(`
      SELECT
        r.id AS renewal_id, r.title, r.due_date, r.year,
        ri.id, ri.item_type, ri.item_label, ri.doc_type,
        ri.status, ri.completed_at, ri.notes
      FROM renewal_items ri
      JOIN renewals r ON r.id = ri.renewal_id
      WHERE ri.site_id = $1 AND r.status = 'active'
      ORDER BY r.due_date, ri.item_type
    `, [organizationId]);

    // Group by renewal
    const map = {};
    for (const row of rows) {
      if (!map[row.renewal_id]) {
        map[row.renewal_id] = {
          renewal_id: row.renewal_id,
          title:      row.title,
          due_date:   row.due_date,
          year:       row.year,
          items:      [],
        };
      }
      map[row.renewal_id].items.push({
        id:           row.id,
        item_type:    row.item_type,
        item_label:   row.item_label,
        doc_type:     row.doc_type,
        status:       row.status,
        completed_at: row.completed_at,
        notes:        row.notes,
      });
    }

    res.json({ renewals: Object.values(map) });
  } catch (err) {
    console.error('getSiteRenewals:', err);
    res.status(500).json({ error: 'Failed to load site renewals' });
  }
}

module.exports = {
  listRenewals,
  getRenewal,
  createRenewal,
  updateRenewal,
  updateItem,
  getSiteRenewals,
};
