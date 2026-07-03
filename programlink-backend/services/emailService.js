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

// ── Generic invite email (kitchen, site, coordinator) ─────────────────────────
async function sendInviteEmail(to, contactName, orgName, roleLabel, inviteUrl) {
  if (!RESEND_API_KEY) {
    console.log(`📧 [email not configured] ${roleLabel} invite URL for ${to}:`, inviteUrl);
    return;
  }

  const ctaMap = {
    'kitchen manager': 'Set Up My Kitchen Account',
    'site director':   'Set Up My Site Account',
    'coordinator':     'Set Up My Coordinator Account',
  };
  const ctaText = ctaMap[roleLabel] || 'Accept Invitation';

  return sendEmail({
    to,
    subject: `You've been invited to join CACFPLink — ${orgName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111;">
        <div style="background:#4f46e5;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">CACFPLink</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
          <p style="font-size:16px;margin-top:0;">Hi ${contactName},</p>
          <p>You've been invited to join <strong>${orgName}</strong> as a <strong>${roleLabel}</strong> on CACFPLink — a platform for managing CACFP meal programs.</p>
          <p>Click the button below to create your account. You'll have immediate access to your dashboard.</p>
          <a href="${inviteUrl}"
             style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            ${ctaText}
          </a>
          <p style="color:#6b7280;font-size:14px;">
            This invite link expires in 7 days. If you weren't expecting this, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Or copy this link: <a href="${inviteUrl}" style="color:#4f46e5;">${inviteUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Document expiry reminder ──────────────────────────────────────────────────
async function sendDocumentExpiryEmail(to, name, orgName, docLabel, daysLeft, expiryDate) {
  const urgency  = daysLeft <= 7 ? '🔴' : daysLeft <= 14 ? '🟡' : '🟠';
  const headerBg = daysLeft <= 7 ? '#dc2626' : '#f97316';
  const fmtDate  = new Date(expiryDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  if (!RESEND_API_KEY) {
    console.log(`📧 [email not configured] Doc expiry for ${to}: ${docLabel} expires in ${daysLeft}d`);
    return;
  }

  return sendEmail({
    to,
    subject: `${urgency} Action required: "${docLabel}" expires in ${daysLeft} days`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111;">
        <div style="background:${headerBg};padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">CACFPLink</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
          <p style="font-size:16px;margin-top:0;">Hi ${name},</p>
          <p>A document for <strong>${orgName}</strong> is expiring soon and needs to be renewed to stay CACFP compliant.</p>
          <div style="background:#fef9f0;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0 0 6px;font-size:12px;color:#9a3412;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
              ${urgency} Expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}
            </p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#111;">${docLabel}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Expires: ${fmtDate}</p>
          </div>
          <p style="font-size:14px;color:#374151;">
            Please upload a renewed copy as soon as possible to avoid any disruption to your CACFP reimbursements.
          </p>
          <a href="${FRONTEND_URL}/login"
             style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Upload Renewed Document
          </a>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            This reminder was sent automatically by CACFPLink. You will receive reminders at 30, 14, and 7 days before expiry.
          </p>
        </div>
      </div>
    `,
  });
}

// Backwards-compatible alias
const sendKitchenInviteEmail = (to, contactName, orgName, inviteUrl) =>
  sendInviteEmail(to, contactName, orgName, 'kitchen manager', inviteUrl);

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendApplicationStatusEmail,
  sendDocumentExpiryEmail,
  sendInviteEmail,
  sendKitchenInviteEmail,
};
