import { API_BASE } from './constants';

const TOKEN_KEY = 'fineguard_token';
const USER_KEY = 'fineguard_user';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  company: string | null;
  plan: string;
  role?: string;
  createdAt?: string;
}

export interface MonitoredCompany {
  id: string;
  userId: string;
  companyNumber: string;
  companyName: string;
  companyStatus: string | null;
  complianceStatus: string | null;
  riskLevel: string | null;
  lastCheckedAt: string | null;
  accountsNextDue: string | null;
  confirmationNextDue: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AlertItem {
  id: string;
  userId: string;
  companyId: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalCompanies: number;
  compliantCount: number;
  warningCount: number;
  overdueCount: number;
  highRiskCount: number;
  unreadAlerts: number;
}

export interface ComplianceDetail {
  status: string;
  riskLevel: string;
  accounts: { nextDue: string; daysUntilDue: number; overdue: boolean };
  confirmationStatement: { nextDue: string; daysUntilDue: number; overdue: boolean };
  overdueFilings: Array<{
    type: string;
    description: string;
    dueDate: string;
    daysUntilDue: number;
    overdue: boolean;
    penaltyRisk?: number;
  }>;
  upcomingDeadlines: Array<{
    type: string;
    description: string;
    dueDate: string;
    daysUntilDue: number;
  }>;
  penalties?: Array<{ estimated: number; description: string }>;
  lastFiling?: { type: string; date: string };
}

// Token management
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSavedUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveUser(user: UserProfile): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// HTTP helpers
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// Auth API
export async function register(email: string, name: string, password: string, company?: string) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password, company }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Registration failed');
  setToken(data.token);
  saveUser(data.user);
  return data.user as UserProfile;
}

export async function login(email: string, password: string) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Login failed');
  setToken(data.token);
  saveUser(data.user);
  return data.user as UserProfile;
}

export async function logout() {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  clearAuth();
}

export async function fetchMe(): Promise<UserProfile> {
  const res = await apiFetch('/auth/me');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Not authenticated');
  saveUser(data.user);
  return data.user;
}

// Dashboard API
export async function fetchDashboard(): Promise<{
  stats: DashboardStats;
  companies: MonitoredCompany[];
  recentAlerts: AlertItem[];
}> {
  const res = await apiFetch('/dashboard');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load dashboard');
  return { stats: data.stats, companies: data.companies, recentAlerts: data.recentAlerts };
}

// Companies API
export async function fetchCompanies(): Promise<MonitoredCompany[]> {
  const res = await apiFetch('/companies');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load companies');
  return data.companies;
}

export async function addCompany(companyNumber: string, notes?: string): Promise<{
  company: MonitoredCompany;
  compliance: ComplianceDetail;
}> {
  const res = await apiFetch('/companies', {
    method: 'POST',
    body: JSON.stringify({ companyNumber, notes }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to add company');
  return { company: data.company, compliance: data.compliance };
}

export async function fetchCompanyDetail(id: string): Promise<{
  company: MonitoredCompany;
  compliance: ComplianceDetail | null;
  alerts: AlertItem[];
}> {
  const res = await apiFetch(`/companies/${id}`);
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load company');
  return { company: data.company, compliance: data.compliance, alerts: data.alerts };
}

export async function removeCompany(id: string): Promise<void> {
  const res = await apiFetch(`/companies/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to remove company');
}

export async function refreshCompany(id: string): Promise<ComplianceDetail> {
  const res = await apiFetch(`/companies/${id}/refresh`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to refresh');
  return data.compliance;
}

// Alerts API
export async function fetchAlerts(): Promise<AlertItem[]> {
  const res = await apiFetch('/alerts');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load alerts');
  return data.alerts;
}

export async function markAlertRead(id: string): Promise<void> {
  const res = await apiFetch(`/alerts/${id}/read`, { method: 'PATCH' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update alert');
}

export async function markAllAlertsRead(): Promise<void> {
  const res = await apiFetch('/alerts/read-all', { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update alerts');
}
