/** Format a date string to a full locale string (e.g. "19/02/2026, 14:30:00") */
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Not available';
    return d.toLocaleString();
  } catch {
    return 'Not available';
  }
}

/** Format a date string as short date (e.g. "19 Feb 2026") */
export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString || dateString === 'N/A') return 'Not available';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Not available';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'Not available';
  }
}

/** Format a date string as long date (e.g. "19 February 2026") */
export function formatDateLong(dateString: string | null | undefined): string {
  if (!dateString || dateString === 'N/A') return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return 'N/A';
  }
}

/** Format a date string as relative time (e.g. "Just now", "5m ago", "2h ago", "3d ago") */
export function formatRelativeTime(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return '';
  }
}
