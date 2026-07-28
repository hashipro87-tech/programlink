// OnboardingPage.jsx — First-time sponsor setup guide
// Shown inline on the sponsor overview until all steps are visited or "Go to Dashboard" is clicked.
// Visited steps are tracked in localStorage per user.

import { useState } from 'react';

export default function OnboardingPage({ onDismiss }) {
  const [visited, setVisited] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cacfplink_onboarding_steps') || '[]'); }
    catch { return []; }
  });

  const markVisited = (num) => {
    const next = visited.includes(num) ? visited : [...visited, num];
    setVisited(next);
    localStorage.setItem('cacfplink_onboarding_steps', JSON.stringify(next));
  };
  const steps = [
    {
      num: 1,
      icon: '🏫',
      title: 'Add your first site',
      desc: 'Add the child care centers in your program. Each site tracks its own meal counts and documents.',
      cta: 'Add a Site',
      path: '/dashboard/sponsor/sites',
    },
    {
      num: 2,
      icon: '🍳',
      title: 'Connect a kitchen',
      desc: 'Add the kitchen that prepares meals for your sites. Kitchens manage meal production and delivery.',
      cta: 'Add a Kitchen',
      path: '/dashboard/sponsor/kitchens',
    },
    {
      num: 3,
      icon: '👤',
      title: 'Invite a coordinator',
      desc: 'Coordinators help manage your sites and kitchens. Invite them directly — they don't need to register a separate account.',
      cta: 'Go to Coordinators',
      path: '/dashboard/sponsor/coordinators',
    },
    {
      num: 4,
      icon: '💰',
      title: 'Check your Claims Center',
      desc: 'Your state reimbursement rates are already configured. The Claims Center shows your estimated reimbursement and any issues to fix before submission.',
      cta: 'View Claims',
      path: '/dashboard/sponsor/claims',
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
          Here's how to set up your CACFP program. Use the sidebar to complete each step, then mark it done.
        </p>
      </div>

      {/* Key insight callout */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 12, padding: '14px 18px', marginBottom: 28,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', margin: '0 0 4px' }}>
            Everything is managed from your dashboard
          </p>
          <p style={{ fontSize: 13, color: '#1d4ed8', margin: 0, lineHeight: 1.5 }}>
            You don't need to register separate accounts for coordinators, sites, or kitchens.
            Invite them directly from here — they'll receive an email and join your program automatically.
          </p>
        </div>
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
              background: visited.includes(step.num) ? '#dcfce7' : '#eef2ff',
              color: visited.includes(step.num) ? '#16a34a' : '#4f46e5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800,
            }}>
              {visited.includes(step.num) ? '✓' : step.num}
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

            {/* CTA / Done badge */}
            {visited.includes(step.num) ? (
              <span style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 8,
                background: '#f0fdf4',
                color: '#16a34a',
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>✓ Done</span>
            ) : (
              <button
                onClick={() => markVisited(step.num)}
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
                Mark done ✓
              </button>
            )}
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
