import { Search, Bell, ShieldCheck } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: Search,
    title: 'Enter Your Company',
    description:
      'Search by company name or number. We verify instantly against the live UK Companies House register.',
  },
  {
    number: 2,
    icon: Bell,
    title: 'Choose Your Coverage',
    description:
      'Select accounts filing, confirmation statements, or strike-off monitoring. Just £1/month per service.',
  },
  {
    number: 3,
    icon: ShieldCheck,
    title: 'Stay Ahead of Deadlines',
    description:
      'Receive alerts at 60, 30, 14 and 7 days before every deadline. Never face a surprise penalty again.',
  },
];

export function HowItWorks() {
  return (
    <div className="relative">
      {/* Connecting line (desktop only) */}
      <div
        aria-hidden="true"
        className="absolute top-8 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] hidden md:block h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 text-center relative">
        {steps.map(({ number, icon: Icon, title, description }) => (
          <div key={number} className="flex flex-col items-center gap-5">
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 ring-4 ring-white">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                {number}
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-base">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-[220px] mx-auto">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
