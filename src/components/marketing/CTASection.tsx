import Link from 'next/link';
import { ArrowRight, ShieldCheck, Bell, FileCheck, Clock } from 'lucide-react';

const benefits = [
  { icon: Clock, text: 'Setup in 60 seconds' },
  { icon: Bell, text: 'First alert within minutes' },
  { icon: ShieldCheck, text: 'Cancel anytime' },
  { icon: FileCheck, text: 'Official Companies House data' },
];

export function CTASection() {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-10 md:p-14 text-center text-white space-y-7">
      <div className="space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold leading-tight">
          Don&apos;t Wait for the Penalty Notice.
        </h2>
        <p className="text-blue-100 text-lg max-w-xl mx-auto">
          Check your company&apos;s deadlines now. Setup takes 60 seconds.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-blue-100">
        {benefits.map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5">
            <Icon className="w-4 h-4 text-blue-300 shrink-0" />
            {text}
          </span>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-1">
        <Link
          href="/check"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-blue-700 px-8 py-3.5 font-semibold hover:bg-blue-50 transition-colors"
        >
          Check My Company
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-xl border border-blue-400 text-white px-8 py-3.5 font-semibold hover:bg-blue-700 transition-colors"
        >
          See Pricing
        </Link>
      </div>

      <p className="text-xs text-blue-300">No credit card required to check your company&apos;s status.</p>
    </div>
  );
}
