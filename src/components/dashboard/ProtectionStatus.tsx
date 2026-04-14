import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface Props {
  companyName: string;
  alertCount: number;
}

export function ProtectionStatus({ companyName, alertCount }: Props) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Protection Active</p>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Your compliance monitoring is active and up to date.
          </h2>
          <p className="text-sm text-green-700 mt-0.5">
            {companyName} — {alertCount} service{alertCount !== 1 ? 's' : ''} covered
          </p>
        </div>
      </div>
      <Link href="/alerts" className="shrink-0 text-sm font-semibold text-blue-600 hover:underline whitespace-nowrap">
        View My Alerts →
      </Link>
    </div>
  );
}
