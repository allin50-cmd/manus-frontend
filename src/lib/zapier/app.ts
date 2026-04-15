import { version as platformVersion } from 'zapier-platform-core';

import { companyActivatedTrigger } from './triggers/companyActivated';
import { complianceAlertTrigger } from './triggers/complianceAlert';
import { monitorCompanyCreate } from './creates/monitorCompany';

import packageJson from '../../../package.json';

const App = {
  version: packageJson.version,
  platformVersion,

  authentication: {
    type: 'api_key' as const,
    test: { url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/health` },
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        required: true,
        type: 'string' as const,
        helpText: 'Your FineGuard Pro API key.',
      },
    ],
    connectionLabel: '{{bundle.authData.apiKey}}',
  },

  triggers: {
    [companyActivatedTrigger.key]: companyActivatedTrigger,
    [complianceAlertTrigger.key]: complianceAlertTrigger,
  },

  creates: {
    [monitorCompanyCreate.key]: monitorCompanyCreate,
  },

  searches: {},
};

export default App;
