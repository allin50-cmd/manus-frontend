export type BFDepartment =
  | 'Executive'
  | 'Sales'
  | 'Operations'
  | 'Finance'
  | 'Compliance'
  | 'Documents'
  | 'Technology'
  | 'Marketing'
  | 'Support'

export type BFStatus = 'planned' | 'beta' | 'live'

export type BFOwner = 'Jobe' | 'Devin' | 'Lola' | 'Vincent' | 'Adonis'

export interface BusinessFunction {
  id: string
  name: string
  description: string
  department: BFDepartment
  status: BFStatus
  owner: BFOwner
  app?: string        // app id from APP_REGISTRY this function surfaces in
  watches?: string[]  // os_* or fg_* tables this function reads
  writesTo?: string[] // os_* or fg_* tables this function writes
}

export const BUSINESS_FUNCTION_REGISTRY: BusinessFunction[] = [
  // ── Executive ──────────────────────────────────────────────────────────────
  {
    id: 'business-health',
    name: 'Business Health',
    description: 'Cross-module signal aggregation — revenue, tasks, alerts, and compliance status in one view.',
    department: 'Executive',
    status: 'planned',
    owner: 'Jobe',
    watches: ['os_work_items', 'os_alerts', 'ut_daily_metrics', 'fg_alerts'],
  },
  {
    id: 'kpi-dashboard',
    name: 'KPI Dashboard',
    description: 'Key performance indicators tracked against targets across all departments.',
    department: 'Executive',
    status: 'planned',
    owner: 'Jobe',
    watches: ['ut_daily_metrics', 'ut_weekly_reports'],
  },
  {
    id: 'decision-register',
    name: 'Decision Register',
    description: 'Log and track decisions, escalations, and outcomes.',
    department: 'Executive',
    status: 'planned',
    owner: 'Jobe',
    watches: ['os_decisions'],
    writesTo: ['os_decisions'],
  },

  // ── Sales ──────────────────────────────────────────────────────────────────
  {
    id: 'lead-capture',
    name: 'Lead Capture',
    description: 'Inbound lead intake, qualification, and routing to the pipeline.',
    department: 'Sales',
    status: 'planned',
    owner: 'Devin',
    watches: ['os_leads'],
    writesTo: ['os_leads', 'os_work_items'],
  },
  {
    id: 'quote-builder',
    name: 'Quote Builder',
    description: 'Build, send, and track quotes from first contact to acceptance.',
    department: 'Sales',
    status: 'beta',
    owner: 'Devin',
    app: 'business-anywhere',
    watches: ['os_quotes', 'os_contacts'],
    writesTo: ['os_quotes'],
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Contact and company relationship management — history, notes, and next actions.',
    department: 'Sales',
    status: 'planned',
    owner: 'Devin',
    watches: ['os_contacts', 'os_people', 'os_calls'],
    writesTo: ['os_contacts', 'os_people'],
  },
  {
    id: 'follow-ups',
    name: 'Follow-ups',
    description: 'Scheduled and triggered follow-up actions on leads, quotes, and open work.',
    department: 'Sales',
    status: 'planned',
    owner: 'Devin',
    watches: ['os_leads', 'os_quotes', 'os_tasks'],
    writesTo: ['os_tasks'],
  },

  // ── Operations ─────────────────────────────────────────────────────────────
  {
    id: 'scheduler',
    name: 'Scheduler',
    description: 'Appointment booking, job scheduling, and resource allocation.',
    department: 'Operations',
    status: 'planned',
    owner: 'Lola',
    app: 'business-anywhere',
    watches: ['os_work_items', 'os_tasks'],
    writesTo: ['os_tasks'],
  },
  {
    id: 'job-tracker',
    name: 'Job Tracker',
    description: 'Active job progress, site visits, status updates, and completion sign-off.',
    department: 'Operations',
    status: 'beta',
    owner: 'Lola',
    app: 'business-anywhere',
    watches: ['os_work_items', 'os_tasks'],
    writesTo: ['os_work_items'],
  },
  {
    id: 'procurement',
    name: 'Procurement',
    description: 'Purchase requests, supplier management, and cost tracking.',
    department: 'Operations',
    status: 'planned',
    owner: 'Lola',
    watches: ['os_work_items'],
    writesTo: ['os_work_items'],
  },
  {
    id: 'workforce',
    name: 'Workforce',
    description: 'Staff availability, assignments, and capacity planning.',
    department: 'Operations',
    status: 'planned',
    owner: 'Lola',
    watches: ['os_people', 'os_tasks'],
    writesTo: ['os_tasks'],
  },

  // ── Finance ────────────────────────────────────────────────────────────────
  {
    id: 'invoicing',
    name: 'Invoicing',
    description: 'Invoice generation, delivery, and payment status tracking.',
    department: 'Finance',
    status: 'planned',
    owner: 'Vincent',
    watches: ['os_invoices', 'os_quotes'],
    writesTo: ['os_invoices'],
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow',
    description: 'Inbound and outbound cash visibility — invoiced, received, and outstanding.',
    department: 'Finance',
    status: 'planned',
    owner: 'Vincent',
    watches: ['os_invoices'],
  },
  {
    id: 'expenses',
    name: 'Expenses',
    description: 'Expense capture, categorisation, and approval.',
    department: 'Finance',
    status: 'planned',
    owner: 'Vincent',
    watches: ['os_work_items'],
    writesTo: ['os_work_items'],
  },

  // ── Compliance ─────────────────────────────────────────────────────────────
  {
    id: 'fineguard-compliance',
    name: 'FineGuard',
    description: 'Companies House deadline monitoring, filing alerts, and compliance audit trail.',
    department: 'Compliance',
    status: 'live',
    owner: 'Adonis',
    app: 'fineguard',
    watches: ['fg_companies', 'fg_alerts', 'fg_audit_runs'],
    writesTo: ['fg_alerts', 'fg_audit_runs'],
  },
  {
    id: 'companies-house',
    name: 'Companies House',
    description: 'Direct Companies House data lookup and filing history.',
    department: 'Compliance',
    status: 'live',
    owner: 'Adonis',
    app: 'fineguard',
    watches: ['fg_companies'],
  },
  {
    id: 'hmrc',
    name: 'HMRC',
    description: 'VAT, PAYE, and self-assessment deadline tracking.',
    department: 'Compliance',
    status: 'planned',
    owner: 'Adonis',
    watches: ['os_alerts'],
    writesTo: ['os_alerts'],
  },

  // ── Documents ──────────────────────────────────────────────────────────────
  {
    id: 'vaultline',
    name: 'VaultLine',
    description: 'Secure document storage, review workflow, and retention controls.',
    department: 'Documents',
    status: 'planned',
    owner: 'Adonis',
    app: 'vaultline',
    watches: ['os_documents'],
    writesTo: ['os_documents', 'os_alerts'],
  },
  {
    id: 'contracts',
    name: 'Contracts',
    description: 'Contract lifecycle — draft, sign, store, and renewal alerts.',
    department: 'Documents',
    status: 'planned',
    owner: 'Adonis',
    watches: ['os_documents'],
    writesTo: ['os_documents', 'os_alerts'],
  },

  // ── Technology ─────────────────────────────────────────────────────────────
  {
    id: 'deployments',
    name: 'Deployments',
    description: 'Deployment tracking, release notes, and rollback log.',
    department: 'Technology',
    status: 'planned',
    owner: 'Jobe',
    watches: ['ut_activity_events'],
    writesTo: ['ut_activity_events'],
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    description: 'Uptime, error rates, and system health alerts.',
    department: 'Technology',
    status: 'planned',
    owner: 'Jobe',
    watches: ['os_alerts'],
    writesTo: ['os_alerts'],
  },

  // ── Marketing ──────────────────────────────────────────────────────────────
  {
    id: 'campaigns',
    name: 'Campaigns',
    description: 'Marketing campaign tracking, lead attribution, and conversion measurement.',
    department: 'Marketing',
    status: 'planned',
    owner: 'Lola',
    watches: ['os_leads', 'ut_activity_events'],
    writesTo: ['os_leads'],
  },

  // ── Support ────────────────────────────────────────────────────────────────
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Support ticket intake, triage, and resolution tracking.',
    department: 'Support',
    status: 'planned',
    owner: 'Devin',
    watches: ['os_work_items', 'os_messages', 'os_alerts'],
    writesTo: ['os_work_items', 'os_tasks'],
  },
]

export function getBusinessFunction(id: string): BusinessFunction | undefined {
  return BUSINESS_FUNCTION_REGISTRY.find((f) => f.id === id)
}

export function getBusinessFunctionsByDepartment(department: BFDepartment): BusinessFunction[] {
  return BUSINESS_FUNCTION_REGISTRY.filter((f) => f.department === department)
}

export function getBusinessFunctionsByOwner(owner: BFOwner): BusinessFunction[] {
  return BUSINESS_FUNCTION_REGISTRY.filter((f) => f.owner === owner)
}

export function getBusinessFunctionsByApp(appId: string): BusinessFunction[] {
  return BUSINESS_FUNCTION_REGISTRY.filter((f) => f.app === appId)
}
