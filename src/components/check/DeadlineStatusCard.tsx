import type { Company } from '@/types/company';
import { FileText } from 'lucide-react';
import { formatDate, isDeadlineAvailable } from '@/lib/companies-house/deadlines';

export function DeadlineStatusCard({ company }: { company: Company }) {
  const { accounts, confirmationStatement } = company.compliance;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Accounts */}
      {isDeadlineAvailable(accounts) ? (
        <div className={`p-4 rounded-xl border ${accounts.overdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <p className="text-sm font-semibold flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4" /> Accounts Filing
          </p>
          <p className={`text-xl font-bold ${accounts.overdue ? 'text-red-700' : 'text-blue-700'}`}>
            {accounts.overdue ? `${Math.abs(accounts.daysUntilDue)} days overdue` : `Due in ${accounts.daysUntilDue} days`}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">Due {formatDate(accounts.nextDue)}</p>
        </div>
      ) : (
        <div className="p-4 rounded-xl border bg-slate-50 border-slate-200">
          <p className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Accounts Filing</p>
          <p className="text-sm text-slate-500 mt-1">No data available</p>
        </div>
      )}

      {/* Confirmation Statement */}
      {isDeadlineAvailable(confirmationStatement) ? (
        <div className={`p-4 rounded-xl border ${confirmationStatement.overdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <p className="text-sm font-semibold flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4" /> Confirmation Statement
          </p>
          <p className={`text-xl font-bold ${confirmationStatement.overdue ? 'text-red-700' : 'text-blue-700'}`}>
            {confirmationStatement.overdue ? `${Math.abs(confirmationStatement.daysUntilDue)} days overdue` : `Due in ${confirmationStatement.daysUntilDue} days`}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">Due {formatDate(confirmationStatement.nextDue)}</p>
        </div>
      ) : (
        <div className="p-4 rounded-xl border bg-slate-50 border-slate-200">
          <p className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Confirmation Statement</p>
          <p className="text-sm text-slate-500 mt-1">No data available</p>
        </div>
      )}
    </div>
  );
}
