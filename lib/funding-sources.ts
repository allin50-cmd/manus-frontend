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
  /** YYYY-MM the entry's figures were last taken from the provider. */
  lastReviewed: string
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
    window: 'periodic',
    minAward: 100_000,
    maxAward: 2_000_000,
    summary: 'Open competition for game-changing, commercially viable R&D innovation. Highly competitive, sector-agnostic.',
    reviewUrl: 'https://apply-for-innovation-funding.service.gov.uk/competition/search',
    lastReviewed: REVIEWED,
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
    summary: 'Corporation tax relief or credit on qualifying R&D expenditure. Claimed retrospectively through the company tax return.',
    reviewUrl: 'https://www.gov.uk/guidance/corporation-tax-research-and-development-rd-relief',
    lastReviewed: REVIEWED,
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
    summary: 'Government-backed unsecured personal loan for business use, at a fixed rate, with 12 months free mentoring.',
    reviewUrl: 'https://www.startuploans.co.uk/',
    lastReviewed: REVIEWED,
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
    summary: 'Government guarantee to accredited lenders, improving access to term loans, overdrafts, and asset finance.',
    reviewUrl: 'https://www.british-business-bank.co.uk/finance-options/debt-finance/growth-guarantee-scheme',
    lastReviewed: REVIEWED,
    eligibility: {
      manualChecks: [
        'Apply through an accredited lender, not the British Business Bank directly',
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
    minAward: 30,
    maxAward: 12_000,
    summary: 'Per-course and per-apprentice grants for training construction employees. Short course, qualification, and apprenticeship attendance tiers.',
    reviewUrl: 'https://www.citb.co.uk/levy-grants-and-funding/grants-funding/',
    lastReviewed: REVIEWED,
    eligibility: {
      sectors: ['construction'],
      manualChecks: [
        'Employer must be registered with CITB and up to date on Levy Returns',
        'Grant rates differ by course tier — confirm the specific course qualifies',
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
    summary: '12-week practical management course delivered by business schools, around 90% government subsidised, with one-to-one mentoring.',
    reviewUrl: 'https://helptogrow.campaign.gov.uk/',
    lastReviewed: REVIEWED,
    eligibility: {
      minTradingMonths: 12,
      manualChecks: [
        'Business must meet the minimum employee headcount for the course',
        'Participant must be a senior decision maker',
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
    eligibility: {
      manualChecks: ['Support only — no direct funding attached'],
    },
  },
]

// ── Company funding profiles ──────────────────────────────────────────────────
//
// Keyed by company id from COMPANY_REGISTRY (lib/company-registry.ts).
// `assumed: true` marks a profile whose values were inferred rather than
// confirmed. Confirm employees, region, and tradingMonths with the operator
// and set `assumed: false` — several schemes turn on exactly these fields.

export const COMPANY_FUNDING_PROFILES: CompanyFundingProfile[] = [
  {
    companyId: 'fineguard',
    sector: 'software',
    employees: 5,
    region: 'unknown',
    tradingMonths: 24,
    doesRnd: true,
    assumed: true,
  },
  {
    companyId: 'ultratech',
    sector: 'software',
    employees: 5,
    region: 'unknown',
    tradingMonths: 24,
    doesRnd: true,
    assumed: true,
  },
  {
    companyId: 'builder-big-jobs',
    sector: 'construction',
    employees: 5,
    region: 'unknown',
    tradingMonths: 24,
    doesRnd: false,
    assumed: true,
  },
  {
    companyId: 'accuracy',
    sector: 'professional-services',
    employees: 5,
    region: 'unknown',
    tradingMonths: 24,
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

  if (profile.assumed) {
    caveats.push('Company profile uses assumed values — confirm employees, region, and trading history')
  }

  return { blocking, caveats }
}

/**
 * Match a company profile against the catalogue.
 * Matches are sorted by indicative maximum award, highest first.
 */
export function findFunding(
  profile: CompanyFundingProfile,
  kinds?: FundingKind[],
): FundingSearchResult {
  const pool = kinds?.length
    ? FUNDING_SOURCES.filter((s) => kinds.includes(s.kind))
    : FUNDING_SOURCES

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

  return { companyId: profile.companyId, profile, matches, excluded, ceilingByKind, indicativeCeiling }
}
