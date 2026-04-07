import type { DeadlineStatus } from '@/types/company';

export function getRiskColour(riskLevel: string): string {
  switch (riskLevel) {
    case 'high': return 'bg-red-100 border-red-300 text-red-800';
    case 'medium': return 'bg-orange-100 border-orange-300 text-orange-800';
    case 'low': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    default: return 'bg-green-100 border-green-300 text-green-800';
  }
}

export function getStatusColour(status: string): string {
  switch (status) {
    case 'overdue': return 'bg-red-100 border-red-300 text-red-800';
    case 'warning': return 'bg-orange-100 border-orange-300 text-orange-800';
    default: return 'bg-green-100 border-green-300 text-green-800';
  }
}

export function isDeadlineAvailable(d: DeadlineStatus): boolean {
  return d.daysUntilDue !== 999 && d.nextDue !== 'N/A';
}

export function formatDate(dateString: string): string {
  if (!dateString || dateString === 'N/A') return 'Not available';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not available';
    return date.toLocaleDateString('en-GB');
  } catch {
    return 'Not available';
  }
}

export function deadlineUrgency(daysUntilDue: number): 'on_track' | 'due_soon' | 'overdue' {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 30) return 'due_soon';
  return 'on_track';
}
