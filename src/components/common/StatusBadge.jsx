const STATUS_STYLES = {
  draft:        'bg-gray-100 text-gray-600',
  submitted:    'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  pending:      'bg-yellow-100 text-yellow-700',
  active:       'bg-green-100 text-green-700',
  suspended:    'bg-red-100 text-red-700',
  inactive:     'bg-gray-100 text-gray-500',
  valid:        'bg-green-100 text-green-700',
  expiring_soon:'bg-yellow-100 text-yellow-700',
  expired:      'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  draft:        'Draft',
  submitted:    'Submitted',
  under_review: 'Under Review',
  approved:     'Approved',
  rejected:     'Rejected',
  pending:      'Pending',
  active:       'Active',
  suspended:    'Suspended',
  inactive:     'Inactive',
  valid:        'Valid',
  expiring_soon:'Expiring Soon',
  expired:      'Expired',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500';
  const label = STATUS_LABELS[status] ?? status ?? '—';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
