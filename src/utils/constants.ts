export const VIEWS = {
  LANDING: 'landing',
  VAULT: 'vault',
  EVIDENCE: 'evidence',
  FIX: 'fix',
  SIGNUP: 'signup',
} as const;

export type ViewType = (typeof VIEWS)[keyof typeof VIEWS];
