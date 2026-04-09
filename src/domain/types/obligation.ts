export type ObligationType = 'accounts_filing' | 'confirmation_statement';

export type ObligationStatus =
  | 'pending'
  | 'monitoring'
  | 'due_soon'
  | 'urgent'
  | 'overdue'
  | 'resolved'
  | 'paused'
  | 'failed';

export interface Obligation {
  id: string;
  tenantId: string;
  monitoredCompanyId: string;
  obligationType: ObligationType;
  status: ObligationStatus;
  dueDate: string | null;
  nextActionAt: Date | null;
  workflowId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ObligationSnapshot {
  /** ISO 8601 date string (YYYY-MM-DD) */
  dueDate: string;
  /** Whole calendar days remaining; negative = overdue */
  daysRemaining: number;
  /** Whether the obligation has been filed/resolved externally */
  resolved: boolean;
  /** ISO 8601 datetime of when this snapshot was taken */
  checkedAt: string;
  /** Optional reference to the persisted external_source_snapshots row */
  externalSnapshotId?: string;
}
