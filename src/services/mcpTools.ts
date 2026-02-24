/**
 * MCP Tools Registry and Executor
 * Defines all available tools and handles their execution
 */
import type { MCPTool, MCPToolExecution } from '@/types/mcp';
import { generateId, sleep } from '@/lib/utils';

// ─── Tool Definitions ──────────────────────────────────────────────────────────

export const MCP_TOOLS: MCPTool[] = [
  {
    name: 'get_company_profile',
    description: 'Retrieve a full company profile from Companies House including directors, filings, and compliance status.',
    category: 'compliance',
    icon: 'building',
    requiresNetwork: true,
    avgDurationMs: 800,
    rateLimit: 120,
    inputSchema: {
      type: 'object',
      properties: {
        company_number: {
          type: 'string',
          description: 'Companies House registration number (e.g. 12345678)',
          pattern: '^[A-Z0-9]{8}$',
        },
        include_officers: { type: 'boolean', description: 'Include officer/director list', default: true },
        include_filings:  { type: 'boolean', description: 'Include recent filing history', default: false },
      },
      required: ['company_number'],
    },
    examples: [
      {
        description: 'Look up Acme Ltd',
        input: { company_number: '12345678', include_officers: true },
        output: { name: 'ACME LTD', status: 'active', riskLevel: 'low' },
      },
    ],
  },
  {
    name: 'check_compliance_status',
    description: 'Check filing deadlines, overdue submissions, and estimated penalties for a UK company.',
    category: 'compliance',
    icon: 'shield-check',
    requiresNetwork: true,
    avgDurationMs: 600,
    rateLimit: 60,
    inputSchema: {
      type: 'object',
      properties: {
        company_number: { type: 'string', description: 'Companies House number' },
        check_accounts:       { type: 'boolean', default: true },
        check_confirmation:   { type: 'boolean', default: true },
        check_psc:            { type: 'boolean', default: false },
      },
      required: ['company_number'],
    },
  },
  {
    name: 'search_knowledge_base',
    description: 'Semantic search across the compliance and legal knowledge base. Returns relevant articles with confidence scores.',
    category: 'search',
    icon: 'book-open',
    requiresNetwork: false,
    avgDurationMs: 400,
    rateLimit: 300,
    inputSchema: {
      type: 'object',
      properties: {
        query:      { type: 'string', description: 'Natural language search query', minLength: 3 },
        top_k:      { type: 'integer', description: 'Number of results to return', default: 5, minimum: 1, maximum: 20 },
        categories: {
          type: 'array',
          items: { type: 'string', enum: ['tax', 'corporate', 'employment', 'property', 'general'] },
          description: 'Filter by article categories',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'analyze_document',
    description: 'AI-powered document analysis: extract entities, identify risk clauses, summarize content.',
    category: 'document',
    icon: 'file-text',
    requiresNetwork: false,
    isMutating: false,
    avgDurationMs: 2000,
    rateLimit: 30,
    inputSchema: {
      type: 'object',
      properties: {
        document_text: { type: 'string', description: 'Full document text to analyze' },
        extract_entities: { type: 'boolean', default: true, description: 'Extract named entities (persons, companies, dates)' },
        identify_risks:   { type: 'boolean', default: true, description: 'Flag high-risk clauses' },
        summarize:        { type: 'boolean', default: true, description: 'Generate executive summary' },
        language:         { type: 'string', default: 'en', enum: ['en', 'fr', 'de', 'es'] },
      },
      required: ['document_text'],
    },
  },
  {
    name: 'classify_risk',
    description: 'Classify a client or matter risk level using AI scoring across multiple risk dimensions.',
    category: 'ai_analysis',
    icon: 'alert-triangle',
    requiresNetwork: false,
    avgDurationMs: 1200,
    rateLimit: 100,
    inputSchema: {
      type: 'object',
      properties: {
        entity_name:     { type: 'string', description: 'Client or company name' },
        entity_type:     { type: 'string', enum: ['individual', 'company', 'matter'], description: 'Type of entity to assess' },
        jurisdiction:    { type: 'string', description: 'Relevant jurisdiction (e.g. UK, EU, US)', default: 'UK' },
        context:         { type: 'string', description: 'Additional context or description' },
        dimensions:      {
          type: 'array',
          items: { type: 'string', enum: ['financial', 'legal', 'reputational', 'regulatory', 'operational'] },
          description: 'Risk dimensions to assess',
        },
      },
      required: ['entity_name', 'entity_type'],
    },
  },
  {
    name: 'create_intake_matter',
    description: 'Create a new client matter intake record with AI-extracted urgency scoring.',
    category: 'integration',
    icon: 'clipboard-plus',
    requiresNetwork: true,
    isMutating: true,
    avgDurationMs: 500,
    rateLimit: 60,
    inputSchema: {
      type: 'object',
      properties: {
        client_name:   { type: 'string', description: 'Full name of the client' },
        client_email:  { type: 'string', format: 'email', description: 'Client email address' },
        matter_type:   { type: 'string', enum: ['litigation', 'conveyancing', 'corporate', 'employment', 'family', 'other'] },
        description:   { type: 'string', description: 'Matter description / client instructions' },
        claim_value:   { type: 'number', description: 'Estimated claim/transaction value in GBP' },
        auto_urgency:  { type: 'boolean', default: true, description: 'Auto-calculate urgency from description' },
      },
      required: ['client_name', 'matter_type', 'description'],
    },
  },
  {
    name: 'send_notification',
    description: 'Send a notification to a user or team via email, in-app, or webhook.',
    category: 'notifications',
    icon: 'bell',
    requiresNetwork: true,
    isMutating: true,
    avgDurationMs: 300,
    rateLimit: 120,
    inputSchema: {
      type: 'object',
      properties: {
        recipient: { type: 'string', description: 'Email or user ID' },
        channel:   { type: 'string', enum: ['email', 'in_app', 'webhook', 'sms'], description: 'Delivery channel' },
        subject:   { type: 'string', description: 'Notification subject' },
        body:      { type: 'string', description: 'Notification body (markdown supported)' },
        priority:  { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
        templateId:{ type: 'string', description: 'Use a pre-configured notification template' },
      },
      required: ['recipient', 'channel', 'subject', 'body'],
    },
  },
  {
    name: 'write_audit_event',
    description: 'Write an immutable audit event to the VaultLine audit log. Events cannot be modified after writing.',
    category: 'audit',
    icon: 'lock',
    requiresNetwork: true,
    isMutating: true,
    avgDurationMs: 200,
    rateLimit: 500,
    inputSchema: {
      type: 'object',
      properties: {
        event_type: { type: 'string', description: 'Audit event type (e.g. data.export)' },
        severity:   { type: 'string', enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info' },
        action:     { type: 'string', description: 'Human-readable description of the action' },
        resource:   { type: 'string', description: 'Resource affected (e.g. "client:12345")' },
        metadata:   { type: 'object', description: 'Additional structured data to include' },
      },
      required: ['event_type', 'action'],
    },
  },
  {
    name: 'query_database',
    description: 'Execute a read-only query against the VaultLine database. Returns structured results.',
    category: 'data_retrieval',
    icon: 'database',
    requiresNetwork: false,
    avgDurationMs: 150,
    rateLimit: 200,
    inputSchema: {
      type: 'object',
      properties: {
        entity:  { type: 'string', enum: ['leads', 'intake_forms', 'compliance_bundles', 'contacts', 'deployments'], description: 'Entity to query' },
        filters: { type: 'object', description: 'Key-value filter conditions' },
        limit:   { type: 'integer', default: 20, minimum: 1, maximum: 100 },
        orderBy: { type: 'string', description: 'Field to sort by' },
        order:   { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      },
      required: ['entity'],
    },
  },
  {
    name: 'generate_report',
    description: 'Generate a compliance or analytics report in PDF, CSV, or JSON format.',
    category: 'document',
    icon: 'file-chart',
    requiresNetwork: false,
    isMutating: false,
    avgDurationMs: 3000,
    rateLimit: 20,
    inputSchema: {
      type: 'object',
      properties: {
        report_type: {
          type: 'string',
          enum: ['compliance_summary', 'risk_dashboard', 'audit_trail', 'intake_stats', 'deployment_history'],
          description: 'Type of report to generate',
        },
        format:      { type: 'string', enum: ['pdf', 'csv', 'json', 'xlsx'], default: 'pdf' },
        date_from:   { type: 'string', format: 'date', description: 'Start date (ISO 8601)' },
        date_to:     { type: 'string', format: 'date', description: 'End date (ISO 8601)' },
        filters:     { type: 'object', description: 'Additional filters' },
      },
      required: ['report_type'],
    },
  },
];

// ─── Tool Registry ─────────────────────────────────────────────────────────────

export const toolRegistry = new Map<string, MCPTool>(
  MCP_TOOLS.map((t) => [t.name, t])
);

export function getTool(name: string): MCPTool | undefined {
  return toolRegistry.get(name);
}

export function getToolsByCategory(category: MCPTool['category']): MCPTool[] {
  return MCP_TOOLS.filter((t) => t.category === category);
}

// ─── Mock Executor ────────────────────────────────────────────────────────────

/**
 * Simulates MCP tool execution with realistic mock responses.
 * In production, this dispatches to the actual backend/AI model.
 */
export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<MCPToolExecution> {
  const tool = getTool(toolName);
  if (!tool) throw new Error(`Unknown tool: ${toolName}`);

  const execution: MCPToolExecution = {
    id: generateId('exec'),
    toolName,
    input,
    startedAt: new Date().toISOString(),
    status: 'running',
  };

  const duration = tool.avgDurationMs ?? 500;
  await sleep(duration + Math.random() * 300);

  const output = getMockOutput(toolName, input);

  return {
    ...execution,
    output,
    status: 'success',
    completedAt: new Date().toISOString(),
    durationMs: duration,
  };
}

// ─── Mock Output Generators ────────────────────────────────────────────────────

function getMockOutput(toolName: string, input: Record<string, unknown>): unknown {
  switch (toolName) {
    case 'get_company_profile':
      return {
        companyNumber: input.company_number,
        name: 'ACME TECHNOLOGIES LTD',
        status: 'active',
        incorporatedAt: '2018-03-15',
        type: 'ltd',
        sicCodes: ['62012'],
        riskLevel: 'low',
        officers: [
          { name: 'Jane Smith', role: 'Director', appointedOn: '2018-03-15' },
          { name: 'John Doe', role: 'Secretary', appointedOn: '2019-06-01' },
        ],
        address: { line1: '10 Tech Street', city: 'London', postcode: 'EC1A 1BB' },
      };

    case 'check_compliance_status':
      return {
        companyNumber: input.company_number,
        overallStatus: 'warning',
        riskScore: 42,
        accounts: { dueDate: '2024-12-31', daysUntilDue: 45, overdue: false },
        confirmationStatement: { dueDate: '2024-11-30', daysUntilDue: 15, overdue: false },
        overdueFilings: [],
        estimatedPenalties: [],
        recommendations: [
          'File annual accounts before December 31st to avoid penalties.',
          'Consider updating SIC codes to reflect current business activities.',
        ],
      };

    case 'search_knowledge_base':
      return {
        query: input.query,
        results: [
          { id: 'kb001', title: 'Late Filing Penalties — Annual Accounts', excerpt: 'Companies House levies automatic late filing penalties...', score: 0.94, category: 'corporate', updatedAt: '2024-01-15' },
          { id: 'kb002', title: 'Confirmation Statement Requirements', excerpt: 'Every company must file a confirmation statement once per year...', score: 0.87, category: 'corporate', updatedAt: '2024-02-01' },
          { id: 'kb003', title: 'HMRC Corporation Tax Deadlines', excerpt: 'Corporation tax returns must be filed within 12 months...', score: 0.81, category: 'tax', updatedAt: '2024-01-10' },
        ].slice(0, Number(input.top_k ?? 3)),
        totalMatches: 47,
        searchTimeMs: 38,
      };

    case 'analyze_document':
      return {
        summary: 'This appears to be a standard commercial lease agreement for office premises. Key terms include a 5-year term with a break clause at year 3, rent reviews every 2 years, and standard FRI obligations.',
        entities: [
          { type: 'person', value: 'James Harrison', context: 'Landlord representative' },
          { type: 'company', value: 'Nexus Properties Ltd', context: 'Landlord' },
          { type: 'date', value: '2024-06-01', context: 'Lease commencement' },
          { type: 'currency', value: '£85,000 per annum', context: 'Annual rent' },
        ],
        riskClauses: [
          { text: 'The Tenant shall be responsible for all structural repairs...', severity: 'high', explanation: 'Unusual FRI obligation extending to structural repairs' },
          { text: 'Rent review shall be upward only...', severity: 'medium', explanation: 'Upward-only rent review clause limits negotiating position' },
        ],
        sentiment: 'neutral',
        readabilityScore: 62,
        wordCount: 4200,
      };

    case 'classify_risk':
      return {
        entity: input.entity_name,
        overallRisk: 'medium',
        riskScore: 58,
        dimensions: {
          financial:    { score: 65, level: 'medium', factors: ['Revenue concentration', 'Leverage ratio'] },
          legal:        { score: 30, level: 'low', factors: ['No pending litigation'] },
          reputational: { score: 45, level: 'low', factors: ['Positive press coverage'] },
          regulatory:   { score: 70, level: 'high', factors: ['FCA regulated activities', 'Pending audit'] },
          operational:  { score: 40, level: 'low', factors: ['Stable operations', 'ISO 27001 certified'] },
        },
        recommendations: [
          'Obtain recent financial statements before proceeding.',
          'Review FCA correspondence for any outstanding matters.',
        ],
      };

    case 'create_intake_matter':
      return {
        matterRef: `MAT-${Date.now().toString().slice(-8)}`,
        status: 'created',
        urgency: 'medium',
        aiUrgencyScore: 0.62,
        assignedTo: null,
        estimatedResponseHours: 48,
      };

    case 'send_notification':
      return { sent: true, messageId: `msg-${generateId()}`, channel: input.channel, deliveredAt: new Date().toISOString() };

    case 'write_audit_event':
      return { eventId: generateId('evt'), vaultRef: `VL-${Date.now()}`, immutableAt: new Date().toISOString() };

    case 'query_database':
      return {
        entity: input.entity,
        rows: [
          { id: '1', name: 'Sample Record 1', createdAt: new Date().toISOString() },
          { id: '2', name: 'Sample Record 2', createdAt: new Date().toISOString() },
        ],
        total: 2,
        page: 1,
      };

    case 'generate_report':
      return {
        reportId: generateId('rpt'),
        type: input.report_type,
        format: input.format,
        status: 'generated',
        downloadUrl: '#',
        generatedAt: new Date().toISOString(),
        sizeKb: 284,
      };

    default:
      return { status: 'ok', toolName, input };
  }
}
