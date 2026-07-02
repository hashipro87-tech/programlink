const pool    = require('../config/database');
const jwt     = require('jsonwebtoken');
const { sendInviteEmail } = require('../services/emailService');

exports.listOrganizations = async (req, res) => {
  try {
    const { type, sponsor_id } = req.query;
    // Pagination — default 100 rows, max 500 per page
    const limit  = Math.min(parseInt(req.query.limit,  10) || 100, 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0,   0);

    let where = 'WHERE 1=1';
    const filterParams = [];
    if (type)       { filterParams.push(type);       where += ` AND type = $${filterParams.length}`; }
    if (sponsor_id) { filterParams.push(sponsor_id); where += ` AND sponsor_id = $${filterParams.length}`; }
    // Non-sponsors only see orgs within their sponsor's program
    if (req.user.role !== 'sponsor' && req.user.role !== 'admin') {
      filterParams.push(req.user.sponsorId);
      where += ` AND (sponsor_id = $${filterParams.length} OR id = $${filterParams.length})`;
    }

    // Total count (same filters, no pagination)
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM organizations ${where}`,
      filterParams
    );
    const total = parseInt(countRows[0].count, 10);

    // Paginated data
    const dataParams = [...filterParams, limit, offset];
    const { rows } = await pool.query(
      `SELECT * FROM organizations ${where}
       ORDER BY created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({ organizations: rows, total, limit, offset, has_more: offset + rows.length < total });
  } catch (err) {
    console.error('listOrganizations error:', err);
    res.status(500).json({ error: 'Failed to fetch organizations.' });
  }
};

exports.getOrganization = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM organizations WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Organization not found.' });
    res.json({ organization: rows[0] });
  } catch (err) {
    console.error('getOrganization error:', err);
    res.status(500).json({ error: 'Failed to fetch organization.' });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const { name, type, region, address, phone, sponsor_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO organizations (name, type, region, address, phone, sponsor_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, type, region, address, phone, sponsor_id || req.user.sponsorId]
    );
    res.status(201).json({ organization: rows[0] });
  } catch (err) {
    console.error('createOrganization error:', err);
    res.status(500).json({ error: 'Failed to create organization.' });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM organizations WHERE id = $1 RETURNING id, name',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Organization not found.' });
    res.json({ message: `${rows[0].name} has been removed.` });
  } catch (err) {
    console.error('deleteOrganization error:', err);
    // FK violation — org has linked data (meal counts, routes, etc.)
    if (err.code === '23503') {
      return res.status(400).json({
        error: 'Cannot delete — this organization has linked records (meal counts, delivery routes, etc.). Deactivate it instead.',
      });
    }
    res.status(500).json({ error: `Failed to remove organization: ${err.message}` });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const { name, status, region, address, phone } = req.body;
    const { rows } = await pool.query(
      `UPDATE organizations SET
         name = COALESCE($1, name),
         status = COALESCE($2, status),
         region = COALESCE($3, region),
         address = COALESCE($4, address),
         phone = COALESCE($5, phone),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, status, region, address, phone, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Organization not found.' });
    res.json({ organization: rows[0] });
  } catch (err) {
    console.error('updateOrganization error:', err);
    res.status(500).json({ error: 'Failed to update organization.' });
  }
};

/**
 * Shared helper — builds signed invite JWT + sends email.
 * orgType: 'kitchen' | 'site'
 * role:    'kitchen' | 'site' | 'coordinator'
 * roleLabel: display label used in the email body (e.g. 'kitchen manager')
 */
async function _sendOrgInvite({ orgType, role, roleLabel, name, address, phone, region, contact_name, contact_email, sponsorId, res, logPrefix }) {
  if (!name?.trim())          return res.status(400).json({ error: `${orgType.charAt(0).toUpperCase() + orgType.slice(1)} name is required.` });
  if (!contact_email?.trim()) return res.status(400).json({ error: 'Contact email is required.' });

  // sponsor_id may be null for admin users — allow it (column is nullable)
  const { rows } = await pool.query(
    `INSERT INTO organizations (name, type, address, phone, region, sponsor_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
    [name.trim(), orgType, address || null, phone || null, region || null, sponsorId || null]
  );
  const org = rows[0];

  const secret    = process.env.JWT_SECRET || 'fallback_secret';
  const token     = jwt.sign(
    { type: 'invite', role, org_id: org.id, org_name: org.name,
      contact_name: contact_name || '', email: contact_email.trim().toLowerCase(), sponsor_id: sponsorId },
    secret,
    { expiresIn: '7d' }
  );

  const frontendUrl = process.env.FRONTEND_URL || 'https://cacfplink.com';
  const inviteUrl   = `${frontendUrl}/accept-invite?token=${token}`;
  await sendInviteEmail(contact_email, contact_name || name, org.name, roleLabel, inviteUrl);

  return org;
}

/**
 * Sponsor invites a kitchen.
 */
exports.inviteKitchen = async (req, res) => {
  try {
    const { name, address, phone, region, contact_name, contact_email } = req.body;
    const sponsorId = req.user.organizationId || req.user.sponsorId;
    const org = await _sendOrgInvite({
      orgType: 'kitchen', role: 'kitchen', roleLabel: 'kitchen manager',
      name, address, phone, region, contact_name, contact_email, sponsorId, res,
    });
    if (!org) return; // error already sent
    res.status(201).json({ organization: org, message: 'Invite sent.' });
  } catch (err) {
    console.error('inviteKitchen error:', err);
    res.status(500).json({ error: `Failed to send kitchen invite: ${err.message}` });
  }
};

/**
 * Sponsor (or coordinator) invites a site director.
 */
exports.inviteSite = async (req, res) => {
  try {
    const { name, address, phone, region, contact_name, contact_email } = req.body;
    const sponsorId = req.user.organizationId || req.user.sponsorId;
    const org = await _sendOrgInvite({
      orgType: 'site', role: 'site', roleLabel: 'site director',
      name, address, phone, region, contact_name, contact_email, sponsorId, res,
    });
    if (!org) return;
    res.status(201).json({ organization: org, message: 'Invite sent.' });
  } catch (err) {
    console.error('inviteSite error:', err);
    res.status(500).json({ error: `Failed to send site invite: ${err.message}` });
  }
};

/**
 * Sponsor invites a coordinator (belongs to sponsor's own org — no new org created).
 */
exports.inviteCoordinator = async (req, res) => {
  try {
    const { contact_name, contact_email } = req.body;
    if (!contact_email?.trim()) return res.status(400).json({ error: 'Contact email is required.' });

    const sponsorOrgId = req.user.organizationId;
    if (!sponsorOrgId) return res.status(400).json({ error: 'Sponsor organization not found.' });

    // Get org name for the invite email
    const orgRes  = await pool.query('SELECT name FROM organizations WHERE id = $1', [sponsorOrgId]);
    const orgName = orgRes.rows[0]?.name || 'Your organization';

    const secret    = process.env.JWT_SECRET || 'fallback_secret';
    const token     = jwt.sign(
      { type: 'invite', role: 'coordinator', org_id: sponsorOrgId, org_name: orgName,
        contact_name: contact_name || '', email: contact_email.trim().toLowerCase(), sponsor_id: sponsorOrgId },
      secret,
      { expiresIn: '7d' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'https://cacfplink.com';
    const inviteUrl   = `${frontendUrl}/accept-invite?token=${token}`;
    await sendInviteEmail(contact_email, contact_name || 'there', orgName, 'coordinator', inviteUrl);

    res.status(200).json({ message: 'Coordinator invite sent.' });
  } catch (err) {
    console.error('inviteCoordinator error:', err);
    res.status(500).json({ error: 'Failed to send coordinator invite.' });
  }
};
