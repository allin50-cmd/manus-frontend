import { ZObject, Bundle } from 'zapier-platform-core';

const subscribeHook = async (z: ZObject, bundle: Bundle) => {
  const data = {
    url: bundle.targetUrl,
    event: 'compliance.alert',
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

const getRecentAlerts = async (z: ZObject, _bundle: Bundle) => {
  const response = await z.request({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/zapier/alerts/recent`,
  });
  return response.data;
};

export const complianceAlertTrigger = {
  key: 'compliance_alert',
  noun: 'Compliance Alert',

  display: {
    label: 'Compliance Alert Raised',
    description:
      'Triggers when a compliance alert is raised for a monitored company (e.g. overdue accounts filing, confirmation statement, or strike-off risk).',
  },

  operation: {
    type: 'hook' as const,
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: (z: ZObject, bundle: Bundle) => bundle.cleanedRequest?.body ?? [],
    performList: getRecentAlerts,

    sample: {
      id: 'sample-alert-1',
      companyNumber: '12345678',
      companyName: 'Example Ltd',
      alertType: 'accounts_filing',
      status: 'active',
      activatedAt: new Date().toISOString(),
    },
  },
};
