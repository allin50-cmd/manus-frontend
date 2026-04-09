export function formatDateGB(dateString: string): string {
  if (!dateString || dateString === 'N/A') return 'Not available';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not available';
    return date.toLocaleDateString('en-GB');
  } catch {
    return 'Not available';
  }
}

export function daysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  return `${days} days`;
}
