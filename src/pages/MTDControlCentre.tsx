import { useState } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, FileText,
  Send, Download, Shield, Clock, Lock
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import VATBoxCard from '@/components/ui/VATBoxCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockVATReturn, mockLedgerEntries, mockReceipts } from '@/lib/mockData';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ValidationCheck {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  blocking: boolean;
}

export default function MTDControlCentre() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const vatReturn = mockVATReturn;
  const daysLeft = daysUntil(vatReturn.dueDate);

  const stagedRecords = mockReceipts.filter(r => r.status === 'extracted' || r.status === 'uploaded');
  const unverifiedLedger = mockLedgerEntries.filter(l => l.status === 'unverified');
  const isPartner = user?.role === 'partner';

  const validationChecks: ValidationCheck[] = [
    {
      id: 'ledger_locked',
      label: 'Ledger Locked',
      description: `${unverifiedLedger.length === 0 ? 'All' : `${unverifiedLedger.length}`} ledger entries ${unverifiedLedger.length === 0 ? 'are verified and locked' : 'require verification'}`,
      passed: unverifiedLedger.length === 0,
      blocking: true,
    },
    {
      id: 'no_staged',
      label: 'No Staged Records',
      description: `${stagedRecords.length === 0 ? 'No' : stagedRecords.length} receipt${stagedRecords.length !== 1 ? 's' : ''} in staging queue`,
      passed: stagedRecords.length === 0,
      blocking: true,
    },
    {
      id: 'vat_verified',
      label: 'VAT Totals Verified',
      description: 'All VAT box calculations have been reviewed and confirmed',
      passed: vatReturn.status !== 'draft',
      blocking: true,
    },
    {
      id: 'authorized',
      label: 'Authorised User',
      description: isPartner
        ? 'You have partner-level authorisation to submit MTD filings'
        : 'Only partners can authorise MTD submissions',
      passed: isPartner,
      blocking: true,
    },
  ];

  const allChecksPassed = validationChecks.every(c => c.passed);
  const blockingFailed = validationChecks.filter(c => c.blocking && !c.passed);

  const handleValidate = async () => {
    // In production: call POST /vat/validate
    alert('VAT Return validated successfully. Status updated to: Validated.');
  };

  const handleSubmit = async () => {
    if (!allChecksPassed) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">MTD Submission Successful</h2>
        <p className="text-gray-500 mb-2">
          Your VAT return for Q1 2025 has been submitted to HMRC.
        </p>
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-left max-w-sm mx-auto">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Submission ID</span>
              <span className="font-mono text-gray-900">MTD-2025-03-{Math.floor(Math.random() * 9000) + 1000}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Submitted at</span>
              <span className="text-gray-900">{new Date().toLocaleString('en-GB')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Net VAT due</span>
              <span className="font-bold text-red-700">{formatCurrency(vatReturn.boxes.box5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Authorised by</span>
              <span className="text-gray-900">{user?.name}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="btn-secondary mt-6"
        >
          Return to MTD Centre
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="MTD Control Centre"
        description="Making Tax Digital — VAT submission management"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handleValidate}
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Validate Return
            </button>
          </div>
        }
      />

      {/* Period & Status Banner */}
      <div className="card mb-6 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Return Period</p>
              <p className="font-semibold text-gray-900">
                Q1 2025 — {formatDate(vatReturn.periodStart)} to {formatDate(vatReturn.periodEnd)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Due Date</p>
              <p className={cn('font-semibold', daysLeft <= 14 ? 'text-red-700' : daysLeft <= 30 ? 'text-amber-700' : 'text-gray-900')}>
                {formatDate(vatReturn.dueDate)}
                <span className="ml-2 text-sm font-normal">({daysLeft} days)</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
              <StatusBadge status={vatReturn.status} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">
              {daysLeft} days until deadline
            </span>
          </div>
        </div>
      </div>

      {/* VAT Boxes Grid */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          VAT Return Boxes
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <VATBoxCard
            boxNumber={1}
            label="VAT due on sales"
            value={vatReturn.boxes.box1}
            description="Sales invoices issued"
          />
          <VATBoxCard
            boxNumber={2}
            label="VAT due on acquisitions"
            value={vatReturn.boxes.box2}
            description="EU acquisitions"
          />
          <VATBoxCard
            boxNumber={3}
            label="Total VAT due"
            value={vatReturn.boxes.box3}
            isTotal
            description="Box 1 + Box 2"
          />
          <VATBoxCard
            boxNumber={4}
            label="VAT reclaimable"
            value={vatReturn.boxes.box4}
            isReclaim
            description="Purchase invoices"
          />
          <VATBoxCard
            boxNumber={5}
            label="Net VAT due to HMRC"
            value={vatReturn.boxes.box5}
            isDue
            description="Box 3 − Box 4"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <VATBoxCard
            boxNumber={6}
            label="Total value of sales"
            value={vatReturn.boxes.box6}
            description="Ex-VAT sales"
          />
          <VATBoxCard
            boxNumber={7}
            label="Total value of purchases"
            value={vatReturn.boxes.box7}
            description="Ex-VAT purchases"
          />
          <VATBoxCard
            boxNumber={8}
            label="EU sales"
            value={vatReturn.boxes.box8}
            description="Goods to EU"
          />
          <VATBoxCard
            boxNumber={9}
            label="EU purchases"
            value={vatReturn.boxes.box9}
            description="Goods from EU"
          />
        </div>
      </div>

      {/* Submission Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Validation Checks */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Pre-Submission Validation</h2>
          </div>
          <div className="card-body space-y-3">
            {validationChecks.map(check => (
              <div
                key={check.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg',
                  check.passed ? 'bg-green-50' : 'bg-red-50'
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {check.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    check.passed ? 'text-green-800' : 'text-red-800'
                  )}>
                    {check.label}
                    {check.blocking && !check.passed && (
                      <span className="ml-2 text-xs bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-normal">
                        BLOCKING
                      </span>
                    )}
                  </p>
                  <p className={cn(
                    'text-xs mt-0.5',
                    check.passed ? 'text-green-600' : 'text-red-600'
                  )}>
                    {check.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submission Actions */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Submission Summary</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Period</span>
                <span className="font-medium">Q1 2025 (Jan–Mar)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT on Sales (Box 1)</span>
                <span className="font-mono">{formatCurrency(vatReturn.boxes.box1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT Reclaimable (Box 4)</span>
                <span className="font-mono text-green-700">{formatCurrency(vatReturn.boxes.box4)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-bold">
                <span>Net VAT Due to HMRC (Box 5)</span>
                <span className="text-red-700 font-mono text-lg">{formatCurrency(vatReturn.boxes.box5)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Estimated payment date</span>
                <span>{formatDate(vatReturn.dueDate)}</span>
              </div>
            </div>

            {blockingFailed.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <strong>Cannot submit:</strong> {blockingFailed.length} blocking check{blockingFailed.length !== 1 ? 's' : ''} failed.
                  Resolve all issues before submitting to HMRC.
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleSubmit}
                disabled={!allChecksPassed || isSubmitting}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all',
                  allChecksPassed
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting to HMRC...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit to HMRC Now
                  </>
                )}
              </button>

              {!isPartner && (
                <div className="flex items-center gap-2 text-xs text-gray-500 justify-center mt-2">
                  <Lock className="w-3 h-3" />
                  Only partners can authorise MTD submissions
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
