import { FileX, AlertTriangle, Building2 } from 'lucide-react';

const cards = [
  { icon: FileX, title: 'Missed Filings', description: 'Prevent costly filing mistakes.' },
  { icon: AlertTriangle, title: 'Late Penalties', description: 'Avoid fines & warnings.' },
  { icon: Building2, title: 'Strike-Off Risks', description: 'Protect your company status.' },
];

export function RiskCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map(({ icon: Icon, title, description }) => (
        <div key={title} className="rounded-xl border bg-white p-6 shadow-sm text-center">
          <Icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      ))}
    </div>
  );
}
