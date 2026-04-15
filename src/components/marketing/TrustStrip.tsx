import { Building2, TrendingDown, Users, Clock } from 'lucide-react';

const stats = [
  { icon: Building2, value: '12,400+', label: 'Companies Protected' },
  { icon: TrendingDown, value: '£2.1M+', label: 'Penalties Avoided' },
  { icon: Users, value: '4,800+', label: 'UK Business Owners' },
  { icon: Clock, value: '60 days', label: 'Earliest Alert' },
];

export function TrustStrip() {
  return (
    <div className="mt-12 border-t border-slate-200 pt-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <Icon className="w-5 h-5 text-blue-500 mb-0.5" />
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 text-center">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
