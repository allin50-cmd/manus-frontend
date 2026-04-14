import type { MonitoredCompanyRow } from '@/types/dashboard';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/EmptyState';

export function CompaniesTable({ companies }: { companies: MonitoredCompanyRow[] }) {
  if (!companies.length) {
    return (
      <EmptyState
        title="No companies monitored"
        description="Add your first company to start compliance monitoring."
        action={<Link href="/check" className="text-sm text-blue-600 hover:underline">Check a Company →</Link>}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            {['Company', 'Company No.', 'Services Active', 'Next Deadline', 'Status', 'Actions'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {companies.map((company) => (
            <tr key={company.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{company.companyName}</td>
              <td className="px-4 py-3 text-slate-500 font-mono">{company.companyNumber}</td>
              <td className="px-4 py-3 text-slate-600">{company.activeAlerts?.length ?? 0} Services</td>
              <td className="px-4 py-3 text-slate-500">—</td>
              <td className="px-4 py-3">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
              </td>
              <td className="px-4 py-3">
                <Link href={`/dashboard?company=${company.companyNumber}`} className="text-xs text-blue-600 hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
