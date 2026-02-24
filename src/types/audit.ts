/**
 * Audit & Security Types
 */

export type AuditEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed'
  | 'auth.mfa'
  | 'data.read'
  | 'data.write'
  | 'data.delete'
  | 'data.export'
  | 'ai.query'
  | 'ai.tool_use'
  | 'workflow.start'
  | 'workflow.complete'
  | 'workflow.fail'
  | 'compliance.check'
  | 'compliance.alert'
  | 'document.upload'
  | 'document.download'
  | 'approval.request'
  | 'approval.granted'
  | 'approval.denied'
  | 'settings.change'
  | 'api.call'
  | 'system.error';

export type AuditSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  severity: AuditSeverity;
  userId: string;
  userName: string;
  tenantId: string;
  resource?: string;
  resourceId?: string;
  action: string;
  status: 'success' | 'failure' | 'warning';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  /** VaultLine WORM reference (when flushed) */
  vaultRef?: string;
}

export interface AuditFilter {
  types?: AuditEventType[];
  severities?: AuditSeverity[];
  userId?: string;
  status?: 'success' | 'failure' | 'warning';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
