import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function AddCompanyPanel() {
  return (
    <div className="rounded-xl border bg-slate-50 p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
        <div>
          <p className="font-semibold text-slate-900">Protect another company today</p>
          <p className="text-sm text-slate-500">Extend your compliance protection to more businesses.</p>
        </div>
      </div>
      <Link
        href="/check"
        className="shrink-0 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Add Another Company
      </Link>
    </div>
  );
}
