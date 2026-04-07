import type { AlertType } from './alerts';

export interface DashboardStats {
  companiesMonitored: number;
  upcomingDeadlines: number;
  overdueCount: number;
  complianceScore: number; // 0-100
}

export interface UpcomingDeadline {
  companyName: string;
  companyNumber: string;
  dueDate: string;
  daysLeft: number;
  type: AlertType;
  status: 'on_track' | 'due_soon' | 'overdue';
}

export interface MonitoredCompanyRow {
  id: string;
  companyNumber: string;
  companyName: string;
  stripeSessionId: string;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  activatedAt: Date;
  activeAlerts?: AlertType[];
}
