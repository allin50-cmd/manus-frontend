import { describe, it, expect } from 'vitest'
import { inferCategory } from '../alert-dispatch'

describe('inferCategory', () => {
  it('matches confirmation statement', () => {
    expect(inferCategory('Confirmation statement due')).toBe('CompaniesHouseConfirmation')
  })

  it('matches companies house confirm', () => {
    expect(inferCategory('companies house confirm filing overdue')).toBe('CompaniesHouseConfirmation')
  })

  it('matches corporation tax', () => {
    expect(inferCategory('Corporation tax return overdue')).toBe('CorporationTax')
  })

  it('matches ct600', () => {
    expect(inferCategory('CT600 not yet filed')).toBe('CorporationTax')
  })

  it('matches self assessment', () => {
    expect(inferCategory('Self assessment deadline approaching')).toBe('SelfAssessment')
  })

  it('matches sa100', () => {
    expect(inferCategory('SA100 filing required')).toBe('SelfAssessment')
  })

  it('matches companies house account before vat', () => {
    expect(inferCategory('companies house account and vat return due')).toBe('CompaniesHouseAccounts')
  })

  it('matches annual accounts', () => {
    expect(inferCategory('Annual accounts submission')).toBe('CompaniesHouseAccounts')
  })

  it('matches vat', () => {
    expect(inferCategory('VAT return for Q3')).toBe('VatMtd')
  })

  it('matches mtd', () => {
    expect(inferCategory('MTD submission deadline')).toBe('VatMtd')
  })

  it('matches paye', () => {
    expect(inferCategory('PAYE payment due')).toBe('Paye')
  })

  it('matches accounts fallback (no companies house prefix)', () => {
    expect(inferCategory('accounts filing overdue')).toBe('CompaniesHouseAccounts')
  })

  it('vat accounts — companies house account rule beats vat', () => {
    // "companies house account" matches before "vat" so should return CompaniesHouseAccounts
    expect(inferCategory('companies house account vat')).toBe('CompaniesHouseAccounts')
  })

  it('confirmation statement beats corporation tax when both present', () => {
    expect(inferCategory('confirmation statement and corporation tax')).toBe('CompaniesHouseConfirmation')
  })

  it('returns GeneralCompliance for unrecognised notes', () => {
    expect(inferCategory('general review meeting')).toBe('GeneralCompliance')
  })

  it('returns GeneralCompliance for empty string', () => {
    expect(inferCategory('')).toBe('GeneralCompliance')
  })

  it('is case-insensitive for all capitals', () => {
    expect(inferCategory('CORPORATION TAX OVERDUE')).toBe('CorporationTax')
  })

  it('is case-insensitive for mixed case VAT', () => {
    expect(inferCategory('Vat Return Due')).toBe('VatMtd')
  })
})
