export type AlertUrgency = 'low' | 'medium' | 'urgent';

export type AlertChannel = 'email' | 'sms' | 'dashboard';

export type AlertStatus = 'queued' | 'sent' | 'failed' | 'deduplicated';

export interface Alert {
  id: string;
  tenantId: string;
  obligationId: string;
  urgency: AlertUrgency;
  channel: AlertChannel;
  status: AlertStatus;
  dedupeKey: string;
  dueDate: string;
  createdAt: Date;
  sentAt?: Date | null;
}
