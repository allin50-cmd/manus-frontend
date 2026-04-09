import { CheckCircle } from 'lucide-react';

const items = [
  'UK Compliance Aligned',
  'Official Companies House Data',
  '7-Year Record Ready',
  'Built for SMEs & Accountants',
];

export function TrustStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm text-slate-600 mt-6">
      {items.map((item) => (
        <span key={item} className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          {item}
        </span>
      ))}
    </div>
  );
}
