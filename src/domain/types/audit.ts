export interface AuditRecord {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface WriteAuditInput {
  tenantId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  payload: Record<string, unknown>;
}
