'use client';

import { useCompanyStore } from '@/lib/stores/company-store';
import { ALERT_LABELS, type AlertType } from '@/types/alerts';
import { formatPence } from '@/lib/utils/currency';

const ALL_SERVICES: AlertType[] = ['accounts_filing', 'confirmation_statement', 'strike_off'];

export function CheckoutSummary() {
  const { company, selectedServices, totalMonthly } = useCompanyStore();

  if (!selectedServices.length) return null;

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
      <h3 className="text-base font-semibold text-slate-900">Order Summary</h3>
      {company && (
        <p className="text-sm text-slate-600">Company: <span className="font-medium text-slate-900">{company.name}</span></p>
      )}
      <div className="space-y-2">
        {ALL_SERVICES.filter((s) => selectedServices.includes(s)).map((type) => (
          <div key={type} className="flex justify-between text-sm">
            <span className="text-slate-700">{ALERT_LABELS[type]}</span>
            <span className="font-medium">£1.00/month</span>
          </div>
        ))}
      </div>
      <div className="border-t pt-3 flex justify-between font-semibold text-base">
        <span>Total</span>
        <span>{formatPence(totalMonthly())}/month</span>
      </div>
    </div>
  );
}
