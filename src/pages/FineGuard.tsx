import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Shield,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  Calculator,
  User,
} from 'lucide-react';

// ============================================================================
// TYPES (mirroring server/services/hmrc/types.ts)
// ============================================================================

type ModuleStatus = 'compliant' | 'warning' | 'action_required' | 'overdue' | 'not_configured';
type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

interface ModuleAlert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  errorCode?: string;
}

interface ModuleHealth {
  moduleId: 'mtd_vat' | 'corporation_tax' | 'self_assessment' | 'companies_house';
  displayName: string;
  status: ModuleStatus;
  score: number;
  nextDeadline?: { description: string; dueDate: string; daysUntilDue: number };
  lastAction?: { description: string; date: string };
  alerts: ModuleAlert[];
  lastChecked: string;
}

interface ComplianceHealthPanel {
  companyNumber: string;
  companyName: string;
  overallScore: number;
  overallStatus: ModuleStatus;
  grade: Grade;
  modules: ModuleHealth[];
  estimatedPenaltyExposure: number;
  generatedAt: string;
  nextReviewDate: string;
}

interface VarianceError {
  code: string;
  field: string;
  humanReadable: string;
  blocking: boolean;
  variance: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mtd_vat: FileText,
  corporation_tax: Calculator,
  self_assessment: User,
  companies_house: Building2,
};

const STATUS_CONFIG: Record<ModuleStatus, { color: string; bg: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  compliant: { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle, label: 'Compliant' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle, label: 'Warning' },
  action_required: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: AlertTriangle, label: 'Action Required' },
  overdue: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle, label: 'Overdue' },
  not_configured: { color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', icon: Clock, label: 'Not Configured' },
};

const GRADE_CONFIG: Record<Grade, { color: string; bg: string }> = {
  A: { color: 'text-emerald-700', bg: 'bg-emerald-100' },
  B: { color: 'text-blue-700', bg: 'bg-blue-100' },
  C: { color: 'text-amber-700', bg: 'bg-amber-100' },
  D: { color: 'text-orange-700', bg: 'bg-orange-100' },
  F: { color: 'text-red-700', bg: 'bg-red-100' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScoreGauge({ score, grade }: { score: number; grade: Grade }) {
  const gradeConf = GRADE_CONFIG[grade];
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#C9A64A"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[#1A1A1A]">{score}</span>
        <span className={`text-sm font-semibold px-2 py-0.5 rounded ${gradeConf.bg} ${gradeConf.color}`}>
          Grade {grade}
        </span>
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  if (trend === 'improving') return (
    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
      <TrendingUp className="w-3 h-3" /> Improving
    </span>
  );
  if (trend === 'declining') return (
    <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
      <TrendingDown className="w-3 h-3" /> Declining
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
      <Minus className="w-3 h-3" /> Stable
    </span>
  );
}

function AlertBadge({ severity, message, errorCode }: ModuleAlert) {
  const conf = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
  }[severity];

  return (
    <div className={`text-xs px-3 py-2 rounded border ${conf} flex items-start gap-2`}>
      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
      <span>{message}</span>
      {errorCode && (
        <span className="ml-auto font-mono shrink-0 opacity-70">[{errorCode}]</span>
      )}
    </div>
  );
}

function ModuleCard({ module, expanded, onToggle }: {
  module: ModuleHealth;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusConf = STATUS_CONFIG[module.status];
  const StatusIcon = statusConf.icon;
  const ModuleIcon = MODULE_ICONS[module.moduleId] ?? Shield;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${statusConf.bg}`}>
      <button
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/40 transition-colors"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center shrink-0">
          <ModuleIcon className="w-5 h-5 text-[#C9A64A]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#1A1A1A]">{module.displayName}</span>
            <span className={`flex items-center gap-1 text-xs font-medium ${statusConf.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConf.label}
            </span>
            {module.alerts.length > 0 && (
              <span className="text-xs bg-white/70 text-gray-600 px-1.5 py-0.5 rounded-full">
                {module.alerts.length} alert{module.alerts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {module.nextDeadline && (
            <p className="text-xs text-gray-600 mt-0.5 truncate">
              Next: {module.nextDeadline.description} — {module.nextDeadline.daysUntilDue}d
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-lg font-bold text-[#1A1A1A]">{module.score}</div>
            <div className="text-xs text-gray-500">score</div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/40 pt-3">
          {module.nextDeadline && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Next Deadline</p>
                <p className="font-medium text-[#1A1A1A]">{module.nextDeadline.description}</p>
                <p className="text-xs text-gray-600">{module.nextDeadline.dueDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Days Until Due</p>
                <p className={`font-bold text-lg ${module.nextDeadline.daysUntilDue < 0 ? 'text-red-600' : module.nextDeadline.daysUntilDue <= 14 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {module.nextDeadline.daysUntilDue < 0
                    ? `${Math.abs(module.nextDeadline.daysUntilDue)}d overdue`
                    : `${module.nextDeadline.daysUntilDue} days`}
                </p>
              </div>
            </div>
          )}
          {module.lastAction && (
            <p className="text-xs text-gray-500">
              Last: {module.lastAction.description} on {module.lastAction.date}
            </p>
          )}
          {module.alerts.length > 0 && (
            <div className="space-y-2">
              {module.alerts.map((alert, i) => (
                <AlertBadge key={i} {...alert} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ZERO-VARIANCE DEMO PANEL
// ============================================================================

function ZeroVariancePanel() {
  const [periodKey, setPeriodKey] = useState('24AA');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    message: string;
    errors?: VarianceError[];
    summary?: { totalChecks: number; passedChecks: number; failedChecks: number };
    checkedAt?: string;
  } | null>(null);

  const handleCheck = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      // Build a draft HMRC return for the selected period
      // Period 24AA is balanced; 24AB has intentional gap (will fail)
      const drafts: Record<string, object> = {
        '24AA': {
          periodKey: '24AA',
          vatDueSales: 460000,          // £4,600.00 in pence — matches internal records
          vatDueAcquisitions: 0,
          totalVatDue: 460000,
          vatReclaimedCurrPeriod: 90000, // £900.00
          netVatDue: 370000,
          totalValueSalesExVAT: 2500000,
          totalValuePurchasesExVAT: 450000,
          totalValueGoodsSuppliedExVAT: 200000,
          totalAcquisitionsExVAT: 0,
          finalised: false,
        },
        '24AB': {
          periodKey: '24AB',
          vatDueSales: 490000,          // £4,900.00 — includes missing TXN-011 (gap scenario)
          vatDueAcquisitions: 0,
          totalVatDue: 490000,
          vatReclaimedCurrPeriod: 50000,
          netVatDue: 440000,
          totalValueSalesExVAT: 2450000,
          totalValuePurchasesExVAT: 250000,
          totalValueGoodsSuppliedExVAT: 0,
          totalAcquisitionsExVAT: 0,
          finalised: false,
        },
      };

      const res = await fetch('/api/hmrc/vat/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drafts[periodKey] ?? drafts['24AA']),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ passed: false, message: 'Network error. Is the API server running?' });
    } finally {
      setLoading(false);
    }
  }, [periodKey]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#C9A64A]/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[#C9A64A]" />
        </div>
        <div>
          <h3 className="font-bold text-[#1A1A1A]">Zero-Variance Engine</h3>
          <p className="text-xs text-gray-500">Compare internal records vs HMRC draft return</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={periodKey}
          onChange={e => setPeriodKey(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A64A]/30"
        >
          <option value="24AA">24AA — Q1 2024 (Balanced — will PASS)</option>
          <option value="24AB">24AB — Q2 2024 (Missing TXN — will FAIL ERR_V_002)</option>
        </select>
        <Button
          onClick={handleCheck}
          disabled={loading}
          className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-4 text-sm"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Run Check'}
        </Button>
      </div>

      {result && (
        <div className={`rounded-xl border p-4 ${result.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.passed
              ? <CheckCircle className="w-4 h-4 text-emerald-600" />
              : <XCircle className="w-4 h-4 text-red-600" />}
            <span className={`font-semibold text-sm ${result.passed ? 'text-emerald-700' : 'text-red-700'}`}>
              {result.message}
            </span>
          </div>
          {result.summary && (
            <div className="flex gap-4 text-xs text-gray-600 mb-3">
              <span>Checks: {result.summary.totalChecks}</span>
              <span className="text-emerald-600">Passed: {result.summary.passedChecks}</span>
              <span className="text-red-600">Failed: {result.summary.failedChecks}</span>
            </div>
          )}
          {result.errors && result.errors.length > 0 && (
            <div className="space-y-2">
              {result.errors.map((err, i) => (
                <div key={i} className={`text-xs rounded-lg border px-3 py-2 ${err.blocking ? 'bg-red-100 border-red-300 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                  <div className="flex items-center gap-2 font-mono font-bold mb-1">
                    <span>[{err.code}]</span>
                    {err.blocking && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">BLOCKING</span>}
                    <span className="ml-auto font-normal">Variance: {err.variance}</span>
                  </div>
                  <p className="font-sans leading-snug">{err.humanReadable}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CT LONG-PERIOD SPLITTER PANEL
// ============================================================================

function CTSplitterPanel() {
  const [periodRef, setPeriodRef] = useState('CT-18M');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    requiresSplit: boolean;
    splitReason?: string;
    returns: Array<{
      returnReference: string;
      periodStart: string;
      periodEnd: string;
      periodLengthDays: number;
      taxableProfitFormatted: string;
      taxDueFormatted: string;
      ctRatePercent: string;
      filingDeadline: string;
      paymentDeadline: string;
      splitIndex?: number;
    }>;
  } | null>(null);

  const handleSplit = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/hmrc/ct/split-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodRef }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [periodRef]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#C9A64A]/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-[#C9A64A]" />
        </div>
        <div>
          <h3 className="font-bold text-[#1A1A1A]">CT Long-Period Splitter</h3>
          <p className="text-xs text-gray-500">Auto-splits accounting periods &gt;12 months into two CT600s</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={periodRef}
          onChange={e => setPeriodRef(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A64A]/30"
        >
          <option value="CT-12M">CT-12M — Standard 12-month period (no split)</option>
          <option value="CT-18M">CT-18M — 18-month period (requires split)</option>
          <option value="CT-14M">CT-14M — 14-month period (requires split)</option>
        </select>
        <Button
          onClick={handleSplit}
          disabled={loading}
          className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-4 text-sm"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Analyse'}
        </Button>
      </div>

      {result && (
        <div className="space-y-3">
          {result.requiresSplit && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-3 h-3" />
                Long Period Detected — Split Required [ERR_CT_001]
              </div>
              <p>{result.splitReason}</p>
            </div>
          )}
          <div className={`grid gap-3 ${result.returns.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {result.returns.map((r, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-gray-500">{r.returnReference}</span>
                  {r.splitIndex && (
                    <span className="text-xs bg-[#C9A64A] text-white px-2 py-0.5 rounded-full">
                      Period {r.splitIndex}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Period</p>
                    <p className="font-medium text-[#1A1A1A]">{r.periodStart} → {r.periodEnd}</p>
                    <p className="text-xs text-gray-500">{r.periodLengthDays} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Taxable Profit</p>
                    <p className="font-bold text-[#1A1A1A]">{r.taxableProfitFormatted}</p>
                    <p className="text-xs text-gray-500">CT @ {r.ctRatePercent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tax Due</p>
                    <p className="font-bold text-red-600">{r.taxDueFormatted}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Filing Deadline</p>
                    <p className="font-medium text-[#1A1A1A]">{r.filingDeadline}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HEALTH PANEL WIDGET
// ============================================================================

function HealthPanelWidget({ companyNumber }: { companyNumber: string }) {
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<ComplianceHealthPanel | null>(null);
  const [score, setScore] = useState<{ score: number; grade: Grade; trend: string; breakdown: Record<string, number> } | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [panelRes, scoreRes] = await Promise.all([
        fetch(`/api/hmrc/compliance/health?companyNumber=${encodeURIComponent(companyNumber)}`),
        fetch(`/api/hmrc/compliance/score?companyNumber=${encodeURIComponent(companyNumber)}`),
      ]);
      const panelData = await panelRes.json();
      const scoreData = await scoreRes.json();
      if (panelData.ok) setPanel(panelData.panel);
      if (scoreData.ok) setScore(scoreData);
    } catch {
      // Network error — gracefully handled
    } finally {
      setLoading(false);
    }
  }, [companyNumber]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[#1A1A1A]">Compliance Health Panel</h3>
          <p className="text-xs text-gray-500">All four FineGuard modules in one view</p>
        </div>
        <Button
          onClick={fetchAll}
          disabled={loading}
          variant="outline"
          className="border-[#C9A64A] text-[#C9A64A] hover:bg-[#C9A64A]/5 text-sm"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {panel ? 'Refresh' : 'Load Panel'}
        </Button>
      </div>

      {loading && !panel && (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Fetching compliance data…
        </div>
      )}

      {panel && score && (
        <>
          {/* Overview Row */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <ScoreGauge score={panel.overallScore} grade={panel.grade} />
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="text-lg font-bold text-[#1A1A1A]">{panel.companyName}</h4>
                  <p className="text-sm text-gray-500">{panel.companyNumber}</p>
                  <TrendBadge trend={score.trend as 'improving' | 'stable' | 'declining'} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  {(['timeliness', 'accuracy', 'completeness', 'risk'] as const).map(key => (
                    <div key={key} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 capitalize">{key}</p>
                      <p className="text-xl font-bold text-[#1A1A1A]">{score.breakdown[key]}</p>
                      <p className="text-xs text-gray-400">×{
                        key === 'timeliness' ? '0.35' :
                        key === 'accuracy' ? '0.40' :
                        key === 'completeness' ? '0.15' : '0.10¹'
                      }</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">¹ Risk is an inverse component: (100 − risk) × 0.10</p>
                {panel.estimatedPenaltyExposure > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
                    Estimated penalty exposure: <strong>£{(panel.estimatedPenaltyExposure / 100).toFixed(2)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Module Cards */}
          <div className="space-y-3">
            {panel.modules.map(module => (
              <ModuleCard
                key={module.moduleId}
                module={module}
                expanded={expandedModule === module.moduleId}
                onToggle={() => setExpandedModule(expandedModule === module.moduleId ? null : module.moduleId)}
              />
            ))}
          </div>

          <p className="text-xs text-gray-400 text-right">
            Generated {new Date(panel.generatedAt).toLocaleString('en-GB')} · Next review: {panel.nextReviewDate}
          </p>
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function FineGuard() {
  const [, setLocation] = useLocation();
  const [companyNumber, setCompanyNumber] = useState('12345678');
  const [activeTab, setActiveTab] = useState<'health' | 'vat' | 'ct'>('health');

  const tabs = [
    { id: 'health', label: 'Health Panel' },
    { id: 'vat', label: 'Zero-Variance Engine' },
    { id: 'ct', label: 'CT Splitter' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Hero */}
      <div className="bg-[#1A1A1A] text-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#C9A64A] flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">FineGuard</h1>
              <p className="text-[#C9A64A] font-medium">Compliance Autopilot for UK SMEs</p>
            </div>
          </div>
          <p className="text-gray-300 max-w-2xl mb-4">
            HMRC MTD VAT · Corporation Tax · Self-Assessment · Companies House — all monitored in real time.
            FineGuard's Zero-Variance Engine blocks erroneous returns before they reach HMRC.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {['Zero-Variance Engine', 'Idempotent Submissions', 'CT Long-Period Splitter', 'Weighted Compliance Score'].map(f => (
              <span key={f} className="bg-white/10 px-3 py-1 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Company Number Input */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
          <Building2 className="w-5 h-5 text-[#C9A64A] shrink-0" />
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Company Number</label>
            <input
              value={companyNumber}
              onChange={e => setCompanyNumber(e.target.value)}
              className="w-full text-sm font-mono border-none outline-none text-[#1A1A1A] bg-transparent"
              placeholder="e.g. 12345678"
            />
          </div>
          <span className="text-xs text-gray-400">Use 12345678 or 87654321 for demo data</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#C9A64A] text-white'
                  : 'text-gray-600 hover:text-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'health' && <HealthPanelWidget companyNumber={companyNumber} />}
        {activeTab === 'vat' && <ZeroVariancePanel />}
        {activeTab === 'ct' && <CTSplitterPanel />}

        {/* CTA */}
        <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Ready for Full Compliance Cover?</h3>
          <p className="text-gray-300 mb-6">
            Get your full compliance bundle including HMRC authorisation, MTD enrolment, and dedicated compliance manager.
          </p>
          <Button
            onClick={() => setLocation('/compliance-bundle')}
            className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-8 py-3 text-base"
          >
            Get Compliance Bundle
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
