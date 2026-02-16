export const VIEWS = {
  LANDING: 'landing',
  SIGNUP: 'signup',
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  ADD_COMPANY: 'add_company',
  COMPANY_DETAIL: 'company_detail',
  ALERTS: 'alerts',
  SETTINGS: 'settings',
  VAULT: 'vault',
  EVIDENCE: 'evidence',
  FIX: 'fix',
} as const;

export type ViewType = (typeof VIEWS)[keyof typeof VIEWS];

export const API_BASE = '/api';
