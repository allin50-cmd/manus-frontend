'use strict';

const newDemoLead = {
  key: 'new_lead',
  noun: 'Demo Lead',

  display: {
    label: 'New Demo Lead',
    description: 'Triggers when someone books a demo on any VaultLine product page.',
    important: true,
  },

  operation: {
    type: 'hook',

    performSubscribe: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/subscribe',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': '{{bundle.authData.apiKey}}' },
      body: { hookUrl: '{{bundle.subscribeData.url}}', event: 'new_lead' },
    },

    performUnsubscribe: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/subscribe',
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': '{{bundle.authData.apiKey}}' },
      body: { hookUrl: '{{bundle.subscribeData.url}}', event: 'new_lead' },
    },

    perform: (z, bundle) => {
      const data = bundle.cleanedRequest.data || bundle.cleanedRequest;
      return Array.isArray(data) ? data : [data];
    },

    performList: {
      url: '{{bundle.authData.apiUrl}}/api/zapier/sample/new_lead',
      method: 'GET',
      headers: { 'X-API-Key': '{{bundle.authData.apiKey}}' },
    },

    sample: {
      id: '8856a199-f568-4d03-ac36-cab598c78a41',
      leadId: 'LEAD-1776413871087',
      name: 'Alice Smith',
      email: 'alice@chambers.co.uk',
      company: 'Gray Inn',
      product: 'vaultline',
      phone: '+44 7700 000001',
      createdAt: new Date().toISOString(),
    },

    outputFields: [
      { key: 'leadId',   label: 'Lead ID' },
      { key: 'name',     label: 'Full Name' },
      { key: 'email',    label: 'Email' },
      { key: 'company',  label: 'Company' },
      { key: 'product',  label: 'Product Interest' },
      { key: 'phone',    label: 'Phone' },
      { key: 'createdAt',label: 'Created At', type: 'datetime' },
    ],
  },
};

module.exports = newDemoLead;
