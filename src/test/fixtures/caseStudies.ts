/**
 * Realistic UK accountancy firm case studies used across all stress tests.
 *
 * Covers every status variant, edge cases (0 client tenants, very large
 * tenant counts, all-overdue deadline sets, empty log arrays, etc.) and
 * the full range of step combinations.
 */

import type { Status } from '@/components/fineguard/StatusPill';
import type { Step } from '@/components/fineguard/StepTimeline';
import type { LogEntry } from '@/components/fineguard/LogViewer';

// ─── Shared step definitions ──────────────────────────────────────────────────

export const DEPLOY_STEPS_SUCCESS: Step[] = [
  { id: 'auth',       label: 'Authenticate with Entra ID',       status: 'success' },
  { id: 'sharepoint', label: 'Provision SharePoint site & lists', status: 'success' },
  { id: 'teams',      label: 'Create Teams channel & tabs',       status: 'success' },
  { id: 'functions',  label: 'Deploy Azure Functions',            status: 'success' },
  { id: 'automate',   label: 'Register Power Automate flows',     status: 'success' },
  { id: 'finalise',   label: 'Finalise configuration & verify',   status: 'success' },
];

export const DEPLOY_STEPS_RUNNING: Step[] = [
  { id: 'auth',       label: 'Authenticate with Entra ID',       status: 'success' },
  { id: 'sharepoint', label: 'Provision SharePoint site & lists', status: 'success' },
  { id: 'teams',      label: 'Create Teams channel & tabs',       status: 'running' },
  { id: 'functions',  label: 'Deploy Azure Functions',            status: 'pending' },
  { id: 'automate',   label: 'Register Power Automate flows',     status: 'pending' },
  { id: 'finalise',   label: 'Finalise configuration & verify',   status: 'pending' },
];

export const DEPLOY_STEPS_FAILED_TEAMS: Step[] = [
  { id: 'auth',       label: 'Authenticate with Entra ID',       status: 'success' },
  { id: 'sharepoint', label: 'Provision SharePoint site & lists', status: 'success' },
  { id: 'teams',      label: 'Create Teams channel & tabs',       status: 'failed' },
  { id: 'functions',  label: 'Deploy Azure Functions',            status: 'pending' },
  { id: 'automate',   label: 'Register Power Automate flows',     status: 'pending' },
  { id: 'finalise',   label: 'Finalise configuration & verify',   status: 'pending' },
];

export const DEPLOY_STEPS_FAILED_AUTH: Step[] = [
  { id: 'auth',       label: 'Authenticate with Entra ID',       status: 'failed' },
  { id: 'sharepoint', label: 'Provision SharePoint site & lists', status: 'pending' },
  { id: 'teams',      label: 'Create Teams channel & tabs',       status: 'pending' },
  { id: 'functions',  label: 'Deploy Azure Functions',            status: 'pending' },
  { id: 'automate',   label: 'Register Power Automate flows',     status: 'pending' },
  { id: 'finalise',   label: 'Finalise configuration & verify',   status: 'pending' },
];

export const DEPLOY_STEPS_ALL_PENDING: Step[] = [
  { id: 'auth',       label: 'Authenticate with Entra ID',       status: 'pending' },
  { id: 'sharepoint', label: 'Provision SharePoint site & lists', status: 'pending' },
  { id: 'teams',      label: 'Create Teams channel & tabs',       status: 'pending' },
  { id: 'functions',  label: 'Deploy Azure Functions',            status: 'pending' },
  { id: 'automate',   label: 'Register Power Automate flows',     status: 'pending' },
  { id: 'finalise',   label: 'Finalise configuration & verify',   status: 'pending' },
];

// ─── Log fixtures ─────────────────────────────────────────────────────────────

export const LOGS_SUCCESS: LogEntry[] = [
  { timestamp: '09:42:01', level: 'info',    message: 'Deployment started by admin@smithson.co.uk' },
  { timestamp: '09:42:03', level: 'success', message: 'Entra ID auth validated' },
  { timestamp: '09:42:10', level: 'info',    message: 'Creating SharePoint site FineGuard-Compliance…' },
  { timestamp: '09:42:22', level: 'success', message: 'SharePoint provisioned. 3 lists created.' },
  { timestamp: '09:42:30', level: 'info',    message: 'Creating Teams channel…' },
  { timestamp: '09:42:38', level: 'success', message: 'Teams channel ready. Tabs registered.' },
  { timestamp: '09:42:45', level: 'info',    message: 'Deploying Azure Functions…' },
  { timestamp: '09:43:00', level: 'success', message: 'Functions deployed: DeadlineChecker, AlertDispatcher' },
  { timestamp: '09:43:05', level: 'info',    message: 'Registering Power Automate flows…' },
  { timestamp: '09:43:15', level: 'success', message: '4 flows registered and active' },
  { timestamp: '09:43:20', level: 'success', message: 'All checks passed. Deployment complete.' },
];

export const LOGS_FAILED_TEAMS: LogEntry[] = [
  { timestamp: '15:30:00', level: 'info',    message: 'Deployment started' },
  { timestamp: '15:30:02', level: 'success', message: 'Auth validated' },
  { timestamp: '15:30:09', level: 'success', message: 'SharePoint provisioned' },
  { timestamp: '15:30:15', level: 'info',    message: 'Creating Teams channel…' },
  { timestamp: '15:30:22', level: 'error',   message: 'Teams API error: 403 Forbidden – insufficient permissions.' },
];

export const LOGS_FAILED_AUTH: LogEntry[] = [
  { timestamp: '08:00:01', level: 'info',    message: 'Deployment started' },
  { timestamp: '08:00:03', level: 'error',   message: 'Entra ID: AADSTS70011 – invalid scope. Check app registration.' },
];

export const LOGS_WARN_MIXED: LogEntry[] = [
  { timestamp: '10:00:00', level: 'info',    message: 'Deployment started' },
  { timestamp: '10:00:02', level: 'warn',    message: 'SharePoint quota near limit (80%)' },
  { timestamp: '10:00:08', level: 'success', message: 'SharePoint provisioned with warnings' },
  { timestamp: '10:00:10', level: 'warn',    message: 'Teams rate-limit hit. Retrying in 5 s…' },
  { timestamp: '10:00:16', level: 'success', message: 'Teams channel created after retry' },
  { timestamp: '10:00:20', level: 'success', message: 'All steps complete' },
];

export const LOGS_EMPTY: LogEntry[] = [];

// Generate 50 log entries for volume stress testing
export const LOGS_VOLUME: LogEntry[] = Array.from({ length: 50 }, (_, i) => ({
  timestamp: `00:${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
  level: (['info', 'success', 'warn', 'error'] as LogEntry['level'][])[i % 4],
  message: `Step ${i + 1}: processing tenant data chunk ${i + 1}/50`,
}));

// ─── Deadline fixtures ─────────────────────────────────────────────────────────

export type Risk = 'low' | 'medium' | 'high';

export interface Deadline {
  id: string;
  type: string;
  client: string;
  dueDate: string;
  daysLeft: number;
  risk: Risk;
}

export const DEADLINES_SMITHSON: Deadline[] = [
  { id: 'd-1', type: 'Confirmation Statement',  client: 'Acme Widgets Ltd',      dueDate: '01 Feb 2025', daysLeft: 18, risk: 'medium' },
  { id: 'd-2', type: 'Annual Accounts',         client: 'Greenvale Holdings',    dueDate: '28 Feb 2025', daysLeft: 45, risk: 'low' },
  { id: 'd-3', type: 'VAT Return',              client: 'Kendrick Services Ltd', dueDate: '22 Jan 2025', daysLeft: 5,  risk: 'high' },
  { id: 'd-4', type: 'Corporation Tax Return',  client: 'Northfield Bakeries',   dueDate: '31 Mar 2025', daysLeft: 75, risk: 'low' },
];

export const DEADLINES_ALL_OVERDUE: Deadline[] = [
  { id: 'x-1', type: 'VAT Return',             client: 'Crisis Corp Ltd',       dueDate: '01 Jan 2025', daysLeft: 2,  risk: 'high' },
  { id: 'x-2', type: 'Payroll RTI',            client: 'Urgent Holdings',       dueDate: '06 Jan 2025', daysLeft: 7,  risk: 'high' },
  { id: 'x-3', type: 'PAYE Settlement',        client: 'Overdue Partners Ltd',  dueDate: '03 Jan 2025', daysLeft: 4,  risk: 'high' },
];

export const DEADLINES_ALL_OK: Deadline[] = [
  { id: 'o-1', type: 'Corporation Tax',         client: 'Safe Ltd',             dueDate: '30 Jun 2025', daysLeft: 90, risk: 'low' },
  { id: 'o-2', type: 'Annual Accounts',         client: 'Future Co',            dueDate: '31 Jul 2025', daysLeft: 120, risk: 'low' },
];

export const DEADLINES_EMPTY: Deadline[] = [];

// ─── Deployment run case studies ──────────────────────────────────────────────

export interface RunCase {
  id: string;
  tenantName: string;
  tenantEmail: string;
  createdAt: string;
  status: Status;
  runtimeEndpoint: string;
  sharePointDomain: string;
  steps: Step[];
  logs: LogEntry[];
}

export const CASE_STUDIES: RunCase[] = [
  {
    id: 'run-001',
    tenantName: 'Smithson & Co Accountants',
    tenantEmail: 'admin@smithson.co.uk',
    createdAt: '14 Jan 2025 09:42',
    status: 'Success',
    runtimeEndpoint: 'smithson.azurewebsites.net',
    sharePointDomain: 'smithson.sharepoint.com',
    steps: DEPLOY_STEPS_SUCCESS,
    logs: LOGS_SUCCESS,
  },
  {
    id: 'run-002',
    tenantName: 'Patel Advisory Services',
    tenantEmail: 'it@pateladvisory.co.uk',
    createdAt: '14 Jan 2025 11:05',
    status: 'Running',
    runtimeEndpoint: 'patel.azurewebsites.net',
    sharePointDomain: 'pateladvisory.sharepoint.com',
    steps: DEPLOY_STEPS_RUNNING,
    logs: [
      { timestamp: '11:05:00', level: 'info',    message: 'Deployment started' },
      { timestamp: '11:05:02', level: 'success', message: 'Auth validated' },
      { timestamp: '11:05:10', level: 'success', message: 'SharePoint provisioned' },
      { timestamp: '11:05:15', level: 'info',    message: 'Creating Teams channel…' },
    ],
  },
  {
    id: 'run-003',
    tenantName: 'Northern Tax Partners',
    tenantEmail: 'ops@ntpartners.co.uk',
    createdAt: '13 Jan 2025 15:30',
    status: 'Failed',
    runtimeEndpoint: 'ntp.azurewebsites.net',
    sharePointDomain: 'ntpartners.sharepoint.com',
    steps: DEPLOY_STEPS_FAILED_TEAMS,
    logs: LOGS_FAILED_TEAMS,
  },
  {
    id: 'run-004',
    tenantName: 'Meridian Accounting Ltd',
    tenantEmail: 'admin@meridian.co.uk',
    createdAt: '10 Jan 2025 08:15',
    status: 'Success',
    runtimeEndpoint: 'meridian.azurewebsites.net',
    sharePointDomain: 'meridian.sharepoint.com',
    steps: DEPLOY_STEPS_SUCCESS,
    logs: LOGS_SUCCESS,
  },
  {
    id: 'run-005',
    tenantName: 'Bloom & Kaye LLP',
    tenantEmail: 'tech@bloomkaye.co.uk',
    createdAt: '08 Jan 2025 14:22',
    status: 'Success',
    runtimeEndpoint: 'bloomkaye.azurewebsites.net',
    sharePointDomain: 'bloomkaye.sharepoint.com',
    steps: DEPLOY_STEPS_SUCCESS,
    logs: LOGS_SUCCESS,
  },
  {
    id: 'run-006',
    tenantName: 'Hargreaves & Sutton CPAs',
    tenantEmail: 'admin@hs-cpa.co.uk',
    createdAt: '05 Jan 2025 16:00',
    status: 'Failed',
    runtimeEndpoint: 'hscpa.azurewebsites.net',
    sharePointDomain: 'hscpa.sharepoint.com',
    steps: DEPLOY_STEPS_FAILED_AUTH,
    logs: LOGS_FAILED_AUTH,
  },
  {
    id: 'run-007',
    tenantName: 'Fenwick Moore & Associates',
    tenantEmail: 'ops@fenwickmoore.co.uk',
    createdAt: '03 Jan 2025 09:00',
    status: 'Success',
    runtimeEndpoint: 'fenwick.azurewebsites.net',
    sharePointDomain: 'fenwickmoore.sharepoint.com',
    steps: DEPLOY_STEPS_SUCCESS,
    logs: LOGS_WARN_MIXED,
  },
  {
    id: 'run-008',
    tenantName: 'Chambers & Leigh Tax Advisory',
    tenantEmail: 'it@chambersleigh.co.uk',
    createdAt: '02 Jan 2025 11:30',
    status: 'Pending',
    runtimeEndpoint: 'chambers.azurewebsites.net',
    sharePointDomain: 'chambersleigh.sharepoint.com',
    steps: DEPLOY_STEPS_ALL_PENDING,
    logs: LOGS_EMPTY,
  },
  {
    id: 'run-009',
    tenantName: 'Park Lane Financial Consultants',
    tenantEmail: 'admin@parklane-fc.co.uk',
    createdAt: '01 Jan 2025 00:01',
    status: 'Success',
    runtimeEndpoint: 'parklane.azurewebsites.net',
    sharePointDomain: 'parklanefinancial.sharepoint.com',
    steps: DEPLOY_STEPS_SUCCESS,
    logs: LOGS_VOLUME,
  },
  {
    id: 'run-010',
    tenantName: 'Whitmore & Son Chartered Accountants',
    tenantEmail: 'admin@whitmoreson.co.uk',
    createdAt: '31 Dec 2024 23:59',
    status: 'Warning',
    runtimeEndpoint: 'whitmore.azurewebsites.net',
    sharePointDomain: 'whitmoreandson.sharepoint.com',
    steps: DEPLOY_STEPS_SUCCESS,
    logs: LOGS_WARN_MIXED,
  },
];

// ─── Partner / practice fixtures ──────────────────────────────────────────────

export interface Practice {
  id: string;
  name: string;
  email: string;
  deployedAt: string;
  status: Status;
  tenantsCount: number;
}

export const PRACTICES: Practice[] = [
  { id: 't-001', name: 'Smithson & Co Accountants',     email: 'admin@smithson.co.uk',       deployedAt: '14 Jan 2025', status: 'Success', tenantsCount: 3 },
  { id: 't-002', name: 'Patel Advisory Services',       email: 'it@pateladvisory.co.uk',      deployedAt: '14 Jan 2025', status: 'Running', tenantsCount: 1 },
  { id: 't-003', name: 'Northern Tax Partners',         email: 'ops@ntpartners.co.uk',         deployedAt: '13 Jan 2025', status: 'Failed',  tenantsCount: 0 },
  { id: 't-004', name: 'Meridian Accounting Ltd',       email: 'admin@meridian.co.uk',         deployedAt: '10 Jan 2025', status: 'Success', tenantsCount: 7 },
  { id: 't-005', name: 'Bloom & Kaye LLP',              email: 'tech@bloomkaye.co.uk',          deployedAt: '08 Jan 2025', status: 'Success', tenantsCount: 4 },
  { id: 't-006', name: 'Hargreaves & Sutton CPAs',      email: 'admin@hs-cpa.co.uk',            deployedAt: '05 Jan 2025', status: 'Failed',  tenantsCount: 0 },
  { id: 't-007', name: 'Fenwick Moore & Associates',    email: 'ops@fenwickmoore.co.uk',        deployedAt: '03 Jan 2025', status: 'Success', tenantsCount: 12 },
  { id: 't-008', name: 'Chambers & Leigh Tax Advisory', email: 'it@chambersleigh.co.uk',        deployedAt: '02 Jan 2025', status: 'Pending', tenantsCount: 0 },
  { id: 't-009', name: 'Park Lane Financial Consultants', email: 'admin@parklane-fc.co.uk',    deployedAt: '01 Jan 2025', status: 'Success', tenantsCount: 22 },
  { id: 't-010', name: 'Whitmore & Son Chartered Accountants', email: 'admin@whitmoreson.co.uk', deployedAt: '31 Dec 2024', status: 'Warning', tenantsCount: 5 },
];
