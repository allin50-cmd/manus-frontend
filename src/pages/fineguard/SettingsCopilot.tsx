import { useState } from 'react';
import { Bot } from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { FormSection, Field } from '@/components/fineguard/Form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsCopilot() {
  const [enabled,   setEnabled]  = useState(false);
  const [endpoint,  setEndpoint] = useState('');
  const [apiKey,    setApiKey]   = useState('');
  const [saved,     setSaved]    = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppLayout title="Settings – Copilot Integration">
      <div className="max-w-xl space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-surface text-brand-gold">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Microsoft Copilot Integration</p>
              <p className="text-xs text-gray-500 mt-0.5">Enable AI-powered compliance insights for your tenants.</p>
            </div>
          </div>
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-brand-gold' : 'bg-gray-200'}`}
            aria-checked={enabled}
            role="switch"
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>

        {enabled && (
          <FormSection title="Copilot Configuration" description="Azure OpenAI endpoint details for Copilot features.">
            <Field label="Azure OpenAI endpoint" htmlFor="endpoint" required
              hint="e.g. https://my-openai.openai.azure.com/">
              <Input id="endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://my-openai.openai.azure.com/" />
            </Field>
            <Field label="API key" htmlFor="apiKey" required>
              <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••••••" />
            </Field>
          </FormSection>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>{saved ? 'Saved!' : 'Save Changes'}</Button>
          {saved && <span className="text-xs text-green-600 font-medium">Settings saved successfully.</span>}
        </div>
      </div>
    </AppLayout>
  );
}
