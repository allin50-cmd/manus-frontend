'use strict';

const findLeadByEmail = {
  key: 'find_lead_by_email',
  noun: 'Lead',

  display: {
    label: 'Find Lead by Email',
    description: 'Searches VaultLine for an existing demo lead by email address.',
  },

  operation: {
    inputFields: [
      { key: 'email', label: 'Email Address', type: 'string', required: true },
    ],

    perform: (z, bundle) => {
      return z.request({
        url: `${bundle.authData.apiUrl}/api/admin/leads`,
        method: 'GET',
        headers: { 'X-API-Key': bundle.authData.apiKey },
      }).then((res) => {
        const all = res.json;
        if (!Array.isArray(all)) return [];
        return all.filter(
          (lead) => lead.email.toLowerCase() === bundle.inputData.email.toLowerCase()
        );
      });
    },

    sample: {
      id: '8856a199-f568-4d03-ac36-cab598c78a41',
      leadId: 'LEAD-1776413871087',
      name: 'Alice Smith',
      email: 'alice@chambers.co.uk',
      company: 'Gray Inn',
      product: 'vaultline',
      createdAt: new Date().toISOString(),
    },

    outputFields: [
      { key: 'leadId',    label: 'Lead ID' },
      { key: 'name',      label: 'Full Name' },
      { key: 'email',     label: 'Email' },
      { key: 'company',   label: 'Company' },
      { key: 'product',   label: 'Product Interest' },
      { key: 'createdAt', label: 'Created At', type: 'datetime' },
    ],
  },
};

module.exports = findLeadByEmail;
