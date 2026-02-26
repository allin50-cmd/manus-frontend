import { useState } from 'react';
import { useLocation } from 'wouter';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Table, Column } from '@/components/fineguard/Table';
import { StatusPill, Status } from '@/components/fineguard/StatusPill';
import { ToggleGroup } from '@/components/fineguard/ToggleGroup';

interface Run {
  id: string;
  tenantName: string;
  tenantEmail: string;
  createdAt: string;
  status: Status;
  runtimeEndpoint: string;
}

const ALL_RUNS: Run[] = [
  { id: 'run-001', tenantName: 'Smithson & Co Accountants', tenantEmail: 'admin@smithson.co.uk',  createdAt: '14 Jan 2025 09:42', status: 'Success', runtimeEndpoint: 'smithson.azurewebsites.net' },
  { id: 'run-002', tenantName: 'Patel Advisory Services',  tenantEmail: 'it@pateladvisory.co.uk', createdAt: '14 Jan 2025 11:05', status: 'Running', runtimeEndpoint: 'patel.azurewebsites.net' },
  { id: 'run-003', tenantName: 'Northern Tax Partners',    tenantEmail: 'ops@ntpartners.co.uk',   createdAt: '13 Jan 2025 15:30', status: 'Failed',  runtimeEndpoint: 'ntp.azurewebsites.net' },
  { id: 'run-004', tenantName: 'Meridian Accounting Ltd',  tenantEmail: 'admin@meridian.co.uk',   createdAt: '10 Jan 2025 08:15', status: 'Success', runtimeEndpoint: 'meridian.azurewebsites.net' },
  { id: 'run-005', tenantName: 'Bloom & Kaye LLP',         tenantEmail: 'tech@bloomkaye.co.uk',   createdAt: '08 Jan 2025 14:22', status: 'Success', runtimeEndpoint: 'bloomkaye.azurewebsites.net' },
];

type Filter = 'all' | 'Success' | 'Running' | 'Failed';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'Success', label: 'Success' },
  { value: 'Running', label: 'Running' },
  { value: 'Failed',  label: 'Failed' },
];

export default function DeploymentHistory() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<Filter>('all');

  const rows = filter === 'all' ? ALL_RUNS : ALL_RUNS.filter((r) => r.status === filter);

  const columns: Column<Run>[] = [
    { key: 'tenantName',      header: 'Tenant' },
    { key: 'tenantEmail',     header: 'Email',   className: 'text-gray-400 text-xs' },
    { key: 'createdAt',       header: 'Date',    className: 'text-xs' },
    { key: 'runtimeEndpoint', header: 'Endpoint', className: 'text-xs font-mono' },
    {
      key: 'status', header: 'Status',
      render: (r) => <StatusPill status={r.status} />,
    },
  ];

  return (
    <AppLayout title="Deployment History">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{rows.length} run{rows.length !== 1 && 's'}</p>
          <ToggleGroup options={FILTERS} value={filter} onChange={setFilter} />
        </div>
        <Table
          columns={columns}
          rows={rows}
          onRowClick={(r) => navigate(`/app/history/${r.id}`)}
          emptyMessage="No deployments match this filter."
        />
      </div>
    </AppLayout>
  );
}
