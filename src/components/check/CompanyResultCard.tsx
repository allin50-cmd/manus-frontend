import type { Company } from '@/types/company';
import { Building2, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/companies-house/deadlines';
import { computeTrustScore } from '@/lib/trust/score';
import { TrustBadge } from '@/components/trust/TrustBadge';

export function CompanyResultCard({ company }: { company: Company }) {
  const trust = computeTrustScore(company);

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-start gap-4 p-4">
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
        <TrustBadge trust={trust} variant="compact" className="shrink-0 mt-0.5" />
      </div>

      {/* Trust verification strip */}
      <TrustBadge trust={trust} className="rounded-none border-0 border-t" />
    </div>
  );
}
