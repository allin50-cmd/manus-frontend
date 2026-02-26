import { useState } from 'react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { FormSection, Field } from '@/components/fineguard/Form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsDomains() {
  const [spDomain,   setSpDomain]   = useState('contoso.sharepoint.com');
  const [fnDomain,   setFnDomain]   = useState('fineguard-contoso.azurewebsites.net');
  const [tenantId,   setTenantId]   = useState('');
  const [saved,      setSaved]      = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppLayout title="Settings – Domains">
      <div className="max-w-xl space-y-5">
        <FormSection
          title="SharePoint & Functions Domains"
          description="Default domain values used when starting a new deployment."
        >
          <Field label="SharePoint domain" htmlFor="spDomain" required hint="e.g. contoso.sharepoint.com">
            <Input id="spDomain" value={spDomain} onChange={(e) => setSpDomain(e.target.value)} />
          </Field>
          <Field label="Azure Functions domain" htmlFor="fnDomain" required hint="e.g. fineguard-contoso.azurewebsites.net">
            <Input id="fnDomain" value={fnDomain} onChange={(e) => setFnDomain(e.target.value)} />
          </Field>
        </FormSection>

        <FormSection
          title="Entra ID Tenant"
          description="The Entra ID tenant ID used for authentication."
        >
          <Field label="Tenant ID (GUID)" htmlFor="tenantId" hint="Leave blank to use the authenticated user's tenant">
            <Input id="tenantId" value={tenantId} onChange={(e) => setTenantId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </Field>
        </FormSection>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>{saved ? 'Saved!' : 'Save Changes'}</Button>
          {saved && <span className="text-xs text-green-600 font-medium">Settings saved successfully.</span>}
        </div>
      </div>
    </AppLayout>
  );
}
