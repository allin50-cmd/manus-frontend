// ============================================================================
// Input validation helpers
// Lightweight, dependency-free field guards for POST endpoints.
// ============================================================================

export type ValidationError = { field: string; message: string };

export function validateString(
  value: unknown,
  field: string,
  opts: { required?: boolean; maxLength?: number } = {},
): ValidationError | null {
  const { required = false, maxLength } = opts;

  if (required && (value === undefined || value === null || String(value).trim() === '')) {
    return { field, message: `${field} is required` };
  }
  if (value !== undefined && value !== null && typeof value !== 'string') {
    return { field, message: `${field} must be a string` };
  }
  if (maxLength && typeof value === 'string' && value.length > maxLength) {
    return { field, message: `${field} must be ${maxLength} characters or fewer` };
  }
  return null;
}

export function validateEmail(value: unknown, field: string): ValidationError | null {
  const strError = validateString(value, field, { required: true, maxLength: 255 });
  if (strError) return strError;
  if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { field, message: `${field} must be a valid email address` };
  }
  return null;
}

export function collect(...errors: (ValidationError | null)[]): ValidationError[] {
  return errors.filter((e): e is ValidationError => e !== null);
}
