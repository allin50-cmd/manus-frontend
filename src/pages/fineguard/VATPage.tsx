import { useState } from 'react';
import {
  Receipt, CheckCircle, AlertCircle, Clock, RefreshCw,
  SendHorizonal, CircleDollarSign, FileText, TrendingUp,
  ShieldCheck, TriangleAlert,
} from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { CardGrid } from '@/components/fineguard/CardGrid';
import { Button } from '@/components/ui/button';

type VATStatus = 'open' | 'filed' | 'overdue' | 'pending';

interface VATObligation {
  id: number;
  period: string;
  start: string;
  end: string;
  due: string;
  received?: string;
  status: VATStatus;
  liability: string;
  reference?: string;
}

const OBLIGATIONS: VATObligation[] = [
  {
    id: 1,
    period: 'Q1 2026',
    start: '01 Jan 2026',
    end: '31 Mar 2026',
    due: '7 May 2026',
    status: 'open',
    liability: '£12,450',
  },
  {
    id: 2,
    period: 'Q4 2025',
    start: '01 Oct 2025',
    end: '31 Dec 2025',
    due: '7 Feb 2026',
    received: '4 Feb 2026',
    status: 'filed',
    liability: '£9,870',
    reference: 'MTD-VAT-2025-Q4-5512',
  },
  {
    id: 3,
    period: 'Q3 2025',
    start: '01 Jul 2025',
    end: '30 Sep 2025',
    due: '7 Nov 2025',
    received: '2 Nov 2025',
    status: 'filed',
    liability: '£11,230',
    reference: 'MTD-VAT-2025-Q3-4401',
  },
  {
    id: 4,
    period: 'Q2 2025',
    start: '01 Apr 2025',
    end: '30 Jun 2025',
    due: '7 Aug 2025',
    received: '6 Aug 2025',
    status: 'filed',
    liability: '£8,640',
    reference: 'MTD-VAT-2025-Q2-3389',
  },
];

const STATUS_STYLES: Record<VATStatus, string> = {
  open:    'bg-amber-100 text-amber-700',
  filed:   'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-600',
};

const STATUS_LABEL: Record<VATStatus, string> = {
  open:    'Open',
  filed:   'Filed',
  overdue: 'Overdue',
  pending: 'Pending',
};

const DIGITAL_RECORDS_CHECKS = [
  { label: 'Transaction records complete',         pass: true  },
  { label: 'Input tax calculations verified',      pass: true  },
  { label: 'Output tax calculations verified',     pass: true  },
  { label: 'Reverse charge entries validated',     pass: true  },
  { label: 'Prior period adjustments reviewed',    pass: false },
];

export default function VATPage() {
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<number[]>([]);

  function handleSubmit(id: number) {
    setSubmitting(id);
    setTimeout(() => {
      setSubmitting(null);
      setSubmitted((prev) => [...prev, id]);
    }, 2500);
  }

  const totalLiabilityYTD = OBLIGATIONS
    .filter((o) => o.status === 'filed')
    .reduce((sum, o) => sum + parseFloat(o.liability.replace(/[£,]/g, '')), 0);

  const pendingCount = OBLIGATIONS.filter((o) => o.status === 'open' || o.status === 'overdue').length;
  const filedCount   = OBLIGATIONS.filter((o) => o.status === 'filed').length;
  const allChecksPass = DIGITAL_RECORDS_CHECKS.every((c) => c.pass);

  return (
    <AppLayout title="VAT — MTD Management">
      <div className="space-y-6">

        {/* Stats */}
        <CardGrid cols={4}>
          {[
            {
              label: 'Open Obligations',
              value: String(pendingCount),
              icon: <Clock className="h-5 w-5 text-amber-500" />,
              colour: pendingCount > 0 ? 'text-amber-600' : 'text-green-600',
            },
            {
              label: 'Filed This Year',
              value: String(filedCount),
              icon: <CheckCircle className="h-5 w-5 text-green-500" />,
              colour: 'text-green-600',
            },
            {
              label: 'VAT Paid YTD',
              value: `£${totalLiabilityYTD.toLocaleString('en-GB')}`,
              icon: <CircleDollarSign className="h-5 w-5 text-blue-500" />,
              colour: 'text-blue-600',
            },
            {
              label: 'Digital Records',
              value: allChecksPass ? 'All Pass' : 'Action Needed',
              icon: allChecksPass
                ? <ShieldCheck className="h-5 w-5 text-green-500" />
                : <TriangleAlert className="h-5 w-5 text-amber-500" />,
              colour: allChecksPass ? 'text-green-600' : 'text-amber-600',
            },
          ].map((s) => (
            <Card key={s.label} icon={s.icon} title={s.label}>
              <p className={`text-2xl font-bold mt-1 ${s.colour}`}>{s.value}</p>
            </Card>
          ))}
        </CardGrid>

        {/* VAT obligations */}
        <Card
          title="VAT Obligations"
          description="Pulled automatically from HMRC MTD VAT API"
          icon={<Receipt className="h-4 w-4 text-brand-gold" />}
        >
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-surface text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left rounded-tl-lg">Period</th>
                  <th className="px-4 py-3 text-left">Date Range</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-left">VAT Liability</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {OBLIGATIONS.map((o) => {
                  const isSubmitting = submitting === o.id;
                  const isDone       = submitted.includes(o.id) || o.status === 'filed';
                  return (
                    <tr key={o.id} className="hover:bg-brand-surface/50 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-gray-900">{o.period}</td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">{o.start} – {o.end}</td>
                      <td className="px-4 py-3.5 text-gray-600">{o.due}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">{o.liability}</td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[o.status]}`}>
                          {STATUS_LABEL[o.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {isDone ? (
                          <div className="text-xs text-gray-400 space-y-0.5">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" /> Submitted to HMRC
                            </div>
                            {o.reference && <div className="font-mono text-[10px] text-gray-400">{o.reference}</div>}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSubmit(o.id)}
                            disabled={isSubmitting}
                            className="h-7 text-xs gap-1.5 bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-semibold"
                          >
                            {isSubmitting
                              ? <><RefreshCw className="h-3 w-3 animate-spin" /> Submitting…</>
                              : <><SendHorizonal className="h-3 w-3" /> Submit to HMRC</>}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Digital records validation */}
          <Card
            title="Pre-Submission Validation"
            description="Zero-variance engine checks before HMRC submission"
            icon={<ShieldCheck className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 space-y-2.5">
              {DIGITAL_RECORDS_CHECKS.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{c.label}</span>
                  {c.pass
                    ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                </div>
              ))}
              {!allChecksPass && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Resolve flagged items before submitting to prevent HMRC audit triggers.
                </div>
              )}
            </div>
          </Card>

          {/* VAT liability trend */}
          <Card
            title="VAT Liability Trend"
            description="Quarterly liability over the last 4 periods"
            icon={<TrendingUp className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 flex items-end gap-3 h-28">
              {OBLIGATIONS.slice().reverse().map((o) => {
                const val = parseFloat(o.liability.replace(/[£,]/g, ''));
                const max = 13000;
                const pct = Math.round((val / max) * 100);
                return (
                  <div key={o.id} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-medium">{o.liability}</span>
                    <div
                      className="w-full rounded-t transition-all duration-700"
                      style={{ height: `${pct}%`, background: o.status === 'open' ? '#C9A64A' : '#0F1B35' }}
                    />
                    <span className="text-[10px] text-gray-400">{o.period}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* MTD connection status */}
        <Card
          title="HMRC MTD VAT Connection"
          icon={<FileText className="h-4 w-4 text-brand-gold" />}
        >
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'MTD Enrolment',      value: 'Active',       ok: true  },
              { label: 'API Authorization',  value: 'Authorized',   ok: true  },
              { label: 'Last Sync',          value: '10 mins ago',  ok: true  },
              { label: 'Submission Gateway', value: 'Operational',  ok: true  },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-gray-200 bg-brand-surface px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${item.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </AppLayout>
  );
}
