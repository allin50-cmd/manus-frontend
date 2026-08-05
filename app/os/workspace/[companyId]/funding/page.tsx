import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'
import {
  findFunding,
  getFundingProfile,
  auditCatalogue,
  STALE_AFTER_MONTHS,
  type FundingKind,
  type FundingSource,
} from '@/lib/funding-sources'

// Staleness is measured against the current date. Static prerendering would
// freeze that check at build time and quietly report stale data as fresh.
export const dynamic = 'force-dynamic'

const KIND_COLOR: Record<FundingKind, string> = {
  grant:        '#28C76F',
  loan:         '#3D8BFF',
  'tax-relief': '#FF9F0A',
  equity:       '#818CF8',
  training:     '#EC4899',
  support:      'rgba(255,255,255,0.4)',
}

const money = (n: number) => `£${n.toLocaleString('en-GB')}`

function awardLabel(source: FundingSource): string {
  if (source.maxAward === undefined) return 'No cash award'
  if (source.minAward === undefined) return `up to ${money(source.maxAward)}`
  return `${money(source.minAward)} – ${money(source.maxAward)}`
}

export default function WorkspaceFundingPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const base = `/os/workspace/${params.companyId}`
  const profile = getFundingProfile(params.companyId)

  // A company can exist in COMPANY_REGISTRY without a funding profile.
  if (!profile) {
    return (
      <div className="space-y-6">
        <Header companyName={company.name} />
        <Panel label="No funding profile">
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {company.name} has no entry in <Code>COMPANY_FUNDING_PROFILES</Code>. Add one to{' '}
            <Code>lib/funding-sources.ts</Code> with the company&apos;s sector, headcount, region,
            and trading history to see matched schemes here.
          </p>
        </Panel>
      </div>
    )
  }

  const result = findFunding(profile)
  const health = auditCatalogue()
  const ceilings = Object.entries(result.ceilingByKind).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      <Header companyName={company.name} />

      {/* ── Data quality ─────────────────────────────────────── */}
      {(result.unverifiedMatches > 0 || health.stale || profile.assumed) && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,159,10,0.07)', border: '1px solid rgba(255,159,10,0.22)' }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,159,10,0.75)' }}
          >
            Before acting on this
          </p>
          <ul className="space-y-1.5">
            {result.unverifiedMatches > 0 && (
              <Caution>
                {result.unverifiedMatches} of {result.matches.length} matched schemes have never
                been confirmed against the provider. Award figures and eligibility rules are
                indicative only.
              </Caution>
            )}
            {health.stale && (
              <Caution>
                Catalogue figures are {health.oldestMonths} months old (stale after{' '}
                {STALE_AFTER_MONTHS}). UK scheme terms change frequently.
              </Caution>
            )}
            {profile.assumed && (
              <Caution>
                This company&apos;s profile uses assumed values. Headcount, region, and trading
                history decide real eligibility — confirm them before relying on these matches.
              </Caution>
            )}
            {health.issues.length > 0 && (
              <Caution>Catalogue integrity: {health.issues.join('; ')}</Caution>
            )}
          </ul>
        </div>
      )}

      {/* ── Profile ──────────────────────────────────────────── */}
      <Panel label="Funding profile">
        <div className="space-y-3">
          <Row label="Sector"         value={profile.sector} />
          <Row label="Employees"      value={String(profile.employees)} />
          <Row label="Region"         value={profile.region === 'unknown' ? 'Not confirmed' : profile.region} />
          <Row label="Months trading" value={String(profile.tradingMonths)} />
          <Row label="Qualifying R&D" value={profile.doesRnd ? 'Yes' : 'No'} />
          <Row label="Values"         value={profile.assumed ? 'Assumed' : 'Confirmed'} />
        </div>
      </Panel>

      {/* ── Ceilings ─────────────────────────────────────────── */}
      <Panel label="Indicative ceiling by kind">
        {ceilings.length === 0 ? (
          <Empty>No cash schemes matched this profile.</Empty>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ceilings.map(([kind, total]) => (
                <div
                  key={kind}
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p
                    className="text-[9px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: KIND_COLOR[kind as FundingKind] }}
                  >
                    {kind.replace('-', ' ')}
                  </p>
                  <p className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {money(total)}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Shown separately on purpose. Grant, debt, and equity are different kinds of money —
              a combined total would overstate what is realistically available.
            </p>
          </>
        )}
      </Panel>

      {/* ── Matched ──────────────────────────────────────────── */}
      <Panel label={`Matched · ${result.matches.length}`}>
        {result.matches.length === 0 ? (
          <Empty>No schemes matched this profile.</Empty>
        ) : (
          <div className="space-y-px">
            {result.matches.map((match, i) => (
              <details key={match.source.id} className="group">
                <summary
                  className="flex items-start gap-3 py-3 px-1 cursor-pointer list-none"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.82)' }}>
                        {match.source.name}
                      </span>
                      <KindPill kind={match.source.kind} />
                      {!match.source.verified && <UnverifiedPill />}
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {match.source.provider}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[11px] font-semibold text-right"
                    style={{ color: match.source.maxAward === undefined ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.72)' }}
                  >
                    {awardLabel(match.source)}
                  </span>
                </summary>

                <div className="pb-3 px-1">
                  <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {match.source.summary}
                  </p>
                  {match.caveats.length > 0 && (
                    <ul className="space-y-1 mb-2">
                      {match.caveats.map((caveat) => (
                        <li key={caveat} className="text-[11px] leading-relaxed flex gap-2" style={{ color: 'rgba(255,206,122,0.85)' }}>
                          <span aria-hidden>▸</span>
                          <span>{caveat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <a
                    href={match.source.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium"
                    style={{ color: '#3D8BFF' }}
                  >
                    Verify with provider ↗
                  </a>
                </div>
              </details>
            ))}
          </div>
        )}
      </Panel>

      {/* ── Not eligible ─────────────────────────────────────── */}
      <Panel label={`Not eligible · ${result.excluded.length}`}>
        {result.excluded.length === 0 ? (
          <Empty>Every scheme in the catalogue matched this profile.</Empty>
        ) : (
          <div className="space-y-px">
            {result.excluded.map((exclusion, i) => (
              <div
                key={exclusion.id}
                className="py-3 px-1"
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
              >
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {exclusion.name}
                </span>
                <ul className="space-y-1 mt-1">
                  {exclusion.reasons.map((reason) => (
                    <li key={reason} className="text-[11px] leading-relaxed flex gap-2" style={{ color: 'rgba(255,158,150,0.8)' }}>
                      <span aria-hidden>✕</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Catalogue: {health.verified} of {health.total} sources verified. Read-only — this page
        reports rule matches and persists nothing.{' '}
        <Link href={`${base}/settings`} style={{ color: 'rgba(255,255,255,0.45)' }}>
          Back to Settings
        </Link>
      </p>
    </div>
  )
}

/* ── Presentational helpers ─────────────────────────────────── */

function Header({ companyName }: { companyName: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Funding</h2>
      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
        {companyName} — schemes matched against the company funding profile
      </p>
    </div>
  )
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-4"
        style={{ color: 'rgba(255,255,255,0.22)' }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>
    </div>
  )
}

function KindPill({ kind }: { kind: FundingKind }) {
  const color = KIND_COLOR[kind]
  return (
    <span
      className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: `${color}1A`, color, border: `1px solid ${color}33` }}
    >
      {kind.replace('-', ' ')}
    </span>
  )
}

function UnverifiedPill() {
  return (
    <span
      className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: 'rgba(255,159,10,0.13)', color: '#FF9F0A', border: '1px solid rgba(255,159,10,0.25)' }}
    >
      Unverified
    </span>
  )
}

function Caution({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-[11px] leading-relaxed flex gap-2" style={{ color: 'rgba(255,206,122,0.9)' }}>
      <span aria-hidden>•</span>
      <span>{children}</span>
    </li>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{children}</p>
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="text-[11px] px-1 py-0.5 rounded"
      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
    >
      {children}
    </code>
  )
}
