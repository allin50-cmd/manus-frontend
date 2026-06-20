import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'
import { workItems, activityLogs, templates } from '../db/schema'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured')
  const client = postgres(url)
  const db = drizzle(client, { schema })

  console.log('Seeding work items...')

  const items = [
    {
      type: 'Partnership' as const,
      title: 'EasyEstimate partnership target',
      company: 'EasyEstimate',
      contactName: 'Paul Gosden',
      owner: 'Dagon',
      status: 'Captured' as const,
      priority: 'High' as const,
      nextAction: 'Send soft partnership outreach',
      decisionNeeded: false,
    },
    {
      type: 'Partnership' as const,
      title: 'Price A Job partnership target',
      company: 'Price A Job',
      contactName: 'Vasyl Mateychuk',
      owner: 'Dagon',
      status: 'Captured' as const,
      priority: 'High' as const,
      nextAction: 'Send soft integration pilot outreach',
      decisionNeeded: false,
    },
    {
      type: 'Partnership' as const,
      title: 'HBXL benchmark trial',
      company: 'HBXL',
      owner: 'George',
      status: 'Controlled' as const,
      priority: 'Medium' as const,
      nextAction: 'Run one Accuracy quote through HBXL trial',
      decisionNeeded: false,
    },
    {
      type: 'ConstructionLead' as const,
      title: 'Local builder test',
      company: 'Local Builder Example',
      owner: 'Dagon',
      status: 'Captured' as const,
      priority: 'Medium' as const,
      nextAction: 'Ask how many quotes they produce per month',
      decisionNeeded: false,
    },
    {
      type: 'ConstructionLead' as const,
      title: 'Accuracy Havelock Walk quote',
      company: 'Accuracy Developments Ltd',
      owner: 'Alissa',
      status: 'Controlled' as const,
      priority: 'High' as const,
      nextAction: 'Clean quote figures and prepare review',
      decisionNeeded: false,
    },
    {
      type: 'ComplianceAlert' as const,
      title: 'FineGuard alert workflow',
      company: 'FineGuard',
      owner: 'George',
      status: 'Captured' as const,
      priority: 'High' as const,
      nextAction: 'Define alert recipient workflow',
      decisionNeeded: false,
    },
  ]

  for (const item of items) {
    const [created] = await db.insert(workItems).values(item).returning()
    await db.insert(activityLogs).values({
      workItemId: created.id,
      person: 'System',
      eventType: 'Created',
      summary: `Work item "${created.title}" created`,
      newStatus: created.status,
    })
  }

  console.log('Seeding templates...')

  const templateRows = [
    {
      name: 'EasyEstimate outreach',
      useCase: 'Partnership outreach',
      body: `Hi Paul, we are testing a planning-lead-to-quote workflow for UK residential builders. We identify planning-approved jobs and help builders move from opportunity to priced quote faster. EasyEstimate looks like it could be a strong quoting engine in that chain. Would you be open to a short conversation about a referral, reseller or light integration pilot?`,
    },
    {
      name: 'Price A Job outreach',
      useCase: 'Partnership outreach',
      body: `Hi Vasyl, we are building a planning-to-quote workflow for UK residential builders. We already have planning-led opportunities and contractors who need faster pricing. Price A Job's estimating and compliance calculator suite looks like a strong fit. Would you be open to a short conversation about a referral or integration pilot?`,
    },
    {
      name: 'Builder outreach',
      useCase: 'Construction lead outreach',
      body: `We are testing a system that helps builders find suitable planning-approved jobs and turn them into quotes faster. We are not asking you to change how you work overnight. We would like to test one real job and see whether the workflow saves time.`,
    },
    {
      name: 'Architect outreach',
      useCase: 'Architect outreach',
      body: `We work with residential builders who need planning-approved job opportunities and faster quoting. We are testing a referral model with architects. Would you be open to a short conversation about how we could work together?`,
    },
    {
      name: 'Merchant outreach',
      useCase: 'Merchant outreach',
      body: `We are building a planning-to-quote workflow for UK residential builders. Builders in our network will be pricing live jobs. We would like to understand whether a merchant supply relationship could be built into that workflow.`,
    },
    {
      name: 'Handoff to George',
      useCase: 'Internal escalation',
      body: `Company:\nContact:\nWhat happened:\nWhat they need:\nCommercial opportunity:\nRisk:\nRecommended next step:\nDecision needed:\nFollow-up date:`,
    },
    {
      name: 'No-go checklist',
      useCase: 'Qualification',
      body: `- unclear IP ownership\n- no export/API path\n- founder unwilling to support integration\n- high support burden\n- pricing data cannot be verified\n- customer contracts prohibit resale/embedding\n- unresolved shareholder dispute\n- no GDPR/data-processing clarity`,
    },
    {
      name: 'Follow-up message',
      useCase: 'Follow-up',
      body: `Hi [name], following up on our conversation about [topic]. We are still interested and wanted to check whether you had any questions or whether the timing works for a next step.`,
    },
    {
      name: 'Call note format',
      useCase: 'Note taking',
      body: `Date:\nCalled:\nDuration:\nWhat they said:\nWhat we said:\nTheir concern:\nOur response:\nAgreed next step:\nFollow-up date:`,
    },
  ]

  await db.insert(templates).values(templateRows)

  console.log(`Seeded ${items.length} work items and ${templateRows.length} templates.`)
  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
