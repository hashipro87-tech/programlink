// emailService.js — Sends transactional emails via Resend HTTP API.
// Uses fetch (built into Node 18+) — no SMTP, no blocked ports.
//
// Required Railway environment variables:
//   RESEND_API_KEY — API key from resend.com
//   EMAIL_FROM     — sender address (e.g. "CACFPLink" <onboarding@resend.dev>)
//   FRONTEND_URL   — base URL of the frontend (e.g. https://cacfplink.com)

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS   = process.env.EMAIL_FROM || '"CACFPLink" <onboarding@resend.dev>';
const FRONTEND_URL   = process.env.FRONTEND_URL || 'https://cacfplink.com';

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.log(`📧 [email not configured] Would send to ${to}: ${subject}`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Resend API error ${res.status}`);
  }

  console.log(`📧 Email sent to ${to}: ${subject}`);
  return res.json();
}

// ── Password reset ────────────────────────────────────────────────────────────
async function sendPasswordResetEmail(to, token, name) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  if (!RESEND_API_KEY) {
    console.log('📧 [email not configured] Password reset URL for', to, ':', resetUrl);
    return;
  }

  return sendEmail({
    to,
    subject: 'Reset your CACFPLink password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111;">
        <div style="background:#4f46e5;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">CACFPLink</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
          <p style="font-size:16px;margin-top:0;">Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#6b7280;font-size:14px;">
            This link expires in 60 minutes. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Or copy this link: <a href="${resetUrl}" style="color:#4f46e5;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Email verification ────────────────────────────────────────────────────────
async function sendVerificationEmail(to, token, name) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  if (!RESEND_API_KEY) {
    console.log('📧 [email not configured] Verification URL for', to, ':', verifyUrl);
    return;
  }

  return sendEmail({
    to,
    subject: 'Verify your CACFPLink email',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111;">
        <div style="background:#4f46e5;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">CACFPLink</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
          <p style="font-size:16px;margin-top:0;">Hi ${name},</p>
          <p>Welcome to CACFPLink! Please verify your email address to activate your account.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Verify Email Address
          </a>
          <p style="color:#6b7280;font-size:14px;">
            If you didn't create a CACFPLink account, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Or copy this link: <a href="${verifyUrl}" style="color:#4f46e5;">${verifyUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Application status ────────────────────────────────────────────────────────
async function sendApplicationStatusEmail(to, name, orgName, status, notes) {
  const isApproved = status === 'approved';

  if (!RESEND_API_KEY) {
    console.log(`📧 [email not configured] Application ${status} email for ${to}`);
    return;
  }

  return sendEmail({
    to,
    subject: isApproved
      ? `✅ ${orgName} — Application Approved`
      : `❌ ${orgName} — Application Not Approved`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111;">
        <div style="background:${isApproved ? '#4f46e5' : '#dc2626'};padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">CACFPLink</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
          <p style="font-size:16px;margin-top:0;">Hi ${name},</p>
          ${isApproved
            ? `<p>Great news — <strong>${orgName}</strong> has been <strong style="color:#16a34a;">approved</strong>. You can now log in and start submitting meal counts.</p>`
            : `<p>After review, <strong>${orgName}</strong>'s application was <strong style="color:#dc2626;">not approved</strong> at this time.</p>`
          }
          ${notes ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0;font-size:14px;color:#374151;"><strong>Reviewer notes:</strong><br>${notes}</p></div>` : ''}
          <a href="${FRONTEND_URL}/login"
             style="display:inline-block;background:${isApproved ? '#4f46e5' : '#374151'};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            ${isApproved ? 'Go to Dashboard' : 'Sign In to View Details'}
          </a>
        </div>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail, sendApplicationStatusEmail };
