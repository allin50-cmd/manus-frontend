import { useState, useMemo } from 'react';
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, Calculator, Eye, RefreshCw, Lock
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { mockLedgerEntries, mockVATReturn } from '@/lib/mockData';
import {
  validateVATBoxes, summariseTransactions, getAuditRiskConfig,
} from '@/lib/vatValidator';
import { formatCurrency, cn } from '@/lib/utils';

// Simulate a 1p variance scenario for demo purposes
const DEMO_VARIANCE_BOXES = {
  ...mockVATReturn.boxes,
  box1: mockVATReturn.boxes.box1 + 0.01, // Inject a 1p variance
};

export default function AuditProtection() {
  const [showVariance, setShowVariance] = useState(false);
  const [resolved, setResolved] = useState(false);

  const txSummary = useMemo(() => summariseTransactions(mockLedgerEntries), []);

  const currentBoxes = showVariance && !resolved ? DEMO_VARIANCE_BOXES : mockVATReturn.boxes;
  const validation = useMemo(
    () => validateVATBoxes(currentBoxes, txSummary, '25A1'),
    [currentBoxes, txSummary]
  );

  const riskConfig = getAuditRiskConfig(validation.auditRisk);

  const ledgerSalesTxns = mockLedgerEntries.filter(e => e.type === 'sales');
  const ledgerPurchaseTxns = mockLedgerEntries.filter(e => e.type === 'purchase');

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Audit Protection System"
        description="1p-precision variance detection — the FineGuard compliance firewall"
      />

      {/* Explainer Banner */}
      <div className="card mb-6 p-4 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white mb-1">How the 1p Audit Trigger Works</h2>
            <p className="text-blue-100 text-sm">
              HMRC's systems cross-reference your submitted VAT box totals against the
              underlying transaction data. A variance of just <strong>£0.01</strong> between
              declared VAT (Box 1) and transaction-level VAT can flag your return for investigation.
              FineGuard prevents this by enforcing zero-tolerance reconciliation before every submission.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="card mb-6 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Interactive Demo</p>
          <p className="text-xs text-gray-400">Toggle a 1p variance to see the protection system activate</p>
        </div>
        <div className="flex items-center gap-3">
          {resolved && (
            <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">Variance resolved</span>
          )}
          <button
            onClick={() => { setShowVariance(p => !p); setResolved(false); }}
            className={cn(
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
              showVariance && !resolved ? 'bg-red-500' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition',
                showVariance && !resolved ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
          <span className={cn(
            'text-xs font-medium',
            showVariance && !resolved ? 'text-red-700' : 'text-gray-500'
          )}>
            {showVariance && !resolved ? '⚠ 1p variance injected' : 'All clear'}
          </span>
        </div>
      </div>

      {/* Risk Level */}
      <div className={cn(
        'card mb-6 p-5 border-2 transition-all',
        riskConfig.borderColor, riskConfig.bgColor
      )}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', riskConfig.bgColor)}>
              {validation.auditRisk === 'none' ? (
                <CheckCircle className={cn('w-7 h-7', riskConfig.color)} />
              ) : (
                <AlertTriangle className={cn('w-7 h-7', riskConfig.color)} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className={cn('text-2xl font-bold', riskConfig.color)}>{riskConfig.label}</span>
                {validation.auditRisk !== 'none' && (
                  <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-bold uppercase">
                    Submission Blocked
                  </span>
                )}
              </div>
              <p className={cn('text-sm', riskConfig.color)}>{riskConfig.description}</p>
            </div>
          </div>

          {showVariance && !resolved && (
            <button
              onClick={() => setResolved(true)}
              className="btn-success text-sm flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Resolve Variance
            </button>
          )}
        </div>
      </div>

      {/* Validation results */}
      {validation.errors.length > 0 && (
        <div className="card mb-6 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            Blocking Errors ({validation.errors.filter(e => e.isBlocking).length})
          </h3>
          {validation.errors.map((err, i) => (
            <div key={i} className="flex items-start justify-between p-3 bg-red-50 border border-red-200 rounded-lg mb-2">
              <div>
                <p className="text-sm font-semibold text-red-800">{err.code}</p>
                <p className="text-sm text-red-700">{err.message}</p>
                <p className="text-xs text-red-500 mt-1 font-mono">
                  Expected: {formatCurrency(err.expected)} | Actual: {formatCurrency(err.actual)}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-xs text-red-600 font-bold uppercase">Variance</p>
                <p className="text-lg font-mono font-bold text-red-700">
                  {formatCurrency(err.variance)}
                </p>
                {err.isBlocking && (
                  <span className="text-xs bg-red-200 text-red-800 px-1.5 py-0.5 rounded">BLOCKING</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction-level reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales reconciliation */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" /> Sales VAT Reconciliation
          </h3>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {ledgerSalesTxns.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-medium text-gray-800 truncate max-w-[180px]">{tx.supplier}</p>
                  <p className="text-xs text-gray-400">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-medium text-green-700">{formatCurrency(tx.vat)}</p>
                  <p className="text-xs text-gray-400">{tx.vatRate}% VAT</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between py-2 border-t-2 border-gray-200 bg-gray-50 rounded-b-lg px-3 -mx-3 -mb-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Ledger Total</span>
            <span className="text-base font-bold font-mono text-green-700">{formatCurrency(txSummary.salesVAT)}</span>
          </div>
          <div className={cn(
            'flex items-center justify-between py-2 px-3 -mx-3 rounded-b-lg',
            Math.abs(currentBoxes.box1 - txSummary.salesVAT) < 0.01 ? 'bg-green-50' : 'bg-red-50'
          )}>
            <span className="text-xs font-bold text-gray-600">VAT Box 1 Declared</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono text-gray-900">{formatCurrency(currentBoxes.box1)}</span>
              {Math.abs(currentBoxes.box1 - txSummary.salesVAT) < 0.01 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Purchase reconciliation */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" /> Purchase VAT Reconciliation
          </h3>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {ledgerPurchaseTxns.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-medium text-gray-800 truncate max-w-[180px]">{tx.supplier}</p>
                  <p className="text-xs text-gray-400">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-medium text-blue-700">{formatCurrency(tx.vat)}</p>
                  <p className="text-xs text-gray-400">{tx.vatRate}% VAT</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between py-2 border-t-2 border-gray-200 bg-gray-50 rounded-b-lg px-3 -mx-3 -mb-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Ledger Total</span>
            <span className="text-base font-bold font-mono text-blue-700">{formatCurrency(txSummary.purchaseVAT)}</span>
          </div>
          <div className={cn(
            'flex items-center justify-between py-2 px-3 -mx-3 rounded-b-lg',
            Math.abs(currentBoxes.box4 - txSummary.purchaseVAT) < 0.01 ? 'bg-green-50' : 'bg-red-50'
          )}>
            <span className="text-xs font-bold text-gray-600">VAT Box 4 Declared</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono text-gray-900">{formatCurrency(currentBoxes.box4)}</span>
              {Math.abs(currentBoxes.box4 - txSummary.purchaseVAT) < 0.01 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Protection Summary */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Protection Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Arithmetic Checks',
              items: ['Box 3 = Box 1 + Box 2', 'Box 5 = Box 3 − Box 4'],
              passed: true,
              icon: Calculator,
            },
            {
              title: 'Ledger Reconciliation',
              items: ['Box 1 vs transaction sales VAT', 'Box 4 vs transaction purchase VAT'],
              passed: validation.auditRisk === 'none',
              icon: Eye,
            },
            {
              title: 'Pre-Submission Gate',
              items: ['No staged records pending', 'All ledger entries locked', 'Partner authorisation required'],
              passed: validation.auditRisk === 'none',
              icon: Lock,
            },
          ].map(section => (
            <div key={section.title} className={cn(
              'rounded-lg p-4 border',
              section.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <div className="flex items-center gap-2 mb-3">
                {section.passed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <h4 className={cn('text-sm font-semibold', section.passed ? 'text-green-800' : 'text-red-800')}>
                  {section.title}
                </h4>
              </div>
              <ul className="space-y-1">
                {section.items.map(item => (
                  <li key={item} className={cn('text-xs flex items-center gap-1.5', section.passed ? 'text-green-700' : 'text-red-600')}>
                    <span>{section.passed ? '✓' : '✗'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
