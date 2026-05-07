export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Allin50 Legal Suite API',
    version: '1.0.0',
    description: 'REST API for the Allin50 Legal Suite — leads, intake, compliance, and Law Clerks chambers management.',
    contact: { name: 'Allin50 Support', url: 'https://allin50.com' },
  },
  servers: [{ url: '/api', description: 'API base' }],
  tags: [
    { name: 'Health', description: 'System health and version' },
    { name: 'Leads', description: 'Sales lead capture' },
    { name: 'Intake', description: 'Client matter intake' },
    { name: 'Contacts', description: 'Support contact submissions' },
    { name: 'Audit', description: 'Free audit signup flow' },
    { name: 'Clerks', description: 'Law Clerks chambers management' },
    { name: 'Admin', description: 'Internal admin endpoints' },
  ],
  paths: {
    // Health
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': { description: 'Healthy', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, database: { type: 'string' } } } } } },
          '503': { description: 'Unhealthy' },
        },
      },
    },
    '/version': {
      get: {
        tags: ['Health'],
        summary: 'API version and uptime',
        responses: { '200': { description: 'Version info' } },
      },
    },
    '/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Public summary counts',
        responses: { '200': { description: 'Counts object' } },
      },
    },
    // Leads
    '/lead': {
      post: {
        tags: ['Leads'],
        summary: 'Submit a sales lead',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'product'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  product: { type: 'string', enum: ['vaultline', 'ultai', 'fineguard', 'law-clerks'] },
                  company: { type: 'string' },
                  phone: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Lead created', content: { 'application/json': { schema: { type: 'object', properties: { leadId: { type: 'string' } } } } } },
          '400': { description: 'Validation error' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/intake': {
      post: {
        tags: ['Intake'],
        summary: 'Submit a client matter intake form',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clientName', 'clientEmail', 'matterType', 'urgency'],
                properties: {
                  clientName: { type: 'string' },
                  clientEmail: { type: 'string', format: 'email' },
                  matterType: { type: 'string' },
                  urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  description: { type: 'string' },
                  solicitorFirm: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Intake created', content: { 'application/json': { schema: { type: 'object', properties: { matterRef: { type: 'string' } } } } } },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/contact': {
      post: {
        tags: ['Contacts'],
        summary: 'Submit a contact/support request',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'message'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, message: { type: 'string' } } } } },
        },
        responses: { '201': { description: 'Contact created' }, '400': { description: 'Validation error' } },
      },
    },
    '/audit-signup': {
      post: {
        tags: ['Audit'],
        summary: 'Sign up for a free compliance audit',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' }, companyName: { type: 'string' }, companyNumber: { type: 'string' } } } } },
        },
        responses: { '201': { description: 'Audit signup created, job enqueued' }, '400': { description: 'Validation error' } },
      },
    },
    '/clerks/stats': {
      get: { tags: ['Clerks'], summary: 'Chambers statistics dashboard', responses: { '200': { description: 'Stats object' } } },
    },
    '/clerks/diary': {
      get: { tags: ['Clerks'], summary: 'Upcoming hearings diary', responses: { '200': { description: 'Array of upcoming hearings' } } },
    },
    '/clerks/barristers': {
      get: { tags: ['Clerks'], summary: 'List all barristers', responses: { '200': { description: 'Array of barristers' } } },
      post: { tags: ['Clerks'], summary: 'Add a barrister', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['fullName'], properties: { fullName: { type: 'string' }, yearOfCall: { type: 'integer' }, status: { type: 'string', enum: ['active', 'inactive', 'door-tenant'] }, email: { type: 'string' } } } } } }, responses: { '201': { description: 'Barrister created' } } },
    },
    '/clerks/barristers/{id}': {
      get: { tags: ['Clerks'], summary: 'Get a barrister by ID', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Barrister object' }, '404': { description: 'Not found' } } },
      put: { tags: ['Clerks'], summary: 'Update a barrister', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated barrister' }, '404': { description: 'Not found' } } },
    },
    '/clerks/barristers/{id}/briefs': {
      get: { tags: ['Clerks'], summary: 'List briefs for a barrister', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Array of briefs' } } },
    },
    '/clerks/briefs': {
      get: { tags: ['Clerks'], summary: 'List all briefs', responses: { '200': { description: 'Array of briefs' } } },
      post: { tags: ['Clerks'], summary: 'Log a new brief', responses: { '201': { description: 'Brief created' } } },
    },
    '/clerks/briefs/{id}': {
      get: { tags: ['Clerks'], summary: 'Get a brief by ID', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Brief object' }, '404': { description: 'Not found' } } },
      put: { tags: ['Clerks'], summary: 'Update a brief', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated brief' }, '404': { description: 'Not found' } } },
    },
    '/clerks/notes': {
      get: { tags: ['Clerks'], summary: 'List clerk notes', parameters: [{ in: 'query', name: 'briefId', schema: { type: 'string' } }, { in: 'query', name: 'barristerId', schema: { type: 'string' } }], responses: { '200': { description: 'Array of notes' } } },
      post: { tags: ['Clerks'], summary: 'Add a clerk note', responses: { '201': { description: 'Note created' } } },
    },
    '/admin/leads': {
      get: { tags: ['Admin'], summary: 'List leads (paginated)', parameters: [{ in: 'query', name: 'page', schema: { type: 'integer', default: 1 } }, { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } }], responses: { '200': { description: 'Paginated leads' } } },
    },
    '/admin/intake-forms': {
      get: { tags: ['Admin'], summary: 'List intake forms (paginated)', responses: { '200': { description: 'Paginated intake forms' } } },
    },
    '/admin/contacts': {
      get: { tags: ['Admin'], summary: 'List contacts (paginated)', responses: { '200': { description: 'Paginated contacts' } } },
    },
    '/admin/audit-leads': {
      get: { tags: ['Admin'], summary: 'List all audit leads', responses: { '200': { description: 'Array of audit leads' } } },
    },
    '/admin/compliance-bundles': {
      get: { tags: ['Admin'], summary: 'List all compliance bundle requests', responses: { '200': { description: 'Array of compliance bundles' } } },
    },
  },
  components: {
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' }, errors: { type: 'array', items: { type: 'string' } } } },
    },
  },
};
