export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitise(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}
