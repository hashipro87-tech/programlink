const COLOR_MAP = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red:    'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  gray:   'bg-gray-100 text-gray-500',
};

export default function StatCard({ label, value, icon: Icon, color = 'blue' }) {
  const iconClass = COLOR_MAP[color] ?? COLOR_MAP.blue;

  return (
    <div className="card p-5 flex items-center gap-4">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
