'use strict';

const { version } = require('zapier-platform-core');

const authentication   = require('./authentication');
const newAuditLead     = require('./triggers/newAuditLead');
const newDemoLead      = require('./triggers/newDemoLead');
const dealEscalated    = require('./triggers/dealEscalated');
const dealClosed       = require('./triggers/dealClosed');
const createLead       = require('./creates/createLead');
const triggerAudit     = require('./creates/triggerAudit');
const findLeadByEmail  = require('./searches/findLeadByEmail');

const App = {
  version: '1.0.0',
  platformVersion: version,

  authentication,

  beforeRequest: [
    // Inject API key on every request
    (request, z, bundle) => {
      request.headers['X-API-Key'] = bundle.authData.apiKey;
      return request;
    },
  ],

  triggers: {
    [newAuditLead.key]:  newAuditLead,
    [newDemoLead.key]:   newDemoLead,
    [dealEscalated.key]: dealEscalated,
    [dealClosed.key]:    dealClosed,
  },

  creates: {
    [createLead.key]:    createLead,
    [triggerAudit.key]:  triggerAudit,
  },

  searches: {
    [findLeadByEmail.key]: findLeadByEmail,
  },

  // Search-or-create pair: find lead by email, or create if not found
  searchOrCreates: {
    find_or_create_lead: {
      key:    'find_or_create_lead',
      display: {
        label:       'Find or Create Lead',
        description: 'Finds a lead by email, creating one if it does not exist.',
      },
      search: findLeadByEmail.key,
      create: createLead.key,
    },
  },
};

module.exports = App;
