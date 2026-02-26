import { useState } from 'react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { FormSection, Field } from '@/components/fineguard/Form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsTeams() {
  const [channelName,  setChannelName]  = useState('FineGuard Alerts');
  const [webhookUrl,   setWebhookUrl]   = useState('');
  const [mentionAll,   setMentionAll]   = useState(false);
  const [saved,        setSaved]        = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppLayout title="Settings – Microsoft Teams">
      <div className="max-w-xl space-y-5">
        <FormSection
          title="Teams Channel Configuration"
          description="Configure how FineGuard posts compliance alerts to Microsoft Teams."
        >
          <Field label="Default channel name" htmlFor="channelName" required>
            <Input id="channelName" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
          </Field>
          <Field label="Incoming webhook URL" htmlFor="webhookUrl"
            hint="Optional. Provide an Incoming Webhook URL to use instead of the Graph API connector.">
            <Input id="webhookUrl" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://contoso.webhook.office.com/…" />
          </Field>
        </FormSection>

        <FormSection title="Notification Preferences">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">@mention all channel members</p>
              <p className="text-xs text-gray-500 mt-0.5">Adds an @channel mention to critical compliance alerts.</p>
            </div>
            <button
              onClick={() => setMentionAll((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${mentionAll ? 'bg-brand-gold' : 'bg-gray-200'}`}
              role="switch"
              aria-checked={mentionAll}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${mentionAll ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </FormSection>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>{saved ? 'Saved!' : 'Save Changes'}</Button>
          {saved && <span className="text-xs text-green-600 font-medium">Settings saved successfully.</span>}
        </div>
      </div>
    </AppLayout>
  );
}
