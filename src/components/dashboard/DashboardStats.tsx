import type { DashboardStats } from '@/types/dashboard';

export function DashboardStats({ stats }: { stats: DashboardStats }) {
  const items = [
    { label: 'Active Alerts', value: stats.companiesMonitored, sub: 'Services covered' },
    { label: 'Next Deadline', value: stats.upcomingDeadlines, sub: 'Upcoming' },
    { label: 'Risk Level', value: stats.overdueCount === 0 ? 'LOW' : 'HIGH', sub: stats.overdueCount === 0 ? 'All good' : `${stats.overdueCount} overdue` },
    { label: 'Companies Monitored', value: '1', sub: 'Active' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(({ label, value, sub }) => (
        <div key={label} className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}
