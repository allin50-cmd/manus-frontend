import { ZObject, Bundle } from 'zapier-platform-core';

const subscribeHook = async (z: ZObject, bundle: Bundle) => {
  const data = {
    url: bundle.targetUrl,
    event: 'company.activated',
  };
  const response = await z.request({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/zapier/hooks`,
    method: 'POST',
    body: data,
  });
  return response.data;
};

const unsubscribeHook = async (z: ZObject, bundle: Bundle) => {
  const hookId = bundle.subscribeData?.id;
  const response = await z.request({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/zapier/hooks/${hookId}`,
    method: 'DELETE',
  });
  return response.data;
};

const getCompany = async (z: ZObject, _bundle: Bundle) => {
  const response = await z.request({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/zapier/companies/recent`,
  });
  return response.data;
};

export const companyActivatedTrigger = {
  key: 'company_activated',
  noun: 'Company',

  display: {
    label: 'Company Activated',
    description: 'Triggers when a company is successfully activated for monitoring.',
  },

  operation: {
    type: 'hook' as const,
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: (z: ZObject, bundle: Bundle) => bundle.cleanedRequest?.body ?? [],
    performList: getCompany,

    sample: {
      id: 'sample-1',
      companyNumber: '12345678',
      companyName: 'Example Ltd',
      activatedAt: new Date().toISOString(),
      stripeSessionId: 'cs_test_sample',
    },
  },
};
