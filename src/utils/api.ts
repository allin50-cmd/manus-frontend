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
  userIntent?: string;
  onboardingComplete?: boolean;
  notificationPrefs?: Record<string, boolean>;
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
async function apiFetch(path: string, options: RequestInit = {}, signal?: AbortSignal): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return fetch(`${API_BASE}${path}`, { ...options, headers, signal });
}

// Auth API
export async function register(email: string, name: string, password: string, company?: string, intent?: string) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password, company, intent }),
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

export async function fetchMe(signal?: AbortSignal): Promise<UserProfile> {
  const res = await apiFetch('/auth/me', {}, signal);
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Not authenticated');
  saveUser(data.user);
  return data.user;
}

// Profile update
export async function updateProfile(
  updates: Partial<Pick<UserProfile, 'name' | 'company' | 'userIntent' | 'onboardingComplete'>>
): Promise<UserProfile> {
  const res = await apiFetch('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update profile');
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

// ============================================================================
// ACSP API
// ============================================================================

export interface AcspClient {
  id: string;
  userId: string;
  companyNumber: string;
  companyName: string;
  clientRef: string | null;
  serviceType: string;
  status: string;
  acspRegNumber: string | null;
  identityVerified: boolean;
  amlChecked: boolean;
  lastFilingDate: string | null;
  nextFilingDue: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AcspFiling {
  id: string;
  acspClientId: string;
  userId: string;
  filingType: string;
  status: string;
  dueDate: string | null;
  submittedAt: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AcspDashboardStats {
  totalClients: number;
  activeClients: number;
  verifiedClients: number;
  amlCheckedClients: number;
  pendingFilings: number;
  submittedFilings: number;
  totalFilings: number;
  serviceBreakdown: Record<string, number>;
}

export async function fetchAcspClients(): Promise<AcspClient[]> {
  const res = await apiFetch('/acsp/clients');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load ACSP clients');
  return data.clients;
}

export async function addAcspClient(client: {
  companyNumber: string;
  companyName: string;
  clientRef?: string;
  serviceType: string;
  acspRegNumber?: string;
  notes?: string;
}): Promise<AcspClient> {
  const res = await apiFetch('/acsp/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to add client');
  return data.client;
}

export async function updateAcspClient(id: string, updates: Partial<AcspClient>): Promise<AcspClient> {
  const res = await apiFetch(`/acsp/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update client');
  return data.client;
}

export async function deleteAcspClient(id: string): Promise<void> {
  const res = await apiFetch(`/acsp/clients/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to delete client');
}

export async function fetchAcspFilings(clientId?: string): Promise<AcspFiling[]> {
  const path = clientId ? `/acsp/filings?clientId=${clientId}` : '/acsp/filings';
  const res = await apiFetch(path);
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load filings');
  return data.filings;
}

export async function addAcspFiling(filing: {
  acspClientId: string;
  filingType: string;
  dueDate?: string;
  notes?: string;
}): Promise<AcspFiling> {
  const res = await apiFetch('/acsp/filings', {
    method: 'POST',
    body: JSON.stringify(filing),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to create filing');
  return data.filing;
}

export async function updateAcspFiling(id: string, updates: Partial<AcspFiling>): Promise<AcspFiling> {
  const res = await apiFetch(`/acsp/filings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update filing');
  return data.filing;
}

export async function fetchAcspDashboard(): Promise<AcspDashboardStats> {
  const res = await apiFetch('/acsp/dashboard');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load ACSP dashboard');
  return data.stats;
}

// ============================================================================
// WORKFLOW & TEAM API
// ============================================================================

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  status: string;
  createdAt: string;
}

export interface Workflow {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  workflowType: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface WorkflowTask {
  id: string;
  workflowId: string;
  title: string;
  description: string | null;
  status: string;
  assignedTo: string | null;
  companyNumber: string | null;
  companyName: string | null;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  teamSize: number;
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const res = await apiFetch('/team');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load team');
  return data.members;
}

export async function addTeamMember(member: {
  name: string;
  email: string;
  role?: string;
  department?: string;
}): Promise<TeamMember> {
  const res = await apiFetch('/team', {
    method: 'POST',
    body: JSON.stringify(member),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to add team member');
  return data.member;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const res = await apiFetch(`/team/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to delete team member');
}

export async function fetchWorkflows(): Promise<Workflow[]> {
  const res = await apiFetch('/workflows');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load workflows');
  return data.workflows;
}

export async function createWorkflow(wf: {
  title: string;
  description?: string;
  workflowType: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: string;
}): Promise<Workflow> {
  const res = await apiFetch('/workflows', {
    method: 'POST',
    body: JSON.stringify(wf),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to create workflow');
  return data.workflow;
}

export async function updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
  const res = await apiFetch(`/workflows/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update workflow');
  return data.workflow;
}

export async function deleteWorkflow(id: string): Promise<void> {
  const res = await apiFetch(`/workflows/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to delete workflow');
}

export async function fetchWorkflowTasks(workflowId: string): Promise<WorkflowTask[]> {
  const res = await apiFetch(`/workflows/${workflowId}/tasks`);
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load tasks');
  return data.tasks;
}

export async function addWorkflowTask(workflowId: string, task: {
  title: string;
  description?: string;
  assignedTo?: string;
  companyNumber?: string;
  companyName?: string;
  priority?: string;
  dueDate?: string;
}): Promise<WorkflowTask> {
  const res = await apiFetch(`/workflows/${workflowId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to create task');
  return data.task;
}

export async function updateWorkflowTask(taskId: string, updates: Partial<WorkflowTask>): Promise<WorkflowTask> {
  const res = await apiFetch(`/workflows/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update task');
  return data.task;
}

export async function fetchWorkflowStats(): Promise<WorkflowStats> {
  const res = await apiFetch('/workflows/stats');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load workflow stats');
  return data.stats;
}

// ============================================================================
// XLSX IMPORT API
// ============================================================================

export interface BulkImportResult {
  summary: {
    total: number;
    imported: number;
    skipped: number;
    errors: number;
  };
  results: Array<{
    row: number;
    status: 'imported' | 'skipped' | 'error';
    error?: string;
    client?: AcspClient;
  }>;
}

export interface ImportHistoryItem {
  id: string;
  userId: string;
  fileName: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  importType: string;
  columnMapping: string | null;
  workflowId: string | null;
  createdAt: string;
}

export async function bulkImportAcspClients(
  clients: Array<Partial<AcspClient>>,
  fileName?: string,
  columnMapping?: Record<string, string>
): Promise<BulkImportResult> {
  const res = await apiFetch('/acsp/clients/bulk', {
    method: 'POST',
    body: JSON.stringify({ clients, fileName, columnMapping }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Bulk import failed');
  return { summary: data.summary, results: data.results };
}

export async function importWithWorkflow(params: {
  clients: Array<Partial<AcspClient>>;
  workflowTitle?: string;
  workflowType?: string;
  assignedTo?: string;
  taskTemplate?: { title: string; description?: string };
  fileName?: string;
  columnMapping?: Record<string, string>;
}): Promise<BulkImportResult & { workflow: Workflow }> {
  const res = await apiFetch('/acsp/import-with-workflow', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Import with workflow failed');
  return { summary: data.summary, results: data.results, workflow: data.workflow };
}

export async function fetchImportHistory(): Promise<ImportHistoryItem[]> {
  const res = await apiFetch('/acsp/imports');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to fetch import history');
  return data.imports;
}

export async function updateAlertPreferences(prefs: Record<string, boolean>): Promise<void> {
  const res = await apiFetch('/alerts/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ prefs }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update alert preferences');
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await apiFetch('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to change password');
}

// ============================================================================
// M365 INTEGRATION API
// ============================================================================

export interface M365Status {
  configured: boolean;
  tenantId: string | null;
  clientId: string | null;
  services: {
    graphApi: boolean;
    teamsBot: boolean;
    outlookNotifications: boolean;
    webhookForwarding: boolean;
  };
}

export interface M365ConfigStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
}

export async function fetchM365Status(): Promise<M365Status> {
  const res = await apiFetch('/m365/status');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to fetch M365 status');
  return {
    configured: data.configured,
    tenantId: data.tenantId,
    clientId: data.clientId,
    services: data.services,
  };
}

export async function fetchM365ConfigGuide(): Promise<{ configured: boolean; steps: M365ConfigStep[] }> {
  const res = await apiFetch('/m365/config-guide');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to fetch M365 config guide');
  return { configured: data.configured, steps: data.steps };
}

export async function sendM365TestNotification(channel: 'outlook' | 'teams', target: string): Promise<{ message: string }> {
  const res = await apiFetch('/m365/test-notification', {
    method: 'POST',
    body: JSON.stringify({ channel, target }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || data.message || 'Failed to send test notification');
  return { message: data.message };
}

export async function forwardComplianceEvent(event: {
  eventType: string;
  firmId: string;
  firmName?: string;
  riskLevel?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string;
}): Promise<{ ok: boolean; statusCode?: number; retryCount: number; error?: string }> {
  const res = await apiFetch('/m365/forward-event', {
    method: 'POST',
    body: JSON.stringify(event),
  });
  return res.json();
}
