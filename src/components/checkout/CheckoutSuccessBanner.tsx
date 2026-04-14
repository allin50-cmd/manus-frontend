import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface Props {
  companyName: string;
}

export function CheckoutSuccessBanner({ companyName }: Props) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <div>
        <h2 className="text-2xl font-bold text-slate-900">You're All Set!</h2>
        <p className="text-slate-600 mt-1">FineGuard Pro is now monitoring {companyName}.</p>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate-700 py-2">
        <span className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" /> We'll send alerts before any deadlines
        </span>
        <span className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" /> We'll track changes to your company status
        </span>
        <span className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" /> You'll stay compliant and avoid penalties
        </span>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
