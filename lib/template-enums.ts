export const TEMPLATE_CATEGORIES = [
  'Compliance',
  'Outreach',
  'Operations',
  'Finance',
  'Legal',
  'General',
] as const

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]

export function isTemplateCategory(value: unknown): value is TemplateCategory {
  return typeof value === 'string' && TEMPLATE_CATEGORIES.includes(value as TemplateCategory)
}
