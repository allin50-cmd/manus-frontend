import { useLocation } from 'wouter';
import {
  Rocket, History, CheckCircle, AlertCircle, Clock, ArrowRight,
  Receipt, Building2, UserCheck, Shield, CircleDollarSign,
  TriangleAlert,
} from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { CardGrid } from '@/components/fineguard/CardGrid';
import { StatusPill } from '@/components/fineguard/StatusPill';
import { Button } from '@/components/ui/button';

const STATS = [
  { label: 'Total Deployments', value: '12', icon: <History className="h-5 w-5" />, delta: '+2 this month' },
  { label: 'Successful',        value: '10', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
  { label: 'Failed',            value: '1',  icon: <AlertCircle className="h-5 w-5 text-red-500" /> },
  { label: 'In Progress',       value: '1',  icon: <Clock className="h-5 w-5 text-blue-500" /> },
];

const RECENT = [
  { id: 'run-001', tenant: 'Smithson & Co Accountants', status: 'Success' as const, ts: '2025-01-14 09:42' },
  { id: 'run-002', tenant: 'Patel Advisory Services',   status: 'Running' as const, ts: '2025-01-14 11:05' },
  { id: 'run-003', tenant: 'Northern Tax Partners',     status: 'Failed'  as const, ts: '2025-01-13 15:30' },
];

// ── Compliance Health Panel ─────────────────────────────────────────────────

const COMPLIANCE_AUTHORITIES = [
  { id: 'ch',  label: 'Companies House',  icon: <Shield className="h-4 w-4" />,   score: 92, status: 'green' as const, detail: 'All filings current',  href: '/app/companies-house'  },
  { id: 'vat', label: 'MTD VAT',          icon: <Receipt className="h-4 w-4" />,  score: 88, status: 'amber' as const, detail: '1 return open',        href: '/app/vat'              },
  { id: 'ct',  label: 'Corporation Tax',  icon: <Building2 className="h-4 w-4" />,score: 71, status: 'red'   as const, detail: '1 overdue CT600',       href: '/app/corporation-tax'  },
  { id: 'sa',  label: 'Self Assessment',  icon: <UserCheck className="h-4 w-4" />,score: 75, status: 'red'   as const, detail: '1 overdue return',      href: '/app/self-assessment'  },
];

const STATUS_BAR: Record<'green' | 'amber' | 'red', string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red:   'bg-red-500',
};

function ComplianceHealthPanel({ onNavigate }: { onNavigate: (href: string) => void }) {
  const overallScore = Math.round(
    COMPLIANCE_AUTHORITIES.reduce((sum, a) => sum + a.score, 0) / COMPLIANCE_AUTHORITIES.length,
  );
  const scoreColour = overallScore >= 90 ? 'text-green-500' : overallScore >= 75 ? 'text-amber-500' : 'text-red-500';
  const ringColour  = overallScore >= 90 ? '#16a34a' : overallScore >= 75 ? '#d97706' : '#dc2626';

  return (
    <Card
      title="Compliance Health"
      description="Unified score across all regulatory authorities"
      icon={<Shield className="h-4 w-4 text-brand-gold" />}
    >
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Overall score</p>
            <p className={`text-4xl font-bold ${scoreColour}`}>
              {overallScore}<span className="text-lg font-medium text-gray-400">/100</span>
            </p>
          </div>
          <div
            className="h-14 w-14 rounded-full border-4 flex items-center justify-center shrink-0"
            style={{ borderColor: ringColour }}
          >
            <span className={`text-lg font-bold ${scoreColour}`}>
              {overallScore >= 90 ? '✓' : overallScore >= 75 ? '!' : '✕'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {COMPLIANCE_AUTHORITIES.map((auth) => (
            <button
              key={auth.id}
              onClick={() => onNavigate(auth.href)}
              className="w-full text-left hover:bg-brand-surface -mx-5 px-5 py-2 transition-colors rounded-lg"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <span className="text-gray-400 shrink-0">{auth.icon}</span>
                  <span className="font-medium text-gray-900 shrink-0">{auth.label}</span>
                  <span className="text-xs text-gray-400 truncate">{auth.detail}</span>
                </div>
                <span className={`text-sm font-bold shrink-0 ml-2 ${
                  auth.status === 'green' ? 'text-green-600' :
                  auth.status === 'amber' ? 'text-amber-600' : 'text-red-600'
                }`}>{auth.score}</span>
              </div>
              <div className="w-full rounded-full bg-gray-200 h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${STATUS_BAR[auth.status]}`}
                  style={{ width: `${auth.score}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Tax Summary Widget ──────────────────────────────────────────────────────

const TAX_OBLIGATIONS = [
  { label: 'VAT — Q1 2026',                due: '7 May 2026',  amount: '£12,450', type: 'vat', urgent: false },
  { label: 'CT600 — Northern Tax Partners', due: 'Overdue',     amount: '£22,100', type: 'ct',  urgent: true  },
  { label: 'SA — Robert Northern',          due: 'Overdue',     amount: '£52,400', type: 'sa',  urgent: true  },
  { label: 'SA Payment on Account 1',       due: '31 Jan 2026', amount: '£52,075', type: 'sa',  urgent: true  },
];

const TYPE_COLOUR: Record<string, string> = {
  vat: 'bg-purple-100 text-purple-700',
  ct:  'bg-blue-100 text-blue-700',
  sa:  'bg-orange-100 text-orange-700',
};

function TaxSummaryWidget({ onNavigate }: { onNavigate: (href: string) => void }) {
  const urgentCount = TAX_OBLIGATIONS.filter((o) => o.urgent).length;
  const totalAmount = TAX_OBLIGATIONS.reduce(
    (sum, o) => sum + parseFloat(o.amount.replace(/[£,]/g, '')), 0,
  );

  return (
    <Card
      title="Tax Obligations"
      description="Outstanding payments & submissions requiring action"
      icon={<CircleDollarSign className="h-4 w-4 text-brand-gold" />}
    >
      <div className="mt-4">
        {urgentCount > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 flex items-center gap-2 text-xs text-red-700">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
            {urgentCount} obligation{urgentCount > 1 ? 's' : ''} require immediate attention
          </div>
        )}

        <div className="space-y-2">
          {TAX_OBLIGATIONS.map((ob) => (
            <div
              key={ob.label}
              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${
                ob.urgent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase shrink-0 ${TYPE_COLOUR[ob.type]}`}>
                  {ob.type}
                </span>
                <span className="text-gray-700 truncate text-xs">{ob.label}</span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="font-bold text-gray-900 text-sm">{ob.amount}</p>
                <p className={`text-xs mt-0.5 ${ob.urgent ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>{ob.due}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total outstanding</p>
            <p className="text-base font-bold text-gray-900">£{totalAmount.toLocaleString('en-GB')}</p>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => onNavigate('/app/vat')}>
              VAT
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => onNavigate('/app/corporation-tax')}>
              CT
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => onNavigate('/app/self-assessment')}>
              SA
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Dashboard Page ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, navigate] = useLocation();

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Deployment stats */}
        <CardGrid cols={4}>
          {STATS.map((s) => (
            <Card key={s.label} icon={s.icon} title={s.label}>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              {s.delta && <p className="text-xs text-gray-400 mt-0.5">{s.delta}</p>}
            </Card>
          ))}
        </CardGrid>

        {/* Compliance Health + Tax Summary */}
        <div className="grid lg:grid-cols-2 gap-4">
          <ComplianceHealthPanel onNavigate={navigate} />
          <TaxSummaryWidget onNavigate={navigate} />
        </div>

        {/* Quick actions */}
        <Card title="Quick Actions">
          <div className="flex flex-wrap gap-3 mt-2">
            <Button onClick={() => navigate('/app/deploy')}>
              <Rocket className="h-4 w-4" /> New Deployment
            </Button>
            <Button variant="outline" onClick={() => navigate('/app/vat')}>
              <Receipt className="h-4 w-4" /> VAT Management
            </Button>
            <Button variant="outline" onClick={() => navigate('/app/corporation-tax')}>
              <Building2 className="h-4 w-4" /> Corporation Tax
            </Button>
            <Button variant="outline" onClick={() => navigate('/app/self-assessment')}>
              <UserCheck className="h-4 w-4" /> Self Assessment
            </Button>
            <Button variant="outline" onClick={() => navigate('/app/history')}>
              <History className="h-4 w-4" /> View All Runs
            </Button>
          </div>
        </Card>

        {/* Recent deployments */}
        <Card title="Recent Deployments">
          <div className="mt-2 divide-y divide-gray-100">
            {RECENT.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-brand-surface -mx-5 px-5 transition-colors"
                onClick={() => navigate(`/app/history/${r.id}`)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.tenant}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.ts}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={r.status} />
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
