import { useState } from 'react';
import {
  Building2, CheckCircle, AlertCircle, Clock, RefreshCw,
  FileText, CircleDollarSign, TriangleAlert, Calendar,
  ArrowRight, ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { CardGrid } from '@/components/fineguard/CardGrid';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

type CTStatus = 'open' | 'in_progress' | 'filed' | 'overdue';

interface CTFiling {
  id: number;
  company: string;
  utr: string;
  periodStart: string;
  periodEnd: string;
  filingDue: string;
  paymentDue: string;
  taxEstimate: string;
  status: CTStatus;
  completeness: number;
}

const CT_FILINGS: CTFiling[] = [
  {
    id: 1,
    company: 'Smithson & Co Accountants Ltd',
    utr: '1234567890',
    periodStart: '01 Jan 2025',
    periodEnd: '31 Dec 2025',
    filingDue: '30 Sep 2026',
    paymentDue: '1 Oct 2026',
    taxEstimate: '£34,200',
    status: 'in_progress',
    completeness: 72,
  },
  {
    id: 2,
    company: 'Patel Advisory Services Ltd',
    utr: '9876543210',
    periodStart: '01 Apr 2024',
    periodEnd: '31 Mar 2025',
    filingDue: '31 Dec 2025',
    paymentDue: '1 Jan 2026',
    taxEstimate: '£18,750',
    status: 'filed',
    completeness: 100,
  },
  {
    id: 3,
    company: 'Northern Tax Partners Ltd',
    utr: '5544332211',
    periodStart: '01 Jan 2024',
    periodEnd: '31 Dec 2024',
    filingDue: '30 Sep 2025',
    paymentDue: '1 Oct 2025',
    taxEstimate: '£22,100',
    status: 'overdue',
    completeness: 45,
  },
  {
    id: 4,
    company: 'Greenfield Accountancy Ltd',
    utr: '1122334455',
    periodStart: '01 Apr 2025',
    periodEnd: '31 Mar 2026',
    filingDue: '31 Dec 2026',
    paymentDue: '1 Jan 2027',
    taxEstimate: '£14,500',
    status: 'open',
    completeness: 0,
  },
];

const STATUS_STYLES: Record<CTStatus, string> = {
  open:        'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  filed:       'bg-green-100 text-green-700',
  overdue:     'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<CTStatus, string> = {
  open:        'Open',
  in_progress: 'In Progress',
  filed:       'Filed',
  overdue:     'Overdue',
};

const VALIDATION_CHECKS = [
  { label: 'Accounts matched to CT600 figures',    pass: true  },
  { label: 'Capital allowances calculated',         pass: true  },
  { label: 'R&D relief claims validated',           pass: true  },
  { label: 'Directors loan accounts reconciled',    pass: false },
  { label: 'Prior year losses carried forward',     pass: true  },
  { label: 'Deferred tax positions reviewed',       pass: false },
];

export default function CorporationTaxPage() {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState<number | null>(null);

  const overdue     = CT_FILINGS.filter((f) => f.status === 'overdue').length;
  const inProgress  = CT_FILINGS.filter((f) => f.status === 'in_progress').length;
  const filed       = CT_FILINGS.filter((f) => f.status === 'filed').length;
  const totalTax    = CT_FILINGS.reduce((sum, f) => sum + parseFloat(f.taxEstimate.replace(/[£,]/g, '')), 0);
  const checksPass  = VALIDATION_CHECKS.every((c) => c.pass);

  return (
    <AppLayout title="Corporation Tax — CT600 Management">
      <div className="space-y-6">

        {/* Stats */}
        <CardGrid cols={4}>
          {[
            {
              label: 'Total CT Filings',
              value: String(CT_FILINGS.length),
              icon: <FileText className="h-5 w-5 text-gray-400" />,
              colour: 'text-gray-900',
            },
            {
              label: 'In Progress',
              value: String(inProgress),
              icon: <Clock className="h-5 w-5 text-blue-500" />,
              colour: 'text-blue-600',
            },
            {
              label: 'Filed',
              value: String(filed),
              icon: <CheckCircle className="h-5 w-5 text-green-500" />,
              colour: 'text-green-600',
            },
            {
              label: overdue > 0 ? 'Overdue — Act Now' : 'Overdue',
              value: String(overdue),
              icon: overdue > 0
                ? <TriangleAlert className="h-5 w-5 text-red-500" />
                : <ShieldCheck className="h-5 w-5 text-green-500" />,
              colour: overdue > 0 ? 'text-red-600' : 'text-green-600',
            },
          ].map((s) => (
            <Card key={s.label} icon={s.icon} title={s.label}>
              <p className={`text-2xl font-bold mt-1 ${s.colour}`}>{s.value}</p>
            </Card>
          ))}
        </CardGrid>

        {/* Overdue alert */}
        {overdue > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {overdue} overdue CT600 {overdue === 1 ? 'filing' : 'filings'} require immediate action
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                HMRC charges a £100 automatic penalty for late CT600s, plus additional penalties at 3, 6 and 12 months.
                Submit outstanding returns immediately.
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="shrink-0 text-xs h-7"
              onClick={() => setExpanded(CT_FILINGS.find((f) => f.status === 'overdue')?.id ?? null)}
            >
              View overdue
            </Button>
          </div>
        )}

        {/* CT filings table */}
        <Card
          title="CT600 Filing Register"
          description="All corporation tax filings tracked by FineGuard"
          icon={<Building2 className="h-4 w-4 text-brand-gold" />}
        >
          <div className="mt-4 space-y-0 divide-y divide-gray-100">
            {CT_FILINGS.map((filing) => (
              <div key={filing.id}>
                <button
                  onClick={() => setExpanded(expanded === filing.id ? null : filing.id)}
                  className="w-full flex items-center gap-4 py-4 hover:bg-brand-surface -mx-5 px-5 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{filing.company}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[filing.status]}`}>
                        {STATUS_LABEL[filing.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Period: {filing.periodStart} – {filing.periodEnd} · Filing due: {filing.filingDue}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{filing.taxEstimate}</p>
                    <p className="text-xs text-gray-400 mt-0.5">estimated tax</p>
                  </div>
                  <ArrowRight className={`h-4 w-4 text-gray-300 shrink-0 transition-transform ${expanded === filing.id ? 'rotate-90' : ''}`} />
                </button>

                {expanded === filing.id && (
                  <div className="pb-5 -mx-5 px-5 space-y-4">
                    {/* Completeness bar */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>Data completeness</span>
                        <span className="font-semibold">{filing.completeness}%</span>
                      </div>
                      <div className="w-full rounded-full bg-gray-200 h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${
                            filing.completeness === 100 ? 'bg-green-500' :
                            filing.completeness > 60  ? 'bg-brand-gold' : 'bg-red-500'
                          }`}
                          style={{ width: `${filing.completeness}%` }}
                        />
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {[
                        { label: 'UTR',          value: filing.utr },
                        { label: 'Payment Due',  value: filing.paymentDue },
                        { label: 'Tax Estimate', value: filing.taxEstimate },
                        { label: 'Status',       value: STATUS_LABEL[filing.status] },
                      ].map((d) => (
                        <div key={d.label} className="rounded-lg border border-gray-200 bg-brand-surface px-3 py-2">
                          <p className="text-gray-400 mb-0.5">{d.label}</p>
                          <p className="font-semibold text-gray-900">{d.value}</p>
                        </div>
                      ))}
                    </div>

                    {filing.status !== 'filed' && (
                      <Button
                        size="sm"
                        disabled={filing.completeness < 80}
                        className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-semibold text-xs h-8 gap-1.5 disabled:opacity-40"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {filing.completeness < 80 ? `Complete data first (${filing.completeness}%)` : 'Prepare CT600 for submission'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Pre-filing validation */}
          <Card
            title="Pre-Filing Validation"
            description="Missing data detection before CT600 submission"
            icon={<ShieldCheck className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 space-y-2.5">
              {VALIDATION_CHECKS.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{c.label}</span>
                  {c.pass
                    ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                </div>
              ))}
              {!checksPass && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {VALIDATION_CHECKS.filter((c) => !c.pass).length} item{VALIDATION_CHECKS.filter((c) => !c.pass).length > 1 ? 's' : ''} require attention before filing.
                </div>
              )}
            </div>
          </Card>

          {/* Tax liability summary */}
          <Card
            title="Total Tax Liability"
            description="Estimated corporation tax across all companies"
            icon={<CircleDollarSign className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 space-y-3">
              {CT_FILINGS.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate max-w-[200px]">{f.company}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-gray-900">{f.taxEstimate}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[f.status]}`}>
                      {STATUS_LABEL[f.status]}
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm font-bold">
                <span className="text-gray-900">Total (estimated)</span>
                <span className="text-brand-navy">£{totalTax.toLocaleString('en-GB')}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Deadline engine */}
        <Card
          title="Upcoming CT Deadlines"
          icon={<Calendar className="h-4 w-4 text-brand-gold" />}
        >
          <div className="mt-4 space-y-2">
            {CT_FILINGS
              .filter((f) => f.status !== 'filed')
              .sort((a, b) => new Date(a.filingDue).getTime() - new Date(b.filingDue).getTime())
              .map((f) => (
                <div
                  key={f.id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                    f.status === 'overdue' ? 'border-red-200 bg-red-50' :
                    f.status === 'in_progress' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.company}</p>
                    <p className="text-xs text-gray-500 mt-0.5">CT600 filing due {f.filingDue}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{f.taxEstimate}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[f.status]}`}>
                      {STATUS_LABEL[f.status]}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>

      </div>
    </AppLayout>
  );
}
