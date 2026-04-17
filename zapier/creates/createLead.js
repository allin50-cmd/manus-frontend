'use strict';

// Zapier action: create a demo lead in VaultLine from another tool (HubSpot, Typeform, etc.)
const createLead = {
  key: 'create_lead',
  noun: 'Lead',

  display: {
    label: 'Create Demo Lead',
    description: 'Creates a new demo booking lead in VaultLine.',
  },

  operation: {
    inputFields: [
      { key: 'name',    label: 'Full Name',        type: 'string',  required: true },
      { key: 'email',   label: 'Email',             type: 'string',  required: true },
      { key: 'company', label: 'Company / Chambers',type: 'string',  required: false },
      { key: 'product', label: 'Product Interest',  type: 'string',  required: false,
        choices: ['vaultline', 'fineguard', 'ultai'] },
      { key: 'phone',   label: 'Phone',             type: 'string',  required: false },
      { key: 'message', label: 'Additional Notes',  type: 'text',    required: false },
    ],

    perform: (z, bundle) => {
      return z.request({
        url: `${bundle.authData.apiUrl}/api/lead`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': bundle.authData.apiKey,
        },
        body: {
          name: bundle.inputData.name,
          email: bundle.inputData.email,
          company: bundle.inputData.company,
          product: bundle.inputData.product,
          phone: bundle.inputData.phone,
          message: bundle.inputData.message,
        },
      }).then((res) => res.json);
    },

    sample: {
      ok: true,
      leadId: 'LEAD-1776413871087',
      message: "Thank you for your interest! We'll be in touch soon.",
    },

    outputFields: [
      { key: 'ok',      label: 'Success' },
      { key: 'leadId',  label: 'Lead ID' },
      { key: 'message', label: 'Confirmation Message' },
    ],
  },
};

module.exports = createLead;
