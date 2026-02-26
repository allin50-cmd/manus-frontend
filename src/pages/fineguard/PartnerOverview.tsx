import { useLocation } from 'wouter';
import { Users, Building2, ArrowRight, CheckCircle } from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { CardGrid } from '@/components/fineguard/CardGrid';
import { Table, Column } from '@/components/fineguard/Table';
import { StatusPill, Status } from '@/components/fineguard/StatusPill';
import { Button } from '@/components/ui/button';

interface Tenant {
  id: string;
  name: string;
  email: string;
  deployedAt: string;
  status: Status;
  tenantsCount: number;
}

const TENANTS: Tenant[] = [
  { id: 't-001', name: 'Smithson & Co Accountants', email: 'admin@smithson.co.uk',  deployedAt: '14 Jan 2025', status: 'Success', tenantsCount: 3 },
  { id: 't-002', name: 'Patel Advisory Services',  email: 'it@pateladvisory.co.uk', deployedAt: '14 Jan 2025', status: 'Running', tenantsCount: 1 },
  { id: 't-003', name: 'Northern Tax Partners',    email: 'ops@ntpartners.co.uk',   deployedAt: '13 Jan 2025', status: 'Failed',  tenantsCount: 0 },
  { id: 't-004', name: 'Meridian Accounting Ltd',  email: 'admin@meridian.co.uk',   deployedAt: '10 Jan 2025', status: 'Success', tenantsCount: 7 },
  { id: 't-005', name: 'Bloom & Kaye LLP',         email: 'tech@bloomkaye.co.uk',   deployedAt: '08 Jan 2025', status: 'Success', tenantsCount: 4 },
];

const BENEFITS = [
  'Multi-tenant management from a single portal',
  'Recurring revenue via white-label licensing',
  'Automated deployment reduces billable time',
  'Priority support and dedicated onboarding',
  'Access to FineGuard Partner Programme portal',
];

const columns: Column<Tenant>[] = [
  { key: 'name',         header: 'Practice' },
  { key: 'email',        header: 'Contact',       className: 'text-xs text-gray-400' },
  { key: 'deployedAt',   header: 'Deployed',       className: 'text-xs' },
  { key: 'tenantsCount', header: 'Client Tenants', render: (r) => <span className="font-mono text-sm">{r.tenantsCount}</span> },
  { key: 'status',       header: 'Status',         render: (r) => <StatusPill status={r.status} /> },
];

export default function PartnerOverview() {
  const [, navigate] = useLocation();

  return (
    <AppLayout title="Partner Overview">
      <div className="space-y-6">
        {/* Stats */}
        <CardGrid cols={3}>
          <Card icon={<Users className="h-5 w-5" />} title="Managed Practices">
            <p className="text-2xl font-bold text-gray-900 mt-1">5</p>
          </Card>
          <Card icon={<Building2 className="h-5 w-5" />} title="Total Client Tenants">
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {TENANTS.reduce((a, t) => a + t.tenantsCount, 0)}
            </p>
          </Card>
          <Card icon={<CheckCircle className="h-5 w-5 text-green-500" />} title="Active Deployments">
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {TENANTS.filter((t) => t.status === 'Success').length}
            </p>
          </Card>
        </CardGrid>

        {/* Partner benefits */}
        <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-6">
          <p className="text-sm font-semibold text-white mb-4">Partner Programme Benefits</p>
          <ul className="space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-brand-gold shrink-0" /> {b}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <a href="mailto:partners@fineguard.co.uk">
              <Button>
                Contact Partner Team <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>

        {/* Tenant table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Managed Practices</p>
            <Button size="sm" variant="outline" onClick={() => navigate('/app/deploy')}>Add Practice</Button>
          </div>
          <Table
            columns={columns}
            rows={TENANTS}
            onRowClick={(r) => navigate(`/app/tenants/${r.id}`)}
          />
        </div>
      </div>
    </AppLayout>
  );
}
