import { findByCompanyNumber } from '../repositories/monitoredCompanies.repo';
import { findByCompany } from '../repositories/complianceAlerts.repo';
import { getUpcomingDeadlinesByCompanyNumber } from '../../repositories/obligation.repository';
import type { UpcomingDeadline } from '@/types/dashboard';
import type { AlertType } from '@/types/alerts';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toDeadlineStatus(daysLeft: number): UpcomingDeadline['status'] {
  if (daysLeft < 0) return 'overdue';
  if (daysLeft < 14) return 'due_soon';
  return 'on_track';
}

export async function getDashboardData(companyNumber: string) {
  const [company, alerts, rawDeadlines] = await Promise.all([
    findByCompanyNumber(companyNumber),
    findByCompany(companyNumber),
    getUpcomingDeadlinesByCompanyNumber(companyNumber),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlines: UpcomingDeadline[] = rawDeadlines.map((d) => {
    const dueMs = new Date(d.dueDate).getTime();
    const daysLeft = Math.round((dueMs - today.getTime()) / MS_PER_DAY);
    return {
      companyName: d.companyName,
      companyNumber: d.companyNumber,
      dueDate: d.dueDate,
      daysLeft,
      type: d.obligationType as AlertType,
      status: toDeadlineStatus(daysLeft),
    };
  });

  return { company, alerts, deadlines };
}
