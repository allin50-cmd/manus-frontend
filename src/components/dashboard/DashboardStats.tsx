import type { DashboardStats } from '@/types/dashboard';
import { Bell, Calendar, AlertTriangle, Building2 } from 'lucide-react';

type ColorKey = 'blue' | 'indigo' | 'green' | 'red' | 'purple';

const COLOR_MAP: Record<ColorKey, { bg: string; icon: string; value: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-700' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', value: 'text-indigo-700' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', value: 'text-green-700' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', value: 'text-red-700' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', value: 'text-purple-700' },
};

export function DashboardStats({ stats }: { stats: DashboardStats }) {
  const isHighRisk = stats.overdueCount > 0;
  const riskColor: ColorKey = isHighRisk ? 'red' : 'green';

  const items = [
    {
      icon: Bell,
      label: 'Active Alerts',
      value: stats.companiesMonitored,
      sub: 'Services covered',
      color: 'blue' as ColorKey,
    },
    {
      icon: Calendar,
      label: 'Upcoming',
      value: stats.upcomingDeadlines,
      sub: 'Deadlines tracked',
      color: 'indigo' as ColorKey,
    },
    {
      icon: AlertTriangle,
      label: 'Risk Level',
      value: isHighRisk ? 'HIGH' : 'LOW',
      sub: isHighRisk ? `${stats.overdueCount} overdue` : 'All good',
      color: riskColor,
    },
    {
      icon: Building2,
      label: 'Companies',
      value: '1',
      sub: 'Monitored',
      color: 'purple' as ColorKey,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(({ icon: Icon, label, value, sub, color }) => {
        const c = COLOR_MAP[color];
        return (
          <div key={label} className="rounded-xl border bg-white p-4 flex gap-3 items-start">
            <div className={`${c.bg} rounded-lg p-2.5 shrink-0`}>
              <Icon className={`w-5 h-5 ${c.icon}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wide truncate">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${c.value}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
