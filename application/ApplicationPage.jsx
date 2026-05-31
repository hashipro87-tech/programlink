// ApplicationPage.jsx — Smart wrapper used by kitchen, site, and delivery dashboards
// Decides whether to show the multi-step form (draft) or the status tracker (submitted+).
// This is the component that gets mounted at /dashboard/kitchen/application etc.

import { useState } from 'react';
import { useApplication } from '../../hooks/useApplication';
import ApplicationFlow   from './ApplicationFlow';
import ApplicationStatus from './ApplicationStatus';

export default function ApplicationPage() {
  const { application, loading } = useApplication();
  // After a fresh submit, force the status view without needing a page reload
  const [forceStatus, setForceStatus] = useState(false);
  const [forceNew,    setForceNew]    = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show the form if: no application yet, it's a draft, or the user chose to start fresh
  const showForm = forceNew || (!forceStatus && (!application || application.status === 'draft'));

  if (showForm) {
    return (
      <ApplicationFlow
        onSubmitted={() => {
          setForceStatus(true);
          setForceNew(false);
        }}
      />
    );
  }

  return (
    <ApplicationStatus
      onStartNew={() => {
        setForceNew(true);
        setForceStatus(false);
      }}
    />
  );
}
