import { useParams, useLocation } from 'wouter';
import { ArrowLeft, Calendar, FileCheck, AlertCircle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { CardGrid } from '@/components/fineguard/CardGrid';
import { Table, Column } from '@/components/fineguard/Table';
import { StatusPill } from '@/components/fineguard/StatusPill';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Deadline {
  id: string;
  type: string;
  client: string;
  dueDate: string;
  daysLeft: number;
  risk: 'low' | 'medium' | 'high';
}

const MOCK_TENANTS: Record<string, { name: string; email: string; spDomain: string; deadlines: Deadline[] }> = {
  't-001': {
    name: 'Smithson & Co Accountants',
    email: 'admin@smithson.co.uk',
    spDomain: 'smithson.sharepoint.com',
    deadlines: [
      { id: 'd-1', type: 'Confirmation Statement',  client: 'Acme Widgets Ltd',      dueDate: '01 Feb 2025', daysLeft: 18, risk: 'medium' },
      { id: 'd-2', type: 'Annual Accounts',         client: 'Greenvale Holdings',    dueDate: '28 Feb 2025', daysLeft: 45, risk: 'low' },
      { id: 'd-3', type: 'VAT Return',              client: 'Kendrick Services Ltd', dueDate: '22 Jan 2025', daysLeft: 8,  risk: 'high' },
      { id: 'd-4', type: 'Corporation Tax Return',  client: 'Northfield Bakeries',   dueDate: '31 Mar 2025', daysLeft: 75, risk: 'low' },
    ],
  },
};

const riskBadge: Record<'low' | 'medium' | 'high', React.ReactElement> = {
  low:    <Badge variant="success">Low</Badge>,
  medium: <Badge variant="warning">Medium</Badge>,
  high:   <Badge variant="error">High</Badge>,
};

const DEADLINES_COLS: Column<Deadline>[] = [
  { key: 'type',     header: 'Obligation Type' },
  { key: 'client',   header: 'Client' },
  { key: 'dueDate',  header: 'Due Date', className: 'text-xs' },
  { key: 'daysLeft', header: 'Days Left', render: (r) => <span className="font-mono text-sm">{r.daysLeft}</span> },
  { key: 'risk',     header: 'Risk',      render: (r) => riskBadge[r.risk] },
];

export default function TenantOverview() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const tenant = MOCK_TENANTS[id ?? ''];

  if (!tenant) {
    return (
      <AppLayout title="Tenant Overview">
        <p className="text-gray-500">Tenant not found.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/app/partners')}>
          <ArrowLeft className="h-4 w-4" /> Back to Partners
        </Button>
      </AppLayout>
    );
  }

  const overdue  = tenant.deadlines.filter((d) => d.daysLeft <= 7);
  const upcoming = tenant.deadlines.filter((d) => d.daysLeft > 7 && d.daysLeft <= 30);
  const ok       = tenant.deadlines.filter((d) => d.daysLeft > 30);

  return (
    <AppLayout title={tenant.name}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/partners')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <StatusPill status="Success" />
        </div>

        {/* Meta */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div><p className="text-xs text-gray-400 mb-0.5">Contact</p><p className="font-medium">{tenant.email}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">SharePoint</p><p className="font-mono text-xs text-gray-600">{tenant.spDomain}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Last Sync</p><p className="font-medium">14 Jan 2025 09:42</p></div>
          </div>
        </div>

        {/* Deadline summary */}
        <CardGrid cols={3}>
          <Card icon={<AlertCircle className="h-5 w-5 text-red-500" />} title="Overdue / Critical">
            <p className="text-2xl font-bold text-red-600 mt-1">{overdue.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">≤ 7 days</p>
          </Card>
          <Card icon={<Clock className="h-5 w-5 text-amber-500" />} title="Due Soon">
            <p className="text-2xl font-bold text-amber-600 mt-1">{upcoming.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">8 – 30 days</p>
          </Card>
          <Card icon={<Calendar className="h-5 w-5 text-green-500" />} title="On Track">
            <p className="text-2xl font-bold text-green-600 mt-1">{ok.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">&gt; 30 days</p>
          </Card>
        </CardGrid>

        {/* Deadlines table */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">Upcoming Filing Obligations</p>
          <Table
            columns={DEADLINES_COLS}
            rows={tenant.deadlines}
            emptyMessage="No upcoming deadlines."
          />
        </div>
      </div>
    </AppLayout>
  );
}
