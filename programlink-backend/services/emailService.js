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

// ── Monthly program summary ───────────────────────────────────────────────────
// Sent to every active sponsor around the 28th of each month.
// data = { monthName, estimatedReimbursement, sitesReady, totalSites,
//          totalMealCounts, issueCount, issues[], claimsUrl }
async function sendMonthlyReportEmail(to, name, data) {
  const {
    monthName,
    estimatedReimbursement = 0,
    sitesReady = 0,
    totalSites = 0,
    totalMealCounts = 0,
    issueCount = 0,
    issues = [],
    claimsUrl,
  } = data;

  if (!RESEND_API_KEY) {
    console.log(`📧 [email not configured] Monthly report for ${to}: ${monthName}`);
    return;
  }

  const fmt       = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
  const headerBg  = issueCount === 0 ? '#4f46e5' : '#7c3aed';
  const issueBadge = issueCount === 0
    ? `<span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">✅ No issues — ready to submit</span>`
    : `<span style="background:#fef2f2;color:#dc2626;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">⚠️ ${issueCount} issue${issueCount !== 1 ? 's' : ''} need attention</span>`;

  const issueRows = issues.slice(0, 5).map(issue => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;max-width:200px;">${issue.site || 'Program'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${issue.message || ''}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#dc2626;font-weight:700;text-align:right;white-space:nowrap;">${fmt(issue.potentialLoss || 0)}</td>
    </tr>
  `).join('');

  const issueSection = issueCount > 0 ? `
    <div style="margin:24px 0;">
      <p style="font-size:13px;font-weight:700;color:#374151;margin:0 0 8px;">Issues preventing full reimbursement:</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Site / Org</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Issue</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">At Risk</th>
          </tr>
        </thead>
        <tbody>${issueRows}</tbody>
      </table>
      <p style="font-size:12px;color:#9ca3af;margin:8px 0 0;">
        Fix ${issueCount === 1 ? 'this issue' : 'these issues'} before the end of the month to recover ${fmt(issues.reduce((s, i) => s + (i.potentialLoss || 0), 0))} in reimbursements.
      </p>
    </div>
  ` : `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:24px 0;text-align:center;">
      <p style="margin:0;font-size:15px;color:#15803d;font-weight:600;">🎉 All ${totalSites} site${totalSites !== 1 ? 's' : ''} are ready — your claim looks clean!</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Your ${monthName} CACFP Program Summary — CACFPLink`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <!-- Header -->
        <div style="background:${headerBg};padding:24px 32px;border-radius:12px 12px 0 0;">
          <p style="color:rgba(255,255,255,.7);font-size:12px;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;">CACFPLink</p>
          <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">${monthName} Program Summary</h1>
        </div>

        <div style="border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px;background:#fff;">
          <p style="font-size:15px;margin-top:0;">Hi ${name},</p>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">
            Here's where your program stands for <strong>${monthName}</strong>. Fix any issues before the end of the month to maximize your reimbursement.
          </p>

          <!-- 3 stat boxes -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
            <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:10px;padding:14px;text-align:center;">
              <p style="font-size:10px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;">Est. Reimbursement</p>
              <p style="font-size:20px;font-weight:900;color:#312e81;margin:0;">${fmt(estimatedReimbursement)}</p>
            </div>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;text-align:center;">
              <p style="font-size:10px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;">Sites Ready</p>
              <p style="font-size:20px;font-weight:900;color:#14532d;margin:0;">${sitesReady} / ${totalSites}</p>
            </div>
            <div style="background:#fef9f0;border:1px solid #fed7aa;border-radius:10px;padding:14px;text-align:center;">
              <p style="font-size:10px;color:#d97706;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;">Meal Counts</p>
              <p style="font-size:20px;font-weight:900;color:#78350f;margin:0;">${totalMealCounts.toLocaleString()}</p>
            </div>
          </div>

          <div style="text-align:center;margin-bottom:20px;">${issueBadge}</div>

          ${issueSection}

          <!-- CTA -->
          <div style="text-align:center;margin:28px 0 20px;">
            <a href="${claimsUrl}"
               style="display:inline-block;background:#4f46e5;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              View Full Claims Center →
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
            — Hashi at CACFPLink<br/>
            You're receiving this because you're an active CACFPLink sponsor.<br/>
            <a href="${FRONTEND_URL}/login" style="color:#6366f1;">Go to dashboard</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Weekly sponsor digest ─────────────────────────────────────────────────────
// Sent every Monday at 7am UTC — a quick "here's where your claim stands" pulse.
// Shorter than the monthly report; focused on immediate action items.
async function sendWeeklyDigestEmail(to, name, {
  weekOf,
  monthName,
  estimatedReimbursement,
  sitesReady,
  totalSites,
  issueCount,
  issues = [],         // [{ site, message, potentialLoss }]
  claimsUrl,
}) {
  const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const atRisk = issues.reduce((sum, i) => sum + (i.potentialLoss || 0), 0);

  const issueRows = issues.slice(0, 3).map(i => `
    <tr>
      <td style="padding:10px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">
        <span style="color:#ef4444;font-weight:600;">●</span>&nbsp; ${i.site}
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${i.message}</div>
      </td>
      <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#ef4444;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap;">
        ${fmt(i.potentialLoss || 0)} at risk
      </td>
    </tr>
  `).join('');

  const bodyContent = issueCount === 0
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
        <div style="font-size:28px;margin-bottom:8px;">✅</div>
        <p style="font-weight:700;color:#15803d;margin:0 0 4px;">All clear this week!</p>
        <p style="color:#16a34a;font-size:13px;margin:0;">No issues flagged. Your program is on track for full reimbursement.</p>
       </div>`
    : `<p style="font-size:13px;color:#6b7280;margin:0 0 10px;">
        <strong style="color:#374151;">${issueCount} issue${issueCount !== 1 ? 's' : ''} need attention</strong>
        — fix ${issueCount === 1 ? 'it' : 'them'} before month-end to recover <strong style="color:#ef4444;">${fmt(atRisk)}</strong>.
       </p>
       <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
         ${issueRows}
         ${issues.length > 3 ? `<tr><td colspan="2" style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:center;">+ ${issues.length - 3} more in the Claims Center</td></tr>` : ''}
       </table>`;

  return sendEmail({
    to,
    subject: `Your CACFP program — ${weekOf} | ${issueCount === 0 ? '✅ All clear' : `${issueCount} issue${issueCount !== 1 ? 's' : ''} to fix`}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 32px;border-radius:12px 12px 0 0;">
          <p style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 4px;">Weekly Program Pulse</p>
          <h1 style="color:white;margin:0;font-size:20px;">CACFPLink</h1>
          <p style="color:rgba(255,255,255,0.65);font-size:12px;margin:6px 0 0;">Week of ${weekOf} · ${monthName} claim in progress</p>
        </div>

        <!-- Body -->
        <div style="border:1px solid #e5e7eb;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px;background:#fff;">
          <p style="font-size:15px;margin-top:0;">Hi ${name || 'there'},</p>
          <p style="color:#6b7280;font-size:14px;">Here's a quick look at where your ${monthName} claim stands right now.</p>

          <!-- 3 stat boxes -->
          <div style="display:flex;gap:12px;margin:20px 0;">
            <div style="flex:1;background:#f5f3ff;border:1px solid #ede9fe;border-radius:10px;padding:14px 12px;text-align:center;">
              <p style="font-size:10px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 4px;">Est. Reimbursement</p>
              <p style="font-size:20px;font-weight:800;color:#4f46e5;margin:0;">${fmt(estimatedReimbursement)}</p>
              <p style="font-size:10px;color:#a78bfa;margin:4px 0 0;">this month so far</p>
            </div>
            <div style="flex:1;background:${issueCount === 0 ? '#f0fdf4' : '#fff7ed'};border:1px solid ${issueCount === 0 ? '#bbf7d0' : '#fed7aa'};border-radius:10px;padding:14px 12px;text-align:center;">
              <p style="font-size:10px;font-weight:600;color:${issueCount === 0 ? '#15803d' : '#c2410c'};text-transform:uppercase;letter-spacing:0.06em;margin:0 0 4px;">Issues</p>
              <p style="font-size:20px;font-weight:800;color:${issueCount === 0 ? '#16a34a' : '#ea580c'};margin:0;">${issueCount}</p>
              <p style="font-size:10px;color:${issueCount === 0 ? '#4ade80' : '#f97316'};margin:4px 0 0;">${issueCount === 0 ? 'none found' : 'need attention'}</p>
            </div>
            <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 12px;text-align:center;">
              <p style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 4px;">Sites Ready</p>
              <p style="font-size:20px;font-weight:800;color:#0f172a;margin:0;">${sitesReady}<span style="font-size:13px;font-weight:400;color:#94a3b8;">/${totalSites}</span></p>
              <p style="font-size:10px;color:#94a3b8;margin:4px 0 0;">meal counts submitted</p>
            </div>
          </div>

          ${bodyContent}

          <!-- CTA -->
          <div style="text-align:center;margin:24px 0 16px;">
            <a href="${claimsUrl}"
               style="display:inline-block;background:#4f46e5;color:white;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
              Open Claims Center →
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
          <p style="color:#9ca3af;font-size:11px;margin:0;text-align:center;">
            — Hashi at CACFPLink<br/>
            <a href="${FRONTEND_URL}/login" style="color:#6366f1;">Dashboard</a> ·
            <a href="${claimsUrl}" style="color:#6366f1;">Claims Center</a>
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
  sendMonthlyReportEmail,
  sendWeeklyDigestEmail,
};
