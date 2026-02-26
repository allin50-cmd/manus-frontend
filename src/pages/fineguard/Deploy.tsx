import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { FormSection, Field } from '@/components/fineguard/Form';
import { StepTimeline, Step } from '@/components/fineguard/StepTimeline';
import { LogViewer, LogEntry } from '@/components/fineguard/LogViewer';
import { StatusPill } from '@/components/fineguard/StatusPill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DeployPhase = 'idle' | 'running' | 'success' | 'failed';

const INITIAL_STEPS: Step[] = [
  { id: 'auth',       label: 'Authenticate with Entra ID',          status: 'pending' },
  { id: 'sharepoint', label: 'Provision SharePoint site & lists',    status: 'pending' },
  { id: 'teams',      label: 'Create Teams channel & tabs',          status: 'pending' },
  { id: 'functions',  label: 'Deploy Azure Functions',               status: 'pending' },
  { id: 'automate',   label: 'Register Power Automate flows',        status: 'pending' },
  { id: 'finalise',   label: 'Finalise configuration & verify',      status: 'pending' },
];

function simulateDeploy(
  setSteps: React.Dispatch<React.SetStateAction<Step[]>>,
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  setPhase: (p: DeployPhase) => void,
) {
  const now = () => new Date().toLocaleTimeString('en-GB');
  const log = (level: LogEntry['level'], message: string) =>
    setLogs((l) => [...l, { timestamp: now(), level, message }]);

  const markStep = (id: string, status: Step['status']) =>
    setSteps((steps) => steps.map((s) => (s.id === id ? { ...s, status } : s)));

  setPhase('running');

  const sequence: Array<[string, string, LogEntry['level'], number]> = [
    ['auth',       'Authenticating with Entra ID via SWA principal…',              'info',    800],
    ['auth',       'Auth token validated. Owner: admin@contoso.onmicrosoft.com',    'success', 500],
    ['sharepoint', 'Creating SharePoint site: FineGuard-Compliance…',              'info',   1200],
    ['sharepoint', 'SharePoint lists provisioned: Deadlines, Clients, Filings',    'success', 400],
    ['teams',      'Creating Teams channel: FineGuard Alerts',                     'info',    900],
    ['teams',      'Teams tabs registered',                                        'success', 300],
    ['functions',  'Deploying Azure Functions to contoso.azurewebsites.net…',      'info',   1500],
    ['functions',  'Functions deployed: DeadlineChecker, AlertDispatcher',         'success', 400],
    ['automate',   'Registering Power Automate flows…',                            'info',   1000],
    ['automate',   'Flows registered: 4 active',                                   'success', 300],
    ['finalise',   'Running verification checks…',                                 'info',    700],
    ['finalise',   'All checks passed. Deployment complete.',                      'success', 200],
  ];

  let idx = 0;
  let elapsed = 0;
  for (const [stepId, msg, level, delay] of sequence) {
    const accumulated = elapsed;
    setTimeout(() => {
      const prevStepId = sequence[idx - 1]?.[0];
      if (prevStepId && prevStepId !== stepId) {
        markStep(prevStepId, 'success');
      }
      markStep(stepId, 'running');
      log(level, msg);
    }, accumulated);
    elapsed += delay;
    idx++;
  }

  setTimeout(() => {
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'success' })));
    setPhase('success');
  }, elapsed + 200);
}

export default function Deploy() {
  const [tenantName,  setTenantName]  = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [spDomain,    setSpDomain]    = useState('');
  const [fnDomain,    setFnDomain]    = useState('');
  const [steps,  setSteps]  = useState<Step[]>(INITIAL_STEPS);
  const [logs,   setLogs]   = useState<LogEntry[]>([]);
  const [phase,  setPhase]  = useState<DeployPhase>('idle');

  const canDeploy = tenantName && tenantEmail && spDomain && fnDomain && phase === 'idle';

  const handleDeploy = () => {
    if (!canDeploy) return;
    setSteps(INITIAL_STEPS);
    setLogs([]);
    simulateDeploy(setSteps, setLogs, setPhase);
  };

  const handleReset = () => {
    setSteps(INITIAL_STEPS);
    setLogs([]);
    setPhase('idle');
  };

  return (
    <AppLayout title="Deploy FineGuard">
      <div className="max-w-3xl space-y-6">
        {phase !== 'idle' && (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <StatusPill status={phase === 'running' ? 'Running' : phase === 'success' ? 'Success' : 'Failed'} />
              <span className="text-sm text-gray-700">
                {phase === 'running' ? 'Deployment in progress…' : phase === 'success' ? 'Deployment succeeded.' : 'Deployment failed.'}
              </span>
            </div>
            {phase !== 'running' && (
              <Button variant="outline" size="sm" onClick={handleReset}>Start New Deployment</Button>
            )}
          </div>
        )}

        <FormSection title="Tenant Details" description="Details of the Microsoft 365 tenant to deploy FineGuard into.">
          <Field label="Tenant name" htmlFor="tenantName" required>
            <Input
              id="tenantName" value={tenantName} onChange={(e) => setTenantName(e.target.value)}
              placeholder="Smithson & Co Accountants" disabled={phase !== 'idle'}
            />
          </Field>
          <Field label="Tenant admin email" htmlFor="tenantEmail" required>
            <Input
              id="tenantEmail" type="email" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)}
              placeholder="admin@contoso.onmicrosoft.com" disabled={phase !== 'idle'}
            />
          </Field>
        </FormSection>

        <FormSection title="Domain Configuration" description="Azure resource endpoints for this tenant.">
          <Field label="SharePoint domain" htmlFor="spDomain" required
            hint="e.g. contoso.sharepoint.com">
            <Input
              id="spDomain" value={spDomain} onChange={(e) => setSpDomain(e.target.value)}
              placeholder="contoso.sharepoint.com" disabled={phase !== 'idle'}
            />
          </Field>
          <Field label="Functions domain" htmlFor="fnDomain" required
            hint="e.g. fineguard-contoso.azurewebsites.net">
            <Input
              id="fnDomain" value={fnDomain} onChange={(e) => setFnDomain(e.target.value)}
              placeholder="fineguard-contoso.azurewebsites.net" disabled={phase !== 'idle'}
            />
          </Field>
        </FormSection>

        <Button size="lg" onClick={handleDeploy} disabled={!canDeploy} className="w-full">
          <Rocket className="h-4 w-4" />
          {phase === 'running' ? 'Deploying…' : 'Deploy FineGuard'}
        </Button>

        {(steps.some((s) => s.status !== 'pending') || logs.length > 0) && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="mb-4 text-sm font-semibold text-gray-900">Deployment Steps</p>
              <StepTimeline steps={steps} />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-gray-900">Live Log</p>
              <LogViewer logs={logs} maxHeight="18rem" />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
