/**
 * One-time operations setup for Alissa Howell.
 *
 * Purpose:
 * - Add/update Alissa as an operational team contact.
 * - Seed her initial Grant Office, Evidence, Pilot, and Founder Briefing tasks.
 *
 * Run:
 *   npx tsx scripts/add-alissa-ops.ts
 */
import 'dotenv/config'
import { and, eq } from 'drizzle-orm'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../db/schema'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const client = postgres(url, { max: 1 })
const db = drizzle(client, { schema })

const ALISSA = {
  name: 'Alissa',
  phone: '07700900003',
  email: 'Alissahowell06@gmail.com',
  company: 'Ultratech',
  role: 'Operations Administrator',
  category: 'Team' as const,
  avatarInitials: 'AL',
  notes:
    'Owns evidence register, grant tracker, pilot administration, weekly reporting, and operational task control.',
}

const now = new Date()
const fwd = (days: number) => new Date(now.getTime() + days * 86_400_000)

const tasks: Array<typeof schema.osTasks.$inferInsert> = [
  {
    title: 'Update Evidence Register with Quote, Booking, and Receptionist E2E results',
    assignedTo: 'Alissa',
    priority: 'High',
    status: 'Open',
    dueAt: fwd(1),
    notes: 'Add EV-013, EV-014, and EV-015 for the successful HTTP 201 app flow evidence.',
  },
  {
    title: 'Create Grant Tracker and record next funding opportunities',
    assignedTo: 'Alissa',
    priority: 'High',
    status: 'Open',
    dueAt: fwd(2),
    notes: 'Track programme, deadline, status, owner, evidence required, and next action.',
  },
  {
    title: 'Prepare weekly Founder Briefing Pack for George',
    assignedTo: 'Alissa',
    priority: 'Medium',
    status: 'Open',
    dueAt: fwd(3),
    notes: 'Summarise tasks, risks, grant deadlines, pilot progress, partner actions, and missing evidence.',
  },
  {
    title: 'Maintain Pilot Business Tracker for first 10–20 SMEs',
    assignedTo: 'Alissa',
    priority: 'Medium',
    status: 'Open',
    dueAt: fwd(5),
    notes: 'Track business name, sector, stage, contact, services, evidence, and next action.',
  },
]

async function upsertAlissa() {
  const existing = await db
    .select({ id: schema.osPeople.id })
    .from(schema.osPeople)
    .where(eq(schema.osPeople.name, ALISSA.name))
    .limit(1)

  if (existing[0]) {
    await db
      .update(schema.osPeople)
      .set({
        phone: ALISSA.phone,
        email: ALISSA.email,
        company: ALISSA.company,
        role: ALISSA.role,
        category: ALISSA.category,
        avatarInitials: ALISSA.avatarInitials,
        notes: ALISSA.notes,
        updatedAt: new Date(),
      })
      .where(eq(schema.osPeople.id, existing[0].id))
    console.log('✓ Updated Alissa contact')
    return
  }

  await db.insert(schema.osPeople).values(ALISSA)
  console.log('✓ Created Alissa contact')
}

async function ensureTask(task: typeof schema.osTasks.$inferInsert) {
  const existing = await db
    .select({ id: schema.osTasks.id })
    .from(schema.osTasks)
    .where(and(eq(schema.osTasks.title, task.title), eq(schema.osTasks.assignedTo, 'Alissa')))
    .limit(1)

  if (existing[0]) {
    console.log(`• Task already exists: ${task.title}`)
    return
  }

  await db.insert(schema.osTasks).values(task)
  console.log(`✓ Created task: ${task.title}`)
}

async function main() {
  await upsertAlissa()

  for (const task of tasks) {
    await ensureTask(task)
  }

  await client.end()
  console.log('✅ Alissa operations setup complete')
}

main().catch(async (error) => {
  console.error(error)
  await client.end()
  process.exit(1)
})
