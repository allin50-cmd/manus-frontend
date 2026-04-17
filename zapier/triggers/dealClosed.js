'use strict';

const dealClosed = {
  key: 'deal_closed',
  noun: 'Closed Deal',

  display: {
    label: 'Deal Closed (Won)',
    description: 'Triggers when the AI sales agent closes a deal within policy limits.',
    important: true,
  },

  operation: {
    type: 'hook',

    performSubscribe: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/subscribe',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': '{{bundle.authData.apiKey}}' },
      body: { hookUrl: '{{bundle.subscribeData.url}}', event: 'deal_closed' },
    },

    performUnsubscribe: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/subscribe',
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': '{{bundle.authData.apiKey}}' },
      body: { hookUrl: '{{bundle.subscribeData.url}}', event: 'deal_closed' },
    },

    perform: (z, bundle) => {
      const data = bundle.cleanedRequest.data || bundle.cleanedRequest;
      return Array.isArray(data) ? data : [data];
    },

    performList: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/sample/deal_closed',
      method: 'GET',
      headers: { 'X-API-Key': '{{bundle.authData.apiKey}}' },
    },

    sample: {
      email: 'alice@chambers.co.uk',
      priceMonthly: 2500,
      closedAt: new Date().toISOString(),
    },

    outputFields: [
      { key: 'email',        label: 'Customer Email' },
      { key: 'priceMonthly', label: 'Monthly Value (£)', type: 'integer' },
      { key: 'closedAt',     label: 'Closed At', type: 'datetime' },
    ],
  },
};

module.exports = dealClosed;
