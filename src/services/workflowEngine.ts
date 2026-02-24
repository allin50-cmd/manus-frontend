/**
 * Workflow Engine
 * Executes typed workflow definitions step-by-step
 */
import type {
  WorkflowDefinition,
  WorkflowRun,
  WorkflowStep,
  StepResult,
  WorkflowTemplate,
  WorkflowCategory,
} from '@/types/workflows';
import { generateId, sleep } from '@/lib/utils';
import { executeTool } from './mcpTools';
import { bufferEvent } from './auditBuffer';

// ─── Workflow Templates ────────────────────────────────────────────────────────

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl-compliance-check',
    name: 'Company Compliance Check',
    description: 'Automated end-to-end compliance verification for a UK company. Checks filings, calculates penalties, and sends alerts.',
    category: 'compliance',
    icon: 'shield',
    color: '#C9A64A',
    difficulty: 'beginner',
    estimatedSetupMins: 5,
    steps: [
      { id: 's1', name: 'Receive Company Number', category: 'trigger', description: 'Start from a form submission or API call', params: [{ key: 'company_number', label: 'Company Number', type: 'company_number', required: true }] },
      { id: 's2', name: 'Fetch Company Profile', category: 'action', description: 'Retrieve live data from Companies House', params: [], nextSteps: ['s3'] },
      { id: 's3', name: 'Check Compliance Status', category: 'action', description: 'Analyse filings and deadlines', params: [], nextSteps: ['s4'] },
      { id: 's4', name: 'Assess Risk Level', category: 'ai', description: 'AI-powered risk classification', params: [], nextSteps: ['s5'] },
      { id: 's5', name: 'Risk Level ≥ High?', category: 'condition', description: 'Branch based on risk score', params: [], conditionKey: 'riskHigh', nextSteps: ['s6', 's7'] },
      { id: 's6', name: 'Send Urgent Alert', category: 'notification', description: 'Notify the responsible officer', params: [{ key: 'recipient', label: 'Recipient Email', type: 'email', required: true }] },
      { id: 's7', name: 'Write Audit Event', category: 'action', description: 'Record compliance check in VaultLine', params: [] },
    ],
  },
  {
    id: 'tpl-client-intake',
    name: 'Intelligent Client Intake',
    description: 'AI-assisted client matter intake with automatic urgency scoring, conflict checking, and case assignment.',
    category: 'intake',
    icon: 'clipboard',
    color: '#06b6d4',
    difficulty: 'intermediate',
    estimatedSetupMins: 10,
    steps: [
      { id: 's1', name: 'Receive Intake Form', category: 'trigger', description: 'New client matter submission', params: [{ key: 'client_name', label: 'Client Name', type: 'string', required: true }, { key: 'matter_type', label: 'Matter Type', type: 'select', required: true, options: [{ value: 'litigation', label: 'Litigation' }, { value: 'conveyancing', label: 'Conveyancing' }] }] },
      { id: 's2', name: 'Classify Risk & Urgency', category: 'ai', description: 'AI scores urgency and risk from client instructions', params: [], nextSteps: ['s3'] },
      { id: 's3', name: 'Search Knowledge Base', category: 'action', description: 'Find relevant precedents and guidance', params: [], nextSteps: ['s4'] },
      { id: 's4', name: 'Create Matter Record', category: 'action', description: 'Persist to database with ref number', params: [], nextSteps: ['s5'] },
      { id: 's5', name: 'Send Confirmation', category: 'notification', description: 'Email client with matter reference', params: [] },
    ],
  },
  {
    id: 'tpl-audit-pipeline',
    name: 'Continuous Audit Pipeline',
    description: 'Schedule periodic audit event collection, buffer flushing, and immutable VaultLine writes.',
    category: 'audit',
    icon: 'lock',
    color: '#5A4BFF',
    difficulty: 'intermediate',
    estimatedSetupMins: 8,
    steps: [
      { id: 's1', name: 'Scheduled Trigger', category: 'trigger', description: 'Run every hour', params: [{ key: 'cron', label: 'Cron Expression', type: 'string', defaultValue: '0 * * * *' }] },
      { id: 's2', name: 'Collect Buffered Events', category: 'data', description: 'Load events from local audit buffer', params: [], nextSteps: ['s3'] },
      { id: 's3', name: 'Events > 0?', category: 'condition', description: 'Only proceed if there are events to flush', params: [], conditionKey: 'hasEvents', nextSteps: ['s4', 's7'] },
      { id: 's4', name: 'Validate Events', category: 'action', description: 'Schema validation and deduplication', params: [], nextSteps: ['s5'] },
      { id: 's5', name: 'Write to VaultLine', category: 'action', description: 'WORM write — immutable storage', params: [], nextSteps: ['s6'] },
      { id: 's6', name: 'Generate Audit Report', category: 'output', description: 'Generate PDF summary', params: [] },
      { id: 's7', name: 'Log: Nothing to flush', category: 'action', description: 'Record no-op', params: [] },
    ],
  },
  {
    id: 'tpl-ai-analysis',
    name: 'Bulk Document Analysis',
    description: 'Process multiple documents through AI analysis pipeline: extract entities, identify risk, and generate summaries.',
    category: 'ai_analysis',
    icon: 'brain',
    color: '#a855f7',
    difficulty: 'advanced',
    estimatedSetupMins: 15,
    steps: [
      { id: 's1', name: 'File Upload Trigger', category: 'trigger', description: 'Triggered when documents are uploaded', params: [{ key: 'file', label: 'Document File', type: 'file', required: true }] },
      { id: 's2', name: 'Extract Text', category: 'data', description: 'OCR / text extraction from PDF or DOCX', params: [], nextSteps: ['s3'] },
      { id: 's3', name: 'Analyze Document', category: 'ai', description: 'AI entity extraction and risk analysis', params: [], nextSteps: ['s4'] },
      { id: 's4', name: 'Classify Risk', category: 'ai', description: 'Overall risk scoring', params: [], nextSteps: ['s5'] },
      { id: 's5', name: 'High Risk?', category: 'condition', description: 'Route high-risk documents for review', params: [], conditionKey: 'highRisk', nextSteps: ['s6', 's7'] },
      { id: 's6', name: 'Flag for Review', category: 'approval', description: 'Send to senior reviewer queue', params: [] },
      { id: 's7', name: 'Auto-file Document', category: 'action', description: 'Categorize and store document', params: [] },
    ],
  },
  {
    id: 'tpl-risk-alert',
    name: 'Risk Monitoring & Alerts',
    description: 'Continuously monitor clients for risk changes and send automated alerts when thresholds are breached.',
    category: 'risk_assessment',
    icon: 'alert-triangle',
    color: '#ef4444',
    difficulty: 'intermediate',
    estimatedSetupMins: 12,
    steps: [
      { id: 's1', name: 'Hourly Schedule', category: 'trigger', description: 'Runs every hour', params: [] },
      { id: 's2', name: 'Load Active Clients', category: 'data', description: 'Fetch clients with monitoring enabled', params: [], nextSteps: ['s3'] },
      { id: 's3', name: 'Re-assess Risk Scores', category: 'ai', description: 'AI risk classification for each client', params: [], nextSteps: ['s4'] },
      { id: 's4', name: 'Compare to Baseline', category: 'action', description: 'Detect risk score changes', params: [], nextSteps: ['s5'] },
      { id: 's5', name: 'Score Changed?', category: 'condition', description: 'Only alert on significant changes', params: [], conditionKey: 'scoreChanged', nextSteps: ['s6', 's7'] },
      { id: 's6', name: 'Send Risk Alert', category: 'notification', description: 'Alert client manager immediately', params: [] },
      { id: 's7', name: 'Update Baseline', category: 'data', description: 'Store new baseline scores', params: [] },
    ],
  },
];

// ─── Sample Running Workflows ──────────────────────────────────────────────────

export const SAMPLE_WORKFLOWS: WorkflowDefinition[] = WORKFLOW_TEMPLATES.map((tpl, i) => ({
  id: generateId('wf'),
  name: tpl.name,
  description: tpl.description,
  category: tpl.category,
  version: '1.0.0',
  status: i === 0 ? 'active' : i === 1 ? 'active' : i === 2 ? 'paused' : 'draft',
  trigger: i === 0 ? 'api' : i === 2 ? 'scheduled' : 'manual',
  steps: tpl.steps as WorkflowStep[],
  entryStep: 's1',
  tags: [tpl.category],
  createdBy: 'admin@vaultline.io',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 1)).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * i).toISOString(),
  lastRunAt: i < 3 ? new Date(Date.now() - 1000 * 60 * 30).toISOString() : undefined,
  runCount: [42, 18, 156, 3, 7][i] ?? 0,
  successCount: [40, 17, 148, 3, 6][i] ?? 0,
  failCount: [2, 1, 8, 0, 1][i] ?? 0,
  avgDurationMs: [1200, 800, 450, 3200, 950][i] ?? 0,
}));

// ─── Workflow Runner ───────────────────────────────────────────────────────────

export async function runWorkflow(
  definition: WorkflowDefinition,
  inputs: Record<string, unknown> = {},
  onStepUpdate?: (stepId: string, result: StepResult) => void
): Promise<WorkflowRun> {
  const run: WorkflowRun = {
    id: generateId('run'),
    workflowId: definition.id,
    workflowName: definition.name,
    status: 'running',
    triggeredBy: 'user',
    startedAt: new Date().toISOString(),
    stepResults: {},
  };

  await bufferEvent('workflow.start', `Workflow "${definition.name}" started`, {
    resource: 'workflow',
    resourceId: definition.id,
  });

  // Execute steps sequentially (simplified — real impl would follow nextSteps graph)
  for (const step of definition.steps) {
    const stepResult: StepResult = {
      stepId: step.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    };
    onStepUpdate?.(step.id, stepResult);

    try {
      await sleep(300 + Math.random() * 700);

      // Execute tool if this is a tool-based step
      if (step.category === 'action' || step.category === 'ai') {
        // Simulate tool execution for AI/action steps
        await sleep(200);
      }

      stepResult.status = 'success';
      stepResult.completedAt = new Date().toISOString();
      stepResult.durationMs = 400 + Math.floor(Math.random() * 600);
      stepResult.output = { status: 'ok', step: step.name };
    } catch (err) {
      stepResult.status = 'error';
      stepResult.error = String(err);
      stepResult.completedAt = new Date().toISOString();
    }

    run.stepResults[step.id] = stepResult;
    onStepUpdate?.(step.id, stepResult);
  }

  run.status = 'completed';
  run.completedAt = new Date().toISOString();
  run.durationMs = Object.values(run.stepResults).reduce((sum, r) => sum + (r.durationMs ?? 0), 0);

  await bufferEvent('workflow.complete', `Workflow "${definition.name}" completed`, {
    resource: 'workflow',
    resourceId: definition.id,
    metadata: { runId: run.id, durationMs: run.durationMs },
  });

  return run;
}
