import type { Company } from '@/types/company';
import { Building2, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/companies-house/deadlines';

export function CompanyResultCard({ company }: { company: Company }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border bg-white shadow-sm">
      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
        <span className="text-blue-700 font-bold text-lg">{company.name.slice(0, 2).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-slate-900 truncate">{company.name}</h2>
        <p className="text-sm text-slate-500">Company No. {company.number}</p>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" /> {company.status}
          </span>
          {company.incorporationDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Incorporated {formatDate(company.incorporationDate)}
            </span>
          )}
        </div>
      </div>
      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
        company.compliance.status === 'compliant' ? 'bg-green-100 text-green-700' :
        company.compliance.status === 'warning' ? 'bg-orange-100 text-orange-700' :
        'bg-red-100 text-red-700'
      }`}>
        {company.compliance.status.charAt(0).toUpperCase() + company.compliance.status.slice(1)}
      </span>
    </div>
  );
}
