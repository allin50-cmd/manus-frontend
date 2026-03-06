import { useState, useMemo } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, Shield, Send,
  FileText, Calculator, Link, Server, ChevronRight,
  Lock, Eye, Copy, Download, RefreshCw
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import VATBoxCard from '@/components/ui/VATBoxCard';
import { mockVATReturn, mockLedgerEntries } from '@/lib/mockData';
import {
  validateVATBoxes, summariseTransactions, getAuditRiskConfig,
  type VATValidationResult, type HMRCVATPayload
} from '@/lib/vatValidator';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type WizardStep = 'boxes' | 'validate' | 'payload' | 'submit' | 'receipt';

const WIZARD_STEPS: { id: WizardStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'boxes', label: 'Review Boxes', icon: Calculator },
  { id: 'validate', label: 'Validate', icon: Shield },
  { id: 'payload', label: 'HMRC Payload', icon: FileText },
  { id: 'submit', label: 'Submit', icon: Send },
  { id: 'receipt', label: 'Receipt', icon: CheckCircle },
];

export default function MTDSubmissionPipeline() {
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>('boxes');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayload, setShowPayload] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<{ id: string; timestamp: string } | null>(null);

  const vatReturn = mockVATReturn;
  const stepIdx = WIZARD_STEPS.findIndex(s => s.id === step);
  const isPartner = user?.role === 'partner';

  // Run validation engine
  const txSummary = useMemo(() => summariseTransactions(mockLedgerEntries), []);
  const validation: VATValidationResult = useMemo(
    () => validateVATBoxes(vatReturn.boxes, txSummary, '25A1'),
    [txSummary]
  );

  const riskConfig = getAuditRiskConfig(validation.auditRisk);

  const handleValidate = () => setStep('validate');
  const handleBuildPayload = () => setStep('payload');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 2500));
    setIsSubmitting(false);
    setSubmissionReceipt({
      id: `MTD-2025-${Math.floor(Math.random() * 90000) + 10000}`,
      timestamp: new Date().toISOString(),
    });
    setStep('receipt');
  };

  const payload = validation.hmrcPayload;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="MTD Submission Pipeline"
        description="Fraud-proof HMRC Making Tax Digital submission workflow"
      />

      {/* Wizard Steps */}
      <div className="card mb-6 p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {WIZARD_STEPS.map((s, idx) => {
            const isDone = idx < stepIdx;
            const isCurrent = s.id === step;
            return (
              <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                  isDone ? 'bg-green-100 text-green-700' :
                  isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                )}>
                  {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                  {s.label}
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Review VAT Boxes */}
      {step === 'boxes' && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">VAT Return Boxes</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Q1 2025 — {formatDate(vatReturn.periodStart)} to {formatDate(vatReturn.periodEnd)} · Due {formatDate(vatReturn.dueDate)}
                </p>
              </div>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                Period Key: 25A1
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              <VATBoxCard boxNumber={1} label="VAT on Sales" value={vatReturn.boxes.box1} />
              <VATBoxCard boxNumber={2} label="VAT on Acquisitions" value={vatReturn.boxes.box2} />
              <VATBoxCard boxNumber={3} label="Total VAT Due" value={vatReturn.boxes.box3} isTotal />
              <VATBoxCard boxNumber={4} label="VAT Reclaimable" value={vatReturn.boxes.box4} isReclaim />
              <VATBoxCard boxNumber={5} label="Net VAT Due" value={vatReturn.boxes.box5} isDue />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <VATBoxCard boxNumber={6} label="Total Sales" value={vatReturn.boxes.box6} />
              <VATBoxCard boxNumber={7} label="Total Purchases" value={vatReturn.boxes.box7} />
              <VATBoxCard boxNumber={8} label="EU Sales" value={vatReturn.boxes.box8} />
              <VATBoxCard boxNumber={9} label="EU Purchases" value={vatReturn.boxes.box9} />
            </div>
          </div>

          {/* Ledger summary */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Transaction-Level Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Sales VAT (ledger)', value: txSummary.salesVAT, note: 'Should match Box 1' },
                { label: 'Purchase VAT (ledger)', value: txSummary.purchaseVAT, note: 'Should match Box 4' },
                { label: 'Net Sales (ledger)', value: txSummary.netSales, note: 'Should match Box 6' },
                { label: 'Net Purchases (ledger)', value: txSummary.netPurchases, note: 'Should match Box 7' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-lg font-bold font-mono text-gray-900 mt-0.5">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleValidate} className="btn-primary flex items-center gap-2 px-6">
              Run Validation <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Validation */}
      {step === 'validate' && (
        <div className="space-y-6">
          {/* Audit Risk Badge */}
          <div className={cn(
            'card p-5 border-2',
            riskConfig.borderColor, riskConfig.bgColor
          )}>
            <div className="flex items-center gap-4">
              <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', riskConfig.bgColor)}>
                {validation.auditRisk === 'none' ? (
                  <CheckCircle className={cn('w-8 h-8', riskConfig.color)} />
                ) : validation.auditRisk === 'critical' ? (
                  <XCircle className={cn('w-8 h-8', riskConfig.color)} />
                ) : (
                  <AlertTriangle className={cn('w-8 h-8', riskConfig.color)} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className={cn('text-xl font-bold', riskConfig.color)}>{riskConfig.label}</h2>
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide', riskConfig.color, riskConfig.bgColor)}>
                    Audit Risk
                  </span>
                </div>
                <p className={cn('text-sm mt-1', riskConfig.color)}>{riskConfig.description}</p>
              </div>
            </div>
          </div>

          {/* Validation Checks */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Arithmetic Integrity Checks</h3>

            {/* Box arithmetic checks */}
            <div className="space-y-3 mb-4">
              {[
                {
                  label: 'Box 3 = Box 1 + Box 2',
                  passed: Math.abs(vatReturn.boxes.box3 - (vatReturn.boxes.box1 + vatReturn.boxes.box2)) < 0.01,
                  expected: formatCurrency(vatReturn.boxes.box1 + vatReturn.boxes.box2),
                  actual: formatCurrency(vatReturn.boxes.box3),
                },
                {
                  label: 'Box 5 = Box 3 − Box 4',
                  passed: Math.abs(vatReturn.boxes.box5 - (vatReturn.boxes.box3 - vatReturn.boxes.box4)) < 0.01,
                  expected: formatCurrency(vatReturn.boxes.box3 - vatReturn.boxes.box4),
                  actual: formatCurrency(vatReturn.boxes.box5),
                },
                {
                  label: 'Box 1 matches ledger sales VAT',
                  passed: Math.abs(vatReturn.boxes.box1 - txSummary.salesVAT) < 0.01,
                  expected: formatCurrency(txSummary.salesVAT),
                  actual: formatCurrency(vatReturn.boxes.box1),
                },
                {
                  label: 'Box 4 matches ledger purchase VAT',
                  passed: Math.abs(vatReturn.boxes.box4 - txSummary.purchaseVAT) < 0.01,
                  expected: formatCurrency(txSummary.purchaseVAT),
                  actual: formatCurrency(vatReturn.boxes.box4),
                },
              ].map((check, i) => (
                <div key={i} className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  check.passed ? 'bg-green-50' : 'bg-red-50'
                )}>
                  <div className="flex items-center gap-3">
                    {check.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <span className={cn('text-sm font-medium', check.passed ? 'text-green-800' : 'text-red-800')}>
                      {check.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={cn('text-sm font-mono font-bold', check.passed ? 'text-green-700' : 'text-red-700')}>
                      {check.actual}
                    </span>
                    {!check.passed && (
                      <p className="text-xs text-red-500">Expected: {check.expected}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 1p Protection Check */}
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">1p Audit Trigger Protection</span>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                HMRC cross-checks VAT box totals against individual transaction records.
                A variance of even 1 penny can trigger a compliance investigation.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500">Box 1 Variance</p>
                  <p className={cn(
                    'text-lg font-mono font-bold mt-0.5',
                    Math.abs(vatReturn.boxes.box1 - txSummary.salesVAT) < 0.01 ? 'text-green-700' : 'text-red-700'
                  )}>
                    {formatCurrency(Math.abs(vatReturn.boxes.box1 - txSummary.salesVAT))}
                  </p>
                  <p className={cn('text-xs mt-0.5', Math.abs(vatReturn.boxes.box1 - txSummary.salesVAT) < 0.01 ? 'text-green-600' : 'text-red-600')}>
                    {Math.abs(vatReturn.boxes.box1 - txSummary.salesVAT) < 0.01 ? '✓ No variance' : '⚠ Variance detected'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500">Box 4 Variance</p>
                  <p className={cn(
                    'text-lg font-mono font-bold mt-0.5',
                    Math.abs(vatReturn.boxes.box4 - txSummary.purchaseVAT) < 0.01 ? 'text-green-700' : 'text-red-700'
                  )}>
                    {formatCurrency(Math.abs(vatReturn.boxes.box4 - txSummary.purchaseVAT))}
                  </p>
                  <p className={cn('text-xs mt-0.5', Math.abs(vatReturn.boxes.box4 - txSummary.purchaseVAT) < 0.01 ? 'text-green-600' : 'text-red-600')}>
                    {Math.abs(vatReturn.boxes.box4 - txSummary.purchaseVAT) < 0.01 ? '✓ No variance' : '⚠ Variance detected'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Advisory Warnings</h3>
              {validation.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">{w.message}</p>
                    <p className="text-xs text-amber-600 mt-0.5">{w.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-between">
            <button onClick={() => setStep('boxes')} className="btn-secondary">← Back</button>
            <button
              onClick={handleBuildPayload}
              disabled={!validation.isValid}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all',
                validation.isValid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              Build HMRC Payload <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: HMRC Payload */}
      {step === 'payload' && payload && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900">HMRC API Payload</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                  Validated
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPayload(p => !p)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> {showPayload ? 'Hide' : 'Show'} Raw
                </button>
                <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            </div>

            {/* Human-readable summary */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'vatDueSales (Box 1)', value: payload.vatDueSales, field: 'box1' },
                { label: 'vatDueAcquisitions (Box 2)', value: payload.vatDueAcquisitions, field: 'box2' },
                { label: 'totalVatDue (Box 3)', value: payload.totalVatDue, field: 'box3', highlight: 'blue' },
                { label: 'vatReclaimedCurrPeriod (Box 4)', value: payload.vatReclaimedCurrPeriod, field: 'box4', highlight: 'green' },
                { label: 'netVatDue (Box 5)', value: payload.netVatDue, field: 'box5', highlight: 'red' },
                { label: 'totalValueSalesExVAT (Box 6)', value: payload.totalValueSalesExVAT, field: 'box6' },
                { label: 'totalValuePurchasesExVAT (Box 7)', value: payload.totalValuePurchasesExVAT, field: 'box7' },
                { label: 'totalValueGoodsSuppliedExVAT (Box 8)', value: payload.totalValueGoodsSuppliedExVAT, field: 'box8' },
                { label: 'totalAcquisitionsExVAT (Box 9)', value: payload.totalAcquisitionsExVAT, field: 'box9' },
              ].map(item => (
                <div key={item.field} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-mono text-gray-500">{item.label}</span>
                  <span className={cn(
                    'text-sm font-mono font-bold',
                    item.highlight === 'red' ? 'text-red-700' :
                    item.highlight === 'green' ? 'text-green-700' :
                    item.highlight === 'blue' ? 'text-blue-700' : 'text-gray-900'
                  )}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between py-2 border-t border-gray-200">
              <span className="text-xs font-mono text-gray-500">finalised</span>
              <span className="text-sm font-mono font-bold text-green-700">true</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-mono text-gray-500">periodKey</span>
              <span className="text-sm font-mono font-bold text-gray-900">{payload.periodKey}</span>
            </div>

            {/* Raw JSON */}
            {showPayload && (
              <div className="mt-4">
                <pre className="text-xs font-mono bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Digital Link statement */}
          <div className="card p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Link className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">Digital Link Verified</p>
                <p className="text-xs text-blue-700">
                  All box values are directly traceable to individual ledger entries.
                  No manual transcription has occurred between source data and this payload.
                  This satisfies HMRC's digital link requirement under MTD legislation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-between">
            <button onClick={() => setStep('validate')} className="btn-secondary">← Back</button>
            <button
              onClick={() => setStep('submit')}
              className="btn-primary flex items-center gap-2 px-6"
            >
              Proceed to Submit <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Submit */}
      {step === 'submit' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">All checks passed — ready to submit</h2>
                <p className="text-xs text-gray-400">HMRC endpoint: POST /organisations/vat/{'{vrn}'}/returns</p>
              </div>
            </div>

            {/* Final summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Company</span>
                <span className="font-medium">Apex Digital Solutions Ltd</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VRN</span>
                <span className="font-mono">GB123456789</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Period</span>
                <span className="font-medium">Q1 2025 (25A1) — {formatDate(vatReturn.periodStart)} to {formatDate(vatReturn.periodEnd)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                <span>Net VAT Due to HMRC</span>
                <span className="text-red-700 font-mono text-lg">{formatCurrency(vatReturn.boxes.box5)}</span>
              </div>
            </div>

            {!isPartner && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-700">
                <Lock className="w-4 h-4 flex-shrink-0" />
                Only partners can authorise MTD submissions. Your role: <strong>{user?.role}</strong>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isPartner || isSubmitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all',
                isPartner ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                  Submit to HMRC API
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Receipt */}
      {step === 'receipt' && submissionReceipt && (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submitted to HMRC</h2>
          <p className="text-gray-500 mb-6">Your VAT return has been accepted. Keep this receipt for your records.</p>

          <div className="max-w-sm mx-auto bg-green-50 border border-green-200 rounded-xl p-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Submission ID</span>
              <span className="font-mono font-bold text-gray-900">{submissionReceipt.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Submitted at</span>
              <span className="text-gray-900">{new Date(submissionReceipt.timestamp).toLocaleString('en-GB')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Period</span>
              <span className="text-gray-900">Q1 2025 (25A1)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">VAT Due</span>
              <span className="font-bold text-red-700">{formatCurrency(vatReturn.boxes.box5)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Authorised by</span>
              <span className="text-gray-900">{user?.name}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-green-200 pt-3">
              <span className="text-gray-500">HMRC Status</span>
              <span className="text-green-700 font-medium">✓ Accepted</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center mt-8">
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Receipt
            </button>
            <button onClick={() => setStep('boxes')} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> New Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
