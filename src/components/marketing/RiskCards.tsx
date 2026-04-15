import { FileX, AlertTriangle, Building2 } from 'lucide-react';

const cards = [
  {
    icon: FileX,
    title: 'Missed Filing Penalties',
    description:
      'Late annual accounts trigger automatic fines starting at £150 for private companies, rising to £1,500 if overdue by 6+ months.',
    risk: 'High Risk',
    bg: 'bg-red-50',
    border: 'border-red-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    icon: AlertTriangle,
    title: 'Strike-Off Proceedings',
    description:
      'Missing your confirmation statement can trigger strike-off action — resulting in dissolution and permanent loss of your company name.',
    risk: 'Critical Risk',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    icon: Building2,
    title: 'Reputational Damage',
    description:
      'Overdue filings appear on your public Companies House record — visible to banks, investors, and clients doing routine due diligence.',
    risk: 'Medium Risk',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
];

export function RiskCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map(({ icon: Icon, title, description, risk, bg, border, iconBg, iconColor, badgeColor }) => (
        <div key={title} className={`rounded-xl border ${border} ${bg} p-6 space-y-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor} shrink-0`}>{risk}</span>
          </div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>
      ))}
    </div>
  );
}
