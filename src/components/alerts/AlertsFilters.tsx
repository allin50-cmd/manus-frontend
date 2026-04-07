'use client';

interface Props {
  active: string;
  onChange: (tab: string) => void;
  counts: { all: number; upcoming: number; overdue: number; resolved: number };
}

export function AlertsFilters({ active, onChange, counts }: Props) {
  const tabs = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'upcoming', label: `Upcoming (${counts.upcoming})` },
    { key: 'overdue', label: `Overdue (${counts.overdue})` },
    { key: 'resolved', label: `Resolved (${counts.resolved})` },
  ];

  return (
    <div className="flex gap-1 border-b">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active === key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
