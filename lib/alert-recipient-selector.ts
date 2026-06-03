// Pure deterministic function — no DB calls, no side effects, fully testable.

export const ALERT_CATEGORIES = [
  'CompaniesHouseConfirmation',
  'CompaniesHouseAccounts',
  'CorporationTax',
  'VatMtd',
  'Paye',
  'SelfAssessment',
  'GeneralCompliance',
  'SystemNotice',
] as const

export type AlertCategory = (typeof ALERT_CATEGORIES)[number]

export const ESCALATION_THRESHOLDS = {
  noAckHours: 48,
  deadlineDaysWarning: 7,
}

export interface AlertInput {
  id: string
  company: string
  category: AlertCategory
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  deadlineAt: Date | null
  now: Date
}

export interface RecipientInput {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string
  preferredChannel: string
  alertCategories: string[]
  escalationLevel: number
  isActive: boolean
  isSuppressed: boolean
  suppressionReason: string | null
}

export type ExclusionReason =
  | 'INACTIVE'
  | 'SUPPRESSED'
  | 'CATEGORY_NOT_ENABLED'
  | 'ESCALATION_LEVEL_NOT_DUE'
  | 'MISSING_CHANNEL_DETAILS'

export interface SelectionResult {
  selected: RecipientInput[]
  excluded: { recipient: RecipientInput; reason: ExclusionReason }[]
}

export function selectRecipientsForAlert(
  alert: AlertInput,
  recipients: RecipientInput[],
  currentEscalationLevel = 1,
): SelectionResult {
  const selected: RecipientInput[] = []
  const excluded: { recipient: RecipientInput; reason: ExclusionReason }[] = []

  for (const recipient of recipients) {
    // Rule 1: inactive
    if (!recipient.isActive) {
      excluded.push({ recipient, reason: 'INACTIVE' })
      continue
    }

    // Rule 2: suppressed
    if (recipient.isSuppressed) {
      excluded.push({ recipient, reason: 'SUPPRESSED' })
      continue
    }

    // Rule 3: category filter — empty list means all categories
    if (
      recipient.alertCategories.length > 0 &&
      !recipient.alertCategories.includes(alert.category)
    ) {
      excluded.push({ recipient, reason: 'CATEGORY_NOT_ENABLED' })
      continue
    }

    // Rule 4: escalation level — only deliver to recipients at or below the current escalation level
    if (recipient.escalationLevel > currentEscalationLevel) {
      excluded.push({ recipient, reason: 'ESCALATION_LEVEL_NOT_DUE' })
      continue
    }

    // Rule 5: channel details — must have the required contact info for their preferred channel
    if (!hasChannelDetails(recipient)) {
      excluded.push({ recipient, reason: 'MISSING_CHANNEL_DETAILS' })
      continue
    }

    selected.push(recipient)
  }

  return { selected, excluded }
}

export function shouldEscalate(
  alert: AlertInput,
  delivery: { createdAt: Date; status: string; escalationLevel: number },
): boolean {
  const hoursSinceCreation =
    (alert.now.getTime() - delivery.createdAt.getTime()) / 1_000 / 3_600

  if (delivery.status === 'Acknowledged') return false

  if (hoursSinceCreation >= ESCALATION_THRESHOLDS.noAckHours) return true

  if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') return true

  if (alert.deadlineAt) {
    const daysUntilDeadline =
      (alert.deadlineAt.getTime() - alert.now.getTime()) / 1_000 / 3_600 / 24
    if (daysUntilDeadline <= ESCALATION_THRESHOLDS.deadlineDaysWarning) return true
  }

  return false
}

function hasChannelDetails(recipient: RecipientInput): boolean {
  switch (recipient.preferredChannel) {
    case 'Email':
      return !!recipient.email
    case 'Sms':
    case 'WhatsApp':
      return !!recipient.phone
    case 'Dashboard':
      return true
    default:
      return false
  }
}
