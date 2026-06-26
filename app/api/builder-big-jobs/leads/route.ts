import { NextRequest, NextResponse } from 'next/server'
import { getDb, builderBigJobsLeads } from '@/lib/db'
import { desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function scoreBuilderLead(data: {
  planningStatus?: string | null
  jobTypes?: string[]
  minJobSizeBand?: string | null
  phone?: string | null
  postcodeArea?: string | null
  notes?: string | null
}): number {
  let score = 0

  if (data.planningStatus === 'approved') score += 30
  else if (data.planningStatus === 'not_required') score += 20
  else if (data.planningStatus === 'pending') score += 15

  const jobCount = data.jobTypes?.length ?? 0
  score += Math.min(jobCount * 5, 20)

  const sizeBandScores: Record<string, number> = {
    over_250k: 20,
    '50k_250k': 15,
    '10k_50k': 10,
    under_10k: 0,
  }
  score += sizeBandScores[data.minJobSizeBand ?? ''] ?? 0

  if (data.phone?.trim()) score += 10

  if (data.postcodeArea?.trim()) score += 5

  if (data.notes?.trim()) score += 5

  return Math.min(score, 100)
}

// POST — public: submit builder registration / lead
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  const companyName = String(body.companyName ?? '').trim()
  const contactName = String(body.contactName ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()

  if (!companyName || !contactName) {
    return NextResponse.json({ error: 'Company name and contact name are required' }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const phone = String(body.phone ?? '').trim() || null
  const postcodeArea = String(body.postcodeArea ?? '').trim() || null
  const jobTypes: string[] = Array.isArray(body.jobTypes) ? body.jobTypes.filter(Boolean) : []
  const minJobSizeBand = String(body.minJobSizeBand ?? '').trim() || null
  const maxTravelMiles = body.maxTravelMiles ? Number(body.maxTravelMiles) : null
  const preferredContact = String(body.preferredContact ?? '').trim() || null
  const notes = String(body.notes ?? '').trim() || null
  const planningStatus = String(body.planningStatus ?? '').trim() || null
  const estimatedValueBand = String(body.estimatedValueBand ?? '').trim() || null

  const leadScore = scoreBuilderLead({ planningStatus, jobTypes, minJobSizeBand, phone, postcodeArea, notes })

  try {
    const db = await getDb()
    const [row] = await db.insert(builderBigJobsLeads).values({
      source: 'intake_form',
      companyName,
      contactName,
      email,
      phone,
      postcodeArea,
      jobTypes: jobTypes.length > 0 ? jobTypes.join(', ') : null,
      minJobSizeBand,
      maxTravelMiles,
      preferredContact,
      notes,
      planningStatus,
      estimatedValueBand,
      leadScore,
      status: 'new',
    }).returning({ id: builderBigJobsLeads.id })

    return NextResponse.json({ ok: true, id: row.id, leadScore })
  } catch (err) {
    console.error('BBJ lead insert failed:', err)
    return NextResponse.json({ error: 'Could not save lead' }, { status: 500 })
  }
}

// GET — protected: list leads for internal OS view
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const leads = await db
    .select()
    .from(builderBigJobsLeads)
    .orderBy(desc(builderBigJobsLeads.leadScore), desc(builderBigJobsLeads.createdAt))
    .limit(500)

  return NextResponse.json(leads)
}
