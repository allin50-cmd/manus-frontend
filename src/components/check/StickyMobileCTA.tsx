'use client';

import Link from 'next/link';
import { useCompanyStore } from '@/lib/stores/company-store';
import { formatPence } from '@/lib/utils/currency';

export function StickyMobileCTA() {
  const { selectedServices, totalMonthly } = useCompanyStore();

  if (!selectedServices.length) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t shadow-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected</p>
          <p className="text-base font-bold text-slate-900">{formatPence(totalMonthly())}/mo</p>
        </div>
        <Link
          href="/checkout"
          className="flex-1 max-w-xs inline-flex items-center justify-center rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Continue to Checkout
        </Link>
      </div>
    </div>
  );
}
