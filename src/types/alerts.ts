export type AlertType = 'accounts_filing' | 'confirmation_statement' | 'strike_off';
export type AlertStatus = 'active' | 'cancelled';

export interface ComplianceAlert {
  id: string;
  companyNumber: string;
  alertType: AlertType;
  stripeSubscriptionId?: string | null;
  stripeItemId?: string | null;
  status: AlertStatus;
  activatedAt: Date;
}

export const ALERT_LABELS: Record<AlertType, string> = {
  accounts_filing: 'Accounts Filing Monitoring',
  confirmation_statement: 'Confirmation Statement Monitoring',
  strike_off: 'Strike-Off Protection',
};

export const ALERT_DESCRIPTIONS: Record<AlertType, string> = {
  accounts_filing: "We'll alert you before your accounts filing deadline.",
  confirmation_statement: "We'll remind you when your confirmation statement is due.",
  strike_off: "We'll monitor your company status and alert you to any risks.",
};
