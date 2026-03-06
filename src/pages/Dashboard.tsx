import { useNavigate } from 'react-router-dom';
import {
  FileText, AlertTriangle, Receipt, Clock, TrendingUp,
  CheckCircle, XCircle, ArrowRight, Scale, Building2
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import VATBoxCard from '@/components/ui/VATBoxCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockDashboardStats, mockComplianceAlerts, mockReceipts, mockCompanies } from '@/lib/mockData';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, selectedCompanyId } = useAuth();
  const stats = mockDashboardStats;
  const daysLeft = daysUntil(stats.nextVATDeadline);
  const company = mockCompanies.find(c => c.id === selectedCompanyId);
  const recentAlerts = mockComplianceAlerts.filter(a => !a.isResolved).slice(0, 3);
  const recentReceipts = mockReceipts.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={`Welcome back, ${user?.name.split(' ')[0]}`}
        description={company ? `${company.name} · ${company.vrn}` : 'Select a company to get started'}
        actions={
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                stats.syncStatus === 'in_sync'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {stats.syncStatus === 'in_sync' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {stats.syncStatus === 'in_sync' ? 'IN SYNC' : 'VARIANCE DETECTED'}
            </div>
          </div>
        }
      />

      {/* VAT Deadline Banner */}
      {daysLeft <= 60 && (
        <div
          className={`mb-6 flex items-center justify-between p-4 rounded-lg border ${
            daysLeft <= 14
              ? 'bg-red-50 border-red-200'
              : daysLeft <= 30
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock
              className={`w-5 h-5 ${
                daysLeft <= 14 ? 'text-red-500' : daysLeft <= 30 ? 'text-amber-500' : 'text-blue-500'
              }`}
            />
            <div>
              <p className="font-medium text-sm text-gray-900">
                VAT Return due in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500">
                Q1 2025 (Jan–Mar) due by {formatDate(stats.nextVATDeadline)} · Status:{' '}
                <StatusBadge status={stats.vatReturnStatus} size="sm" />
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/mtd')}
            className="btn-primary text-xs py-1.5 flex items-center gap-1"
          >
            Open MTD Centre <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Next VAT Deadline"
          value={`${daysLeft}d`}
          subtitle={formatDate(stats.nextVATDeadline)}
          icon={Clock}
          variant={daysLeft <= 14 ? 'danger' : daysLeft <= 30 ? 'warning' : 'default'}
          onClick={() => navigate('/mtd')}
        />
        <StatCard
          title="VAT Liability Estimate"
          value={formatCurrency(stats.vatLiabilityEstimate)}
          subtitle="Net VAT due (Box 5)"
          icon={TrendingUp}
          variant="info"
          onClick={() => navigate('/vat')}
        />
        <StatCard
          title="Compliance Alerts"
          value={stats.unreadAlerts}
          subtitle={`${stats.unreadAlerts} unread`}
          icon={AlertTriangle}
          variant={stats.unreadAlerts > 0 ? 'warning' : 'success'}
          onClick={() => navigate('/alerts')}
        />
        <StatCard
          title="Staging Queue"
          value={stats.pendingStaging}
          subtitle="awaiting verification"
          icon={Receipt}
          variant={stats.pendingStaging > 0 ? 'warning' : 'success'}
          onClick={() => navigate('/staging')}
        />
      </div>

      {/* VAT Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">VAT Position — Q1 2025</h2>
              <button
                onClick={() => navigate('/mtd')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Full MTD Centre <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <VATBoxCard
                  boxNumber={1}
                  label="VAT on Sales"
                  value={stats.vatBoxes.box1}
                />
                <VATBoxCard
                  boxNumber={4}
                  label="VAT Reclaimable"
                  value={stats.vatBoxes.box4}
                  isReclaim
                />
                <VATBoxCard
                  boxNumber={5}
                  label="Net VAT Due"
                  value={stats.vatBoxes.box5}
                  isDue
                />
                <VATBoxCard
                  boxNumber={6}
                  label="Total Sales"
                  value={stats.vatBoxes.box6}
                />
                <VATBoxCard
                  boxNumber={7}
                  label="Total Purchases"
                  value={stats.vatBoxes.box7}
                />
                <VATBoxCard
                  boxNumber={3}
                  label="Total VAT Due"
                  value={stats.vatBoxes.box3}
                  isTotal
                />
              </div>
            </div>
          </div>
        </div>

        {/* Companies Summary */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Companies</h2>
            <button
              onClick={() => navigate('/companies')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {mockCompanies.slice(0, 3).map(company => (
              <div key={company.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900 leading-tight">
                      {company.name.split(' ').slice(0, 2).join(' ')}
                    </p>
                    <p className="text-xs text-gray-400">{company.vrn}</p>
                  </div>
                </div>
                <StatusBadge status={company.filingStatus} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Receipts */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Receipts</h2>
            </div>
            <button
              onClick={() => navigate('/receipts')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentReceipts.map(receipt => (
              <div key={receipt.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {receipt.extractedFields?.supplier ?? receipt.fileName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {receipt.extractedFields
                      ? formatCurrency(receipt.extractedFields.gross)
                      : receipt.fileName}
                  </p>
                </div>
                <StatusBadge status={receipt.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Alerts */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Compliance Alerts</h2>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAlerts.length === 0 ? (
              <div className="px-6 py-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No active alerts</p>
              </div>
            ) : (
              recentAlerts.map(alert => (
                <div key={alert.id} className="px-6 py-3 flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 leading-tight">{alert.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{alert.companyName}</p>
                  </div>
                  <StatusBadge status={alert.severity} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
