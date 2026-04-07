import Link from 'next/link';
import { Bell, Building2, ArrowRight } from 'lucide-react';

export function QuickActionsPanel() {
  const actions = [
    { href: '/alerts', icon: Bell, label: 'View My Alerts' },
    { href: '/companies', icon: Building2, label: 'Add Another Company' },
  ];

  return (
    <div className="rounded-xl border bg-white divide-y">
      {actions.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
          <Icon className="w-4 h-4 text-slate-500" />
          <span className="flex-1 text-sm text-slate-700">{label}</span>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </Link>
      ))}
    </div>
  );
}
