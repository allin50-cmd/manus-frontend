/**
 * Typed Workflow System
 * Defines all types for intelligent, typed workflows
 */

/** Primitive parameter types for typed inputs */
export type ParamType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'text'
  | 'json'
  | 'file'
  | 'email'
  | 'url'
  | 'company_number'
  | 'currency'
  | 'risk_level';

/** A single parameter definition for a workflow step */
export interface WorkflowParam {
  key: string;
  label: string;
  type: ParamType;
  required?: boolean;
  description?: string;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

/** Workflow step categories */
export type StepCategory =
  | 'trigger'
  | 'condition'
  | 'action'
  | 'ai'
  | 'notification'
  | 'data'
  | 'approval'
  | 'integration'
  | 'output';

/** Individual step in a workflow */
export interface WorkflowStep {
  id: string;
  name: string;
  category: StepCategory;
  description: string;
  icon?: string;
  params: WorkflowParam[];
  values?: Record<string, unknown>;
  /** IDs of next steps (supports branching) */
  nextSteps?: string[];
  /** Condition branch: truthy → nextSteps[0], falsy → nextSteps[1] */
  conditionKey?: string;
  status?: 'idle' | 'running' | 'success' | 'error' | 'skipped';
  output?: unknown;
  error?: string;
  executedAt?: string;
  durationMs?: number;
}

/** Workflow status */
export type WorkflowStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'archived'
  | 'running'
  | 'completed'
  | 'failed';

/** Workflow trigger types */
export type TriggerType =
  | 'manual'
  | 'scheduled'
  | 'webhook'
  | 'event'
  | 'api'
  | 'form_submit'
  | 'file_upload';

/** Workflow categories */
export type WorkflowCategory =
  | 'compliance'
  | 'intake'
  | 'audit'
  | 'ai_analysis'
  | 'notifications'
  | 'data_processing'
  | 'document'
  | 'risk_assessment';

/** A complete workflow definition */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  version: string;
  status: WorkflowStatus;
  trigger: TriggerType;
  triggerConfig?: Record<string, unknown>;
  steps: WorkflowStep[];
  /** Step ID to start from */
  entryStep: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  runCount: number;
  successCount: number;
  failCount: number;
  avgDurationMs?: number;
}

/** A workflow execution instance */
export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  stepResults: Record<string, StepResult>;
  error?: string;
  output?: unknown;
  metadata?: Record<string, unknown>;
}

/** Result of a single step execution */
export interface StepResult {
  stepId: string;
  status: 'idle' | 'running' | 'success' | 'error' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  output?: unknown;
  error?: string;
}

/** Predefined workflow templates */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  icon: string;
  color: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupMins: number;
  steps: Omit<WorkflowStep, 'values' | 'status' | 'output' | 'error'>[];
}

/** Workflow execution context passed to each step */
export interface WorkflowContext {
  runId: string;
  workflowId: string;
  inputs: Record<string, unknown>;
  stepOutputs: Record<string, unknown>;
  user: { id: string; name: string; email: string };
  tenant: { id: string; name: string };
  metadata: Record<string, unknown>;
}
