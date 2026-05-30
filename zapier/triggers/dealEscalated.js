'use strict';

const dealEscalated = {
  key: 'deal_escalated',
  noun: 'Escalated Deal',

  display: {
    label: 'Deal Escalated',
    description:
      'Triggers when the VaultLine AI sales agent flags a deal for human review ' +
      '(high value, low confidence, or policy breach).',
  },

  operation: {
    type: 'hook',

    performSubscribe: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/subscribe',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': '{{bundle.authData.apiKey}}' },
      body: { hookUrl: '{{bundle.subscribeData.url}}', event: 'deal_escalated' },
    },

    performUnsubscribe: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/subscribe',
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': '{{bundle.authData.apiKey}}' },
      body: { hookUrl: '{{bundle.subscribeData.url}}', event: 'deal_escalated' },
    },

    perform: (z, bundle) => {
      const data = bundle.cleanedRequest.data || bundle.cleanedRequest;
      return Array.isArray(data) ? data : [data];
    },

    performList: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/sample/deal_escalated',
      method: 'GET',
      headers: { 'X-API-Key': '{{bundle.authData.apiKey}}' },
    },

    sample: {
      email: 'alice@chambers.co.uk',
      reason: 'High-value close £6000 requires human approval',
      agentAction: 'escalate',
      priceMonthly: 6000,
      escalatedAt: new Date().toISOString(),
    },

    outputFields: [
      { key: 'email',        label: 'Lead Email' },
      { key: 'reason',       label: 'Escalation Reason' },
      { key: 'agentAction',  label: 'Agent Action' },
      { key: 'priceMonthly', label: 'Proposed Monthly Price (£)', type: 'integer' },
      { key: 'escalatedAt',  label: 'Escalated At', type: 'datetime' },
    ],
  },
};

module.exports = dealEscalated;
