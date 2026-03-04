import { useState } from 'react';
import {
  UserCheck, CheckCircle, AlertCircle, Clock,
  CircleDollarSign, FileText, TriangleAlert, Bell,
  TrendingUp, Calendar, ChevronDown, ChevronRight,
} from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { CardGrid } from '@/components/fineguard/CardGrid';
import { Button } from '@/components/ui/button';

type SAStatus = 'filed' | 'in_progress' | 'pending' | 'overdue';

interface SAReturn {
  id: number;
  client: string;
  utr: string;
  taxYear: string;
  incomeStreams: { label: string; amount: string }[];
  totalIncome: string;
  taxDue: string;
  paymentOnAccount1: string;
  paymentOnAccount2: string;
  filingDue: string;
  paymentDue: string;
  status: SAStatus;
}

const SA_RETURNS: SAReturn[] = [
  {
    id: 1,
    client: 'James Smithson',
    utr: '1234509876',
    taxYear: '2024/25',
    incomeStreams: [
      { label: 'Employment income',  amount: '£72,000' },
      { label: 'Rental income',      amount: '£18,400' },
      { label: 'Dividend income',    amount: '£8,000'  },
    ],
    totalIncome: '£98,400',
    taxDue: '£31,200',
    paymentOnAccount1: '£15,600',
    paymentOnAccount2: '£15,600',
    filingDue: '31 Jan 2026',
    paymentDue: '31 Jan 2026',
    status: 'filed',
  },
  {
    id: 2,
    client: 'Priya Patel',
    utr: '9876501234',
    taxYear: '2024/25',
    incomeStreams: [
      { label: 'Self-employment',    amount: '£55,000' },
      { label: 'Interest income',    amount: '£12,500' },
    ],
    totalIncome: '£67,500',
    taxDue: '£18,600',
    paymentOnAccount1: '£9,300',
    paymentOnAccount2: '£9,300',
    filingDue: '31 Jan 2026',
    paymentDue: '31 Jan 2026',
    status: 'in_progress',
  },
  {
    id: 3,
    client: 'Robert Northern',
    utr: '5544309887',
    taxYear: '2024/25',
    incomeStreams: [
      { label: 'Employment income',  amount: '£100,000' },
      { label: 'Rental income',      amount: '£24,000'  },
      { label: 'Capital gains',      amount: '£18,000'  },
    ],
    totalIncome: '£142,000',
    taxDue: '£52,400',
    paymentOnAccount1: '£26,200',
    paymentOnAccount2: '£26,200',
    filingDue: '31 Jan 2026',
    paymentDue: '31 Jan 2026',
    status: 'overdue',
  },
  {
    id: 4,
    client: 'Claire Greenfield',
    utr: '1122309876',
    taxYear: '2024/25',
    incomeStreams: [
      { label: 'Self-employment',    amount: '£45,000' },
      { label: 'Rental income',      amount: '£10,000' },
    ],
    totalIncome: '£55,000',
    taxDue: '£12,750',
    paymentOnAccount1: '£6,375',
    paymentOnAccount2: '£6,375',
    filingDue: '31 Jan 2026',
    paymentDue: '31 Jan 2026',
    status: 'pending',
  },
];

const STATUS_STYLES: Record<SAStatus, string> = {
  filed:       'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  pending:     'bg-amber-100 text-amber-700',
  overdue:     'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<SAStatus, string> = {
  filed:       'Filed',
  in_progress: 'In Progress',
  pending:     'Pending',
  overdue:     'Overdue',
};

const PAYMENT_DEADLINES = [
  {
    label: '1st Payment on Account 2024/25',
    due: '31 Jan 2026',
    amount: '£52,075',
    status: 'overdue' as const,
    note: 'Sum of all clients\' 1st payments',
  },
  {
    label: '2nd Payment on Account 2024/25',
    due: '31 Jul 2026',
    amount: '£52,075',
    status: 'upcoming' as const,
    note: 'Reminder will fire 30 days before',
  },
  {
    label: 'Balancing Payment 2024/25',
    due: '31 Jan 2027',
    amount: 'TBC',
    status: 'future' as const,
    note: 'Calculated after all returns filed',
  },
];

export default function SelfAssessmentPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const filed      = SA_RETURNS.filter((r) => r.status === 'filed').length;
  const overdue    = SA_RETURNS.filter((r) => r.status === 'overdue').length;
  const pending    = SA_RETURNS.filter((r) => r.status === 'pending' || r.status === 'in_progress').length;
  const totalTax   = SA_RETURNS.reduce((sum, r) => sum + parseFloat(r.taxDue.replace(/[£,]/g, '')), 0);

  return (
    <AppLayout title="Self Assessment — SA Return Management">
      <div className="space-y-6">

        {/* Stats */}
        <CardGrid cols={4}>
          {[
            {
              label: 'Total Returns',
              value: String(SA_RETURNS.length),
              icon: <UserCheck className="h-5 w-5 text-gray-400" />,
              colour: 'text-gray-900',
            },
            {
              label: 'Filed',
              value: String(filed),
              icon: <CheckCircle className="h-5 w-5 text-green-500" />,
              colour: 'text-green-600',
            },
            {
              label: 'Pending / In Progress',
              value: String(pending),
              icon: <Clock className="h-5 w-5 text-blue-500" />,
              colour: 'text-blue-600',
            },
            {
              label: overdue > 0 ? 'Overdue — Act Now' : 'Overdue',
              value: String(overdue),
              icon: overdue > 0
                ? <TriangleAlert className="h-5 w-5 text-red-500" />
                : <CheckCircle className="h-5 w-5 text-green-500" />,
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
            <div>
              <p className="text-sm font-semibold text-red-800">
                {overdue} self assessment {overdue === 1 ? 'return is' : 'returns are'} overdue
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                HMRC applies a £100 automatic penalty for missing the 31 January deadline, with daily penalties after 3 months.
                Submit outstanding returns immediately to reduce penalty exposure.
              </p>
            </div>
          </div>
        )}

        {/* SA returns */}
        <Card
          title="Self Assessment Returns"
          description="All SA returns tracked with income stream breakdown"
          icon={<FileText className="h-4 w-4 text-brand-gold" />}
        >
          <div className="mt-4 divide-y divide-gray-100">
            {SA_RETURNS.map((ret) => (
              <div key={ret.id}>
                <button
                  onClick={() => setExpanded(expanded === ret.id ? null : ret.id)}
                  className="w-full flex items-center gap-4 py-4 hover:bg-brand-surface -mx-5 px-5 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{ret.client}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[ret.status]}`}>
                        {STATUS_LABEL[ret.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tax year {ret.taxYear} · UTR: {ret.utr} · Filing due: {ret.filingDue}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{ret.taxDue}</p>
                    <p className="text-xs text-gray-400 mt-0.5">tax due</p>
                  </div>
                  {expanded === ret.id
                    ? <ChevronDown className="h-4 w-4 text-gray-300 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />}
                </button>

                {expanded === ret.id && (
                  <div className="pb-5 -mx-5 px-5 space-y-4">
                    {/* Income streams */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Income streams</p>
                      <div className="space-y-1.5">
                        {ret.incomeStreams.map((s) => (
                          <div key={s.label} className="flex justify-between text-sm">
                            <span className="text-gray-600">{s.label}</span>
                            <span className="font-medium text-gray-900">{s.amount}</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm font-bold">
                          <span className="text-gray-900">Total income</span>
                          <span className="text-brand-navy">{ret.totalIncome}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payments */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {[
                        { label: 'Tax Due',             value: ret.taxDue },
                        { label: 'Payment on Account 1',value: ret.paymentOnAccount1 },
                        { label: 'Payment on Account 2',value: ret.paymentOnAccount2 },
                      ].map((d) => (
                        <div key={d.label} className="rounded-lg border border-gray-200 bg-brand-surface px-3 py-2">
                          <p className="text-gray-400 mb-0.5">{d.label}</p>
                          <p className="font-bold text-gray-900">{d.value}</p>
                        </div>
                      ))}
                    </div>

                    {ret.status !== 'filed' && (
                      <Button
                        size="sm"
                        className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-semibold text-xs h-8 gap-1.5"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        {ret.status === 'overdue' ? 'Submit overdue return now' : 'Continue SA return'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Payment deadlines */}
          <Card
            title="Payment Deadlines"
            description="Upcoming HMRC payment obligations"
            icon={<Calendar className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 space-y-3">
              {PAYMENT_DEADLINES.map((p) => (
                <div
                  key={p.label}
                  className={`rounded-lg border px-4 py-3 ${
                    p.status === 'overdue'  ? 'border-red-200 bg-red-50' :
                    p.status === 'upcoming' ? 'border-amber-200 bg-amber-50' :
                    'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.note}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{p.amount}</p>
                      <p className={`text-xs mt-0.5 capitalize ${
                        p.status === 'overdue' ? 'text-red-600' :
                        p.status === 'upcoming' ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        Due {p.due}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Income trend */}
          <Card
            title="Tax Liability by Client"
            description="Total SA tax due across all clients"
            icon={<TrendingUp className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 space-y-3">
              {SA_RETURNS.map((r) => {
                const val = parseFloat(r.taxDue.replace(/[£,]/g, ''));
                const pct = Math.round((val / totalTax) * 100);
                return (
                  <div key={r.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{r.client}</span>
                      <span className="font-semibold text-gray-900">{r.taxDue} ({pct}%)</span>
                    </div>
                    <div className="w-full rounded-full bg-gray-200 h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${STATUS_STYLES[r.status].includes('green') ? 'bg-green-500' : STATUS_STYLES[r.status].includes('blue') ? 'bg-blue-500' : STATUS_STYLES[r.status].includes('red') ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                <span className="text-gray-900">Total tax due</span>
                <span className="text-brand-navy">£{totalTax.toLocaleString('en-GB')}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Penalty risk engine */}
        <Card
          title="Penalty Risk Engine"
          description="Automated risk detection for all SA deadlines"
          icon={<Bell className="h-4 w-4 text-brand-gold" />}
        >
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
            {[
              {
                icon: <TriangleAlert className="h-4 w-4 text-red-500" />,
                label: 'Immediate risk',
                clients: SA_RETURNS.filter((r) => r.status === 'overdue').map((r) => r.client),
                colour: 'border-red-200 bg-red-50',
                text: 'text-red-700',
              },
              {
                icon: <Clock className="h-4 w-4 text-amber-500" />,
                label: 'Action needed',
                clients: SA_RETURNS.filter((r) => r.status === 'pending' || r.status === 'in_progress').map((r) => r.client),
                colour: 'border-amber-200 bg-amber-50',
                text: 'text-amber-700',
              },
              {
                icon: <CheckCircle className="h-4 w-4 text-green-500" />,
                label: 'Compliant',
                clients: SA_RETURNS.filter((r) => r.status === 'filed').map((r) => r.client),
                colour: 'border-green-200 bg-green-50',
                text: 'text-green-700',
              },
            ].map((bucket) => (
              <div key={bucket.label} className={`rounded-lg border px-4 py-3 ${bucket.colour}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  {bucket.icon}
                  <span className={`font-semibold text-sm ${bucket.text}`}>{bucket.label}</span>
                </div>
                {bucket.clients.length === 0 ? (
                  <p className="text-xs text-gray-400">None</p>
                ) : (
                  <ul className="space-y-0.5">
                    {bucket.clients.map((c) => (
                      <li key={c} className={`text-xs ${bucket.text}`}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>

      </div>
    </AppLayout>
  );
}
