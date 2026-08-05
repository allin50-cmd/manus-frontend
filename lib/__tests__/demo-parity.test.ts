/**
 * Guards public/funding-finder-demo.html against drifting from the library.
 *
 * The demo re-implements the catalogue and matching rules in plain JavaScript
 * so it can run with no build step. That duplication is deliberate, but it will
 * silently rot the moment lib/funding-sources.ts changes and the demo does not.
 *
 * This test extracts the demo's data and matching functions, runs them against
 * the same profiles as the TypeScript, and asserts identical output. It reads
 * the HTML from disk — no browser, no network.
 */

import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  findFunding,
  FUNDING_SOURCES,
  COMPANY_FUNDING_PROFILES,
  type CompanyFundingProfile,
  type FundingKind,
} from '../funding-sources'

const DEMO_PATH = join(__dirname, '..', '..', 'public', 'funding-finder-demo.html')

interface DemoModule {
  SOURCES: Array<{ id: string; kind: FundingKind; maxAward?: number; verified: boolean }>
  PROFILES: Record<string, Omit<CompanyFundingProfile, 'companyId'>>
  findFunding: (
    profile: CompanyFundingProfile,
    kinds?: FundingKind[] | null,
  ) => {
    matches: Array<{ source: { id: string }; caveats: string[] }>
    excluded: Array<{ source: { id: string }; reasons: string[] }>
    ceilingByKind: Partial<Record<FundingKind, number>>
  }
}

let demo: DemoModule

before(() => {
  const html = readFileSync(DEMO_PATH, 'utf8')
  const script = html.split('<script>')[1]?.split('</script>')[0]
  assert.ok(script, 'demo has no inline <script> block')

  // Everything up to the State section is pure data + matching logic.
  // The DOM layer below it needs a browser and is not under test here.
  const logic = script.split('// ── State ──')[0]
  assert.ok(logic.includes('function findFunding'), 'demo findFunding not found')

  const exported: Partial<DemoModule> = {}
  new Function(
    'exports',
    `${logic}\nexports.SOURCES = SOURCES; exports.PROFILES = PROFILES; exports.findFunding = findFunding;`,
  )(exported)

  demo = exported as DemoModule
})

describe('demo mirrors the library catalogue', () => {
  test('same number of sources', () => {
    assert.equal(demo.SOURCES.length, FUNDING_SOURCES.length)
  })

  test('same source ids', () => {
    assert.deepEqual(
      demo.SOURCES.map((s) => s.id).sort(),
      FUNDING_SOURCES.map((s) => s.id).sort(),
    )
  })

  test('same kind and award ceiling per source', () => {
    for (const lib of FUNDING_SOURCES) {
      const d = demo.SOURCES.find((s) => s.id === lib.id)
      assert.ok(d, `demo is missing '${lib.id}'`)
      assert.equal(d.kind, lib.kind, `${lib.id}: kind`)
      assert.equal(d.maxAward, lib.maxAward, `${lib.id}: maxAward`)
    }
  })

  test('same verification state per source', () => {
    for (const lib of FUNDING_SOURCES) {
      const d = demo.SOURCES.find((s) => s.id === lib.id)!
      assert.equal(d.verified, lib.verified, `${lib.id}: verified`)
    }
  })

  test('same company profiles', () => {
    for (const lib of COMPANY_FUNDING_PROFILES) {
      const d = demo.PROFILES[lib.companyId]
      assert.ok(d, `demo is missing profile '${lib.companyId}'`)
      assert.equal(d.sector, lib.sector, `${lib.companyId}: sector`)
      assert.equal(d.employees, lib.employees, `${lib.companyId}: employees`)
      assert.equal(d.region, lib.region, `${lib.companyId}: region`)
      assert.equal(d.tradingMonths, lib.tradingMonths, `${lib.companyId}: tradingMonths`)
      assert.equal(d.doesRnd, lib.doesRnd, `${lib.companyId}: doesRnd`)
      assert.equal(d.assumed, lib.assumed, `${lib.companyId}: assumed`)
    }
  })
})

describe('demo matching agrees with the library', () => {
  for (const profile of COMPANY_FUNDING_PROFILES) {
    test(`${profile.companyId}: identical matches, exclusions and ceilings`, () => {
      const lib = findFunding(profile)
      const dem = demo.findFunding({ ...profile })

      assert.deepEqual(
        dem.matches.map((m) => m.source.id),
        lib.matches.map((m) => m.source.id),
        'matched ids or their order differ',
      )
      assert.deepEqual(
        dem.excluded.map((e) => e.source.id).sort(),
        lib.excluded.map((e) => e.id).sort(),
        'excluded ids differ',
      )
      assert.deepEqual(dem.ceilingByKind, lib.ceilingByKind, 'ceilings differ')
    })

    test(`${profile.companyId}: identical exclusion reasons`, () => {
      const lib = findFunding(profile)
      const dem = demo.findFunding({ ...profile })
      for (const libEx of lib.excluded) {
        const demEx = dem.excluded.find((e) => e.source.id === libEx.id)
        assert.ok(demEx, `demo did not exclude '${libEx.id}'`)
        assert.deepEqual(demEx.reasons, libEx.reasons, `${libEx.id}: reason text differs`)
      }
    })

    test(`${profile.companyId}: identical caveats per matched scheme`, () => {
      const lib = findFunding(profile)
      const dem = demo.findFunding({ ...profile })
      for (const libMatch of lib.matches) {
        const demMatch = dem.matches.find((m) => m.source.id === libMatch.source.id)!
        assert.deepEqual(
          demMatch.caveats,
          libMatch.caveats,
          `${libMatch.source.id}: caveat text differs`,
        )
      }
    })
  }
})

describe('demo honours the same kinds contract', () => {
  const profile = COMPANY_FUNDING_PROFILES[0]

  test('an empty kinds array yields nothing, matching the library', () => {
    assert.equal(demo.findFunding({ ...profile }, []).matches.length, 0)
    assert.equal(findFunding(profile, []).matches.length, 0)
  })

  test('omitted kinds means every kind', () => {
    const dem = demo.findFunding({ ...profile })
    assert.equal(dem.matches.length + dem.excluded.length, FUNDING_SOURCES.length)
  })

  test('filtering to one kind agrees', () => {
    assert.deepEqual(
      demo.findFunding({ ...profile }, ['equity']).matches.map((m) => m.source.id),
      findFunding(profile, ['equity']).matches.map((m) => m.source.id),
    )
  })
})
