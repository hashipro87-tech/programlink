// analytics.js — thin wrapper around GA4's gtag
// Use these helpers anywhere in the app to fire custom events.

export function track(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// Convenience shortcuts
export const trackCTAClick   = (label) => track('cta_click',            { label });
export const trackRoleSelect = (role)  => track('register_role_select', { role });
export const trackSignUp     = (role)  => track('sign_up',              { method: role });

// Registration funnel drop-off tracking
export const trackRegisterField  = (field)  => track('register_field_focus',  { field });
export const trackRegisterAbort  = (step, last_field) => track('register_abandoned', { step, last_field });
export const trackRegisterSubmit = (role)   => track('register_submitted',    { role });

// Demo role tracking
export const trackDemoRoleClick  = (role)   => track('demo_role_click',       { role });
