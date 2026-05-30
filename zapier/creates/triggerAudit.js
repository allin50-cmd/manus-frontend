'use strict';

// Zapier action: enrol an email address into the VaultLine audit funnel
const triggerAudit = {
  key: 'trigger_audit',
  noun: 'Audit',

  display: {
    label: 'Trigger Revenue Audit',
    description:
      'Enrols an email address in the VaultLine AI revenue audit funnel ' +
      '— sends the audit-ready email and runs the sales agent.',
  },

  operation: {
    inputFields: [
      { key: 'email',       label: 'Email',         type: 'string', required: true },
      { key: 'name',        label: 'Name',          type: 'string', required: false },
      { key: 'chamberSize', label: 'Chamber Size',  type: 'string', required: false,
        choices: ['1-10', '11-30', '31-60', '60+'] },
      { key: 'painPoints',  label: 'Pain Points',   type: 'string', required: false,
        helpText: 'Comma-separated list, e.g. "Unbilled emails, Prep time not captured"' },
    ],

    perform: (z, bundle) => {
      const painPoints = bundle.inputData.painPoints
        ? bundle.inputData.painPoints.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

      return z.request({
        url: `${bundle.authData.apiUrl}/api/audit-signup`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': bundle.authData.apiKey,
        },
        body: {
          email: bundle.inputData.email,
          name: bundle.inputData.name,
          chamberSize: bundle.inputData.chamberSize,
          painPoints,
        },
      }).then((res) => res.json);
    },

    sample: {
      ok: true,
      tenantId: '3ed1ef2d-2d56-45f1-98ae-1c76548c2beb',
    },

    outputFields: [
      { key: 'ok',       label: 'Success' },
      { key: 'tenantId', label: 'Tenant ID' },
    ],
  },
};

module.exports = triggerAudit;
