export type WorkflowStatus =
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'terminated';

export interface WorkflowState {
  obligationId: string;
  obligationType: string;
  status: string;
  dueDate: string | null;
  daysRemaining: number | null;
  paused: boolean;
  nextActionAt: string | null;
  lastExternalCheckAt: string | null;
  lastAlertAt: string | null;
  lastAlertUrgency: string | null;
}

export interface WorkflowInstance {
  id: string;
  tenantId: string;
  obligationId: string;
  workflowId: string;
  taskQueue: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
}
