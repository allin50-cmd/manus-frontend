import { useParams, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { CardGrid } from '@/components/fineguard/CardGrid';
import { StepTimeline, Step } from '@/components/fineguard/StepTimeline';
import { LogViewer, LogEntry } from '@/components/fineguard/LogViewer';
import { StatusPill, Status } from '@/components/fineguard/StatusPill';
import { Button } from '@/components/ui/button';

interface RunDetail {
  id: string;
  tenantName: string;
  tenantEmail: string;
  createdAt: string;
  status: Status;
  runtimeEndpoint: string;
  sharePointDomain: string;
  steps: Step[];
  logs: LogEntry[];
}

const MOCK_RUNS: Record<string, RunDetail> = {
  'run-001': {
    id: 'run-001', tenantName: 'Smithson & Co Accountants', tenantEmail: 'admin@smithson.co.uk',
    createdAt: '14 Jan 2025 09:42', status: 'Success',
    runtimeEndpoint: 'smithson.azurewebsites.net', sharePointDomain: 'smithson.sharepoint.com',
    steps: [
      { id: 'auth',       label: 'Authenticate with Entra ID',       status: 'success' },
      { id: 'sharepoint', label: 'Provision SharePoint site & lists', status: 'success' },
      { id: 'teams',      label: 'Create Teams channel & tabs',       status: 'success' },
      { id: 'functions',  label: 'Deploy Azure Functions',            status: 'success' },
      { id: 'automate',   label: 'Register Power Automate flows',     status: 'success' },
      { id: 'finalise',   label: 'Finalise configuration & verify',   status: 'success' },
    ],
    logs: [
      { timestamp: '09:42:01', level: 'info',    message: 'Deployment started by admin@smithson.co.uk' },
      { timestamp: '09:42:03', level: 'success', message: 'Entra ID auth validated' },
      { timestamp: '09:42:10', level: 'info',    message: 'Creating SharePoint site FineGuard-Compliance…' },
      { timestamp: '09:42:22', level: 'success', message: 'SharePoint provisioned. 3 lists created.' },
      { timestamp: '09:42:30', level: 'info',    message: 'Creating Teams channel…' },
      { timestamp: '09:42:38', level: 'success', message: 'Teams channel ready. Tabs registered.' },
      { timestamp: '09:42:45', level: 'info',    message: 'Deploying Azure Functions…' },
      { timestamp: '09:43:00', level: 'success', message: 'Functions deployed: DeadlineChecker, AlertDispatcher' },
      { timestamp: '09:43:05', level: 'info',    message: 'Registering Power Automate flows…' },
      { timestamp: '09:43:15', level: 'success', message: '4 flows registered and active' },
      { timestamp: '09:43:20', level: 'success', message: 'All checks passed. Deployment complete.' },
    ],
  },
  'run-002': {
    id: 'run-002', tenantName: 'Patel Advisory Services', tenantEmail: 'it@pateladvisory.co.uk',
    createdAt: '14 Jan 2025 11:05', status: 'Running',
    runtimeEndpoint: 'patel.azurewebsites.net', sharePointDomain: 'pateladvisory.sharepoint.com',
    steps: [
      { id: 'auth',       label: 'Authenticate with Entra ID',       status: 'success' },
      { id: 'sharepoint', label: 'Provision SharePoint site & lists', status: 'success' },
      { id: 'teams',      label: 'Create Teams channel & tabs',       status: 'running' },
      { id: 'functions',  label: 'Deploy Azure Functions',            status: 'pending' },
      { id: 'automate',   label: 'Register Power Automate flows',     status: 'pending' },
      { id: 'finalise',   label: 'Finalise configuration & verify',   status: 'pending' },
    ],
    logs: [
      { timestamp: '11:05:00', level: 'info',    message: 'Deployment started' },
      { timestamp: '11:05:02', level: 'success', message: 'Auth validated' },
      { timestamp: '11:05:10', level: 'success', message: 'SharePoint provisioned' },
      { timestamp: '11:05:15', level: 'info',    message: 'Creating Teams channel…' },
    ],
  },
  'run-003': {
    id: 'run-003', tenantName: 'Northern Tax Partners', tenantEmail: 'ops@ntpartners.co.uk',
    createdAt: '13 Jan 2025 15:30', status: 'Failed',
    runtimeEndpoint: 'ntp.azurewebsites.net', sharePointDomain: 'ntpartners.sharepoint.com',
    steps: [
      { id: 'auth',       label: 'Authenticate with Entra ID',       status: 'success' },
      { id: 'sharepoint', label: 'Provision SharePoint site & lists', status: 'success' },
      { id: 'teams',      label: 'Create Teams channel & tabs',       status: 'failed' },
      { id: 'functions',  label: 'Deploy Azure Functions',            status: 'pending' },
      { id: 'automate',   label: 'Register Power Automate flows',     status: 'pending' },
      { id: 'finalise',   label: 'Finalise configuration & verify',   status: 'pending' },
    ],
    logs: [
      { timestamp: '15:30:00', level: 'info',  message: 'Deployment started' },
      { timestamp: '15:30:02', level: 'success', message: 'Auth validated' },
      { timestamp: '15:30:09', level: 'success', message: 'SharePoint provisioned' },
      { timestamp: '15:30:15', level: 'info',  message: 'Creating Teams channel…' },
      { timestamp: '15:30:22', level: 'error', message: 'Teams API error: 403 Forbidden – insufficient permissions. Ensure the app registration has TeamsAppInstallation.ReadWriteForTeam.All.' },
    ],
  },
};

export default function DeploymentDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const run = MOCK_RUNS[id ?? ''];

  if (!run) {
    return (
      <AppLayout title="Deployment Details">
        <p className="text-gray-500">Deployment run not found.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/app/history')}>
          <ArrowLeft className="h-4 w-4" /> Back to History
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Run: ${run.id}`}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/history')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <StatusPill status={run.status} />
        </div>

        {/* Meta */}
        <CardGrid cols={3}>
          <Card title="Tenant"    description={run.tenantEmail}><p className="font-medium text-sm mt-1">{run.tenantName}</p></Card>
          <Card title="Deployed"  ><p className="font-medium text-sm mt-1">{run.createdAt}</p></Card>
          <Card title="Endpoint"  ><p className="font-mono text-xs text-gray-500 mt-1 break-all">{run.runtimeEndpoint}</p></Card>
        </CardGrid>

        {/* Steps + Logs */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-sm font-semibold text-gray-900">Steps</p>
            <StepTimeline steps={run.steps} />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-gray-900">Log Output</p>
            <LogViewer logs={run.logs} autoScroll={false} maxHeight="20rem" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
