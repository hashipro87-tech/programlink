// routes/contact.js — Public contact form endpoint
// Sends an email to the site owner when someone submits the homepage contact form.

const express = require('express');
const router  = express.Router();

const RESEND_API_KEY  = process.env.RESEND_API_KEY;
const FROM_ADDRESS    = process.env.EMAIL_FROM || '"CACFPLink" <onboarding@resend.dev>';
const OWNER_EMAIL     = process.env.CONTACT_EMAIL || 'cacfplink@gmail.com';

router.post('/', async (req, res) => {
  const { name, email, role, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  // Always log it
  console.log(`📬 Contact form: ${name} <${email}> [${role || 'unspecified'}] — ${message}`);

  if (!RESEND_API_KEY) {
    return res.json({ ok: true }); // dev mode — no email sent but no error
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    FROM_ADDRESS,
        to:      OWNER_EMAIL,
        reply_to: email,
        subject: `CACFPLink contact: ${name} (${role || 'visitor'})`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111;">
            <div style="background:#4f46e5;padding:24px 32px;border-radius:12px 12px 0 0;">
              <h1 style="color:white;margin:0;font-size:20px;">New contact from CACFPLink</h1>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 8px"><strong>Name:</strong> ${name}</p>
              <p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p style="margin:0 0 16px"><strong>Role:</strong> ${role || '—'}</p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
                <p style="margin:0;white-space:pre-wrap;">${message}</p>
              </div>
              <p style="margin-top:16px;color:#6b7280;font-size:13px;">Reply directly to this email to respond to ${name}.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

module.exports = router;
