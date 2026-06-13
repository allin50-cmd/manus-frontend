import { describe, it, expect } from 'vitest'
import {
  isValidType,
  isValidStatus,
  isValidPriority,
  WORK_ITEM_TYPES,
  WORK_ITEM_STATUSES,
  PRIORITIES,
} from '../work-item-enums'

describe('isValidType', () => {
  it('accepts every canonical type', () => {
    for (const t of WORK_ITEM_TYPES) {
      expect(isValidType(t)).toBe(true)
    }
  })

  it('rejects a label form (with space)', () => {
    expect(isValidType('Construction Lead')).toBe(false)
  })

  it('rejects wrong case', () => {
    expect(isValidType('partnership')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidType('')).toBe(false)
  })

  it('rejects number', () => {
    expect(isValidType(42)).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidType(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isValidType(undefined)).toBe(false)
  })

  it('rejects an unknown string', () => {
    expect(isValidType('Bogus')).toBe(false)
  })
})

describe('isValidStatus', () => {
  it('accepts every canonical status', () => {
    for (const s of WORK_ITEM_STATUSES) {
      expect(isValidStatus(s)).toBe(true)
    }
  })

  it('accepts Waiting (schema value)', () => {
    expect(isValidStatus('Waiting')).toBe(true)
  })

  it('rejects Awaiting (not a schema value)', () => {
    expect(isValidStatus('Awaiting')).toBe(false)
  })

  it('rejects label form (with space)', () => {
    expect(isValidStatus('In Progress')).toBe(false)
  })

  it('rejects wrong case', () => {
    expect(isValidStatus('inprogress')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidStatus('')).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidStatus(null)).toBe(false)
  })

  it('rejects an unknown string', () => {
    expect(isValidStatus('Deleted')).toBe(false)
  })
})

describe('isValidPriority', () => {
  it('accepts every canonical priority', () => {
    for (const p of PRIORITIES) {
      expect(isValidPriority(p)).toBe(true)
    }
  })

  it('rejects wrong case', () => {
    expect(isValidPriority('high')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidPriority('')).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidPriority(null)).toBe(false)
  })

  it('rejects a number', () => {
    expect(isValidPriority(1)).toBe(false)
  })

  it('accepts Urgent (schema value)', () => {
    expect(isValidPriority('Urgent')).toBe(true)
  })

  it('rejects Critical (not a schema value)', () => {
    expect(isValidPriority('Critical')).toBe(false)
  })

  it('rejects an unknown string', () => {
    expect(isValidPriority('Bogus')).toBe(false)
  })
})
