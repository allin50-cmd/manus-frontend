'use strict';

// API Key authentication — users paste their VaultLine ZAPIER_API_KEY
const authentication = {
  type: 'custom',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      helpText: 'Found in your VaultLine Admin → Settings → Zapier Integration.',
      required: true,
      type: 'string',
    },
    {
      key: 'apiUrl',
      label: 'API Base URL',
      helpText: 'Your VaultLine instance URL (e.g. https://api-aios.uksouth.azurecontainerapps.io)',
      required: true,
      type: 'string',
      default: 'https://api-aios.uksouth.azurecontainerapps.io',
    },
  ],
  test: {
    url: '{{bundle.authData.apiUrl}}/api/health',
    method: 'GET',
    headers: { 'X-API-Key': '{{bundle.authData.apiKey}}' },
  },
  connectionLabel: '{{bundle.authData.apiUrl}}',
};

module.exports = authentication;
