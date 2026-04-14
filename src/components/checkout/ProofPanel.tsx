import { ShieldCheck } from 'lucide-react';

export function ProofPanel() {
  return (
    <div className="rounded-xl border bg-slate-50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-semibold text-slate-900">This protects you from:</h3>
      </div>
      <ul className="space-y-2 text-sm text-slate-700">
        <li>Missed filing deadlines</li>
        <li>Late submission penalties</li>
        <li>Avoidable compliance surprises</li>
        <li>Strike-off risk going unnoticed</li>
      </ul>
      <div className="border-t pt-4 space-y-1.5 text-sm text-slate-600">
        <p>Monitoring starts as soon as payment completes</p>
        <p>Only pay for the services you activate</p>
        <p>No contracts — cancel anytime</p>
        <p>Secure payment powered by Stripe</p>
      </div>
    </div>
  );
}
