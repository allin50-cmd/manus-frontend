// Template variable substitution engine.
// Placeholder syntax: {{variableName}} — double curly braces.

export type TemplateVariableMap = Record<string, string | undefined>

/** Replace every {{key}} in body with variables[key], or '' if missing. */
export function resolveTemplate(body: string, variables: TemplateVariableMap): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '')
}

/** Return the list of unique placeholder names found in a template body. */
export function extractVariables(body: string): string[] {
  const found = new Set<string>()
  for (const m of body.matchAll(/\{\{(\w+)\}\}/g)) {
    found.add(m[1])
  }
  return Array.from(found)
}

/** Format a Date to DD/MM/YYYY for use in template variable maps. */
function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return ''
  const dt = d instanceof Date ? d : new Date(d)
  if (isNaN(dt.getTime())) return String(d)
  return `${String(dt.getUTCDate()).padStart(2, '0')}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}/${dt.getUTCFullYear()}`
}

interface WorkItemLike {
  title?: string | null
  company?: string | null
  contactName?: string | null
  owner?: string | null
  status?: string | null
  notes?: string | null
  dueDate?: Date | string | null
}

interface RecipientLike {
  name?: string | null
  role?: string | null
}

/**
 * Build the standard variable map from a WorkItem + optional AlertRecipient.
 * Used at dispatch time and in template preview.
 */
export function buildVariableMap(
  workItem?: WorkItemLike | null,
  recipient?: RecipientLike | null,
  ackUrl?: string,
): TemplateVariableMap {
  const today = new Date()
  return {
    workItemTitle:  workItem?.title        ?? '',
    company:        workItem?.company      ?? '',
    contactName:    workItem?.contactName  ?? '',
    owner:          workItem?.owner        ?? '',
    status:         workItem?.status       ?? '',
    notes:          workItem?.notes        ?? '',
    dueDate:        fmtDate(workItem?.dueDate),
    recipientName:  recipient?.name        ?? '',
    recipientRole:  recipient?.role        ?? '',
    ackUrl:         ackUrl                 ?? '',
    today:          fmtDate(today),
  }
}
