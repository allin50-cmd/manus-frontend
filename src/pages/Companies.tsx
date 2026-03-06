import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockCompanies } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Company } from '@/types/fineguard';

export default function Companies() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = mockCompanies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.companyNumber.includes(search) ||
    c.vrn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Companies"
        description="Manage all companies under your practice"
        actions={
          <button className="btn-primary flex items-center gap-2 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Add Company
          </button>
        }
      />

      {/* Search */}
      <div className="card mb-6 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company number, or VRN..."
            className="input pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Company No.</th>
                <th>VRN</th>
                <th>VAT Scheme</th>
                <th>Next VAT Return</th>
                <th>Filing Status</th>
                <th>Sync Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No companies found
                  </td>
                </tr>
              ) : (
                filtered.map(company => (
                  <CompanyRow
                    key={company.id}
                    company={company}
                    onClick={() => navigate(`/companies`)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {filtered.map(company => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  );
}

function CompanyRow({ company, onClick }: { company: Company; onClick: () => void }) {
  const VAT_SCHEME_LABELS: Record<string, string> = {
    standard: 'Standard',
    flat_rate: 'Flat Rate',
    cash_accounting: 'Cash Accounting',
    annual_accounting: 'Annual Accounting',
  };

  return (
    <tr className="cursor-pointer" onClick={onClick}>
      <td>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              company.syncStatus === 'in_sync' ? 'bg-green-500' :
              company.syncStatus === 'variance_detected' ? 'bg-amber-500' : 'bg-gray-400'
            )}
          />
          <span className="font-medium text-gray-900">{company.name}</span>
        </div>
      </td>
      <td className="font-mono text-gray-600">{company.companyNumber}</td>
      <td className="font-mono text-gray-600">{company.vrn}</td>
      <td>{VAT_SCHEME_LABELS[company.vatScheme] ?? company.vatScheme}</td>
      <td>{formatDate(company.nextVATReturn)}</td>
      <td><StatusBadge status={company.filingStatus} /></td>
      <td><StatusBadge status={company.syncStatus} /></td>
      <td>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </td>
    </tr>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const navigate = useNavigate();

  return (
    <div
      className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/mtd')}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">{company.name}</h3>
            <p className="text-xs text-gray-400">{company.companyNumber}</p>
          </div>
        </div>
        <StatusBadge status={company.filingStatus} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs text-gray-400">VRN</p>
          <p className="text-xs font-mono font-medium text-gray-700">{company.vrn}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Next VAT Return</p>
          <p className="text-xs font-medium text-gray-700">{formatDate(company.nextVATReturn)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              company.syncStatus === 'in_sync' ? 'bg-green-500' :
              company.syncStatus === 'variance_detected' ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'
            )}
          />
          <span className="text-xs text-gray-500">
            {company.syncStatus === 'in_sync' ? 'In Sync' : 'Variance Detected'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <RefreshCw className="w-3 h-3" />
          {formatDate(company.lastSynced)}
        </div>
      </div>
    </div>
  );
}
