// OnboardingPage.jsx — First-time sponsor setup guide
// Shown inline on the sponsor overview on first login.
// Dismissed by clicking any step CTA or "Go to Dashboard".
// Dismissal is tracked in localStorage per user so it only shows once.

export default function OnboardingPage({ onDismiss }) {
  const steps = [
    {
      num: 1,
      icon: '⚙️',
      title: 'Set up your organization',
      desc: 'Pick your CACFP state so the Claims Center knows your reimbursement rates and submission deadlines.',
      cta: 'Go to Settings',
      path: '/dashboard/sponsor/settings',
    },
    {
      num: 2,
      icon: '🏫',
      title: 'Add your first site',
      desc: 'Add the child care centers in your program. Each site tracks its own meal counts and documents.',
      cta: 'Add a Site',
      path: '/dashboard/sponsor/sites',
    },
    {
      num: 3,
      icon: '🍳',
      title: 'Connect a kitchen',
      desc: 'Add the kitchen that prepares meals for your sites. Kitchens manage meal production and delivery.',
      cta: 'Add a Kitchen',
      path: '/dashboard/sponsor/kitchens',
    },
    {
      num: 4,
      icon: '🔗',
      title: 'Share your Sponsor ID',
      desc: 'Sites and kitchens can use your Sponsor ID to register and join your program automatically — no manual linking needed.',
      cta: 'View My Sponsor ID',
      path: null, // stays on overview
    },
  ];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '12px 0 40px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
          Your sponsor account is ready!
        </h1>
        <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>
          Here's how to set up your CACFP program. Complete these in any order.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {steps.map((step) => (
          <div key={step.num} style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}>
            {/* Step number */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: '#eef2ff', color: '#4f46e5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800,
            }}>
              {step.num}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                {step.icon} {step.title}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                {step.desc}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => onDismiss(step.path)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#374151',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; }}
            >
              {step.cta} →
            </button>
          </div>
        ))}
      </div>

      {/* Go to Dashboard */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => onDismiss(null)}
          style={{
            padding: '13px 36px',
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
          }}
        >
          Go to Dashboard
        </button>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 10 }}>
          You can access all of these from the sidebar at any time.
        </div>
      </div>
    </div>
  );
}
