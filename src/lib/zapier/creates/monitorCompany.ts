import { ZObject, Bundle } from 'zapier-platform-core';

const createMonitoredCompany = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/zapier/companies`,
    method: 'POST',
    body: {
      companyNumber: bundle.inputData.companyNumber,
      companyName: bundle.inputData.companyName,
      alertTypes: bundle.inputData.alertTypes,
    },
  });
  return response.data;
};

export const monitorCompanyCreate = {
  key: 'monitor_company',
  noun: 'Monitored Company',

  display: {
    label: 'Add Company to Monitoring',
    description: 'Adds a UK company to FineGuard Pro compliance monitoring.',
  },

  operation: {
    perform: createMonitoredCompany,

    inputFields: [
      {
        key: 'companyNumber',
        label: 'Company Number',
        type: 'string' as const,
        required: true,
        helpText: 'The Companies House registration number (e.g. 12345678).',
      },
      {
        key: 'companyName',
        label: 'Company Name',
        type: 'string' as const,
        required: true,
      },
      {
        key: 'alertTypes',
        label: 'Alert Types',
        type: 'string' as const,
        required: false,
        helpText:
          'Comma-separated alert types to monitor: accounts_filing, confirmation_statement, strike_off',
        default: 'accounts_filing,confirmation_statement,strike_off',
      },
    ],

    sample: {
      id: 'sample-1',
      companyNumber: '12345678',
      companyName: 'Example Ltd',
      activatedAt: new Date().toISOString(),
    },
  },
};
