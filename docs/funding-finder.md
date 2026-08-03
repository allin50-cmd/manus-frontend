# Funding Finder

Matches each business venture against available UK grants, loans, tax reliefs,
and support schemes. Read alongside `docs/business-functions.md` and
`docs/function-engine.md`.

---

## What It Is

A Business Function that answers one question per venture: **what funding is
this company eligible for right now?**

It is deterministic. It reads a curated catalogue of UK funding sources, applies
each scheme's eligibility rules against a company funding profile, and returns
matched schemes, excluded schemes with reasons, and an indicative funding
ceiling. It calls no LLM, hits no external API, and touches no database.

| | |
|---|---|
| Function id | `funding-finder` |
| Department | Executive |
| Owner | Jobe |
| Status | `beta` |
| Data module | `lib/funding-sources.ts` |
| Runner | `lib/function-engine.ts` |

Owned by Executive rather than Finance because it spans all four ventures and
drives strategic decisions, not bookkeeping.

---

## Why `beta` and not `live`

The matching logic is real and correct. The **catalogue data is not verified.**

Every entry in `FUNDING_SOURCES` carries `lastReviewed: '2026-05'`, which
reflects when the figures were written down — not an active check against the
provider. UK scheme amounts, windows, and eligibility rules change frequently,
and several of the schemes listed have been restructured before.

The company profiles are also assumptions. All four ventures currently carry
`assumed: true`.

Promote to `live` once both are confirmed. Until then the runner warns on every
execution.

---

## Running It

```ts
import { runFunction } from '@/lib/function-engine'

const result = await runFunction('funding-finder', {
  companyId: 'ultratech',
})
```

### Payload options

```ts
interface FundingFinderPayload {
  profile?: Partial<CompanyFundingProfile>  // override assumed values
  kinds?: FundingKind[]                      // restrict to certain scheme types
}
```

Override the profile when you know the real numbers, without editing the
catalogue:

```ts
await runFunction('funding-finder', {
  companyId: 'builder-big-jobs',
  payload: {
    profile: { employees: 12, region: 'North West', tradingMonths: 48, assumed: false },
    kinds: ['grant', 'training'],
  },
})
```

`companyId` from the context always wins — a payload cannot reassign the
company.

### Result

`FunctionResult.data` is a `FundingSearchResult`:

```ts
{
  companyId: string
  profile: CompanyFundingProfile
  matches: { source: FundingSource; caveats: string[] }[]   // sorted by max award
  excluded: { id: string; name: string; reasons: string[] }[]
  ceilingByKind: Partial<Record<FundingKind, number>>
  indicativeCeiling: number
}
```

### Read `ceilingByKind`, not `indicativeCeiling`

`indicativeCeiling` sums every matched scheme, which mixes grant money, debt,
and equity into one figure. For a small software venture it comes out around
£11.5m — a number that is real arithmetic and completely unachievable. Schemes
compete with each other, most grants need match funding, and equity dilutes
ownership rather than adding to the balance sheet.

`ceilingByKind` breaks the same figure down by scheme type. That is the one to
put in front of anyone.

`events` carry a human-readable summary and the top five matches.
`warnings` flag assumed profile values and unevaluated conditions.
`success` is `false` only when the company has no profile at all.

---

## Company Funding Profiles

Defined in `COMPANY_FUNDING_PROFILES` in `lib/funding-sources.ts`, keyed by
company id from `COMPANY_REGISTRY`.

```ts
interface CompanyFundingProfile {
  companyId: string
  sector: FundingSector      // software | construction | professional-services | manufacturing | any
  employees: number
  region: string             // English region or home nation; 'unknown' relaxes regional matching
  tradingMonths: number
  doesRnd: boolean
  assumed: boolean           // true = values inferred, not confirmed
}
```

Current profiles — **all values below are assumptions and need confirming:**

| Company | Sector | Employees | Region | Trading | R&D |
|---|---|---|---|---|---|
| FineGuard | software | 5 | unknown | 24mo | yes |
| Ultratech | software | 5 | unknown | 24mo | yes |
| Builder Big Jobs | construction | 5 | unknown | 24mo | no |
| Accuracy Ltd | professional-services | 5 | unknown | 24mo | no |

These four fields decide real outcomes:

- **`employees`** gates SEIS (under 25) and EIS (under 250)
- **`tradingMonths`** gates Start Up Loans and SEIS (under 36 months), and
  Help to Grow and KTP (over 12 months)
- **`region`** gates Made Smarter and every Local Growth Hub scheme
- **`doesRnd`** gates R&D Tax Relief, Smart Grants, and Investor Partnerships

Set `assumed: false` once confirmed, and the per-execution warning stops.

---

## Eligibility Matching

For each source the matcher produces two lists:

- **`blocking`** — the company is ineligible; the scheme moves to `excluded`
  with the reason attached
- **`caveats`** — conditions the profile cannot settle; the scheme still
  matches, with the caveat surfaced

Region is deliberately a caveat rather than a blocker when
`region === 'unknown'`. Regional schemes stay visible instead of being silently
dropped from a profile that simply hasn't been filled in.

`manualChecks` on a source are always caveats. They cover conditions no profile
field can express — founder age, match funding, investor commitment, whether
work is genuinely novel R&D.

---

## The Catalogue

18 sources in `FUNDING_SOURCES`, grouped by kind:

| Kind | Schemes |
|---|---|
| `grant` | Smart Grants, Investor Partnerships, KTP, Young Innovators, Made Smarter Adoption, Local Growth Hub |
| `tax-relief` | R&D Tax Relief (merged scheme) |
| `equity` | SEIS, EIS |
| `loan` | Start Up Loans, Growth Guarantee Scheme, King's Trust Enterprise |
| `training` | CITB Grants, Help to Grow: Management, Skills Bootcamps, Apprenticeship Funding |
| `support` | Innovate UK Business Growth, BIPC Network |

Equity and support entries are included deliberately: SEIS and EIS are not
grants and dilute ownership — both carry that as an explicit caveat — but they
are the realistic route for a software venture that cannot match-fund a Smart
Grant. Support entries carry no cash and say so.

### Adding a source

Append a `FundingSource` to `FUNDING_SOURCES`. Set `reviewUrl` to the provider's
own page and `lastReviewed` to the month you took the figures from it. Express
anything the profile cannot evaluate as `manualChecks` rather than inventing a
new eligibility field.

---

## What This Function Does Not Do

- **Does not search the internet.** The catalogue is curated, not crawled.
  Nothing here reflects live scheme status.
- **Does not track applications.** It answers eligibility, not "where is our
  Smart Grant bid up to". Application tracking is separate work.
- **Does not write to the database.** No `watches`, no `writesTo`. Every
  execution is stateless.
- **Does not give advice.** It reports rule matches. Whether a scheme is worth
  pursuing is a judgement for the owner.

---

## Roadmap

| Step | Change |
|---|---|
| Confirm profiles | Fill in real employees, region, trading months; set `assumed: false` |
| Verify catalogue | Check all 18 entries against `reviewUrl`; update `lastReviewed` |
| Promote to `live` | Once both above are done |
| Persist opportunities | Write matched schemes to `os_work_items` so they can be actioned — needs `writesTo` declared and a route |
| Deadline alerts | Feed `periodic` competition rounds into `os_alerts` |

The first two steps are data work, not code. Nothing after that should change
the matching logic.

---

## What Must Not Change

- `lib/funding-sources.ts` stays pure — no async, no DB, no network, no imports
  from `app/`
- The runner must not persist anything without `writesTo` being declared on the
  registry entry first
- Region must remain a caveat, not a blocker, while `region` can be `'unknown'`
- Every source must carry `reviewUrl` and `lastReviewed` — an entry with no
  provenance cannot be verified and must not be added
