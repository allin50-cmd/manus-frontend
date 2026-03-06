import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Simple SHA256-like fingerprint using available crypto
export async function generateFingerprint(supplier: string, date: string, gross: number): Promise<string> {
  const data = `${supplier.toLowerCase().trim()}|${date}|${gross.toFixed(2)}`;
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getVATRate(rate: number): string {
  if (rate === 0) return 'Zero-rated (0%)';
  if (rate === 5) return 'Reduced (5%)';
  if (rate === 20) return 'Standard (20%)';
  return `${rate}%`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    compliant: 'text-green-600 bg-green-50',
    in_sync: 'text-green-600 bg-green-50',
    active: 'text-green-600 bg-green-50',
    accepted: 'text-green-600 bg-green-50',
    verified: 'text-green-600 bg-green-50',
    approved: 'text-green-600 bg-green-50',
    submitted: 'text-blue-600 bg-blue-50',
    validated: 'text-blue-600 bg-blue-50',
    processing: 'text-blue-600 bg-blue-50',
    draft: 'text-gray-600 bg-gray-50',
    pending: 'text-amber-600 bg-amber-50',
    due_soon: 'text-amber-600 bg-amber-50',
    variance_detected: 'text-amber-600 bg-amber-50',
    warning: 'text-amber-600 bg-amber-50',
    overdue: 'text-red-600 bg-red-50',
    rejected: 'text-red-600 bg-red-50',
    critical: 'text-red-600 bg-red-50',
    dissolved: 'text-red-600 bg-red-50',
    duplicate: 'text-red-600 bg-red-50',
  };
  return colors[status] ?? 'text-gray-600 bg-gray-50';
}

export function getSeverityIcon(severity: string): string {
  const icons: Record<string, string> = {
    critical: '🔴',
    warning: '🟡',
    info: '🔵',
  };
  return icons[severity] ?? '⚪';
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
