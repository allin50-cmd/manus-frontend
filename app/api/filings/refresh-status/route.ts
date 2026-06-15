import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getThreshold } from '@/lib/compliance/thresholds'
import { FilingStatus } from '@prisma/client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  let filings
  try {
    filings = await db.filing.findMany({
      where: { status: { in: ['UPCOMING', 'AT_RISK'] } },
      include: { company: { select: { id: true, name: true } } },
    })
  } catch {
    return NextResponse.json({ error: 'Could not load filings' }, { status: 503 })
  }

  let overdueCount = 0
  let atRiskCount = 0
  let workItemsCreated = 0

  for (const filing of filings) {
    const dueDate = new Date(filing.dueDate)
    dueDate.setHours(0, 0, 0, 0)

    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / 86_400_000)
    const threshold = getThreshold(filing.category)

    let newStatus: FilingStatus | null = null

    if (daysUntilDue < 0) {
      if (filing.status !== 'OVERDUE') {
        newStatus = 'OVERDUE'
        overdueCount++
      }
    } else if (daysUntilDue <= threshold) {
      if (filing.status !== 'AT_RISK') {
        newStatus = 'AT_RISK'
        atRiskCount++
      }
    }

    if (newStatus !== null) {
      // Create a WorkItem ComplianceAlert if one doesn't exist yet
      let workItemId = filing.workItemId
      if (!workItemId) {
        try {
          const workItem = await db.workItem.create({
            data: {
              type: 'ComplianceAlert',
              title: filing.title,
              company: filing.company.name,
              owner: 'George',
              status: newStatus === 'OVERDUE' ? 'Escalated' : 'Action',
              priority: newStatus === 'OVERDUE' ? 'High' : 'Medium',
              dueDate: filing.dueDate,
            },
          })
          workItemId = workItem.id
          workItemsCreated++
        } catch {
          // Non-fatal: continue updating status even if WorkItem creation fails
        }
      }

      try {
        await db.filing.update({
          where: { id: filing.id },
          data: {
            status: newStatus,
            ...(workItemId && !filing.workItemId ? { workItemId } : {}),
          },
        })
      } catch {
        // Continue processing remaining filings
      }
    }
  }

  return NextResponse.json({
    processed: filings.length,
    overdueCount,
    atRiskCount,
    workItemsCreated,
  })
}
