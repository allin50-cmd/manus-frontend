import { useState } from 'react';
import { GitBranch, CheckCircle } from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { FormSection, Field } from '@/components/fineguard/Form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FLOWS = [
  { id: 'deadline-checker',    label: 'Deadline Checker',    desc: 'Runs daily to check for upcoming UK statutory deadlines.' },
  { id: 'alert-dispatcher',    label: 'Alert Dispatcher',    desc: 'Sends Teams notifications for imminent and overdue deadlines.' },
  { id: 'filing-tracker',      label: 'Filing Tracker',      desc: 'Updates filing status when Companies House confirmations arrive.' },
  { id: 'audit-logger',        label: 'Audit Logger',        desc: 'Records every compliance action to the SharePoint audit list.' },
];

export default function SettingsPowerAutomate() {
  const [environment,   setEnvironment]   = useState('');
  const [solutionName,  setSolutionName]  = useState('FineGuard_Flows');
  const [enabledFlows,  setEnabledFlows]  = useState<Record<string, boolean>>(
    Object.fromEntries(FLOWS.map((f) => [f.id, true])),
  );
  const [saved, setSaved] = useState(false);

  const toggleFlow = (id: string) =>
    setEnabledFlows((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppLayout title="Settings – Power Automate">
      <div className="max-w-xl space-y-5">
        <FormSection
          title="Power Platform Environment"
          description="The Power Platform environment where FineGuard flows are registered."
        >
          <Field label="Environment URL" htmlFor="env"
            hint="e.g. https://org12345.crm11.dynamics.com">
            <Input id="env" value={environment} onChange={(e) => setEnvironment(e.target.value)}
              placeholder="https://orgXXXXXX.crm11.dynamics.com" />
          </Field>
          <Field label="Solution name" htmlFor="solutionName" required>
            <Input id="solutionName" value={solutionName} onChange={(e) => setSolutionName(e.target.value)} />
          </Field>
        </FormSection>

        <FormSection title="Managed Flows" description="Enable or disable individual Power Automate flows.">
          <div className="space-y-3">
            {FLOWS.map((flow) => (
              <div key={flow.id} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <GitBranch className="mt-0.5 h-4 w-4 text-brand-gold shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{flow.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{flow.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFlow(flow.id)}
                  className={`mt-0.5 relative h-5 w-9 shrink-0 rounded-full transition-colors ${enabledFlows[flow.id] ? 'bg-brand-gold' : 'bg-gray-200'}`}
                  role="switch"
                  aria-checked={enabledFlows[flow.id]}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabledFlows[flow.id] ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </FormSection>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>{saved ? 'Saved!' : 'Save Changes'}</Button>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle className="h-3.5 w-3.5" /> Settings saved.
            </span>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
