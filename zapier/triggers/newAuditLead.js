'use strict';

// Fired every time a visitor completes the /audit signup form.
const newAuditLead = {
  key: 'new_audit_lead',
  noun: 'Audit Lead',

  display: {
    label: 'New Audit Lead',
    description:
      'Triggers when a new prospect signs up via the VaultLine free revenue audit form.',
    important: true,
  },

  operation: {
    type: 'hook',

    // Zapier calls this URL to register its webhook
    performSubscribe: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/subscribe',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '{{bundle.authData.apiKey}}',
      },
      body: {
        hookUrl: '{{bundle.subscribeData.url}}',
        event: 'new_audit_lead',
      },
    },

    // Zapier calls this URL to deregister its webhook
    performUnsubscribe: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/subscribe',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '{{bundle.authData.apiKey}}',
      },
      body: {
        hookUrl: '{{bundle.subscribeData.url}}',
        event: 'new_audit_lead',
      },
    },

    // VaultLine POSTs the payload here; just return it
    perform: (z, bundle) => {
      const data = bundle.cleanedRequest.data || bundle.cleanedRequest;
      return Array.isArray(data) ? data : [data];
    },

    // Sample data shown when building a Zap
    performList: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/sample/new_audit_lead',
      method: 'GET',
      headers: { 'X-API-Key': '{{bundle.authData.apiKey}}' },
    },

    sample: {
      id: 'a62fe1f7-225e-4288-b2bc-8853cb9c2f4b',
      tenantId: '3ed1ef2d-2d56-45f1-98ae-1c76548c2beb',
      email: 'sample@chambers.co.uk',
      name: 'Jane Barrister',
      chamberSize: '11-30',
      painPoints: ['Unbilled emails & calls'],
      stage: 'signed_up',
      createdAt: new Date().toISOString(),
    },

    outputFields: [
      { key: 'id',          label: 'Lead ID' },
      { key: 'tenantId',    label: 'Tenant ID' },
      { key: 'email',       label: 'Email' },
      { key: 'name',        label: 'Name' },
      { key: 'chamberSize', label: 'Chamber Size' },
      { key: 'painPoints',  label: 'Pain Points', type: 'string' },
      { key: 'stage',       label: 'Stage' },
      { key: 'createdAt',   label: 'Created At', type: 'datetime' },
    ],
  },
};

module.exports = newAuditLead;
