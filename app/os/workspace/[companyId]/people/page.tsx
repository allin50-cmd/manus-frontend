import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { osPeople } from '@/db/schema'
import { getCompany } from '@/lib/company-registry'
import { desc, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// TODO: replace with a dedicated workspace_members table scoped by company_id
// when proper multi-company membership is introduced. osPeople is a shared
// CRM contacts table with no company_id column; category = 'Team' is the
// closest available proxy for team members.

export default async function WorkspacePeoplePage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const db = await getDb()
  const base = `/os/workspace/${params.companyId}`

  // Filter to category = 'Team' as a proxy for team members.
  // TODO: add company_id scoping once workspace_members table exists.
  const members = await db
    .select()
    .from(osPeople)
    .where(eq(osPeople.category, 'Team'))
    .orderBy(desc(osPeople.createdAt))
    .limit(50)

  // TODO: query a workspace_invitations table once it exists.
  const pendingInvitations: never[] = []

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>People</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {members.length} team member{members.length !== 1 ? 's' : ''} · {company.name}
          </p>
        </div>
        <Link
          href={`${base}/settings`}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(61,139,255,0.12)', color: '#3D8BFF', border: '1px solid rgba(61,139,255,0.2)' }}
        >
          Invite Member
        </Link>
      </div>

      {/* ── Team Members ────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Team Members
        </p>

        {members.length === 0 ? (
          <div className="py-8 flex flex-col items-center text-center">
            <span className="text-3xl mb-3" aria-hidden>👥</span>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
              No team members yet.
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Invite your first team member to start collaborating.
            </p>
            <Link
              href={`${base}/settings`}
              className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl"
              style={{ background: 'rgba(61,139,255,0.12)', color: '#3D8BFF', border: '1px solid rgba(61,139,255,0.2)' }}
            >
              Invite Member
            </Link>
          </div>
        ) : (
          <div>
            {members.map((person, i) => {
              const initials = (
                person.avatarInitials ??
                person.name.split(' ').map((w) => w[0]).join('').slice(0, 2)
              ).toUpperCase()

              return (
                <div
                  key={person.id}
                  className="flex items-center gap-3 py-3 px-1"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: 'rgba(40,199,111,0.15)',
                      color: '#28C76F',
                      border: '1px solid rgba(40,199,111,0.22)',
                    }}
                  >
                    {initials}
                  </div>

                  {/* Name + email + role */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      {person.name}
                    </p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {[person.role, person.email].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  {/* Status — TODO: replace with real status field when workspace_members table exists */}
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: 'rgba(40,199,111,0.12)', color: '#28C76F', border: '1px solid rgba(40,199,111,0.2)' }}
                  >
                    Active
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Pending Invitations ──────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Pending Invitations
        </p>

        {pendingInvitations.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: 'rgba(255,255,255,0.28)' }}>
            No pending invitations.
          </p>
        ) : null}
      </div>
    </div>
  )
}
