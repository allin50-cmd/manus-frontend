import { describe, it, expect } from 'vitest'
import {
  selectRecipientsForAlert,
  shouldEscalate,
  type AlertInput,
  type RecipientInput,
} from '../alert-recipient-selector'

const NOW = new Date('2025-01-15T12:00:00Z')

function makeAlert(overrides: Partial<AlertInput> = {}): AlertInput {
  return {
    id: 'alert-1',
    company: 'ACME Ltd',
    category: 'CorporationTax',
    severity: 'HIGH',
    deadlineAt: new Date('2025-01-30T00:00:00Z'),
    now: NOW,
    ...overrides,
  }
}

function makeRecipient(overrides: Partial<RecipientInput> = {}): RecipientInput {
  return {
    id: 'r-1',
    name: 'Jane Smith',
    email: 'jane@acme.com',
    phone: null,
    role: 'Director',
    preferredChannel: 'Email',
    alertCategories: ['CorporationTax'],
    escalationLevel: 1,
    isActive: true,
    isSuppressed: false,
    suppressionReason: null,
    ...overrides,
  }
}

// ── Test 1 ────────────────────────────────────────────────────────────────────
describe('selectRecipientsForAlert', () => {
  it('selects an active recipient whose category matches', () => {
    const alert = makeAlert()
    const recipient = makeRecipient()
    const result = selectRecipientsForAlert(alert, [recipient])
    expect(result.selected).toHaveLength(1)
    expect(result.selected[0].id).toBe('r-1')
    expect(result.excluded).toHaveLength(0)
  })

  // ── Test 2 ──────────────────────────────────────────────────────────────────
  it('excludes a suppressed recipient with reason SUPPRESSED', () => {
    const alert = makeAlert()
    const recipient = makeRecipient({ isSuppressed: true, suppressionReason: 'On leave' })
    const result = selectRecipientsForAlert(alert, [recipient])
    expect(result.selected).toHaveLength(0)
    expect(result.excluded[0].reason).toBe('SUPPRESSED')
  })

  // ── Test 3 ──────────────────────────────────────────────────────────────────
  it('excludes an inactive recipient with reason INACTIVE', () => {
    const alert = makeAlert()
    const recipient = makeRecipient({ isActive: false })
    const result = selectRecipientsForAlert(alert, [recipient])
    expect(result.selected).toHaveLength(0)
    expect(result.excluded[0].reason).toBe('INACTIVE')
  })

  // ── Test 4 ──────────────────────────────────────────────────────────────────
  it('excludes recipient without required channel details with reason MISSING_CHANNEL_DETAILS', () => {
    const alert = makeAlert()
    const recipient = makeRecipient({ preferredChannel: 'Email', email: null })
    const result = selectRecipientsForAlert(alert, [recipient])
    expect(result.selected).toHaveLength(0)
    expect(result.excluded[0].reason).toBe('MISSING_CHANNEL_DETAILS')
  })

  // ── Test 5 ──────────────────────────────────────────────────────────────────
  it('selects level-1 recipient when current escalation is 1', () => {
    const alert = makeAlert()
    const r1 = makeRecipient({ id: 'r-1', escalationLevel: 1 })
    const r2 = makeRecipient({ id: 'r-2', escalationLevel: 2 })
    const result = selectRecipientsForAlert(alert, [r1, r2], 1)
    expect(result.selected.map((r) => r.id)).toEqual(['r-1'])
    const excluded = result.excluded.find((e) => e.recipient.id === 'r-2')
    expect(excluded?.reason).toBe('ESCALATION_LEVEL_NOT_DUE')
  })

  // ── Test 6 ──────────────────────────────────────────────────────────────────
  it('selects higher-level recipients when escalation level is raised', () => {
    const alert = makeAlert()
    const r1 = makeRecipient({ id: 'r-1', escalationLevel: 1 })
    const r2 = makeRecipient({ id: 'r-2', escalationLevel: 2, email: 'mgr@acme.com' })
    const result = selectRecipientsForAlert(alert, [r1, r2], 2)
    expect(result.selected.map((r) => r.id)).toContain('r-1')
    expect(result.selected.map((r) => r.id)).toContain('r-2')
    expect(result.excluded).toHaveLength(0)
  })

  // ── Test 7 ──────────────────────────────────────────────────────────────────
  it('excludes recipient whose category list does not contain the alert category', () => {
    const alert = makeAlert({ category: 'Paye' })
    const recipient = makeRecipient({ alertCategories: ['CorporationTax', 'VatMtd'] })
    const result = selectRecipientsForAlert(alert, [recipient])
    expect(result.selected).toHaveLength(0)
    expect(result.excluded[0].reason).toBe('CATEGORY_NOT_ENABLED')
  })

  // ── Test 8 ──────────────────────────────────────────────────────────────────
  it('selects recipient whose alertCategories is empty (meaning all categories)', () => {
    const alert = makeAlert({ category: 'Paye' })
    const recipient = makeRecipient({ alertCategories: [] })
    const result = selectRecipientsForAlert(alert, [recipient])
    expect(result.selected).toHaveLength(1)
  })

  // ── Test 9 ──────────────────────────────────────────────────────────────────
  it('handles dashboard channel without requiring email or phone', () => {
    const alert = makeAlert()
    const recipient = makeRecipient({
      preferredChannel: 'Dashboard',
      email: null,
      phone: null,
    })
    const result = selectRecipientsForAlert(alert, [recipient])
    expect(result.selected).toHaveLength(1)
  })

  // ── Test 10 ─────────────────────────────────────────────────────────────────
  it('returns empty selected and all excluded when no recipients qualify', () => {
    const alert = makeAlert()
    const recipients = [
      makeRecipient({ id: 'r-1', isActive: false }),
      makeRecipient({ id: 'r-2', isSuppressed: true }),
      makeRecipient({ id: 'r-3', alertCategories: ['VatMtd'] }),
    ]
    const result = selectRecipientsForAlert(alert, recipients)
    expect(result.selected).toHaveLength(0)
    expect(result.excluded).toHaveLength(3)
  })
})

// ── shouldEscalate tests ───────────────────────────────────────────────────────
describe('shouldEscalate', () => {
  it('triggers escalation after 48 hours of no acknowledgement', () => {
    const alert = makeAlert({ now: new Date('2025-01-17T13:00:00Z') })
    const delivery = {
      createdAt: new Date('2025-01-15T12:00:00Z'),
      sentAt: new Date('2025-01-15T12:00:00Z'),
      status: 'Sent',
      escalationLevel: 1,
    }
    expect(shouldEscalate(alert, delivery)).toBe(true)
  })

  it('does not escalate an acknowledged delivery', () => {
    const alert = makeAlert({ now: new Date('2025-01-17T13:00:00Z') })
    const delivery = {
      createdAt: new Date('2025-01-15T12:00:00Z'),
      sentAt: new Date('2025-01-15T12:00:00Z'),
      status: 'Acknowledged',
      escalationLevel: 1,
    }
    expect(shouldEscalate(alert, delivery)).toBe(false)
  })

  it('triggers escalation when deadline is within 7 days', () => {
    const alert = makeAlert({
      now: new Date('2025-01-25T00:00:00Z'),
      deadlineAt: new Date('2025-01-30T00:00:00Z'),
      severity: 'LOW',
    })
    const delivery = {
      createdAt: new Date('2025-01-25T00:00:00Z'),
      sentAt: new Date('2025-01-25T00:00:00Z'),
      status: 'Sent',
      escalationLevel: 1,
    }
    expect(shouldEscalate(alert, delivery)).toBe(true)
  })

  it('does not escalate HIGH severity before the 24-hour window', () => {
    const alert = makeAlert({
      now: new Date('2025-01-15T20:00:00Z'),
      severity: 'HIGH',
    })
    const delivery = {
      createdAt: new Date('2025-01-15T12:00:00Z'),
      sentAt: new Date('2025-01-15T12:00:00Z'),
      status: 'Sent',
      escalationLevel: 1,
    }
    // Only 8 hours since sent — should NOT escalate yet
    expect(shouldEscalate(alert, delivery)).toBe(false)
  })

  it('escalates HIGH severity after the 24-hour window', () => {
    const alert = makeAlert({
      now: new Date('2025-01-16T13:00:00Z'),
      severity: 'HIGH',
    })
    const delivery = {
      createdAt: new Date('2025-01-15T12:00:00Z'),
      sentAt: new Date('2025-01-15T12:00:00Z'),
      status: 'Sent',
      escalationLevel: 1,
    }
    // 25 hours since sent — should escalate
    expect(shouldEscalate(alert, delivery)).toBe(true)
  })

  it('uses sentAt not createdAt when delivery was delayed before sending', () => {
    const alert = makeAlert({ now: new Date('2025-01-17T00:00:00Z') })
    const delivery = {
      // Created 49h ago but only sent 1h ago
      createdAt: new Date('2025-01-14T23:00:00Z'),
      sentAt: new Date('2025-01-16T23:00:00Z'),
      status: 'Sent',
      escalationLevel: 1,
    }
    // Only 1h since sent — should NOT escalate despite 49h since creation
    expect(shouldEscalate(alert, delivery)).toBe(false)
  })
})
