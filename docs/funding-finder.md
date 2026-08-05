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
| Workspace page | `app/os/workspace/[companyId]/funding/page.tsx` |
| Demo | `public/funding-finder-demo.html` |

---

## Workspace Page

`/os/workspace/[companyId]/funding` — read-only. It reports rule matches and
persists nothing.

Reached from the **Funding** tab in the workspace tab bar, and also from
**Settings → Funding** — the same dual entry point People has.

The tab was added by explicit owner decision on 2026-08-03, recorded in
`docs/DECISION_LOG.md`. It is not the default for a Business Function: building
one does not entitle it to shell navigation, and `docs/business-functions.md`
still requires a logged decision before the tab bar changes.

The page is a server component with no client JavaScript — expansion uses
native `<details>`. It carries `force-dynamic` because staleness is measured
against the current date, and static prerendering would freeze that check at
build time and report stale figures as fresh.

A company present in `COMPANY_REGISTRY` but absent from
`COMPANY_FUNDING_PROFILES` renders an explanatory empty state rather than
failing.

Owned by Executive rather than Finance because it spans all four ventures and
drives strategic decisions, not bookkeeping.

---

## Why `beta` and not `live`

The matching logic is production quality: validated inputs, integrity-checked
data, deterministic output, no unhandled paths. **The catalogue data is not.**

All 18 entries carry `verified: false`. That flag means exactly what it says —
the figures were written from prior knowledge and **have never been checked
against the provider's own page.** `lastReviewed: '2026-05'` records when they
were written down, not when anyone confirmed them.

The four company profiles are also assumptions, all carrying `assumed: true`.

These are the only two things standing between `beta` and `live`, and neither
is a code change:

| Blocker | Who can clear it | How |
|---|---|---|
| 18 unverified sources | Anyone with web access | Open each `reviewUrl`, confirm award range, window, and rules, set `verified: true` |
| 4 assumed profiles | The operator | Supply real employees, region, months trading; set `assumed: false` |

Until both are cleared the runner warns on every execution. That is deliberate:
a funding tool that presents unconfirmed award figures as fact causes wasted
applications and bad board decisions. The warnings are the safety mechanism, not
noise to be silenced.

---

## Data Quality Controls

Because award figures drive real money decisions, data quality is a first-class
result rather than a footnote.

### `auditCatalogue(sources?, now?): CatalogueHealth`

Pure structural check over the catalogue. Returns verification counts, the age
of the oldest entry, a staleness verdict, and any integrity problems found:

- duplicate source ids
- `minAward` above `maxAward`
- negative award figures
- a `reviewUrl` that is not HTTPS
- an unparseable `lastReviewed` stamp

### Staleness

`STALE_AFTER_MONTHS` is 6. Once the oldest entry passes that, every execution
carries a staleness warning naming the actual age. UK scheme terms move with
fiscal events, so figures going quietly out of date is the realistic failure
mode — not a sudden break.

### `validateProfile(partial): string[]`

Rejects input that would produce confident nonsense — non-integer or negative
headcount, implausible values (over 100,000 employees or 100 years trading),
an unknown sector, an empty region, a non-boolean R&D flag. Returns readable
errors; empty array means usable.

The runner calls this on any `payload.profile` override and **fails the
execution** rather than matching against a bad profile. Registry profiles are
trusted; caller-supplied overrides are not.

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
  unverifiedMatches: number   // matched sources never confirmed at source
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

## Road to Production

Done — engine layer is production quality:

- Input validation on every caller-supplied override, failing the execution
  rather than matching against a bad profile
- Catalogue integrity checks (duplicate ids, inverted ranges, negative awards,
  non-HTTPS review URLs, unparseable dates)
- Staleness detection with an explicit threshold
- Per-source verification tracking surfaced in every result
- `runFunction` never throws; `companyId` cannot be reassigned by payload
- Demo verified equivalent to the TypeScript across all four ventures

Outstanding — none of it is code:

| Step | Blocked on | Notes |
|---|---|---|
| Verify 18 sources | Web access | Open each `reviewUrl`, confirm award range, window, rules; set `verified: true` |
| Confirm 4 profiles | The operator | Real employees, region, months trading; set `assumed: false` |
| Promote to `live` | Both above | One-line status change in the registry |

Then, as separate approved work:

| Step | Requires |
|---|---|
| Workspace page under `/os/` | Confirmation — `CLAUDE.md` gates new `/os/` pages |
| Persist opportunities to `os_work_items` | Confirmation + `writesTo` declared on the registry entry |
| Deadline alerts from `periodic` rounds into `os_alerts` | Confirmation |

Nothing beyond this point should change the matching logic.

---

## What Must Not Change

- `lib/funding-sources.ts` stays pure — no async, no DB, no network, no imports
  from `app/`
- The runner must not persist anything without `writesTo` being declared on the
  registry entry first
- Region must remain a caveat, not a blocker, while `region` can be `'unknown'`
- Every source must carry `reviewUrl` and `lastReviewed` — an entry with no
  provenance cannot be verified and must not be added
- `verified: true` means a human opened the provider's page and confirmed the
  figures. It is not a formality and must never be set in bulk
- The unverified and staleness warnings must not be suppressed to make output
  look cleaner — they are the safety mechanism for a tool that reports money
