// emailService.js — Sends transactional emails via Resend API.
// Configure by setting these Railway environment variables:
//   RESEND_API_KEY  — API key from resend.com (required for emails to send)
//   EMAIL_FROM      — "From" address, must be from a Resend-verified domain
//                     e.g. "CACFPLink <noreply@cacfplink.com>"
//   FRONTEND_URL    — base URL of the frontend (https://cacfplink.com)
//
// If RESEND_API_KEY is not set, emails are NOT sent but the URL is
// logged to Railway console so you can debug without email configured.

const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log('📧 [RESEND_API_KEY not set] Email not sent to', to);
    console.log('   Subject:', subject);
    return;
  }

  const from = process.env.EMAIL_FROM || '"CACFPLink" <noreply@cacfplink.com>';

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Resend API error ${response.status}: ${JSON.stringify(data)}`);
  }

  console.log(`📧 Email sent to ${to} — id: ${data.id}`);
}

/**
 * Send a password reset email.
 * @param {string} to    - Recipient email address
 * @param {string} token - The reset token (NOT the full URL)
 * @param {string} name  - Recipient's name for personalization
 */
async function sendPasswordResetEmail(to, token, name) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://cacfplink.com';
  const resetUrl    = `${frontendUrl}/reset-password?token=${token}`;
  const expiryMins  = 60;

  if (!process.env.RESEND_API_KEY) {
    console.log('📧 [email not configured] Password reset URL for', to, ':');
    console.log('   ', resetUrl);
    return;
  }

  await sendEmail({
    to,
    subject: 'Reset your CACFPLink password',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
        <div style="background: #4f46e5; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">CACFPLink</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            This link expires in ${expiryMins} minutes. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Or copy this link: <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Send an email verification link after registration.
 * @param {string} to    - Recipient email
 * @param {string} token - Verification token
 * @param {string} name  - Recipient's name
 */
async function sendVerificationEmail(to, token, name) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://cacfplink.com';
  const verifyUrl   = `${frontendUrl}/verify-email?token=${token}`;

  if (!process.env.RESEND_API_KEY) {
    console.log('📧 [email not configured] Verification URL for', to, ':');
    console.log('   ', verifyUrl);
    return;
  }

  await sendEmail({
    to,
    subject: 'Verify your CACFPLink email',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
        <div style="background: #4f46e5; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">CACFPLink</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${name},</p>
          <p>Welcome to CACFPLink! Please verify your email address to activate your account.</p>
          <a href="${verifyUrl}"
             style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Verify Email Address
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't create a CACFPLink account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Or copy this link: <a href="${verifyUrl}" style="color: #4f46e5;">${verifyUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Send an application approval or rejection email.
 * @param {string} to       - Recipient email
 * @param {string} name     - Recipient's name
 * @param {string} orgName  - Organization name
 * @param {string} status   - 'approved' | 'rejected'
 * @param {string} notes    - Optional reviewer notes
 */
async function sendApplicationStatusEmail(to, name, orgName, status, notes) {
  const frontendUrl  = process.env.FRONTEND_URL || 'https://cacfplink.com';
  const isApproved   = status === 'approved';
  const dashboardUrl = `${frontendUrl}/login`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`📧 [email not configured] Application ${status} email for ${to}`);
    return;
  }

  await sendEmail({
    to,
    subject: isApproved
      ? `✅ ${orgName} — Application Approved`
      : `❌ ${orgName} — Application Not Approved`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
        <div style="background: ${isApproved ? '#4f46e5' : '#dc2626'}; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">CACFPLink</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${name},</p>
          ${isApproved
            ? `<p>Great news — <strong>${orgName}</strong> has been <strong style="color:#16a34a;">approved</strong> to participate in the program. You can now log in and start submitting meal counts.</p>`
            : `<p>After review, <strong>${orgName}</strong>'s application was <strong style="color:#dc2626;">not approved</strong> at this time.</p>`
          }
          ${notes ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0;font-size:14px;color:#374151;"><strong>Reviewer notes:</strong><br>${notes}</p></div>` : ''}
          <a href="${dashboardUrl}"
             style="display:inline-block;background:${isApproved ? '#4f46e5' : '#374151'};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            ${isApproved ? 'Go to Dashboard' : 'Sign In to View Details'}
          </a>
          ${!isApproved ? `<p style="color:#6b7280;font-size:14px;">If you have questions, contact your program coordinator directly.</p>` : ''}
        </div>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail, sendApplicationStatusEmail };
