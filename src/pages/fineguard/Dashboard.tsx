import { useLocation } from 'wouter';
import { Rocket, History, CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
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
  { id: 'run-001', tenant: 'Smithson & Co Accountants', status: 'Success' as const,  ts: '2025-01-14 09:42' },
  { id: 'run-002', tenant: 'Patel Advisory Services',  status: 'Running' as const,  ts: '2025-01-14 11:05' },
  { id: 'run-003', tenant: 'Northern Tax Partners',    status: 'Failed'  as const,  ts: '2025-01-13 15:30' },
];

export default function Dashboard() {
  const [, navigate] = useLocation();

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <CardGrid cols={4}>
          {STATS.map((s) => (
            <Card key={s.label} icon={s.icon} title={s.label}>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              {s.delta && <p className="text-xs text-gray-400 mt-0.5">{s.delta}</p>}
            </Card>
          ))}
        </CardGrid>

        {/* Quick actions */}
        <Card title="Quick Actions">
          <div className="flex flex-wrap gap-3 mt-2">
            <Button onClick={() => navigate('/app/deploy')}>
              <Rocket className="h-4 w-4" /> New Deployment
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
