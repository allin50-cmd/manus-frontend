/**
 * Unit tests for the funding finder matching engine.
 *
 * Run with:  npm run test:unit
 * Uses Node's built-in test runner via tsx — no test framework dependency.
 *
 * These cover pure logic only. No DB, no network, no env vars required.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  findFunding,
  checkEligibility,
  validateProfile,
  auditCatalogue,
  monthsSince,
  getFundingProfile,
  getFundingSource,
  FUNDING_SOURCES,
  COMPANY_FUNDING_PROFILES,
  STALE_AFTER_MONTHS,
  type CompanyFundingProfile,
  type FundingSource,
} from '../funding-sources'

const baseProfile: CompanyFundingProfile = {
  companyId: 'test-co',
  sector: 'software',
  employees: 5,
  region: 'unknown',
  tradingMonths: 24,
  doesRnd: true,
  assumed: false,
}

const source = (over: Partial<FundingSource> = {}): FundingSource => ({
  id: 'test-source',
  name: 'Test Source',
  provider: 'Test Provider',
  kind: 'grant',
  window: 'open',
  summary: 'A test scheme.',
  reviewUrl: 'https://example.gov.uk/scheme',
  lastReviewed: '2026-05',
  verified: false,
  eligibility: {},
  ...over,
})

// ── Catalogue integrity ───────────────────────────────────────────────────────

describe('catalogue integrity', () => {
  test('ships with no structural issues', () => {
    assert.deepEqual(auditCatalogue().issues, [])
  })

  test('every source id is unique', () => {
    const ids = FUNDING_SOURCES.map((s) => s.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  test('every company profile id is unique', () => {
    const ids = COMPANY_FUNDING_PROFILES.map((p) => p.companyId)
    assert.equal(new Set(ids).size, ids.length)
  })

  test('every source has an https review url', () => {
    for (const s of FUNDING_SOURCES) assert.match(s.reviewUrl, /^https:\/\//, s.id)
  })

  test('award ranges are ordered where both are present', () => {
    for (const s of FUNDING_SOURCES) {
      if (s.minAward !== undefined && s.maxAward !== undefined) {
        assert.ok(s.minAward <= s.maxAward, `${s.id}: min above max`)
      }
    }
  })

  test('detects duplicate ids', () => {
    const dup = auditCatalogue([source(), source()])
    assert.ok(dup.issues.some((i) => i.includes('Duplicate source id')))
  })

  test('detects inverted award range', () => {
    const bad = auditCatalogue([source({ minAward: 100, maxAward: 10 })])
    assert.ok(bad.issues.some((i) => i.includes('above maxAward')))
  })

  test('detects non-https review url', () => {
    const bad = auditCatalogue([source({ reviewUrl: 'http://insecure.example' })])
    assert.ok(bad.issues.some((i) => i.includes('not an https URL')))
  })

  test('detects unparseable lastReviewed', () => {
    const bad = auditCatalogue([source({ lastReviewed: 'whenever' })])
    assert.ok(bad.issues.some((i) => i.includes('unparseable lastReviewed')))
  })
})

// ── Staleness ─────────────────────────────────────────────────────────────────

describe('monthsSince', () => {
  test('counts whole months across a year boundary', () => {
    assert.equal(monthsSince('2026-05', new Date('2026-08-15')), 3)
    assert.equal(monthsSince('2025-01', new Date('2026-08-15')), 19)
  })

  test('returns 0 in the same month', () => {
    assert.equal(monthsSince('2026-08', new Date('2026-08-01')), 0)
  })

  test('rejects malformed and out-of-range input', () => {
    assert.equal(monthsSince('garbage'), null)
    assert.equal(monthsSince('2026-13'), null)
    assert.equal(monthsSince('2026-00'), null)
    assert.equal(monthsSince('202605'), null)
  })
})

describe('staleness', () => {
  test('is not stale inside the threshold', () => {
    const h = auditCatalogue([source({ lastReviewed: '2026-06' })], new Date('2026-08-01'))
    assert.equal(h.stale, false)
  })

  test('goes stale past the threshold', () => {
    const h = auditCatalogue([source({ lastReviewed: '2026-01' })], new Date('2027-06-01'))
    assert.ok(h.oldestMonths !== null && h.oldestMonths > STALE_AFTER_MONTHS)
    assert.equal(h.stale, true)
  })
})

// ── Profile validation ────────────────────────────────────────────────────────

describe('validateProfile', () => {
  test('accepts a well-formed profile', () => {
    assert.deepEqual(validateProfile(baseProfile), [])
  })

  const rejects: Array<[string, Partial<CompanyFundingProfile>]> = [
    ['negative employees',        { employees: -1 }],
    ['fractional employees',      { employees: 1.5 }],
    ['NaN employees',             { employees: NaN }],
    ['implausible employees',     { employees: 999_999 }],
    ['negative trading months',   { tradingMonths: -1 }],
    ['implausible trading months',{ tradingMonths: 99_999 }],
    ['unknown sector',            { sector: 'banana' as never }],
    ['empty region',              { region: '' }],
    ['whitespace region',         { region: '   ' }],
    ['non-boolean doesRnd',       { doesRnd: 'yes' as never }],
  ]

  for (const [label, patch] of rejects) {
    test(`rejects ${label}`, () => {
      assert.ok(validateProfile(patch).length > 0, label)
    })
  }

  test('ignores fields that are absent', () => {
    assert.deepEqual(validateProfile({}), [])
  })
})

// ── Eligibility rules ─────────────────────────────────────────────────────────

describe('checkEligibility', () => {
  test('blocks on sector mismatch', () => {
    const { blocking } = checkEligibility(source({ eligibility: { sectors: ['construction'] } }), baseProfile)
    assert.ok(blocking.some((b) => b.includes('Restricted to construction')))
  })

  test('allows a sector-restricted scheme when the sector matches', () => {
    const { blocking } = checkEligibility(
      source({ eligibility: { sectors: ['software'] } }), baseProfile)
    assert.deepEqual(blocking, [])
  })

  test('blocks when headcount exceeds the cap', () => {
    const { blocking } = checkEligibility(
      source({ eligibility: { maxEmployees: 4 } }), baseProfile)
    assert.ok(blocking.some((b) => b.includes('fewer than 4 employees')))
  })

  test('treats the headcount cap as inclusive', () => {
    const { blocking } = checkEligibility(
      source({ eligibility: { maxEmployees: 5 } }), baseProfile)
    assert.deepEqual(blocking, [])
  })

  test('blocks when too young or too old', () => {
    assert.ok(checkEligibility(source({ eligibility: { minTradingMonths: 36 } }), baseProfile).blocking.length > 0)
    assert.ok(checkEligibility(source({ eligibility: { maxTradingMonths: 12 } }), baseProfile).blocking.length > 0)
  })

  test('blocks R&D schemes for a non-R&D company', () => {
    const { blocking } = checkEligibility(
      source({ eligibility: { requiresRnd: true } }), { ...baseProfile, doesRnd: false })
    assert.ok(blocking.some((b) => b.includes('qualifying R&D')))
  })

  test('blocks a closed scheme', () => {
    const { blocking } = checkEligibility(source({ window: 'closed' }), baseProfile)
    assert.ok(blocking.some((b) => b.includes('closed')))
  })

  test('region is a caveat when unknown, never a blocker', () => {
    const s = source({ eligibility: { regions: ['North West'] } })
    const { blocking, caveats } = checkEligibility(s, { ...baseProfile, region: 'unknown' })
    assert.deepEqual(blocking, [])
    assert.ok(caveats.some((c) => c.includes('Regional scheme')))
  })

  test('region blocks once it is known and does not match', () => {
    const s = source({ eligibility: { regions: ['North West'] } })
    const { blocking } = checkEligibility(s, { ...baseProfile, region: 'London' })
    assert.ok(blocking.some((b) => b.includes('Not available in London')))
  })

  test('manual checks surface as caveats, not blockers', () => {
    const s = source({ eligibility: { manualChecks: ['Founder must be under 30'] } })
    const { blocking, caveats } = checkEligibility(s, baseProfile)
    assert.deepEqual(blocking, [])
    assert.deepEqual(caveats, ['Founder must be under 30'])
  })

  test('does not repeat the profile-level assumed flag per scheme', () => {
    const { caveats } = checkEligibility(source(), { ...baseProfile, assumed: true })
    assert.ok(!caveats.some((c) => c.includes('assumed')),
      'assumed is a company property and must be surfaced once by the caller')
  })
})

// ── findFunding ───────────────────────────────────────────────────────────────

describe('findFunding', () => {
  test('omitted kinds means every kind', () => {
    assert.equal(findFunding(baseProfile).matches.length + findFunding(baseProfile).excluded.length,
      FUNDING_SOURCES.length)
  })

  test('an empty kinds array yields no results, not everything', () => {
    const r = findFunding(baseProfile, [])
    assert.deepEqual(r.matches, [])
    assert.deepEqual(r.excluded, [])
  })

  test('filters to the requested kinds', () => {
    const r = findFunding(baseProfile, ['equity'])
    assert.ok(r.matches.every((m) => m.source.kind === 'equity'))
    assert.ok(r.matches.length > 0)
  })

  test('sorts matches by max award, highest first', () => {
    const awards = findFunding(baseProfile).matches.map((m) => m.source.maxAward ?? 0)
    assert.deepEqual(awards, [...awards].sort((a, b) => b - a))
  })

  test('ceilingByKind never mixes kinds and omits non-cash schemes', () => {
    const r = findFunding(baseProfile)
    for (const [kind, total] of Object.entries(r.ceilingByKind)) {
      const expected = r.matches
        .filter((m) => m.source.kind === kind && m.source.maxAward !== undefined)
        .reduce((sum, m) => sum + (m.source.maxAward ?? 0), 0)
      assert.equal(total, expected, kind)
    }
    assert.ok(!('support' in r.ceilingByKind), 'support schemes carry no award')
  })

  test('indicativeCeiling equals the sum of ceilingByKind', () => {
    const r = findFunding(baseProfile)
    const summed = Object.values(r.ceilingByKind).reduce((a, b) => a + b, 0)
    assert.equal(r.indicativeCeiling, summed)
  })

  test('rejects an invalid profile instead of matching against it', () => {
    const r = findFunding({ ...baseProfile, employees: -5 })
    assert.ok(r.profileErrors.length > 0)
    assert.deepEqual(r.matches, [])
    assert.deepEqual(r.excluded, [])
    assert.equal(r.indicativeCeiling, 0)
  })

  test('a valid profile reports no profile errors', () => {
    assert.deepEqual(findFunding(baseProfile).profileErrors, [])
  })

  test('counts unverified matches', () => {
    const r = findFunding(baseProfile)
    assert.equal(r.unverifiedMatches, r.matches.filter((m) => !m.source.verified).length)
  })

  test('every source is either matched or excluded, never both or neither', () => {
    const r = findFunding(baseProfile)
    const ids = [...r.matches.map((m) => m.source.id), ...r.excluded.map((e) => e.id)]
    assert.equal(new Set(ids).size, ids.length, 'a source appeared twice')
    assert.equal(ids.length, FUNDING_SOURCES.length, 'a source was dropped')
  })

  test('every exclusion carries at least one reason', () => {
    for (const e of findFunding({ ...baseProfile, doesRnd: false }).excluded) {
      assert.ok(e.reasons.length > 0, e.id)
    }
  })
})

// ── Registered ventures ───────────────────────────────────────────────────────

describe('registered company profiles', () => {
  for (const profile of COMPANY_FUNDING_PROFILES) {
    test(`${profile.companyId} has a valid, matchable profile`, () => {
      assert.deepEqual(validateProfile(profile), [])
      const r = findFunding(profile)
      assert.deepEqual(r.profileErrors, [])
      assert.ok(r.matches.length > 0, 'expected at least one match')
    })
  }

  test('R&D gating separates the software ventures from the rest', () => {
    const rnd = findFunding(getFundingProfile('ultratech')!)
    const noRnd = findFunding(getFundingProfile('builder-big-jobs')!)
    assert.ok((rnd.ceilingByKind.grant ?? 0) > (noRnd.ceilingByKind.grant ?? 0),
      'an R&D company should reach a higher grant ceiling')
  })

  test('CITB is construction-only', () => {
    assert.ok(findFunding(getFundingProfile('builder-big-jobs')!)
      .matches.some((m) => m.source.id === 'citb-grants'))
    assert.ok(findFunding(getFundingProfile('ultratech')!)
      .excluded.some((e) => e.id === 'citb-grants'))
  })
})

// ── Lookups ───────────────────────────────────────────────────────────────────

describe('lookups', () => {
  test('resolve known ids and return undefined for unknown ones', () => {
    assert.ok(getFundingSource('seis'))
    assert.equal(getFundingSource('nope'), undefined)
    assert.ok(getFundingProfile('ultratech'))
    assert.equal(getFundingProfile('nope'), undefined)
  })
})
