/**
 * UK funding source catalogue and deterministic eligibility matching.
 *
 * Pure data and pure functions — no DB, no network, no async. Consumed by the
 * 'funding-finder' business function runner in lib/function-engine.ts.
 *
 * Award amounts, application windows, and eligibility rules change frequently.
 * Every entry carries `reviewUrl` and `lastReviewed`. Figures here are
 * indicative and must be confirmed against the provider before being used in
 * an application. See docs/funding-finder.md.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type FundingKind = 'grant' | 'loan' | 'tax-relief' | 'training' | 'equity' | 'support'

export type FundingSector =
  | 'software'
  | 'construction'
  | 'professional-services'
  | 'manufacturing'
  | 'any'

/** 'periodic' = opens in competition rounds; 'rolling' = apply any time. */
export type FundingWindow = 'open' | 'rolling' | 'periodic' | 'closed'

export interface FundingEligibility {
  /** Omitted means all sectors qualify. */
  sectors?: FundingSector[]
  minEmployees?: number
  maxEmployees?: number
  minTradingMonths?: number
  maxTradingMonths?: number
  /** True when the scheme requires qualifying R&D activity. */
  requiresRnd?: boolean
  /** Omitted means UK-wide. Values are English regions or home nations. */
  regions?: string[]
  /** Free-text conditions the matcher cannot evaluate — surfaced as caveats. */
  manualChecks?: string[]
}

export interface FundingSource {
  id: string
  name: string
  provider: string
  kind: FundingKind
  window: FundingWindow
  /** Indicative minimum award in GBP. Omitted for non-cash support. */
  minAward?: number
  /** Indicative maximum award in GBP. Omitted for non-cash support. */
  maxAward?: number
  summary: string
  reviewUrl: string
  /** YYYY-MM the entry's figures were last recorded. */
  lastReviewed: string
  /**
   * True only once a human has opened `reviewUrl` and confirmed the award
   * range, window, and eligibility rules against the provider's own page.
   *
   * Every entry currently ships `false`: the figures were written from prior
   * knowledge, never checked at source. Do not flip this without actually
   * looking. `runFunction` warns while any matched source is unverified.
   */
  verified: boolean
  eligibility: FundingEligibility
}

export interface CompanyFundingProfile {
  companyId: string
  sector: FundingSector
  employees: number
  /** English region or home nation. 'unknown' relaxes regional matching. */
  region: string
  tradingMonths: number
  doesRnd: boolean
  /** True when values are inferred rather than confirmed by the operator. */
  assumed: boolean
}

export interface FundingMatch {
  source: FundingSource
  /** Conditions the matcher could not evaluate from the profile. */
  caveats: string[]
}

export interface FundingExclusion {
  id: string
  name: string
  reasons: string[]
}

export interface FundingSearchResult {
  companyId: string
  profile: CompanyFundingProfile
  matches: FundingMatch[]
  excluded: FundingExclusion[]
  /**
   * Indicative maximum by scheme kind. Grants, debt, and equity are different
   * kinds of money and must not be presented as one total — read this, not
   * `indicativeCeiling`, when reporting to anyone.
   */
  ceilingByKind: Partial<Record<FundingKind, number>>
  /**
   * Sum of maxAward across every matched scheme. Not achievable in practice:
   * schemes compete, most need match funding, and equity dilutes. Present only
   * as an upper bound on the search space.
   */
  indicativeCeiling: number
  /** Matched sources not yet confirmed against their provider. */
  unverifiedMatches: number
  /**
   * Validation failures on the profile itself. Non-empty means no matching was
   * attempted and every list above is empty — render these instead of results.
   */
  profileErrors: string[]
}

// ── Funding source catalogue ──────────────────────────────────────────────────

const REVIEWED = '2026-05'

export const FUNDING_SOURCES: FundingSource[] = [
  // ── Innovation grants ──────────────────────────────────────────────────────
  {
    id: 'innovate-uk-smart-grants',
    name: 'Smart Grants',
    provider: 'Innovate UK',
    kind: 'grant',
    window: 'closed',
    minAward: 100_000,
    maxAward: 2_000_000,
    summary: 'PAUSED. Innovate UK paused Smart Grants in January 2025 with no rounds in 2025/26 and no named replacement as of August 2026. Themed and challenge-led competitions continue — check the live competition list instead.',
    reviewUrl: 'https://apply-for-innovation-funding.service.gov.uk/competition/search',
    lastReviewed: '2026-08',
    verified: true,
    eligibility: {
      requiresRnd: true,
      manualChecks: [
        'Project must be genuinely novel R&D, not product completion or rollout',
        'Grant covers a percentage of project cost — match funding required',
        'Competition rounds open periodically; check current round dates',
      ],
    },
  },
  {
    id: 'innovate-uk-investor-partnerships',
    name: 'Investor Partnerships',
    provider: 'Innovate UK',
    kind: 'grant',
    window: 'periodic',
    minAward: 250_000,
    maxAward: 2_000_000,
    summary: 'Grant funding matched by private investment from an approved investor partner.',
    reviewUrl: 'https://iuk-business-connect.org.uk/programme/investor-partnerships/',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      requiresRnd: true,
      manualChecks: [
        'Requires a committed investor from the Innovate UK approved partner list',
        'Company must be seeking equity investment alongside the grant',
      ],
    },
  },
  {
    id: 'ktp',
    name: 'Knowledge Transfer Partnership',
    provider: 'Innovate UK / UKRI',
    kind: 'grant',
    window: 'periodic',
    minAward: 30_000,
    maxAward: 200_000,
    summary: 'Part-funds a graduate associate plus academic supervision to embed new capability in the business over 12–36 months.',
    reviewUrl: 'https://www.ktp-uk.org/',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      minTradingMonths: 12,
      manualChecks: [
        'Requires a university partner willing to co-apply',
        'SMEs typically fund around a third of project cost; grant covers the rest',
      ],
    },
  },
  {
    id: 'young-innovators',
    name: 'Young Innovators Awards',
    provider: 'Innovate UK',
    kind: 'grant',
    window: 'periodic',
    minAward: 5_000,
    maxAward: 10_000,
    summary: 'Grant plus living allowance and mentoring for founders aged 18–30 with a socially or environmentally motivated business idea.',
    reviewUrl: 'https://iuk-business-connect.org.uk/programme/young-innovators/',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      manualChecks: ['Applicant founder must be aged 18–30 at the application deadline'],
    },
  },

  // ── Tax relief ─────────────────────────────────────────────────────────────
  {
    id: 'rd-tax-relief',
    name: 'R&D Tax Relief (merged scheme)',
    provider: 'HMRC',
    kind: 'tax-relief',
    window: 'rolling',
    summary: 'Merged scheme pays a 20% above-the-line credit on qualifying R&D spend — roughly 15% net after corporation tax. Loss-making SMEs spending 30%+ of total costs on R&D can instead claim ERIS: a 186% deduction plus a payable credit worth up to 14.5% of the surrenderable loss.',
    reviewUrl: 'https://www.gov.uk/guidance/corporation-tax-research-and-development-rd-relief',
    lastReviewed: '2026-08',
    verified: true,
    eligibility: {
      requiresRnd: true,
      manualChecks: [
        'Work must seek an advance in science or technology, resolving genuine technical uncertainty',
        'Claim notification deadlines apply for first-time claimants — check before the period ends',
        'Loss-making R&D-intensive SMEs may qualify for the enhanced (ERIS) rate',
      ],
    },
  },
  {
    id: 'seis',
    name: 'Seed Enterprise Investment Scheme',
    provider: 'HMRC',
    kind: 'equity',
    window: 'rolling',
    maxAward: 250_000,
    summary: 'Tax relief for investors in early-stage companies, making an equity raise materially easier to close.',
    reviewUrl: 'https://www.gov.uk/guidance/venture-capital-schemes-apply-for-the-seed-enterprise-investment-scheme',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      maxEmployees: 25,
      maxTradingMonths: 36,
      manualChecks: [
        'Gross assets must be under the scheme threshold at the time of investment',
        'Seek Advance Assurance from HMRC before approaching investors',
        'This raises equity, not grant funding — it dilutes ownership',
      ],
    },
  },
  {
    id: 'eis',
    name: 'Enterprise Investment Scheme',
    provider: 'HMRC',
    kind: 'equity',
    window: 'rolling',
    maxAward: 5_000_000,
    summary: 'Investor tax relief for larger equity rounds in companies beyond the SEIS stage.',
    reviewUrl: 'https://www.gov.uk/guidance/venture-capital-schemes-apply-to-use-the-enterprise-investment-scheme',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      maxEmployees: 250,
      manualChecks: [
        'Company must generally be within 7 years of first commercial sale',
        'Annual and lifetime raise limits apply across all venture capital schemes',
        'This raises equity, not grant funding — it dilutes ownership',
      ],
    },
  },

  // ── Debt ───────────────────────────────────────────────────────────────────
  {
    id: 'start-up-loans',
    name: 'Start Up Loans',
    provider: 'British Business Bank',
    kind: 'loan',
    window: 'rolling',
    minAward: 500,
    maxAward: 25_000,
    summary: 'Government-backed unsecured personal loan for business use at a fixed rate, up to £25,000 per founder, with 12 months of free mentoring.',
    reviewUrl: 'https://www.startuploans.co.uk/',
    lastReviewed: '2026-08',
    verified: true,
    eligibility: {
      maxTradingMonths: 36,
      manualChecks: [
        'Loan is personal to the director and personally liable, not company debt',
        'Multiple directors can each apply, subject to a per-business cap',
      ],
    },
  },
  {
    id: 'growth-guarantee-scheme',
    name: 'Growth Guarantee Scheme',
    provider: 'British Business Bank',
    kind: 'loan',
    window: 'open',
    minAward: 25_000,
    maxAward: 2_000_000,
    summary: 'Government guarantee to accredited lenders, improving access to term loans, overdrafts, and asset finance. Extended to 31 March 2030; July 2026 enhancement added £6.5bn capacity, terms up to 10 years, and raised the turnover ceiling to £54m. 70+ accredited lenders.',
    reviewUrl: 'https://www.british-business-bank.co.uk/finance-options/debt-finance/growth-guarantee-scheme',
    lastReviewed: '2026-08',
    verified: true,
    eligibility: {
      manualChecks: [
        'Apply through an accredited lender, not the British Business Bank directly',
        'Annual turnover must be under £54m (raised from £45m in July 2026)',
        'The borrower remains fully liable for the debt — the guarantee protects the lender',
      ],
    },
  },
  {
    id: 'kings-trust-enterprise',
    name: "King's Trust Enterprise Programme",
    provider: "The King's Trust",
    kind: 'loan',
    window: 'rolling',
    minAward: 500,
    maxAward: 25_000,
    summary: 'Low-interest start-up loans, small grants, and mentoring for founders aged 18–30.',
    reviewUrl: 'https://www.kingstrust.org.uk/how-we-can-help/programmes/enterprise',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      maxTradingMonths: 24,
      manualChecks: ['Founder must be aged 18–30'],
    },
  },

  // ── Sector schemes ─────────────────────────────────────────────────────────
  {
    id: 'citb-grants',
    name: 'CITB Grants Scheme',
    provider: 'Construction Industry Training Board',
    kind: 'training',
    window: 'rolling',
    minAward: 600,
    maxAward: 12_000,
    summary: 'Apprenticeship grants (unchanged) plus qualification achievement grants. Changed materially on 8 January 2026: NVQ achievement grants cut to a flat £600 regardless of level, and most short courses moved out of the grants scheme to Employer Network match funding at 50% of cost (30% for some health and safety courses).',
    reviewUrl: 'https://www.citb.co.uk/funding-changes',
    lastReviewed: '2026-08',
    verified: true,
    eligibility: {
      sectors: ['construction'],
      manualChecks: [
        'Employer must be registered with CITB and up to date on Levy Returns',
        'NVQ achievement grants are now a flat £600 — the old Level 3/4/6 tiers are gone',
        'Most short courses now go through Employer Networks, not the grants scheme',
        'Plant Operations and Scaffolding short courses still attract the grant at existing rates',
      ],
    },
  },
  {
    id: 'made-smarter-adoption',
    name: 'Made Smarter Adoption',
    provider: 'Made Smarter (regional delivery)',
    kind: 'grant',
    window: 'rolling',
    minAward: 5_000,
    maxAward: 20_000,
    summary: 'Matched capital grants plus free technology advice for SME manufacturers adopting digital technology.',
    reviewUrl: 'https://www.madesmarter.uk/',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      sectors: ['manufacturing'],
      maxEmployees: 250,
      regions: ['North West', 'North East', 'Yorkshire and the Humber', 'West Midlands', 'East Midlands', 'East of England', 'South East', 'South West'],
      manualChecks: ['Delivery and grant rates vary by region — check the local programme'],
    },
  },

  // ── Skills and capability ──────────────────────────────────────────────────
  {
    id: 'help-to-grow-management',
    name: 'Help to Grow: Management',
    provider: 'Department for Business and Trade',
    kind: 'training',
    window: 'rolling',
    summary: '12-week practical management course delivered by business schools. 90% government funded — the business pays £750. Includes one-to-one mentoring and a peer network.',
    reviewUrl: 'https://helptogrow.campaign.gov.uk/',
    lastReviewed: '2026-08',
    verified: true,
    eligibility: {
      minEmployees: 5,
      maxEmployees: 249,
      minTradingMonths: 12,
      manualChecks: [
        'Participant must be a decision maker or senior management team member',
        'Charities are not eligible',
        'Cohorts run on fixed dates — check the provider for the next intake',
      ],
    },
  },
  {
    id: 'skills-bootcamps',
    name: 'Skills Bootcamps',
    provider: 'Department for Education',
    kind: 'training',
    window: 'rolling',
    summary: 'Free or heavily subsidised flexible training courses up to 16 weeks in digital, technical, and construction skills.',
    reviewUrl: 'https://www.gov.uk/guidance/find-a-skills-bootcamp',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      manualChecks: [
        'Employers co-fund a share of the cost when training existing staff',
        'Availability and subject areas vary by region and provider',
      ],
    },
  },
  {
    id: 'apprenticeship-funding',
    name: 'Apprenticeship Funding and Levy Transfer',
    provider: 'Department for Education',
    kind: 'training',
    window: 'rolling',
    maxAward: 27_000,
    summary: 'Government covers most or all apprenticeship training cost for small employers; levy-paying businesses can transfer unused funds.',
    reviewUrl: 'https://www.gov.uk/guidance/employing-an-apprentice-technical-guide-for-employers',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      manualChecks: [
        'Funding band cap depends on the specific apprenticeship standard',
        'Small non-levy employers pay a reduced or nil contribution',
      ],
    },
  },

  // ── Local and advisory ─────────────────────────────────────────────────────
  {
    id: 'local-growth-hub',
    name: 'Local Growth Hub Grants',
    provider: 'Local Growth Hub network',
    kind: 'grant',
    window: 'rolling',
    minAward: 1_000,
    maxAward: 25_000,
    summary: 'Regionally administered capital and revenue grants for SME growth, digital adoption, and job creation. Terms vary widely by area.',
    reviewUrl: 'https://www.gov.uk/business-support-helpline',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      maxEmployees: 250,
      manualChecks: [
        'Schemes, amounts, and open windows are entirely region-specific',
        'Most require match funding and job creation commitments',
      ],
    },
  },
  {
    id: 'innovate-uk-business-growth',
    name: 'Innovate UK Business Growth',
    provider: 'Innovate UK',
    kind: 'support',
    window: 'rolling',
    summary: 'Free assigned innovation and growth specialist for innovation-led SMEs. No cash award, but routes to grants and investors.',
    reviewUrl: 'https://iuk-business-growth.org.uk/',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      requiresRnd: true,
      manualChecks: ['Support only — no direct funding attached'],
    },
  },
  {
    id: 'bipc',
    name: 'Business & IP Centre Network',
    provider: 'British Library',
    kind: 'support',
    window: 'rolling',
    summary: 'Free market research databases, IP guidance, and workshops through local library centres.',
    reviewUrl: 'https://www.bl.uk/business-and-ip-centre',
    lastReviewed: REVIEWED,
    verified: false,
    eligibility: {
      manualChecks: ['Support only — no direct funding attached'],
    },
  },
]

// ── Company funding profiles ──────────────────────────────────────────────────
//
// Keyed by company id from COMPANY_REGISTRY (lib/company-registry.ts).
// CONFIRMED by the operator (2026-08): employees = 5, tradingMonths = 18,
// for all four ventures.
//
// STILL INFERRED: `region` (all 'unknown') and `doesRnd`. `assumed` therefore
// stays true and the warnings stay on — two of four fields is not a confirmed
// profile. Set `assumed: false` only once region and R&D status are settled.

export const COMPANY_FUNDING_PROFILES: CompanyFundingProfile[] = [
  {
    companyId: 'fineguard',
    sector: 'software',
    employees: 5,
    region: 'unknown',
    tradingMonths: 18,
    doesRnd: true,
    assumed: true,
  },
  {
    companyId: 'ultratech',
    sector: 'software',
    employees: 5,
    region: 'unknown',
    tradingMonths: 18,
    doesRnd: true,
    assumed: true,
  },
  {
    companyId: 'builder-big-jobs',
    sector: 'construction',
    employees: 5,
    region: 'unknown',
    tradingMonths: 18,
    doesRnd: false,
    assumed: true,
  },
  {
    companyId: 'accuracy',
    sector: 'professional-services',
    employees: 5,
    region: 'unknown',
    tradingMonths: 18,
    doesRnd: false,
    assumed: true,
  },
]

export function getFundingProfile(companyId: string): CompanyFundingProfile | undefined {
  return COMPANY_FUNDING_PROFILES.find((p) => p.companyId === companyId)
}

export function getFundingSource(id: string): FundingSource | undefined {
  return FUNDING_SOURCES.find((s) => s.id === id)
}

// ── Data quality ──────────────────────────────────────────────────────────────

/** Catalogue figures older than this are treated as stale. */
export const STALE_AFTER_MONTHS = 6

/** Largest headcount we accept before assuming the input is a mistake. */
const MAX_EMPLOYEES = 100_000
/** 100 years. Anything beyond this is a typo, not a company. */
const MAX_TRADING_MONTHS = 1_200

const VALID_SECTORS: FundingSector[] = [
  'software', 'construction', 'professional-services', 'manufacturing', 'any',
]

/** Whole months between a 'YYYY-MM' stamp and now. Null if unparseable. */
export function monthsSince(yyyymm: string, now: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(yyyymm)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (month < 1 || month > 12) return null
  return (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
}

export interface CatalogueHealth {
  total: number
  verified: number
  unverified: number
  /** Age of the oldest entry in months, or null if none parse. */
  oldestMonths: number | null
  stale: boolean
  /** Structural problems — duplicate ids, inverted award ranges, bad URLs. */
  issues: string[]
}

/**
 * Check the catalogue for structural problems and verification state.
 * Pure — safe to call from a route, a test, or a health endpoint.
 */
export function auditCatalogue(
  sources: FundingSource[] = FUNDING_SOURCES,
  now: Date = new Date(),
): CatalogueHealth {
  const issues: string[] = []
  const seen = new Set<string>()
  let oldestMonths: number | null = null

  for (const s of sources) {
    if (seen.has(s.id)) issues.push(`Duplicate source id '${s.id}'`)
    seen.add(s.id)

    if (s.minAward !== undefined && s.maxAward !== undefined && s.minAward > s.maxAward) {
      issues.push(`'${s.id}' has minAward (${s.minAward}) above maxAward (${s.maxAward})`)
    }
    if (s.minAward !== undefined && s.minAward < 0) issues.push(`'${s.id}' has a negative minAward`)
    if (s.maxAward !== undefined && s.maxAward < 0) issues.push(`'${s.id}' has a negative maxAward`)
    if (s.minAward !== undefined && s.maxAward === undefined) {
      issues.push(`'${s.id}' has a minAward but no maxAward — it contributes nothing to ceilings`)
    }
    if (!/^https:\/\//.test(s.reviewUrl)) issues.push(`'${s.id}' reviewUrl is not an https URL`)

    // An empty restriction list is never intentional: an empty `sectors` blocks
    // every company, and an empty `regions` renders a caveat listing nothing.
    if (s.eligibility.minEmployees !== undefined && s.eligibility.maxEmployees !== undefined
        && s.eligibility.minEmployees > s.eligibility.maxEmployees) {
      issues.push(`'${s.id}' has minEmployees above maxEmployees — no company can qualify`)
    }
    if (s.eligibility.sectors && s.eligibility.sectors.length === 0) {
      issues.push(`'${s.id}' has an empty sectors list — this blocks every company`)
    }
    if (s.eligibility.regions && s.eligibility.regions.length === 0) {
      issues.push(`'${s.id}' has an empty regions list — this blocks every known region`)
    }

    const age = monthsSince(s.lastReviewed, now)
    if (age === null) {
      issues.push(`'${s.id}' has an unparseable lastReviewed '${s.lastReviewed}'`)
    } else if (age < 0) {
      // A future stamp would otherwise drag oldestMonths negative and mask
      // genuinely stale entries behind a false "fresh" verdict.
      issues.push(`'${s.id}' has a lastReviewed in the future ('${s.lastReviewed}')`)
    } else if (oldestMonths === null || age > oldestMonths) {
      oldestMonths = age
    }
  }

  const verified = sources.filter((s) => s.verified).length

  return {
    total: sources.length,
    verified,
    unverified: sources.length - verified,
    oldestMonths,
    stale: oldestMonths !== null && oldestMonths > STALE_AFTER_MONTHS,
    issues,
  }
}

/**
 * Reject profiles that would produce meaningless matches.
 * Returns human-readable errors; empty array means the profile is usable.
 */
export function validateProfile(profile: Partial<CompanyFundingProfile>): string[] {
  const errors: string[] = []

  const { employees, tradingMonths, sector, region, doesRnd, companyId, assumed } = profile

  if (companyId !== undefined && (typeof companyId !== 'string' || companyId.trim() === '')) {
    errors.push('companyId must be a non-empty string')
  }

  if (assumed !== undefined && typeof assumed !== 'boolean') {
    errors.push('assumed must be a boolean')
  }

  if (employees !== undefined) {
    if (!Number.isFinite(employees) || !Number.isInteger(employees)) {
      errors.push('employees must be a whole number')
    } else if (employees < 0) {
      errors.push('employees cannot be negative')
    } else if (employees > MAX_EMPLOYEES) {
      errors.push(`employees of ${employees} is implausible (max ${MAX_EMPLOYEES})`)
    }
  }

  if (tradingMonths !== undefined) {
    if (!Number.isFinite(tradingMonths) || !Number.isInteger(tradingMonths)) {
      errors.push('tradingMonths must be a whole number')
    } else if (tradingMonths < 0) {
      errors.push('tradingMonths cannot be negative')
    } else if (tradingMonths > MAX_TRADING_MONTHS) {
      errors.push(`tradingMonths of ${tradingMonths} is implausible (max ${MAX_TRADING_MONTHS})`)
    }
  }

  if (sector !== undefined && !VALID_SECTORS.includes(sector)) {
    errors.push(`sector '${sector}' is not one of: ${VALID_SECTORS.join(', ')}`)
  }

  if (region !== undefined && (typeof region !== 'string' || region.trim() === '')) {
    errors.push('region must be a non-empty string, or "unknown"')
  }

  if (doesRnd !== undefined && typeof doesRnd !== 'boolean') {
    errors.push('doesRnd must be a boolean')
  }

  return errors
}

export interface ProfileRegistryHealth {
  total: number
  assumed: number
  confirmed: number
  /** Duplicate ids and per-profile validation failures. */
  issues: string[]
}

/**
 * Check the company profile registry. `auditCatalogue` covers funding sources;
 * this covers the other half, which nothing previously inspected.
 */
export function auditProfiles(
  profiles: CompanyFundingProfile[] = COMPANY_FUNDING_PROFILES,
): ProfileRegistryHealth {
  const issues: string[] = []
  const seen = new Set<string>()

  for (const p of profiles) {
    if (seen.has(p.companyId)) issues.push(`Duplicate company profile '${p.companyId}'`)
    seen.add(p.companyId)

    for (const error of validateProfile(p)) {
      issues.push(`'${p.companyId}': ${error}`)
    }
  }

  const assumed = profiles.filter((p) => p.assumed).length

  return { total: profiles.length, assumed, confirmed: profiles.length - assumed, issues }
}

// ── Matching ──────────────────────────────────────────────────────────────────

/**
 * Evaluate one source against one profile.
 * `blocking` non-empty means the company is ineligible.
 * `caveats` are conditions the profile cannot settle either way.
 */
export function checkEligibility(
  source: FundingSource,
  profile: CompanyFundingProfile,
): { blocking: string[]; caveats: string[] } {
  const blocking: string[] = []
  const caveats: string[] = []
  const rules = source.eligibility

  if (source.window === 'closed') {
    blocking.push('Scheme is closed to new applications')
  }

  if (rules.sectors && !rules.sectors.includes('any') && !rules.sectors.includes(profile.sector)) {
    blocking.push(`Restricted to ${rules.sectors.join(', ')} — company sector is ${profile.sector}`)
  }

  if (rules.minEmployees !== undefined && profile.employees < rules.minEmployees) {
    blocking.push(`Requires at least ${rules.minEmployees} employees — company has ${profile.employees}`)
  }

  if (rules.maxEmployees !== undefined && profile.employees > rules.maxEmployees) {
    blocking.push(`Requires fewer than ${rules.maxEmployees} employees — company has ${profile.employees}`)
  }

  if (rules.minTradingMonths !== undefined && profile.tradingMonths < rules.minTradingMonths) {
    blocking.push(`Requires ${rules.minTradingMonths} months trading — company has ${profile.tradingMonths}`)
  }

  if (rules.maxTradingMonths !== undefined && profile.tradingMonths > rules.maxTradingMonths) {
    blocking.push(`Limited to businesses under ${rules.maxTradingMonths} months old — company is ${profile.tradingMonths}`)
  }

  if (rules.requiresRnd && !profile.doesRnd) {
    blocking.push('Requires qualifying R&D activity')
  }

  // Region is a caveat rather than a blocker when the profile does not know it,
  // so regional schemes stay visible instead of being silently dropped.
  if (rules.regions) {
    if (profile.region === 'unknown') {
      caveats.push(`Regional scheme — confirm the business trades in one of: ${rules.regions.join(', ')}`)
    } else if (!rules.regions.includes(profile.region)) {
      blocking.push(`Not available in ${profile.region}`)
    }
  }

  if (rules.manualChecks) {
    caveats.push(...rules.manualChecks)
  }

  // Deliberately NOT adding a caveat for `profile.assumed` here. It is a
  // property of the company, not of the scheme — repeating it on all 18 rows
  // buries the scheme-specific conditions that actually differ. Callers surface
  // it once, from `profile.assumed`.

  return { blocking, caveats }
}

/**
 * Match a company profile against the catalogue.
 * Matches are sorted by indicative maximum award, highest first.
 *
 * `kinds` omitted means every kind. `kinds` given as an empty array means no
 * kind is selected, and therefore no results — an explicit empty filter must
 * not silently widen to "everything".
 *
 * An invalid profile returns empty lists with `profileErrors` populated rather
 * than matching against nonsense. This is the last line of defence: the runner
 * validates caller overrides, but registry profiles reach here directly.
 */
export function findFunding(
  profile: CompanyFundingProfile,
  kinds?: FundingKind[],
): FundingSearchResult {
  const profileErrors = validateProfile(profile)
  if (profileErrors.length > 0) {
    return {
      companyId: profile.companyId,
      profile,
      matches: [],
      excluded: [],
      ceilingByKind: {},
      indicativeCeiling: 0,
      unverifiedMatches: 0,
      profileErrors,
    }
  }

  const pool = kinds === undefined
    ? FUNDING_SOURCES
    : FUNDING_SOURCES.filter((s) => kinds.includes(s.kind))

  const matches: FundingMatch[] = []
  const excluded: FundingExclusion[] = []

  for (const source of pool) {
    const { blocking, caveats } = checkEligibility(source, profile)
    if (blocking.length > 0) {
      excluded.push({ id: source.id, name: source.name, reasons: blocking })
    } else {
      matches.push({ source, caveats })
    }
  }

  matches.sort((a, b) => (b.source.maxAward ?? 0) - (a.source.maxAward ?? 0))

  const ceilingByKind: Partial<Record<FundingKind, number>> = {}
  for (const { source } of matches) {
    if (source.maxAward === undefined) continue
    ceilingByKind[source.kind] = (ceilingByKind[source.kind] ?? 0) + source.maxAward
  }

  const indicativeCeiling = matches.reduce((sum, m) => sum + (m.source.maxAward ?? 0), 0)
  const unverifiedMatches = matches.filter((m) => !m.source.verified).length

  return {
    companyId: profile.companyId,
    profile,
    matches,
    excluded,
    ceilingByKind,
    indicativeCeiling,
    unverifiedMatches,
    profileErrors: [],
  }
}
