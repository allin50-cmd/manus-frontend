import Link from 'next/link';
import { Monitor, Bell, FileCheck } from 'lucide-react';

const points = [
  { icon: Monitor, label: 'Monitoring', sub: 'Starts immediately.' },
  { icon: Bell, label: 'Alerts Sent Before Deadlines', sub: '' },
  { icon: FileCheck, label: 'Audit-Ready Records', sub: '' },
];

export function CTASection() {
  return (
    <section className="text-center space-y-8">
      <h2 className="text-3xl font-bold text-slate-900">You're Covered From Day One.</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {points.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-semibold text-slate-800">{label}</p>
            {sub && <p className="text-sm text-slate-500">{sub}</p>}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-900">Activate Your Compliance Protection.</h3>
        <p className="text-slate-600">Get started in 60 seconds. Only pay for what you need.</p>
        <Link
          href="/check"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors mt-2"
        >
          Get Started Now
        </Link>
      </div>
    </section>
  );
}
