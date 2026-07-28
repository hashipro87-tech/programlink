// OnboardingPage.jsx — First-time sponsor setup guide
// Steps 1 and 2 are "Done" only when the sponsor actually has sites/kitchens in the DB.
// Step 3 (coordinator) is self-reported via "Already done" button.

import { useState } from 'react';

export default function OnboardingPage({ onDismiss, siteCount = 0, kitchenCount = 0 }) {
  const [coordinatorDone, setCoordinatorDone] = useState(() => {
    try { return Boolean(localStorage.getItem('cacfplink_coordinator_done')); }
    catch { return false; }
  });

  const markCoordinatorDone = () => {
    try { localStorage.setItem('cacfplink_coordinator_done', '1'); } catch {}
    setCoordinatorDone(true);
  };

  const steps = [
    {
      num: 1,
      icon: '🏫',
      title: 'Add your first site',
      desc: 'Add the child care centers in your program. Each site tracks its own meal counts and documents.',
      cta: 'Add a Site',
      path: '/dashboard/sponsor/sites',
      done: siteCount > 0,
    },
    {
      num: 2,
      icon: '🍳',
      title: 'Connect a kitchen',
      desc: 'Add the kitchen that prepares meals for your sites. Kitchens manage meal production and delivery.',
      cta: 'Add a Kitchen',
      path: '/dashboard/sponsor/kitchens',
      done: kitchenCount > 0,
    },
    {
      num: 3,
      icon: '👤',
      title: 'Invite a coordinator',
      desc: "Coordinators help manage your sites and kitchens. Invite them directly — they don't need to register a separate account.",
      cta: 'Go to Coordinators',
      path: '/dashboard/sponsor/coordinators',
      done: coordinatorDone,
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
          Here's how to set up your CACFP program. Complete these steps to get started.
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
            border: `1px solid ${step.done ? '#bbf7d0' : '#e5e7eb'}`,
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}>
            {/* Step number / checkmark */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: step.done ? '#dcfce7' : '#eef2ff',
              color: step.done ? '#16a34a' : '#4f46e5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800,
            }}>
              {step.done ? '✓' : step.num}
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
            {step.done ? (
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => onDismiss(step.path)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#4f46e5',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.cta} →
                </button>
                {step.num === 3 && (
                  <button
                    onClick={markCoordinatorDone}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                      background: 'transparent',
                      color: '#9ca3af',
                      fontSize: 11,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Already done ✓
                  </button>
                )}
              </div>
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
